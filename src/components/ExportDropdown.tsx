import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileType,
  ChevronDown
} from 'lucide-react';

export interface ExportDropdownProps {
  onExportExcel?: () => void;
  onExportCsv?: () => void;
  onExportPdf?: () => void;
  itemsCount?: number;
  className?: string;
  buttonVariant?: 'default' | 'outline' | 'compact';
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({
  onExportExcel,
  onExportCsv,
  onExportPdf,
  itemsCount,
  className = '',
  buttonVariant = 'default'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (action?: () => void) => {
    setIsOpen(false);
    if (action) {
      action();
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Download className="w-3.5 h-3.5 text-emerald-200" />
        <span>ส่งออกข้อมูล</span>
        {typeof itemsCount === 'number' && (
          <span className="text-[10px] bg-emerald-900/60 text-emerald-200 px-1.5 py-0.2 rounded-md font-mono">
            {itemsCount}
          </span>
        )}
        <ChevronDown className={`w-3 h-3 text-emerald-200 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-52 rounded-xl bg-white shadow-xl border border-slate-200 z-50 py-1 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400">
            เลือกรูปแบบไฟล์ส่งออก
          </div>

          <div className="py-1">
            {onExportExcel && (
              <button
                type="button"
                onClick={() => handleSelect(onExportExcel)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition cursor-pointer text-left"
              >
                <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-slate-800">ไฟล์ Excel (.xlsx)</div>
                  <div className="text-[10px] text-slate-500">ตารางคำนวณ Microsoft Excel</div>
                </div>
              </button>
            )}

            {onExportCsv && (
              <button
                type="button"
                onClick={() => handleSelect(onExportCsv)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition cursor-pointer text-left"
              >
                <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                  <FileType className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-slate-800">ไฟล์ CSV (.csv)</div>
                  <div className="text-[10px] text-slate-500">ข้อมูลคั่นด้วยจุลภาค UTF-8</div>
                </div>
              </button>
            )}

            {onExportPdf && (
              <button
                type="button"
                onClick={() => handleSelect(onExportPdf)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition cursor-pointer text-left"
              >
                <div className="w-6 h-6 rounded-md bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-slate-800">ไฟล์ PDF (.pdf)</div>
                  <div className="text-[10px] text-slate-500">แบบฟอร์มทางการราชการ</div>
                </div>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
