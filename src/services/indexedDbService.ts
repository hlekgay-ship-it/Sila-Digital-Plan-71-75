import { StorageService } from './storageService';

export interface BackupSnapshot {
  id: string;
  timestamp: string;
  createdAtText: string;
  projectCount: number;
  approvalCount: number;
  trackingCount: number;
  userCount: number;
  totalBudget: number;
  reason: string;
  data: any;
}

const DB_NAME = 'SilaPlan_BackupsDB';
const DB_VERSION = 1;
const STORE_NAME = 'snapshots';
const LAST_MANUAL_EXPORT_KEY = 'sila_last_manual_export_date';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const IndexedDbBackupService = {
  // Save automated snapshot into IndexedDB
  async createSnapshot(reason: string = 'Auto-Backup'): Promise<BackupSnapshot> {
    const db = await openDB();
    const allData = StorageService.exportAllData();
    const now = new Date();
    const id = `snap_${now.getTime()}`;
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
    const createdAtText = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear() + 543} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    let totalBudget = 0;
    (allData.projects || []).forEach((p: any) => {
      totalBudget +=
        (Number(p['งบประมาณ 2571']) || 0) +
        (Number(p['งบประมาณ 2572']) || 0) +
        (Number(p['งบประมาณ 2573']) || 0) +
        (Number(p['งบประมาณ 2574']) || 0) +
        (Number(p['งบประมาณ 2575']) || 0);
    });

    const snapshot: BackupSnapshot = {
      id,
      timestamp: now.toISOString(),
      createdAtText,
      projectCount: (allData.projects || []).length,
      approvalCount: (allData.approvals || []).length,
      trackingCount: (allData.projectTrackings || []).length,
      userCount: (allData.users || []).length,
      totalBudget,
      reason,
      data: allData
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(snapshot);
      req.onsuccess = () => resolve(snapshot);
      req.onerror = () => reject(req.error);
    });
  },

  // List all snapshots sorted latest first
  async getSnapshots(): Promise<BackupSnapshot[]> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const list = (req.result as BackupSnapshot[]) || [];
          list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          resolve(list);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  },

  // Restore snapshot by id
  async restoreSnapshot(id: string): Promise<boolean> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        const snap = req.result as BackupSnapshot;
        if (!snap || !snap.data) {
          resolve(false);
          return;
        }
        const success = StorageService.importAllData(JSON.stringify(snap.data));
        resolve(success);
      };
      req.onerror = () => reject(req.error);
    });
  },

  // Delete snapshot by id
  async deleteSnapshot(id: string): Promise<boolean> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  },

  // Record manual export timestamp
  recordManualExport(): void {
    localStorage.setItem(LAST_MANUAL_EXPORT_KEY, new Date().toISOString());
  },

  // Check if manual backup reminder is needed (> 7 days)
  shouldRemindManualBackup(): boolean {
    const lastExport = localStorage.getItem(LAST_MANUAL_EXPORT_KEY);
    if (!lastExport) return true;
    const diffMs = Date.now() - new Date(lastExport).getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= 7;
  }
};
