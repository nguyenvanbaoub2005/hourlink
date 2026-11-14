import { useState, useEffect, useCallback } from 'react';
import {
  saveHelpRequestsToLocal,
  getLocalHelpRequests,
  saveAppointmentsToLocal,
  getLocalAppointments,
  saveNotificationsToLocal,
  getLocalNotifications,
  enqueueOfflineAction,
} from './database';
import { useNetwork } from './NetworkContext';

/**
 * Hook nạp danh sách Yêu cầu trợ giúp với cơ chế Offline-First:
 * - Khi có mạng: Gọi API máy chủ và lưu đệm vào SQLite cục bộ
 * - Khi mất mạng: Tự động chuyển sang nạp dữ liệu từ SQLite
 */
export function useOfflineHelpRequests(fetcher: () => Promise<any[]>) {
  const { isOffline } = useNetwork();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    if (isOffline) {
      // 1. Ngoại tuyến: Đọc từ SQLite
      const cached = await getLocalHelpRequests();
      setData(cached);
      setIsFromCache(true);
      setLoading(false);
      return;
    }

    try {
      // 2. Trực tuyến: Lấy từ máy chủ
      const remoteData = await fetcher();
      if (Array.isArray(remoteData) && remoteData.length > 0) {
        setData(remoteData);
        setIsFromCache(false);
        // Lưu trữ ngầm vào SQLite
        await saveHelpRequestsToLocal(remoteData);
      } else {
        // Fallback local nếu server trả rỗng
        const cached = await getLocalHelpRequests();
        if (cached.length > 0) {
          setData(cached);
          setIsFromCache(true);
        }
      }
    } catch (err) {
      console.warn('[useOfflineHelpRequests] Lỗi kết nối mạng -> Chuyển sang cache SQLite:', err);
      const cached = await getLocalHelpRequests();
      setData(cached);
      setIsFromCache(true);
    } finally {
      setLoading(false);
    }
  }, [isOffline, fetcher]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, isFromCache, refetch: loadData };
}

/**
 * Hook nạp Lịch hẹn với cơ chế Offline-First
 */
export function useOfflineAppointments(fetcher: () => Promise<any[]>) {
  const { isOffline } = useNetwork();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    if (isOffline) {
      const cached = await getLocalAppointments();
      setData(cached);
      setIsFromCache(true);
      setLoading(false);
      return;
    }

    try {
      const remoteData = await fetcher();
      if (Array.isArray(remoteData) && remoteData.length > 0) {
        setData(remoteData);
        setIsFromCache(false);
        await saveAppointmentsToLocal(remoteData);
      } else {
        const cached = await getLocalAppointments();
        if (cached.length > 0) {
          setData(cached);
          setIsFromCache(true);
        }
      }
    } catch (err) {
      console.warn('[useOfflineAppointments] Lỗi kết nối -> Dùng SQLite:', err);
      const cached = await getLocalAppointments();
      setData(cached);
      setIsFromCache(true);
    } finally {
      setLoading(false);
    }
  }, [isOffline, fetcher]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, isFromCache, refetch: loadData };
}

/**
 * Helper thực hiện mutation có hỗ trợ hàng đợi ngoại tuyến:
 * Nếu mất mạng, tự động đẩy vào SQLite queue để gửi sau
 */
export async function executeOfflineMutation({
  actionType,
  endpoint,
  method,
  payload,
  isOffline,
  onlineAction,
}: {
  actionType: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  payload: any;
  isOffline: boolean;
  onlineAction: () => Promise<any>;
}) {
  if (isOffline) {
    const queueId = await enqueueOfflineAction(actionType, endpoint, method, payload);
    return {
      success: true,
      isQueuedOffline: true,
      queueId,
      message: 'Đã lưu thao tác ngoại tuyến. Thao tác sẽ được tự động đồng bộ khi có kết nối mạng!',
    };
  }

  const result = await onlineAction();
  return {
    success: true,
    isQueuedOffline: false,
    data: result,
  };
}
