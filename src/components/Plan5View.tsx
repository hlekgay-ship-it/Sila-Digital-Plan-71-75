import React, { useState, useMemo } from 'react';
import {
  Plus,
  Printer,
  Edit,
  Trash2,
  GitCompare,
  History,
  FileEdit,
  Menu,
  Download
} from 'lucide-react';
import { Project, PlanType, OptionsData } from '../types';
import { YEARS, ORG_NAME, STANDARD_STRATEGIC_ISSUES, STANDARD_DEPARTMENTS, sortStrategicIssues } from '../data/initialData';
import { ProjectFormModal } from './ProjectFormModal';
import { ProjectRevisionModal } from './ProjectRevisionModal';
import { SelectProjectModal } from './SelectProjectModal';
import { PdfExportModal } from './PdfExportModal';
import { TablePagination } from './TablePagination';
import { StandardFilterBar } from './StandardFilterBar';
import { exportProjects } from '../services/exportService';
import { printOfficialReport02 } from '../services/printReportService';

interface Plan5ViewProps {
  planType: PlanType;
  projects: Project[];
  options: OptionsData;
  onSaveProject: (data: Partial<Project>) => void;
  onDeleteProject: (id: number) => void;
  onAddOption: (category: string, value: string) => void;
  onViewRevisions?: (project: Project) => void;
  onToggleMobile?: () => void;
}

export const Plan5View: React.FC<Plan5ViewProps> = ({
  planType,
  projects,
  options,
  onSaveProject,
  onDeleteProject,
  onAddOption,
  onViewRevisions,
  onToggleMobile
}) => {
  const [selectedYear, setSelectedYear] = useState<string>('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterIssue, setFilterIssue] = useState('ทั้งหมด');
  const [filterDepartment, setFilterDepartment] = useState('ทั้งหมด');
  const [filterBudget, setFilterBudget] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [sourceProjectForAction, setSourceProjectForAction] = useState<Project | null>(null);
  const [isSelectSourceModalOpen, setIsSelectSourceModalOpen] = useState(false);
  const [targetActionType, setTargetActionType] = useState<'เปลี่ยนแปลง' | 'แก้ไข'>('เปลี่ยนแปลง');
  const [revisionViewingProject, setRevisionViewingProject] = useState<Project | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);

  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Standard system green theme across all plan types
  const headerTheme = React.useMemo(() => {
    return {
      topBanner: 'from-emerald-800 via-emerald-700 to-teal-800',
      badge: 'bg-emerald-900/80 text-emerald-200 border-emerald-500/40',
      tableHeadBg: 'bg-[#065F46]',
      tableSubHeadBg: 'bg-[#044e3a]'
    };
  }, []);

  // Reset and Show All handlers
  const handleReset = () => {
    setSelectedYear('ทั้งหมด');
    setSearchQuery('');
    setFilterIssue('ทั้งหมด');
    setFilterDepartment('ทั้งหมด');
    setFilterBudget('');
    setCurrentPage(1);
  };

  const handleShowAll = () => {
    setSelectedYear('ทั้งหมด');
    setSearchQuery('');
    setFilterIssue('ทั้งหมด');
    setFilterDepartment('ทั้งหมด');
    setFilterBudget('');
    setCurrentPage(1);
  };

  // Filter projects by current type and filters
  const filteredProjects = projects.filter((p) => {
    const matchType = (p['ประเภทรายการ'] || 'ฉบับแรก') === planType;
    if (!matchType) return false;

    // Filter by year if specific year chosen
    if (selectedYear !== 'ทั้งหมด') {
      const yearBudget = Number(p[`งบประมาณ ${selectedYear}` as keyof Project]) || 0;
      if (yearBudget <= 0) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (p['ชื่อโครงการ'] || '').toLowerCase().includes(q);
      const matchObj = (p['วัตถุประสงค์'] || '').toLowerCase().includes(q);
      const matchTarget = (p['เป้าหมาย (ผลผลิต)'] || '').toLowerCase().includes(q);
      const matchResp = (p['หน่วยงานรับผิดชอบหลัก'] || '').toLowerCase().includes(q);
      const matchId = String(p.ID) === searchQuery.trim();
      if (!matchName && !matchObj && !matchTarget && !matchResp && !matchId) return false;
    }

    // Issue
    if (filterIssue !== 'ทั้งหมด' && p['ประเด็นการพัฒนา'] !== filterIssue) return false;

    // Department / Responsible
    if (filterDepartment !== 'ทั้งหมด') {
      const dept = p['หน่วยงานรับผิดชอบหลัก'] || '';
      if (!dept.includes(filterDepartment)) return false;
    }

    // Budget
    if (filterBudget.trim()) {
      const budgetNum = Number(filterBudget.replace(/,/g, ''));
      if (!isNaN(budgetNum) && budgetNum > 0) {
        const totalProjBudget = YEARS.reduce((sum, y) => sum + (Number(p[`งบประมาณ ${y}` as keyof Project]) || 0), 0);
        if (totalProjBudget < budgetNum) return false;
      }
    }

    return true;
  });

  // Paginated projects
  const totalPages = pageSize >= 999 || pageSize === 0 ? 1 : Math.ceil(filteredProjects.length / pageSize) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProjects =
    pageSize >= 999 || pageSize === 0
      ? filteredProjects
      : filteredProjects.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Calculate totals
  const totalBudgetByYear: Record<number, number> = {
    2571: 0,
    2572: 0,
    2573: 0,
    2574: 0,
    2575: 0
  };
  let grandTotal = 0;

  filteredProjects.forEach((p) => {
    YEARS.forEach((y) => {
      const val = Number(p[`งบประมาณ ${y}` as keyof Project]) || 0;
      totalBudgetByYear[y] += val;
      grandTotal += val;
    });
  });

  // Grouped Projects by Strategic Issue for Official Form ผ.02 Print View
  const groupedProjectsForPrint = useMemo(() => {
    const map: Record<string, Project[]> = {};
    const order: string[] = [];

    filteredProjects.forEach((p) => {
      const issue = p['ประเด็นการพัฒนา'] || '(ไม่ระบุประเด็นการพัฒนา)';
      if (!map[issue]) {
        map[issue] = [];
        order.push(issue);
      }
      map[issue].push(p);
    });

    const sorted = sortStrategicIssues(order);
    return sorted.map((issue) => ({
      issue,
      items: map[issue] || []
    }));
  }, [filteredProjects]);

  const handlePrintReport = () => {
    printOfficialReport02(filteredProjects, planType);
  };

  const formatMoney = (n: number | undefined) => {
    const num = Number(n) || 0;
    return num > 0 ? num.toLocaleString('th-TH') : '-';
  };

  const handleOpenNew = () => {
    setEditingProject(null);
    setSourceProjectForAction(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Project) => {
    setEditingProject(p);
    setSourceProjectForAction(null);
    setIsModalOpen(true);
  };

  const handleOpenSelectSource = (type: 'เปลี่ยนแปลง' | 'แก้ไข') => {
    setTargetActionType(type);
    setIsSelectSourceModalOpen(true);
  };

  const handleSelectSourceProject = (sourceP: Project) => {
    setSourceProjectForAction(sourceP);
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleQuickChangeFromRow = (p: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setTargetActionType('เปลี่ยนแปลง');
    setSourceProjectForAction(p);
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleQuickEditFromRow = (p: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setTargetActionType('แก้ไข');
    setSourceProjectForAction(p);
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleOpenRevisions = (p: Project, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onViewRevisions) {
      onViewRevisions(p);
    } else {
      setRevisionViewingProject(p);
    }
  };

  const handleSaveModal = (data: Partial<Project>) => {
    onSaveProject(data);
    setIsModalOpen(false);
    setSourceProjectForAction(null);
  };

  return (
    <div className="space-y-2.5 flex flex-col h-full">
      {/* ================= UNIFIED TOP CONTAINER (HEADER & ACTION/FILTER BAR) ================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden shrink-0 no-print">
        {/* Banner Header with System Indicator */}
        <div className={`bg-gradient-to-r ${headerTheme.topBanner} text-white px-4 py-2.5 flex items-center justify-between flex-wrap gap-2`}>
          <div className="flex items-center gap-2.5">
            {onToggleMobile && (
              <button
                type="button"
                onClick={onToggleMobile}
                className="lg:hidden p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-white border border-white/20 cursor-pointer"
                aria-label="เปิดเมนู"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}
            <div className="w-8 h-8 rounded-lg bg-black/25 border border-white/20 flex items-center justify-center font-bold text-xs text-white">
              ผ.02
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold leading-tight flex items-center gap-2 flex-wrap">
                <span>บัญชีรายละเอียดโครงการพัฒนาท้องถิ่น (แบบ ผ.02) - {planType}</span>
                <span className="text-white/60 font-normal">|</span>
                <span className="text-white text-xs sm:text-sm font-semibold">
                  แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) | เทศบาลเมืองศิลา
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${headerTheme.badge}`}>
                  {filteredProjects.length} โครงการ
                </span>
              </h2>
            </div>
          </div>
        </div>

        {/* Standardized Filter Component with Single Row Action Bar */}
        <StandardFilterBar
          selectedYear={selectedYear}
          onYearChange={(yr) => {
            setSelectedYear(yr);
            setCurrentPage(1);
          }}
          allYearsLabel="ทั้งหมด (2571-2575)"
          issueLabel="ประเด็นการพัฒนา"
          issueValue={filterIssue}
          onIssueChange={(val) => {
            setFilterIssue(val);
            setCurrentPage(1);
          }}
          issueOptions={sortStrategicIssues(options['ประเด็นการพัฒนา'] || STANDARD_STRATEGIC_ISSUES)}
          issueAllLabel="-- ทุกประเด็นการพัฒนา --"
          departmentLabel="ผู้รับผิดชอบ"
          departmentValue={filterDepartment}
          onDepartmentChange={(val) => {
            setFilterDepartment(val);
            setCurrentPage(1);
          }}
          departmentOptions={options['หน่วยงานรับผิดชอบหลัก'] || STANDARD_DEPARTMENTS}
          searchLabel="ค้นหาชื่อโครงการ"
          searchValue={searchQuery}
          onSearchChange={(val) => {
            setSearchQuery(val);
            setCurrentPage(1);
          }}
          searchPlaceholder="ค้นหาชื่อโครงการ, วัตถุประสงค์, รหัส..."
          budgetLabel="งบประมาณรวม (บาท)"
          budgetValue={filterBudget}
          onBudgetChange={(val) => {
            setFilterBudget(val);
            setCurrentPage(1);
          }}
          budgetPlaceholder="ระบุจำนวนเงินขั้นต่ำ..."
          onSearch={() => setCurrentPage(1)}
          onShowAll={handleShowAll}
          onReset={handleReset}
          onExportExcel={() => exportProjects(filteredProjects, 'excel', planType)}
          onExportCsv={() => exportProjects(filteredProjects, 'csv', planType)}
          onExportPdf={() => setIsPdfModalOpen(true)}
          exportItemsCount={filteredProjects.length}
          onPrint={handlePrintReport}
          printLabel="พิมพ์รายงาน"
          actionButton={
            planType === 'เปลี่ยนแปลง' ? (
              <button
                type="button"
                onClick={() => handleOpenSelectSource('เปลี่ยนแปลง')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>เลือกโครงการเพื่อเปลี่ยนแปลง</span>
              </button>
            ) : planType === 'แก้ไข' ? (
              <button
                type="button"
                onClick={() => handleOpenSelectSource('แก้ไข')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
              >
                <FileEdit className="w-3.5 h-3.5" />
                <span>เลือกโครงการเพื่อขอแก้ไข</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenNew}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มโครงการ ({planType})</span>
              </button>
            )
          }
        />
      </div>

      {/* Official Form ผ.02 Table with Dedicated Screen-Fitting Scroll Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col flex-1 min-h-0 no-print">
        <div className="overflow-auto max-h-[calc(100vh-210px)] flex-1 custom-scrollbar">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="sticky top-0 z-20">
              <tr className={`${headerTheme.tableHeadBg} text-white shadow-xs`}>
                <th rowSpan={2} className={`py-2 px-1.5 text-center border-r border-white/15 min-w-[80px] font-bold no-print ${headerTheme.tableHeadBg}`}>
                  จัดการ
                </th>
                <th rowSpan={2} className={`py-2 px-1.5 text-center border-r border-white/15 w-10 font-bold ${headerTheme.tableHeadBg}`}>
                  ที่
                </th>
                <th rowSpan={2} className={`py-2 px-2 border-r border-white/15 min-w-[200px] font-bold ${headerTheme.tableHeadBg}`}>
                  โครงการ
                </th>
                <th rowSpan={2} className={`py-2 px-2 border-r border-white/15 min-w-[140px] font-bold ${headerTheme.tableHeadBg}`}>
                  วัตถุประสงค์
                </th>
                <th rowSpan={2} className={`py-2 px-2 border-r border-white/15 min-w-[140px] font-bold ${headerTheme.tableHeadBg}`}>
                  เป้าหมาย (ผลผลิต)
                </th>
                <th
                  colSpan={YEARS.length}
                  className={`py-1.5 px-1.5 text-center border-r border-white/15 font-bold ${headerTheme.tableSubHeadBg}`}
                >
                  งบประมาณ (บาท)
                </th>
                <th rowSpan={2} className={`py-2 px-2 border-r border-white/15 min-w-[130px] font-bold ${headerTheme.tableHeadBg}`}>
                  ผลที่คาดว่าจะได้รับ
                </th>
                <th rowSpan={2} className={`py-2 px-2 ${planType !== 'ฉบับแรก' ? 'border-r border-white/15' : ''} min-w-[110px] font-bold ${headerTheme.tableHeadBg}`}>
                  หน่วยงานหลัก
                </th>
                {planType !== 'ฉบับแรก' && (
                  <th rowSpan={2} className={`py-2 px-2 min-w-[150px] font-bold ${headerTheme.tableHeadBg}`}>
                    เหตุผลความจำเป็น
                  </th>
                )}
              </tr>
              <tr className={`${headerTheme.tableSubHeadBg} text-white`}>
                {YEARS.map((y) => (
                  <th
                    key={y}
                    className={`py-1.5 px-1 text-center border-r border-white/15 font-bold text-[10px] min-w-[70px] ${headerTheme.tableSubHeadBg}`}
                  >
                    พ.ศ. {y}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProjects.length > 0 ? (
                paginatedProjects.map((p, idx) => {
                  const globalIdx = pageSize === 0 ? idx : (safePage - 1) * pageSize + idx;
                  return (
                    <tr
                      key={p.ID}
                      className="hover:bg-emerald-50/60 transition group cursor-pointer"
                      onClick={() => handleOpenEdit(p)}
                    >
                      {/* Actions Column (First column) */}
                      <td
                        className="py-1 px-1 text-center border-r border-slate-100 no-print"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-0.5 flex-wrap max-w-[100px] mx-auto">
                          {(planType === 'ฉบับแรก' || planType === 'เพิ่มเติม') && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => handleQuickChangeFromRow(p, e)}
                                title="ขอเปลี่ยนแปลงโครงการนี้"
                                className="p-0.5 rounded bg-purple-100 text-purple-800 hover:bg-purple-200 border border-purple-300 transition"
                              >
                                <GitCompare className="w-2.5 h-2.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleQuickEditFromRow(p, e)}
                                title="ขอแก้ไขโครงการนี้"
                                className="p-0.5 rounded bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300 transition"
                              >
                                <FileEdit className="w-2.5 h-2.5" />
                              </button>
                            </>
                          )}

                          <button
                            onClick={(e) => handleOpenRevisions(p, e)}
                            title="ดูประวัติไทม์ไลน์"
                            className="p-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition"
                          >
                            <History className="w-2.5 h-2.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="แก้ไขข้อมูล"
                            className="p-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
                          >
                            <Edit className="w-2.5 h-2.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`ยืนยันการลบโครงการ #${p.ID} (${p['ชื่อโครงการ']}) หรือไม่?`)) {
                                onDeleteProject(p.ID);
                              }
                            }}
                            title="ลบโครงการ"
                            className="p-0.5 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </td>

                      <td className="py-1 px-1 text-center font-bold text-slate-800 border-r border-slate-100 font-mono text-[11px]">
                        {globalIdx + 1}
                      </td>
                      <td className="py-1 px-2 font-semibold text-slate-900 border-r border-slate-100">
                        <div className="font-bold text-slate-900 group-hover:text-emerald-700 leading-tight">
                          {p['ชื่อโครงการ']}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {p['ประเด็นการพัฒนา']}
                        </div>
                      </td>
                      <td className="py-1 px-2 text-slate-600 border-r border-slate-100 line-clamp-2 leading-snug text-[11px]">
                        {p['วัตถุประสงค์'] || '-'}
                      </td>
                      <td className="py-1 px-2 text-slate-600 border-r border-slate-100 line-clamp-2 leading-snug text-[11px]">
                        {p['เป้าหมาย (ผลผลิต)'] || '-'}
                      </td>

                      {/* 5-Year Budget Columns */}
                      {YEARS.map((y) => {
                        const val = Number(p[`งบประมาณ ${y}` as keyof Project]) || 0;
                        return (
                          <td
                            key={y}
                            className="py-1 px-1.5 text-right font-mono text-slate-800 border-r border-slate-100 font-medium whitespace-nowrap text-[11px]"
                          >
                            {formatMoney(val)}
                          </td>
                        );
                      })}

                      <td className="py-1 px-2 text-slate-600 border-r border-slate-100 line-clamp-2 leading-snug text-[11px]">
                        {p['ผลที่คาดว่าจะได้รับ'] || '-'}
                      </td>
                      <td className={`py-1 px-2 text-slate-700 font-medium text-[11px] truncate max-w-[120px] ${planType !== 'ฉบับแรก' ? 'border-r border-slate-100' : 'border-slate-100'}`}>
                        {p['หน่วยงานรับผิดชอบหลัก'] || '-'}
                      </td>
                      {planType !== 'ฉบับแรก' && (
                        <td className="py-1 px-2 text-slate-700 font-normal border-slate-100 line-clamp-2 leading-snug text-[11px]">
                          {p['เหตุผลและความจำเป็น'] || p['เหตุผลความจำเป็น'] || '-'}
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={7 + YEARS.length + (planType !== 'ฉบับแรก' ? 1 : 0)}
                    className="p-6 text-center text-slate-400 text-xs"
                  >
                    ยังไม่มีข้อมูลโครงการประเภท "{planType}" ที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              )}
            </tbody>
            {/* Sticky Subtotal Footer */}
            {filteredProjects.length > 0 && (
              <tfoot className="sticky bottom-0 z-20">
                <tr className="bg-emerald-800 text-white font-bold border-t-2 border-emerald-400 shadow-md">
                  <td colSpan={5} className="py-1.5 px-2 text-right text-white border-r border-emerald-700 text-xs">
                    รวมงบประมาณทั้งสิ้น ({filteredProjects.length} โครงการ)
                  </td>
                  {YEARS.map((y) => (
                    <td
                      key={y}
                      className="py-1.5 px-1.5 text-right font-mono text-emerald-200 border-r border-emerald-700 font-extrabold whitespace-nowrap text-xs"
                    >
                      {formatMoney(totalBudgetByYear[y])}
                    </td>
                  ))}
                  <td colSpan={planType !== 'ฉบับแรก' ? 3 : 2} className="py-1.5 px-2 text-white font-mono text-right text-xs">
                    รวม 5 ปี: {grandTotal.toLocaleString('th-TH')} บ.
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Table Footer - Standard Pagination */}
        {filteredProjects.length > 0 && (
          <TablePagination
            currentPage={safePage}
            totalItems={filteredProjects.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 20, 50, 100, 999]}
          />
        )}
      </div>

      {/* =========================================================================
          OFFICIAL FORM ผ.02 PRINT VIEW (RENDERED AUTOMATICALLY ON WINDOW.PRINT)
          ========================================================================= */}
      <div className="hidden print:block w-full text-black font-sarabun bg-white p-0 m-0 print-document">
        {/* Top Right Header */}
        <div className="text-right text-sm font-bold mb-1.5">แบบ ผ.02</div>

        {/* Official Center Title 3 Lines */}
        <div className="text-center mb-5 space-y-0.5">
          <h1 className="text-base font-extrabold text-black">
            บัญชีรายละเอียดโครงการพัฒนาท้องถิ่น
          </h1>
          <h2 className="text-sm font-bold text-black">
            {planType === 'เพิ่มเติม'
              ? 'แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) ฉบับเพิ่มเติม'
              : planType === 'เปลี่ยนแปลง'
              ? 'แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) ฉบับเปลี่ยนแปลง'
              : planType === 'แก้ไข'
              ? 'แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) ฉบับแก้ไข'
              : 'แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575)'}
          </h2>
          <h3 className="text-xs font-bold text-black">
            เทศบาลเมืองศิลา อำเภอเมืองขอนแก่น จังหวัดขอนแก่น
          </h3>
        </div>

        {/* Grouped Tables by Development Issue */}
        {groupedProjectsForPrint.length > 0 ? (
          groupedProjectsForPrint.map((grp, gIdx) => {
            const groupTotals: Record<number, number> = {
              2571: 0,
              2572: 0,
              2573: 0,
              2574: 0,
              2575: 0
            };
            grp.items.forEach((p) => {
              YEARS.forEach((y) => {
                groupTotals[y] += Number(p[`งบประมาณ ${y}` as keyof Project]) || 0;
              });
            });

            const showReason = planType !== 'ฉบับแรก';

            return (
              <div key={grp.issue} className="mt-5 space-y-1.5 break-inside-auto">
                <div className="text-xs font-bold text-black">
                  {gIdx + 1}. ประเด็นการพัฒนาท้องถิ่น: {grp.issue}
                </div>

                <table className="w-full text-[10.5px] border-collapse border border-black">
                  <thead>
                    <tr className="bg-slate-100 text-black border-b border-black text-center font-bold">
                      <th rowSpan={2} className="py-1 px-1 border border-black w-8 align-middle">
                        ที่
                      </th>
                      <th rowSpan={2} className="py-1 px-2 border border-black min-w-[160px] text-left align-middle">
                        โครงการ
                      </th>
                      <th rowSpan={2} className="py-1 px-2 border border-black min-w-[120px] text-left align-middle">
                        วัตถุประสงค์
                      </th>
                      <th rowSpan={2} className="py-1 px-2 border border-black min-w-[120px] text-left align-middle">
                        เป้าหมาย<br />(ผลผลิตของโครงการ)
                      </th>
                      <th colSpan={5} className="py-1 px-1 border border-black text-center bg-slate-200">
                        งบประมาณ (บาท)
                      </th>
                      <th rowSpan={2} className="py-1 px-2 border border-black min-w-[110px] text-left align-middle">
                        ผลที่คาดว่า<br />จะได้รับ
                      </th>
                      <th rowSpan={2} className="py-1 px-2 border border-black min-w-[95px] text-left align-middle">
                        หน่วยงาน<br />รับผิดชอบหลัก
                      </th>
                      {showReason && (
                        <th rowSpan={2} className="py-1 px-2 border border-black min-w-[100px] text-left align-middle">
                          เหตุผล<br />ความจำเป็น
                        </th>
                      )}
                    </tr>
                    <tr className="bg-slate-100 text-black border-b border-black text-[9.5px] text-center font-bold">
                      {YEARS.map((y) => (
                        <th key={y} className="py-1 px-1 border border-black min-w-[65px]">
                          พ.ศ. {y}<br /><span className="font-normal text-[8.5px]">(บาท)</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {grp.items.map((p, pIdx) => (
                      <tr key={p.ID} className="break-inside-avoid">
                        <td className="py-1 px-1 text-center border border-black font-bold align-top">
                          {pIdx + 1}
                        </td>
                        <td className="py-1 px-1.5 border border-black font-semibold text-black align-top">
                          {p['ชื่อโครงการ']}
                        </td>
                        <td className="py-1 px-1.5 border border-black text-black align-top whitespace-pre-line">
                          {p['วัตถุประสงค์'] || '-'}
                        </td>
                        <td className="py-1 px-1.5 border border-black text-black align-top whitespace-pre-line">
                          {p['เป้าหมาย (ผลผลิต)'] || '-'}
                        </td>
                        {YEARS.map((y) => {
                          const val = Number(p[`งบประมาณ ${y}` as keyof Project]) || 0;
                          return (
                            <td key={y} className="py-1 px-1 text-right border border-black font-mono align-top whitespace-nowrap">
                              {formatMoney(val)}
                            </td>
                          );
                        })}
                        <td className="py-1 px-1.5 border border-black text-black align-top">
                          {p['ผลที่คาดว่าจะได้รับ'] || '-'}
                        </td>
                        <td className="py-1 px-1.5 border border-black text-black align-top">
                          {p['หน่วยงานรับผิดชอบหลัก'] || '-'}
                        </td>
                        {showReason && (
                          <td className="py-1 px-1.5 border border-black text-black align-top">
                            {p['เหตุผลและความจำเป็น'] || p['เหตุผลความจำเป็น'] || '-'}
                          </td>
                        )}
                      </tr>
                    ))}
                    {/* Subtotal row per issue */}
                    <tr className="bg-slate-100 font-bold text-black border-t-2 border-black">
                      <td className="py-1 px-1 text-center border border-black font-bold">รวม</td>
                      <td className="py-1 px-1.5 border border-black font-bold">{grp.items.length} โครงการ</td>
                      <td className="py-1 px-1 text-center border border-black font-bold">-</td>
                      <td className="py-1 px-1 text-center border border-black font-bold">-</td>
                      {YEARS.map((y) => (
                        <td key={y} className="py-1 px-1 text-right border border-black font-mono font-bold whitespace-nowrap">
                          {formatMoney(groupTotals[y])}
                        </td>
                      ))}
                      <td className="py-1 px-1 text-center border border-black font-bold">-</td>
                      <td className="py-1 px-1 text-center border border-black font-bold">-</td>
                      {showReason && <td className="py-1 px-1 text-center border border-black font-bold">-</td>}
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-slate-500 border border-dashed border-slate-400 mt-4">
            ไม่มีข้อมูลโครงการสำหรับพิมพ์รายงาน
          </div>
        )}

        {/* Grand Total Summary */}
        {filteredProjects.length > 0 && (
          <div className="mt-5 break-inside-avoid">
            <table className="w-full text-[11px] border-collapse border-2 border-black">
              <tfoot>
                <tr className="bg-slate-200 font-extrabold text-black">
                  <td className="py-1.5 px-1 text-center border border-black w-8">รวม</td>
                  <td className="py-1.5 px-1.5 border border-black min-w-[160px]">
                    รวมงบประมาณทั้งสิ้น ({filteredProjects.length} โครงการ)
                  </td>
                  <td className="py-1.5 px-1 text-center border border-black min-w-[120px]">-</td>
                  <td className="py-1.5 px-1 text-center border border-black min-w-[120px]">-</td>
                  {YEARS.map((y) => (
                    <td key={y} className="py-1.5 px-1 text-right border border-black font-mono whitespace-nowrap min-w-[65px]">
                      {formatMoney(totalBudgetByYear[y])}
                    </td>
                  ))}
                  <td className="py-1.5 px-1.5 text-center border border-black min-w-[110px]">
                    รวม 5 ปี: {formatMoney(grandTotal)} บาท
                  </td>
                  <td className="py-1.5 px-1 text-center border border-black min-w-[95px]">-</td>
                  {planType !== 'ฉบับแรก' && <td className="py-1.5 px-1 text-center border border-black min-w-[100px]">-</td>}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <ProjectFormModal
          project={editingProject}
          sourceProject={sourceProjectForAction}
          planType={sourceProjectForAction ? targetActionType : planType}
          options={options}
          onSave={handleSaveModal}
          onDelete={(id) => {
            onDeleteProject(id);
            setIsModalOpen(false);
          }}
          onClose={() => {
            setIsModalOpen(false);
            setSourceProjectForAction(null);
          }}
          onAddOption={onAddOption}
        />
      )}

      {/* Select Source Project Modal for Change / Edit operations */}
      {isSelectSourceModalOpen && (
        <SelectProjectModal
          projects={projects}
          targetPlanType={targetActionType}
          onSelectProject={(selectedP) => {
            setIsSelectSourceModalOpen(false);
            handleSelectSourceProject(selectedP);
          }}
          onClose={() => setIsSelectSourceModalOpen(false)}
        />
      )}

      {/* Revision Timeline & Diff Modal */}
      {revisionViewingProject && (
        <ProjectRevisionModal
          project={revisionViewingProject}
          onClose={() => setRevisionViewingProject(null)}
          onCreateNewRevision={(p) => {
            setRevisionViewingProject(null);
            setEditingProject(p);
            setSourceProjectForAction(null);
            setIsModalOpen(true);
          }}
        />
      )}

      {/* PDF Export & Page Setup Modal */}
      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        projects={projects}
        initialReportType={
          planType === 'เพิ่มเติม'
            ? 'ผ02-additional'
            : planType === 'เปลี่ยนแปลง'
            ? 'change-diff'
            : planType === 'แก้ไข'
            ? 'edit-diff'
            : 'ผ02-baseline'
        }
      />
    </div>
  );
};
