import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Coins,
  TrendingUp,
  SlidersHorizontal,
  Calendar,
  Layers,
  ArrowUpDown,
  Building2,
  FolderKanban,
  PieChart as PieIcon,
  ChevronRight,
  Info,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { Project, PlanType } from '../types';
import { YEARS, ORG_NAME } from '../data/initialData';

export type GroupDimension = 'type' | 'issue' | 'plan' | 'department';
export type ChartOrientation = 'vertical' | 'horizontal' | 'table';
export type SortOption = 'budget-desc' | 'budget-asc' | 'count-desc' | 'name';

interface BudgetSummaryBarChartProps {
  projects: Project[];
  onSelectProject?: (p: Project) => void;
  dimension?: GroupDimension;
  selectedYear?: string;
  onDimensionChange?: (d: GroupDimension) => void;
  onYearChange?: (y: string) => void;
}

interface ChartBarData {
  key: string;
  label: string;
  shortLabel: string;
  color: string;
  bgGradient: string;
  borderColor: string;
  totalBudget: number;
  projectCount: number;
  avgBudget: number;
  percentage: number;
  projects: Project[];
}

export const BudgetSummaryBarChart: React.FC<BudgetSummaryBarChartProps> = ({
  projects,
  onSelectProject,
  dimension: propDimension,
  selectedYear: propSelectedYear,
  onDimensionChange,
  onYearChange
}) => {
  const [internalDimension, setInternalDimension] = useState<GroupDimension>('type');
  const [internalSelectedYear, setInternalSelectedYear] = useState<string>('all');
  const [chartOrientation, setChartOrientation] = useState<ChartOrientation>('vertical');
  const [sortBy, setSortBy] = useState<SortOption>('budget-desc');
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [modalCategory, setModalCategory] = useState<ChartBarData | null>(null);

  const dimension = propDimension !== undefined ? propDimension : internalDimension;
  const setDimension = (d: GroupDimension) => {
    setInternalDimension(d);
    onDimensionChange?.(d);
  };

  const selectedYear = propSelectedYear !== undefined ? propSelectedYear : internalSelectedYear;
  const setSelectedYear = (y: string) => {
    setInternalSelectedYear(y);
    onYearChange?.(y);
  };

  const formatMoney = (n: number) => {
    return (Number(n) || 0).toLocaleString('th-TH');
  };

  const formatMoneyCompact = (n: number) => {
    const val = Number(n) || 0;
    if (val >= 1_000_000_000) {
      return (val / 1_000_000_000).toFixed(2) + ' พันลบ.';
    }
    if (val >= 1_000_000) {
      return (val / 1_000_000).toFixed(2) + ' ลบ.';
    }
    if (val >= 1_000) {
      return (val / 1_000).toFixed(1) + ' พัน';
    }
    return val.toLocaleString('th-TH');
  };

  // Compute Project Budget for chosen year
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

  // Color palette assignment for dimensions
  const getTypeColorConfig = (type: string) => {
    switch (type) {
      case 'ฉบับแรก':
        return {
          color: '#059669', // emerald-600
          bgGradient: 'from-emerald-600 to-teal-500',
          borderColor: 'border-emerald-500'
        };
      case 'เพิ่มเติม':
        return {
          color: '#0284c7', // sky-600
          bgGradient: 'from-sky-600 to-cyan-500',
          borderColor: 'border-sky-500'
        };
      case 'เปลี่ยนแปลง':
        return {
          color: '#7c3aed', // violet-600
          bgGradient: 'from-violet-600 to-purple-500',
          borderColor: 'border-violet-500'
        };
      case 'แก้ไข':
        return {
          color: '#d97706', // amber-600
          bgGradient: 'from-amber-500 to-orange-500',
          borderColor: 'border-amber-500'
        };
      default:
        return {
          color: '#64748b', // slate-500
          bgGradient: 'from-slate-600 to-slate-500',
          borderColor: 'border-slate-400'
        };
    }
  };

  const PALETTE = [
    { color: '#059669', bgGradient: 'from-emerald-600 to-teal-500', borderColor: 'border-emerald-500' },
    { color: '#0284c7', bgGradient: 'from-sky-600 to-blue-500', borderColor: 'border-sky-500' },
    { color: '#7c3aed', bgGradient: 'from-violet-600 to-purple-500', borderColor: 'border-violet-500' },
    { color: '#ea580c', bgGradient: 'from-orange-500 to-amber-500', borderColor: 'border-orange-500' },
    { color: '#0d9488', bgGradient: 'from-teal-600 to-emerald-500', borderColor: 'border-teal-500' },
    { color: '#e11d48', bgGradient: 'from-rose-600 to-pink-500', borderColor: 'border-rose-500' },
    { color: '#4f46e5', bgGradient: 'from-indigo-600 to-blue-500', borderColor: 'border-indigo-500' },
    { color: '#ca8a04', bgGradient: 'from-yellow-600 to-amber-500', borderColor: 'border-yellow-500' },
    { color: '#0891b2', bgGradient: 'from-cyan-600 to-sky-500', borderColor: 'border-cyan-500' },
    { color: '#9333ea', bgGradient: 'from-purple-600 to-fuchsia-500', borderColor: 'border-purple-500' }
  ];

  // Aggregated Data Calculation
  const { chartData, grandTotalBudget, grandTotalCount, maxBudget } = useMemo(() => {
    const groupMap: Record<string, { label: string; budget: number; count: number; items: Project[] }> = {};

    // Standard preset keys for 'type' to ensure all 4 appear even if 0
    if (dimension === 'type') {
      ['ฉบับแรก', 'เพิ่มเติม', 'เปลี่ยนแปลง', 'แก้ไข'].forEach((t) => {
        groupMap[t] = { label: t, budget: 0, count: 0, items: [] };
      });
    }

    projects.forEach((p) => {
      let rawKey = '';
      let displayLabel = '';

      if (dimension === 'type') {
        rawKey = p['ประเภทรายการ'] || 'ฉบับแรก';
        displayLabel = `โครงการ${rawKey}`;
      } else if (dimension === 'issue') {
        rawKey = p['ประเด็นการพัฒนา'] || 'ไม่ระบุประเด็นการพัฒนา';
        displayLabel = rawKey;
      } else if (dimension === 'plan') {
        rawKey = p['แผนงาน'] || 'ไม่ระบุแผนงาน';
        displayLabel = rawKey;
      } else if (dimension === 'department') {
        rawKey = p['หน่วยงานรับผิดชอบหลัก'] || 'ไม่ระบุหน่วยงาน';
        displayLabel = rawKey;
      }

      if (!groupMap[rawKey]) {
        groupMap[rawKey] = { label: displayLabel || rawKey, budget: 0, count: 0, items: [] };
      }

      const budget = getProjectBudget(p, selectedYear);
      groupMap[rawKey].budget += budget;
      groupMap[rawKey].count += 1;
      groupMap[rawKey].items.push(p);
    });

    let totalBudgetSum = 0;
    let totalCountSum = 0;

    Object.values(groupMap).forEach((g) => {
      totalBudgetSum += g.budget;
      totalCountSum += g.count;
    });

    let rawList: ChartBarData[] = Object.entries(groupMap).map(([key, data], idx) => {
      const pct = totalBudgetSum > 0 ? (data.budget / totalBudgetSum) * 100 : 0;
      const avg = data.count > 0 ? data.budget / data.count : 0;

      let colorCfg = dimension === 'type' ? getTypeColorConfig(key) : PALETTE[idx % PALETTE.length];

      // Clean short label for vertical chart ticks
      let shortLabel = data.label;
      if (dimension === 'issue') {
        shortLabel = data.label.length > 28 ? data.label.substring(0, 26) + '...' : data.label;
      } else if (dimension === 'plan') {
        shortLabel = data.label.replace('แผนงาน', '');
      }

      return {
        key,
        label: data.label,
        shortLabel,
        color: colorCfg.color,
        bgGradient: colorCfg.bgGradient,
        borderColor: colorCfg.borderColor,
        totalBudget: data.budget,
        projectCount: data.count,
        avgBudget: avg,
        percentage: pct,
        projects: data.items
      };
    });

    // Sorting
    if (sortBy === 'budget-desc') {
      rawList.sort((a, b) => b.totalBudget - a.totalBudget);
    } else if (sortBy === 'budget-asc') {
      rawList.sort((a, b) => a.totalBudget - b.totalBudget);
    } else if (sortBy === 'count-desc') {
      rawList.sort((a, b) => b.projectCount - a.projectCount);
    } else if (sortBy === 'name') {
      rawList.sort((a, b) => a.label.localeCompare(b.label, 'th'));
    }

    const maxB = Math.max(1, ...rawList.map((d) => d.totalBudget));

    return {
      chartData: rawList,
      grandTotalBudget: totalBudgetSum,
      grandTotalCount: totalCountSum,
      maxBudget: maxB
    };
  }, [projects, dimension, selectedYear, sortBy]);

  // Dimension titles
  const getDimensionTitle = () => {
    switch (dimension) {
      case 'type':
        return 'ประเภทโครงการในแผนพัฒนาท้องถิ่น (ฉบับแรก / เพิ่มเติม / เปลี่ยนแปลง / แก้ไข)';
      case 'issue':
        return 'ประเด็นการพัฒนาตามยุทธศาสตร์ (5 ประเด็น)';
      case 'plan':
        return 'แผนงานตามระเบียบกระทรวงมหาดไทย';
      case 'department':
        return 'สำนัก/กอง (หน่วยงานรับผิดชอบหลัก)';
    }
  };

  const topCategory = chartData.length > 0 ? chartData[0] : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-all">
      {/* Header & Controls Panel */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <span>กราฟสรุปยอดรวมงบประมาณ</span>
                  <span className="text-xs font-normal text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Bar Chart
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  วิเคราะห์และสรุปยอดงบประมาณแยกตาม {getDimensionTitle()}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Dimension Selector (shown if not controlled externally) */}
            {propDimension === undefined && (
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-400 pl-2 pr-1 hidden sm:inline">
                  จำแนกตาม:
                </span>
                <button
                  onClick={() => setDimension('type')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                    dimension === 'type'
                      ? 'bg-[#006853] text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  ประเภทโครงการ
                </button>
                <button
                  onClick={() => setDimension('issue')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                    dimension === 'issue'
                      ? 'bg-[#006853] text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  ประเด็นยุทธศาสตร์
                </button>
                <button
                  onClick={() => setDimension('plan')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                    dimension === 'plan'
                      ? 'bg-[#006853] text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  แผนงาน
                </button>
                <button
                  onClick={() => setDimension('department')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                    dimension === 'department'
                      ? 'bg-[#006853] text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  สำนัก/กอง
                </button>
              </div>
            )}

            {/* Fiscal Year Filter (shown if not controlled externally) */}
            {propSelectedYear === undefined && (
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
            )}

            {/* Sort By Selector */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 shadow-2xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-xs font-semibold text-slate-700 bg-transparent border-0 focus:ring-0 cursor-pointer pr-1 outline-none"
              >
                <option value="budget-desc">เรียง: งบประมาณมากไปน้อย</option>
                <option value="budget-asc">เรียง: งบประมาณน้อยไปมาก</option>
                <option value="count-desc">เรียง: จำนวนโครงการมากไปน้อย</option>
                <option value="name">เรียง: ตามชื่อ ก-ฮ</option>
              </select>
            </div>

            {/* View Mode Toggle: Vertical / Horizontal / Table */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-2xs">
              <button
                onClick={() => setChartOrientation('vertical')}
                title="กราฟแท่งแนวตั้ง"
                className={`p-1.5 rounded transition ${
                  chartOrientation === 'vertical'
                    ? 'bg-[#006853] text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setChartOrientation('horizontal')}
                title="กราฟแท่งแนวนอน"
                className={`p-1.5 rounded transition ${
                  chartOrientation === 'horizontal'
                    ? 'bg-[#006853] text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 rotate-90" />
              </button>
              <button
                onClick={() => setChartOrientation('table')}
                title="ตารางตัวเลขสรุป"
                className={`p-1.5 rounded transition ${
                  chartOrientation === 'table'
                    ? 'bg-[#006853] text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Executive KPI Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3.5 pt-3.5 border-t border-slate-200/70 text-xs">
          <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
            <span className="text-slate-500 font-medium block text-[11px]">ยอดงบประมาณรวม ({selectedYear === 'all' ? '5 ปี' : `ปี ${selectedYear}`})</span>
            <div className="text-base sm:text-lg font-extrabold text-emerald-700 font-mono mt-0.5">
              ฿{formatMoney(grandTotalBudget)}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
            <span className="text-slate-500 font-medium block text-[11px]">จำนวนโครงการทั้งหมด</span>
            <div className="text-base sm:text-lg font-extrabold text-slate-900 font-mono mt-0.5">
              {grandTotalCount}{' '}
              <span className="text-xs font-normal text-slate-400">โครงการ</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
            <span className="text-slate-500 font-medium block text-[11px]">หมวดที่ใช้งบประมาณสูงสุด</span>
            <div className="text-xs sm:text-sm font-bold text-slate-800 truncate mt-0.5" title={topCategory?.label}>
              {topCategory ? topCategory.label : '-'}
            </div>
            <div className="text-[10px] text-emerald-600 font-mono font-semibold">
              {topCategory ? `${topCategory.percentage.toFixed(1)}% (฿${formatMoneyCompact(topCategory.totalBudget)})` : ''}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
            <span className="text-slate-500 font-medium block text-[11px]">งบประมาณเฉลี่ยต่อโครงการ</span>
            <div className="text-base sm:text-lg font-extrabold text-slate-800 font-mono mt-0.5">
              ฿{grandTotalCount > 0 ? formatMoney(Math.round(grandTotalBudget / grandTotalCount)) : '0'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart Body */}
      <div className="p-4 sm:p-6">
        {/* ========================================================================= */}
        {/* VIEW 1: VERTICAL BAR CHART (กราฟแท่งแนวตั้ง) */}
        {/* ========================================================================= */}
        {chartOrientation === 'vertical' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="flex items-center gap-1 font-medium">
                <Coins className="w-3.5 h-3.5 text-emerald-600" />
                หน่วย: บาท (คลิกที่แท่งกราฟเพื่อดูรายชื่อโครงการ)
              </span>
              <span className="text-[11px] text-slate-400">
                สเกลสูงสุด: ฿{formatMoney(maxBudget)}
              </span>
            </div>

            {/* Vertical Chart Container */}
            <div className="relative pt-6 pb-2 border-b border-l border-slate-300 rounded-bl-sm">
              {/* Y-Axis Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                <div className="border-b border-dashed border-slate-200 w-full" />
                <div className="border-b border-dashed border-slate-200 w-full" />
                <div className="border-b border-dashed border-slate-200 w-full" />
                <div className="border-b border-dashed border-slate-200 w-full" />
              </div>

              {/* Bars Row */}
              <div className="grid gap-3 sm:gap-6 items-end min-h-[260px] sm:min-h-[300px] px-2 sm:px-4"
                style={{
                  gridTemplateColumns: `repeat(${chartData.length}, minmax(0, 1fr))`
                }}
              >
                {chartData.map((item) => {
                  const heightPercent = maxBudget > 0 ? Math.max(6, Math.round((item.totalBudget / maxBudget) * 100)) : 6;
                  const isHovered = hoveredKey === item.key;

                  return (
                    <div
                      key={item.key}
                      className="flex flex-col items-center h-full justify-end group cursor-pointer relative"
                      onMouseEnter={() => setHoveredKey(item.key)}
                      onMouseLeave={() => setHoveredKey(null)}
                      onClick={() => setModalCategory(item)}
                    >
                      {/* Top Value Label */}
                      <div
                        className={`text-center mb-1.5 transition-all duration-200 ${
                          isHovered ? 'scale-110 font-bold' : ''
                        }`}
                      >
                        <div className="text-[11px] sm:text-xs font-mono font-extrabold text-slate-800">
                          {formatMoneyCompact(item.totalBudget)}
                        </div>
                        <div className="text-[10px] font-mono text-emerald-700 font-bold">
                          {item.percentage.toFixed(1)}%
                        </div>
                      </div>

                      {/* Bar Pillar */}
                      <div className="w-full max-w-[64px] bg-slate-100 rounded-t-lg overflow-hidden flex flex-col justify-end p-0.5 shadow-2xs group-hover:shadow-md transition-all duration-200">
                        <div
                          className={`w-full bg-gradient-to-t ${item.bgGradient} rounded-t-md transition-all duration-500 relative flex items-start justify-center pt-1.5 ${
                            isHovered ? 'brightness-110 ring-2 ring-emerald-400/50' : ''
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        >
                          {/* Inner shimmer accent */}
                          <div className="w-2/3 h-1 bg-white/40 rounded-full mx-auto" />
                        </div>
                      </div>

                      {/* Bottom Label */}
                      <div className="mt-3 text-center w-full px-0.5">
                        <div
                          className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition truncate"
                          title={item.label}
                        >
                          {item.shortLabel}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium font-mono">
                          {item.projectCount} โครงการ
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: HORIZONTAL BAR CHART (กราฟแท่งแนวนอน) */}
        {/* ========================================================================= */}
        {chartOrientation === 'horizontal' && (
          <div className="space-y-3.5">
            <div className="text-xs text-slate-500 mb-2">
              คลิกที่แต่ละแถวเพื่อเปิดดูรายชื่อโครงการในหมวดนั้น
            </div>

            {chartData.map((item, idx) => {
              const widthPct = maxBudget > 0 ? Math.max(4, Math.round((item.totalBudget / maxBudget) * 100)) : 4;
              const isHovered = hoveredKey === item.key;

              return (
                <div
                  key={item.key}
                  onClick={() => setModalCategory(item)}
                  onMouseEnter={() => setHoveredKey(item.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isHovered
                      ? 'bg-emerald-50/60 border-emerald-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={item.label}>
                        {item.label}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold shrink-0">
                        {item.projectCount} โครงการ
                      </span>
                    </div>

                    <div className="flex items-center gap-3 sm:text-right shrink-0">
                      <div>
                        <span className="text-xs sm:text-sm font-extrabold font-mono text-emerald-700">
                          ฿{formatMoney(item.totalBudget)}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono ml-1.5 font-bold">
                          ({item.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Meter Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${item.bgGradient} transition-all duration-500`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                    <span>งบประมาณเฉลี่ย: ฿{formatMoney(Math.round(item.avgBudget))} / โครงการ</span>
                    <span className="text-emerald-700 font-medium hover:underline flex items-center gap-0.5">
                      ดูโครงการ <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: SUMMARY TABLE (ตารางตัวเลขสรุป) */}
        {/* ========================================================================= */}
        {chartOrientation === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="py-2.5 px-3 font-bold text-center w-12 rounded-tl-md">ลำดับ</th>
                  <th className="py-2.5 px-3 font-bold">หมวดหมู่ / รายการ</th>
                  <th className="py-2.5 px-3 font-bold text-center w-24">จำนวนโครงการ</th>
                  <th className="py-2.5 px-3 font-bold text-right w-36">ยอดงบประมาณ</th>
                  <th className="py-2.5 px-3 font-bold text-right w-32">งบเฉลี่ย/โครงการ</th>
                  <th className="py-2.5 px-3 font-bold text-center w-28 rounded-tr-md">สัดส่วน (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {chartData.map((item, idx) => (
                  <tr
                    key={item.key}
                    onClick={() => setModalCategory(item)}
                    className="hover:bg-emerald-50/60 cursor-pointer transition"
                  >
                    <td className="py-2.5 px-3 text-center text-slate-500 font-semibold">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${item.bgGradient}`} />
                        <span>{item.label}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                        {item.projectCount}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                      ฿{formatMoney(item.totalBudget)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      ฿{formatMoney(Math.round(item.avgBudget))}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${item.bgGradient}`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono font-bold text-slate-700 w-10 text-right">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={2} className="py-2.5 px-3 text-center">รวมทั้งสิ้น</td>
                  <td className="py-2.5 px-3 text-center font-mono">{grandTotalCount} โครงการ</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-700">฿{formatMoney(grandTotalBudget)}</td>
                  <td className="py-2.5 px-3 text-right font-mono">฿{grandTotalCount > 0 ? formatMoney(Math.round(grandTotalBudget / grandTotalCount)) : '0'}</td>
                  <td className="py-2.5 px-3 text-center font-mono">100.0%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: Projects list under selected Bar Chart Category */}
      {/* ========================================================================= */}
      {modalCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${modalCategory.bgGradient}`} />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {modalCategory.label}
                  </h3>
                  <p className="text-xs text-slate-400">
                    ยอดงบประมาณ ฿{formatMoney(modalCategory.totalBudget)} ({modalCategory.percentage.toFixed(1)}%) • {modalCategory.projectCount} โครงการ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalCategory(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Projects List */}
            <div className="p-4 overflow-y-auto space-y-2 divide-y divide-slate-100 flex-1">
              {modalCategory.projects.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  ไม่มีโครงการในหมวดหมู่นี้
                </div>
              ) : (
                modalCategory.projects.map((p, idx) => {
                  const bVal = getProjectBudget(p, selectedYear);
                  return (
                    <div
                      key={p.ID}
                      onClick={() => {
                        if (onSelectProject) {
                          onSelectProject(p);
                          setModalCategory(null);
                        }
                      }}
                      className="pt-2 first:pt-0 p-2 rounded-lg hover:bg-emerald-50/70 transition cursor-pointer flex items-start justify-between gap-3 group"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-mono font-bold text-slate-400">
                            #{p.ID}
                          </span>
                          <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition">
                            {p['ชื่อโครงการ']}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
                          <span>{p['หน่วยงานรับผิดชอบหลัก']}</span>
                          <span>•</span>
                          <span>{p['แผนงาน']}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono font-bold text-emerald-700">
                          ฿{formatMoney(bVal)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {selectedYear === 'all' ? 'งบ 5 ปี' : `ปี ${selectedYear}`}
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
                คลิกที่โครงการเพื่อเปิดดูรายละเอียดฉบับเต็ม
              </span>
              <button
                type="button"
                onClick={() => setModalCategory(null)}
                className="px-4 py-1.5 font-semibold rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
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
