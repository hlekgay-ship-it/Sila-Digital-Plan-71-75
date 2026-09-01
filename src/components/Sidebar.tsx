import React from 'react';
import {
  LayoutDashboard,
  FileText,
  FilePlus,
  FileDiff,
  FileEdit,
  CheckCircle,
  Coins,
  Activity,
  BarChart3,
  Search,
  Users,
  Database,
  Building2,
  X,
  Code,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  Crown
} from 'lucide-react';
import { PlanType, ActiveView, UserItem } from '../types';
import { AuthService } from '../services/authService';
export type { ActiveView };

interface SidebarProps {
  currentView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onOpenBackup: () => void;
  onOpenAppsScript?: () => void;
  isOpenMobile: boolean;
  onToggleMobile: () => void;
  countsByType: Record<PlanType, number>;
  currentUser?: UserItem | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onOpenBackup,
  onOpenAppsScript,
  isOpenMobile,
  onToggleMobile,
  countsByType,
  currentUser,
  onLogout
}) => {
  const isAdmin = AuthService.isAdmin(currentUser);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-xs"
          onClick={onToggleMobile}
        />
      )}

      {/* Sidebar container with classic Emerald Green styling */}
      <aside
        id="sidebar"
        className={`fixed lg:static top-0 left-0 bottom-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out select-none shadow-xl ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand header with Emerald Green accent */}
        <div className="p-3.5 border-b border-slate-800 bg-gradient-to-r from-emerald-950 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 p-0.5 shadow-md flex-shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
                <Building2 className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-bold text-white leading-tight truncate flex items-center gap-1.5">
                <span>เทศบาลเมืองศิลา</span>
              </h1>
              <p className="text-[11px] text-emerald-400 font-semibold leading-tight truncate">
                ระบบแผนพัฒนาท้องถิ่น
              </p>
              <p className="text-[10px] text-slate-400 truncate leading-tight font-medium">
                (พ.ศ. 2571-2575)
              </p>
            </div>
          </div>
          <button
            onClick={onToggleMobile}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Theme color indicators */}
        <div className="px-3.5 pt-2.5 pb-2 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400">ธีมสี</span>
          <div className="flex items-center gap-1.5">
            <span title="ธีมน้ำตาล" className="w-4 h-4 rounded-full bg-[#8D5B4C] border border-white/20 inline-block opacity-60"></span>
            <span title="ธีมฟ้า/คราม" className="w-4 h-4 rounded-full bg-[#00ACC1] border border-white/20 inline-block opacity-60"></span>
            {/* Active Emerald Green theme */}
            <span title="ธีมเขียวเทศบาล (ใช้งานอยู่)" className="w-4.5 h-4.5 rounded-full bg-emerald-600 ring-2 ring-emerald-400 ring-offset-1 ring-offset-slate-900 border border-white/40 shadow-xs inline-block"></span>
            <span title="ธีมส้มแสด" className="w-4 h-4 rounded-full bg-[#E64A19] border border-white/20 inline-block opacity-60"></span>
            <span title="ธีมม่วงศิลา" className="w-4 h-4 rounded-full bg-[#5E35B1] border border-white/20 inline-block opacity-60"></span>
          </div>
        </div>

        {/* Navigation list divided into clear sections */}
        <div className="flex-1 overflow-y-auto py-2.5 px-2.5 space-y-3 custom-scrollbar">
          {/* SECTION 1: แผนพัฒนา 5 ปี (แบบ ผ.02) */}
          <div>
            <div className="px-2 py-0.5 text-[11px] font-bold tracking-wide text-emerald-400 uppercase flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                แผนพัฒนา 5 ปี (ผ.02)
              </span>
            </div>

            <div className="space-y-1 mt-1">
              <button
                onClick={() => {
                  onNavigate('dashboard');
                  if (isOpenMobile) onToggleMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  currentView === 'dashboard'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <LayoutDashboard className={`w-4 h-4 shrink-0 ${currentView === 'dashboard' ? 'text-white' : 'text-emerald-400'}`} />
                  <span className="truncate">แดชบอร์ดภาพรวมแผน</span>
                </div>
              </button>

              <button
                onClick={() => {
                  onNavigate('plan-first');
                  if (isOpenMobile) onToggleMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  currentView === 'plan-first'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className={`w-4 h-4 shrink-0 ${currentView === 'plan-first' ? 'text-white' : 'text-emerald-400'}`} />
                  <span className="truncate">แผนพัฒนาท้องถิ่น ฉบับแรก</span>
                </div>
                {countsByType['ฉบับแรก'] > 0 && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-emerald-400 border border-emerald-500/30">
                    {countsByType['ฉบับแรก']}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  onNavigate('plan-additional');
                  if (isOpenMobile) onToggleMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  currentView === 'plan-additional'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FilePlus className={`w-4 h-4 shrink-0 ${currentView === 'plan-additional' ? 'text-white' : 'text-emerald-400'}`} />
                  <span className="truncate">แผนพัฒนาท้องถิ่น ฉบับเพิ่มเติม</span>
                </div>
                {countsByType['เพิ่มเติม'] > 0 && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-emerald-400 border border-emerald-500/30">
                    {countsByType['เพิ่มเติม']}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  onNavigate('plan-change');
                  if (isOpenMobile) onToggleMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  currentView === 'plan-change'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileDiff className={`w-4 h-4 shrink-0 ${currentView === 'plan-change' ? 'text-white' : 'text-emerald-400'}`} />
                  <span className="truncate">แผนพัฒนาท้องถิ่น ฉบับเปลี่ยนแปลง</span>
                </div>
                {countsByType['เปลี่ยนแปลง'] > 0 && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-emerald-400 border border-emerald-500/30">
                    {countsByType['เปลี่ยนแปลง']}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  onNavigate('plan-edit');
                  if (isOpenMobile) onToggleMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  currentView === 'plan-edit'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileEdit className={`w-4 h-4 shrink-0 ${currentView === 'plan-edit' ? 'text-white' : 'text-emerald-400'}`} />
                  <span className="truncate">แผนพัฒนาท้องถิ่น ฉบับแก้ไข</span>
                </div>
                {countsByType['แก้ไข'] > 0 && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-emerald-400 border border-emerald-500/30">
                    {countsByType['แก้ไข']}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* CATEGORY 2: อนุมัติ & การเงิน */}
          <div className="pt-2 border-t border-slate-800">
            <div className="px-2 py-0.5 text-[11px] font-bold tracking-wide text-emerald-400 uppercase flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                อนุมัติ & งบประมาณ
              </span>
            </div>

            <div className="space-y-1 mt-1">
              <button
                onClick={() => {
                  onNavigate('approval');
                  if (isOpenMobile) onToggleMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  currentView === 'approval'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <CheckCircle className={`w-4 h-4 shrink-0 ${currentView === 'approval' ? 'text-white' : 'text-emerald-400'}`} />
                  <span className="truncate">อนุมัติประกาศใช้แผน</span>
                </div>
              </button>

              <button
                onClick={() => {
                  onNavigate('budget-approval');
                  if (isOpenMobile) onToggleMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  currentView === 'budget-approval'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Coins className={`w-4 h-4 shrink-0 ${currentView === 'budget-approval' ? 'text-white' : 'text-emerald-400'}`} />
                  <span className="truncate">อนุมัติงบประมาณ</span>
                </div>
              </button>

              <button
                onClick={() => {
                  onNavigate('tracking');
                  if (isOpenMobile) onToggleMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  currentView === 'tracking'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Activity className={`w-4 h-4 shrink-0 ${currentView === 'tracking' ? 'text-white' : 'text-emerald-400'}`} />
                  <span className="truncate">ระบบติดตามโครงการ</span>
                </div>
              </button>
            </div>
          </div>

          {/* CATEGORY 3: รายงาน & ค้นหา */}
          <div className="pt-2 border-t border-slate-800">
            <div className="px-2 py-0.5 text-[11px] font-bold tracking-wide text-slate-300 uppercase flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                รายงาน & การสืบค้น
              </span>
            </div>

            <div className="space-y-1 mt-1">
              <button
                onClick={() => {
                  onNavigate('report');
                  if (isOpenMobile) onToggleMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  currentView === 'report'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <BarChart3 className={`w-4 h-4 shrink-0 ${currentView === 'report' ? 'text-white' : 'text-emerald-400'}`} />
                  <span className="truncate">รายงานแผนพัฒนาท้องถิ่น</span>
                </div>
              </button>

              <button
                onClick={() => {
                  onNavigate('search');
                  if (isOpenMobile) onToggleMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  currentView === 'search'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Search className={`w-4 h-4 shrink-0 ${currentView === 'search' ? 'text-white' : 'text-emerald-400'}`} />
                  <span className="truncate">ระบบสืบค้นโครงการ</span>
                </div>
              </button>
            </div>
          </div>

          {/* CATEGORY 4: จัดการผู้ใช้งาน (แสดงตามสิทธิ์ RBAC) */}
          {isAdmin && (
            <div className="pt-2 border-t border-slate-800">
              <div className="px-2 py-0.5 text-[11px] font-bold tracking-wide text-rose-400 uppercase flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Crown className="w-3 h-3 text-amber-400" />
                  ผู้ดูแลระบบ & สิทธิ์
                </span>
              </div>

              <div className="space-y-1 mt-1">
                <button
                  onClick={() => {
                    onNavigate('users');
                    if (isOpenMobile) onToggleMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    currentView === 'users'
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Users className={`w-4 h-4 shrink-0 ${currentView === 'users' ? 'text-white' : 'text-amber-400'}`} />
                    <span className="truncate">จัดการผู้ใช้งานระบบ</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Footer Actions */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 space-y-2">
          {/* Active Logged In User Chip */}
          {currentUser && (
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0 font-bold text-xs">
                  {currentUser['ชื่อ-สกุล']?.substring(0, 1) || 'U'}
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-white truncate">
                    {currentUser['ชื่อ-สกุล']}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{currentUser['สิทธิ์การใช้งาน']}</span>
                  </div>
                </div>
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  title="ออกจากระบบ"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {onOpenAppsScript && (
            <button
              onClick={onOpenAppsScript}
              className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-emerald-400 bg-emerald-950/50 hover:bg-emerald-900/60 hover:text-white border border-emerald-800/50 transition cursor-pointer"
            >
              <Code className="w-3.5 h-3.5 text-emerald-400" />
              <span>Google Sheets & GAS Sync</span>
            </button>
          )}

          <button
            onClick={onOpenBackup}
            className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 hover:text-white border border-slate-800 transition cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>สำรอง / จัดการข้อมูล (IndexedDB)</span>
          </button>

          <div className="text-center text-[10px] text-slate-500 font-medium">
            เทศบาลเมืองศิลา © 2571-2575
          </div>
        </div>
      </aside>
    </>
  );
};
