import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  X,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  History,
  Trash2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { StorageService } from '../services/storageService';
import { IndexedDbBackupService, BackupSnapshot } from '../services/indexedDbService';

interface BackupModalProps {
  onClose: () => void;
  onRefreshAll: () => void;
  onShowToast: (title: string, msg?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  onClose,
  onRefreshAll,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'snapshots' | 'json' | 'reset'>('snapshots');
  const [importJson, setImportJson] = useState('');
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>([]);
  const [isLoadingSnapshots, setIsLoadingSnapshots] = useState(false);

  const loadSnapshots = async () => {
    setIsLoadingSnapshots(true);
    try {
      const list = await IndexedDbBackupService.getSnapshots();
      setSnapshots(list);
    } catch {
      setSnapshots([]);
    } finally {
      setIsLoadingSnapshots(false);
    }
  };

  useEffect(() => {
    loadSnapshots();
  }, []);

  const handleCreateSnapshot = async () => {
    try {
      const snap = await IndexedDbBackupService.createSnapshot('ผู้ใช้สั่งสำรองข้อมูลด้วยตนเอง');
      await loadSnapshots();
      onShowToast('สำรองข้อมูลเรียบร้อย', `สร้างจุดสำรองข้อมูล (${snap.createdAtText}) ใน IndexedDB สำเร็จ`);
    } catch (err: any) {
      onShowToast('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถสร้างจุดสำรองได้', 'error');
    }
  };

  const handleRestoreSnapshot = async (snap: BackupSnapshot) => {
    if (
      confirm(
        `คุณต้องการกู้คืนข้อมูลระบบย้อนหลังกลับไปยังจุดสำรองวันที่ "${snap.createdAtText}" ใช่หรือไม่?\nข้อมูลโครงการ: ${snap.projectCount} รายการ, งบประมาณ: ${snap.totalBudget.toLocaleString()} บาท`
      )
    ) {
      try {
        const ok = await IndexedDbBackupService.restoreSnapshot(snap.id);
        if (ok) {
          onShowToast('กู้คืนข้อมูลสำเร็จ', `กู้คืนข้อมูลจากจุดสำรอง ${snap.createdAtText} เรียบร้อย`);
          onRefreshAll();
          onClose();
        } else {
          onShowToast('กู้คืนข้อมูลไม่สำเร็จ', 'ไม่พบชุดข้อมูลสำรองที่สมบูรณ์', 'error');
        }
      } catch (err: any) {
        onShowToast('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถกู้คืนข้อมูลได้', 'error');
      }
    }
  };

  const handleDeleteSnapshot = async (id: string) => {
    if (confirm('คุณต้องการลบจุดสำรองข้อมูลนี้หรือไม่?')) {
      await IndexedDbBackupService.deleteSnapshot(id);
      await loadSnapshots();
      onShowToast('ลบจุดสำรองข้อมูลสำเร็จ', 'ลบประวัติการสำรองออกจาก IndexedDB แล้ว', 'info');
    }
  };

  const handleExport = () => {
    const data = StorageService.exportAllData();
    const str = JSON.stringify(data, null, 2);
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sila_plan_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    IndexedDbBackupService.recordManualExport();
    onShowToast('ส่งออกข้อมูลสำเร็จ', 'ดาวน์โหลดไฟล์สำรองข้อมูล JSON เรียบร้อย');
  };

  const handleImport = () => {
    if (!importJson.trim()) {
      alert('กรุณาวางข้อความ JSON ข้อมูลสำรอง');
      return;
    }
    const success = StorageService.importAllData(importJson);
    if (success) {
      // Auto snapshot right after import
      IndexedDbBackupService.createSnapshot('นำเข้าข้อมูลผ่านไฟล์ JSON');
      onShowToast('นำเข้าข้อมูลสำเร็จ', 'ข้อมูลระบบได้รับการอัปเดตเรียบร้อย');
      onRefreshAll();
      onClose();
    } else {
      onShowToast('นำเข้าข้อมูลล้มเหลว', 'รูปแบบ JSON ไม่ถูกต้อง', 'error');
    }
  };

  const handleReset = () => {
    if (
      confirm(
        'คุณแน่ใจหรือไม่ว่าต้องการคืนค่าข้อมูลเริ่มต้นของเทศบาลเมืองศิลา? ข้อมูลที่แก้ไขล่าสุดจะถูกแทนที่ด้วยข้อมูลชุดเริ่มต้น'
      )
    ) {
      StorageService.resetToDefaultData();
      IndexedDbBackupService.createSnapshot('คืนค่าข้อมูลเริ่มต้นเทศบาลเมืองศิลา');
      onShowToast('คืนค่าข้อมูลเริ่มต้นเรียบร้อย', 'โหลดข้อมูลตัวอย่างเทศบาลเมืองศิลาครบถ้วน');
      onRefreshAll();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-3 backdrop-blur-2xs">
      <div className="bg-white rounded-2xl max-w-xl w-full p-4 sm:p-5 shadow-2xl border border-emerald-100 animate-in fade-in zoom-in-95 duration-150 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#006853] text-white flex items-center justify-center shadow-md">
              <Database className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">สำรองและจัดการความปลอดภัยข้อมูล</h3>
              <p className="text-[10.5px] text-[#006853] font-semibold">
                IndexedDB Auto-Snapshot & JSON Data Manager
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl mb-3">
          <button
            type="button"
            onClick={() => setActiveTab('snapshots')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'snapshots'
                ? 'bg-[#006853] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-emerald-200" />
            <span>จุดสำรองอัตโนมัติ (Snapshots)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('json')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'json'
                ? 'bg-[#006853] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileJson className="w-3.5 h-3.5 text-emerald-200" />
            <span>นำเข้า / ส่งออก JSON</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reset')}
            className={`py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'reset'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-rose-600 hover:text-rose-900'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>รีเซ็ตข้อมูล</span>
          </button>
        </div>

        {/* Tab 1: IndexedDB Snapshots */}
        {activeTab === 'snapshots' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#10B981]/40 flex items-center justify-between gap-3 shadow-2xs">
              <div>
                <div className="font-bold text-[#004d3d] text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#006853]" />
                  <span>ระบบบันทึกจุดสำรองอัตโนมัติในเบราว์เซอร์ (IndexedDB)</span>
                </div>
                <div className="text-[11px] text-[#006853]/90 mt-0.5">
                  ระบบจะบันทึกสถานะข้อมูลทุกครั้งที่มีการแก้ไข/อนุมัติ สามารถกู้คืนย้อนหลังได้ตลอดเวลา
                </div>
              </div>
              <button
                onClick={handleCreateSnapshot}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#00A878] hover:bg-[#00BD87] active:bg-[#00966B] text-white font-bold transition shadow-xs flex-shrink-0 text-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-100" />
                <span>สำรองทันที</span>
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto custom-scrollbar space-y-2 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
              {isLoadingSnapshots ? (
                <div className="text-center py-6 text-slate-400">กำลังโหลดจุดสำรองข้อมูล...</div>
              ) : snapshots.length === 0 ? (
                <div className="text-center py-6 text-slate-400">ยังไม่มีจุดสำรองข้อมูลใน IndexedDB</div>
              ) : (
                snapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-[#00A878] shadow-2xs flex items-center justify-between gap-2 transition"
                  >
                    <div>
                      <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>{snap.createdAtText}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-[#006853] border border-emerald-200 font-medium">
                          {snap.reason}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {snap.projectCount} โครงการ • งบรวม {snap.totalBudget.toLocaleString()} บาท • {snap.approvalCount} รอบอนุมัติ
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleRestoreSnapshot(snap)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-[#006853] text-[#006853] hover:text-white border border-emerald-200 hover:border-[#006853] font-bold text-[11px] transition cursor-pointer"
                      >
                        กู้คืน
                      </button>
                      <button
                        onClick={() => handleDeleteSnapshot(snap.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                        title="ลบจุดสำรองนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: JSON Import / Export */}
        {activeTab === 'json' && (
          <div className="space-y-3">
            {/* Export section */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-slate-800 text-xs">ส่งออกไฟล์สำรอง (Export JSON)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  ดาวน์โหลดไฟล์ .json เก็บไว้ในเครื่องคอมพิวเตอร์เพื่อความปลอดภัยสูงสุด
                </div>
              </div>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#00A878] hover:bg-[#00BD87] active:bg-[#00966B] text-white font-bold transition shadow-xs flex-shrink-0 text-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-100" />
                <span>ดาวน์โหลด JSON</span>
              </button>
            </div>

            {/* Import section */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800 text-xs">นำเข้าข้อมูลสำรอง (Import JSON)</div>
              <textarea
                rows={3}
                placeholder="วางข้อความ JSON ที่สำรองไว้ที่นี่..."
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-[11px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006853]/20 focus:border-[#006853]"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleImport}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#00A878] hover:bg-[#00BD87] active:bg-[#00966B] text-white font-bold transition shadow-xs text-xs cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-100" />
                  <span>นำเข้าข้อมูล</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Reset Data */}
        {activeTab === 'reset' && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-rose-900 text-sm">คืนค่าข้อมูลเริ่มต้น (Reset to Default)</div>
                <div className="text-rose-700 text-[11px] mt-1 leading-relaxed">
                  การดำเนินการนี้จะรีเซ็ตข้อมูลโครงการ แผนอนุมัติ ข้อบัญญัติงบประมาณ และผู้ใช้งาน กลับสู่ค่าเริ่มต้นของเทศบาลเมืองศิลา (ระบบจะสร้างจุดสำรองข้อมูลอัตโนมัติไว้ให้ก่อนรีเซ็ต)
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow-md text-xs cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>ยืนยันคืนค่าข้อมูลเริ่มต้น</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end mt-3.5">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition text-xs cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};

