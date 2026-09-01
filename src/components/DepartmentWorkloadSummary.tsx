import React, { useState, useMemo } from 'react';
import {
  Building2,
  FolderKanban,
  Coins,
  CheckCircle2,
  Clock,
  CircleDashed,
  ArrowUpDown,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  SlidersHorizontal,
  FileSpreadsheet,
  PieChart as PieIcon,
  X,
  Search,
  Users,
  Award,
  BarChart2,
  ExternalLink
} from 'lucide-react';
import { Project, ProjectStatus } from '../types';
import { YEARS, ORG_NAME } from '../data/initialData';

interface DepartmentWorkloadSummaryProps {
  projects: Project[];
  onSelectProject?: (p: Project) => void;
}

type SortBy = 'projects-desc' | 'budget-desc' | 'completion-desc' | 'name';
type ViewMode = 'cards' | 'table' | 'comparison';

interface DepartmentStat {
  name: string;
  shortName: string;
  projectCount: number;
  projectSharePct: number;
  totalBudget: number;
  budgetSharePct: number;
  avgBudgetPerProject: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  completionRate: number;
  typeBreakdown: {
    'ฉบับแรก': number;
    'เพิ่มเติม': number;
    'เปลี่ยนแปลง': number;
    'แก้ไข': number;
  };
  projects: Project[];
}

export const DepartmentWorkloadSummary: React.FC<DepartmentWorkloadSummaryProps> = ({
  projects,
  onSelectProject
}) => {
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('projects-desc');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [selectedDeptModal, setSelectedDeptModal] = useState<DepartmentStat | null>(null);
  const [modalSearch, setModalSearch] = useState<string>('');
  const [modalStatusFilter, setModalStatusFilter] = useState<string>('ทั้งหมด');

  const formatMoney = (n: number) => (Number(n) || 0).toLocaleString('th-TH');

  const formatMoneyCompact = (n: number) => {
    const val = Number(n) || 0;
    if (val >= 1_000_000_000) return (val / 1_000_000_000).toFixed(2) + ' พันลบ.';
    if (val >= 1_000_000) return (val / 1_000_000).toFixed(2) + ' ลบ.';
    if (val >= 1_000) return (val / 1_000).toFixed(1) + ' พัน';
    return val.toLocaleString('th-TH');
  };

  const getProjectBudget = (p: Project, year: string): number => {
    if (year === 'all') {
      return (
        (Number(p['งบประมาณ 2571']) || 0) +
        (Number(p['งบประมาณ 2572']) || 0) +
        (Number(p['งบประมาณ 2573']) || 0) +
        (Number(p['งบประมาณ 2574']) || 0) +
        (Number(p['งบประมาณ 2575']) || 0)
      );
    }
    const key = `งบประมาณ ${year}` as keyof Project;
    return Number(p[key]) || 0;
  };

  // Department color / icon mapping
  const getDeptColorTheme = (name: string) => {
    if (name.includes('สำนักปลัด')) {
      return {
        badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        progressBg: 'bg-emerald-600',
        accentBorder: 'border-emerald-300 hover:border-emerald-500',
        gradient: 'from-emerald-600 to-teal-500',
        lightBg: 'bg-emerald-50/50'
      };
    }
    if (name.includes('กองช่าง')) {
      return {
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
        progressBg: 'bg-amber-500',
        accentBorder: 'border-amber-300 hover:border-amber-500',
        gradient: 'from-amber-500 to-orange-500',
        lightBg: 'bg-amber-50/50'
      };
    }
    if (name.includes('กองคลัง')) {
      return {
        badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
        progressBg: 'bg-blue-600',
        accentBorder: 'border-blue-300 hover:border-blue-500',
        gradient: 'from-blue-600 to-cyan-500',
        lightBg: 'bg-blue-50/50'
      };
    }
    if (name.includes('กองสาธารณสุข')) {
      return {
        badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
        progressBg: 'bg-rose-600',
        accentBorder: 'border-rose-300 hover:border-rose-500',
        gradient: 'from-rose-600 to-pink-500',
        lightBg: 'bg-rose-50/50'
      };
    }
    if (name.includes('กองการศึกษา') || name.includes('เด็กเล็ก') || name.includes('โรงเรียน')) {
      return {
        badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        progressBg: 'bg-indigo-600',
        accentBorder: 'border-indigo-300 hover:border-indigo-500',
        gradient: 'from-indigo-600 to-violet-500',
        lightBg: 'bg-indigo-50/50'
      };
    }
    if (name.includes('กองสวัสดิการ')) {
      return {
        badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
        progressBg: 'bg-purple-600',
        accentBorder: 'border-purple-300 hover:border-purple-500',
        gradient: 'from-purple-600 to-fuchsia-500',
        lightBg: 'bg-purple-50/50'
      };
    }
    if (name.includes('กองยุทธศาสตร์')) {
      return {
        badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
        progressBg: 'bg-teal-600',
        accentBorder: 'border-teal-300 hover:border-teal-500',
        gradient: 'from-teal-600 to-emerald-500',
        lightBg: 'bg-teal-50/50'
      };
    }
    if (name.includes('กองการเจ้าหน้าที่')) {
      return {
        badgeBg: 'bg-sky-50 text-sky-800 border-sky-200',
        progressBg: 'bg-sky-600',
        accentBorder: 'border-sky-300 hover:border-sky-500',
        gradient: 'from-sky-600 to-blue-500',
        lightBg: 'bg-sky-50/50'
      };
    }
    if (name.includes('ตรวจสอบภายใน')) {
      return {
        badgeBg: 'bg-amber-50 text-amber-900 border-amber-300',
        progressBg: 'bg-amber-600',
        accentBorder: 'border-amber-400 hover:border-amber-600',
        gradient: 'from-amber-600 to-yellow-600',
        lightBg: 'bg-amber-50/50'
      };
    }
    return {
      badgeBg: 'bg-slate-100 text-slate-800 border-slate-200',
      progressBg: 'bg-slate-600',
      accentBorder: 'border-slate-300 hover:border-slate-400',
      gradient: 'from-slate-600 to-slate-500',
      lightBg: 'bg-slate-50'
    };
  };

  // Aggregated Department Statistics
  const { deptStats, totalProjectsCount, totalBudgetSum, maxProjectCount, maxDeptBudget } = useMemo(() => {
    const map: Record<string, { count: number; budget: number; completed: number; inProgress: number; notStarted: number; types: Record<string, number>; items: Project[] }> = {};

    let totalBudget = 0;
    const totalCount = projects.length;

    projects.forEach((p) => {
      const deptName = p['หน่วยงานรับผิดชอบหลัก'] || 'ไม่ระบุหน่วยงาน';
      if (!map[deptName]) {
        map[deptName] = {
          count: 0,
          budget: 0,
          completed: 0,
          inProgress: 0,
          notStarted: 0,
          types: { 'ฉบับแรก': 0, 'เพิ่มเติม': 0, 'เปลี่ยนแปลง': 0, 'แก้ไข': 0 },
          items: []
        };
      }

      const pBudget = getProjectBudget(p, selectedYear);
      totalBudget += pBudget;

      map[deptName].count += 1;
      map[deptName].budget += pBudget;
      map[deptName].items.push(p);

      const status = p['สถานะดำเนินงาน'] || 'ยังไม่ได้ดำเนินการ';
      if (status === 'เสร็จสิ้น' || status === 'ดำเนินการแล้วเสร็จ') {
        map[deptName].completed += 1;
      } else if (status === 'อยู่ระหว่างดำเนินการ') {
        map[deptName].inProgress += 1;
      } else {
        map[deptName].notStarted += 1;
      }

      const pType = p['ประเภทรายการ'] || 'ฉบับแรก';
      if (map[deptName].types[pType] !== undefined) {
        map[deptName].types[pType] += 1;
      } else {
        map[deptName].types['ฉบับแรก'] += 1;
      }
    });

    const list: DepartmentStat[] = Object.entries(map).map(([name, d]) => {
      const pShare = totalCount > 0 ? (d.count / totalCount) * 100 : 0;
      const bShare = totalBudget > 0 ? (d.budget / totalBudget) * 100 : 0;
      const avg = d.count > 0 ? d.budget / d.count : 0;
      const compRate = d.count > 0 ? (d.completed / d.count) * 100 : 0;

      return {
        name,
        shortName: name.replace('สำนัก', '').replace('กอง', ''),
        projectCount: d.count,
        projectSharePct: pShare,
        totalBudget: d.budget,
        budgetSharePct: bShare,
        avgBudgetPerProject: avg,
        completedCount: d.completed,
        inProgressCount: d.inProgress,
        notStartedCount: d.notStarted,
        completionRate: compRate,
        typeBreakdown: {
          'ฉบับแรก': d.types['ฉบับแรก'] || 0,
          'เพิ่มเติม': d.types['เพิ่มเติม'] || 0,
          'เปลี่ยนแปลง': d.types['เปลี่ยนแปลง'] || 0,
          'แก้ไข': d.types['แก้ไข'] || 0
        },
        projects: d.items
      };
    });

    // Sorting
    if (sortBy === 'projects-desc') {
      list.sort((a, b) => b.projectCount - a.projectCount);
    } else if (sortBy === 'budget-desc') {
      list.sort((a, b) => b.totalBudget - a.totalBudget);
    } else if (sortBy === 'completion-desc') {
      list.sort((a, b) => b.completionRate - a.completionRate);
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name, 'th'));
    }

    const maxCount = Math.max(1, ...list.map((d) => d.projectCount));
    const maxB = Math.max(1, ...list.map((d) => d.totalBudget));

    return {
      deptStats: list,
      totalProjectsCount: totalCount,
      totalBudgetSum: totalBudget,
      maxProjectCount: maxCount,
      maxDeptBudget: maxB
    };
  }, [projects, selectedYear, sortBy]);

  // Executive Top Highlights
  const highestLoadDept = useMemo(() => {
    if (!deptStats.length) return null;
    return [...deptStats].sort((a, b) => b.projectCount - a.projectCount)[0];
  }, [deptStats]);

  const highestBudgetDept = useMemo(() => {
    if (!deptStats.length) return null;
    return [...deptStats].sort((a, b) => b.totalBudget - a.totalBudget)[0];
  }, [deptStats]);

  // Filtered projects inside modal
  const modalFilteredProjects = useMemo(() => {
    if (!selectedDeptModal) return [];
    return selectedDeptModal.projects.filter((p) => {
      const matchSearch =
        !modalSearch ||
        (p['ชื่อโครงการ'] || '').toLowerCase().includes(modalSearch.toLowerCase()) ||
        String(p.ID).includes(modalSearch);

      const status = p['สถานะดำเนินงาน'] || 'ยังไม่ได้ดำเนินการ';
      const matchStatus =
        modalStatusFilter === 'ทั้งหมด' ||
        (modalStatusFilter === 'เสร็จสิ้น' && (status === 'เสร็จสิ้น' || status === 'ดำเนินการแล้วเสร็จ')) ||
        (modalStatusFilter === 'กำลังดำเนินการ' && status === 'อยู่ระหว่างดำเนินการ') ||
        (modalStatusFilter === 'ยังไม่ดำเนินการ' && (status === 'ไม่ดำเนินการ' || status === 'ยังไม่ได้ดำเนินการ'));

      return matchSearch && matchStatus;
    });
  }, [selectedDeptModal, modalSearch, modalStatusFilter]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-all">
      {/* Section Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <span>สถิติและภาระงานแยกตามหน่วยงานรับผิดชอบ</span>
                  <span className="text-xs font-normal text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {deptStats.length} หน่วยงาน
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  วิเคราะห์การกระจายตัวของภาระงานโครงการ (Workload Distribution) และงบประมาณใน {ORG_NAME}
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Controls Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Fiscal Year Filter */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="text-xs font-semibold text-slate-700 bg-transparent border-0 focus:ring-0 cursor-pointer pr-2"
              >
                <option value="all">รวม 5 ปี (พ.ศ. 2571-2575)</option>
                {YEARS.map((y) => (
                  <option key={y} value={String(y)}>
                    เฉพาะปี พ.ศ. {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-2xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="text-xs font-semibold text-slate-700 bg-transparent border-0 focus:ring-0 cursor-pointer pr-2"
              >
                <option value="projects-desc">เรียงตาม: โครงการมากที่สุด</option>
                <option value="budget-desc">เรียงตาม: งบประมาณมากที่สุด</option>
                <option value="completion-desc">เรียงตาม: ดำเนินการเสร็จสิ้นสูงสุด</option>
                <option value="name">เรียงตาม: ชื่อหน่วยงาน ก-ฮ</option>
              </select>
            </div>

            {/* View Mode Toggle: Cards / Table / Comparison */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-2xs">
              <button
                onClick={() => setViewMode('cards')}
                title="มุมมองการ์ดภาระงาน"
                className={`p-1.5 rounded transition ${
                  viewMode === 'cards' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('comparison')}
                title="มุมมองเปรียบเทียบสัดส่วนโครงการ-งบประมาณ"
                className={`p-1.5 rounded transition ${
                  viewMode === 'comparison' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                title="มุมมองตารางรายละเอียด"
                className={`p-1.5 rounded transition ${
                  viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Executive Workload Distribution KPI Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3.5 pt-3.5 border-t border-slate-200/70 text-xs">
          <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
            <span className="text-slate-500 font-medium block text-[11px]">หน่วยงานรับผิดชอบ</span>
            <div className="text-base sm:text-lg font-extrabold text-slate-900 font-mono mt-0.5">
              {deptStats.length}{' '}
              <span className="text-xs font-normal text-slate-400">สำนัก/กอง</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
            <span className="text-slate-500 font-medium block text-[11px]">ภาระงานสูงสุด (จำนวนโครงการ)</span>
            <div className="text-xs sm:text-sm font-bold text-slate-800 truncate mt-0.5" title={highestLoadDept?.name}>
              {highestLoadDept ? highestLoadDept.name : '-'}
            </div>
            <div className="text-[10px] text-emerald-600 font-mono font-semibold">
              {highestLoadDept ? `${highestLoadDept.projectCount} โครงการ (${highestLoadDept.projectSharePct.toFixed(1)}%)` : ''}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
            <span className="text-slate-500 font-medium block text-[11px]">งบประมาณสูงสุด</span>
            <div className="text-xs sm:text-sm font-bold text-slate-800 truncate mt-0.5" title={highestBudgetDept?.name}>
              {highestBudgetDept ? highestBudgetDept.name : '-'}
            </div>
            <div className="text-[10px] text-emerald-600 font-mono font-semibold">
              {highestBudgetDept ? `฿${formatMoneyCompact(highestBudgetDept.totalBudget)} (${highestBudgetDept.budgetSharePct.toFixed(1)}%)` : ''}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
            <span className="text-slate-500 font-medium block text-[11px]">ภาระงานเฉลี่ยต่อหน่วยงาน</span>
            <div className="text-base sm:text-lg font-extrabold text-slate-800 font-mono mt-0.5">
              {deptStats.length > 0 ? (totalProjectsCount / deptStats.length).toFixed(1) : '0'}{' '}
              <span className="text-xs font-normal text-slate-400">โครงการ/กอง</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-5">
        {/* ========================================================================= */}
        {/* VIEW 1: CARDS GRID (การ์ดสรุปภาระงานรายสำนัก/กอง) */}
        {/* ========================================================================= */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {deptStats.map((dept, idx) => {
              const theme = getDeptColorTheme(dept.name);
              const projectPercent = maxProjectCount > 0 ? Math.round((dept.projectCount / maxProjectCount) * 100) : 0;
              const budgetPercent = maxDeptBudget > 0 ? Math.round((dept.totalBudget / maxDeptBudget) * 100) : 0;

              return (
                <div
                  key={dept.name}
                  onClick={() => setSelectedDeptModal(dept)}
                  className={`bg-white rounded-xl border p-4 shadow-2xs hover:shadow-xs transition cursor-pointer flex flex-col justify-between ${theme.accentBorder} group relative`}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-emerald-700 transition" title={dept.name}>
                            {dept.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            สัดส่วนภาระงาน {dept.projectSharePct.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <span className="p-1 rounded-md text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition shrink-0">
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>

                    {/* Workload Metrics & Budget Numbers */}
                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 font-medium block">จำนวนโครงการ</span>
                        <div className="text-base font-extrabold text-slate-900 font-mono mt-0.5">
                          {dept.projectCount}{' '}
                          <span className="text-[10px] font-normal text-slate-500">โครงการ</span>
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-emerald-50/50 border border-emerald-100">
                        <span className="text-[10px] text-emerald-800 font-medium block">
                          งบประมาณ ({selectedYear === 'all' ? '5 ปี' : `ปี ${selectedYear}`})
                        </span>
                        <div className="text-sm font-extrabold text-emerald-700 font-mono mt-0.5 truncate" title={`฿${formatMoney(dept.totalBudget)}`}>
                          ฿{formatMoneyCompact(dept.totalBudget)}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar of Status Execution */}
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span className="font-semibold">ความก้าวหน้าการดำเนินงาน</span>
                        <span className="font-mono font-bold text-emerald-700">
                          {dept.completionRate.toFixed(0)}% เสร็จสิ้น
                        </span>
                      </div>

                      {/* Stacked Multi-color Status Progress Bar */}
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                        {dept.completedCount > 0 && (
                          <div
                            className="bg-emerald-500 h-full transition-all"
                            style={{ width: `${(dept.completedCount / dept.projectCount) * 100}%` }}
                            title={`เสร็จสิ้น: ${dept.completedCount} โครงการ`}
                          />
                        )}
                        {dept.inProgressCount > 0 && (
                          <div
                            className="bg-amber-400 h-full transition-all"
                            style={{ width: `${(dept.inProgressCount / dept.projectCount) * 100}%` }}
                            title={`อยู่ระหว่างดำเนินการ: ${dept.inProgressCount} โครงการ`}
                          />
                        )}
                        {dept.notStartedCount > 0 && (
                          <div
                            className="bg-rose-300 h-full transition-all"
                            style={{ width: `${(dept.notStartedCount / dept.projectCount) * 100}%` }}
                            title={`ยังไม่ดำเนินการ: ${dept.notStartedCount} โครงการ`}
                          />
                        )}
                      </div>

                      {/* Status Legend Counts */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          เสร็จ {dept.completedCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          กำลังทำ {dept.inProgressCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-300" />
                          ยังไม่ทำ {dept.notStartedCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Project Type Chips & Avg Budget */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span>เฉลี่ย ฿{formatMoneyCompact(dept.avgBudgetPerProject)}/โครงการ</span>
                    <span className="text-emerald-700 font-semibold group-hover:underline flex items-center gap-0.5">
                      ดูรายชื่อโครงการ <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: COMPARISON METER (เปรียบเทียบสัดส่วนโครงการ vs งบประมาณ 2 มิติ) */}
        {/* ========================================================================= */}
        {viewMode === 'comparison' && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800">
                  กราฟเปรียบเทียบสัดส่วนภาระงาน (จำนวนโครงการ) และ สัดส่วนงบประมาณที่ได้รับจัดสรร
                </p>
                <p className="text-slate-500 mt-0.5">
                  ช่วยให้เห็นว่าหน่วยงานใดมีภาระโครงการสูงเทียบกับสัดส่วนงบประมาณที่ได้รับ เพื่อการจัดสรรบุคลากรและทรัพยากรอย่างสมดุล
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {deptStats.map((dept, idx) => {
                const theme = getDeptColorTheme(dept.name);

                return (
                  <div
                    key={dept.name}
                    onClick={() => setSelectedDeptModal(dept)}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={dept.name}>
                          {dept.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span className="text-slate-700">
                          <strong>{dept.projectCount}</strong> โครงการ ({dept.projectSharePct.toFixed(1)}%)
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="text-emerald-700 font-bold">
                          ฿{formatMoney(dept.totalBudget)} ({dept.budgetSharePct.toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    {/* Dual Horizontal Bars: Project Share vs Budget Share */}
                    <div className="space-y-1.5 text-[11px]">
                      {/* Bar 1: Project Count Share */}
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                          <span>สัดส่วนภาระโครงการ ({dept.projectCount} โครงการ)</span>
                          <span className="font-mono font-bold text-slate-700">{dept.projectSharePct.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${dept.projectSharePct}%` }}
                          />
                        </div>
                      </div>

                      {/* Bar 2: Budget Share */}
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                          <span>สัดส่วนงบประมาณ (฿{formatMoneyCompact(dept.totalBudget)})</span>
                          <span className="font-mono font-bold text-emerald-700">{dept.budgetSharePct.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${dept.budgetSharePct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: COMPREHENSIVE DATA TABLE (ตารางรายละเอียด) */}
        {/* ========================================================================= */}
        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="py-2.5 px-3 font-bold text-center w-12 rounded-tl-md">ลำดับ</th>
                  <th className="py-2.5 px-3 font-bold min-w-[160px]">หน่วยงานรับผิดชอบหลัก</th>
                  <th className="py-2.5 px-3 font-bold text-center w-24">จำนวนโครงการ</th>
                  <th className="py-2.5 px-3 font-bold text-center w-24">สัดส่วนงาน (%)</th>
                  <th className="py-2.5 px-3 font-bold text-right min-w-[120px]">งบประมาณรวม</th>
                  <th className="py-2.5 px-3 font-bold text-right min-w-[100px]">งบเฉลี่ย/โครงการ</th>
                  <th className="py-2.5 px-3 font-bold text-center w-16">เสร็จ</th>
                  <th className="py-2.5 px-3 font-bold text-center w-20">กำลังทำ</th>
                  <th className="py-2.5 px-3 font-bold text-center w-16">ยังไม่ทำ</th>
                  <th className="py-2.5 px-3 font-bold text-center w-24 rounded-tr-md">สำเร็จ (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deptStats.map((dept, idx) => (
                  <tr
                    key={dept.name}
                    onClick={() => setSelectedDeptModal(dept)}
                    className="hover:bg-emerald-50/60 cursor-pointer transition"
                  >
                    <td className="py-2.5 px-3 text-center text-slate-500 font-semibold">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{dept.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                        {dept.projectCount}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-600">
                      {dept.projectSharePct.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                      ฿{formatMoney(dept.totalBudget)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      ฿{formatMoney(Math.round(dept.avgBudgetPerProject))}
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-emerald-700 font-mono">
                      {dept.completedCount > 0 ? (
                        <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {dept.completedCount}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-amber-700 font-mono">
                      {dept.inProgressCount > 0 ? (
                        <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          {dept.inProgressCount}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-rose-700 font-mono">
                      {dept.notStartedCount > 0 ? (
                        <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          {dept.notStartedCount}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-mono font-bold text-emerald-700">
                        {dept.completionRate.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={2} className="py-2.5 px-3 text-center">รวมทั้งสิ้น</td>
                  <td className="py-2.5 px-3 text-center font-mono">{totalProjectsCount} โครงการ</td>
                  <td className="py-2.5 px-3 text-center font-mono">100.0%</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-700">฿{formatMoney(totalBudgetSum)}</td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    ฿{totalProjectsCount > 0 ? formatMoney(Math.round(totalBudgetSum / totalProjectsCount)) : '0'}
                  </td>
                  <td colSpan={3} className="py-2.5 px-3 text-center text-slate-500 font-normal">
                    คลิกแถวเพื่อดูโครงการ
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: Department Projects Detailed Drill-down */}
      {/* ========================================================================= */}
      {selectedDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[88vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {selectedDeptModal.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    ภาระงาน {selectedDeptModal.projectCount} โครงการ ({selectedDeptModal.projectSharePct.toFixed(1)}%) • งบประมาณรวม ฿{formatMoney(selectedDeptModal.totalBudget)} บาท
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedDeptModal(null);
                  setModalSearch('');
                  setModalStatusFilter('ทั้งหมด');
                }}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search & Filter Bar */}
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อโครงการ หรือ รหัส ID..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-[11px]">สถานะ:</span>
                {['ทั้งหมด', 'เสร็จสิ้น', 'กำลังดำเนินการ', 'ยังไม่ดำเนินการ'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setModalStatusFilter(st)}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                      modalStatusFilter === st
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Projects List */}
            <div className="p-4 overflow-y-auto space-y-2 divide-y divide-slate-100 flex-1">
              {modalFilteredProjects.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  ไม่พบโครงการตามเงื่อนไขการค้นหา
                </div>
              ) : (
                modalFilteredProjects.map((p) => {
                  const bVal = getProjectBudget(p, selectedYear);
                  const status = p['สถานะดำเนินงาน'] || 'ยังไม่ได้ดำเนินการ';

                  return (
                    <div
                      key={p.ID}
                      onClick={() => {
                        if (onSelectProject) {
                          onSelectProject(p);
                          setSelectedDeptModal(null);
                        }
                      }}
                      className="pt-2.5 first:pt-0 p-2.5 rounded-lg hover:bg-emerald-50/70 transition cursor-pointer flex items-start justify-between gap-3 group"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-mono font-bold text-slate-400">
                            #{p.ID}
                          </span>
                          <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition">
                            {p['ชื่อโครงการ']}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {p['ประเภทรายการ'] || 'ฉบับแรก'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
                          <span>{p['แผนงาน']}</span>
                          <span>•</span>
                          <span className="text-slate-400">{p['ประเด็นการพัฒนา']}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono font-bold text-emerald-700">
                          ฿{formatMoney(bVal)}
                        </div>
                        <div className="mt-1">
                          {status === 'เสร็จสิ้น' || status === 'ดำเนินการแล้วเสร็จ' ? (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> เสร็จสิ้น
                            </span>
                          ) : status === 'อยู่ระหว่างดำเนินการ' ? (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3" /> กำลังดำเนินการ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">
                              <CircleDashed className="w-3 h-3" /> ยังไม่ดำเนินการ
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                แสดง {modalFilteredProjects.length} จาก {selectedDeptModal.projectCount} โครงการ (คลิกโครงการเพื่อเปิดดูและแก้ไข)
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedDeptModal(null);
                  setModalSearch('');
                  setModalStatusFilter('ทั้งหมด');
                }}
                className="px-4 py-1.5 font-semibold rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
