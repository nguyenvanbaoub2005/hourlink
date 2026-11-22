import api from '@api/axiosInstance';
import {
  getPendingOfflineActions,
  removeOfflineAction,
  resetStaleSyncingActions,
  updateOfflineActionStatus,
  type OfflineAction,
} from './database';
import { resolveSyncOutcome } from './queuePolicy';

type SyncListener = (isSyncing: boolean, pendingCount: number) => void;

class SyncManager {
  private isSyncing = false;
  private listeners: Set<SyncListener> = new Set();

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(pendingCount: number) {
    this.listeners.forEach((listener) => listener(this.isSyncing, pendingCount));
  }

  /**
   * Đồng bộ toàn bộ hàng đợi thao tác ngoại tuyến lên máy chủ
   */
  public async syncPendingActions(): Promise<{ successful: number; failed: number }> {
    if (this.isSyncing) return { successful: 0, failed: 0 };
    this.isSyncing = true;

    let successful = 0;
    let failed = 0;

    try {
      await resetStaleSyncingActions();
      const pending = await getPendingOfflineActions();
      this.notify(pending.length);

      for (const action of pending) {
        try {
          await updateOfflineActionStatus(action.id, 'SYNCING', action.retryCount);

          let payloadData = null;
          if (action.payload) {
            try {
              payloadData = JSON.parse(action.payload);
            } catch {
              payloadData = action.payload;
            }
          }

          await api({
            url: action.endpoint,
            method: action.method,
            data: payloadData,
          });

          // Đồng bộ thành công -> Xóa khỏi hàng đợi local
          await removeOfflineAction(action.id);
          successful++;
        } catch (error: any) {
          failed++;
          const outcome = resolveSyncOutcome(action.retryCount || 0, error);
          await updateOfflineActionStatus(action.id, outcome.status, outcome.retryCount);
          console.warn(
            `[SyncManager] Thao tác offline ${action.id} → ${outcome.status} (lần ${outcome.retryCount}):`,
            error?.message,
          );
          // Đang mất mạng thật: dừng, giữ nguyên thứ tự các thao tác còn lại cho lần sau
          if (outcome.stopSync) break;
        }
      }
    } finally {
      this.isSyncing = false;
      const remaining = await getPendingOfflineActions();
      this.notify(remaining.length);
    }

    return { successful, failed };
  }
}

export const syncManager = new SyncManager();
