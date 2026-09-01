import React, { useState, useRef, useMemo } from 'react';
import {
  FileText,
  Printer,
  Download,
  X,
  Settings2,
  Layers,
  Layout,
  CheckCircle2,
  FileSpreadsheet,
  GitCompare,
  Building2,
  Calendar,
  Sparkles,
  Eye,
  Sliders,
  ChevronRight,
  Maximize2,
  RotateCcw,
  Loader2,
  HelpCircle,
  Award
} from 'lucide-react';
import { Project, Report01Data, PlanType } from '../types';
import { YEARS, ORG_NAME, ORG_PROVINCE, STANDARD_STRATEGIC_ISSUES, STANDARD_DEPARTMENTS, sortStrategicIssues } from '../data/initialData';
import { exportElementToPdf, getOfficialPdfFilename, PdfExportOptions } from '../services/pdfExportService';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  report01?: Report01Data;
  initialReportType?: 'ผ01' | 'ผ02-baseline' | 'ผ02-additional' | 'change-diff' | 'edit-diff' | 'ผ02-all';
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  projects,
  report01,
  initialReportType = 'ผ02-baseline'
}) => {
  // Page Configuration States
  const [reportType, setReportType] = useState<PdfExportOptions['reportType']>(initialReportType);
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [marginMode, setMarginMode] = useState<'standard' | 'binder' | 'compact'>('binder');
  const [fontSizeMode, setFontSizeMode] = useState<'normal' | 'compact' | 'dense'>('compact');
  const [includeCoverPage, setIncludeCoverPage] = useState<boolean>(true);
  const [includeSignatures, setIncludeSignatures] = useState<boolean>(true);
  const [showPageNumbers, setShowPageNumbers] = useState<boolean>(true);
  const [showTimestamp, setShowTimestamp] = useState<boolean>(true);

  // Filters
  const [selectedDept, setSelectedDept] = useState<string>('ทั้งหมด');
  const [selectedIssue, setSelectedIssue] = useState<string>('ทั้งหมด');
  const [revisionNumber, setRevisionNumber] = useState<string>('1/2571');

  // Export State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<string>('');

  const printableCanvasRef = useRef<HTMLDivElement>(null);

  // Sync initial type
  React.useEffect(() => {
    if (initialReportType) {
      setReportType(initialReportType);
    }
  }, [initialReportType]);

  // Extract unique departments and issues
  const departments = useMemo(() => {
    const set = new Set<string>(STANDARD_DEPARTMENTS);
    projects.forEach((p) => {
      if (p['หน่วยงานรับผิดชอบหลัก']) set.add(p['หน่วยงานรับผิดชอบหลัก']);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'th'));
  }, [projects]);

  const issues = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p['ประเด็นการพัฒนา']) set.add(p['ประเด็นการพัฒนา']);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'th'));
  }, [projects]);

  // Filter projects by tab type and chosen filters
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Type matching
      if (reportType === 'ผ02-baseline' && (p['ประเภทรายการ'] || 'ฉบับแรก') !== 'ฉบับแรก') return false;
      if (reportType === 'ผ02-additional' && p['ประเภทรายการ'] !== 'เพิ่มเติม') return false;
      if (reportType === 'change-diff' && p['ประเภทรายการ'] !== 'เปลี่ยนแปลง') return false;
      if (reportType === 'edit-diff' && p['ประเภทรายการ'] !== 'แก้ไข') return false;

      // Department filter
      if (selectedDept !== 'ทั้งหมด' && p['หน่วยงานรับผิดชอบหลัก'] !== selectedDept) return false;

      // Issue filter
      if (selectedIssue !== 'ทั้งหมด' && p['ประเด็นการพัฒนา'] !== selectedIssue) return false;

      return true;
    });
  }, [projects, reportType, selectedDept, selectedIssue]);

  // Grouping for ผ.02
  const groupedProjects = useMemo(() => {
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

    const sortedIssues = sortStrategicIssues(order);
    return sortedIssues.map((issue) => ({ issue, items: map[issue] || [] }));
  }, [filteredProjects]);

  // Dynamic Report 01 Calculation
  const computedReport01 = useMemo(() => {
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

    const rows = issueOrder.map((issue) => ({ issue, years: issuesMap[issue] }));
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

    return { rows, totals, grandTotalCount, grandTotalBudget };
  }, [filteredProjects]);

  const formatMoney = (n: number | undefined | null, emptyChar: string = '-'): string => {
    const num = Number(n) || 0;
    if (num <= 0) return emptyChar;
    return num.toLocaleString('th-TH');
  };

  // Trigger PDF Generation
  const handleExportPdf = async () => {
    if (!printableCanvasRef.current) return;
    setIsExporting(true);
    setExportProgress('กำลังเตรียมข้อมูลเอกสาร...');

    try {
      const filename = getOfficialPdfFilename(reportType, ORG_NAME, '2571-2575');
      await exportElementToPdf(
        printableCanvasRef.current,
        filename,
        orientation,
        (progress) => setExportProgress(progress)
      );
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  // Trigger standard browser print dialog
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  // Margin CSS Classes
  const marginClasses =
    marginMode === 'binder'
      ? 'pl-10 pr-6 pt-6 pb-6' // Left 20-25mm for binder holes
      : marginMode === 'standard'
      ? 'p-6'
      : 'p-3.5';

  // Font Scaling CSS Classes
  const fontSizeClasses =
    fontSizeMode === 'dense'
      ? 'text-[10px] leading-tight [&_th]:text-[10px] [&_td]:text-[10px] [&_th]:py-1 [&_td]:py-1'
      : fontSizeMode === 'compact'
      ? 'text-[11px] leading-snug [&_th]:text-[11px] [&_td]:text-[11px] [&_th]:py-1.5 [&_td]:py-1.5'
      : 'text-xs leading-normal [&_th]:text-xs [&_td]:text-xs [&_th]:py-2 [&_td]:py-2';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs select-none">
      <div className="bg-white rounded-2xl w-full max-w-7xl h-[94vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>ระบบส่งออกรายงานราชการ ผ.01 / ผ.02 เป็นไฟล์ PDF</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  มาตรฐาน ระเบียบ มท.
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                จัดการหน้ากระดาษ A4 แนวนอน/แนวตั้ง ระยะขอบเย็บเล่ม เลขหน้า และส่วนลงนามผู้บริหาร
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content: Split View (Settings Sidebar + Live Document Canvas) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-100">
          
          {/* LEFT: Configuration Panel (Page Setup & Settings) */}
          <div className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-4 overflow-y-auto space-y-4 shrink-0 text-xs text-slate-700">
            
            {/* Setting Group 1: เลือกแบบรายงาน (Report Type) */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-900 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>1. เลือกแบบรายงานราชการ</span>
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ผ01">แบบ ผ.01: บัญชีสรุปโครงการพัฒนาท้องถิ่น</option>
                <option value="ผ02-baseline">แบบ ผ.02: บัญชีรายละเอียดโครงการ (ฉบับแรก)</option>
                <option value="ผ02-additional">แบบ ผ.02: บัญชีรายละเอียดโครงการ (เพิ่มเติม)</option>
                <option value="change-diff">แบบ ผ.02: บัญชีเปรียบเทียบโครงการ (เปลี่ยนแปลง)</option>
                <option value="edit-diff">แบบ ผ.02: บัญชีแก้ไขโครงการ (แก้ไข)</option>
                <option value="ผ02-all">แบบ ผ.02: บัญชีรายละเอียดโครงการ (รวมทุกฉบับ)</option>
              </select>
            </div>

            {/* Setting Group 2: การจัดหน้ากระดาษ (Page Layout) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="font-bold text-slate-900 flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-emerald-600" />
                <span>2. การจัดวางหน้ากระดาษ (Layout)</span>
              </label>

              {/* Orientation */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`p-2 rounded-lg border text-center transition flex flex-col items-center gap-1 ${
                    orientation === 'landscape'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-6 h-4 border border-current rounded-xs" />
                  <span className="text-[11px]">แนวนอน (แนะนำ)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`p-2 rounded-lg border text-center transition flex flex-col items-center gap-1 ${
                    orientation === 'portrait'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-4 h-6 border border-current rounded-xs" />
                  <span className="text-[11px]">แนวตั้ง</span>
                </button>
              </div>

              {/* Margins */}
              <div className="space-y-1">
                <span className="text-[11px] text-slate-500 font-medium">ระยะขอบกระดาษ:</span>
                <select
                  value={marginMode}
                  onChange={(e) => setMarginMode(e.target.value as any)}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="binder">มาตรฐานเย็บเล่ม (ขอบซ้าย 20 มม. เพื่อเจาะรู)</option>
                  <option value="standard">ขอบปกติ (15 มม. เท่ากันทุกด้าน)</option>
                  <option value="compact">ขอบกะทัดรัด (10 มม. ข้อมูลแน่นขึ้น)</option>
                </select>
              </div>

              {/* Font Size Scaling */}
              <div className="space-y-1">
                <span className="text-[11px] text-slate-500 font-medium">ขนาดตัวอักษรในตาราง:</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['normal', 'compact', 'dense'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setFontSizeMode(mode)}
                      className={`p-1.5 rounded text-[11px] font-semibold border transition ${
                        fontSizeMode === mode
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {mode === 'normal' ? 'ปกติ' : mode === 'compact' ? 'กะทัดรัด' : 'แน่นพิเศษ'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Setting Group 3: ส่วนประกอบเอกสาร (Document Options) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="font-bold text-slate-900 flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>3. องค์ประกอบเอกสารราชการ</span>
              </label>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCoverPage}
                    onChange={(e) => setIncludeCoverPage(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>รวมหน้าปกทางการ (Official Cover Page)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSignatures}
                    onChange={(e) => setIncludeSignatures(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>รวมส่วนลงนามรับรองผู้บริหารท้ายเล่ม</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPageNumbers}
                    onChange={(e) => setShowPageNumbers(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>แสดงหมายเลขหน้า ("หน้าที่ X")</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showTimestamp}
                    onChange={(e) => setShowTimestamp(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>แสดงวันที่และเวลาพิมพ์ที่ท้ายกระดาษ</span>
                </label>
              </div>
            </div>

            {/* Setting Group 4: ตัวกรองโครงการก่อนพิมพ์ (Filters) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="font-bold text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>4. ตัวกรองข้อมูล (Optional)</span>
              </label>

              <div className="space-y-1.5">
                <div>
                  <span className="text-[11px] text-slate-500">สำนัก/กอง:</span>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs mt-0.5"
                  >
                    <option value="ทั้งหมด">ทั้งหมดทุกสำนัก/กอง ({projects.length} โครงการ)</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500">ประเด็นการพัฒนา:</span>
                  <select
                    value={selectedIssue}
                    onChange={(e) => setSelectedIssue(e.target.value)}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs mt-0.5"
                  >
                    <option value="ทั้งหมด">ทั้งหมดทุกประเด็นยุทธศาสตร์</option>
                    {issues.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </div>

                {(reportType === 'ผ02-additional' || reportType === 'change-diff' || reportType === 'edit-diff') && (
                  <div>
                    <span className="text-[11px] text-slate-500">ครั้งที่จัดทำ:</span>
                    <input
                      type="text"
                      value={revisionNumber}
                      onChange={(e) => setRevisionNumber(e.target.value)}
                      placeholder="เช่น ครั้งที่ 1/2571"
                      className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs mt-0.5"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stat Summary */}
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 space-y-0.5">
              <div className="font-bold flex items-center justify-between">
                <span>จำนวนโครงการที่จะส่งออก:</span>
                <span className="font-mono">{filteredProjects.length} โครงการ</span>
              </div>
              <div className="text-slate-600">
                พร้อมสำหรับการบันทึกเป็นไฟล์ PDF (.pdf) ทางการ
              </div>
            </div>
          </div>

          {/* RIGHT: Live Document Preview Canvas */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col items-center">
            
            {/* Action Bar Above Canvas */}
            <div className="w-full max-w-5xl flex items-center justify-between mb-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="font-bold text-slate-900">ตัวอย่างหน้ากระดาษ A4 เสมือนจริง</span>
                <span className="text-slate-400">|</span>
                <span>{orientation === 'landscape' ? 'แนวนอน (297 × 210 มม.)' : 'แนวตั้ง (210 × 297 มม.)'}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  พิมพ์ (Print)
                </button>

                <button
                  type="button"
                  disabled={isExporting}
                  onClick={handleExportPdf}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{exportProgress || 'กำลังดาวน์โหลด...'}</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>ดาวน์โหลดไฟล์ PDF (.pdf)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* A4 PRINTABLE CANVAS (Render target for PDF & Print) */}
            <div className="w-full max-w-5xl overflow-x-auto pb-10">
              <div
                ref={printableCanvasRef}
                id="pdf-printable-canvas"
                className={`bg-white shadow-xl border border-slate-300 mx-auto text-slate-900 transition-all ${marginClasses} ${fontSizeClasses}`}
                style={{
                  minHeight: orientation === 'landscape' ? '210mm' : '297mm',
                  width: orientation === 'landscape' ? '100%' : '210mm',
                  maxWidth: '100%',
                  fontFamily: "'Sarabun', 'TH Sarabun New', sans-serif"
                }}
              >
                {/* ------------------------------------------------------------- */}
                {/* OPTIONAL: OFFICIAL COVER PAGE (หน้าปกเอกสาร) */}
                {/* ------------------------------------------------------------- */}
                {includeCoverPage && (
                  <div className="border-b-4 border-double border-slate-800 pb-10 mb-10 text-center space-y-6 pt-6">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md">
                      <Building2 className="w-10 h-10" />
                    </div>

                    <div className="space-y-2">
                      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                        {reportType === 'ผ01'
                          ? 'แบบ ผ.01 บัญชีสรุปโครงการพัฒนาท้องถิ่น'
                          : reportType === 'change-diff'
                          ? 'แบบ ผ.02 บัญชีเปรียบเทียบโครงการพัฒนาท้องถิ่น (เปลี่ยนแปลง)'
                          : reportType === 'edit-diff'
                          ? 'แบบ ผ.02 บัญชีแก้ไขโครงการพัฒนาท้องถิ่น (แก้ไข)'
                          : reportType === 'ผ02-additional'
                          ? 'แบบ ผ.02 บัญชีรายละเอียดโครงการพัฒนาท้องถิ่น (เพิ่มเติม)'
                          : 'แบบ ผ.02 บัญชีรายละเอียดโครงการพัฒนาท้องถิ่น'}
                      </h1>
                      <h2 className="text-lg font-bold text-emerald-800">
                        แผนพัฒนาท้องถิ่น (พ.ศ. 2571–2575)
                      </h2>
                      <p className="text-sm font-semibold text-slate-700">
                        {ORG_NAME} {ORG_PROVINCE}
                      </p>
                    </div>

                    <div className="inline-block px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div>
                        <strong>ประเภทเอกสาร:</strong>{' '}
                        {reportType === 'ผ01'
                          ? 'บัญชีสรุปโครงการ (ผ.01)'
                          : reportType === 'change-diff'
                          ? `ฉบับเปลี่ยนแปลง ครั้งที่ ${revisionNumber}`
                          : reportType === 'edit-diff'
                          ? `ฉบับแก้ไข ครั้งที่ ${revisionNumber}`
                          : reportType === 'ผ02-additional'
                          ? `ฉบับเพิ่มเติม ครั้งที่ ${revisionNumber}`
                          : 'ฉบับแรก (ตั้งต้น)'}
                      </div>
                      <div>
                        <strong>จำนวนโครงการทั้งหมด:</strong> {filteredProjects.length} โครงการ
                      </div>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* REPORT TYPE 1: แบบ ผ.01 บัญชีสรุปโครงการพัฒนาท้องถิ่น */}
                {/* ------------------------------------------------------------- */}
                {reportType === 'ผ01' && (
                  <div className="space-y-4">
                    {/* Official Header */}
                    <div className="flex items-start justify-between border-b pb-2">
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-slate-900">
                          แบบ ผ.01 บัญชีสรุปโครงการพัฒนาท้องถิ่น
                        </h3>
                        <p className="text-xs text-slate-600">
                          แผนพัฒนาท้องถิ่น (พ.ศ. 2571–2575) — {ORG_NAME}
                        </p>
                      </div>
                      <div className="text-right text-[11px] font-bold text-slate-700">
                        แบบ ผ.01
                      </div>
                    </div>

                    {/* Report 01 Summary Table */}
                    <table className="w-full border-collapse border border-slate-900 text-left">
                      <thead>
                        <tr className="bg-slate-100 text-center font-bold">
                          <th rowSpan={2} className="border border-slate-900 px-2 py-1.5 w-10">
                            ที่
                          </th>
                          <th rowSpan={2} className="border border-slate-900 px-3 py-1.5 min-w-[200px] text-left">
                            ยุทธศาสตร์ / ประเด็นการพัฒนา
                          </th>
                          {YEARS.map((y) => (
                            <th key={y} colSpan={2} className="border border-slate-900 px-2 py-1">
                              ปี พ.ศ. {y}
                            </th>
                          ))}
                          <th colSpan={2} className="border border-slate-900 px-2 py-1 bg-slate-200">
                            รวม 5 ปี (2571–2575)
                          </th>
                        </tr>
                        <tr className="bg-slate-100 text-center font-bold text-[10px]">
                          {YEARS.map((y) => (
                            <React.Fragment key={y}>
                              <th className="border border-slate-900 px-1 py-1 w-12">โครงการ</th>
                              <th className="border border-slate-900 px-1 py-1 w-24">งบประมาณ (บาท)</th>
                            </React.Fragment>
                          ))}
                          <th className="border border-slate-900 px-1 py-1 w-14 bg-slate-200">โครงการ</th>
                          <th className="border border-slate-900 px-1 py-1 w-28 bg-slate-200">งบประมาณ (บาท)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {computedReport01.rows.map((row, idx) => {
                          let rowTotalCount = 0;
                          let rowTotalBudget = 0;
                          YEARS.forEach((y) => {
                            rowTotalCount += row.years[y].count;
                            rowTotalBudget += row.years[y].budget;
                          });

                          return (
                            <tr key={row.issue} className="hover:bg-slate-50">
                              <td className="border border-slate-900 px-2 py-1 text-center font-bold">
                                {idx + 1}
                              </td>
                              <td className="border border-slate-900 px-3 py-1 font-semibold">
                                {row.issue}
                              </td>
                              {YEARS.map((y) => (
                                <React.Fragment key={y}>
                                  <td className="border border-slate-900 px-1 py-1 text-center font-mono">
                                    {row.years[y].count > 0 ? row.years[y].count : '-'}
                                  </td>
                                  <td className="border border-slate-900 px-2 py-1 text-right font-mono">
                                    {formatMoney(row.years[y].budget)}
                                  </td>
                                </React.Fragment>
                              ))}
                              <td className="border border-slate-900 px-1 py-1 text-center font-mono font-bold bg-slate-50">
                                {rowTotalCount > 0 ? rowTotalCount : '-'}
                              </td>
                              <td className="border border-slate-900 px-2 py-1 text-right font-mono font-bold bg-slate-50 text-emerald-800">
                                {formatMoney(rowTotalBudget)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-200 font-bold border-t-2 border-slate-900">
                          <td colSpan={2} className="border border-slate-900 px-3 py-1.5 text-center">
                            รวมทั้งสิ้น
                          </td>
                          {YEARS.map((y) => (
                            <React.Fragment key={y}>
                              <td className="border border-slate-900 px-1 py-1.5 text-center font-mono">
                                {computedReport01.totals[y].count}
                              </td>
                              <td className="border border-slate-900 px-2 py-1.5 text-right font-mono">
                                {formatMoney(computedReport01.totals[y].budget)}
                              </td>
                            </React.Fragment>
                          ))}
                          <td className="border border-slate-900 px-1 py-1.5 text-center font-mono font-bold">
                            {computedReport01.grandTotalCount}
                          </td>
                          <td className="border border-slate-900 px-2 py-1.5 text-right font-mono font-bold text-emerald-800">
                            {formatMoney(computedReport01.grandTotalBudget)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* REPORT TYPE 2: แบบ ผ.02 บัญชีรายละเอียดโครงการพัฒนาท้องถิ่น */}
                {/* ------------------------------------------------------------- */}
                {reportType !== 'ผ01' && (
                  <div className="space-y-6">
                    {/* Official Header Top Right */}
                    <div className="text-right text-sm sm:text-base font-bold text-slate-900">
                      แบบ ผ.02
                    </div>

                    {/* Official Center Title 3 Lines */}
                    <div className="text-center space-y-1">
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                        บัญชีรายละเอียดโครงการพัฒนาท้องถิ่น
                      </h3>
                      <p className="text-sm sm:text-base font-bold text-slate-900">
                        {reportType === 'ผ02-additional'
                          ? 'แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) ฉบับเพิ่มเติม'
                          : reportType === 'change-diff'
                          ? 'แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) ฉบับเปลี่ยนแปลง'
                          : reportType === 'edit-diff'
                          ? 'แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) ฉบับแก้ไข'
                          : 'แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575)'}
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-slate-900">
                        {ORG_NAME} {ORG_PROVINCE}
                      </p>
                    </div>

                    {/* Iterating by Development Issue */}
                    {groupedProjects.map((grp, gIdx) => {
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

                      const showReasonCol = reportType !== 'ผ02-baseline';

                      return (
                        <div key={grp.issue} className="space-y-2 mt-6">
                          <div className="text-xs sm:text-sm font-bold text-slate-900">
                            {gIdx + 1}. ประเด็นการพัฒนาท้องถิ่น: {grp.issue}
                          </div>

                          <table className="w-full border-collapse border border-slate-900 text-left text-xs">
                            <thead>
                              <tr className="bg-slate-100 text-center font-bold">
                                <th rowSpan={2} className="border border-slate-900 px-1.5 py-1 w-8">
                                  ที่
                                </th>
                                <th rowSpan={2} className="border border-slate-900 px-2 py-1 min-w-[140px] text-left">
                                  โครงการ
                                </th>
                                <th rowSpan={2} className="border border-slate-900 px-2 py-1 min-w-[120px] text-left">
                                  วัตถุประสงค์
                                </th>
                                <th rowSpan={2} className="border border-slate-900 px-2 py-1 min-w-[120px] text-left">
                                  เป้าหมาย<br />(ผลผลิตของโครงการ)
                                </th>
                                <th colSpan={YEARS.length} className="border border-slate-900 px-1 py-0.5 bg-slate-200">
                                  งบประมาณ
                                </th>
                                <th rowSpan={2} className="border border-slate-900 px-2 py-1 min-w-[110px] text-left">
                                  ผลที่คาดว่า<br />จะได้รับ
                                </th>
                                <th rowSpan={2} className="border border-slate-900 px-2 py-1 min-w-[90px] text-left">
                                  หน่วยงาน<br />รับผิดชอบหลัก
                                </th>
                                {showReasonCol && (
                                  <th rowSpan={2} className="border border-slate-900 px-2 py-1 min-w-[100px] text-left">
                                    เหตุผล<br />ความจำเป็น
                                  </th>
                                )}
                              </tr>
                              <tr className="bg-slate-100 text-center font-bold text-[10px]">
                                {YEARS.map((y) => (
                                  <th key={y} className="border border-slate-900 px-1 py-0.5 min-w-[65px]">
                                    พ.ศ. {y}<br />(บาท)
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {grp.items.map((p, pIdx) => (
                                <tr key={p.ID} className="hover:bg-slate-50 align-top">
                                  <td className="border border-slate-900 px-1 py-1 text-center font-bold">
                                    {pIdx + 1}
                                  </td>
                                  <td className="border border-slate-900 px-2 py-1 font-semibold text-slate-900">
                                    {p['ชื่อโครงการ']}
                                    {p['ประเภทรายการ'] !== 'ฉบับแรก' && (
                                      <span className="ml-1 text-[10px] font-normal text-purple-700">
                                        ({p['ประเภทรายการ']})
                                      </span>
                                    )}
                                  </td>
                                  <td className="border border-slate-900 px-2 py-1 whitespace-pre-line text-slate-800">
                                    {p['วัตถุประสงค์'] || '-'}
                                  </td>
                                  <td className="border border-slate-900 px-2 py-1 whitespace-pre-line text-slate-800">
                                    {p['เป้าหมาย (ผลผลิต)'] || '-'}
                                  </td>
                                  {YEARS.map((y) => {
                                    const val = Number(p[`งบประมาณ ${y}` as keyof Project]) || 0;
                                    return (
                                      <td
                                        key={y}
                                        className="border border-slate-900 px-1.5 py-1 text-right font-mono whitespace-nowrap"
                                      >
                                        {formatMoney(val)}
                                      </td>
                                    );
                                  })}
                                  <td className="border border-slate-900 px-2 py-1 text-slate-800">
                                    {p['ผลที่คาดว่าจะได้รับ'] || '-'}
                                  </td>
                                  <td className="border border-slate-900 px-2 py-1 font-medium text-slate-900">
                                    {p['หน่วยงานรับผิดชอบหลัก'] || '-'}
                                  </td>
                                  {showReasonCol && (
                                    <td className="border border-slate-900 px-2 py-1 text-slate-800">
                                      {p['เหตุผลและความจำเป็น'] || p['เหตุผลความจำเป็น'] || '-'}
                                    </td>
                                  )}
                                </tr>
                              ))}

                              {/* Group Subtotal */}
                              <tr className="bg-slate-100 font-bold border-t border-slate-900">
                                <td className="border border-slate-900 px-1 py-1 text-center font-bold">
                                  รวม
                                </td>
                                <td className="border border-slate-900 px-2 py-1 font-bold">
                                  {grp.items.length} โครงการ
                                </td>
                                <td className="border border-slate-900 px-2 py-1 text-center">-</td>
                                <td className="border border-slate-900 px-2 py-1 text-center">-</td>
                                {YEARS.map((y) => (
                                  <td
                                    key={y}
                                    className="border border-slate-900 px-1.5 py-1 text-right font-mono font-bold whitespace-nowrap"
                                  >
                                    {formatMoney(groupTotals[y])}
                                  </td>
                                ))}
                                <td className="border border-slate-900 px-2 py-1 text-center">-</td>
                                <td className="border border-slate-900 px-2 py-1 text-center">-</td>
                                {showReasonCol && (
                                  <td className="border border-slate-900 px-2 py-1 text-center">-</td>
                                )}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* OPTIONAL: OFFICIAL SIGN-OFF SECTION (ส่วนลงนามผู้บริหาร) */}
                {/* ------------------------------------------------------------- */}
                {includeSignatures && (
                  <div className="pt-10 mt-10 border-t-2 border-slate-800 page-break-inside-avoid">
                    <div className="grid grid-cols-3 gap-6 text-center text-xs">
                      {/* Signer 1: ผอ.กองยุทธศาสตร์ */}
                      <div className="space-y-8">
                        <div>
                          <p className="font-semibold text-slate-800">ผู้จัดทำรายงาน</p>
                          <div className="h-12 flex items-end justify-center">
                            <span className="text-slate-400 border-b border-dotted border-slate-400 w-40 inline-block" />
                          </div>
                          <p className="font-bold mt-1 text-slate-900">( .................................................... )</p>
                          <p className="text-slate-600 text-[11px]">ผู้อำนวยการกองยุทธศาสตร์และงบประมาณ</p>
                          <p className="text-slate-500 text-[10px]">วันที่ ....... เดือน ................... พ.ศ. ..........</p>
                        </div>
                      </div>

                      {/* Signer 2: ปลัดเทศบาล */}
                      <div className="space-y-8">
                        <div>
                          <p className="font-semibold text-slate-800">ผู้ตรวจสอบความถูกต้อง</p>
                          <div className="h-12 flex items-end justify-center">
                            <span className="text-slate-400 border-b border-dotted border-slate-400 w-40 inline-block" />
                          </div>
                          <p className="font-bold mt-1 text-slate-900">( .................................................... )</p>
                          <p className="text-slate-600 text-[11px]">ปลัด{ORG_NAME}</p>
                          <p className="text-slate-500 text-[10px]">วันที่ ....... เดือน ................... พ.ศ. ..........</p>
                        </div>
                      </div>

                      {/* Signer 3: นายกเทศมนตรี */}
                      <div className="space-y-8">
                        <div>
                          <p className="font-semibold text-slate-800">ผู้อนุมัติประกาศใช้แผน</p>
                          <div className="h-12 flex items-end justify-center">
                            <span className="text-slate-400 border-b border-dotted border-slate-400 w-40 inline-block" />
                          </div>
                          <p className="font-bold mt-1 text-slate-900">( .................................................... )</p>
                          <p className="text-slate-600 text-[11px]">นายกเทศมนตรีเมืองศิลา</p>
                          <p className="text-slate-500 text-[10px]">วันที่ ....... เดือน ................... พ.ศ. ..........</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Metadata (Timestamp & Page Number) */}
                <div className="pt-6 mt-6 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                  <span>
                    {showTimestamp &&
                      `พิมพ์เมื่อ: ${new Date().toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })} | ระบบแผนพัฒนาท้องถิ่น ${ORG_NAME}`}
                  </span>
                  {showPageNumbers && <span className="font-mono">หน้าที่ 1 / 1</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 text-white flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-400">
            เอกสารถูกจัดรูปแบบตามระเบียบกระทรวงมหาดไทยว่าด้วยการจัดทำแผนพัฒนาของ อปท.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 font-semibold rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            >
              ปิดหน้าต่าง
            </button>
            <button
              type="button"
              disabled={isExporting}
              onClick={handleExportPdf}
              className="px-4 py-1.5 font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white flex items-center gap-1.5 shadow-sm transition"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>กำลังสร้าง PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลดไฟล์ PDF (.pdf)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
