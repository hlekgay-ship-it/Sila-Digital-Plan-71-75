import React from 'react';
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight
} from 'lucide-react';

export interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  itemLabel?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100, 999],
  className = '',
  itemLabel = 'รายการ'
}) => {
  const isAll = pageSize >= 999 || pageSize === 0;
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = totalItems === 0 ? 0 : isAll ? 1 : (safeCurrentPage - 1) * pageSize + 1;
  const endIndex = totalItems === 0 ? 0 : isAll ? totalItems : Math.min(safeCurrentPage * pageSize, totalItems);

  return (
    <div
      className={`bg-slate-50/90 px-4 py-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 select-none no-print ${className}`}
    >
      {/* ฝั่งซ้าย: Dropdown หน้าละ & Dropdown หน้าที่ */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium">หน้าละ:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              const newSize = Number(e.target.value);
              onPageSizeChange(newSize);
              onPageChange(1);
            }}
            className="bg-white border border-slate-300 text-slate-800 font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1.5 focus:ring-emerald-500 shadow-2xs cursor-pointer text-xs"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt >= 999 || opt === 0 ? 'ทั้งหมด' : `${opt} รายการ`}
              </option>
            ))}
          </select>
        </div>

        <div className="h-3.5 w-[1px] bg-slate-300 hidden sm:block" />

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium">หน้าที่:</span>
          <select
            value={safeCurrentPage}
            disabled={totalPages <= 1}
            onChange={(e) => onPageChange(Number(e.target.value))}
            className="bg-white border border-slate-300 text-slate-800 font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1.5 focus:ring-emerald-500 shadow-2xs cursor-pointer text-xs disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <option key={p} value={p}>
                {p} จาก {totalPages}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ตรงกลาง: ข้อความสรุปจำนวนรายการ เช่น 1 ถึง 20 จาก 100 รายการ */}
      <div className="text-slate-600 font-medium text-xs text-center order-first sm:order-none w-full sm:w-auto">
        <span className="font-mono font-bold text-slate-800">
          {startIndex.toLocaleString('th-TH')}
        </span>{' '}
        ถึง{' '}
        <span className="font-mono font-bold text-slate-800">
          {endIndex.toLocaleString('th-TH')}
        </span>{' '}
        จาก{' '}
        <span className="font-mono font-bold text-emerald-700">
          {totalItems.toLocaleString('th-TH')}
        </span>{' '}
        {itemLabel}
      </div>

      {/* ฝั่งขวา: ปุ่มเปลี่ยนหน้า [«] [<] [>] [»] */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={safeCurrentPage <= 1 || totalItems === 0}
          onClick={() => onPageChange(1)}
          title="หน้าแรก"
          className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 shadow-2xs transition cursor-pointer"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          disabled={safeCurrentPage <= 1 || totalItems === 0}
          onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          title="หน้าก่อนหน้า"
          className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 shadow-2xs transition cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          disabled={safeCurrentPage >= totalPages || totalItems === 0}
          onClick={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}
          title="หน้าถัดไป"
          className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 shadow-2xs transition cursor-pointer"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          disabled={safeCurrentPage >= totalPages || totalItems === 0}
          onClick={() => onPageChange(totalPages)}
          title="หน้าสุดท้าย"
          className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 shadow-2xs transition cursor-pointer"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
