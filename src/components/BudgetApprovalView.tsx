import React, { useState, useMemo } from 'react';
import {
  Coins,
  Plus,
  Calendar,
  X,
  Save,
  Search,
  RotateCcw,
  ListFilter,
  Printer,
  Download,
  Building2,
  Layers,
  FileText,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Landmark,
  FileSpreadsheet,
  Tag,
  FolderOpen,
  Menu,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Clock,
  PieChart,
  ShieldCheck,
  Check
} from 'lucide-react';
import {
  BudgetApproval,
  Project,
  BudgetStatus,
  OptionsData,
  PlanApproval
} from '../types';
import { YEARS, ORG_NAME, STANDARD_STRATEGIC_ISSUES, sortStrategicIssues } from '../data/initialData';
import { TablePagination } from './TablePagination';
import { StandardFilterBar } from './StandardFilterBar';
import { exportProjects } from '../services/exportService';

// Standard e-LAAS / e-Plan Budget Sources as requested
export const ELAAS_BUDGET_SOURCES = [
  'เทศบัญญัติงบประมาณรายจ่าย',
  'เงินสะสม (จ่ายขาดเงินสะสม)',
  'เงินอุดหนุนเฉพาะกิจ',
  'โอนเพิ่ม/โอนลด/ตั้งจ่ายเป็นรายการใหม่',
  'เงินอุดหนุนจาก อบจ. ขอนแก่น',
  'งบประมาณสนับสนุนจากหน่วยงานอื่น'
] as const;

export const ELAAS_APPROVAL_TYPES = [
  'เทศบัญญัติงบประมาณรายจ่าย',
  'เงินสะสม (จ่ายขาดเงินสะสม)',
  'เงินอุดหนุนเฉพาะกิจ',
  'โอนเพิ่ม/โอนลด/ตั้งจ่ายเป็นรายการใหม่',
  'เงินอุดหนุนจาก อบจ. ขอนแก่น',
  'งบประมาณสนับสนุนจากหน่วยงานอื่น'
] as const;

interface BudgetApprovalViewProps {
  budgetApprovals: BudgetApproval[];
  onSaveBudgetApproval: (data: Partial<BudgetApproval>) => void;
  onDeleteBudgetApproval: (id: number) => void;
  globalFiscalYear: number;
  projects?: Project[];
  approvals?: PlanApproval[];
  options?: OptionsData;
  onSelectProject?: (p: Project) => void;
  onSaveProject?: (p: Partial<Project> & { ID: number }) => void;
  onToggleMobile?: () => void;
}

export const BudgetApprovalView: React.FC<BudgetApprovalViewProps> = ({
  budgetApprovals,
  onSaveBudgetApproval,
  onDeleteBudgetApproval,
  globalFiscalYear,
  projects = [],
  approvals = [],
  options,
  onSelectProject,
  onSaveProject,
  onToggleMobile
}) => {
  // =========================================================================
  // 1. SEARCH & FILTER STATE (ตามเงื่อนไขข้อ 1)
  // =========================================================================
  const [filterStrategy, setFilterStrategy] = useState<string>('ทั้งหมด');
  const [filterProjectName, setFilterProjectName] = useState<string>('');
  const [filterBudget, setFilterBudget] = useState<string>('');
  const [filterProjectType, setFilterProjectType] = useState<string>('ทั้งหมด');
  const [approvalStatusRadio, setApprovalStatusRadio] = useState<'all' | 'approved' | 'unapproved'>('all');
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>(String(globalFiscalYear));

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Modal: 'เพิ่มอนุมัติงบประมาณ' (ตามเงื่อนไขข้อ 3)
  const [approvalModalProject, setApprovalModalProject] = useState<Project | null>(null);
  const [formProjectName, setFormProjectName] = useState<string>('');
  const [formApprovalDate, setFormApprovalDate] = useState<string>('');
  const [formApprovalType, setFormApprovalType] = useState<string>('เทศบัญญัติงบประมาณรายจ่าย');
  const [formBudgetSource, setFormBudgetSource] = useState<string>(ELAAS_BUDGET_SOURCES[0]);
  const [formApprovedAmount, setFormApprovedAmount] = useState<number | ''>('');
  const [formNote, setFormNote] = useState<string>('');

  // Modal: 'รายงานยอดงบประมาณคงเหลือ'
  const [isBalanceReportOpen, setIsBalanceReportOpen] = useState<boolean>(false);

  // Helper formatting
  const formatMoney = (n: number) => {
    return (Number(n) || 0).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatMoneyNoDec = (n: number) => {
    return (Number(n) || 0).toLocaleString('th-TH');
  };

  // Extract unique strategies (ยุทธศาสตร์ / ประเด็นการพัฒนา)
  const strategyList = useMemo(() => {
    const standard = options?.['ประเด็นการพัฒนา'] || STANDARD_STRATEGIC_ISSUES;
    const set = new Set<string>(standard);
    projects.forEach((p) => {
      if (p['ประเด็นการพัฒนา']) set.add(p['ประเด็นการพัฒนา']);
    });
    return sortStrategicIssues(Array.from(set));
  }, [options, projects]);

  // Handle Reset Filter / เริ่มค้นหาใหม่
  const handleResetFilters = () => {
    setFilterStrategy('ทั้งหมด');
    setFilterProjectName('');
    setFilterBudget('');
    setFilterProjectType('ทั้งหมด');
    setApprovalStatusRadio('all');
  };

  // Handle Show All / แสดงทั้งหมด
  const handleShowAll = () => {
    setFilterStrategy('ทั้งหมด');
    setFilterProjectName('');
    setFilterBudget('');
    setFilterProjectType('ทั้งหมด');
    setApprovalStatusRadio('all');
  };

  // Check if a project is approved
  const isProjectApproved = (p: Project): boolean => {
    const approvedAmt = Number(p['งบประมาณที่อนุมัติ']) || 0;
    const status = p['สถานะงบประมาณ'];
    return (
      approvedAmt > 0 ||
      status === 'ได้รับการจัดสรรงบประมาณแล้ว (มีงบพร้อมใช้)' ||
      p['โครงการอนุมัติตามเทศบัญญัติ'] === 'ใช่' ||
      p['โครงการอนุมัติจากเงินสะสม'] === 'ใช่' ||
      p['โครงการอนุมัติจากโอนเปลี่ยนแปลง'] === 'ใช่' ||
      p['โครงการอนุมัติจากอบจ'] === 'ใช่' ||
      p['โครงการอนุมัติจากหน่วยงานอื่น'] === 'ใช่'
    );
  };

  // Target Year helper
  const targetYear = selectedFiscalYear === 'all' ? globalFiscalYear : parseInt(selectedFiscalYear, 10);

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // 1. Fiscal Year Match
      if (selectedFiscalYear !== 'all') {
        const yr = parseInt(selectedFiscalYear, 10);
        const hasBudgetInYear = Number(p[`งบประมาณ ${yr}` as keyof Project]) > 0;
        const isRecordedYear = String(p['ปี พ.ศ.']) === selectedFiscalYear;
        const isApproved = isProjectApproved(p);
        if (!hasBudgetInYear && !isRecordedYear && !isApproved) {
          return false;
        }
      }

      // 2. Strategy Filter (ยุทธศาสตร์ อปท.)
      if (filterStrategy !== 'ทั้งหมด' && p['ประเด็นการพัฒนา'] !== filterStrategy) {
        return false;
      }

      // 3. Project Name Filter
      if (filterProjectName.trim()) {
        const query = filterProjectName.toLowerCase().trim();
        const name = (p['ชื่อโครงการ'] || '').toLowerCase();
        const ordName = (p['ชื่อโครงการตามข้อบัญญัติ'] || '').toLowerCase();
        const obj = (p['วัตถุประสงค์'] || '').toLowerCase();
        const plan = (p['แผนงาน'] || '').toLowerCase();
        if (!name.includes(query) && !ordName.includes(query) && !obj.includes(query) && !plan.includes(query)) {
          return false;
        }
      }

      // 4. Budget Filter (งบประมาณ)
      if (filterBudget.trim() !== '') {
        const budgetNum = Number(filterBudget.replace(/,/g, '').trim());
        if (!isNaN(budgetNum) && budgetNum >= 0) {
          if (selectedFiscalYear !== 'all') {
            const projectPlannedBudget = Number(p[`งบประมาณ ${targetYear}` as keyof Project]) || 0;
            const approvedBudget = Number(p['งบประมาณที่อนุมัติ']) || 0;
            const isMatch =
              projectPlannedBudget === budgetNum ||
              approvedBudget === budgetNum ||
              (projectPlannedBudget > 0 && projectPlannedBudget <= budgetNum);
            if (!isMatch) return false;
          } else {
            const approvedBudget = Number(p['งบประมาณที่อนุมัติ']) || 0;
            const matchInAnyYear = YEARS.some((yr) => {
              const amt = Number(p[`งบประมาณ ${yr}` as keyof Project]) || 0;
              return amt === budgetNum || (amt > 0 && amt <= budgetNum);
            });
            if (!matchInAnyYear && approvedBudget !== budgetNum) return false;
          }
        }
      }

      // 5. Project Type / Budget Source Filter (ประเภทโครงการ / แหล่งที่มาของงบประมาณ)
      if (filterProjectType !== 'ทั้งหมด') {
        if (filterProjectType === 'เทศบัญญัติงบประมาณรายจ่าย') {
          if (
            p['โครงการอนุมัติตามเทศบัญญัติ'] !== 'ใช่' &&
            p['โครงการตามข้อบัญญัติ_ผ02_1'] !== 'ใช่' &&
            p['แหล่งที่มาของงบประมาณ'] !== 'เทศบัญญัติงบประมาณรายจ่าย' &&
            p['แหล่งที่มาของงบประมาณ'] !== 'เทศบัญญัติงบประมาณรายจ่ายประจำปี'
          ) return false;
        } else if (filterProjectType === 'เงินสะสม (จ่ายขาดเงินสะสม)') {
          if (
            p['โครงการอนุมัติจากเงินสะสม'] !== 'ใช่' &&
            p['โครงการเงินสะสม'] !== 'ใช่' &&
            p['แหล่งที่มาของงบประมาณ'] !== 'เงินสะสม (จ่ายขาดเงินสะสม)' &&
            p['แหล่งที่มาของงบประมาณ'] !== 'เงินสะสม(จ่ายขาดเงินสะสม)'
          ) return false;
        } else if (filterProjectType === 'เงินอุดหนุนเฉพาะกิจ') {
          if (
            p['แหล่งที่มาของงบประมาณ'] !== 'เงินอุดหนุนเฉพาะกิจ' &&
            p['ประเภทโครงการ'] !== 'เงินอุดหนุนเฉพาะกิจ'
          ) return false;
        } else if (filterProjectType === 'โอนเพิ่ม/โอนลด/ตั้งจ่ายเป็นรายการใหม่') {
          if (
            p['โครงการอนุมัติจากโอนเปลี่ยนแปลง'] !== 'ใช่' &&
            p['โครงการขออนุมัติโอนเปลี่ยนแปลง'] !== 'ใช่' &&
            p['แหล่งที่มาของงบประมาณ'] !== 'โอนเพิ่ม/โอนลด/ตั้งจ่ายเป็นรายการใหม่' &&
            p['แหล่งที่มาของงบประมาณ'] !== 'โอนตั้งจ่ายเป็นรายการใหม่' &&
            p['แหล่งที่มาของงบประมาณ'] !== 'โอนเพิ่ม /โอนลด /โอนตั้งจ่ายเป็นรายการใหม่'
          ) return false;
        } else if (filterProjectType === 'เงินอุดหนุนจาก อบจ. ขอนแก่น') {
          if (
            p['โครงการอนุมัติจากอบจ'] !== 'ใช่' &&
            p['แหล่งที่มาของงบประมาณ'] !== 'เงินอุดหนุนจาก อบจ. ขอนแก่น' &&
            p['แหล่งที่มาของงบประมาณ'] !== 'เงินอุดหนุน จาก อบจ. ขอนแก่น' &&
            p['แหล่งที่มาของงบประมาณ'] !== 'เงินอุดหนุน จาก อบจ.ขอนแก่น'
          ) return false;
        } else if (filterProjectType === 'งบประมาณสนับสนุนจากหน่วยงานอื่น') {
          if (
            p['โครงการอนุมัติจากหน่วยงานอื่น'] !== 'ใช่' &&
            p['แหล่งที่มาของงบประมาณ'] !== 'งบประมาณสนับสนุนจากหน่วยงานอื่น' &&
            p['แหล่งที่มาของงบประมาณ'] !== 'งบประมาณสนับสนุนจากส่วนราชการอื่น'
          ) return false;
        }
      }

      // 6. Approval Status Radio Buttons (( ) โครงการที่อนุมัติแล้ว / (•) โครงการที่ยังไม่อนุมัติ)
      const approved = isProjectApproved(p);
      if (approvalStatusRadio === 'approved' && !approved) return false;
      if (approvalStatusRadio === 'unapproved' && approved) return false;

      return true;
    });
  }, [
    projects,
    selectedFiscalYear,
    filterStrategy,
    filterProjectName,
    filterBudget,
    filterProjectType,
    approvalStatusRadio,
    targetYear
  ]);

  // Paginated Projects
  const paginatedProjects = useMemo(() => {
    if (pageSize >= 999 || pageSize === 0) return filteredProjects;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredProjects.slice(startIndex, startIndex + pageSize);
  }, [filteredProjects, currentPage, pageSize]);

  // Map each project ID to its promulgated plan batch (if any)
  const promulgatedProjectMap = useMemo(() => {
    const map = new Map<number, PlanApproval>();
    (approvals || []).forEach((a) => {
      if (a['สถานะการประกาศ'] === 'อนุมัติ' || a['สถานะการประกาศ'] === 'ประกาศใช้แล้ว' || !a['สถานะการประกาศ']) {
        const ids = String(a.ProjectIDs || '')
          .split(',')
          .filter(Boolean)
          .map((s) => Number(s.trim()));
        ids.forEach((id) => {
          if (!map.has(id)) {
            map.set(id, a);
          }
        });
      }
    });
    return map;
  }, [approvals]);

  // Group Projects by Strategy (ประเด็นการพัฒนา / ยุทธศาสตร์)
  const groupedProjects = useMemo(() => {
    const map = new Map<string, Project[]>();

    filteredProjects.forEach((p) => {
      const strat = p['ประเด็นการพัฒนา'] || 'ยุทธศาสตร์อื่นๆ / ยังไม่ระบุ';
      if (!map.has(strat)) {
        map.set(strat, []);
      }
      map.get(strat)!.push(p);
    });

    const sortedEntries = Array.from(map.entries()).sort(([a], [b]) => {
      const idxA = STANDARD_STRATEGIC_ISSUES.indexOf(a);
      const idxB = STANDARD_STRATEGIC_ISSUES.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b, 'th');
    });

    return sortedEntries.map(([strategyName, items]) => {
      const totalPlanned = items.reduce(
        (sum, item) => {
          if (selectedFiscalYear === 'all') {
            return sum + YEARS.reduce((ySum, yr) => ySum + (Number(item[`งบประมาณ ${yr}` as keyof Project]) || 0), 0);
          }
          return sum + (Number(item[`งบประมาณ ${targetYear}` as keyof Project]) || 0);
        },
        0
      );
      const totalApproved = items.reduce(
        (sum, item) => sum + (Number(item['งบประมาณที่อนุมัติ']) || 0),
        0
      );
      const approvedCount = items.filter(isProjectApproved).length;

      return {
        strategyName,
        items,
        totalPlanned,
        totalApproved,
        totalBalance: Math.max(0, totalPlanned - totalApproved),
        approvedCount,
        unapprovedCount: items.length - approvedCount
      };
    });
  }, [filteredProjects, targetYear, selectedFiscalYear]);

  // Global KPIs for view
  const overallStats = useMemo(() => {
    const totalCount = filteredProjects.length;
    const approvedCount = filteredProjects.filter(isProjectApproved).length;
    const unapprovedCount = totalCount - approvedCount;
    const totalPlanned = filteredProjects.reduce(
      (sum, p) => {
        if (selectedFiscalYear === 'all') {
          return sum + YEARS.reduce((ySum, yr) => ySum + (Number(p[`งบประมาณ ${yr}` as keyof Project]) || 0), 0);
        }
        return sum + (Number(p[`งบประมาณ ${targetYear}` as keyof Project]) || 0);
      },
      0
    );
    const totalApproved = filteredProjects.reduce(
      (sum, p) => sum + (Number(p['งบประมาณที่อนุมัติ']) || 0),
      0
    );
    const totalBalance = Math.max(0, totalPlanned - totalApproved);

    return {
      totalCount,
      approvedCount,
      unapprovedCount,
      totalPlanned,
      totalApproved,
      totalBalance
    };
  }, [filteredProjects, targetYear, selectedFiscalYear]);

  // =========================================================================
  // 3. MODAL: เปิดฟอร์ม 'เพิ่มอนุมัติงบประมาณ' (เมื่อกดปุ่ม [+ อนุมัติข้อมูล])
  // =========================================================================
  const openApprovalFormModal = (p: Project) => {
    setApprovalModalProject(p);
    setFormProjectName(p['ชื่อโครงการตามข้อบัญญัติ'] || p['ชื่อโครงการ']);

    const todayDate = new Date().toISOString().split('T')[0];
    setFormApprovalDate(p['วันที่อนุมัติงบประมาณ'] || p['วันที่บันทึก']?.split(' ')[0] || todayDate);

    // Single Dropdown value for e-LAAS approval type
    let initialType = 'เทศบัญญัติงบประมาณรายจ่าย';
    if (
      p['โครงการอนุมัติจากเงินสะสม'] === 'ใช่' ||
      p['โครงการเงินสะสม'] === 'ใช่' ||
      p['แหล่งที่มาของงบประมาณ'] === 'เงินสะสม (จ่ายขาดเงินสะสม)' ||
      p['แหล่งที่มาของงบประมาณ'] === 'เงินสะสม(จ่ายขาดเงินสะสม)'
    ) {
      initialType = 'เงินสะสม (จ่ายขาดเงินสะสม)';
    } else if (
      p['แหล่งที่มาของงบประมาณ'] === 'เงินอุดหนุนเฉพาะกิจ' ||
      p['ประเภทโครงการ'] === 'เงินอุดหนุนเฉพาะกิจ'
    ) {
      initialType = 'เงินอุดหนุนเฉพาะกิจ';
    } else if (
      p['โครงการอนุมัติจากโอนเปลี่ยนแปลง'] === 'ใช่' ||
      p['โครงการขออนุมัติโอนเปลี่ยนแปลง'] === 'ใช่' ||
      p['แหล่งที่มาของงบประมาณ'] === 'โอนเพิ่ม/โอนลด/ตั้งจ่ายเป็นรายการใหม่' ||
      p['แหล่งที่มาของงบประมาณ'] === 'โอนตั้งจ่ายเป็นรายการใหม่'
    ) {
      initialType = 'โอนเพิ่ม/โอนลด/ตั้งจ่ายเป็นรายการใหม่';
    } else if (
      p['โครงการอนุมัติจากอบจ'] === 'ใช่' ||
      p['แหล่งที่มาของงบประมาณ'] === 'เงินอุดหนุนจาก อบจ. ขอนแก่น' ||
      p['แหล่งที่มาของงบประมาณ'] === 'เงินอุดหนุน จาก อบจ. ขอนแก่น' ||
      p['แหล่งที่มาของงบประมาณ'] === 'เงินอุดหนุน จาก อบจ.ขอนแก่น'
    ) {
      initialType = 'เงินอุดหนุนจาก อบจ. ขอนแก่น';
    } else if (
      p['โครงการอนุมัติจากหน่วยงานอื่น'] === 'ใช่' ||
      p['แหล่งที่มาของงบประมาณ'] === 'งบประมาณสนับสนุนจากหน่วยงานอื่น' ||
      p['แหล่งที่มาของงบประมาณ'] === 'งบประมาณสนับสนุนจากส่วนราชการอื่น'
    ) {
      initialType = 'งบประมาณสนับสนุนจากหน่วยงานอื่น';
    } else if (
      p['โครงการอนุมัติตามเทศบัญญัติ'] === 'ใช่' ||
      p['โครงการตามข้อบัญญัติ_ผ02_1'] === 'ใช่' ||
      p['แหล่งที่มาของงบประมาณ'] === 'เทศบัญญัติงบประมาณรายจ่าย' ||
      p['แหล่งที่มาของงบประมาณ'] === 'เทศบัญญัติงบประมาณรายจ่ายประจำปี'
    ) {
      initialType = 'เทศบัญญัติงบประมาณรายจ่าย';
    }
    setFormApprovalType(initialType);

    // Budget Source (use exact source from project or fallback to initialType)
    const exactSource = p['แหล่งที่มาของงบประมาณ'];
    if (exactSource && (ELAAS_BUDGET_SOURCES as readonly string[]).includes(exactSource)) {
      setFormBudgetSource(exactSource);
    } else {
      setFormBudgetSource(initialType);
    }

    // Approved Amount
    const currentApproved = Number(p['งบประมาณที่อนุมัติ']) || 0;
    const plannedForYear = Number(p[`งบประมาณ ${targetYear}` as keyof Project]) || 0;
    setFormApprovedAmount(currentApproved > 0 ? currentApproved : (plannedForYear > 0 ? plannedForYear : ''));

    setFormNote(p['การอ้างอิงแผน'] || `อนุมัติตามเทศบัญญัติงบประมาณรายจ่าย ประจำปี พ.ศ. ${targetYear}`);
  };

  // Save Modal Form
  const handleSaveApprovalForm = () => {
    if (!approvalModalProject || !onSaveProject) return;

    const approvedAmt = formApprovedAmount === '' ? 0 : Number(formApprovedAmount);

    const isOrdinance = formApprovalType === 'เทศบัญญัติงบประมาณรายจ่าย';
    const isAccumulated = formApprovalType === 'เงินสะสม (จ่ายขาดเงินสะสม)';
    const isSpecialGrant = formApprovalType === 'เงินอุดหนุนเฉพาะกิจ';
    const isTransfer = formApprovalType === 'โอนเพิ่ม/โอนลด/ตั้งจ่ายเป็นรายการใหม่';
    const isPAO = formApprovalType === 'เงินอุดหนุนจาก อบจ. ขอนแก่น';
    const isOther = formApprovalType === 'งบประมาณสนับสนุนจากหน่วยงานอื่น';

    onSaveProject({
      ID: approvalModalProject.ID,
      'ชื่อโครงการตามข้อบัญญัติ': formProjectName.trim() || approvalModalProject['ชื่อโครงการ'],
      'วันที่อนุมัติงบประมาณ': formApprovalDate,
      'แหล่งที่มาของงบประมาณ': formBudgetSource,
      'งบประมาณที่อนุมัติ': approvedAmt,
      'สถานะงบประมาณ': approvedAmt > 0
        ? 'ได้รับการจัดสรรงบประมาณแล้ว (มีงบพร้อมใช้)'
        : 'ได้รับการจัดสรรงบประมาณแล้ว (มีงบพร้อมใช้)',
      'โครงการอนุมัติตามเทศบัญญัติ': isOrdinance ? 'ใช่' : 'ไม่ใช่',
      'โครงการอนุมัติจากเงินสะสม': isAccumulated ? 'ใช่' : 'ไม่ใช่',
      'โครงการอนุมัติจากโอนเปลี่ยนแปลง': isTransfer ? 'ใช่' : 'ไม่ใช่',
      'โครงการอนุมัติจากอบจ': isPAO ? 'ใช่' : 'ไม่ใช่',
      'โครงการอนุมัติจากหน่วยงานอื่น': (isOther || isSpecialGrant) ? 'ใช่' : 'ไม่ใช่',
      'โครงการตามข้อบัญญัติ_ผ02_1': isOrdinance ? 'ใช่' : 'ไม่ใช่',
      'โครงการตามแผนการดำเนินงาน_ผด02': 'ใช่',
      'การอ้างอิงแผน': formNote.trim()
    });

    setApprovalModalProject(null);
  };

  return (
    <div id="budget-approval-view" className="space-y-4">
      {/* ========================================================================= */}
      {/* SECTION 1: SEARCH FILTER SECTION (ตามรูปที่ 1 และเงื่อนไขข้อ 1)              */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Row 1: Main Header Bar (บรรทัดบนสุด: ไอคอนและข้อความขนานชิดซ้าย) */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            {onToggleMobile && (
              <button
                onClick={onToggleMobile}
                className="lg:hidden p-1.5 rounded-lg bg-emerald-900/50 text-white hover:bg-emerald-900 cursor-pointer"
                aria-label="เปิดเมนู"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}
            <div className="p-1.5 rounded-lg bg-emerald-900/60 border border-emerald-500/30">
              <Landmark className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold leading-tight flex items-center gap-2 flex-wrap">
                <span>ระบบอนุมัติงบประมาณ</span>
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
          selectedYear={selectedFiscalYear}
          onYearChange={(yr) => setSelectedFiscalYear(yr)}
          allYearsLabel="ทุกปี (2571-2575)"
          issueLabel="ประเด็นการพัฒนา"
          issueValue={filterStrategy}
          onIssueChange={(val) => setFilterStrategy(val)}
          issueOptions={strategyList}
          issueAllLabel="-- ทุกประเด็นการพัฒนา --"
          departmentLabel="แหล่งที่มาของงบประมาณ"
          departmentValue={filterProjectType}
          onDepartmentChange={(val) => setFilterProjectType(val)}
          departmentOptions={ELAAS_BUDGET_SOURCES}
          departmentAllLabel="-- เลือกแหล่งที่มาของงบประมาณ --"
          searchLabel="ชื่อโครงการ"
          searchValue={filterProjectName}
          onSearchChange={(val) => setFilterProjectName(val)}
          searchPlaceholder="ค้นหาชื่อโครงการ..."
          budgetLabel="งบประมาณ (บาท)"
          budgetValue={filterBudget}
          onBudgetChange={(val) => setFilterBudget(val)}
          budgetPlaceholder="ระบุจำนวนเงิน..."
          onSearch={() => {}}
          onShowAll={handleShowAll}
          onReset={handleResetFilters}
          extraControlsCenter={
            <div className="flex items-center gap-3.5 text-xs font-medium text-slate-700">
              <span className="text-slate-500 text-[11px]">สถานะ:</span>
              <label className="inline-flex items-center gap-1.5 cursor-pointer hover:text-emerald-700">
                <input
                  type="radio"
                  name="approvalRadio"
                  checked={approvalStatusRadio === 'all'}
                  onChange={() => setApprovalStatusRadio('all')}
                  className="text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer"
                />
                <span>ทั้งหมด</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer hover:text-emerald-700">
                <input
                  type="radio"
                  name="approvalRadio"
                  checked={approvalStatusRadio === 'approved'}
                  onChange={() => setApprovalStatusRadio('approved')}
                  className="text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer"
                />
                <span className="text-emerald-700 font-semibold">อนุมัติแล้ว</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer hover:text-emerald-700">
                <input
                  type="radio"
                  name="approvalRadio"
                  checked={approvalStatusRadio === 'unapproved'}
                  onChange={() => setApprovalStatusRadio('unapproved')}
                  className="text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer"
                />
                <span className="text-amber-700 font-semibold">ยังไม่อนุมัติ</span>
              </label>
            </div>
          }
          onExportExcel={() => exportProjects(filteredProjects, 'excel', `รายงานอนุมัติงบประมาณ_${selectedFiscalYear}`)}
          onExportCsv={() => exportProjects(filteredProjects, 'csv', `รายงานอนุมัติงบประมาณ_${selectedFiscalYear}`)}
          exportItemsCount={filteredProjects.length}
          onPrint={() => window.print()}
          actionButton={
            <button
              type="button"
              onClick={() => setIsBalanceReportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition cursor-pointer"
              title="ดูและพิมพ์รายงานยอดงบประมาณคงเหลือ"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>รายงานยอดงบประมาณคงเหลือ</span>
            </button>
          }
        />

        {/* Quick KPI Stat strip */}
        <div className="px-4 py-2.5 bg-emerald-50/50 text-xs border-t border-slate-200 flex items-center justify-between flex-wrap gap-2 text-slate-600">
          <div className="flex items-center gap-3 flex-wrap">
            <span title="จำนวนโครงการที่พบตามเงื่อนไขตัวกรองในปีงบประมาณนี้">
              พบโครงการตามเงื่อนไข: <strong className="text-slate-900 font-bold">{overallStats.totalCount}</strong> โครงการ
              <span className="text-[10px] text-slate-400 block sm:inline sm:ml-1 font-normal">
                ({selectedFiscalYear === 'all' ? 'โครงการทุกปีในแผน' : `โครงการปี ${selectedFiscalYear}`})
              </span>
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span title="โครงการที่ได้รับการบรรจุ/จัดสรรงบประมาณจริงแล้ว">
              อนุมัติงบแล้ว: <strong className="text-emerald-700 font-bold">{overallStats.approvedCount}</strong> โครงการ
              <span className="text-[10px] text-emerald-600/90 block sm:inline sm:ml-1 font-normal">(มีงบพร้อมใช้)</span>
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span title="โครงการในแผนที่ยังไม่ได้รับการจัดสรรงบประมาณในข้อบัญญัติ/เทศบัญญัติ">
              ยังไม่อนุมัติงบ: <strong className="text-amber-700 font-bold">{overallStats.unapprovedCount}</strong> โครงการ
              <span className="text-[10px] text-amber-600/90 block sm:inline sm:ml-1 font-normal">(รอจัดสรรงบ)</span>
            </span>
          </div>

          <div className="flex items-center gap-4 font-mono font-bold flex-wrap">
            <div className="text-right">
              <div className="text-[10px] text-slate-500 font-sans font-normal">
                งบตามแผน ({selectedFiscalYear === 'all' ? 'รวม 5 ปี' : `ปี ${selectedFiscalYear}`})
              </div>
              <div className="text-slate-800">฿{formatMoneyNoDec(overallStats.totalPlanned)}</div>
            </div>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <div className="text-right">
              <div className="text-[10px] text-emerald-600 font-sans font-normal">อนุมัติจัดสรรจริง</div>
              <div className="text-emerald-700">฿{formatMoneyNoDec(overallStats.totalApproved)}</div>
            </div>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <div className="text-right">
              <div className="text-[10px] text-indigo-600 font-sans font-normal">งบคงเหลือตามแผน</div>
              <div className="text-indigo-700">฿{formatMoneyNoDec(overallStats.totalBalance)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: UNIFIED TABLE OF PROJECTS (ตารางเดียวต่อเนื่อง ไม่แบ่ง Group)     */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredProjects.length === 0 ? (
          <div className="p-12 text-center">
            <Coins className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">ไม่พบข้อมูลโครงการตามเงื่อนไขการค้นหา</h3>
            <p className="text-xs text-slate-400 mt-1">
              ลองปรับเปลี่ยนตัวกรอง หรือกดปุ่ม "แสดงทั้งหมด" หรือ "เริ่มค้นหาใหม่" ด้านบน
            </p>
            <button
              type="button"
              onClick={handleShowAll}
              className="mt-3 px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer shadow-2xs"
            >
              แสดงโครงการทั้งหมด
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-20">
                <tr className="bg-[#065F46] text-white font-bold border-b border-emerald-800 text-[11px] select-none shadow-xs">
                  {/* 1. ลำดับ */}
                  <th className="py-2.5 px-2.5 w-12 text-center border-r border-white/15 font-bold text-white">ลำดับ</th>

                  {/* 2. ประเด็นการพัฒนา */}
                  <th className="py-2.5 px-3 min-w-[170px] max-w-[220px] border-r border-white/15 font-bold text-white text-center">ประเด็นการพัฒนา</th>

                  {/* 3. อนุมัติงบประมาณ (ปุ่มกด) */}
                  <th className="py-2.5 px-2.5 w-28 text-center bg-emerald-800/80 text-emerald-200 border-r border-white/15 font-bold">
                    อนุมัติงบประมาณ
                  </th>

                  {/* 4. ชื่อโครงการ */}
                  <th className="py-2.5 px-3 min-w-[240px] border-r border-white/15 font-bold text-white text-center">ชื่อโครงการ</th>

                  {/* 5. งบตามแผนพัฒนาท้องถิ่น */}
                  <th className="py-2.5 px-3 text-center w-28 whitespace-nowrap border-r border-white/15 font-bold text-white">
                    งบตามแผนพัฒนาท้องถิ่น
                  </th>

                  {/* 6. แหล่งที่มาของงบประมาณ */}
                  <th className="py-2.5 px-3 min-w-[160px] border-r border-white/15 font-bold text-white text-center">แหล่งที่มาของงบประมาณ</th>

                  {/* 7. งบประมาณที่อนุมัติ */}
                  <th className="py-2.5 px-3 text-center w-28 text-emerald-200 font-bold whitespace-nowrap border-r border-white/15">
                    งบประมาณที่อนุมัติ
                  </th>

                  {/* 8. วันที่อนุมัติ */}
                  <th className="py-2.5 px-2.5 text-center w-24 whitespace-nowrap border-r border-white/15 font-bold text-white">
                    วันที่อนุมัติ
                  </th>

                  {/* 9. สถานะ */}
                  <th className="py-2.5 px-2.5 text-center w-24 border-r border-white/15 font-bold text-white">สถานะ</th>

                  {/* 10. หน่วยงานรับผิดชอบ */}
                  <th className="py-2.5 px-3 min-w-[130px] font-bold text-white text-center">หน่วยงานรับผิดชอบ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedProjects.map((project, idx) => {
                  const plannedBudget = Number(project[`งบประมาณ ${targetYear}` as keyof Project]) || 0;
                  const approvedBudget = Number(project['งบประมาณที่อนุมัติ']) || 0;
                  const isApproved = isProjectApproved(project);
                  const devIssue = project['ประเด็นการพัฒนา'] || project['ยุทธศาสตร์'] || '-';
                  const globalIdx = (pageSize >= 999 || pageSize === 0 ? 0 : (currentPage - 1) * pageSize) + idx;

                  return (
                    <tr
                      key={project.ID}
                      className={`hover:bg-emerald-50/40 transition ${
                        isApproved ? 'bg-emerald-50/15' : ''
                      }`}
                    >
                      {/* 1. ลำดับ */}
                      <td className="py-2.5 px-2.5 text-center text-slate-500 font-mono font-medium">
                        {globalIdx + 1}
                      </td>

                      {/* 2. ประเด็นการพัฒนา (สีเทาเข้ม #4B5563 / Badge กะทัดรัด) */}
                      <td className="py-2.5 px-3">
                        <span
                          className="inline-block text-[11px] text-[#4B5563] bg-slate-100 hover:bg-slate-200/80 px-2 py-0.5 rounded border border-slate-200/80 font-medium leading-relaxed"
                          title={devIssue}
                        >
                          {devIssue}
                        </span>
                      </td>

                      {/* 3. อนุมัติงบประมาณ (ปุ่มกด) */}
                      <td className="py-2 px-2.5 text-center bg-emerald-50/30 border-x border-emerald-100">
                        <button
                          type="button"
                          onClick={() => openApprovalFormModal(project)}
                          className="inline-flex items-center justify-center gap-1 w-full px-2 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs hover:shadow-xs transition cursor-pointer whitespace-nowrap"
                          title="คลิกเพื่อเปิดฟอร์มอนุมัติงบประมาณ"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>อนุมัติข้อมูล</span>
                        </button>
                      </td>

                      {/* 4. ชื่อโครงการ */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 leading-snug">
                          {project['ชื่อโครงการ']}
                        </div>
                        {project['ชื่อโครงการตามข้อบัญญัติ'] && project['ชื่อโครงการตามข้อบัญญัติ'] !== project['ชื่อโครงการ'] && (
                          <div className="text-[11px] text-emerald-800 font-medium mt-0.5 flex items-center gap-1">
                            <span className="text-[10px] text-slate-400">ตามเทศบัญญัติ:</span>
                            <span>{project['ชื่อโครงการตามข้อบัญญัติ']}</span>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>แผนงาน: {project['แผนงาน'] || '-'}</span>
                          <span>•</span>
                          {promulgatedProjectMap.has(project.ID) ? (
                            <span
                              className="text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200"
                              title={`บรรจุในประกาศใช้แผนแล้ว (${promulgatedProjectMap.get(project.ID)!['ประเภท']} ${promulgatedProjectMap.get(project.ID)!['ครั้งที่']})`}
                            >
                              ประกาศใช้แล้ว ({promulgatedProjectMap.get(project.ID)!['ประเภท'] || 'ฉบับแรก'})
                            </span>
                          ) : (
                            <span
                              className="text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200"
                              title="ยังไม่ได้รับการบรรจุในประกาศใช้แผนพัฒนาท้องถิ่น"
                            >
                              รอจัดรอบประกาศใช้
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. งบตามแผนพัฒนาท้องถิ่น */}
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700">
                        {plannedBudget > 0 ? `฿${formatMoneyNoDec(plannedBudget)}` : '-'}
                      </td>

                      {/* 6. แหล่งที่มาของงบประมาณ */}
                      <td className="py-2.5 px-3">
                        {isApproved ? (
                          <div className="text-slate-800 font-medium flex items-center gap-1">
                            <Tag className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="truncate">{project['แหล่งที่มาของงบประมาณ'] || ELAAS_BUDGET_SOURCES[0]}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">- ยังไม่ได้จัดสรร -</span>
                        )}
                      </td>

                      {/* 7. งบประมาณที่อนุมัติ */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        {approvedBudget > 0 ? (
                          `฿${formatMoneyNoDec(approvedBudget)}`
                        ) : (
                          <span className="text-slate-300 font-normal">-</span>
                        )}
                      </td>

                      {/* 8. วันที่อนุมัติ */}
                      <td className="py-2.5 px-2.5 text-center text-slate-600 font-mono text-[11px]">
                        {project['วันที่อนุมัติงบประมาณ'] || (isApproved ? 'อนุมัติแล้ว' : '-')}
                      </td>

                      {/* 9. สถานะ */}
                      <td className="py-2.5 px-2.5 text-center">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            อนุมัติงบแล้ว
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                            <Clock className="w-3 h-3 text-slate-400" />
                            ยังไม่อนุมัติงบ
                          </span>
                        )}
                      </td>

                      {/* 10. หน่วยงานรับผิดชอบ */}
                      <td className="py-2.5 px-3 text-slate-700 truncate">
                        {project['หน่วยงานรับผิดชอบหลัก'] || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer - Standard Pagination */}
        {filteredProjects.length > 0 && (
          <TablePagination
            currentPage={currentPage}
            totalItems={filteredProjects.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 20, 50, 100, 999]}
          />
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: MODAL ฟอร์ม 'เพิ่มอนุมัติงบประมาณ' (Compact 100% No Scrollbar)     */}
      {/* ========================================================================= */}
      {approvalModalProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setApprovalModalProject(null);
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
            {/* Modal Header - Reduced height by 40% */}
            <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white px-4 py-2 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-emerald-900/60 border border-emerald-500/40">
                  <Landmark className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-tight">
                    เพิ่มอนุมัติงบประมาณ
                  </h3>
                  <p className="text-[10px] text-emerald-200">
                    ปรับปรุงข้อมูลการอนุมัติงบประมาณรายโครงการ (ตามระบบ e-LAAS / e-Plan)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApprovalModalProject(null)}
                className="p-1 rounded-md hover:bg-emerald-900/50 text-emerald-100 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body - Tight Spacing & Compact Fields */}
            <div className="p-3.5 sm:p-4 overflow-y-auto space-y-2 text-xs">
              {/* 1. แสดงข้อมูลเดิม: ชื่อโครงการ และ งบตามแผน (บาท) (Read-only Info Box) */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 space-y-1">
                <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                  <FileText className="w-3 h-3 text-slate-400" />
                  <span>ข้อมูลเดิมจากแผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-slate-500 block">ชื่อโครงการ (ตามแผน):</span>
                    <span className="text-xs font-bold text-slate-900 leading-snug block line-clamp-2">
                      {approvalModalProject['ชื่อโครงการ']}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>แผนงาน: {approvalModalProject['แผนงาน'] || '-'}</span>
                      <span>•</span>
                      <span>หน่วยงาน: {approvalModalProject['หน่วยงานรับผิดชอบหลัก'] || '-'}</span>
                    </div>
                  </div>

                  <div className="sm:col-span-1 bg-white p-1.5 rounded border border-slate-200 text-right flex flex-col justify-center">
                    <span className="text-[10px] text-slate-500 block">งบตามแผน (ปี {targetYear}):</span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-700 font-mono block">
                      ฿{formatMoneyNoDec(Number(approvalModalProject[`งบประมาณ ${targetYear}` as keyof Project]) || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. ช่องกรอก/เลือกข้อมูล: ชื่อโครงการ (Editable Input) & วันที่อนุมัติ */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="block text-[11px] font-bold text-slate-800">
                      ชื่อโครงการ (ตามเทศบัญญัติ) <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormProjectName(approvalModalProject['ชื่อโครงการ'])}
                      className="text-[10px] text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                    >
                      ใช้ชื่อตามแผน
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formProjectName}
                    onChange={(e) => setFormProjectName(e.target.value)}
                    placeholder="ระบุชื่อโครงการจริงในเทศบัญญัติ..."
                    className="w-full h-[36px] bg-white border border-slate-300 rounded-lg px-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-1.5 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-800 mb-0.5">
                    วันที่อนุมัติ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formApprovalDate}
                    onChange={(e) => setFormApprovalDate(e.target.value)}
                    className="w-full h-[36px] bg-white border border-slate-300 rounded-lg px-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-1.5 focus:ring-emerald-500 shadow-2xs cursor-pointer"
                  />
                </div>
              </div>

              {/* 3. โครงการที่ผ่านการอนุมัติ & แหล่งที่มาของงบประมาณ (ขนานกัน 2 คอลัมน์) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* โครงการที่ผ่านการอนุมัติ (Dropdown เดียว) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-0.5">
                    โครงการที่ผ่านการอนุมัติ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formApprovalType}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormApprovalType(val);
                      // Auto-suggest matching budget source
                      if (val) {
                        setFormBudgetSource(val);
                      }
                    }}
                    className="w-full h-[36px] bg-white border border-slate-300 rounded-lg px-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-1.5 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                  >
                    <option value="">-- เลือกประเภทการอนุมัติ --</option>
                    {ELAAS_APPROVAL_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* แหล่งที่มาของงบประมาณ (Dropdown) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-0.5">
                    แหล่งที่มาของงบประมาณ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formBudgetSource}
                    onChange={(e) => setFormBudgetSource(e.target.value)}
                    className="w-full h-[36px] bg-white border border-slate-300 rounded-lg px-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-1.5 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                  >
                    {ELAAS_BUDGET_SOURCES.map((src) => (
                      <option key={src} value={src}>
                        {src}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4. จำนวนเงินที่อนุมัติ & หมายเหตุ (ขนานกัน 2 คอลัมน์) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* จำนวนเงินที่อนุมัติ (Input ตัวเลข) */}
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="block text-[11px] font-bold text-slate-800">
                      จำนวนเงินที่อนุมัติ (บาท) <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const planned = Number(approvalModalProject[`งบประมาณ ${targetYear}` as keyof Project]) || 0;
                        if (planned > 0) setFormApprovedAmount(planned);
                      }}
                      className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
                    >
                      ดึงงบตามแผน
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={formApprovedAmount}
                      onChange={(e) => setFormApprovedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full h-[36px] bg-white border border-slate-300 rounded-lg pl-2.5 pr-7 text-xs text-slate-900 font-bold font-mono focus:outline-none focus:ring-1.5 focus:ring-emerald-500 shadow-2xs"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">
                      ฿
                    </span>
                  </div>
                </div>

                {/* หมายเหตุ */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-0.5">
                    หมายเหตุ
                  </label>
                  <input
                    type="text"
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    placeholder="เช่น อนุมัติตามเทศบัญญัติงบประมาณ..."
                    className="w-full h-[36px] bg-white border border-slate-300 rounded-lg px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1.5 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer: [บันทึก] (สีเขียว) และ [กลับไป] (สีเทา) - Pinned to bottom */}
            <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <div className="text-[10px] text-slate-500">
                * เมื่อบันทึกแล้ว สถานะจะปรับเป็น <strong className="text-emerald-700">"อนุมัติแล้ว"</strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setApprovalModalProject(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer shadow-2xs"
                >
                  กลับไป
                </button>

                <button
                  type="button"
                  onClick={handleSaveApprovalForm}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs hover:shadow-xs transition cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>บันทึก</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: MODAL รายงานยอดงบประมาณคงเหลือ (เมื่อกดปุ่มรายงาน)                 */}
      {/* ========================================================================= */}
      {isBalanceReportOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsBalanceReportOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Printer className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-base font-bold leading-tight">
                    รายงานสรุปยอดงบประมาณคงเหลือและการจัดสรรงบประมาณ
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {ORG_NAME} ประจำปีงบประมาณ พ.ศ. {targetYear}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์รายงาน</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsBalanceReportOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-semibold block">ยอดงบประมาณตามแผนทั้งหมด</span>
                  <span className="text-base font-bold text-slate-900 font-mono block mt-1">
                    ฿{formatMoneyNoDec(overallStats.totalPlanned)}
                  </span>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <span className="text-emerald-700 font-semibold block">ยอดงบประมาณที่อนุมัติแล้ว</span>
                  <span className="text-base font-bold text-emerald-800 font-mono block mt-1">
                    ฿{formatMoneyNoDec(overallStats.totalApproved)}
                  </span>
                </div>
                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200">
                  <span className="text-indigo-700 font-semibold block">ยอดงบประมาณคงเหลือที่ยังไม่อนุมัติ</span>
                  <span className="text-base font-bold text-indigo-900 font-mono block mt-1">
                    ฿{formatMoneyNoDec(overallStats.totalBalance)}
                  </span>
                </div>
              </div>

              {/* Table Grouped by Strategy */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2 px-3 w-12 text-center">ที่</th>
                      <th className="py-2 px-3">ยุทธศาสตร์ / ประเด็นการพัฒนา</th>
                      <th className="py-2 px-3 text-center w-24">โครงการ</th>
                      <th className="py-2 px-3 text-right w-32">งบตามแผน (บาท)</th>
                      <th className="py-2 px-3 text-right w-32 text-emerald-800">อนุมัติแล้ว (บาท)</th>
                      <th className="py-2 px-3 text-right w-32 text-indigo-800">คงเหลือ (บาท)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {groupedProjects.map((grp, i) => (
                      <tr key={grp.strategyName} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-center font-mono">{i + 1}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{grp.strategyName}</td>
                        <td className="py-2 px-3 text-center font-mono">{grp.items.length}</td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-slate-700">
                          {formatMoneyNoDec(grp.totalPlanned)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                          {formatMoneyNoDec(grp.totalApproved)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-indigo-700">
                          {formatMoneyNoDec(grp.totalBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-300">
                      <td colSpan={2} className="py-2.5 px-3 text-right">รวมทั้งสิ้น</td>
                      <td className="py-2.5 px-3 text-center font-mono">{overallStats.totalCount}</td>
                      <td className="py-2.5 px-3 text-right font-mono">฿{formatMoneyNoDec(overallStats.totalPlanned)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-800">฿{formatMoneyNoDec(overallStats.totalApproved)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-indigo-800">฿{formatMoneyNoDec(overallStats.totalBalance)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsBalanceReportOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold text-xs transition cursor-pointer"
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
