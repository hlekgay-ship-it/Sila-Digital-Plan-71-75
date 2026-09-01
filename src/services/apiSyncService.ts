import { StorageService } from './storageService';
import { Project, PlanApproval, BudgetApproval, UserItem, ProjectTrackingItem } from '../types';

export interface GasConfig {
  webAppUrl: string;
  apiSecretToken: string;
  autoSync: boolean;
  lastSyncTime?: string;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  errorMessage?: string;
}

const KEY_GAS_CONFIG = 'sila_gas_config_v1';
export const DEFAULT_SECRET_TOKEN = 'SILA_SECRET_2571_2575';

let autoPushTimeout: any = null;

export const ApiSyncService = {
  getConfig(): GasConfig {
    try {
      const raw = localStorage.getItem(KEY_GAS_CONFIG);
      if (!raw) {
        return {
          webAppUrl: '',
          apiSecretToken: DEFAULT_SECRET_TOKEN,
          autoSync: true,
          status: 'disconnected'
        };
      }
      const parsed = JSON.parse(raw);
      if (!parsed.apiSecretToken || typeof parsed.apiSecretToken !== 'string') {
        parsed.apiSecretToken = DEFAULT_SECRET_TOKEN;
      } else {
        parsed.apiSecretToken = parsed.apiSecretToken.trim();
      }
      if (parsed.autoSync === undefined) {
        parsed.autoSync = true;
      }
      return parsed;
    } catch {
      return {
        webAppUrl: '',
        apiSecretToken: DEFAULT_SECRET_TOKEN,
        autoSync: true,
        status: 'disconnected'
      };
    }
  },

  saveConfig(config: Partial<GasConfig>): GasConfig {
    const current = this.getConfig();
    const updated = {
      ...current,
      ...config,
      webAppUrl: config.webAppUrl !== undefined ? config.webAppUrl.trim() : current.webAppUrl,
      apiSecretToken: config.apiSecretToken !== undefined ? config.apiSecretToken.trim() : (current.apiSecretToken || DEFAULT_SECRET_TOKEN)
    };
    localStorage.setItem(KEY_GAS_CONFIG, JSON.stringify(updated));
    return updated;
  },

  isConfigured(): boolean {
    const cfg = this.getConfig();
    return Boolean(cfg.webAppUrl && cfg.webAppUrl.startsWith('http'));
  },

  isAutoSyncEnabled(): boolean {
    const cfg = this.getConfig();
    return Boolean(cfg.webAppUrl && cfg.webAppUrl.startsWith('http') && cfg.autoSync !== false);
  },

  // Background auto push whenever data changes
  triggerAutoPush(onDone?: (success: boolean) => void) {
    if (!this.isAutoSyncEnabled()) return;
    if (autoPushTimeout) clearTimeout(autoPushTimeout);
    autoPushTimeout = setTimeout(async () => {
      try {
        const res = await this.pushAllToSheets();
        if (onDone) onDone(res.success);
      } catch (err) {
        console.error('Auto push failed:', err);
        if (onDone) onDone(false);
      }
    }, 1200);
  },

  async testConnection(webAppUrl?: string, token?: string): Promise<{ success: boolean; message: string }> {
    const rawUrl = webAppUrl !== undefined ? webAppUrl : this.getConfig().webAppUrl;
    let url = (rawUrl || '').trim();
    const rawToken = token !== undefined ? token : this.getConfig().apiSecretToken;
    const secret = (rawToken && rawToken.trim() !== '') ? rawToken.trim() : DEFAULT_SECRET_TOKEN;

    if (!url || !url.startsWith('http')) {
      return { success: false, message: 'กรุณาระบุ URL ของ Google Apps Script Web App' };
    }

    // Auto fix if user pasted /edit or /dev instead of /exec
    if (url.includes('/edit')) {
      url = url.split('/edit')[0] + '/exec';
    } else if (url.includes('/dev')) {
      url = url.split('/dev')[0] + '/exec';
    }

    try {
      const reqUrl = `${url}?action=healthCheck&token=${encodeURIComponent(secret)}&t=${Date.now()}`;
      const res = await fetch(reqUrl, { method: 'GET' });
      
      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        if (text.includes('<!DOCTYPE html>') || text.includes('<html') || text.includes('accounts.google.com')) {
          throw new Error('Google Apps Script ส่งกลับเป็นหน้าล็อกอิน กรุณาตั้งค่า Deploy ให้ "ผู้มีสิทธิ์เข้าถึง (Who has access)" เป็น "ทุกคน (Anyone)"');
        }
        throw new Error(`Google Apps Script ส่งผลลัพธ์ไม่ถูกต้อง (ไม่ใช่ JSON): ${text.substring(0, 100)}...`);
      }

      if (data.status === 'ok' || data.success) {
        this.saveConfig({ webAppUrl: url, apiSecretToken: secret, status: 'connected', errorMessage: undefined });
        return { success: true, message: data.message || 'เชื่อมต่อกับ Google Sheets สำเร็จ' };
      } else {
        throw new Error(data.message || 'การตรวจสอบล้มเหลว (Token ไม่ถูกต้อง)');
      }
    } catch (err: any) {
      const msg = err.message || 'ไม่สามารถเชื่อมต่อ Google Apps Script ได้';
      this.saveConfig({ status: 'error', errorMessage: msg });
      return { success: false, message: msg };
    }
  },

  // Pull all data from Google Sheets into local cache
  async pullFromSheets(): Promise<{ success: boolean; message: string; count?: number }> {
    const cfg = this.getConfig();
    let url = (cfg.webAppUrl || '').trim();
    const secret = (cfg.apiSecretToken || DEFAULT_SECRET_TOKEN).trim();

    if (!url) {
      return { success: false, message: 'ยังไม่ได้ตั้งค่า Google Apps Script Web App URL' };
    }

    if (url.includes('/edit')) url = url.split('/edit')[0] + '/exec';
    if (url.includes('/dev')) url = url.split('/dev')[0] + '/exec';

    try {
      this.saveConfig({ status: 'syncing' });
      const reqUrl = `${url}?action=getAllData&token=${encodeURIComponent(secret)}&t=${Date.now()}`;
      const res = await fetch(reqUrl);
      const text = await res.text();
      let payload: any;
      try {
        payload = JSON.parse(text);
      } catch (e) {
        if (text.includes('<html') || text.includes('accounts.google.com')) {
          throw new Error('Google Apps Script ตอบกลับเป็นหน้าล็อกอิน กรุณาตั้งค่า Deploy ให้ผู้มีสิทธิ์เข้าถึงเป็น "ทุกคน (Anyone)"');
        }
        throw new Error('รูปแบบข้อมูลจาก Google Apps Script ไม่ถูกต้อง');
      }

      if (!payload.success && payload.status !== 'ok') {
        throw new Error(payload.message || 'ดึงข้อมูลไม่สำเร็จ');
      }

      const remoteData = payload.data || payload;
      let count = 0;
      if (remoteData) {
        // Normalize projects
        if (Array.isArray(remoteData.projects)) {
          remoteData.projects = remoteData.projects.map((p: any) => ({
            ...p,
            ID: Number(p.ID) || p.ID,
            'ปี พ.ศ.': Number(p['ปี พ.ศ.']) || 2571,
            'งบประมาณ 2571': Number(p['งบประมาณ 2571']) || 0,
            'งบประมาณ 2572': Number(p['งบประมาณ 2572']) || 0,
            'งบประมาณ 2573': Number(p['งบประมาณ 2573']) || 0,
            'งบประมาณ 2574': Number(p['งบประมาณ 2574']) || 0,
            'งบประมาณ 2575': Number(p['งบประมาณ 2575']) || 0,
            'ผลการเบิกจ่าย (บาท)': Number(p['ผลการเบิกจ่าย (บาท)']) || 0,
            'ความก้าวหน้า (ร้อยละ)': Number(p['ความก้าวหน้า (ร้อยละ)']) || 0
          }));
          count = remoteData.projects.length;
        }
        StorageService.importAllData(JSON.stringify(remoteData));
      }

      const now = new Date().toISOString();
      this.saveConfig({ status: 'connected', lastSyncTime: now, errorMessage: undefined });
      return {
        success: true,
        message: `ซิงค์ข้อมูลจาก Google Sheets เรียบร้อยแล้ว (พบ ${count} โครงการ)`,
        count
      };
    } catch (err: any) {
      const msg = err.message || 'ไม่สามารถดึงข้อมูลจาก Google Sheets ได้';
      this.saveConfig({ status: 'error', errorMessage: msg });
      return { success: false, message: msg };
    }
  },

  // Push all local data up to Google Sheets
  async pushAllToSheets(): Promise<{ success: boolean; message: string }> {
    const cfg = this.getConfig();
    let url = (cfg.webAppUrl || '').trim();
    const secret = (cfg.apiSecretToken || DEFAULT_SECRET_TOKEN).trim();

    if (!url) {
      return { success: false, message: 'ยังไม่ได้ตั้งค่า Google Apps Script Web App URL' };
    }

    if (url.includes('/edit')) url = url.split('/edit')[0] + '/exec';
    if (url.includes('/dev')) url = url.split('/dev')[0] + '/exec';

    try {
      this.saveConfig({ status: 'syncing' });
      const allData = StorageService.exportAllData();
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'syncAllData',
          token: secret,
          data: allData
        })
      });

      const text = await res.text();
      let payload: any;
      try {
        payload = JSON.parse(text);
      } catch (e) {
        if (text.includes('<html') || text.includes('accounts.google.com')) {
          throw new Error('Google Apps Script ตอบกลับเป็นหน้าล็อกอิน กรุณาตั้งค่า Deploy ให้ผู้มีสิทธิ์เข้าถึงเป็น "ทุกคน (Anyone)"');
        }
        throw new Error('รูปแบบข้อมูลตอบกลับไม่ถูกต้อง');
      }

      if (!payload.success && payload.status !== 'ok') {
        throw new Error(payload.message || 'บันทึกขึ้น Google Sheets ไม่สำเร็จ');
      }

      const now = new Date().toISOString();
      this.saveConfig({ status: 'connected', lastSyncTime: now, errorMessage: undefined });
      return { success: true, message: 'อัปโหลดข้อมูลทั้งหมดขึ้น Google Sheets สำเร็จ' };
    } catch (err: any) {
      const msg = err.message || 'ไม่สามารถส่งข้อมูลไปยัง Google Sheets ได้';
      this.saveConfig({ status: 'error', errorMessage: msg });
      return { success: false, message: msg };
    }
  }
};
