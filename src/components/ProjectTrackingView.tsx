import React, { useState, useMemo } from 'react';
import {
  Activity,
  Plus,
  Calendar,
  Trash2,
  X,
  Save,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Search,
  Building2,
  Printer,
  ChevronDown,
  Layers,
  Edit3,
  Sliders,
  TrendingUp,
  Coins,
  ArrowUpRight,
  Sparkles,
  Download,
  Check,
  CalendarDays,
  UserCheck,
  FileCheck2,
  Ban,
  RefreshCw,
  FolderOpen,
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { StandardFilterBar } from './StandardFilterBar';
import {
  ProjectTrackingItem,
  Project,
  TrackingStatus,
  BudgetApproval,
  OptionsData
} from '../types';
import { YEARS, ORG_NAME, TRACKING_STATUS_LIST, STANDARD_DEPARTMENTS, STANDARD_STRATEGIC_ISSUES, sortStrategicIssues } from '../data/initialData';
import { TablePagination } from './TablePagination';
import { exportTrackings } from '../services/exportService';

interface ProjectTrackingViewProps {
  trackings: ProjectTrackingItem[];
  projects: Project[];
  budgetApprovals: BudgetApproval[];
  options: OptionsData;
  globalFiscalYear: number;
  onSaveTracking: (data: Partial<ProjectTrackingItem>) => void;
  onDeleteTracking: (id: number) => void;
  onSelectProject?: (p: Project) => void;
  onToggleMobile?: () => void;
}

export const ProjectTrackingView: React.FC<ProjectTrackingViewProps> = ({
  trackings,
  projects,
  budgetApprovals,
  options,
  globalFiscalYear,
  onSaveTracking,
  onDeleteTracking,
  onSelectProject,
  onToggleMobile
}) => {
  // View mode: 'table' (ตารางทางการ) | 'grid' (การ์ดติดตาม)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Filters
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>(String(globalFiscalYear));
  const [issueFilter, setIssueFilter] = useState<string>('ทั้งหมด');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterBudget, setFilterBudget] = useState<string>('');
  const [statusRadio, setStatusRadio] = useState<'all' | 'completed' | 'in_progress' | 'delayed' | 'not_started'>('all');

  // Pagination
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ProjectTrackingItem | null>(null);

  // Modal Form Inputs
  const [modalYear, setModalYear] = useState<number>(globalFiscalYear);
  const [modalIssue, setModalIssue] = useState<string>('');
  const [modalProjectName, setModalProjectName] = useState<string>('');
  const [modalObjective, setModalObjective] = useState<string>('');
  const [modalDetails, setModalDetails] = useState<string>('');
  const [modalStatus, setModalStatus] = useState<TrackingStatus>('ยังไม่เริ่มดำเนินการ');
  const [modalProgress, setModalProgress] = useState<number>(0);
  const [modalStartDate, setModalStartDate] = useState<string>('');
  const [modalEndDate, setModalEndDate] = useState<string>('');
  const [modalNotes, setModalNotes] = useState<string>('');
  const [modalResponsible, setModalResponsible] = useState<string>('');
  const [modalDepartment, setModalDepartment] = useState<string>('');
  const [modalBudget, setModalBudget] = useState<number | ''>('');
  const [modalContractAmount, setModalContractAmount] = useState<number | ''>('');
  const [modalDisbursed, setModalDisbursed] = useState<number | ''>('');
  const [modalBudgetSource, setModalBudgetSource] = useState<string>('');
  const [modalLinkedProjectId, setModalLinkedProjectId] = useState<number | undefined>(undefined);

  // Project Picker Modal / Quick Import from Approved Budget Projects
  const [isApprovedPickerOpen, setIsApprovedPickerOpen] = useState<boolean>(false);
  const [pickerSearch, setPickerSearch] = useState<string>('');
  const [pickerYear, setPickerYear] = useState<string>(String(globalFiscalYear));

  // Quick Progress update inline modal
  const [quickUpdateItem, setQuickUpdateItem] = useState<ProjectTrackingItem | null>(null);
  const [quickProgressVal, setQuickProgressVal] = useState<number>(0);
  const [quickStatusVal, setQuickStatusVal] = useState<TrackingStatus>('อยู่ระหว่างดำเนินการ');
  const [quickNoteVal, setQuickNoteVal] = useState<string>('');

  // Find all projects that are considered "approved budget projects"
  // (Either marked as 'ได้รับการจัดสรรงบประมาณแล้ว' OR budget approved > 0 OR have allocation in the year)
  const approvedProjects = useMemo(() => {
    return projects.filter((p) => {
      const isApprovedStatus = p['สถานะงบประมาณ'] === 'ได้รับการจัดสรรงบประมาณแล้ว (มีงบพร้อมใช้)';
      const hasApprovedAmt = Number(p['งบประมาณที่อนุมัติ']) > 0;
      const hasYearBudget = YEARS.some((y) => Number(p[`งบประมาณ ${y}` as keyof Project]) > 0);
      return isApprovedStatus || hasApprovedAmt || hasYearBudget;
    });
  }, [projects]);

  // Formatted money
  const formatMoney = (n: number | undefined) => {
    return (Number(n) || 0).toLocaleString('th-TH');
  };

  // Open modal to create new tracking
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setModalYear(globalFiscalYear);
    const defaultIssue = options['ประเด็นการพัฒนา']?.[0] || '';
    setModalIssue(defaultIssue);
    setModalProjectName('');
    setModalObjective('');
    setModalDetails('');
    setModalStatus('ยังไม่เริ่มดำเนินการ');
    setModalProgress(0);
    const today = new Date().toISOString().split('T')[0];
    setModalStartDate(today);
    setModalEndDate('');
    setModalNotes('');
    setModalResponsible(options['หน่วยงานรับผิดชอบหลัก']?.[0] || STANDARD_DEPARTMENTS[0]);
    setModalDepartment(options['หน่วยงานรับผิดชอบหลัก']?.[0] || STANDARD_DEPARTMENTS[0]);
    setModalBudget('');
    setModalContractAmount('');
    setModalDisbursed('');
    setModalBudgetSource('เทศบัญญัติงบประมาณรายจ่ายประจำปี');
    setModalLinkedProjectId(undefined);
    setIsModalOpen(true);
  };

  // Open modal to edit existing tracking
  const handleOpenEditModal = (item: ProjectTrackingItem) => {
    setEditingItem(item);
    setModalYear(Number(item['ปีงบ']) || globalFiscalYear);
    setModalIssue(item['ประเด็นการพัฒนา'] || '');
    setModalProjectName(item['ชื่อโครงการ'] || '');
    setModalObjective(item['วัตถุประสงค์'] || '');
    setModalDetails(item['รายละเอียดโครงการ'] || '');
    setModalStatus((item['สถานะโครงการ'] as TrackingStatus) || 'ยังไม่เริ่มดำเนินการ');
    setModalProgress(Number(item['ความคืบหน้า (%)']) || 0);
    setModalStartDate(item['วันที่เริ่มต้น'] || '');
    setModalEndDate(item['วันที่คาดว่าจะสิ้นสุด'] || '');
    setModalNotes(item['หมายเหตุ/ปัญหาที่พบ'] || '');
    setModalResponsible(item['ผู้รับผิดชอบ'] || '');
    setModalDepartment(item['หน่วยงาน'] || item['ผู้รับผิดชอบ'] || '');
    setModalBudget(item['งบประมาณที่อนุมัติ'] ?? item['งบประมาณที่ได้รับจัดสรร'] ?? '');
    setModalContractAmount(item['ลงนามสัญญา'] ?? '');
    setModalDisbursed(item['เบิกจ่าย'] ?? item['ผลการเบิกจ่าย'] ?? '');
    setModalBudgetSource(item['แหล่งที่มา'] || item['แหล่งงบประมาณ'] || '');
    setModalLinkedProjectId(item.projectID);
    setIsModalOpen(true);
  };

  // Select project from approved projects list to auto-populate form
  const handleSelectApprovedProject = (p: Project) => {
    const yr = Number(p['ปี พ.ศ.']) || globalFiscalYear;
    setModalYear(yr);
    setModalIssue(p['ประเด็นการพัฒนา'] || '');
    setModalProjectName(p['ชื่อโครงการ'] || '');
    setModalObjective(p['วัตถุประสงค์'] || '');
    setModalDetails(p['เป้าหมาย (ผลผลิต)'] || '');
    setModalResponsible(p['หน่วยงานรับผิดชอบหลัก'] || '');
    setModalDepartment(p['หน่วยงานรับผิดชอบหลัก'] || '');
    
    // Check budget for that year
    const yearBudget = Number(p[`งบประมาณ ${yr}` as keyof Project]) || Number(p['งบประมาณที่อนุมัติ']) || 0;
    setModalBudget(yearBudget);
    setModalContractAmount('');
    setModalDisbursed('');
    setModalBudgetSource(p['แหล่งที่มาของงบประมาณ'] || 'เทศบัญญัติงบประมาณรายจ่ายประจำปี');
    setModalLinkedProjectId(p.ID);

    // Initial dates if empty
    if (!modalStartDate) {
      setModalStartDate(`${yr - 543}-10-01`); // e.g. Start of fiscal year
    }
    if (!modalEndDate) {
      setModalEndDate(`${yr - 543 + 1}-09-30`); // e.g. End of fiscal year
    }

    setIsApprovedPickerOpen(false);
  };

  // Save Modal Form
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalProjectName.trim()) {
      alert('กรุณาระบุชื่อโครงการ');
      return;
    }

    const budgetVal = modalBudget !== '' ? Number(modalBudget) : 0;
    const contractVal = modalContractAmount !== '' ? Number(modalContractAmount) : 0;
    const disbursedVal = modalDisbursed !== '' ? Number(modalDisbursed) : 0;
    const remainingVal = Math.max(0, budgetVal - disbursedVal);

    const payload: Partial<ProjectTrackingItem> = {
      ID: editingItem ? editingItem.ID : undefined,
      projectID: modalLinkedProjectId,
      'ปีงบ': modalYear,
      'ประเด็นการพัฒนา': modalIssue,
      'ชื่อโครงการ': modalProjectName.trim(),
      'วัตถุประสงค์': modalObjective.trim(),
      'รายละเอียดโครงการ': modalDetails.trim(),
      'สถานะโครงการ': modalStatus,
      'ความคืบหน้า (%)': Math.min(100, Math.max(0, Number(modalProgress) || 0)),
      'วันที่เริ่มต้น': modalStartDate,
      'วันที่คาดว่าจะสิ้นสุด': modalEndDate,
      'หมายเหตุ/ปัญหาที่พบ': modalNotes.trim(),
      'ผู้รับผิดชอบ': modalResponsible.trim() || modalDepartment.trim(),
      'หน่วยงาน': modalDepartment.trim() || modalResponsible.trim(),
      'แหล่งที่มา': modalBudgetSource.trim() || 'เทศบัญญัติงบประมาณรายจ่ายประจำปี',
      'งบประมาณที่อนุมัติ': budgetVal,
      'ลงนามสัญญา': contractVal,
      'เบิกจ่าย': disbursedVal,
      'คงเหลือ': remainingVal,
      'งบประมาณที่ได้รับจัดสรร': budgetVal,
      'ผลการเบิกจ่าย': disbursedVal,
      'แหล่งงบประมาณ': modalBudgetSource.trim() || 'เทศบัญญัติงบประมาณรายจ่ายประจำปี'
    };

    onSaveTracking(payload);
    setIsModalOpen(false);
  };

  // Quick progress update save
  const handleSaveQuickUpdate = () => {
    if (!quickUpdateItem) return;
    onSaveTracking({
      ID: quickUpdateItem.ID,
      projectID: quickUpdateItem.projectID,
      'ความคืบหน้า (%)': quickProgressVal,
      'สถานะโครงการ': quickStatusVal,
      'หมายเหตุ/ปัญหาที่พบ': quickNoteVal.trim() || quickUpdateItem['หมายเหตุ/ปัญหาที่พบ']
    });
    setQuickUpdateItem(null);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedYearFilter(String(globalFiscalYear));
    setIssueFilter('ทั้งหมด');
    setDepartmentFilter('ทั้งหมด');
    setSearchQuery('');
    setFilterBudget('');
    setStatusRadio('all');
  };

  const handleShowAll = () => {
    setSelectedYearFilter('ทั้งหมด');
    setIssueFilter('ทั้งหมด');
    setDepartmentFilter('ทั้งหมด');
    setSearchQuery('');
    setFilterBudget('');
    setStatusRadio('all');
  };

  // Base Filtered Tracking Items (before status filter, so dashboard cards show accurate counts)
  const baseTrackings = useMemo(() => {
    const budgetNum = filterBudget.trim() !== '' ? Number(filterBudget.replace(/,/g, '')) : null;

    return trackings.filter((item) => {
      // Fiscal Year
      if (selectedYearFilter !== 'ทั้งหมด' && String(item['ปีงบ']) !== selectedYearFilter) {
        return false;
      }
      // Development Issue
      if (issueFilter !== 'ทั้งหมด' && item['ประเด็นการพัฒนา'] !== issueFilter) {
        return false;
      }
      // Department / Responsible
      if (departmentFilter !== 'ทั้งหมด') {
        const resp = item['ผู้รับผิดชอบ'] || '';
        const dept = item['หน่วยงาน'] || '';
        if (!resp.includes(departmentFilter) && !dept.includes(departmentFilter)) return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (item['ชื่อโครงการ'] || '').toLowerCase().includes(q);
        const objMatch = (item['วัตถุประสงค์'] || '').toLowerCase().includes(q);
        const detailMatch = (item['รายละเอียดโครงการ'] || '').toLowerCase().includes(q);
        const respMatch = (item['ผู้รับผิดชอบ'] || '').toLowerCase().includes(q);
        const noteMatch = (item['หมายเหตุ/ปัญหาที่พบ'] || '').toLowerCase().includes(q);
        const issueMatch = (item['ประเด็นการพัฒนา'] || '').toLowerCase().includes(q);
        if (!nameMatch && !objMatch && !detailMatch && !respMatch && !noteMatch && !issueMatch) {
          return false;
        }
      }
      // Budget filter
      if (budgetNum !== null && !isNaN(budgetNum)) {
        const itemBudget = Number(item['งบประมาณที่ได้รับจัดสรร']) || 0;
        if (itemBudget !== budgetNum && itemBudget > budgetNum) {
          return false;
        }
      }
      return true;
    });
  }, [trackings, selectedYearFilter, issueFilter, departmentFilter, searchQuery, filterBudget]);

  // Filtered Tracking Items (with status filter applied)
  const filteredTrackings = useMemo(() => {
    if (statusRadio === 'all') return baseTrackings;
    return baseTrackings.filter((item) => {
      const itemSt = item['สถานะโครงการ'];
      if (statusRadio === 'completed') return itemSt === 'ดำเนินการแล้วเสร็จ';
      if (statusRadio === 'in_progress') return itemSt === 'อยู่ระหว่างดำเนินการ';
      if (statusRadio === 'delayed') return itemSt === 'ล่าช้ากว่าแผน';
      if (statusRadio === 'not_started') return itemSt === 'ยังไม่เริ่มดำเนินการ';
      return true;
    });
  }, [baseTrackings, statusRadio]);

  // Paginated list
  const totalPages = Math.ceil(filteredTrackings.length / pageSize) || 1;
  const paginatedTrackings = useMemo(() => {
    if (pageSize >= 999) return filteredTrackings;
    const start = (currentPage - 1) * pageSize;
    return filteredTrackings.slice(start, start + pageSize);
  }, [filteredTrackings, currentPage, pageSize]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = baseTrackings.length;
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;
    let delayed = 0;
    let suspended = 0;
    let totalProgressSum = 0;
    let totalBudgetSum = 0;
    let totalDisbursedSum = 0;

    baseTrackings.forEach((t) => {
      const st = t['สถานะโครงการ'];
      if (st === 'ดำเนินการแล้วเสร็จ') completed++;
      else if (st === 'อยู่ระหว่างดำเนินการ') inProgress++;
      else if (st === 'ยังไม่เริ่มดำเนินการ') notStarted++;
      else if (st === 'ล่าช้ากว่าแผน') delayed++;
      else if (st === 'ระงับ/ยกเลิก') suspended++;

      totalProgressSum += Number(t['ความคืบหน้า (%)']) || 0;
      totalBudgetSum += Number(t['งบประมาณที่ได้รับจัดสรร']) || 0;
      totalDisbursedSum += Number(t['ผลการเบิกจ่าย']) || 0;
    });

    const avgProgress = total > 0 ? Math.round(totalProgressSum / total) : 0;
    const disbursePct = totalBudgetSum > 0 ? Math.round((totalDisbursedSum / totalBudgetSum) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      notStarted,
      delayed,
      suspended,
      avgProgress,
      totalBudgetSum,
      totalDisbursedSum,
      disbursePct
    };
  }, [baseTrackings]);

  // Helper status color styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ดำเนินการแล้วเสร็จ':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          icon: CheckCircle2
        };
      case 'อยู่ระหว่างดำเนินการ':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
          icon: Clock
        };
      case 'ล่าช้ากว่าแผน':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          icon: AlertTriangle
        };
      case 'ระงับ/ยกเลิก':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          icon: Ban
        };
      case 'ยังไม่เริ่มดำเนินการ':
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          icon: Clock
        };
    }
  };

  // Helper progress bar color
  const getProgressBarColor = (progress: number, status: string) => {
    if (status === 'ระงับ/ยกเลิก') return 'bg-rose-400';
    if (status === 'ล่าช้ากว่าแผน') return 'bg-amber-500';
    if (progress >= 100) return 'bg-emerald-600';
    if (progress >= 50) return 'bg-blue-600';
    if (progress > 0) return 'bg-sky-500';
    return 'bg-slate-300';
  };

  return (
    <div id="project-tracking-view" className="space-y-3 pb-8">
      {/* ================= 1-4. UNIFIED TOP CONTAINER (HEADER, ACTION BAR, FILTER GRID, CONTROLS & STATUS) ================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden no-print">
        {/* บรรทัดที่ 1: Header บนสุด (แถบสีเขียวเข้ม) */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            {onToggleMobile && (
              <button
                type="button"
                onClick={onToggleMobile}
                className="lg:hidden p-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-950 text-emerald-200 border border-emerald-500/40 cursor-pointer"
                aria-label="เปิดเมนู"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}
            <div className="w-8 h-8 rounded-lg bg-emerald-900/80 border border-emerald-500/40 flex items-center justify-center">
              <Activity className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold leading-tight flex items-center gap-2 flex-wrap">
                <span>ระบบติดตามโครงการ</span>
                <span className="text-white/60 font-normal">|</span>
                <span className="text-white/90 text-xs sm:text-sm font-semibold">
                  แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) | เทศบาลเมืองศิลา
                </span>
              </h2>
            </div>
          </div>
        </div>

        {/* Standardized Filter Component */}
        <StandardFilterBar
          selectedYear={selectedYearFilter}
          onYearChange={(yr) => setSelectedYearFilter(yr)}
          allYearsLabel="ทั้งหมด (2571-2575)"
          issueLabel="ประเด็นการพัฒนา"
          issueValue={issueFilter}
          onIssueChange={(val) => setIssueFilter(val)}
          issueOptions={sortStrategicIssues(options['ประเด็นการพัฒนา'] || STANDARD_STRATEGIC_ISSUES)}
          issueAllLabel="-- ทุกประเด็นการพัฒนา --"
          departmentLabel="ผู้รับผิดชอบ"
          departmentValue={departmentFilter}
          onDepartmentChange={(val) => setDepartmentFilter(val)}
          departmentOptions={options['หน่วยงานรับผิดชอบหลัก'] || []}
          searchLabel="ค้นหาชื่อโครงการ"
          searchValue={searchQuery}
          onSearchChange={(val) => setSearchQuery(val)}
          searchPlaceholder="ค้นหาชื่อโครงการ..."
          budgetLabel="งบประมาณ (บาท)"
          budgetValue={filterBudget}
          onBudgetChange={(val) => setFilterBudget(val)}
          budgetPlaceholder="ระบุจำนวนเงิน..."
          onSearch={() => {}}
          onShowAll={handleShowAll}
          onReset={handleResetFilters}
          extraControlsCenter={
            <div className="flex items-center gap-2 flex-nowrap shrink-0">
              <span className="text-xs font-bold text-slate-800 whitespace-nowrap">
                รายการโครงการ ({filteredTrackings.length} รายการ)
              </span>
              {statusRadio !== 'all' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300 whitespace-nowrap shrink-0">
                  <span>
                    สถานะ: {statusRadio === 'completed' ? 'ดำเนินการแล้วเสร็จ' : statusRadio === 'in_progress' ? 'อยู่ระหว่างดำเนินการ' : statusRadio === 'delayed' ? 'ล่าช้ากว่าแผน' : 'ยังไม่เริ่มดำเนินการ'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setStatusRadio('all')}
                    className="text-emerald-800 hover:text-emerald-950 ml-0.5 cursor-pointer font-black leading-none"
                    title="ยกเลิกการกรองสถานะนี้"
                  >
                    ×
                  </button>
                </span>
              )}
              {(searchQuery || selectedYearFilter !== 'ทั้งหมด' || issueFilter !== 'ทั้งหมด' || departmentFilter !== 'ทั้งหมด' || filterBudget) && (
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 whitespace-nowrap shrink-0">
                  ผลการกรอง
                </span>
              )}
            </div>
          }
          extraControlsRight={
            <div className="flex items-center gap-1.5 flex-nowrap shrink-0 justify-end">
              {/* 1. [✨ ดึงจากโครงการที่อนุมัติงบ] */}
              <button
                type="button"
                onClick={() => {
                  setPickerSearch('');
                  setIsApprovedPickerOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 shadow-2xs transition cursor-pointer shrink-0 whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>ดึงจากโครงการที่อนุมัติงบ ({approvedProjects.length})</span>
              </button>

              {/* 2. [+ เพิ่มรายการติดตาม] */}
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-2xs transition cursor-pointer shrink-0 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มรายการติดตาม</span>
              </button>

              {/* 3. [🖨️ พิมพ์รายงาน] */}
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition cursor-pointer shrink-0 whitespace-nowrap"
                title="พิมพ์รายงานติดตามโครงการ"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>พิมพ์รายงาน</span>
              </button>

              {/* 4. [📑 ตาราง | 📚 การ์ด] (วางชิดขวาสุด) */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    viewMode === 'table'
                      ? 'bg-white text-emerald-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="มุมมองตาราง"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>ตาราง</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    viewMode === 'grid'
                      ? 'bg-white text-emerald-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="มุมมองการ์ด"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>การ์ด</span>
                </button>
              </div>
            </div>
          }
        />
      </div>

      {/* ================= บรรทัดที่ 5: สรุปภาพรวม DASHBOARD CARDS (6 ช่อง - ทำหน้าที่เป็นตัวกรองสถานะ) ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Total Tracked (Clickable filter: all) */}
        <button
          type="button"
          onClick={() => setStatusRadio('all')}
          title="คลิกเพื่อแสดงโครงการทั้งหมด"
          className={`p-2.5 rounded-xl transition cursor-pointer text-left ${
            statusRadio === 'all'
              ? 'bg-emerald-50/90 border-2 border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border border-slate-200 shadow-2xs hover:border-slate-300 hover:bg-slate-50/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 block truncate">
              โครงการที่ติดตามทั้งหมด
            </span>
            {statusRadio === 'all' && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            )}
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-slate-800 font-mono">{metrics.total}</span>
            <span className="text-[11px] text-slate-500 font-medium">รายการ</span>
          </div>
        </button>

        {/* Average Progress (Informational) */}
        <div className="p-2.5 rounded-xl bg-white border border-emerald-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-800 block truncate">
            ความคืบหน้าเฉลี่ยรวม
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-emerald-700 font-mono">{metrics.avgProgress}%</span>
            <div className="w-12 h-2 bg-emerald-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full"
                style={{ width: `${metrics.avgProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Completed (Clickable filter: completed) */}
        <button
          type="button"
          onClick={() => setStatusRadio(statusRadio === 'completed' ? 'all' : 'completed')}
          title="คลิกเพื่อกรองเฉพาะโครงการที่ดำเนินการแล้วเสร็จ"
          className={`p-2.5 rounded-xl transition cursor-pointer text-left ${
            statusRadio === 'completed'
              ? 'bg-teal-50/90 border-2 border-teal-600 ring-2 ring-teal-500/20 shadow-xs'
              : 'bg-white border border-teal-200/80 shadow-2xs hover:border-teal-400 hover:bg-teal-50/40'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-teal-800">
            <span className="truncate">ดำเนินการแล้วเสร็จ</span>
            <CheckCircle2 className={`w-3.5 h-3.5 ${statusRadio === 'completed' ? 'text-teal-700' : 'text-teal-600'}`} />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-teal-700 font-mono">{metrics.completed}</span>
            <span className="text-[10px] font-bold text-teal-600">
              {metrics.total > 0 ? Math.round((metrics.completed / metrics.total) * 100) : 0}%
            </span>
          </div>
        </button>

        {/* In Progress (Clickable filter: in_progress) */}
        <button
          type="button"
          onClick={() => setStatusRadio(statusRadio === 'in_progress' ? 'all' : 'in_progress')}
          title="คลิกเพื่อกรองเฉพาะโครงการที่อยู่ระหว่างดำเนินการ"
          className={`p-2.5 rounded-xl transition cursor-pointer text-left ${
            statusRadio === 'in_progress'
              ? 'bg-blue-50/90 border-2 border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border border-blue-200/80 shadow-2xs hover:border-blue-400 hover:bg-blue-50/40'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-blue-800">
            <span className="truncate">อยู่ระหว่างดำเนินการ</span>
            <Clock className={`w-3.5 h-3.5 ${statusRadio === 'in_progress' ? 'text-blue-700' : 'text-blue-600'}`} />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-blue-700 font-mono">{metrics.inProgress}</span>
            <span className="text-[10px] font-bold text-blue-600">
              {metrics.total > 0 ? Math.round((metrics.inProgress / metrics.total) * 100) : 0}%
            </span>
          </div>
        </button>

        {/* Delayed / Needs Attention (Clickable filter: delayed) */}
        <button
          type="button"
          onClick={() => setStatusRadio(statusRadio === 'delayed' ? 'all' : 'delayed')}
          title="คลิกเพื่อกรองเฉพาะโครงการที่ล่าช้ากว่าแผน"
          className={`p-2.5 rounded-xl transition cursor-pointer text-left ${
            statusRadio === 'delayed'
              ? 'bg-amber-50/90 border-2 border-amber-600 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border border-amber-200/80 shadow-2xs hover:border-amber-400 hover:bg-amber-50/40'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-800">
            <span className="truncate">ล่าช้ากว่าแผน</span>
            <AlertTriangle className={`w-3.5 h-3.5 ${statusRadio === 'delayed' ? 'text-amber-700' : 'text-amber-600'}`} />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-amber-700 font-mono">{metrics.delayed}</span>
            <span className="text-[10px] font-bold text-amber-600">
              {metrics.total > 0 ? Math.round((metrics.delayed / metrics.total) * 100) : 0}%
            </span>
          </div>
        </button>

        {/* Not Started (Clickable filter: not_started) */}
        <button
          type="button"
          onClick={() => setStatusRadio(statusRadio === 'not_started' ? 'all' : 'not_started')}
          title="คลิกเพื่อกรองเฉพาะโครงการที่ยังไม่เริ่มดำเนินการ"
          className={`p-2.5 rounded-xl transition cursor-pointer text-left ${
            statusRadio === 'not_started'
              ? 'bg-slate-100 border-2 border-slate-600 ring-2 ring-slate-400/20 shadow-xs'
              : 'bg-white border border-slate-200 shadow-2xs hover:border-slate-300 hover:bg-slate-50/60'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
            <span className="truncate">ยังไม่เริ่มดำเนินการ</span>
            <span className={`w-2 h-2 rounded-full ${statusRadio === 'not_started' ? 'bg-slate-700' : 'bg-slate-400'}`} />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-slate-700 font-mono">{metrics.notStarted}</span>
            <span className="text-[10px] font-bold text-slate-500">
              {metrics.total > 0 ? Math.round((metrics.notStarted / metrics.total) * 100) : 0}%
            </span>
          </div>
        </button>
      </div>

      {/* ================= 3. CONTENT VIEW (TABLE OR GRID) ================= */}
      {filteredTrackings.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-2xs">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <FolderOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-700">ไม่พบรายการติดตามโครงการตามเงื่อนไข</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            ลองปรับเปลี่ยนตัวกรอง หรือคลิก &quot;ดึงจากโครงการที่อนุมัติงบ&quot; เพื่อเพิ่มรายการติดตามใหม่เข้าสู่ระบบ
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => {
                setSelectedYearFilter('ทั้งหมด');
                setStatusRadio('all');
                setIssueFilter('ทั้งหมด');
                setDepartmentFilter('ทั้งหมด');
                setFilterBudget('');
                setSearchQuery('');
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
            >
              ล้างตัวกรองทั้งหมด
            </button>
            <button
              onClick={() => setIsApprovedPickerOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition"
            >
              ดึงโครงการที่อนุมัติงบมาติดตาม
            </button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* ================= TABLE VIEW ================= */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto custom-scrollbar flex-1 max-h-[calc(100vh-320px)]">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead className="sticky top-0 bg-[#065F46] text-white text-xs font-bold uppercase tracking-wider z-10 select-none shadow-xs">
                <tr>
                  <th className="py-2.5 px-3 text-center w-14 border-r border-white/15 font-bold text-white">ลำดับ</th>
                  <th className="py-2.5 px-4 min-w-[280px] text-center border-r border-white/15 font-bold text-white">โครงการ</th>
                  <th className="py-2.5 px-3 min-w-[150px] text-center border-r border-white/15 font-bold text-white">หน่วยงาน</th>
                  <th className="py-2.5 px-3 min-w-[170px] text-center border-r border-white/15 font-bold text-white">แหล่งที่มา</th>
                  <th className="py-2.5 px-3 w-44 text-center border-r border-white/15 font-bold text-white">ร้อยละการดำเนินโครงการ</th>
                  <th className="py-2.5 px-3 w-36 text-center border-r border-white/15 font-bold text-white">งบประมาณที่อนุมัติ</th>
                  <th className="py-2.5 px-3 w-36 text-center border-r border-white/15 font-bold text-white">ลงนามสัญญา</th>
                  <th className="py-2.5 px-3 w-36 text-center border-r border-white/15 font-bold text-white">เบิกจ่าย</th>
                  <th className="py-2.5 px-3 w-36 text-center border-r border-white/15 font-bold text-white">คงเหลือ</th>
                  <th className="py-2.5 px-2.5 text-center w-24 no-print font-bold text-white">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {paginatedTrackings.map((item, idx) => {
                  const seq = (currentPage - 1) * (pageSize >= 999 ? 0 : pageSize) + idx + 1;
                  const stBadge = getStatusBadge(item['สถานะโครงการ']);
                  const progress = Number(item['ความคืบหน้า (%)']) || 0;
                  
                  // Money values
                  const approvedBudget = Number(item['งบประมาณที่อนุมัติ'] ?? item['งบประมาณที่ได้รับจัดสรร']) || 0;
                  const contractSigned = Number(item['ลงนามสัญญา']) || 0;
                  const disbursed = Number(item['เบิกจ่าย'] ?? item['ผลการเบิกจ่าย']) || 0;
                  const remaining = item['คงเหลือ'] !== undefined ? Number(item['คงเหลือ']) : Math.max(0, approvedBudget - disbursed);
                  const department = item['หน่วยงาน'] || item['ผู้รับผิดชอบ'] || '-';
                  const source = item['แหล่งที่มา'] || item['แหล่งงบประมาณ'] || '-';

                  return (
                    <tr
                      key={item.ID}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      {/* 1. ลำดับ */}
                      <td className="py-3 px-3 text-center text-slate-500 font-mono font-bold border-r border-slate-100">
                        {seq}
                      </td>

                      {/* 2. โครงการ */}
                      <td className="py-3 px-4 border-r border-slate-100">
                        <div className="font-bold text-slate-800 leading-snug group-hover:text-blue-700 transition-colors">
                          {item['ชื่อโครงการ']}
                        </div>
                        {item['ประเด็นการพัฒนา'] && (
                          <div className="text-[11px] text-slate-500 mt-1 flex items-start gap-1">
                            <span className="font-semibold text-blue-700 flex-shrink-0">ประเด็น:</span>
                            <span className="line-clamp-1">{item['ประเด็นการพัฒนา']}</span>
                          </div>
                        )}
                        {item['วัตถุประสงค์'] && (
                          <div className="text-[10.5px] text-slate-500 mt-0.5 line-clamp-1">
                            <span className="text-slate-400">วัตถุประสงค์: </span>
                            {item['วัตถุประสงค์']}
                          </div>
                        )}
                      </td>

                      {/* 3. หน่วยงาน */}
                      <td className="py-3 px-3 text-slate-700 font-medium border-r border-slate-100">
                        <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                          <Building2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                          <span className="line-clamp-2 leading-tight">{department}</span>
                        </div>
                      </td>

                      {/* 4. แหล่งที่มา */}
                      <td className="py-3 px-3 text-slate-600 border-r border-slate-100">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/80">
                          {source}
                        </span>
                      </td>

                      {/* 5. ร้อยละการดำเนินโครงการ */}
                      <td className="py-3 px-3 border-r border-slate-100">
                        <div className="space-y-1.5 max-w-[150px] mx-auto">
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${stBadge.bg}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${stBadge.dot}`} />
                              {item['สถานะโครงการ']}
                            </span>
                            <button
                              onClick={() => {
                                setQuickUpdateItem(item);
                                setQuickProgressVal(Number(item['ความคืบหน้า (%)']) || 0);
                                setQuickStatusVal((item['สถานะโครงการ'] as TrackingStatus) || 'อยู่ระหว่างดำเนินการ');
                                setQuickNoteVal(item['หมายเหตุ/ปัญหาที่พบ'] || '');
                              }}
                              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-mono"
                              title="อัปเดตความคืบหน้าด่วน"
                            >
                              {progress}%
                            </button>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(
                                progress,
                                item['สถานะโครงการ']
                              )}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* 6. งบประมาณที่อนุมัติ */}
                      <td className="py-3 px-3 text-right font-mono border-r border-slate-100">
                        <span className="font-bold text-slate-800">
                          {formatMoney(approvedBudget)}
                        </span>
                      </td>

                      {/* 7. ลงนามสัญญา */}
                      <td className="py-3 px-3 text-right font-mono border-r border-slate-100">
                        <span className="font-bold text-indigo-700">
                          {contractSigned > 0 ? formatMoney(contractSigned) : '-'}
                        </span>
                      </td>

                      {/* 8. เบิกจ่าย */}
                      <td className="py-3 px-3 text-right font-mono border-r border-slate-100">
                        <span className="font-bold text-emerald-700">
                          {disbursed > 0 ? formatMoney(disbursed) : '0'}
                        </span>
                      </td>

                      {/* 9. คงเหลือ */}
                      <td className="py-3 px-3 text-right font-mono border-r border-slate-100">
                        <span className={`font-bold ${remaining > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                          {formatMoney(remaining)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-2.5 text-center no-print">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1 rounded-md text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition"
                            title="แก้ไขข้อมูลติดตามโครงการ"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`คุณต้องการลบรายการติดตามโครงการ "${item['ชื่อโครงการ']}" ใช่หรือไม่?`)) {
                                onDeleteTracking(item.ID);
                              }
                            }}
                            className="p-1 rounded-md text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
                            title="ลบรายการติดตาม"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer - Standard Pagination */}
          <TablePagination
            currentPage={currentPage}
            totalItems={filteredTrackings.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 20, 50, 100, 999]}
          />
        </div>
      ) : (
        /* ================= GRID / CARD VIEW ================= */
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {paginatedTrackings.map((item) => {
              const stBadge = getStatusBadge(item['สถานะโครงการ']);
              const progress = Number(item['ความคืบหน้า (%)']) || 0;

              return (
                <div
                  key={item.ID}
                  className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    {/* Top tags */}
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-slate-100 text-slate-800 border border-slate-200">
                        ปีงบ พ.ศ. {item['ปีงบ']}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${stBadge.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${stBadge.dot}`} />
                        {item['สถานะโครงการ']}
                      </span>
                    </div>

                    {/* Project Name */}
                    <h3 className="text-sm font-bold text-slate-800 leading-snug line-clamp-2">
                      {item['ชื่อโครงการ']}
                    </h3>

                    {/* Development Issue */}
                    {item['ประเด็นการพัฒนา'] && (
                      <p className="text-[11px] text-emerald-800 bg-emerald-50/60 p-1.5 rounded border border-emerald-100 line-clamp-1">
                        <span className="font-semibold">ประเด็น: </span>
                        {item['ประเด็นการพัฒนา']}
                      </p>
                    )}

                    {/* Objective */}
                    {item['วัตถุประสงค์'] && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        <span className="font-semibold text-slate-700">วัตถุประสงค์: </span>
                        {item['วัตถุประสงค์']}
                      </p>
                    )}

                    {/* Details */}
                    {item['รายละเอียดโครงการ'] && (
                      <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 line-clamp-2">
                        <span className="font-semibold text-slate-700">รายละเอียด: </span>
                        {item['รายละเอียดโครงการ']}
                      </div>
                    )}

                    {/* Progress Gauge */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600">ความคืบหน้า</span>
                        <span className="font-mono font-bold text-emerald-700">{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/60">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(
                            progress,
                            item['สถานะโครงการ']
                          )}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Dates & Responsible */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block">เริ่มต้น:</span>
                        <span className="font-mono font-semibold">{item['วันที่เริ่มต้น'] || '-'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">สิ้นสุด:</span>
                        <span className="font-mono font-semibold">{item['วันที่คาดว่าจะสิ้นสุด'] || '-'}</span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate font-medium">{item['ผู้รับผิดชอบ'] || '-'}</span>
                      </div>
                    </div>

                    {/* Notes / Issues */}
                    {item['หมายเหตุ/ปัญหาที่พบ'] && (
                      <div className="text-[11px] text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200 line-clamp-2">
                        <span className="font-bold">ปัญหา/หมายเหตุ: </span>
                        {item['หมายเหตุ/ปัญหาที่พบ']}
                      </div>
                    )}
                  </div>

                  {/* Card footer actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setQuickUpdateItem(item);
                        setQuickProgressVal(Number(item['ความคืบหน้า (%)']) || 0);
                        setQuickStatusVal((item['สถานะโครงการ'] as TrackingStatus) || 'อยู่ระหว่างดำเนินการ');
                        setQuickNoteVal(item['หมายเหตุ/ปัญหาที่พบ'] || '');
                      }}
                      className="px-2.5 py-1 rounded text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition"
                    >
                      อัปเดต % คืบหน้า
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition"
                        title="แก้ไข"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`คุณต้องการลบรายการติดตามโครงการ "${item['ชื่อโครงการ']}" ใช่หรือไม่?`)) {
                            onDeleteTracking(item.ID);
                          }
                        }}
                        className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition"
                        title="ลบ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grid Footer - Standard Pagination */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden no-print">
            <TablePagination
              currentPage={currentPage}
              totalItems={filteredTrackings.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 20, 50, 100, 999]}
            />
          </div>
        </div>
      )}

      {/* ================= MODAL 1: ADD / EDIT PROJECT TRACKING ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-hidden">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header - Fixed/Sticky Top */}
            <div className="px-4 py-2.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center text-white shrink-0">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">
                    {editingItem ? 'แก้ไขรายการติดตามโครงการ' : 'บันทึกข้อมูลติดตามโครงการใหม่'}
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    กรอกข้อมูลติดตามผลการดำเนินงานและปัญหาอุปสรรค
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Container with Fixed Footer */}
            <form onSubmit={handleSaveModal} className="flex flex-col flex-1 overflow-hidden min-h-0">
              {/* Scrollable Form Body - Only middle section scrolls */}
              <div className="p-3 sm:p-4 space-y-2.5 overflow-y-auto custom-scrollbar flex-1 text-xs">
                {/* Quick import from approved projects button inside form */}
                <div className="p-2 sm:p-2.5 bg-emerald-50/80 rounded-lg border border-emerald-200 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-emerald-900 text-xs block leading-tight">
                        ดึงข้อมูลจากโครงการที่ได้รับอนุมัติงบประมาณ
                      </span>
                      <span className="text-[10px] text-emerald-700 leading-tight">
                        คลิกเพื่อเลือกโครงการในแผนที่อนุมัติงบ ระบบจะใส่ข้อมูลให้อัตโนมัติ
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsApprovedPickerOpen(true)}
                    className="px-2.5 py-1 rounded-md text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition shrink-0 cursor-pointer"
                  >
                    เลือกโครงการ
                  </button>
                </div>

                {/* Row 1: Fiscal Year (ปีงบ) & Development Issue (ประเด็นการพัฒนา) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      ปีงบ (พ.ศ.) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={modalYear}
                      onChange={(e) => setModalYear(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded-md font-semibold text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                    >
                      {YEARS.map((y) => (
                        <option key={y} value={y}>
                          พ.ศ. {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      ประเด็นการพัฒนา <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={modalIssue}
                      onChange={(e) => setModalIssue(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded-md font-semibold text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                    >
                      {(options['ประเด็นการพัฒนา'] || []).map((issue, idx) => (
                        <option key={idx} value={issue}>
                          {issue}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: Project Name (ชื่อโครงการ) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    ชื่อโครงการ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ระบุชื่อโครงการ เช่น โครงการก่อสร้างถนน คสล. ..."
                    value={modalProjectName}
                    onChange={(e) => setModalProjectName(e.target.value)}
                    className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-md font-semibold focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                {/* Row 3: Objective (วัตถุประสงค์) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">วัตถุประสงค์</label>
                  <textarea
                    rows={2}
                    placeholder="ระบุวัตถุประสงค์ของโครงการ..."
                    value={modalObjective}
                    onChange={(e) => setModalObjective(e.target.value)}
                    className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:bg-white resize-none"
                  />
                </div>

                {/* Row 4: Project Details (รายละเอียดโครงการ) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    รายละเอียดโครงการ (เป้าหมาย / ผลผลิต / กิจกรรมสำคัญ)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="ระบุเป้าหมาย ผลผลิต หรือรายละเอียดกิจกรรมโครงการ..."
                    value={modalDetails}
                    onChange={(e) => setModalDetails(e.target.value)}
                    className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:bg-white resize-none"
                  />
                </div>

                {/* Row 5: Status (สถานะโครงการ) & Progress % (ความคืบหน้า) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      สถานะโครงการ <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={modalStatus}
                      onChange={(e) => setModalStatus(e.target.value as TrackingStatus)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md font-bold text-emerald-800 focus:ring-1 focus:ring-emerald-500 text-xs"
                    >
                      {TRACKING_STATUS_LIST.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[11px] font-bold text-slate-700">
                        ความคืบหน้า (%) <span className="text-rose-500">*</span>
                      </label>
                      <span className="font-mono font-bold text-emerald-700 text-xs">
                        {modalProgress}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={modalProgress}
                      onChange={(e) => setModalProgress(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer h-1.5"
                    />
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      {[0, 25, 50, 75, 100].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setModalProgress(val)}
                          className={`px-1 py-0.2 rounded text-[9px] font-bold transition cursor-pointer ${
                            modalProgress === val
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {val}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Row 6: Start Date (วันที่เริ่มต้น) & Expected End Date (วันที่คาดว่าจะสิ้นสุด) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      วันที่เริ่มต้น
                    </label>
                    <input
                      type="date"
                      value={modalStartDate}
                      onChange={(e) => setModalStartDate(e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      วันที่คาดว่าจะสิ้นสุด
                    </label>
                    <input
                      type="date"
                      value={modalEndDate}
                      onChange={(e) => setModalEndDate(e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:bg-white font-mono"
                    />
                  </div>
                </div>

                {/* Row 7: Department & Responsible Person */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      หน่วยงาน / สำนัก-กอง <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={modalDepartment}
                      onChange={(e) => setModalDepartment(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded-md font-semibold text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                    >
                      {(options['หน่วยงานรับผิดชอบหลัก'] || STANDARD_DEPARTMENTS).map((dept, idx) => (
                        <option key={idx} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      ผู้รับผิดชอบ (ชื่อเจ้าหน้าที่) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น นายธวัชชัย โยธาการ"
                      value={modalResponsible}
                      onChange={(e) => setModalResponsible(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-md font-semibold focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Row 8: Budget Source & Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      แหล่งที่มาของงบประมาณ <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={modalBudgetSource}
                      onChange={(e) => setModalBudgetSource(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded-md font-semibold text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                    >
                      {(options['แหล่งที่มาของงบประมาณ'] || [
                        'เทศบัญญัติงบประมาณรายจ่ายประจำปี',
                        'เงินสะสม (จ่ายขาดเงินสะสม)',
                        'เงินอุดหนุนเฉพาะกิจ',
                        'เงินกู้/เงินอุดหนุนทั่วไป',
                        'งบกลาง',
                        'งบประมาณจังหวัด/กลุ่มจังหวัด'
                      ]).map((src, idx) => (
                        <option key={idx} value={src}>
                          {src}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      หมายเหตุ / ปัญหาที่พบ
                    </label>
                    <input
                      type="text"
                      placeholder="บันทึกปัญหา อุปสรรค ความล่าช้า..."
                      value={modalNotes}
                      onChange={(e) => setModalNotes(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Row 9: Financials (งบประมาณที่อนุมัติ, ลงนามสัญญา, เบิกจ่าย, คงเหลือ) */}
                <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-100 space-y-2">
                  <div className="text-[11px] font-bold text-blue-900 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-blue-600" />
                    <span>ข้อมูลทางการเงินและงบประมาณ (บาท)</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                        งบประมาณที่อนุมัติ
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={modalBudget}
                        onChange={(e) => setModalBudget(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded-md font-mono font-bold text-slate-800 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                        ลงนามสัญญา
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={modalContractAmount}
                        onChange={(e) => setModalContractAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded-md font-mono font-bold text-indigo-700 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                        เบิกจ่าย
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={modalDisbursed}
                        onChange={(e) => setModalDisbursed(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded-md font-mono font-bold text-emerald-700 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                        คงเหลือ (คำนวณอัตโนมัติ)
                      </label>
                      <div className="w-full px-2 py-1 text-xs bg-slate-100 border border-slate-200 rounded-md font-mono font-bold text-amber-800 text-right">
                        {formatMoney(
                          Math.max(
                            0,
                            (modalBudget !== '' ? Number(modalBudget) : 0) -
                              (modalDisbursed !== '' ? Number(modalDisbursed) : 0)
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer - Fixed/Sticky Bottom */}
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1 rounded-md text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded-md text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>บันทึกข้อมูลติดตาม</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: PROJECT PICKER (ดึงมาจากโครงการที่ได้รับอนุมัติงบประมาณ) ================= */}
      {isApprovedPickerOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-hidden">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-2.5 bg-emerald-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-300" />
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">
                    เลือกโครงการที่ได้รับการอนุมัติงบประมาณ
                  </h3>
                  <p className="text-[10px] text-emerald-200 leading-tight">
                    ดึงข้อมูลชื่อโครงการ วัตถุประสงค์ รายละเอียด และผู้รับผิดชอบ เพื่อนำมาติดตามผล
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsApprovedPickerOpen(false)}
                className="text-emerald-300 hover:text-white p-1 rounded-md transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 sm:p-4 space-y-2.5 flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-0">
              {/* Search & Filter */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="พิมพ์ค้นหาชื่อโครงการ หรือกองที่รับผิดชอบ..."
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <select
                  value={pickerYear}
                  onChange={(e) => setPickerYear(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-300 rounded-md px-2 py-1 font-semibold text-slate-700"
                >
                  <option value="ทั้งหมด">ทุกปีงบ</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      พ.ศ. {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Projects List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100 border border-slate-200 rounded-lg min-h-[160px]">
                {projects
                  .filter((p) => {
                    if (pickerYear !== 'ทั้งหมด' && String(p['ปี พ.ศ.']) !== pickerYear) return false;
                    if (pickerSearch.trim()) {
                      const q = pickerSearch.toLowerCase();
                      const name = (p['ชื่อโครงการ'] || '').toLowerCase();
                      const dept = (p['หน่วยงานรับผิดชอบหลัก'] || '').toLowerCase();
                      const obj = (p['วัตถุประสงค์'] || '').toLowerCase();
                      return name.includes(q) || dept.includes(q) || obj.includes(q);
                    }
                    return true;
                  })
                  .map((p) => {
                    const yr = Number(p['ปี พ.ศ.']) || 2571;
                    const budgetAmt =
                      Number(p[`งบประมาณ ${yr}` as keyof Project]) ||
                      Number(p['งบประมาณที่อนุมัติ']) ||
                      0;

                    return (
                      <div
                        key={p.ID}
                        className="p-2.5 hover:bg-emerald-50/60 transition flex items-start justify-between gap-2.5 group"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-1.5 py-0.2 rounded font-mono font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                              ปี {p['ปี พ.ศ.']}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {p['ประเภทรายการ']}
                            </span>
                            {p['สถานะงบประมาณ'] && (
                              <span className="text-[10px] font-medium text-slate-500">
                                • {p['สถานะงบประมาณ']}
                              </span>
                            )}
                          </div>

                          <h4 className="text-xs font-bold text-slate-800 leading-snug">
                            {p['ชื่อโครงการ']}
                          </h4>

                          {p['วัตถุประสงค์'] && (
                            <p className="text-[10px] text-slate-500 line-clamp-1">
                              วัตถุประสงค์: {p['วัตถุประสงค์']}
                            </p>
                          )}

                          <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-0.5">
                            <span className="font-medium text-slate-700">
                              {p['หน่วยงานรับผิดชอบหลัก'] || '-'}
                            </span>
                            <span>•</span>
                            <span className="font-mono font-bold text-amber-700">
                              งบประมาณ {formatMoney(budgetAmt)} บาท
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectApprovedProject(p)}
                          className="px-2.5 py-1 rounded-md text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition flex-shrink-0 flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>เลือกโครงการนี้</span>
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsApprovedPickerOpen(false)}
                className="px-3 py-1 rounded-md text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: QUICK PROGRESS UPDATE ================= */}
      {quickUpdateItem && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-4 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-800">อัปเดตความคืบหน้าโครงการ</h3>
              </div>
              <button
                onClick={() => setQuickUpdateItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-semibold text-slate-700 leading-snug line-clamp-2">
              {quickUpdateItem['ชื่อโครงการ']}
            </p>

            {/* Progress Slider */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">ความคืบหน้า (%)</span>
                <span className="font-mono font-black text-emerald-700 text-base">
                  {quickProgressVal}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={quickProgressVal}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setQuickProgressVal(val);
                  if (val >= 100) setQuickStatusVal('ดำเนินการแล้วเสร็จ');
                  else if (val > 0) setQuickStatusVal('อยู่ระหว่างดำเนินการ');
                }}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between gap-1">
                {[0, 25, 50, 75, 100].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      setQuickProgressVal(v);
                      if (v >= 100) setQuickStatusVal('ดำเนินการแล้วเสร็จ');
                      else if (v > 0) setQuickStatusVal('อยู่ระหว่างดำเนินการ');
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      quickProgressVal === v
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {v}%
                  </button>
                ))}
              </div>
            </div>

            {/* Status dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">สถานะโครงการ</label>
              <select
                value={quickStatusVal}
                onChange={(e) => setQuickStatusVal(e.target.value as TrackingStatus)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-bold text-emerald-800"
              >
                {TRACKING_STATUS_LIST.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes / Issues */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                หมายเหตุ / ปัญหาที่พบ (ถ้ามี)
              </label>
              <textarea
                rows={2}
                value={quickNoteVal}
                onChange={(e) => setQuickNoteVal(e.target.value)}
                placeholder="ระบุปัญหา หรือผลการตรวจรับงาน..."
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            {/* Buttons */}
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setQuickUpdateItem(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveQuickUpdate}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>บันทึกความคืบหน้า</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
