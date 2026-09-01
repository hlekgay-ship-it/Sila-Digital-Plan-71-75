import React, { useState } from 'react';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  CircleDashed,
  Coins,
  ArrowUpRight,
  Building2,
  PieChart as PieIcon,
  ChevronRight,
  TrendingUp,
  FileCheck2,
  BarChart3,
  ListFilter,
  Menu,
  Sparkles,
  Search,
  FolderOpen,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { DashboardData, Project, ProjectStatus, PlanType } from '../types';
import { YEARS, ORG_NAME, STANDARD_STRATEGIC_ISSUES, STANDARD_DEPARTMENTS, sortStrategicIssues } from '../data/initialData';
import { ActiveView } from './Sidebar';
import { BudgetSummaryBarChart, GroupDimension } from './BudgetSummaryBarChart';
import { DepartmentWorkloadSummary } from './DepartmentWorkloadSummary';
import { StandardFilterBar } from './StandardFilterBar';

interface DashboardViewProps {
  data: DashboardData;
  onSelectProject: (p: Project) => void;
  onNavigate: (view: ActiveView) => void;
  allProjects?: Project[];
  onToggleMobile?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  onSelectProject,
  onNavigate,
  allProjects,
  onToggleMobile
}) => {
  const [activeTab, setActiveTab] = useState<'charts' | 'workload' | 'recent'>('charts');
  const [chartDimension, setChartDimension] = useState<GroupDimension>('type');
  const [chartYear, setChartYear] = useState<string>('all');
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>('ทั้งหมด');
  const [filterIssue, setFilterIssue] = useState<string>('ทั้งหมด');
  const [filterDepartment, setFilterDepartment] = useState<string>('ทั้งหมด');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [filterBudget, setFilterBudget] = useState<string>('');

  const projectsPool = allProjects || data.projects || [];

  // Extract unique issues and departments
  const availableIssues = React.useMemo(() => {
    const set = new Set<string>(STANDARD_STRATEGIC_ISSUES);
    projectsPool.forEach((p) => {
      if (p['ประเด็นการพัฒนา']) set.add(p['ประเด็นการพัฒนา']);
    });
    return sortStrategicIssues(Array.from(set));
  }, [projectsPool]);

  const availableDepartments = React.useMemo(() => {
    const set = new Set<string>(STANDARD_DEPARTMENTS);
    projectsPool.forEach((p) => {
      if (p['หน่วยงานรับผิดชอบหลัก']) set.add(p['หน่วยงานรับผิดชอบหลัก']);
    });
    return Array.from(set);
  }, [projectsPool]);

  const formatMoney = (n: number) => {
    return (Number(n) || 0).toLocaleString('th-TH');
  };

  const getStatusBadge = (status: ProjectStatus | string) => {
    switch (status) {
      case 'เสร็จสิ้น':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            เสร็จสิ้น
          </span>
        );
      case 'อยู่ระหว่างดำเนินการ':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            กำลังดำเนิน
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <CircleDashed className="w-3 h-3 text-rose-600" />
            ไม่ดำเนิน
          </span>
        );
    }
  };

  const getTypeBadge = (type: PlanType | string) => {
    let color = 'bg-slate-100 text-slate-700 border-slate-200';
    if (type === 'เพิ่มเติม') color = 'bg-sky-100 text-sky-800 border-sky-200';
    if (type === 'เปลี่ยนแปลง') color = 'bg-purple-100 text-purple-800 border-purple-200';
    if (type === 'แก้ไข') color = 'bg-orange-100 text-orange-800 border-orange-200';

    return (
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${color}`}>
        {type || 'ฉบับแรก'}
      </span>
    );
  };

  const renderDistributionBar = (obj: Record<string, number>, maxItems: number = 6) => {
    const entries = Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, maxItems);
    const maxVal = Math.max(1, ...entries.map((e) => e[1]));

    if (!entries.length) {
      return <div className="text-xs text-slate-400 py-3 text-center">ไม่มีข้อมูล</div>;
    }

    return (
      <div className="space-y-2 mt-2">
        {entries.map(([label, val]) => {
          const pct = Math.round((val / maxVal) * 100);
          return (
            <div key={label} className="group">
              <div className="flex items-center justify-between text-[11px] font-medium mb-0.5">
                <span className="text-slate-700 truncate pr-2 max-w-[75%]" title={label}>
                  {label}
                </span>
                <span className="text-slate-900 font-bold font-mono text-[11px]">
                  {val} <span className="text-[9px] text-slate-400 font-normal">โครง</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full rounded-full transition-all duration-500 group-hover:from-emerald-500 group-hover:to-teal-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const doneCount = (data.byStatus['เสร็จสิ้น'] || 0) + (data.byStatus['ดำเนินการแล้วเสร็จ'] || 0);
  const inProgressCount = data.byStatus['อยู่ระหว่างดำเนินการ'] || 0;
  const notStartedCount =
    (data.byStatus['ไม่ดำเนินการ'] || 0) +
    (data.byStatus['ยังไม่ได้ดำเนินการ'] || 0) +
    (data.byStatus['ไม่ได้ดำเนินการ'] || 0) +
    (data.byStatus['กันเงินนำไปทำต่อปีถัดไป'] || 0);

  return (
    <div className="space-y-2.5">
      {/* ================= UNIFIED TOP CONTAINER (HEADER & TABS) ================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden shrink-0 no-print">
        {/* บรรทัดที่ 1: Header สีเขียวเข้ม */}
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
            <div className="w-8 h-8 rounded-lg bg-emerald-900/80 border border-emerald-500/40 flex items-center justify-center font-bold text-xs text-emerald-300">
              ศิลา
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold leading-tight flex items-center gap-2 flex-wrap">
                <span>หน้าหลักภาพรวมและสถิติ (Dashboard)</span>
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
          searchLabel="ชื่อโครงการ / คำค้นหา"
          searchValue={filterSearch}
          onSearchChange={(val) => setFilterSearch(val)}
          searchPlaceholder="ค้นหาชื่อโครงการ, รหัส, วัตถุประสงค์..."
          budgetLabel="งบประมาณ (บาท)"
          budgetValue={filterBudget}
          onBudgetChange={(val) => setFilterBudget(val)}
          budgetPlaceholder="ระบุจำนวนเงิน..."
          customActionBar={
            <div className="flex items-center gap-2 flex-wrap justify-start w-full">
              {/* 1. [ปุ่ม ค้นหา] */}
              <button
                type="button"
                onClick={() => onNavigate('search')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#006853] hover:bg-[#005242] text-white text-xs font-bold shadow-xs transition cursor-pointer shrink-0 h-8"
              >
                <Search className="w-3.5 h-3.5 text-emerald-100" />
                <span>ค้นหา</span>
              </button>

              {/* 2. [ปุ่ม แสดงทั้งหมด] */}
              <button
                type="button"
                onClick={() => {
                  setSelectedFiscalYear('ทั้งหมด');
                  setFilterIssue('ทั้งหมด');
                  setFilterDepartment('ทั้งหมด');
                  setFilterSearch('');
                  setFilterBudget('');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 transition cursor-pointer shrink-0 shadow-2xs h-8"
              >
                <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                <span>แสดงทั้งหมด</span>
              </button>

              {/* 3. [ปุ่ม เริ่มใหม่] */}
              <button
                type="button"
                onClick={() => {
                  setSelectedFiscalYear('ทั้งหมด');
                  setFilterIssue('ทั้งหมด');
                  setFilterDepartment('ทั้งหมด');
                  setFilterSearch('');
                  setFilterBudget('');
                  setChartDimension('type');
                  setChartYear('all');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold border border-amber-300/80 transition cursor-pointer shrink-0 h-8"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                <span>เริ่มใหม่</span>
              </button>

              {/* 4. [กล่อง จำแนกตาม: (ประเภทโครงการ / ประเด็นยุทธศาสตร์ / แผนงาน / สำนัก/กอง)] */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs shrink-0 h-8">
                <span className="text-[11px] font-semibold text-slate-500 pl-2 pr-1.5 whitespace-nowrap">
                  จำแนกตาม:
                </span>
                <button
                  type="button"
                  onClick={() => setChartDimension('type')}
                  className={`px-2.5 py-1 rounded-md text-xs transition cursor-pointer whitespace-nowrap ${
                    chartDimension === 'type'
                      ? 'bg-[#006853] text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
                  }`}
                >
                  ประเภทโครงการ
                </button>
                <button
                  type="button"
                  onClick={() => setChartDimension('issue')}
                  className={`px-2.5 py-1 rounded-md text-xs transition cursor-pointer whitespace-nowrap ${
                    chartDimension === 'issue'
                      ? 'bg-[#006853] text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
                  }`}
                >
                  ประเด็นยุทธศาสตร์
                </button>
                <button
                  type="button"
                  onClick={() => setChartDimension('plan')}
                  className={`px-2.5 py-1 rounded-md text-xs transition cursor-pointer whitespace-nowrap ${
                    chartDimension === 'plan'
                      ? 'bg-[#006853] text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
                  }`}
                >
                  แผนงาน
                </button>
                <button
                  type="button"
                  onClick={() => setChartDimension('department')}
                  className={`px-2.5 py-1 rounded-md text-xs transition cursor-pointer whitespace-nowrap ${
                    chartDimension === 'department'
                      ? 'bg-[#006853] text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
                  }`}
                >
                  สำนัก/กอง
                </button>
              </div>

              {/* 5. [Dropdown รวม 5 ปี (พ.ศ. 2571-2575)] */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 shadow-2xs shrink-0 h-8">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={chartYear}
                  onChange={(e) => setChartYear(e.target.value)}
                  className="text-xs font-semibold text-slate-700 bg-transparent border-0 focus:ring-0 cursor-pointer pr-1 outline-none"
                >
                  <option value="all">รวม 5 ปี (พ.ศ. 2571-2575)</option>
                  {YEARS.map((y) => (
                    <option key={y} value={String(y)}>
                      เฉพาะปี พ.ศ. {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. [กลุ่มปุ่ม Tab สรุปผล: (ภาพรวม & งบประมาณ / หน่วยงาน & ภาระงาน / โครงการล่าสุด)] */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0 h-8">
                <button
                  type="button"
                  onClick={() => setActiveTab('charts')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs transition cursor-pointer whitespace-nowrap ${
                    activeTab === 'charts'
                      ? 'bg-[#006853] text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>ภาพรวม & งบประมาณ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('workload')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs transition cursor-pointer whitespace-nowrap ${
                    activeTab === 'workload'
                      ? 'bg-[#006853] text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>หน่วยงาน & ภาระงาน</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('recent')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs transition cursor-pointer whitespace-nowrap ${
                    activeTab === 'recent'
                      ? 'bg-[#006853] text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
                  }`}
                >
                  <FolderKanban className="w-3.5 h-3.5" />
                  <span>โครงการล่าสุด</span>
                </button>
              </div>
            </div>
          }
        />
      </div>

      {/* Slim Compact KPI Cards Row (Positioned directly below the filter container) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {/* Total Projects */}
        <div className="bg-white rounded-lg p-2.5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-500">โครงการทั้งหมด</div>
            <div className="text-lg font-extrabold text-slate-900 tracking-tight font-mono leading-tight mt-0.5">
              {data.totalProjects}{' '}
              <span className="text-[10px] font-normal text-slate-400 font-sans">โครงการ</span>
            </div>
            <div className="text-[9px] text-slate-400 font-normal leading-tight mt-0.5">
              (รวมทุกโครงการในแผน 5 ปี)
            </div>
          </div>
          <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <FolderKanban className="w-4 h-4" />
          </div>
        </div>

        {/* Done */}
        <div className="bg-white rounded-lg p-2.5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-500">เสร็จสิ้น</div>
            <div className="text-lg font-extrabold text-emerald-700 tracking-tight font-mono leading-tight mt-0.5">
              {doneCount}{' '}
              <span className="text-[10px] font-normal text-emerald-600 font-sans">
                (
                {data.totalProjects > 0
                  ? Math.round((doneCount / data.totalProjects) * 100)
                  : 0}
                %)
              </span>
            </div>
            <div className="text-[9px] text-emerald-600/80 font-normal leading-tight mt-0.5">
              (ดำเนินการแล้วเสร็จ)
            </div>
          </div>
          <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white rounded-lg p-2.5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-500">อยู่ระหว่างดำเนินการ</div>
            <div className="text-lg font-extrabold text-amber-600 tracking-tight font-mono leading-tight mt-0.5">
              {inProgressCount}{' '}
              <span className="text-[10px] font-normal text-amber-600 font-sans">
                (
                {data.totalProjects > 0
                  ? Math.round((inProgressCount / data.totalProjects) * 100)
                  : 0}
                %)
              </span>
            </div>
            <div className="text-[9px] text-amber-600/80 font-normal leading-tight mt-0.5">
              (กำลังดำเนินงานตามแผน)
            </div>
          </div>
          <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Not Started */}
        <div className="bg-white rounded-lg p-2.5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-500">ไม่ดำเนินการ / รอจัดสรร</div>
            <div className="text-lg font-extrabold text-rose-600 tracking-tight font-mono leading-tight mt-0.5">
              {notStartedCount}{' '}
              <span className="text-[10px] font-normal text-rose-500 font-sans">
                (
                {data.totalProjects > 0
                  ? Math.round((notStartedCount / data.totalProjects) * 100)
                  : 0}
                %)
              </span>
            </div>
            <div className="text-[9px] text-rose-500/80 font-normal leading-tight mt-0.5">
              (ยังไม่เริ่ม/รอจัดสรรงบ)
            </div>
          </div>
          <div className="w-7 h-7 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <CircleDashed className="w-4 h-4" />
          </div>
        </div>

        {/* Total Budget */}
        <div className="bg-slate-900 text-white rounded-lg p-2.5 border border-slate-800 shadow-2xs flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <div className="text-[10px] font-bold text-emerald-400">งบรวม 5 ปี (2571-2575)</div>
            <div className="text-sm font-extrabold text-white tracking-tight font-mono leading-tight mt-0.5">
              {formatMoney(data.totalBudget)}{' '}
              <span className="text-[10px] font-normal text-slate-400 font-sans">บาท</span>
            </div>
            <div className="text-[9px] text-emerald-300/80 font-normal leading-tight mt-0.5">
              (งบรวม 5 ปี ทุกโครงการในแผน)
            </div>
          </div>
          <div className="w-7 h-7 rounded-md bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
            <Coins className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Tab 1: Charts & 5-Year Allocation */}
      {activeTab === 'charts' && (
        <div className="space-y-2.5">
          {/* Executive Bar Chart Module */}
          <BudgetSummaryBarChart
            projects={data.projects}
            onSelectProject={onSelectProject}
            dimension={chartDimension}
            selectedYear={chartYear}
            onDimensionChange={setChartDimension}
            onYearChange={setChartYear}
          />

          {/* 5-Year Budget Allocation Matrix Mini Strip */}
          <div className="bg-white rounded-lg p-2.5 sm:px-3 sm:py-2 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                การกระจายงบประมาณตามปี พ.ศ. (2571 - 2575)
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">
                รวม {formatMoney(data.totalBudget)} บาท
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {YEARS.map((y) => {
                const yrBudget = data.budgetByYear[y] || 0;
                const pct = data.totalBudget > 0 ? Math.round((yrBudget / data.totalBudget) * 100) : 0;
                return (
                  <div
                    key={y}
                    className="p-2 rounded-md bg-slate-50 border border-slate-200 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold">
                      <span>พ.ศ. {y}</span>
                      <span className="text-emerald-700 text-[10px] font-bold font-mono">{pct}%</span>
                    </div>
                    <div className="text-xs font-extrabold text-slate-900 mt-0.5 font-mono">
                      {formatMoney(yrBudget)}{' '}
                      <span className="text-[9px] font-normal text-slate-400">บ.</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Department Workload & Distribution */}
      {activeTab === 'workload' && (
        <div className="space-y-2.5">
          <DepartmentWorkloadSummary
            projects={data.projects}
            onSelectProject={onSelectProject}
          />

          {/* Quick Analytics Distribution Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {/* By Development Issue */}
            <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                  <PieIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>สัดส่วนตามประเด็นการพัฒนา</span>
                </h3>
              </div>
              {renderDistributionBar(data.byIssue, 5)}
            </div>

            {/* By Plan */}
            <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                  <FolderKanban className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>สัดส่วนตามแผนงานเทศบาล</span>
                </h3>
              </div>
              {renderDistributionBar(data.byPlan, 5)}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Recent Projects Table */}
      {activeTab === 'recent' && (
        <div className="bg-white rounded-lg p-2.5 sm:p-3 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-900">รายการโครงการล่าสุด</h3>
              <p className="text-[10px] text-slate-500">คลิกที่แถวของโครงการเพื่อดูหรือแก้ไขข้อมูล</p>
            </div>
            <button
              onClick={() => onNavigate('plan-first')}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
            >
              ดูในแผน ผ.02 ทั้งหมด <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto border border-slate-100 rounded-md custom-scrollbar">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#065F46] text-white">
                  <th className="py-1.5 px-2 font-bold rounded-tl-md text-center w-12 border-r border-white/15">ID</th>
                  <th className="py-1.5 px-2 font-bold border-r border-white/15">ชื่อโครงการ</th>
                  <th className="py-1.5 px-2 font-bold border-r border-white/15">ประเด็นการพัฒนา</th>
                  <th className="py-1.5 px-2 font-bold border-r border-white/15">แผนงาน</th>
                  <th className="py-1.5 px-2 font-bold border-r border-white/15">หน่วยงานรับผิดชอบ</th>
                  <th className="py-1.5 px-2 font-bold text-center border-r border-white/15">ประเภท</th>
                  <th className="py-1.5 px-2 font-bold text-center rounded-tr-md">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.projects.slice(0, 15).map((p) => (
                  <tr
                    key={p.ID}
                    onClick={() => onSelectProject(p)}
                    className="hover:bg-emerald-50/70 transition cursor-pointer group"
                  >
                    <td className="py-1.5 px-2 font-bold text-slate-900 text-center font-mono group-hover:text-emerald-700">
                      {p.ID}
                    </td>
                    <td className="py-1.5 px-2 font-bold text-slate-900 max-w-xs truncate">
                      {p['ชื่อโครงการ']}
                    </td>
                    <td className="py-1.5 px-2 max-w-[180px] truncate text-slate-600">
                      {p['ประเด็นการพัฒนา']}
                    </td>
                    <td className="py-1.5 px-2 text-slate-600 truncate max-w-[140px]">{p['แผนงาน']}</td>
                    <td className="py-1.5 px-2 text-slate-600 truncate max-w-[140px]">{p['หน่วยงานรับผิดชอบหลัก']}</td>
                    <td className="py-1.5 px-2 text-center">{getTypeBadge(p['ประเภทรายการ'])}</td>
                    <td className="py-1.5 px-2 text-center">{getStatusBadge(p['สถานะดำเนินงาน'])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
