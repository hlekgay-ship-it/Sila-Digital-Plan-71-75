import React, { useState, useEffect } from 'react';
import {
  Search,
  RotateCcw,
  Layers,
  Filter,
  CheckCircle2,
  Clock,
  CircleDashed,
  Download,
  FolderKanban,
  FileSpreadsheet,
  Menu,
  X
} from 'lucide-react';
import { Project, SearchCriteria, OptionsData, PlanType, ProjectStatus } from '../types';
import { YEARS, TYPE_LIST, STATUS_LIST, ORG_NAME, STANDARD_STRATEGIC_ISSUES, STANDARD_DEPARTMENTS, sortStrategicIssues } from '../data/initialData';
import { TablePagination } from './TablePagination';
import { StandardFilterBar } from './StandardFilterBar';
import { exportProjects } from '../services/exportService';

interface SearchViewProps {
  options: OptionsData;
  allProjects: Project[];
  onSearch: (criteria: SearchCriteria) => Project[];
  onSelectProject: (project: Project) => void;
  onToggleMobile?: () => void;
  globalFiscalYear?: number;
}

export const SearchView: React.FC<SearchViewProps> = ({
  options,
  allProjects,
  onSearch,
  onSelectProject,
  onToggleMobile,
  globalFiscalYear = 2571
}) => {
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>(String(globalFiscalYear));
  const [issue, setIssue] = useState('');
  const [plan, setPlan] = useState('');
  const [name, setName] = useState('');
  const [responsible, setResponsible] = useState('');
  const [type, setType] = useState('');
  const [year, setYear] = useState('');
  const [status, setStatus] = useState('');
  const [budgetVal, setBudgetVal] = useState<string>('');
  const [approvalDate, setApprovalDate] = useState('');

  const [results, setResults] = useState<Project[]>(allProjects);
  const [hasSearched, setHasSearched] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Sync results with allProjects when allProjects change
  useEffect(() => {
    setResults(allProjects);
  }, [allProjects]);

  const paginatedResults = React.useMemo(() => {
    if (pageSize >= 999 || pageSize === 0) return results;
    const startIndex = (currentPage - 1) * pageSize;
    return results.slice(startIndex, startIndex + pageSize);
  }, [results, currentPage, pageSize]);

  // Dynamic unique options derived from project data and standard departments
  const uniqueResponsible = Array.from(
    new Set([
      ...STANDARD_DEPARTMENTS,
      ...(options['หน่วยงานรับผิดชอบหลัก'] || []),
      ...allProjects.map((p) => p['หน่วยงานรับผิดชอบหลัก']).filter(Boolean)
    ])
  );

  const handleDoSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const budgetNum = budgetVal.trim() !== '' ? Number(budgetVal.replace(/,/g, '')) : undefined;
    const criteria: SearchCriteria = {
      issue: issue || undefined,
      plan: plan || undefined,
      name: name || undefined,
      responsible: responsible || undefined,
      type: type || undefined,
      year: year || (selectedFiscalYear !== 'ทั้งหมด' ? selectedFiscalYear : undefined),
      status: status || undefined,
      minBudget: budgetNum,
      approvalDate: approvalDate || undefined
    };

    const res = onSearch(criteria);
    setResults(res);
    setHasSearched(true);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setIssue('');
    setPlan('');
    setName('');
    setResponsible('');
    setType('');
    setYear('');
    setStatus('');
    setBudgetVal('');
    setApprovalDate('');
    setSelectedFiscalYear(String(globalFiscalYear));
    setResults(allProjects);
    setHasSearched(false);
    setCurrentPage(1);
  };

  const handleShowAll = () => {
    setIssue('');
    setPlan('');
    setName('');
    setResponsible('');
    setType('');
    setYear('');
    setStatus('');
    setBudgetVal('');
    setApprovalDate('');
    setSelectedFiscalYear('ทั้งหมด');
    setResults(allProjects);
    setHasSearched(false);
    setCurrentPage(1);
  };

  const formatMoney = (n: number | undefined) => {
    const num = Number(n) || 0;
    return num > 0 ? num.toLocaleString('th-TH') : '-';
  };

  const getStatusBadge = (st: ProjectStatus | string) => {
    switch (st) {
      case 'เสร็จสิ้น':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            เสร็จสิ้น
          </span>
        );
      case 'อยู่ระหว่างดำเนินการ':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            กำลังดำเนินการ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <CircleDashed className="w-3 h-3 text-rose-600" />
            ไม่ดำเนินการ
          </span>
        );
    }
  };

  const getTypeBadge = (t: PlanType | string) => {
    let color = 'bg-slate-100 text-slate-700 border-slate-200';
    if (t === 'เพิ่มเติม') color = 'bg-sky-100 text-sky-800 border-sky-200';
    if (t === 'เปลี่ยนแปลง') color = 'bg-purple-100 text-purple-800 border-purple-200';
    if (t === 'แก้ไข') color = 'bg-orange-100 text-orange-800 border-orange-200';

    return (
      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${color}`}>
        {t || 'ฉบับแรก'}
      </span>
    );
  };

  // Export search results as CSV
  const handleExportCSV = () => {
    if (!results.length) return;
    const headers = [
      'ID',
      'ปี พ.ศ.',
      'ประเภท',
      'ที่',
      'ประเด็นการพัฒนา',
      'แผนงาน',
      'ชื่อโครงการ',
      'วัตถุประสงค์',
      'เป้าหมาย (ผลผลิตของโครงการ)',
      'งบฯ 2571',
      'งบฯ 2572',
      'งบฯ 2573',
      'งบฯ 2574',
      'งบฯ 2575',
      'หน่วยงานรับผิดชอบ',
      'แหล่งที่มาของงบประมาณ',
      'สถานะ'
    ];

    const rows = results.map((p, index) => [
      p.ID,
      `"${p['ปี พ.ศ.']}"`,
      `"${p['ประเภทรายการ'] || 'ฉบับแรก'}"`,
      index + 1,
      `"${p['ประเด็นการพัฒนา'] || ''}"`,
      `"${p['แผนงาน'] || ''}"`,
      `"${p['ชื่อโครงการ'].replace(/"/g, '""')}"`,
      `"${(p['วัตถุประสงค์'] || '').replace(/"/g, '""')}"`,
      `"${(p['เป้าหมาย (ผลผลิต)'] || '').replace(/"/g, '""')}"`,
      p['งบประมาณ 2571'] || 0,
      p['งบประมาณ 2572'] || 0,
      p['งบประมาณ 2573'] || 0,
      p['งบประมาณ 2574'] || 0,
      p['งบประมาณ 2575'] || 0,
      `"${p['หน่วยงานรับผิดชอบหลัก'] || ''}"`,
      `"${p['แหล่งที่มาของงบประมาณ'] || '-'}"`,
      `"${p['สถานะดำเนินงาน'] || ''}"`
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `โครงการพัฒนาท้องถิ่น_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-3 pb-8">
      {/* ================= 1-4. UNIFIED TOP CONTAINER (HEADER, ACTION BAR, FILTER GRID 3x3, CONTROLS) ================= */}
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
              <Search className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold leading-tight flex items-center gap-2 flex-wrap">
                <span>ระบบสืบค้นโครงการแผนพัฒนาท้องถิ่น</span>
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
          onYearChange={(yr) => {
            setSelectedFiscalYear(yr);
            if (yr !== 'ทั้งหมด') {
              setYear(yr);
            } else {
              setYear('');
            }
          }}
          allYearsLabel="ทั้งหมด (2571-2575)"
          issueLabel="ประเด็นการพัฒนา"
          issueValue={issue}
          onIssueChange={(val) => setIssue(val)}
          issueOptions={sortStrategicIssues(options['ประเด็นการพัฒนา'] || STANDARD_STRATEGIC_ISSUES)}
          issueAllLabel="-- ทุกประเด็นการพัฒนา --"
          departmentLabel="หน่วยงานรับผิดชอบหลัก"
          departmentValue={responsible}
          onDepartmentChange={(val) => setResponsible(val)}
          departmentOptions={uniqueResponsible}
          departmentAllLabel="-- ทุกหน่วยงาน --"
          searchLabel="ชื่อโครงการ"
          searchValue={name}
          onSearchChange={(val) => setName(val)}
          searchPlaceholder="ค้นหาชื่อโครงการ..."
          budgetLabel="งบประมาณ (บาท)"
          budgetValue={budgetVal}
          onBudgetChange={(val) => setBudgetVal(val)}
          budgetPlaceholder="ระบุจำนวนเงิน..."
          onSearch={handleDoSearch}
          onShowAll={handleShowAll}
          onReset={handleReset}
          onExportExcel={() => exportProjects(results, 'excel', 'สืบค้นโครงการ')}
          onExportCsv={() => exportProjects(results, 'csv', 'สืบค้นโครงการ')}
          exportItemsCount={results.length}
          onPrint={() => window.print()}
        />
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
            <thead className="sticky top-0 z-20">
              <tr className="bg-[#065F46] text-white border-b border-emerald-800 shadow-xs">
                <th className="py-2.5 px-2.5 text-center w-12 font-bold border-r border-white/15">ID</th>
                <th className="py-2.5 px-2.5 font-bold text-center border-r border-white/15">ปี พ.ศ.</th>
                <th className="py-2.5 px-2.5 font-bold text-center border-r border-white/15">ประเภท</th>
                <th className="py-2.5 px-2.5 font-bold text-center w-10 border-r border-white/15">ที่</th>
                <th className="py-2.5 px-2.5 font-bold text-center min-w-[150px] border-r border-white/15">ประเด็นการพัฒนา</th>
                <th className="py-2.5 px-2.5 font-bold text-center min-w-[130px] border-r border-white/15">แผนงาน</th>
                <th className="py-2.5 px-2.5 font-bold text-center min-w-[200px] border-r border-white/15">ชื่อโครงการ</th>
                <th className="py-2.5 px-2.5 font-bold text-center min-w-[180px] border-r border-white/15">วัตถุประสงค์</th>
                <th className="py-2.5 px-2.5 font-bold text-center min-w-[180px] border-r border-white/15">เป้าหมาย (ผลผลิตของโครงการ)</th>
                <th className="py-2.5 px-2.5 font-bold text-center min-w-[100px] border-r border-white/15">งบฯ 2571</th>
                <th className="py-2.5 px-2.5 font-bold text-center min-w-[100px] border-r border-white/15">งบฯ 2572</th>
                <th className="py-2.5 px-2.5 font-bold text-center min-w-[100px] border-r border-white/15">งบฯ 2573</th>
                <th className="py-2.5 px-2.5 font-bold text-center min-w-[100px] border-r border-white/15">งบฯ 2574</th>
                <th className="py-2.5 px-2.5 font-bold text-center min-w-[100px] border-r border-white/15">งบฯ 2575</th>
                <th className="py-2.5 px-2.5 font-bold text-center min-w-[130px] border-r border-white/15">หน่วยงานรับผิดชอบ</th>
                <th className="py-2.5 px-2.5 font-bold text-center min-w-[120px] border-r border-white/15">แหล่งที่มาของงบประมาณ</th>
                <th className="py-2.5 px-2.5 font-bold text-center min-w-[120px]">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedResults.length > 0 ? (
                paginatedResults.map((p, idx) => {
                  const globalIdx = (pageSize >= 999 || pageSize === 0 ? 0 : (currentPage - 1) * pageSize) + idx;
                  return (
                    <tr
                      key={p.ID}
                      onClick={() => onSelectProject(p)}
                      className="hover:bg-emerald-50/70 transition cursor-pointer group"
                    >
                      {/* 1. ID */}
                      <td className="py-2 px-2.5 text-center font-bold text-slate-900 font-mono group-hover:text-emerald-700 bg-slate-50/50">
                        #{p.ID}
                      </td>

                      {/* 2. ปี พ.ศ. */}
                      <td className="py-2 px-2.5 text-center font-mono font-semibold text-slate-700">
                        {p['ปี พ.ศ.']}
                      </td>

                      {/* 3. ประเภท */}
                      <td className="py-2 px-2.5 text-center">
                        {getTypeBadge(p['ประเภทรายการ'])}
                      </td>

                      {/* 4. ที่ */}
                      <td className="py-2 px-2.5 text-center font-mono text-slate-500">
                        {globalIdx + 1}
                      </td>

                      {/* 5. ประเด็นการพัฒนา */}
                      <td className="py-2 px-2.5 text-slate-700 whitespace-normal max-w-[200px] leading-relaxed">
                        {p['ประเด็นการพัฒนา'] || '-'}
                      </td>

                      {/* 6. แผนงาน */}
                      <td className="py-2 px-2.5 text-slate-700 whitespace-normal max-w-[160px] leading-relaxed">
                        {p['แผนงาน'] || '-'}
                      </td>

                      {/* 7. ชื่อโครงการ */}
                      <td className="py-2 px-2.5 font-bold text-slate-900 group-hover:text-emerald-700 whitespace-normal min-w-[200px] max-w-[260px] leading-relaxed">
                        {p['ชื่อโครงการ']}
                      </td>

                      {/* 8. วัตถุประสงค์ */}
                      <td className="py-2 px-2.5 text-slate-600 whitespace-normal min-w-[180px] max-w-[240px] leading-relaxed">
                        {p['วัตถุประสงค์'] || '-'}
                      </td>

                      {/* 9. เป้าหมาย (ผลผลิตของโครงการ) */}
                      <td className="py-2 px-2.5 text-slate-600 whitespace-normal min-w-[180px] max-w-[240px] leading-relaxed">
                        {p['เป้าหมาย (ผลผลิต)'] || '-'}
                      </td>

                      {/* 10. งบฯ 2571 */}
                      <td className="py-2 px-2.5 text-right font-mono text-slate-800 font-medium">
                        {formatMoney(p['งบประมาณ 2571'])}
                      </td>

                      {/* 11. งบฯ 2572 */}
                      <td className="py-2 px-2.5 text-right font-mono text-slate-800 font-medium">
                        {formatMoney(p['งบประมาณ 2572'])}
                      </td>

                      {/* 12. งบฯ 2573 */}
                      <td className="py-2 px-2.5 text-right font-mono text-slate-800 font-medium">
                        {formatMoney(p['งบประมาณ 2573'])}
                      </td>

                      {/* 13. งบฯ 2574 */}
                      <td className="py-2 px-2.5 text-right font-mono text-slate-800 font-medium">
                        {formatMoney(p['งบประมาณ 2574'])}
                      </td>

                      {/* 14. งบฯ 2575 */}
                      <td className="py-2 px-2.5 text-right font-mono text-slate-800 font-medium">
                        {formatMoney(p['งบประมาณ 2575'])}
                      </td>

                      {/* 15. หน่วยงานรับผิดชอบ */}
                      <td className="py-2 px-2.5 text-slate-700 font-medium">
                        {p['หน่วยงานรับผิดชอบหลัก'] || '-'}
                      </td>

                      {/* 16. แหล่งที่มาของงบประมาณ */}
                      <td className="py-2 px-2.5 text-slate-600">
                        {p['แหล่งที่มาของงบประมาณ'] || '-'}
                      </td>

                      {/* 17. สถานะ */}
                      <td className="py-2 px-2.5 text-center">
                        {getStatusBadge(p['สถานะดำเนินงาน'])}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={17} className="p-8 text-center text-slate-400 text-xs">
                    ไม่พบโครงการที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              )}
            </tbody>
            {results.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={9} className="py-2.5 px-3 text-right">
                    รวมงบประมาณ ({results.length} รายการ):
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono text-emerald-800">
                    {formatMoney(results.reduce((s, p) => s + (p['งบประมาณ 2571'] || 0), 0))}
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono text-emerald-800">
                    {formatMoney(results.reduce((s, p) => s + (p['งบประมาณ 2572'] || 0), 0))}
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono text-emerald-800">
                    {formatMoney(results.reduce((s, p) => s + (p['งบประมาณ 2573'] || 0), 0))}
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono text-emerald-800">
                    {formatMoney(results.reduce((s, p) => s + (p['งบประมาณ 2574'] || 0), 0))}
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono text-emerald-800">
                    {formatMoney(results.reduce((s, p) => s + (p['งบประมาณ 2575'] || 0), 0))}
                  </td>
                  <td colSpan={3} className="py-2.5 px-2.5 text-slate-500 font-normal">
                    บาท
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Table Footer - Standard Pagination */}
        {results.length > 0 && (
          <TablePagination
            currentPage={currentPage}
            totalItems={results.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 20, 50, 100, 999]}
          />
        )}
      </div>
    </div>
  );
};
