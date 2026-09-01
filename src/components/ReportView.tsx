import React, { useState, useMemo } from 'react';
import {
  FileText,
  Printer,
  FileSpreadsheet,
  Download,
  Filter,
  Layers,
  ChevronDown,
  Building2,
  GitCompare,
  History,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Eye
} from 'lucide-react';
import { Report01Data, Report02Data, PlanType, Project, ProjectSnapshot } from '../types';
import { YEARS, ORG_NAME, ORG_PROVINCE, TYPE_LIST, STANDARD_STRATEGIC_ISSUES, STANDARD_DEPARTMENTS, sortStrategicIssues } from '../data/initialData';
import { PdfExportModal } from './PdfExportModal';
import { StandardFilterBar } from './StandardFilterBar';
import {
  exportProjects,
  exportReport01,
  exportReport02Change,
  exportReport02Edit
} from '../services/exportService';

interface ReportViewProps {
  report01: Report01Data;
  report02: Report02Data;
  selectedEdition: string;
  onSelectEdition: (edition: string) => void;
  projects?: Project[];
  reportMode?: 'ผ01' | 'ผ02' | 'all';
  onToggleMobile?: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  report01,
  report02,
  selectedEdition,
  onSelectEdition,
  projects = [],
  reportMode = 'all',
  onToggleMobile
}) => {
  // Tab types:
  // 'ผ01' -> แบบ ผ.๐๑ บัญชีสรุปโครงการ (รูปที่ 2)
  // 'ผ02-baseline' -> แบบ ผ.๐๒ บัญชีรายละเอียดโครงการ (ฉบับแรก - รูปที่ 1)
  // 'ผ02-additional' -> แบบ ผ.๐๒ (ฉบับเพิ่มเติม)
  // 'change-diff' -> แบบบัญชีเปรียบเทียบโครงการ (ฉบับเปลี่ยนแปลง)
  // 'edit-diff' -> แบบบัญชีแก้ไขโครงการ (ฉบับแก้ไข)
  // 'ผ02-all' -> แบบ ผ.๐๒ รวมทุกฉบับ (ภาพรวมปัจจุบัน)
  const [activeTab, setActiveTab] = useState<
    'ผ01' | 'ผ02-baseline' | 'ผ02-additional' | 'change-diff' | 'edit-diff' | 'ผ02-all'
  >(() => (reportMode === 'ผ01' ? 'ผ01' : 'ผ02-baseline'));

  // Sync activeTab when reportMode changes
  React.useEffect(() => {
    if (reportMode === 'ผ01') {
      setActiveTab('ผ01');
    } else if (reportMode === 'ผ02' && activeTab === 'ผ01') {
      setActiveTab('ผ02-baseline');
    }
  }, [reportMode]);

  // Customizer for Organization Header
  const [customOrgName, setCustomOrgName] = useState<string>(ORG_NAME);
  const [customProvince, setCustomProvince] = useState<string>(ORG_PROVINCE);
  const [revisionRound, setRevisionRound] = useState<string>('1/2571');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);

  // Helper for converting digits (Standard Arabic numbers)
  const formatDigits = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '';
    return String(val);
  };

  const toThai = formatDigits; // alias for backwards compatibility

  const formatMoney = (n: number | undefined | null, emptyChar: string = '-'): string => {
    const num = Number(n) || 0;
    if (num <= 0) return emptyChar;
    return num.toLocaleString('th-TH');
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter states
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>('ทั้งหมด');
  const [filterIssue, setFilterIssue] = useState<string>('ทั้งหมด');
  const [filterDepartment, setFilterDepartment] = useState<string>('ทั้งหมด');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [filterBudget, setFilterBudget] = useState<string>('');

  // Extract unique issues and departments
  const availableIssues = useMemo(() => {
    const set = new Set<string>(STANDARD_STRATEGIC_ISSUES);
    projects.forEach((p) => {
      if (p['ประเด็นการพัฒนา']) set.add(p['ประเด็นการพัฒนา']);
    });
    return sortStrategicIssues(Array.from(set));
  }, [projects]);

  const availableDepartments = useMemo(() => {
    const set = new Set<string>(STANDARD_DEPARTMENTS);
    projects.forEach((p) => {
      if (p['หน่วยงานรับผิดชอบหลัก']) set.add(p['หน่วยงานรับผิดชอบหลัก']);
    });
    return Array.from(set);
  }, [projects]);

  // Base filtered list of projects based on user filters
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Fiscal year filter
      if (selectedFiscalYear !== 'ทั้งหมด') {
        const yNum = Number(selectedFiscalYear);
        const b = Number(p[`งบประมาณ ${yNum}` as keyof Project]) || 0;
        const projectYear = String(p['ปี พ.ศ.'] || '');
        if (projectYear !== selectedFiscalYear && b <= 0) {
          return false;
        }
      }
      // Issue filter
      if (filterIssue !== 'ทั้งหมด' && p['ประเด็นการพัฒนา'] !== filterIssue) {
        return false;
      }
      // Department filter
      if (filterDepartment !== 'ทั้งหมด' && p['หน่วยงานรับผิดชอบหลัก'] !== filterDepartment) {
        return false;
      }
      // Search filter
      if (filterSearch.trim()) {
        const q = filterSearch.toLowerCase();
        const matchName = (p['ชื่อโครงการ'] || '').toLowerCase().includes(q);
        const matchObj = (p['วัตถุประสงค์'] || '').toLowerCase().includes(q);
        const matchTarget = (p['เป้าหมาย (ผลผลิต)'] || '').toLowerCase().includes(q);
        if (!matchName && !matchObj && !matchTarget) return false;
      }
      // Budget filter
      if (filterBudget.trim()) {
        const minB = Number(filterBudget.replace(/,/g, ''));
        if (!isNaN(minB)) {
          const totalB = YEARS.reduce((sum, y) => sum + (Number(p[`งบประมาณ ${y}` as keyof Project]) || 0), 0);
          if (totalB < minB) return false;
        }
      }
      return true;
    });
  }, [projects, selectedFiscalYear, filterIssue, filterDepartment, filterSearch, filterBudget]);

  // Filter projects based on the active tab
  const baselineProjects = useMemo(() => {
    return filteredProjects.filter((p) => (p['ประเภทรายการ'] || 'ฉบับแรก') === 'ฉบับแรก');
  }, [filteredProjects]);

  const additionalProjects = useMemo(() => {
    return filteredProjects.filter((p) => p['ประเภทรายการ'] === 'เพิ่มเติม');
  }, [filteredProjects]);

  const changeProjects = useMemo(() => {
    return filteredProjects.filter((p) => p['ประเภทรายการ'] === 'เปลี่ยนแปลง');
  }, [filteredProjects]);

  const editProjects = useMemo(() => {
    return filteredProjects.filter((p) => p['ประเภทรายการ'] === 'แก้ไข');
  }, [filteredProjects]);

  // Grouping helper for ผ.02 forms
  const groupProjectsByIssue = (list: Project[]) => {
    const grouped: Record<string, Project[]> = {};
    const order: string[] = [];

    list.forEach((p) => {
      const issue = p['ประเด็นการพัฒนา'] || '(ไม่ระบุประเด็นการพัฒนา)';
      if (!grouped[issue]) {
        grouped[issue] = [];
        order.push(issue);
      }
      grouped[issue].push(p);
    });

    const sortedOrder = sortStrategicIssues(order);
    return sortedOrder.map((issue) => ({ issue, items: grouped[issue] || [] }));
  };

  // Grouped datasets
  const baselineGroups = useMemo(() => groupProjectsByIssue(baselineProjects), [baselineProjects]);
  const additionalGroups = useMemo(() => groupProjectsByIssue(additionalProjects), [additionalProjects]);
  const changeGroups = useMemo(() => groupProjectsByIssue(changeProjects), [changeProjects]);
  const editGroups = useMemo(() => groupProjectsByIssue(editProjects), [editProjects]);
  const allGroups = useMemo(() => groupProjectsByIssue(filteredProjects), [filteredProjects]);

  // Dynamic Report 01 Calculation (computed based on current dataset)
  const dynamicReport01 = useMemo(() => {
    const issuesMap: Record<string, { [y: number]: { count: number; budget: number } }> = {};
    const issueOrder: string[] = [];

    filteredProjects.forEach((p) => {
      const issue = p['ประเด็นการพัฒนา'] || '(ไม่ระบุประเด็นการพัฒนา)';
      if (!issuesMap[issue]) {
        issuesMap[issue] = {};
        YEARS.forEach((y) => (issuesMap[issue][y] = { count: 0, budget: 0 }));
        issueOrder.push(issue);
      }

      YEARS.forEach((y) => {
        const b = Number(p[`งบประมาณ ${y}` as keyof Project]) || 0;
        if (b > 0) {
          issuesMap[issue][y].count += 1;
          issuesMap[issue][y].budget += b;
        }
      });
    });

    const sortedIssueOrder = sortStrategicIssues(issueOrder);
    const rows = sortedIssueOrder.map((issue) => ({ issue, years: issuesMap[issue] }));
    const totals: { [y: number]: { count: number; budget: number } } = {};
    YEARS.forEach((y) => (totals[y] = { count: 0, budget: 0 }));

    let grandTotalCount = 0;
    let grandTotalBudget = 0;

    rows.forEach((r) => {
      YEARS.forEach((y) => {
        totals[y].count += r.years[y].count;
        totals[y].budget += r.years[y].budget;
      });
    });

    YEARS.forEach((y) => {
      grandTotalCount += totals[y].count;
      grandTotalBudget += totals[y].budget;
    });

    return {
      rows,
      totals,
      grandTotalCount,
      grandTotalBudget
    };
  }, [filteredProjects]);

  // Export handlers tailored for each report sheet
  const handleExportExcel = () => {
    if (activeTab === 'ผ01') {
      exportReport01(dynamicReport01, 'excel', `แบบ_ผ.01_บัญชีสรุปโครงการ_ปี_${selectedFiscalYear}`);
    } else if (activeTab === 'change-diff') {
      exportReport02Change(changeProjects, 'excel', `แบบ_ผ.02_เปลี่ยนแปลง_ครั้งที่_${revisionRound}`);
    } else if (activeTab === 'edit-diff') {
      exportReport02Edit(editProjects, 'excel', `แบบ_ผ.02_แก้ไข_ครั้งที่_${revisionRound}`);
    } else if (activeTab === 'ผ02-baseline') {
      exportProjects(baselineProjects, 'excel', `แบบ_ผ.02_ฉบับแรก_ปี_${selectedFiscalYear}`);
    } else if (activeTab === 'ผ02-additional') {
      exportProjects(additionalProjects, 'excel', `แบบ_ผ.02_เพิ่มเติม_ครั้งที่_${revisionRound}`);
    } else {
      exportProjects(filteredProjects, 'excel', `แบบ_ผ.02_รวมทุกฉบับ_ปี_${selectedFiscalYear}`);
    }
  };

  const handleExportCsv = () => {
    if (activeTab === 'ผ01') {
      exportReport01(dynamicReport01, 'csv', `แบบ_ผ.01_บัญชีสรุปโครงการ_ปี_${selectedFiscalYear}`);
    } else if (activeTab === 'change-diff') {
      exportReport02Change(changeProjects, 'csv', `แบบ_ผ.02_เปลี่ยนแปลง_ครั้งที่_${revisionRound}`);
    } else if (activeTab === 'edit-diff') {
      exportReport02Edit(editProjects, 'csv', `แบบ_ผ.02_แก้ไข_ครั้งที่_${revisionRound}`);
    } else if (activeTab === 'ผ02-baseline') {
      exportProjects(baselineProjects, 'csv', `แบบ_ผ.02_ฉบับแรก_ปี_${selectedFiscalYear}`);
    } else if (activeTab === 'ผ02-additional') {
      exportProjects(additionalProjects, 'csv', `แบบ_ผ.02_เพิ่มเติม_ครั้งที่_${revisionRound}`);
    } else {
      exportProjects(filteredProjects, 'csv', `แบบ_ผ.02_รวมทุกฉบับ_ปี_${selectedFiscalYear}`);
    }
  };

  const handleExportPdf = () => {
    setIsPdfModalOpen(true);
  };

  const exportItemCount = useMemo(() => {
    if (activeTab === 'ผ01') return dynamicReport01.rows.length;
    if (activeTab === 'ผ02-baseline') return baselineProjects.length;
    if (activeTab === 'ผ02-additional') return additionalProjects.length;
    if (activeTab === 'change-diff') return changeProjects.length;
    if (activeTab === 'edit-diff') return editProjects.length;
    return filteredProjects.length;
  }, [activeTab, dynamicReport01, baselineProjects, additionalProjects, changeProjects, editProjects, filteredProjects]);

  return (
    <div className="space-y-3 flex flex-col h-full">
      {/* ================= 1-2. UNIFIED TOP CONTAINER (HEADER & ACTION/TAB BAR) ================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden shrink-0 no-print">
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
                <FileText className="w-4 h-4" />
              </button>
            )}
            <div className="w-8 h-8 rounded-lg bg-emerald-900/80 border border-emerald-500/40 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold leading-tight flex items-center gap-2 flex-wrap">
                <span>
                  {reportMode === 'ผ01'
                    ? `รายงาน แบบ ${formatDigits('ผ.01')} บัญชีสรุปโครงการพัฒนาท้องถิ่น`
                    : reportMode === 'ผ02'
                    ? `รายงาน แบบ ${formatDigits('ผ.02')} บัญชีรายละเอียดโครงการพัฒนาท้องถิ่น`
                    : `รายงานแผนพัฒนาท้องถิ่น`}
                </span>
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
          allYearsLabel="ทั้งหมด (2571-2575)"
          issueLabel="ประเด็นการพัฒนา"
          issueValue={filterIssue}
          onIssueChange={(val) => setFilterIssue(val)}
          issueOptions={availableIssues}
          issueAllLabel="-- ทุกประเด็นการพัฒนา --"
          departmentLabel="หน่วยงานรับผิดชอบหลัก"
          departmentValue={filterDepartment}
          onDepartmentChange={(val) => setFilterDepartment(val)}
          departmentOptions={availableDepartments}
          departmentAllLabel="-- ทุกหน่วยงาน --"
          searchLabel="ชื่อโครงการ"
          searchValue={filterSearch}
          onSearchChange={(val) => setFilterSearch(val)}
          searchPlaceholder="ค้นหาชื่อโครงการในรายงาน..."
          budgetLabel="งบประมาณ (บาท)"
          budgetValue={filterBudget}
          onBudgetChange={(val) => setFilterBudget(val)}
          budgetPlaceholder="ระบุจำนวนเงิน..."
          onSearch={() => {}}
          onShowAll={() => {
            setSelectedFiscalYear('ทั้งหมด');
            setFilterIssue('ทั้งหมด');
            setFilterDepartment('ทั้งหมด');
            setFilterSearch('');
            setFilterBudget('');
          }}
          onReset={() => {
            setSelectedFiscalYear('ทั้งหมด');
            setFilterIssue('ทั้งหมด');
            setFilterDepartment('ทั้งหมด');
            setFilterSearch('');
            setFilterBudget('');
          }}
          extraControlsCenter={
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Tabs for ผ.01 */}
              {(reportMode === 'ผ01' || reportMode === 'all') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('ผ01')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition border cursor-pointer ${
                    activeTab === 'ผ01'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>แบบ {formatDigits('ผ.01')}</span>
                </button>
              )}

              {/* Tabs for ผ.02 */}
              {(reportMode === 'ผ02' || reportMode === 'all') && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ผ02-baseline')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition border cursor-pointer ${
                      activeTab === 'ผ02-baseline'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>แบบ {formatDigits('ผ.02')} (ฉบับแรก)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('ผ02-additional')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition border cursor-pointer ${
                      activeTab === 'ผ02-additional'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>แบบ {formatDigits('ผ.02')} (เพิ่มเติม)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('change-diff')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition border cursor-pointer ${
                      activeTab === 'change-diff'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    <span>แบบ {formatDigits('ผ.02')} (เปลี่ยนแปลง)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('edit-diff')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition border cursor-pointer ${
                      activeTab === 'edit-diff'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    <span>แบบ {formatDigits('ผ.02')} (แก้ไข)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('ผ02-all')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition border cursor-pointer ${
                      activeTab === 'ผ02-all'
                        ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>ฉบับรวม</span>
                  </button>
                </>
              )}
            </div>
          }
          onExportExcel={handleExportExcel}
          onExportCsv={handleExportCsv}
          onExportPdf={handleExportPdf}
          exportItemsCount={exportItemCount}
          onPrint={handlePrint}
          printLabel="พิมพ์รายงาน"
        />
      </div>

      {/* ================= OFFICIAL REPORT PRINT CANVAS ================= */}
      <div className="bg-white rounded-lg p-3 sm:p-5 border border-slate-200 shadow-2xs report-sheet overflow-auto max-h-[calc(100vh-175px)] custom-scrollbar flex-1 print:max-h-none print:overflow-visible print:p-0 print:border-none print:shadow-none">
        
        {/* =========================================================================
            TAB 1: แบบ ผ.02 ฉบับแรก (ตามรูปที่ 1 ของผู้ใช้)
           ========================================================================= */}
        {activeTab === 'ผ02-baseline' && (
          <div className="space-y-6">
            {/* Top Right Label */}
            <div className="text-right text-sm sm:text-base font-bold text-slate-900">
              แบบ {formatDigits('ผ.02')}
            </div>

            {/* Official Center Title */}
            <div className="text-center space-y-1">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                บัญชีรายละเอียดโครงการพัฒนาท้องถิ่น
              </h3>
              <p className="text-base sm:text-lg font-bold text-slate-900">
                แผนพัฒนาท้องถิ่น (พ.ศ. {formatDigits('2571-2575')})
              </p>
              <p className="text-sm sm:text-base font-bold text-slate-900">
                {customOrgName} {customProvince}
              </p>
            </div>

            {/* Project Tables Grouped by Issue */}
            {baselineGroups.length > 0 ? (
              baselineGroups.map((group, gIdx) => {
                const groupTotals: Record<number, number> = {
                  2571: 0,
                  2572: 0,
                  2573: 0,
                  2574: 0,
                  2575: 0
                };

                group.items.forEach((p) => {
                  YEARS.forEach((y) => {
                    groupTotals[y] += Number(p[`งบประมาณ ${y}` as keyof Project]) || 0;
                  });
                });

                return (
                  <div key={group.issue} className="mt-8 space-y-2.5">
                    {/* Section Header as in Image 1: ๑. ประเด็นการพัฒนาท้องถิ่น............ */}
                    <div className="text-xs sm:text-sm font-bold text-slate-900">
                      {formatDigits(gIdx + 1)}. ประเด็นการพัฒนาท้องถิ่น: {group.issue}
                    </div>

                    {/* Official Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse border border-slate-900">
                        <thead>
                          <tr className="bg-slate-50 text-slate-900 border-b border-slate-900 text-center">
                            <th
                              rowSpan={2}
                              className="py-2.5 px-2 border border-slate-900 font-bold w-10 align-middle"
                            >
                              ที่
                            </th>
                            <th
                              rowSpan={2}
                              className="py-2.5 px-3 border border-slate-900 font-bold min-w-[200px] text-left align-middle"
                            >
                              โครงการ
                            </th>
                            <th
                              rowSpan={2}
                              className="py-2.5 px-3 border border-slate-900 font-bold min-w-[170px] text-left align-middle"
                            >
                              วัตถุประสงค์
                            </th>
                            <th
                              rowSpan={2}
                              className="py-2.5 px-3 border border-slate-900 font-bold min-w-[170px] text-left align-middle"
                            >
                              เป้าหมาย<br />(ผลผลิตของโครงการ)
                            </th>
                            <th
                              colSpan={YEARS.length}
                              className="py-1.5 px-2 text-center border border-slate-900 font-bold bg-slate-100"
                            >
                              งบประมาณ
                            </th>
                            <th
                              rowSpan={2}
                              className="py-2.5 px-3 border border-slate-900 font-bold min-w-[150px] text-left align-middle"
                            >
                              ผลที่คาดว่า<br />จะได้รับ
                            </th>
                            <th
                              rowSpan={2}
                              className="py-2.5 px-3 border border-slate-900 font-bold min-w-[120px] text-left align-middle"
                            >
                              หน่วยงาน<br />รับผิดชอบ
                            </th>
                          </tr>
                          <tr className="bg-slate-100 text-slate-900 border-b border-slate-900 text-[11px] text-center font-bold">
                            {YEARS.map((y) => (
                              <th
                                key={y}
                                className="py-1 px-1.5 border border-slate-900 min-w-[80px]"
                              >
                                {formatDigits(y)}<br />(บาท)
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {group.items.map((p, pIdx) => (
                            <tr key={p.ID} className="hover:bg-slate-50">
                              <td className="py-2 px-2 text-center border border-slate-900 font-bold align-top">
                                {formatDigits(pIdx + 1)}
                              </td>
                              <td className="py-2 px-2.5 border border-slate-900 font-semibold text-slate-900 align-top leading-snug">
                                {p['ชื่อโครงการ']}
                              </td>
                              <td className="py-2 px-2.5 border border-slate-900 text-slate-800 align-top leading-snug whitespace-pre-line">
                                {p['วัตถุประสงค์'] || '-'}
                              </td>
                              <td className="py-2 px-2.5 border border-slate-900 text-slate-800 align-top leading-snug whitespace-pre-line">
                                {p['เป้าหมาย (ผลผลิต)'] || '-'}
                              </td>

                              {/* 5-Year Budget Columns */}
                              {YEARS.map((y) => {
                                const val = Number(p[`งบประมาณ ${y}` as keyof Project]) || 0;
                                return (
                                  <td
                                    key={y}
                                    className="py-2 px-2 text-right border border-slate-900 font-mono align-top whitespace-nowrap"
                                  >
                                    {formatMoney(val)}
                                  </td>
                                );
                              })}

                              <td className="py-2 px-2.5 border border-slate-900 text-slate-800 align-top leading-snug">
                                {p['ผลที่คาดว่าจะได้รับ'] || '-'}
                              </td>
                              <td className="py-2 px-2.5 border border-slate-900 text-slate-900 font-medium align-top">
                                {p['หน่วยงานรับผิดชอบหลัก'] || '-'}
                              </td>
                            </tr>
                          ))}

                          {/* Subtotal Row matching Image 1: รวม | XXX | - | - | XXX | XXX | ... */}
                          <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-900">
                            <td className="py-2 px-2 text-center border border-slate-900 font-bold">
                              รวม
                            </td>
                            <td className="py-2 px-2.5 border border-slate-900 font-bold">
                              {formatDigits(group.items.length)} โครงการ
                            </td>
                            <td className="py-2 px-2 text-center border border-slate-900 font-bold">-</td>
                            <td className="py-2 px-2 text-center border border-slate-900 font-bold">-</td>
                            {YEARS.map((y) => (
                              <td
                                key={y}
                                className="py-2 px-2 text-right border border-slate-900 font-mono font-bold whitespace-nowrap"
                              >
                                {formatMoney(groupTotals[y])}
                              </td>
                            ))}
                            <td className="py-2 px-2 text-center border border-slate-900 font-bold">-</td>
                            <td className="py-2 px-2 text-center border border-slate-900 font-bold">-</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 border border-dashed border-slate-300 rounded-lg">
                ไม่มีข้อมูลโครงการในฉบับแรก
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: แบบ ผ.01 บัญชีสรุปโครงการ (ตามรูปที่ 2 ของผู้ใช้)
           ========================================================================= */}
        {activeTab === 'ผ01' && (
          <div className="space-y-6">
            {/* Top Right Label */}
            <div className="text-right text-sm sm:text-base font-bold text-slate-900">
              แบบ {formatDigits('ผ.01')}
            </div>

            {/* Official Center Title */}
            <div className="text-center space-y-1">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                บัญชีสรุปโครงการพัฒนาท้องถิ่น
              </h3>
              <p className="text-base sm:text-lg font-bold text-slate-900">
                แผนพัฒนาท้องถิ่น (พ.ศ. {formatDigits('2571-2575')})
              </p>
              <p className="text-sm sm:text-base font-bold text-slate-900">
                {customOrgName} {customProvince}
              </p>
            </div>

            {/* Official Table Matching Image 2 */}
            <div className="overflow-x-auto mt-6">
              <table className="w-full text-xs text-left border-collapse border border-slate-900">
                <thead>
                  <tr className="bg-slate-50 text-slate-900 border-b border-slate-900 text-center font-bold">
                    <th
                      rowSpan={2}
                      className="py-3 px-3 text-center border border-slate-900 font-bold min-w-[260px] align-middle"
                    >
                      ประเด็น<br />การพัฒนาท้องถิ่น
                    </th>
                    {YEARS.map((y) => (
                      <th
                        key={y}
                        colSpan={2}
                        className="py-2 px-2 text-center border border-slate-900 font-bold"
                      >
                        ปี {formatDigits(y)}
                      </th>
                    ))}
                    <th
                      colSpan={2}
                      className="py-2 px-2 text-center border border-slate-900 font-bold bg-slate-100"
                    >
                      รวม {formatDigits(5)} ปี ({formatDigits('2571-2575')})
                    </th>
                  </tr>
                  <tr className="bg-slate-100 text-slate-900 border-b border-slate-900 text-[11px] text-center font-bold">
                    {YEARS.map((y) => (
                      <React.Fragment key={y}>
                        <th className="py-1.5 px-1 border border-slate-900 w-16">
                          จำนวน<br />โครงการ
                        </th>
                        <th className="py-1.5 px-2 border border-slate-900 min-w-[95px]">
                          งบประมาณ<br />(บาท)
                        </th>
                      </React.Fragment>
                    ))}
                    <th className="py-1.5 px-1 border border-slate-900 w-16 bg-slate-100">
                      จำนวน<br />โครงการ
                    </th>
                    <th className="py-1.5 px-2 border border-slate-900 min-w-[105px] bg-slate-100">
                      งบประมาณ<br />(บาท)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dynamicReport01.rows.length > 0 ? (
                    dynamicReport01.rows.map((row, idx) => {
                      let issueTotalCount = 0;
                      let issueTotalBudget = 0;
                      YEARS.forEach((y) => {
                        issueTotalCount += row.years[y].count;
                        issueTotalBudget += row.years[y].budget;
                      });

                      return (
                        <tr key={row.issue} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 border border-slate-900 font-semibold text-slate-900 leading-relaxed">
                            {formatDigits(idx + 1)}. {row.issue}
                          </td>
                          {YEARS.map((y) => (
                            <React.Fragment key={y}>
                              <td className="py-2 px-1 text-center border border-slate-900 font-mono">
                                {row.years[y].count > 0 ? formatDigits(row.years[y].count) : '-'}
                              </td>
                              <td className="py-2 px-2 text-right border border-slate-900 font-mono whitespace-nowrap">
                                {formatMoney(row.years[y].budget)}
                              </td>
                            </React.Fragment>
                          ))}
                          <td className="py-2 px-1 text-center border border-slate-900 font-bold font-mono bg-slate-50">
                            {issueTotalCount > 0 ? formatDigits(issueTotalCount) : '-'}
                          </td>
                          <td className="py-2 px-2 text-right border border-slate-900 font-bold font-mono bg-slate-50 whitespace-nowrap">
                            {formatMoney(issueTotalBudget)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={1 + YEARS.length * 2 + 2}
                        className="p-8 text-center text-slate-400"
                      >
                        ยังไม่มีข้อมูลโครงการในแผนพัฒนาท้องถิ่น
                      </td>
                    </tr>
                  )}

                  {/* Grand Total Row Matching Image 2: รวมทั้งสิ้น */}
                  <tr className="bg-slate-200 font-extrabold text-slate-900 border-t-2 border-slate-900">
                    <td className="py-2.5 px-3 border border-slate-900 text-center font-bold">
                      รวมทั้งสิ้น
                    </td>
                    {YEARS.map((y) => (
                      <React.Fragment key={y}>
                        <td className="py-2 px-1 text-center border border-slate-900 font-mono font-bold">
                          {dynamicReport01.totals[y].count > 0 ? formatDigits(dynamicReport01.totals[y].count) : '-'}
                        </td>
                        <td className="py-2 px-2 text-right border border-slate-900 font-mono font-bold whitespace-nowrap">
                          {formatMoney(dynamicReport01.totals[y].budget)}
                        </td>
                      </React.Fragment>
                    ))}
                    <td className="py-2 px-1 text-center border border-slate-900 font-mono font-bold bg-slate-300">
                      {formatDigits(dynamicReport01.grandTotalCount)}
                    </td>
                    <td className="py-2 px-2 text-right border border-slate-900 font-mono font-bold bg-slate-300 whitespace-nowrap">
                      {formatMoney(dynamicReport01.grandTotalBudget)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: แบบ ผ.02 (ฉบับเพิ่มเติม)
           ========================================================================= */}
        {activeTab === 'ผ02-additional' && (
          <div className="space-y-6">
            {/* Top Right Label */}
            <div className="text-right text-sm sm:text-base font-bold text-slate-900">
              แบบ {formatDigits('ผ.02')}
            </div>

            {/* Official Center Title */}
            <div className="text-center space-y-1">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                บัญชีรายละเอียดโครงการพัฒนาท้องถิ่น
              </h3>
              <p className="text-base sm:text-lg font-bold text-slate-900">
                แผนพัฒนาท้องถิ่น (พ.ศ. {formatDigits('2571-2575')}) เพิ่มเติม ครั้งที่ {formatDigits(revisionRound)}
              </p>
              <p className="text-sm sm:text-base font-bold text-slate-900">
                {customOrgName} {customProvince}
              </p>
            </div>

            {/* Additional Projects Table */}
            {additionalGroups.length > 0 ? (
              additionalGroups.map((group, gIdx) => {
                const groupTotals: Record<number, number> = {
                  2571: 0,
                  2572: 0,
                  2573: 0,
                  2574: 0,
                  2575: 0
                };

                group.items.forEach((p) => {
                  YEARS.forEach((y) => {
                    groupTotals[y] += Number(p[`งบประมาณ ${y}` as keyof Project]) || 0;
                  });
                });

                return (
                  <div key={group.issue} className="mt-8 space-y-2.5">
                    <div className="text-xs sm:text-sm font-bold text-slate-900">
                      {formatDigits(gIdx + 1)}. ประเด็นการพัฒนาท้องถิ่น: {group.issue}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse border border-slate-900">
                        <thead>
                          <tr className="bg-slate-50 text-slate-900 border-b border-slate-900 text-center">
                            <th rowSpan={2} className="py-2.5 px-2 border border-slate-900 font-bold w-10 align-middle">
                              ที่
                            </th>
                            <th rowSpan={2} className="py-2.5 px-3 border border-slate-900 font-bold min-w-[200px] text-left align-middle">
                              โครงการ
                            </th>
                            <th rowSpan={2} className="py-2.5 px-3 border border-slate-900 font-bold min-w-[160px] text-left align-middle">
                              วัตถุประสงค์
                            </th>
                            <th rowSpan={2} className="py-2.5 px-3 border border-slate-900 font-bold min-w-[160px] text-left align-middle">
                              เป้าหมาย<br />(ผลผลิตของโครงการ)
                            </th>
                            <th colSpan={YEARS.length} className="py-1.5 px-2 text-center border border-slate-900 font-bold bg-slate-100">
                              งบประมาณ (บาท)
                            </th>
                            <th rowSpan={2} className="py-2.5 px-3 border border-slate-900 font-bold min-w-[140px] text-left align-middle">
                              ผลที่คาดว่า<br />จะได้รับ
                            </th>
                            <th rowSpan={2} className="py-2.5 px-3 border border-slate-900 font-bold min-w-[120px] text-left align-middle">
                              หน่วยงาน<br />รับผิดชอบ
                            </th>
                            <th rowSpan={2} className="py-2.5 px-3 border border-slate-900 font-bold min-w-[160px] text-left align-middle">
                              เหตุผลความจำเป็น
                            </th>
                          </tr>
                          <tr className="bg-slate-100 text-slate-900 border-b border-slate-900 text-[11px] text-center font-bold">
                            {YEARS.map((y) => (
                              <th key={y} className="py-1 px-1.5 border border-slate-900 min-w-[80px]">
                                {formatDigits(y)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {group.items.map((p, pIdx) => (
                            <tr key={p.ID} className="hover:bg-slate-50">
                              <td className="py-2 px-2 text-center border border-slate-900 font-bold align-top">
                                {formatDigits(pIdx + 1)}
                              </td>
                              <td className="py-2 px-2.5 border border-slate-900 font-semibold text-slate-900 align-top leading-snug">
                                <div className="font-bold text-slate-900">{p['ชื่อโครงการ']}</div>
                              </td>
                              <td className="py-2 px-2.5 border border-slate-900 text-slate-800 align-top leading-snug whitespace-pre-line">
                                {p['วัตถุประสงค์'] || '-'}
                              </td>
                              <td className="py-2 px-2.5 border border-slate-900 text-slate-800 align-top leading-snug whitespace-pre-line">
                                {p['เป้าหมาย (ผลผลิต)'] || '-'}
                              </td>

                              {/* 5-Year Budget Columns */}
                              {YEARS.map((y) => {
                                const val = Number(p[`งบประมาณ ${y}` as keyof Project]) || 0;
                                return (
                                  <td
                                    key={y}
                                    className="py-2 px-2 text-right border border-slate-900 font-mono align-top whitespace-nowrap"
                                  >
                                    {formatMoney(val)}
                                  </td>
                                );
                              })}

                              <td className="py-2 px-2.5 border border-slate-900 text-slate-800 align-top leading-snug">
                                {p['ผลที่คาดว่าจะได้รับ'] || '-'}
                              </td>
                              <td className="py-2 px-2.5 border border-slate-900 text-slate-900 font-medium align-top">
                                {p['หน่วยงานรับผิดชอบหลัก'] || '-'}
                              </td>
                              <td className="py-2 px-2.5 border border-slate-900 text-slate-800 align-top leading-snug text-[11px] whitespace-pre-line">
                                {p['เหตุผลและความจำเป็น'] || '-'}
                              </td>
                            </tr>
                          ))}

                          {/* Subtotal Row */}
                          <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-900">
                            <td className="py-2 px-2 text-center border border-slate-900 font-bold">
                              รวม
                            </td>
                            <td className="py-2 px-2.5 border border-slate-900 font-bold">
                              {formatDigits(group.items.length)} โครงการ
                            </td>
                            <td className="py-2 px-2 text-center border border-slate-900 font-bold">-</td>
                            <td className="py-2 px-2 text-center border border-slate-900 font-bold">-</td>
                            {YEARS.map((y) => (
                              <td
                                key={y}
                                className="py-2 px-2 text-right border border-slate-900 font-mono font-bold whitespace-nowrap"
                              >
                                {formatMoney(groupTotals[y])}
                              </td>
                            ))}
                            <td className="py-2 px-2 text-center border border-slate-900 font-bold">-</td>
                            <td className="py-2 px-2 text-center border border-slate-900 font-bold">-</td>
                            <td className="py-2 px-2 text-center border border-slate-900 font-bold">-</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 border border-dashed border-slate-300 rounded-lg">
                ยังไม่มีข้อมูลโครงการที่ขออนุมัติเพิ่มเติม
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 4: แบบบัญชีเปรียบเทียบโครงการพัฒนาท้องถิ่น (ฉบับเปลี่ยนแปลง)
           ========================================================================= */}
        {activeTab === 'change-diff' && (
          <div className="space-y-6">
            {/* Top Right Label */}
            <div className="text-right text-sm sm:text-base font-bold text-slate-900">
              แบบ {formatDigits('ผ.02')}
            </div>

            {/* Official Center Title */}
            <div className="text-center space-y-1">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                บัญชีรายละเอียดโครงการพัฒนาท้องถิ่น
              </h3>
              <p className="text-base sm:text-lg font-bold text-slate-900">
                แผนพัฒนาท้องถิ่น (พ.ศ. {formatDigits('2571-2575')}) เปลี่ยนแปลง ครั้งที่ {formatDigits(revisionRound)}
              </p>
              <p className="text-sm sm:text-base font-bold text-slate-900">
                {customOrgName} {customProvince}
              </p>
            </div>

            {/* Comparison Table Grouped by Issue */}
            {changeGroups.length > 0 ? (
              changeGroups.map((group, gIdx) => (
                <div key={group.issue} className="mt-8 space-y-2.5">
                  {/* Issue Section Header */}
                  <div className="text-xs sm:text-sm font-bold text-slate-900">
                    {formatDigits(gIdx + 1)}. ประเด็นการพัฒนาท้องถิ่น: {group.issue}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse border border-slate-900">
                      <thead>
                        <tr className="bg-slate-50 text-slate-900 border-b border-slate-900 text-center font-bold">
                          <th className="py-3 px-2 border border-slate-900 w-10 align-middle">
                            ที่
                          </th>
                          <th className="py-3 px-3 border border-slate-900 min-w-[300px] text-left align-middle bg-slate-100/70">
                            โครงการเดิม<br />(ตามแผนพัฒนาท้องถิ่น)
                          </th>
                          <th className="py-3 px-3 border border-slate-900 min-w-[300px] text-left align-middle bg-purple-50">
                            โครงการที่ขอเปลี่ยนแปลง<br />(ฉบับเปลี่ยนแปลง)
                          </th>
                          <th className="py-3 px-3 border border-slate-900 min-w-[200px] text-left align-middle">
                            เหตุผลและความจำเป็น<br />ในการเปลี่ยนแปลง
                          </th>
                          <th className="py-3 px-2 border border-slate-900 min-w-[120px] text-right align-middle">
                            ส่วนต่างงบประมาณ<br />(เพิ่ม / ลด)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((p, idx) => {
                          // Calculate 5-year budget sum before vs after
                          let sumBefore = 0;
                          let sumAfter = 0;

                          YEARS.forEach((y) => {
                            sumBefore += Number(p[`งบประมาณ ${y} (เดิม)` as keyof Project]) || 0;
                            sumAfter += Number(p[`งบประมาณ ${y}` as keyof Project]) || 0;
                          });

                          const diff = sumAfter - sumBefore;

                          return (
                            <tr key={p.ID} className="hover:bg-slate-50 border-b border-slate-900">
                              {/* Row Number */}
                              <td className="py-3 px-2 text-center border border-slate-900 font-bold align-top">
                                {formatDigits(idx + 1)}
                              </td>

                              {/* Column 1: โครงการเดิม */}
                              <td className="py-3 px-3 border border-slate-900 align-top bg-slate-50/50 space-y-1.5">
                                <div className="font-bold text-slate-900">
                                  {p['ชื่อโครงการ (เดิม)'] || p['ชื่อโครงการ']}
                                </div>
                                <div className="text-[11px] text-slate-700">
                                  <span className="font-semibold text-slate-900">วัตถุประสงค์:</span>{' '}
                                  {p['วัตถุประสงค์ (เดิม)'] || p['วัตถุประสงค์'] || '-'}
                                </div>
                                <div className="text-[11px] text-slate-700">
                                  <span className="font-semibold text-slate-900">เป้าหมาย (ผลผลิต):</span>{' '}
                                  {p['เป้าหมาย (เดิม)'] || p['เป้าหมาย (ผลผลิต)'] || '-'}
                                </div>
                                <div className="text-[11px] font-mono text-slate-800 bg-white p-1.5 rounded border border-slate-200">
                                  <span className="font-bold font-sans">งบประมาณรวม {formatDigits(5)} ปี: </span>
                                  {formatMoney(sumBefore)} บาท
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  หน่วยงานรับผิดชอบ: {p['หน่วยงานรับผิดชอบหลัก (เดิม)'] || p['หน่วยงานรับผิดชอบหลัก'] || '-'}
                                </div>
                              </td>

                              {/* Column 2: โครงการที่ขอเปลี่ยนแปลง */}
                              <td className="py-3 px-3 border border-slate-900 align-top bg-purple-50/30 space-y-1.5">
                                <div className="font-bold text-purple-950">
                                  {p['ชื่อโครงการ']}
                                </div>
                                <div className="text-[11px] text-slate-800">
                                  <span className="font-semibold text-purple-900">วัตถุประสงค์:</span>{' '}
                                  {p['วัตถุประสงค์'] || '-'}
                                </div>
                                <div className="text-[11px] text-slate-800">
                                  <span className="font-semibold text-purple-900">เป้าหมาย (ผลผลิต):</span>{' '}
                                  {p['เป้าหมาย (ผลผลิต)'] || '-'}
                                </div>
                                <div className="text-[11px] font-mono text-purple-900 bg-white p-1.5 rounded border border-purple-200">
                                  <span className="font-bold font-sans">งบประมาณรวม {formatDigits(5)} ปี: </span>
                                  {formatMoney(sumAfter)} บาท
                                </div>
                                <div className="text-[10px] text-slate-600">
                                  หน่วยงานรับผิดชอบ: {p['หน่วยงานรับผิดชอบหลัก'] || '-'}
                                </div>
                              </td>

                              {/* Column 3: เหตุผลความจำเป็น */}
                              <td className="py-3 px-3 border border-slate-900 align-top text-slate-800 text-[11px] leading-relaxed">
                                {p['เหตุผลและความจำเป็น'] || '-'}
                              </td>

                              {/* Column 4: ส่วนต่างงบประมาณ */}
                              <td className="py-3 px-2 text-right border border-slate-900 align-top font-mono font-bold whitespace-nowrap">
                                {diff === 0 ? (
                                  <span className="text-slate-500">ไม่เปลี่ยนแปลง</span>
                                ) : diff > 0 ? (
                                  <span className="text-emerald-700">+{formatMoney(diff)} บาท</span>
                                ) : (
                                  <span className="text-rose-700">-{formatMoney(Math.abs(diff))} บาท</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 border border-dashed border-slate-300 rounded-lg">
                ยังไม่มีข้อมูลโครงการที่ขออนุมัติเปลี่ยนแปลง
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 5: แบบบัญชีแก้ไขโครงการพัฒนาท้องถิ่น (ฉบับแก้ไข)
           ========================================================================= */}
        {activeTab === 'edit-diff' && (
          <div className="space-y-6">
            {/* Top Right Label */}
            <div className="text-right text-sm sm:text-base font-bold text-slate-900">
              แบบ {formatDigits('ผ.02')}
            </div>

            {/* Official Center Title */}
            <div className="text-center space-y-1">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                บัญชีรายละเอียดโครงการพัฒนาท้องถิ่น
              </h3>
              <p className="text-base sm:text-lg font-bold text-slate-900">
                แผนพัฒนาท้องถิ่น (พ.ศ. {formatDigits('2571-2575')}) แก้ไข ครั้งที่ {formatDigits(revisionRound)}
              </p>
              <p className="text-sm sm:text-base font-bold text-slate-900">
                {customOrgName} {customProvince}
              </p>
            </div>

            {/* Edit Comparison Table Grouped by Issue */}
            {editGroups.length > 0 ? (
              editGroups.map((group, gIdx) => (
                <div key={group.issue} className="mt-8 space-y-2.5">
                  {/* Issue Section Header */}
                  <div className="text-xs sm:text-sm font-bold text-slate-900">
                    {formatDigits(gIdx + 1)}. ประเด็นการพัฒนาท้องถิ่น: {group.issue}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse border border-slate-900">
                      <thead>
                        <tr className="bg-slate-50 text-slate-900 border-b border-slate-900 text-center font-bold">
                          <th className="py-3 px-2 border border-slate-900 w-10 align-middle">
                            ที่
                          </th>
                          <th className="py-3 px-3 border border-slate-900 min-w-[260px] text-left align-middle bg-slate-100/70">
                            ข้อความ/รายการเดิม<br />(ก่อนแก้ไข)
                          </th>
                          <th className="py-3 px-3 border border-slate-900 min-w-[260px] text-left align-middle bg-amber-50">
                            ข้อความ/รายการใหม่<br />(หลังแก้ไข)
                          </th>
                          <th className="py-3 px-3 border border-slate-900 min-w-[200px] text-left align-middle">
                            เหตุผลและความจำเป็นในการแก้ไข
                          </th>
                          <th className="py-3 px-3 border border-slate-900 min-w-[130px] text-center align-middle">
                            อำนาจอนุมัติ
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((p, idx) => (
                          <tr key={p.ID} className="hover:bg-slate-50 border-b border-slate-900">
                            <td className="py-3 px-2 text-center border border-slate-900 font-bold align-top">
                              {formatDigits(idx + 1)}
                            </td>

                            {/* ข้อความเดิม */}
                            <td className="py-3 px-3 border border-slate-900 align-top bg-slate-50/50 space-y-1">
                              <div className="font-bold text-slate-900">
                                {p['ชื่อโครงการ (เดิม)'] || p['ชื่อโครงการ']}
                              </div>
                              {p['วัตถุประสงค์ (เดิม)'] && (
                                <div className="text-[11px] text-slate-700">
                                  <span className="font-semibold text-slate-900">วัตถุประสงค์:</span> {p['วัตถุประสงค์ (เดิม)']}
                                </div>
                              )}
                              {p['เป้าหมาย (เดิม)'] && (
                                <div className="text-[11px] text-slate-700">
                                  <span className="font-semibold text-slate-900">เป้าหมาย:</span> {p['เป้าหมาย (เดิม)']}
                                </div>
                              )}
                              {p['หน่วยงานรับผิดชอบหลัก (เดิม)'] && (
                                <div className="text-[11px] text-slate-600">
                                  <span className="font-semibold text-slate-900">หน่วยงาน:</span> {p['หน่วยงานรับผิดชอบหลัก (เดิม)']}
                                </div>
                              )}
                            </td>

                            {/* ข้อความใหม่ */}
                            <td className="py-3 px-3 border border-slate-900 align-top bg-amber-50/30 space-y-1">
                              <div className="font-bold text-amber-950">
                                {p['ชื่อโครงการ']}
                              </div>
                              <div className="text-[11px] text-slate-800">
                                <span className="font-semibold text-amber-900">วัตถุประสงค์:</span> {p['วัตถุประสงค์'] || '-'}
                              </div>
                              <div className="text-[11px] text-slate-800">
                                <span className="font-semibold text-amber-900">เป้าหมาย:</span> {p['เป้าหมาย (ผลผลิต)'] || '-'}
                              </div>
                              <div className="text-[11px] text-slate-700">
                                <span className="font-semibold text-amber-900">หน่วยงาน:</span> {p['หน่วยงานรับผิดชอบหลัก'] || '-'}
                              </div>
                            </td>

                            {/* เหตุผลความจำเป็น */}
                            <td className="py-3 px-3 border border-slate-900 align-top text-slate-800 text-[11px] leading-relaxed">
                              {p['เหตุผลและความจำเป็น'] || 'แก้ไขข้อความให้ถูกต้องตรงตามข้อเท็จจริง'}
                            </td>

                            {/* อำนาจอนุมัติ */}
                            <td className="py-3 px-2 text-center border border-slate-900 align-top text-slate-800 text-xs font-semibold">
                              ผู้บริหารท้องถิ่น
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 border border-dashed border-slate-300 rounded-lg">
                ยังไม่มีข้อมูลโครงการที่ขออนุมัติแก้ไข
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 6: แบบ ผ.02 รวมทุกฉบับ (ภาพรวมปัจจุบัน)
           ========================================================================= */}
        {activeTab === 'ผ02-all' && (
          <div className="space-y-6">
            {/* Top Right Label */}
            <div className="text-right text-sm sm:text-base font-bold text-slate-900">
              แบบ {formatDigits('ผ.02')}
            </div>

            {/* Official Center Title */}
            <div className="text-center space-y-1">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                บัญชีรายละเอียดโครงการพัฒนาท้องถิ่น
              </h3>
              <p className="text-base sm:text-lg font-bold text-slate-900">
                แผนพัฒนาท้องถิ่น (พ.ศ. {formatDigits('2571-2575')})
              </p>
              <p className="text-sm sm:text-base font-bold text-slate-900">
                {customOrgName} {customProvince}
              </p>
            </div>

            {/* Grouped Tables */}
            {allGroups.map((group, gIdx) => {
              const groupTotals: Record<number, number> = {
                2571: 0,
                2572: 0,
                2573: 0,
                2574: 0,
                2575: 0
              };

              group.items.forEach((p) => {
                YEARS.forEach((y) => {
                  groupTotals[y] += Number(p[`งบประมาณ ${y}` as keyof Project]) || 0;
                });
              });

              return (
                <div key={group.issue} className="mt-8 space-y-2.5">
                  <div className="text-xs sm:text-sm font-bold text-slate-900">
                    {formatDigits(gIdx + 1)}. ประเด็นการพัฒนาท้องถิ่น: {group.issue}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse border border-slate-900">
                      <thead>
                        <tr className="bg-slate-50 text-slate-900 border-b border-slate-900 text-center">
                          <th rowSpan={2} className="py-2.5 px-2 border border-slate-900 font-bold w-10 align-middle">
                            ที่
                          </th>
                          <th rowSpan={2} className="py-2.5 px-3 border border-slate-900 font-bold min-w-[200px] text-left align-middle">
                            โครงการ
                          </th>
                          <th rowSpan={2} className="py-2.5 px-3 border border-slate-900 font-bold min-w-[160px] text-left align-middle">
                            วัตถุประสงค์
                          </th>
                          <th rowSpan={2} className="py-2.5 px-3 border border-slate-900 font-bold min-w-[160px] text-left align-middle">
                            เป้าหมาย<br />(ผลผลิตของโครงการ)
                          </th>
                          <th colSpan={YEARS.length} className="py-1.5 px-2 text-center border border-slate-900 font-bold bg-slate-100">
                            งบประมาณ (บาท)
                          </th>
                          <th rowSpan={2} className="py-2.5 px-3 border border-slate-900 font-bold min-w-[140px] text-left align-middle">
                            ผลที่คาดว่า<br />จะได้รับ
                          </th>
                          <th rowSpan={2} className="py-2.5 px-3 border border-slate-900 font-bold min-w-[120px] text-left align-middle">
                            หน่วยงาน<br />รับผิดชอบ
                          </th>
                        </tr>
                        <tr className="bg-slate-100 text-slate-900 border-b border-slate-900 text-[11px] text-center font-bold">
                          {YEARS.map((y) => (
                            <th key={y} className="py-1 px-1.5 border border-slate-900 min-w-[80px]">
                              {formatDigits(y)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((p, pIdx) => (
                          <tr key={p.ID} className="hover:bg-slate-50">
                            <td className="py-2 px-2 text-center border border-slate-900 font-bold align-top">
                              {formatDigits(pIdx + 1)}
                            </td>
                            <td className="py-2 px-2.5 border border-slate-900 font-semibold text-slate-900 align-top leading-snug">
                              <div className="font-bold text-slate-900">
                                {p['ชื่อโครงการ']}
                                {p['ประเภทรายการ'] !== 'ฉบับแรก' && (
                                  <span className="ml-1 text-[11px] font-normal text-purple-700">
                                    ({p['ประเภทรายการ']})
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-2.5 border border-slate-900 text-slate-800 align-top leading-snug whitespace-pre-line">
                              {p['วัตถุประสงค์'] || '-'}
                            </td>
                            <td className="py-2 px-2.5 border border-slate-900 text-slate-800 align-top leading-snug whitespace-pre-line">
                              {p['เป้าหมาย (ผลผลิต)'] || '-'}
                            </td>

                            {YEARS.map((y) => {
                              const val = Number(p[`งบประมาณ ${y}` as keyof Project]) || 0;
                              return (
                                <td
                                  key={y}
                                  className="py-2 px-2 text-right border border-slate-900 font-mono align-top whitespace-nowrap"
                                >
                                  {formatMoney(val)}
                                </td>
                              );
                            })}

                            <td className="py-2 px-2.5 border border-slate-900 text-slate-800 align-top leading-snug">
                              {p['ผลที่คาดว่าจะได้รับ'] || '-'}
                            </td>
                            <td className="py-2 px-2.5 border border-slate-900 text-slate-900 font-medium align-top">
                              {p['หน่วยงานรับผิดชอบหลัก'] || '-'}
                            </td>
                          </tr>
                        ))}

                        {/* Subtotal */}
                        <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-900">
                          <td className="py-2 px-2 text-center border border-slate-900 font-bold">
                            รวม
                          </td>
                          <td className="py-2 px-2.5 border border-slate-900 font-bold">
                            {formatDigits(group.items.length)} โครงการ
                          </td>
                          <td className="py-2 px-2 text-center border border-slate-900 font-bold">-</td>
                          <td className="py-2 px-2 text-center border border-slate-900 font-bold">-</td>
                          {YEARS.map((y) => (
                            <td
                              key={y}
                              className="py-2 px-2 text-right border border-slate-900 font-mono font-bold whitespace-nowrap"
                            >
                              {formatMoney(groupTotals[y])}
                            </td>
                          ))}
                          <td className="py-2 px-2 text-center border border-slate-900 font-bold">-</td>
                          <td className="py-2 px-2 text-center border border-slate-900 font-bold">-</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PDF Export & Page Setup Modal */}
      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        projects={projects}
        report01={report01}
        initialReportType={activeTab}
      />
    </div>
  );
};
