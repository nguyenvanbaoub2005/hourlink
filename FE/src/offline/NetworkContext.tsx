import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { syncManager } from './syncManager';
import { initOfflineDatabase, getPendingOfflineActions } from './database';

interface NetworkContextType {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  isOffline: boolean;
  connectionType: string;
  isSyncing: boolean;
  pendingSyncCount: number;
  syncNow: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isInternetReachable: true,
  isOffline: false,
  connectionType: 'unknown',
  isSyncing: false,
  pendingSyncCount: 0,
  syncNow: async () => {},
});

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const prevOfflineRef = useRef<boolean>(false);

  const isOffline = isConnected === false || isInternetReachable === false;

  useEffect(() => {
    // 1. Khởi tạo Database SQLite Offline
    initOfflineDatabase()
      .then(() => getPendingOfflineActions())
      .then((pending) => setPendingSyncCount(pending.length))
      .catch((err) => console.warn('[NetworkProvider] Khởi tạo DB thất bại:', err));

    // 2. Lắng nghe trạng thái hàng đợi Sync
    const unsubscribeSync = syncManager.subscribe((syncing, pending) => {
      setIsSyncing(syncing);
      setPendingSyncCount(pending);
    });

    // 3. Lắng nghe sự thay đổi mạng
    const unsubscribeNet = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected);
      setIsInternetReachable(state.isInternetReachable);
      setConnectionType(state.type);

      const currentlyOffline = state.isConnected === false || state.isInternetReachable === false;

      // Khi mạng từ MẤT sang CÓ -> Tự động kích hoạt đồng bộ hàng đợi
      if (prevOfflineRef.current && !currentlyOffline) {
        console.log('[NetworkProvider] Internet đã kết nối lại -> Tự động đồng bộ...');
        syncManager.syncPendingActions();
      }

      prevOfflineRef.current = currentlyOffline;
    });

    return () => {
      unsubscribeSync();
      unsubscribeNet();
    };
  }, []);

  const syncNow = async () => {
    if (!isOffline) {
      await syncManager.syncPendingActions();
    }
  };

  return (
    <NetworkContext.Provider
      value={{
        isConnected,
        isInternetReachable,
        isOffline,
        connectionType,
        isSyncing,
        pendingSyncCount,
        syncNow,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);
