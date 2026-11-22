import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('hourlink.db');
  }
  return dbInstance;
}

export interface OfflineAction {
  id: string;
  actionType: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  payload: string;
  createdAt: number;
  retryCount: number;
  status: 'PENDING' | 'SYNCING' | 'FAILED';
}

/**
 * Khởi tạo Schema SQLite cục bộ cho nền tảng Offline-First
 */
export async function initOfflineDatabase(): Promise<void> {
  const db = getDatabase();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    -- Bảng lưu trữ ngoại tuyến Yêu cầu trợ giúp (Help Requests)
    CREATE TABLE IF NOT EXISTS cached_help_requests (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT,
      location TEXT,
      duration REAL,
      time_credit REAL,
      requester_name TEXT,
      category_name TEXT,
      raw_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- Bảng lưu trữ ngoại tuyến Lịch hẹn (Appointments)
    CREATE TABLE IF NOT EXISTS cached_appointments (
      id TEXT PRIMARY KEY,
      title TEXT,
      status TEXT,
      scheduled_at TEXT,
      location TEXT,
      provider_name TEXT,
      receiver_name TEXT,
      raw_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- Bảng lưu trữ ngoại tuyến Thông báo
    CREATE TABLE IF NOT EXISTS cached_notifications (
      id TEXT PRIMARY KEY,
      title TEXT,
      body TEXT,
      type TEXT,
      is_read INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      raw_json TEXT NOT NULL
    );

    -- Hàng đợi đồng bộ thao tác khi mất mạng (Offline Sync Queue)
    CREATE TABLE IF NOT EXISTS offline_sync_queue (
      id TEXT PRIMARY KEY,
      action_type TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      payload TEXT,
      created_at INTEGER NOT NULL,
      retry_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'PENDING'
    );
  `);
}

// ==========================================
// 1. HELP REQUESTS LOCAL STORAGE
// ==========================================

export async function saveHelpRequestsToLocal(items: any[]): Promise<void> {
  if (!items || !Array.isArray(items) || items.length === 0) return;
  const db = getDatabase();
  const now = Date.now();

  for (const item of items) {
    const id = String(item.id || item.helpRequestId || Math.random());
    const title = item.title || 'Yêu cầu không tên';
    const description = item.description || '';
    const status = item.status || 'OPEN';
    const location = item.location || '';
    const duration = Number(item.duration || 0);
    const timeCredit = Number(item.timeCredit || 0);
    const requesterName = item.requesterName || item.user?.fullName || '';
    const categoryName = item.categoryName || item.category?.name || '';
    const rawJson = JSON.stringify(item);

    await db.runAsync(
      `INSERT OR REPLACE INTO cached_help_requests 
       (id, title, description, status, location, duration, time_credit, requester_name, category_name, raw_json, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, title, description, status, location, duration, timeCredit, requesterName, categoryName, rawJson, now]
    );
  }
}

export async function getLocalHelpRequests(): Promise<any[]> {
  try {
    const db = getDatabase();
    const rows = await db.getAllAsync<{ raw_json: string }>(
      'SELECT raw_json FROM cached_help_requests ORDER BY updated_at DESC LIMIT 50'
    );
    return rows.map((r) => JSON.parse(r.raw_json));
  } catch (error) {
    console.warn('[OfflineDB] Lỗi lấy cached help requests:', error);
    return [];
  }
}

// ==========================================
// 2. APPOINTMENTS LOCAL STORAGE
// ==========================================

export async function saveAppointmentsToLocal(items: any[]): Promise<void> {
  if (!items || !Array.isArray(items) || items.length === 0) return;
  const db = getDatabase();
  const now = Date.now();

  for (const item of items) {
    const id = String(item.id || item.appointmentId || Math.random());
    const title = item.title || item.invitationTitle || 'Lịch hẹn';
    const status = item.status || 'PENDING';
    const scheduledAt = item.scheduledTime || item.scheduledAt || '';
    const location = item.location || '';
    const providerName = item.providerName || item.provider?.fullName || '';
    const receiverName = item.receiverName || item.receiver?.fullName || '';
    const rawJson = JSON.stringify(item);

    await db.runAsync(
      `INSERT OR REPLACE INTO cached_appointments
       (id, title, status, scheduled_at, location, provider_name, receiver_name, raw_json, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, title, status, scheduledAt, location, providerName, receiverName, rawJson, now]
    );
  }
}

export async function getLocalAppointments(): Promise<any[]> {
  try {
    const db = getDatabase();
    const rows = await db.getAllAsync<{ raw_json: string }>(
      'SELECT raw_json FROM cached_appointments ORDER BY updated_at DESC LIMIT 50'
    );
    return rows.map((r) => JSON.parse(r.raw_json));
  } catch (error) {
    console.warn('[OfflineDB] Lỗi lấy cached appointments:', error);
    return [];
  }
}

// ==========================================
// 3. NOTIFICATIONS LOCAL STORAGE
// ==========================================

export async function saveNotificationsToLocal(items: any[]): Promise<void> {
  if (!items || !Array.isArray(items) || items.length === 0) return;
  const db = getDatabase();

  for (const item of items) {
    const id = String(item.id || Math.random());
    const title = item.title || '';
    const body = item.body || item.message || '';
    const type = item.type || 'SYSTEM';
    const isRead = item.read || item.isRead ? 1 : 0;
    const createdAt = item.createdAt ? new Date(item.createdAt).getTime() : Date.now();
    const rawJson = JSON.stringify(item);

    await db.runAsync(
      `INSERT OR REPLACE INTO cached_notifications
       (id, title, body, type, is_read, created_at, raw_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, title, body, type, isRead, createdAt, rawJson]
    );
  }
}

export async function getLocalNotifications(): Promise<any[]> {
  try {
    const db = getDatabase();
    const rows = await db.getAllAsync<{ raw_json: string }>(
      'SELECT raw_json FROM cached_notifications ORDER BY created_at DESC LIMIT 50'
    );
    return rows.map((r) => JSON.parse(r.raw_json));
  } catch (error) {
    console.warn('[OfflineDB] Lỗi lấy cached notifications:', error);
    return [];
  }
}

// ==========================================
// 4. OFFLINE MUTATION SYNC QUEUE
// ==========================================

export async function enqueueOfflineAction(
  actionType: string,
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  payload: any
): Promise<string> {
  const db = getDatabase();
  const id = `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = Date.now();
  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);

  await db.runAsync(
    `INSERT INTO offline_sync_queue (id, action_type, endpoint, method, payload, created_at, retry_count, status)
     VALUES (?, ?, ?, ?, ?, ?, 0, 'PENDING')`,
    [id, actionType, endpoint, method, payloadStr, now]
  );
  return id;
}

export async function getPendingOfflineActions(): Promise<OfflineAction[]> {
  try {
    const db = getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT id, action_type as actionType, endpoint, method, payload, created_at as createdAt, retry_count as retryCount, status
       FROM offline_sync_queue
       WHERE status = 'PENDING'
       ORDER BY created_at ASC`
    );
    return rows;
  } catch (error) {
    console.warn('[OfflineDB] Lỗi lấy queue thao tác offline:', error);
    return [];
  }
}

export async function removeOfflineAction(id: string): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM offline_sync_queue WHERE id = ?', [id]);
}

export async function updateOfflineActionStatus(
  id: string,
  status: 'PENDING' | 'SYNCING' | 'FAILED',
  retryCount: number
): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    'UPDATE offline_sync_queue SET status = ?, retry_count = ? WHERE id = ?',
    [status, retryCount, id]
  );
}

/**
 * Thao tác kẹt ở trạng thái SYNCING (app bị tắt giữa lúc đồng bộ) sẽ không bao giờ được gửi lại
 * nếu không đưa về PENDING. Chỉ gọi khi KHÔNG có vòng đồng bộ nào đang chạy.
 */
export async function resetStaleSyncingActions(): Promise<void> {
  const db = getDatabase();
  await db.runAsync("UPDATE offline_sync_queue SET status = 'PENDING' WHERE status = 'SYNCING'");
}

export async function clearAllLocalCache(): Promise<void> {
  const db = getDatabase();
  await db.execAsync(`
    DELETE FROM cached_help_requests;
    DELETE FROM cached_appointments;
    DELETE FROM cached_notifications;
    DELETE FROM offline_sync_queue;
  `);
}
