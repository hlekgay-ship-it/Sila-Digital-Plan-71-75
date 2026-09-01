import React from 'react';
import {
  Search,
  FolderOpen,
  RefreshCw,
  X,
  Printer
} from 'lucide-react';
import { YEARS } from '../data/initialData';
import { ExportDropdown } from './ExportDropdown';

export interface StandardFilterBarProps {
  // บรรทัดที่ 1: ปีงบประมาณ & คำอธิบาย
  selectedYear: string;
  onYearChange: (year: string) => void;
  yearOptions?: number[];
  allYearsLabel?: string; // เช่น 'ทั้งหมด (2571-2575)' หรือ 'ทุกปี (2571-2575)'
  description?: string | React.ReactNode;
  extraLine1Left?: React.ReactNode;
  extraLine1Right?: React.ReactNode;

  // บรรทัดที่ 2: ฟิลด์ตัวกรอง 4 ช่อง (Grid 4 คอลัมน์)
  // ช่อง 1: ประเด็นการพัฒนา (หรือฟิลด์แบบ Dropdown แรก)
  issueLabel?: string;
  issueValue?: string;
  onIssueChange?: (val: string) => void;
  issueOptions?: string[];
  issueAllLabel?: string;
  customSlot1?: React.ReactNode;

  // ช่อง 2: ผู้รับผิดชอบ (หรือฟิลด์แบบ Dropdown สอง)
  departmentLabel?: string;
  departmentValue?: string;
  onDepartmentChange?: (val: string) => void;
  departmentOptions?: string[];
  departmentAllLabel?: string;
  customSlot2?: React.ReactNode;

  // ช่อง 3: ค้นหาชื่อโครงการ (Text Input พร้อมไอคอนแว่นขยายและปุ่ม X)
  searchLabel?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  customSlot3?: React.ReactNode;

  // ช่อง 4: งบประมาณ (บาท)
  budgetLabel?: string;
  budgetValue?: string;
  onBudgetChange?: (val: string) => void;
  budgetPlaceholder?: string;
  customSlot4?: React.ReactNode;

  // บรรทัดที่ 3: แถบควบคุมและปุ่มกด (Single Row Action Bar)
  onSearch?: () => void;
  onShowAll?: () => void;
  onReset?: () => void;
  onExportExcel?: () => void;
  onExportCsv?: () => void;
  onExportPdf?: () => void;
  exportItemsCount?: number;
  onPrint?: () => void;
  printLabel?: string;
  actionButton?: React.ReactNode;
  extraControlsCenter?: React.ReactNode;
  extraControlsRight?: React.ReactNode;
  customActionBar?: React.ReactNode;
  className?: string;
}

export const StandardFilterBar: React.FC<StandardFilterBarProps> = ({
  selectedYear,
  onYearChange,
  yearOptions = YEARS,
  allYearsLabel = 'ทั้งหมด (2571-2575)',
  description,
  extraLine1Left,
  extraLine1Right,

  issueLabel = 'ประเด็นการพัฒนา',
  issueValue = 'ทั้งหมด',
  onIssueChange,
  issueOptions = [],
  issueAllLabel = '-- ทุกประเด็นการพัฒนา --',
  customSlot1,

  departmentLabel = 'ผู้รับผิดชอบ',
  departmentValue = 'ทั้งหมด',
  onDepartmentChange,
  departmentOptions = [],
  departmentAllLabel = '-- ทุกหน่วยงาน --',
  customSlot2,

  searchLabel = 'ค้นหาชื่อโครงการ',
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'ค้นหาชื่อโครงการ...',
  customSlot3,

  budgetLabel = 'งบประมาณ (บาท)',
  budgetValue = '',
  onBudgetChange,
  budgetPlaceholder = 'ระบุจำนวนเงิน...',
  customSlot4,

  onSearch,
  onShowAll,
  onReset,
  onExportExcel,
  onExportCsv,
  onExportPdf,
  exportItemsCount,
  onPrint,
  printLabel = 'พิมพ์รายงาน',
  actionButton,
  extraControlsCenter,
  extraControlsRight,
  customActionBar,
  className = ''
}) => {
  const hasExport = Boolean(onExportExcel || onExportCsv || onExportPdf);

  return (
    <div className={`space-y-0 ${className}`}>
      {/* ========================================================================= */}
      {/* บรรทัดที่ 1: ปีงบประมาณ & คำอธิบาย (Sub-header Strip)                      */}
      {/* ========================================================================= */}
      <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap text-xs">
        {/* ฝั่งซ้าย: Dropdown เลือกปีงบประมาณ */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">ปีงบประมาณ:</span>
            <select
              value={selectedYear}
              onChange={(e) => onYearChange(e.target.value)}
              className="text-xs bg-white border border-slate-300 text-slate-800 font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer"
            >
              {allYearsLabel && <option value="ทั้งหมด">{allYearsLabel}</option>}
              {yearOptions.map((y) => (
                <option key={y} value={String(y)}>
                  พ.ศ. {y}
                </option>
              ))}
            </select>
          </div>
          {extraLine1Left}
        </div>

        {/* ฝั่งขวา: ข้อความคำอธิบายย่อยของแต่ละระบบ / ปุ่มแอคชันเสริม */}
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          {description && (
            <div className="text-xs text-slate-500 font-medium hidden md:block">
              {description}
            </div>
          )}
          {extraLine1Right}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* บรรทัดที่ 2 & 3: ตัวกรอง 4 ช่อง & แถบควบคุมและปุ่มกด (Single Row Action Bar) */}
      {/* ========================================================================= */}
      <div className="p-3 sm:p-3.5 space-y-3 bg-slate-50 border-b border-slate-200">
        {/* บรรทัดที่ 2: Grid 4 ช่อง */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* ช่องที่ 1: ประเด็นการพัฒนา */}
          {customSlot1 ? (
            customSlot1
          ) : (
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                {issueLabel}
              </label>
              <select
                value={issueValue}
                onChange={(e) => onIssueChange?.(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs truncate cursor-pointer"
              >
                <option value="ทั้งหมด">{issueAllLabel}</option>
                {issueOptions.map((opt, idx) => (
                  <option key={idx} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ช่องที่ 2: ผู้รับผิดชอบ */}
          {customSlot2 ? (
            customSlot2
          ) : (
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                {departmentLabel}
              </label>
              <select
                value={departmentValue}
                onChange={(e) => onDepartmentChange?.(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs truncate cursor-pointer"
              >
                <option value="ทั้งหมด">{departmentAllLabel}</option>
                {departmentOptions.map((dept, idx) => (
                  <option key={idx} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ช่องที่ 3: 🔍 ค้นหาชื่อโครงการ... */}
          {customSlot3 ? (
            customSlot3
          ) : (
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                {searchLabel}
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
                {searchValue && (
                  <button
                    type="button"
                    onClick={() => onSearchChange?.('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    aria-label="ล้างคำค้นหา"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ช่องที่ 4: งบประมาณ (บาท) */}
          {customSlot4 ? (
            customSlot4
          ) : (
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                {budgetLabel}
              </label>
              <input
                type="text"
                value={budgetValue}
                onChange={(e) => onBudgetChange?.(e.target.value)}
                placeholder={budgetPlaceholder}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs font-mono"
              />
            </div>
          )}
        </div>

        {/* บรรทัดที่ 3: แถบควบคุมและปุ่มกด (Single Row Action Bar) */}
        {customActionBar ? (
          <div className="w-full pt-2.5 border-t border-slate-200">
            {customActionBar}
          </div>
        ) : (
          <div className="flex items-center justify-between flex-nowrap gap-2 w-full pt-2.5 border-t border-slate-200 overflow-x-auto custom-scrollbar">
            {/* ฝั่งซ้าย: กลุ่มปุ่มค้นหาข้อมูล [🔍 ค้นหา] [☰ แสดงทั้งหมด] [🔄 เริ่มใหม่] */}
            <div className="flex items-center gap-1.5 shrink-0">
              {onSearch && (
                <button
                  type="button"
                  onClick={onSearch}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer shrink-0"
                >
                  <Search className="w-3.5 h-3.5 text-emerald-100" />
                  <span>ค้นหา</span>
                </button>
              )}

              {onShowAll && (
                <button
                  type="button"
                  onClick={onShowAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 transition cursor-pointer shrink-0 shadow-2xs"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                  <span>แสดงทั้งหมด</span>
                </button>
              )}

              {onReset && (
                <button
                  type="button"
                  onClick={onReset}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold border border-amber-300/80 transition cursor-pointer shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                  <span>เริ่มใหม่</span>
                </button>
              )}
            </div>

            {/* เส้นคั่นแบ่งกลุ่ม 1 -> 2 */}
            {extraControlsCenter && (
              <div className="h-5 w-px bg-slate-300 shrink-0 mx-0.5" />
            )}

            {/* ตรงกลาง: กลุ่มปุ่มประเภทแบบ/ฉบับ (ถ้ามี) */}
            {extraControlsCenter && (
              <div className="flex items-center gap-1.5 shrink-0">
                {extraControlsCenter}
              </div>
            )}

            {/* เส้นคั่นแบ่งกลุ่ม 2 -> 3 */}
            {(hasExport || onPrint || actionButton || extraControlsRight) && (
              <div className="h-5 w-px bg-slate-300 shrink-0 mx-0.5" />
            )}

            {/* ฝั่งขวา: กลุ่มปุ่มจัดการเอกสารและปุ่มแอคชันประจำหน้า [📥 ส่งออกข้อมูล ▾] [🖨️ พิมพ์รายงาน] */}
            <div className="flex items-center gap-1.5 shrink-0 justify-end ml-auto">
              {/* 1. ปุ่มยุบรวมส่งออกข้อมูล: [📥 ส่งออกข้อมูล ▾] */}
              {hasExport && (
                <ExportDropdown
                  onExportExcel={onExportExcel}
                  onExportCsv={onExportCsv}
                  onExportPdf={onExportPdf}
                  itemsCount={exportItemsCount}
                />
              )}

              {/* 2. ปุ่มพิมพ์: [🖨️ พิมพ์รายงาน] */}
              {onPrint && (
                <button
                  type="button"
                  onClick={onPrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-xs transition cursor-pointer shrink-0"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-300" />
                  <span>{printLabel}</span>
                </button>
              )}

              {/* 3. ปุ่ม Action เฉพาะของหน้านั้นๆ */}
              {actionButton}

              {/* 4. Controls เพิ่มเติมอื่นๆ (เช่น Tab สลับ หรือ ตัวนับ) */}
              {extraControlsRight}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

