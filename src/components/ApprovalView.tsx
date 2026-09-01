import React, { useState, useMemo } from 'react';
import {
  CheckCircle,
  Plus,
  Layers,
  FileCheck2,
  Trash2,
  X,
  Save,
  Tag,
  Eye,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  BookOpen,
  Check,
  Edit3,
  Menu
} from 'lucide-react';
import { PlanApproval, Project, PlanType, ViewType } from '../types';
import { TYPE_LIST, YEARS, ORG_NAME, ORG_PROVINCE, STANDARD_DEPARTMENTS } from '../data/initialData';
import { TablePagination } from './TablePagination';
import { ApprovalWizardModal } from './ApprovalWizardModal';
import { StandardFilterBar } from './StandardFilterBar';
import { exportApprovals, exportProjects } from '../services/exportService';

interface ApprovalViewProps {
  approvals: PlanApproval[];
  projects: Project[];
  onSaveApproval: (data: Partial<PlanApproval>) => void;
  onDeleteApproval: (id: number) => void;
  onNavigate?: (view: ViewType) => void;
  onSelectProject?: (p: Project) => void;
  onToggleMobile?: () => void;
}

const PLAN_TYPE_BUTTONS = [
  'ทั้งหมด',
  'แผนพัฒนาท้องถิ่น ฉบับแรก',
  'แผนพัฒนาท้องถิ่น เพิ่มเติม',
  'แผนพัฒนาท้องถิ่น เปลี่ยนแปลง',
  'แผนพัฒนาท้องถิ่น แก้ไข'
];

export const ApprovalView: React.FC<ApprovalViewProps> = ({
  approvals,
  projects,
  onSaveApproval,
  onDeleteApproval,
  onNavigate,
  onSelectProject,
  onToggleMobile
}) => {
  // Navigation tabs: 'status' (สถานะการอนุมัติและประกาศใช้) and 'assembly' (จัดทำรอบการอนุมัติ)
  const [activeTab, setActiveTab] = useState<'status' | 'assembly'>('status');

  // Filter & Search states for "สถานะการอนุมัติและประกาศใช้"
  const [filterType, setFilterType] = useState<string>('ทั้งหมด');
  const [filterYear, setFilterYear] = useState<string>('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingApproval, setEditingApproval] = useState<PlanApproval | null>(null);
  const [inspectingApproval, setInspectingApproval] = useState<PlanApproval | null>(null);
  const [printingNoticeApproval, setPrintingNoticeApproval] = useState<PlanApproval | null>(null);

  // Pagination states for 'status' tab and 'assembly' tab
  const [statusPage, setStatusPage] = useState<number>(1);
  const [statusPageSize, setStatusPageSize] = useState<number>(20);

  const [assemblyPage, setAssemblyPage] = useState<number>(1);
  const [assemblyPageSize, setAssemblyPageSize] = useState<number>(20);

  // Assembly tab filters & selection
  const [assemblyFilterType, setAssemblyFilterType] = useState<string>('ทั้งหมด');
  const [assemblyDepartmentFilter, setAssemblyDepartmentFilter] = useState<string>('ทั้งหมด');
  const [assemblySearchQuery, setAssemblySearchQuery] = useState<string>('');
  const [assemblySelectedProjectIds, setAssemblySelectedProjectIds] = useState<number[]>([]);

  // Form State
  const [formType, setFormType] = useState<PlanType>('เพิ่มเติม');
  const [formNo, setFormNo] = useState<string>('1/2571');
  const [formYear, setFormYear] = useState<string>('2571');
  const [formDate, setFormDate] = useState<string>('');
  const [formEffectiveDate, setFormEffectiveDate] = useState<string>('');
  const [formDocNo, setFormDocNo] = useState<string>('');
  const [formApprover, setFormApprover] = useState<string>('นายกเทศมนตรีเมืองศิลา');
  const [formStatus, setFormStatus] = useState<'อนุมัติ' | 'ไม่อนุมัติ'>('อนุมัติ');
  const [formSelectedProjectIds, setFormSelectedProjectIds] = useState<number[]>([]);

  // Project map for quick lookup
  const projectMap = useMemo(() => {
    const map = new Map<number, Project>();
    projects.forEach((p) => map.set(p.ID, p));
    return map;
  }, [projects]);

  // List of unique departments from projects
  const departments = useMemo(() => {
    const set = new Set<string>(STANDARD_DEPARTMENTS);
    projects.forEach((p) => {
      if (p['หน่วยงานรับผิดชอบหลัก']) set.add(p['หน่วยงานรับผิดชอบหลัก']);
    });
    return Array.from(set);
  }, [projects]);

  // Get assigned project IDs across all approvals
  const assignedProjectIds = useMemo(() => {
    const set = new Set<number>();
    approvals.forEach((a) => {
      const ids = String(a.ProjectIDs || '')
        .split(',')
        .filter(Boolean)
        .map((s) => Number(s.trim()));
      ids.forEach((id) => set.add(id));
    });
    return set;
  }, [approvals]);

  // Map each project ID to its assigned approval round (if any)
  const projectApprovalMap = useMemo(() => {
    const map = new Map<number, PlanApproval>();
    approvals.forEach((a) => {
      const ids = String(a.ProjectIDs || '')
        .split(',')
        .filter(Boolean)
        .map((s) => Number(s.trim()));
      ids.forEach((id) => {
        if (!map.has(id)) {
          map.set(id, a);
        }
      });
    });
    return map;
  }, [approvals]);

  // Filtered approvals list for "สถานะการอนุมัติและประกาศใช้"
  const filteredApprovals = useMemo(() => {
    return approvals.filter((a) => {
      // Type filter
      if (filterType !== 'ทั้งหมด') {
        const cleanType = a['ประเภท']?.replace('แผนพัฒนาท้องถิ่น ', '');
        const targetClean = filterType.replace('แผนพัฒนาท้องถิ่น ', '');
        if (cleanType !== targetClean && a['ประเภท'] !== filterType) return false;
      }

      // Year filter
      if (filterYear !== 'ทั้งหมด' && String(a['ปี พ.ศ.']) !== String(filterYear)) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const noMatch = (a['ครั้งที่'] || '').toLowerCase().includes(q);
        const docMatch = (a['เลขที่ประกาศ'] || '').toLowerCase().includes(q);
        const approverMatch = (a['ผู้อนุมัติ'] || '').toLowerCase().includes(q);
        const typeMatch = (a['ประเภท'] || '').toLowerCase().includes(q);
        if (!noMatch && !docMatch && !approverMatch && !typeMatch) return false;
      }
      return true;
    });
  }, [approvals, filterType, filterYear, searchQuery]);

  // Filtered unassigned projects list for "จัดทำรอบการอนุมัติ"
  const unassignedProjects = useMemo(() => {
    return projects.filter((p) => {
      // Type filter
      if (assemblyFilterType !== 'ทั้งหมด') {
        const cleanPType = (p['ประเภทรายการ'] || 'ฉบับแรก').replace('แผนพัฒนาท้องถิ่น ', '');
        const targetClean = assemblyFilterType.replace('แผนพัฒนาท้องถิ่น ', '');
        if (cleanPType !== targetClean && (p['ประเภทรายการ'] || 'ฉบับแรก') !== assemblyFilterType) {
          return false;
        }
      }

      // Department filter
      if (assemblyDepartmentFilter !== 'ทั้งหมด' && p['หน่วยงานรับผิดชอบหลัก'] !== assemblyDepartmentFilter) {
        return false;
      }

      // Search filter
      if (assemblySearchQuery.trim()) {
        const q = assemblySearchQuery.toLowerCase();
        const nameMatch = (p['ชื่อโครงการ'] || '').toLowerCase().includes(q);
        const objMatch = (p['วัตถุประสงค์'] || '').toLowerCase().includes(q);
        const deptMatch = (p['หน่วยงานรับผิดชอบหลัก'] || '').toLowerCase().includes(q);
        const idMatch = String(p.ID).includes(q);
        if (!nameMatch && !objMatch && !deptMatch && !idMatch) return false;
      }

      return true;
    });
  }, [projects, assemblyFilterType, assemblyDepartmentFilter, assemblySearchQuery]);

  // Paginated approvals for 'status' tab
  const paginatedApprovals = useMemo(() => {
    if (statusPageSize >= 999 || statusPageSize === 0) return filteredApprovals;
    const startIndex = (statusPage - 1) * statusPageSize;
    return filteredApprovals.slice(startIndex, startIndex + statusPageSize);
  }, [filteredApprovals, statusPage, statusPageSize]);

  // Paginated unassigned projects for 'assembly' tab
  const paginatedAssemblyProjects = useMemo(() => {
    if (assemblyPageSize >= 999 || assemblyPageSize === 0) return unassignedProjects;
    const startIndex = (assemblyPage - 1) * assemblyPageSize;
    return unassignedProjects.slice(startIndex, startIndex + assemblyPageSize);
  }, [unassignedProjects, assemblyPage, assemblyPageSize]);

  // Total summary metrics
  const summaryMetrics = useMemo(() => {
    const totalBatches = approvals.length;
    const totalAssignedProjects = assignedProjectIds.size;
    let totalPromulgatedBudget = 0;

    assignedProjectIds.forEach((id) => {
      const p = projectMap.get(id);
      if (p) {
        totalPromulgatedBudget +=
          (Number(p['งบประมาณ 2571']) || 0) +
          (Number(p['งบประมาณ 2572']) || 0) +
          (Number(p['งบประมาณ 2573']) || 0) +
          (Number(p['งบประมาณ 2574']) || 0) +
          (Number(p['งบประมาณ 2575']) || 0);
      }
    });

    const unassignedCount = projects.filter((p) => !assignedProjectIds.has(p.ID)).length;

    return {
      totalBatches,
      totalAssignedProjects,
      totalPromulgatedBudget,
      unassignedCount,
      latestBatch: approvals[0]
    };
  }, [approvals, projects, projectMap, assignedProjectIds]);

  // Helper formatting money
  const formatMoney = (n: number | undefined | null): string => {
    const val = Number(n) || 0;
    return val.toLocaleString('th-TH');
  };

  // Helper type badge with distinctive, clean colors
  const getTypeBadge = (t: string) => {
    const clean = t?.replace('แผนพัฒนาท้องถิ่น ', '') || t;
    let color = 'bg-slate-100 text-slate-700 border-slate-200';
    if (clean === 'เพิ่มเติม') color = 'bg-sky-50 text-sky-800 border-sky-300';
    if (clean === 'เปลี่ยนแปลง') color = 'bg-purple-50 text-purple-800 border-purple-300';
    if (clean === 'แก้ไข') color = 'bg-amber-50 text-amber-800 border-amber-300';
    if (clean === 'ฉบับแรก') color = 'bg-emerald-50 text-emerald-800 border-emerald-300';

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${color}`}>
        {clean.startsWith('แผนพัฒนาท้องถิ่น') ? clean : `แผนพัฒนาท้องถิ่น ${clean}`}
      </span>
    );
  };

  // Helper status badge: อนุมัติ / ไม่อนุมัติ
  const getStatusBadge = (status?: string) => {
    const s = status || 'อนุมัติ';
    if (s === 'อนุมัติ' || s === 'ประกาศใช้แล้ว') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> อนุมัติ
        </span>
      );
    }
    if (s === 'ไม่อนุมัติ' || s === 'ยกเลิก') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
          <XCircle className="w-3.5 h-3.5 text-rose-600" /> ไม่อนุมัติ
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
        {s}
      </span>
    );
  };

  // Open Create Modal: "เพิ่มการอนุมัติและประกาศใช้"
  const handleOpenCreateModal = (preselectedType?: PlanType, preselectedIds?: number[]) => {
    const defaultType = preselectedType || 'เพิ่มเติม';
    setEditingApproval(null);
    setFormType(defaultType);
    setFormNo(defaultType === 'ฉบับแรก' ? 'ฉบับแรก' : `1/${YEARS[0]}`);
    setFormYear(String(YEARS[0]));
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormEffectiveDate(new Date().toISOString().split('T')[0]);
    setFormDocNo(
      defaultType === 'ฉบับแรก'
        ? `ประกาศ${ORG_NAME} เรื่อง ประกาศใช้แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575)`
        : `ประกาศ${ORG_NAME} เรื่อง ประกาศใช้แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) ${defaultType} ครั้งที่ 1/${YEARS[0]}`
    );
    setFormApprover('นายกเทศมนตรีเมืองศิลา');
    setFormStatus('อนุมัติ');
    setFormSelectedProjectIds(preselectedIds || []);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (a: PlanApproval) => {
    setEditingApproval(a);
    const cleanType = (a['ประเภท']?.replace('แผนพัฒนาท้องถิ่น ', '') as PlanType) || 'เพิ่มเติม';
    setFormType(cleanType);
    setFormNo(a['ครั้งที่'] || '');
    setFormYear(String(a['ปี พ.ศ.'] || YEARS[0]));
    setFormDate(a['วันที่อนุมัติประกาศใช้'] || '');
    setFormEffectiveDate(a['วันที่มีผลบังคับใช้'] || a['วันที่อนุมัติประกาศใช้'] || '');
    setFormDocNo(a['เลขที่ประกาศ'] || '');
    setFormApprover(a['ผู้อนุมัติ'] || 'นายกเทศมนตรีเมืองศิลา');
    const st = a['สถานะการประกาศ'] === 'ไม่อนุมัติ' ? 'ไม่อนุมัติ' : 'อนุมัติ';
    setFormStatus(st);
    const ids = String(a.ProjectIDs || '')
      .split(',')
      .filter(Boolean)
      .map((s) => Number(s.trim()));
    setFormSelectedProjectIds(ids);
    setIsFormModalOpen(true);
  };

  // Save Approval Batch
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNo.trim()) {
      alert('กรุณาระบุครั้งที่อนุมัติ');
      return;
    }
    if (!formDate) {
      alert('กรุณาระบุวันที่อนุมัติประกาศใช้');
      return;
    }

    onSaveApproval({
      ID: editingApproval ? editingApproval.ID : undefined,
      'ประเภท': formType,
      'ครั้งที่': formNo.trim(),
      'ปี พ.ศ.': formYear.trim(),
      'วันที่อนุมัติประกาศใช้': formDate,
      'วันที่มีผลบังคับใช้': formEffectiveDate || formDate,
      'เลขที่ประกาศ': formDocNo.trim(),
      'ผู้อนุมัติ': formApprover.trim() || 'นายกเทศมนตรีเมืองศิลา',
      'ผู้ลงนาม': formApprover.trim() || 'นายกเทศมนตรีเมืองศิลา',
      'สถานะการประกาศ': formStatus,
      'ProjectIDs': formSelectedProjectIds.join(','),
      'จำนวนโครงการ': formSelectedProjectIds.length
    });

    setIsFormModalOpen(false);
  };

  // Toggle project in form modal
  const toggleFormProject = (id: number) => {
    setFormSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  // Toggle project in assembly tab
  const toggleAssemblyProject = (id: number) => {
    setAssemblySelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  // Select all in assembly tab
  const handleSelectAllAssembly = () => {
    if (assemblySelectedProjectIds.length === unassignedProjects.length) {
      setAssemblySelectedProjectIds([]);
    } else {
      setAssemblySelectedProjectIds(unassignedProjects.map((p) => p.ID));
    }
  };

  // Calculate live budget for selected projects in form
  const formCalculatedBudget = useMemo(() => {
    let total = 0;
    formSelectedProjectIds.forEach((id) => {
      const p = projectMap.get(id);
      if (p) {
        YEARS.forEach((yr) => {
          total += Number((p as any)[`งบประมาณ ${yr}`]) || 0;
        });
      }
    });
    return total;
  }, [formSelectedProjectIds, projectMap]);

  // Calculate live budget for selected projects in assembly tab
  const assemblyCalculatedBudget = useMemo(() => {
    let total = 0;
    assemblySelectedProjectIds.forEach((id) => {
      const p = projectMap.get(id);
      if (p) {
        YEARS.forEach((yr) => {
          total += Number((p as any)[`งบประมาณ ${yr}`]) || 0;
        });
      }
    });
    return total;
  }, [assemblySelectedProjectIds, projectMap]);

  return (
    <div id="approval-view-root" className="space-y-3 pb-8">
      {/* ================= 1-3. UNIFIED TOP CONTAINER (HEADER, ACTION BAR, FILTER BAR) ================= */}
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
              <CheckCircle className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold leading-tight flex items-center gap-2 flex-wrap">
                <span>ระบบอนุมัติและประกาศใช้แผนพัฒนาท้องถิ่น</span>
                <span className="text-emerald-300 font-normal">|</span>
                <span className="text-emerald-100 text-xs sm:text-sm font-semibold">
                  แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) | เทศบาลเมืองศิลา
                </span>
              </h2>
            </div>
          </div>
        </div>

        {/* Standardized Filter Component */}
        <StandardFilterBar
          selectedYear={filterYear}
          onYearChange={(yr) => setFilterYear(yr)}
          allYearsLabel="ทั้งหมด (2571-2575)"
          issueLabel="ประเภทแผน"
          issueValue={activeTab === 'status' ? filterType : assemblyFilterType}
          onIssueChange={(val) => {
            if (activeTab === 'status') {
              setFilterType(val);
            } else {
              setAssemblyFilterType(val);
              setAssemblySelectedProjectIds([]);
            }
          }}
          issueOptions={[
            'แผนพัฒนาท้องถิ่น ฉบับแรก',
            'แผนพัฒนาท้องถิ่น เพิ่มเติม',
            'แผนพัฒนาท้องถิ่น เปลี่ยนแปลง',
            'แผนพัฒนาท้องถิ่น แก้ไข'
          ]}
          issueAllLabel="-- ทุกประเภทแผน --"
          departmentLabel="หน่วยงานรับผิดชอบ"
          departmentValue={assemblyDepartmentFilter}
          onDepartmentChange={(val) => setAssemblyDepartmentFilter(val)}
          departmentOptions={departments}
          departmentAllLabel="-- ทุกหน่วยงาน --"
          searchLabel="ค้นหาข้อมูล"
          searchValue={activeTab === 'status' ? searchQuery : assemblySearchQuery}
          onSearchChange={(val) => {
            if (activeTab === 'status') {
              setSearchQuery(val);
            } else {
              setAssemblySearchQuery(val);
            }
          }}
          searchPlaceholder={
            activeTab === 'status'
              ? 'ค้นหาครั้งที่, ผู้อนุมัติ, เลขที่ประกาศ...'
              : 'ค้นหาชื่อโครงการ, วัตถุประสงค์...'
          }
          budgetLabel="งบประมาณ (บาท)"
          budgetValue=""
          onBudgetChange={() => {}}
          budgetPlaceholder="ระบุจำนวนเงิน..."
          onSearch={() => {}}
          onShowAll={() => {
            setFilterYear('ทั้งหมด');
            setFilterType('ทั้งหมด');
            setAssemblyFilterType('ทั้งหมด');
            setAssemblyDepartmentFilter('ทั้งหมด');
            setSearchQuery('');
            setAssemblySearchQuery('');
          }}
          onReset={() => {
            setFilterYear('ทั้งหมด');
            setFilterType('ทั้งหมด');
            setAssemblyFilterType('ทั้งหมด');
            setAssemblyDepartmentFilter('ทั้งหมด');
            setSearchQuery('');
            setAssemblySearchQuery('');
          }}
          onExportExcel={() => exportApprovals(filteredApprovals, 'excel')}
          onExportCsv={() => exportApprovals(filteredApprovals, 'csv')}
          exportItemsCount={filteredApprovals.length}
          onPrint={() => window.print()}
          extraControlsCenter={
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('status')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold text-xs transition cursor-pointer ${
                  activeTab === 'status'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <CheckCircle className={`w-3.5 h-3.5 ${activeTab === 'status' ? 'text-white' : 'text-emerald-600'}`} />
                <span>สถานะประกาศใช้ ({summaryMetrics.totalBatches})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('assembly')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold text-xs transition cursor-pointer ${
                  activeTab === 'assembly'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Layers className={`w-3.5 h-3.5 ${activeTab === 'assembly' ? 'text-white' : 'text-sky-600'}`} />
                <span>จัดทำรอบ ({summaryMetrics.unassignedCount})</span>
              </button>
            </div>
          }
          actionButton={
            <button
              type="button"
              onClick={() => handleOpenCreateModal('เพิ่มเติม')}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-bold shadow-2xs transition cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ เพิ่มการอนุมัติและประกาศใช้</span>
            </button>
          }
        />
      </div>

      {/* บรรทัดที่ 4: Dashboard Stats (1 เด่น + Stat Strip แนวนอนตามหลัก Progressive Disclosure) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* การ์ดเด่น: ฉบับที่ประกาศใช้ (Hero Card) */}
        <div className="lg:col-span-4 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 text-white rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 text-[11px] font-semibold border border-emerald-400/30">
                <BookOpen className="w-3.5 h-3.5" />
                ตัวชี้วัดหลัก
              </span>
              <div className="text-xs text-emerald-200 mt-2 font-medium">ประกาศใช้แผนพัฒนาท้องถิ่น</div>
              <div className="text-3xl font-black font-mono tracking-tight mt-1">
                {summaryMetrics.totalBatches}{' '}
                <span className="text-sm font-sans font-normal text-emerald-200">ฉบับ</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
              <CheckCircle2 className="w-6 h-6 text-emerald-300" />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-emerald-600/50 flex items-center justify-between text-[11px] text-emerald-100">
            <span>สถานะระบบ:</span>
            <span className="font-semibold text-white flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              อนุมัติประกาศใช้พร้อมปฏิบัติ
            </span>
          </div>
        </div>

        {/* Stat Strip แนวนอน (3 เมทริกซ์รอง: โครงการในประกาศ, งบรวม 5 ปี, รอจัดรอบ) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 h-full">
            {/* Stat 1: โครงการในประกาศ */}
            <div className="flex sm:flex-col justify-between sm:justify-center items-center sm:items-start p-2 sm:px-3">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <span>โครงการในประกาศ</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-1 sm:mt-2">
                {summaryMetrics.totalAssignedProjects}{' '}
                <span className="text-xs font-normal text-slate-500 font-sans">โครงการ</span>
              </div>
              <div className="text-[10px] text-slate-400 hidden sm:block mt-0.5">
                บรรจุในรอบประกาศใช้แล้ว
              </div>
            </div>

            {/* Stat 2: งบประมาณรวม 5 ปีที่ประกาศ */}
            <div className="flex sm:flex-col justify-between sm:justify-center items-center sm:items-start p-2 sm:px-3">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 border border-sky-100">
                  <Award className="w-4 h-4" />
                </div>
                <span>งบรวม 5 ปีที่ประกาศ</span>
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 mt-1 sm:mt-2 truncate max-w-full">
                ฿{formatMoney(summaryMetrics.totalPromulgatedBudget)}{' '}
                <span className="text-xs font-normal text-slate-500 font-sans">บาท</span>
              </div>
              <div className="text-[10px] text-slate-400 hidden sm:block mt-0.5">
                งบประมาณโครงการในประกาศ
              </div>
            </div>

            {/* Stat 3: รอจัดรอบประกาศ */}
            <div className="flex sm:flex-col justify-between sm:justify-center items-center sm:items-start p-2 sm:px-3">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
                  <Clock className="w-4 h-4" />
                </div>
                <span>รอจัดรอบประกาศ</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-1 sm:mt-2">
                {summaryMetrics.unassignedCount}{' '}
                <span className="text-xs font-normal text-slate-500 font-sans">โครงการ</span>
              </div>
              <div className="text-[10px] text-amber-600 hidden sm:block mt-0.5">
                โครงการที่ยังไม่มีรอบประกาศ
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4 (Data View): Table without duplicate filter */}
      {activeTab === 'status' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="sticky top-0 z-20">
                <tr className="bg-[#065F46] text-white shadow-xs">
                  <th className="py-2.5 px-3 text-center w-12 font-bold whitespace-nowrap border-r border-white/15">ที่</th>
                  <th className="py-2.5 px-3.5 font-bold text-center whitespace-nowrap border-r border-white/15">ประเภทแผน</th>
                  <th className="py-2.5 px-3 font-bold text-center whitespace-nowrap border-r border-white/15">ครั้งที่ / ปี พ.ศ.</th>
                  <th className="py-2.5 px-3.5 font-bold text-center whitespace-nowrap border-r border-white/15">วันที่อนุมัติ / ประกาศ</th>
                  <th className="py-2.5 px-3 font-bold text-center whitespace-nowrap border-r border-white/15">จำนวนโครงการ</th>
                  <th className="py-2.5 px-3 font-bold text-center whitespace-nowrap border-r border-white/15">สถานะ</th>
                  <th className="py-2.5 px-3 font-bold text-center whitespace-nowrap w-24">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedApprovals.length > 0 ? (
                  paginatedApprovals.map((a, idx) => {
                    const linkedIds = String(a.ProjectIDs || '')
                      .split(',')
                      .filter(Boolean)
                      .map((s) => Number(s.trim()));
                    const linkedProjectCount = a['จำนวนโครงการ'] !== undefined ? a['จำนวนโครงการ'] : linkedIds.length;
                    const globalIdx = (statusPageSize >= 999 || statusPageSize === 0 ? 0 : (statusPage - 1) * statusPageSize) + idx;

                    return (
                      <tr
                        key={a.ID}
                        onClick={() => setInspectingApproval(a)}
                        className="hover:bg-emerald-50/60 cursor-pointer transition duration-150 group"
                        title="คลิกแถวนี้เพื่อดูรายละเอียดบัญชีโครงการที่บรรจุในรอบนี้"
                      >
                        <td className="py-3 px-3 text-center font-bold text-slate-700 font-mono group-hover:text-emerald-700">
                          {globalIdx + 1}
                        </td>
                        <td className="py-3 px-3">{getTypeBadge(a['ประเภท'])}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-900 font-mono">
                          <div>{a['ครั้งที่']}</div>
                          <div className="text-[10px] text-slate-400 font-normal">พ.ศ. {a['ปี พ.ศ.']}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800">{a['วันที่อนุมัติประกาศใช้']}</div>
                          {a['วันที่มีผลบังคับใช้'] && a['วันที่มีผลบังคับใช้'] !== a['วันที่อนุมัติประกาศใช้'] && (
                            <div className="text-[10px] text-slate-400">
                              มีผล: {a['วันที่มีผลบังคับใช้']}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 group-hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold transition text-xs"
                          >
                            <Tag className="w-3 h-3 text-emerald-600" />
                            <span>{linkedProjectCount} โครงการ</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {getStatusBadge(a['สถานะการประกาศ'])}
                        </td>
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setInspectingApproval(a)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-100/60 transition"
                              title="ดูรายละเอียดโครงการ"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPrintingNoticeApproval(a)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition"
                              title="พิมพ์ประกาศ"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(a)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 transition"
                              title="แก้ไขข้อมูลรอบการอนุมัติ"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`คุณต้องการลบรอบการอนุมัติ ${a['ประเภท']} ครั้งที่ ${a['ครั้งที่']} หรือไม่?`)) {
                                  onDeleteApproval(a.ID);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="ลบรอบการอนุมัติ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                      ไม่พบข้อมูลการอนุมัติประกาศใช้แผนตามเงื่อนไขที่เลือก
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer - Standard Pagination */}
          <TablePagination
            currentPage={statusPage}
            totalItems={filteredApprovals.length}
            pageSize={statusPageSize}
            onPageChange={setStatusPage}
            onPageSizeChange={setStatusPageSize}
            pageSizeOptions={[10, 20, 50, 100, 999]}
          />
        </div>
      )}

      {/* SECTION: จัดทำรอบการอนุมัติ (รวบรวมโครงการ) */}
      {activeTab === 'assembly' && (
        <div className="space-y-3">
          {/* Filtering & Action Bar for Assembly */}
          <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-500 font-bold flex items-center gap-1 text-[11px] pl-1">
                <Filter className="w-3.5 h-3.5 text-emerald-600" />
                ประเภท:
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                {TYPE_LIST.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setAssemblyFilterType(t);
                      setAssemblySelectedProjectIds([]);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border transition cursor-pointer ${
                      assemblyFilterType === t
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200/80'
                    }`}
                  >
                    {t} ({projects.filter((p) => (p['ประเภทรายการ'] || 'ฉบับแรก') === t).length})
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 ml-0 lg:ml-2">
                <span className="text-slate-500 font-semibold text-[11px]">สำนัก/กอง:</span>
                <select
                  value={assemblyDepartmentFilter}
                  onChange={(e) => setAssemblyDepartmentFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200/90 rounded-lg px-2 py-1 text-slate-800 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                >
                  <option value="ทั้งหมด">ทุกสำนัก/กอง</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assembly Search */}
              <div className="relative min-w-[170px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="ค้นหาโครงการ..."
                  value={assemblySearchQuery}
                  onChange={(e) => setAssemblySearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/90 rounded-lg pl-8 pr-2.5 py-1 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs transition"
                />
              </div>
            </div>

            {/* Selection status and Action Button */}
            <div className="flex items-center justify-between lg:justify-end gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 flex-wrap">
              <div className="text-[11px] text-slate-600">
                เลือก <span className="font-bold text-emerald-700 font-mono text-xs">{assemblySelectedProjectIds.length}</span> จาก {unassignedProjects.length}
                {assemblyCalculatedBudget > 0 && (
                  <span className="ml-1 font-mono text-slate-800 font-bold">
                    ({formatMoney(assemblyCalculatedBudget)} บ.)
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleSelectAllAssembly}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition cursor-pointer"
              >
                {assemblySelectedProjectIds.length === unassignedProjects.length && unassignedProjects.length > 0
                  ? 'ยกเลิกเลือก'
                  : 'เลือกทั้งหมด'}
              </button>
              <button
                disabled={assemblySelectedProjectIds.length === 0}
                onClick={() => {
                  handleOpenCreateModal(
                    assemblyFilterType !== 'ทั้งหมด' ? (assemblyFilterType as PlanType) : 'เพิ่มเติม',
                    assemblySelectedProjectIds
                  );
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-xs shadow-2xs transition cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>+ จัดรอบประกาศ ({assemblySelectedProjectIds.length})</span>
              </button>
            </div>
          </div>

          {/* Projects Selection Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="sticky top-0 z-20">
                  <tr className="bg-[#065F46] text-white shadow-xs">
                    <th className="py-2.5 px-3 text-center w-10 border-r border-white/15">
                      <input
                        type="checkbox"
                        checked={unassignedProjects.length > 0 && assemblySelectedProjectIds.length === unassignedProjects.length}
                        onChange={handleSelectAllAssembly}
                        className="rounded border-slate-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-3 text-center w-12 font-bold border-r border-white/15">ID</th>
                    <th className="py-2.5 px-3 font-bold text-center whitespace-nowrap border-r border-white/15">ประเภท</th>
                    <th className="py-2.5 px-3 font-bold min-w-[200px] border-r border-white/15">ชื่อโครงการ / วัตถุประสงค์</th>
                    <th className="py-2.5 px-3 font-bold text-center whitespace-nowrap border-r border-white/15">หน่วยงานรับผิดชอบ</th>
                    <th className="py-2.5 px-3 font-bold min-w-[160px] border-r border-white/15">ประเด็นยุทธศาสตร์ / แผนงาน</th>
                    <th className="py-2.5 px-3 font-bold text-center whitespace-nowrap border-r border-white/15">งบประมาณรวม 5 ปี</th>
                    <th className="py-2.5 px-3 font-bold text-center whitespace-nowrap">สถานะบรรจุแผน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedAssemblyProjects.length > 0 ? (
                    paginatedAssemblyProjects.map((p) => {
                      const isSelected = assemblySelectedProjectIds.includes(p.ID);
                      const isAlreadyAssigned = assignedProjectIds.has(p.ID);
                      const total5Y =
                        (Number(p['งบประมาณ 2571']) || 0) +
                        (Number(p['งบประมาณ 2572']) || 0) +
                        (Number(p['งบประมาณ 2573']) || 0) +
                        (Number(p['งบประมาณ 2574']) || 0) +
                        (Number(p['งบประมาณ 2575']) || 0);

                      return (
                        <tr
                          key={p.ID}
                          onClick={() => toggleAssemblyProject(p.ID)}
                          className={`cursor-pointer transition ${
                            isSelected
                              ? 'bg-emerald-50/70 hover:bg-emerald-100/60'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleAssemblyProject(p.ID)}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-700 font-mono">
                            #{p.ID}
                          </td>
                          <td className="py-2.5 px-3">{getTypeBadge(p['ประเภทรายการ'] || 'ฉบับแรก')}</td>
                          <td className="py-2.5 px-3 max-w-sm">
                            <div className="font-bold text-slate-900 leading-snug">{p['ชื่อโครงการ']}</div>
                            <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {p['เป้าหมาย (ผลผลิต)'] || p['วัตถุประสงค์']}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-700">
                            {p['หน่วยงานรับผิดชอบหลัก'] || '-'}
                          </td>
                          <td className="py-2.5 px-3 max-w-xs">
                            <div className="text-[11px] text-slate-700 line-clamp-1">
                              {p['ประเด็นการพัฒนา']}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {p['แผนงาน']}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            {formatMoney(total5Y)} <span className="text-[10px] font-normal text-slate-400">บาท</span>
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            {isAlreadyAssigned ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <Check className="w-3 h-3" /> มีรอบประกาศแล้ว
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                <Clock className="w-3 h-3" /> รอจัดรอบประกาศ
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                        ไม่พบโครงการตามประเภทหรือสำนัก/กองที่เลือก
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer - Standard Pagination */}
            <TablePagination
              currentPage={assemblyPage}
              totalItems={unassignedProjects.length}
              pageSize={assemblyPageSize}
              onPageChange={setAssemblyPage}
              onPageSizeChange={setAssemblyPageSize}
              pageSizeOptions={[10, 20, 50, 100, 999]}
            />
          </div>
        </div>
      )}

      {/* MODAL 1: เพิ่ม/แก้ไขการอนุมัติและประกาศใช้ (3-Step Wizard Modal) */}
      <ApprovalWizardModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={onSaveApproval}
        editingApproval={editingApproval}
        projects={projects}
        preselectedType={formType}
        preselectedProjectIds={formSelectedProjectIds}
      />

      {/* MODAL 2: VIEW BATCH PROJECTS DETAIL */}
      {inspectingApproval && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-3 backdrop-blur-2xs">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[92vh] flex flex-col p-4 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-bold text-slate-900">
                  รายละเอียดรอบการอนุมัติ: {inspectingApproval['ประเภท']} ครั้งที่ {inspectingApproval['ครั้งที่']}
                </span>
                {getTypeBadge(inspectingApproval['ประเภท'])}
                {getStatusBadge(inspectingApproval['สถานะการประกาศ'])}
              </div>
              <button
                onClick={() => setInspectingApproval(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 overflow-y-auto flex-1 py-3 text-xs pr-1">
              {/* Batch Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">วันที่อนุมัติประกาศใช้:</span>
                  <span className="font-bold text-slate-800">{inspectingApproval['วันที่อนุมัติประกาศใช้']}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">วันที่มีผลบังคับใช้:</span>
                  <span className="font-bold text-slate-800">{inspectingApproval['วันที่มีผลบังคับใช้'] || inspectingApproval['วันที่อนุมัติประกาศใช้']}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">ผู้อนุมัติ:</span>
                  <span className="font-bold text-slate-800">{inspectingApproval['ผู้อนุมัติ'] || 'นายกเทศมนตรีเมืองศิลา'}</span>
                </div>
              </div>

              {/* Projects in Batch Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-emerald-600" />
                    บัญชีโครงการที่บรรจุในรอบนี้
                  </h4>
                </div>

                {(() => {
                  const linkedIds = String(inspectingApproval.ProjectIDs || '')
                    .split(',')
                    .filter(Boolean)
                    .map((s) => Number(s.trim()));
                  const batchProjects = projects.filter((p) => linkedIds.includes(p.ID));

                  let sum71 = 0, sum72 = 0, sum73 = 0, sum74 = 0, sum75 = 0, sumTotal = 0;
                  batchProjects.forEach((p) => {
                    sum71 += Number(p['งบประมาณ 2571']) || 0;
                    sum72 += Number(p['งบประมาณ 2572']) || 0;
                    sum73 += Number(p['งบประมาณ 2573']) || 0;
                    sum74 += Number(p['งบประมาณ 2574']) || 0;
                    sum75 += Number(p['งบประมาณ 2575']) || 0;
                    sumTotal +=
                      (Number(p['งบประมาณ 2571']) || 0) +
                      (Number(p['งบประมาณ 2572']) || 0) +
                      (Number(p['งบประมาณ 2573']) || 0) +
                      (Number(p['งบประมาณ 2574']) || 0) +
                      (Number(p['งบประมาณ 2575']) || 0);
                  });

                  return (
                    <div className="border border-slate-200 rounded-lg overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse min-w-[980px]">
                        <thead>
                          <tr className="bg-slate-800 text-white border-b border-slate-700">
                            <th rowSpan={2} className="py-2.5 px-2.5 text-center w-10 font-bold border-r border-slate-700">ที่</th>
                            <th rowSpan={2} className="py-2.5 px-2.5 font-bold min-w-[180px] border-r border-slate-700">โครงการ</th>
                            <th rowSpan={2} className="py-2.5 px-2.5 font-bold min-w-[140px] border-r border-slate-700">วัตถุประสงค์</th>
                            <th rowSpan={2} className="py-2.5 px-2.5 font-bold min-w-[140px] border-r border-slate-700">เป้าหมาย (ผลผลิตโครงการ)</th>
                            <th colSpan={5} className="py-1.5 px-2 text-center font-bold border-r border-slate-700 bg-slate-850">
                              งบประมาณและที่มา (บาท)
                            </th>
                            <th rowSpan={2} className="py-2.5 px-2.5 font-bold min-w-[140px] border-r border-slate-700">ผลที่คาดว่าจะได้รับ</th>
                            <th rowSpan={2} className="py-2.5 px-2.5 font-bold min-w-[120px]">หน่วยงานผู้รับผิดชอบ</th>
                          </tr>
                          <tr className="bg-slate-900 text-white border-b border-slate-700">
                            <th className="py-1.5 px-2 text-right border-r border-slate-700 font-medium">ปี 2571</th>
                            <th className="py-1.5 px-2 text-right border-r border-slate-700 font-medium">ปี 2572</th>
                            <th className="py-1.5 px-2 text-right border-r border-slate-700 font-medium">ปี 2573</th>
                            <th className="py-1.5 px-2 text-right border-r border-slate-700 font-medium">ปี 2574</th>
                            <th className="py-1.5 px-2 text-right border-r border-slate-700 font-medium">ปี 2575</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {batchProjects.length > 0 ? (
                            batchProjects.map((p, pIdx) => (
                              <tr key={p.ID} className="hover:bg-slate-50">
                                <td className="py-2 px-2.5 text-center font-mono font-bold text-slate-700 border-r border-slate-100">
                                  {pIdx + 1}
                                </td>
                                <td className="py-2 px-2.5 border-r border-slate-100">
                                  <div className="font-bold text-slate-900">{p['ชื่อโครงการ']}</div>
                                  {p['ประเด็นการพัฒนา'] && (
                                    <div className="text-[10px] text-slate-400 mt-0.5">{p['ประเด็นการพัฒนา']}</div>
                                  )}
                                </td>
                                <td className="py-2 px-2.5 text-slate-600 border-r border-slate-100 whitespace-pre-line leading-snug">
                                  {p['วัตถุประสงค์'] || '-'}
                                </td>
                                <td className="py-2 px-2.5 text-slate-600 border-r border-slate-100 whitespace-pre-line leading-snug">
                                  {p['เป้าหมาย (ผลผลิต)'] || '-'}
                                </td>
                                <td className="py-2 px-2 text-right font-mono border-r border-slate-100">{formatMoney(p['งบประมาณ 2571'])}</td>
                                <td className="py-2 px-2 text-right font-mono border-r border-slate-100">{formatMoney(p['งบประมาณ 2572'])}</td>
                                <td className="py-2 px-2 text-right font-mono border-r border-slate-100">{formatMoney(p['งบประมาณ 2573'])}</td>
                                <td className="py-2 px-2 text-right font-mono border-r border-slate-100">{formatMoney(p['งบประมาณ 2574'])}</td>
                                <td className="py-2 px-2 text-right font-mono border-r border-slate-100">{formatMoney(p['งบประมาณ 2575'])}</td>
                                <td className="py-2 px-2.5 text-slate-600 border-r border-slate-100 leading-snug">
                                  {p['ผลที่คาดว่าจะได้รับ'] || '-'}
                                </td>
                                <td className="py-2 px-2.5 text-slate-700 font-medium">
                                  {p['หน่วยงานรับผิดชอบหลัก'] || '-'}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={11} className="p-6 text-center text-slate-400">
                                ไม่มีโครงการผูกกับรอบการอนุมัตินี้
                              </td>
                            </tr>
                          )}
                        </tbody>
                        {batchProjects.length > 0 && (
                          <tfoot>
                            <tr className="bg-slate-100 font-bold border-t border-slate-300 text-slate-900">
                              <td colSpan={4} className="py-2 px-2.5 text-center">
                                รวมงบประมาณทั้งสิ้น ({batchProjects.length} โครงการ)
                              </td>
                              <td className="py-2 px-2 text-right font-mono">{formatMoney(sum71)}</td>
                              <td className="py-2 px-2 text-right font-mono">{formatMoney(sum72)}</td>
                              <td className="py-2 px-2 text-right font-mono">{formatMoney(sum73)}</td>
                              <td className="py-2 px-2 text-right font-mono">{formatMoney(sum74)}</td>
                              <td className="py-2 px-2 text-right font-mono">{formatMoney(sum75)}</td>
                              <td colSpan={2} className="py-2 px-2.5 text-right font-mono text-emerald-900 font-bold">
                                รวม {formatMoney(sumTotal)} บาท
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end flex-shrink-0">
              <button
                type="button"
                onClick={() => setInspectingApproval(null)}
                className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-2xs transition"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PRINT OFFICIAL NOTICE */}
      {printingNoticeApproval && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-3 backdrop-blur-2xs print:p-0 print:bg-white">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[92vh] flex flex-col p-5 sm:p-6 shadow-2xl border border-slate-200 print:border-none print:shadow-none print:max-w-none print:w-full print:max-h-none print:p-0">
            {/* Modal Action Bar (hidden in print) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  พิมพ์ประกาศ: {printingNoticeApproval['ประเภท']} ครั้งที่ {printingNoticeApproval['ครั้งที่']}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์ (Print)</span>
                </button>
                <button
                  onClick={() => setPrintingNoticeApproval(null)}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Printable View */}
            <div className="overflow-y-auto flex-1 p-6 sm:p-8 space-y-4 text-slate-900 font-serif leading-relaxed text-xs sm:text-sm">
              <div className="text-center space-y-1.5">
                <div className="font-bold text-base sm:text-lg">ประกาศ{ORG_NAME}</div>
                <div className="font-bold text-sm sm:text-base">
                  เรื่อง ประกาศใช้แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) {printingNoticeApproval['ประเภท']} ครั้งที่ {printingNoticeApproval['ครั้งที่']}
                </div>
                <div className="text-slate-400 text-xs tracking-widest">-----------------------------------------------------</div>
              </div>

              <p className="indent-8 text-justify">
                ตามที่ {ORG_NAME} ได้จัดทำแผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) {printingNoticeApproval['ประเภท']} ครั้งที่ {printingNoticeApproval['ครั้งที่']}
                ตามระเบียบกระทรวงมหาดไทยว่าด้วยการจัดทำแผนพัฒนาขององค์กรปกครองส่วนท้องถิ่น พ.ศ. 2548 และที่แก้ไขเพิ่มเติม
                เพื่อนำไปเป็นกรอบและทิศทางในการพัฒนา การจัดทำงบประมาณรายจ่าย และการดำเนินโครงการต่างๆ ในเขตพื้นที่เทศบาล
              </p>

              <p className="indent-8 text-justify">
                อาศัยอำนาจตามความใน{printingNoticeApproval['ประเภท'] === 'แก้ไข' ? 'ระเบียบกระทรวงมหาดไทยฯ ข้อ 21' : 'ระเบียบกระทรวงมหาดไทยฯ ข้อ 22'}
                ประกอบกับการอนุมัติของ{printingNoticeApproval['ผู้อนุมัติ'] || 'นายกเทศมนตรีเมืองศิลา'} {ORG_NAME} จึงขอประกาศใช้แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) {printingNoticeApproval['ประเภท']} ครั้งที่ {printingNoticeApproval['ครั้งที่']}
                เพื่อใช้เป็นแนวทางในการพัฒนาท้องถิ่นต่อไป ทั้งนี้ ให้มีผลบังคับใช้ตั้งแต่วันที่ {printingNoticeApproval['วันที่มีผลบังคับใช้'] || printingNoticeApproval['วันที่อนุมัติประกาศใช้']} เป็นต้นไป
              </p>

              <p className="indent-8">
                จึงประกาศให้ทราบโดยทั่วกัน
              </p>

              <div className="pt-8 text-right space-y-2 pr-6">
                <div>ประกาศ ณ วันที่ {printingNoticeApproval['วันที่อนุมัติประกาศใช้']}</div>
                <div className="pt-10">
                  <div className="font-bold">({printingNoticeApproval['ผู้อนุมัติ'] || 'นายกเทศมนตรีเมืองศิลา'})</div>
                  <div>ตำแหน่ง นายกเทศมนตรีเมืองศิลา</div>
                </div>
              </div>
            </div>

            {/* Footer Close */}
            <div className="pt-3 border-t border-slate-200 flex justify-end flex-shrink-0 print:hidden">
              <button
                type="button"
                onClick={() => setPrintingNoticeApproval(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
