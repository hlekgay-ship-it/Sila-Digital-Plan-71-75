import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  GitCompare,
  FileEdit,
  ArrowRight,
  Filter,
  CheckCircle2,
  Building2,
  Calendar,
  Coins,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { Project, PlanType } from '../types';
import { YEARS, STANDARD_STRATEGIC_ISSUES, sortStrategicIssues } from '../data/initialData';

interface SelectProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  allProjects: Project[];
  targetPlanType: 'เปลี่ยนแปลง' | 'แก้ไข';
  onSelectProject: (project: Project) => void;
}

export const SelectProjectModal: React.FC<SelectProjectModalProps> = ({
  isOpen,
  onClose,
  allProjects,
  targetPlanType,
  onSelectProject
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<'all' | 'ฉบับแรก' | 'เพิ่มเติม'>('all');
  const [issueFilter, setIssueFilter] = useState('');

  // We only pull source projects from "ฉบับแรก" and "เพิ่มเติม" (baseline or additions)
  const candidateProjects = useMemo(() => {
    return allProjects.filter((p) => {
      const pType = p['ประเภทรายการ'] || 'ฉบับแรก';
      // Only baseline and additional projects can be modified or corrected
      const isValidSource = pType === 'ฉบับแรก' || pType === 'เพิ่มเติม';
      if (!isValidSource) return false;

      if (sourceTypeFilter !== 'all' && pType !== sourceTypeFilter) return false;
      if (issueFilter && p['ประเด็นการพัฒนา'] !== issueFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (p['ชื่อโครงการ'] || '').toLowerCase().includes(q);
        const matchObj = (p['วัตถุประสงค์'] || '').toLowerCase().includes(q);
        const matchResp = (p['หน่วยงานรับผิดชอบหลัก'] || '').toLowerCase().includes(q);
        const matchId = String(p.ID) === searchQuery.trim();
        if (!matchName && !matchObj && !matchResp && !matchId) return false;
      }

      return true;
    });
  }, [allProjects, sourceTypeFilter, issueFilter, searchQuery]);

  // Extract unique issues
  const uniqueIssues = useMemo(() => {
    const issues = new Set<string>(STANDARD_STRATEGIC_ISSUES);
    allProjects.forEach((p) => {
      if (p['ประเด็นการพัฒนา']) issues.add(p['ประเด็นการพัฒนา']);
    });
    return sortStrategicIssues(Array.from(issues));
  }, [allProjects]);

  if (!isOpen) return null;

  const isChange = targetPlanType === 'เปลี่ยนแปลง';

  const formatMoney = (n: number | undefined) => {
    const num = Number(n) || 0;
    return num > 0 ? num.toLocaleString('th-TH') : '-';
  };

  const calculateTotalBudget = (p: Project) => {
    return YEARS.reduce((sum, y) => sum + (Number(p[`งบประมาณ ${y}` as keyof Project]) || 0), 0);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto backdrop-blur-2xs">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className={`px-4 py-3 text-white flex items-center justify-between border-b ${
          isChange ? 'bg-slate-900 border-slate-800' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
              isChange ? 'bg-purple-600' : 'bg-amber-600'
            }`}>
              {isChange ? <GitCompare className="w-4 h-4" /> : <FileEdit className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                {isChange
                  ? 'เลือกโครงการในแผน เพื่อขออนุมัติเปลี่ยนแปลง'
                  : 'เลือกโครงการในแผน เพื่อขอแก้ไขข้อความ/คำผิด'}
              </h3>
              <p className="text-[11px] text-slate-300 mt-0.5">
                เลือกโครงการจาก <strong>แผนพัฒนาท้องถิ่น (ฉบับแรก)</strong> หรือ <strong>แผนพัฒนาท้องถิ่น เพิ่มเติม</strong> เพื่อนำมาดำเนินการ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Regulatory Guidance Banner */}
        <div className={`p-3 border-b flex items-start gap-2.5 text-xs ${
          isChange
            ? 'bg-purple-50/70 border-purple-200 text-purple-950'
            : 'bg-amber-50/70 border-amber-200 text-amber-950'
        }`}>
          <Info className={`w-4 h-4 shrink-0 mt-0.5 ${isChange ? 'text-purple-700' : 'text-amber-700'}`} />
          <div className="leading-relaxed">
            {isChange ? (
              <span>
                <strong>แนวทางปฏิบัติการเปลี่ยนแปลงแผน:</strong> นำโครงการที่มีอยู่ในแผนพัฒนาท้องถิ่นมาปรับปรุงสาระสำคัญ (เช่น ปรับวงเงินงบประมาณ, เปลี่ยนแปลงเป้าหมาย หรือวัตถุประสงค์) ระบบจะโหลดข้อมูลเดิมใส่ในแบบบัญชีเปรียบเทียบให้อัตโนมัติ
              </span>
            ) : (
              <span>
                <strong>แนวทางปฏิบัติการแก้ไขแผน:</strong> นำโครงการที่มีอยู่ในแผนพัฒนาท้องถิ่นมาแก้ไขข้อความที่พิมพ์ผิด หรือข้อความผิดพลาด โดยไม่กระทบต่อเป้าหมายและวัตถุประสงค์เดิมของโครงการ
              </span>
            )}
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {/* Search bar */}
          <div className="relative sm:col-span-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อโครงการ, วัตถุประสงค์..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 text-xs rounded-lg pl-8 pr-2.5 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Source Type Filter */}
          <div>
            <select
              value={sourceTypeFilter}
              onChange={(e) => setSourceTypeFilter(e.target.value as any)}
              className="w-full bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">-- จากทุกฉบับ (ฉบับแรก + เพิ่มเติม) --</option>
              <option value="ฉบับแรก">เฉพาะแผนพัฒนาท้องถิ่น (ฉบับแรก)</option>
              <option value="เพิ่มเติม">เฉพาะแผนพัฒนาท้องถิ่น เพิ่มเติม</option>
            </select>
          </div>

          {/* Issue Filter */}
          <div>
            <select
              value={issueFilter}
              onChange={(e) => setIssueFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 truncate"
            >
              <option value="">-- ทุกประเด็นการพัฒนา --</option>
              {uniqueIssues.map((issue) => (
                <option key={issue} value={issue}>
                  {issue}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Project List / Table */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
          {candidateProjects.length > 0 ? (
            <div className="space-y-2">
              <div className="text-[11px] text-slate-500 font-medium px-1 flex items-center justify-between">
                <span>พบโครงการในแผนทั้งหมด {candidateProjects.length} รายการ</span>
                <span>คลิกปุ่ม "เลือกโครงการนี้" เพื่อดำเนินการต่อ</span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                {candidateProjects.map((p) => {
                  const total5Year = calculateTotalBudget(p);
                  const pType = p['ประเภทรายการ'] || 'ฉบับแรก';

                  return (
                    <div
                      key={p.ID}
                      className="p-3 hover:bg-slate-50/90 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-500 text-[11px]">
                            #{p.ID}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            pType === 'ฉบับแรก'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            {pType}
                          </span>
                          <span className="text-[11px] text-slate-500 truncate">
                            {p['ประเด็นการพัฒนา']}
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-emerald-700 transition">
                          {p['ชื่อโครงการ']}
                        </h4>

                        {p['วัตถุประสงค์'] && (
                          <p className="text-[11px] text-slate-600 line-clamp-1">
                            <span className="font-medium text-slate-700">วัตถุประสงค์:</span> {p['วัตถุประสงค์']}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-0.5">
                          <span>
                            <strong className="text-slate-700">หน่วยงาน:</strong> {p['หน่วยงานรับผิดชอบหลัก'] || '-'}
                          </span>
                          <span>
                            <strong className="text-slate-700">งบประมาณรวม 5 ปี:</strong>{' '}
                            <span className="font-mono font-bold text-slate-900">
                              {formatMoney(total5Year)} บาท
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Select Action Button */}
                      <div className="flex-shrink-0 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectProject(p);
                            onClose();
                          }}
                          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-white font-bold text-xs shadow-2xs transition active:scale-95 ${
                            isChange
                              ? 'bg-purple-600 hover:bg-purple-700'
                              : 'bg-amber-600 hover:bg-amber-700'
                          }`}
                        >
                          {isChange ? <GitCompare className="w-3.5 h-3.5" /> : <FileEdit className="w-3.5 h-3.5" />}
                          <span>{isChange ? 'เลือกโครงการนี้เพื่อเปลี่ยนแปลง' : 'เลือกโครงการนี้เพื่อขอแก้ไข'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400 space-y-1">
              <p className="font-medium text-slate-600">ไม่พบโครงการในแผนที่ตรงกับเงื่อนไขการค้นหา</p>
              <p className="text-[11px]">ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองเป็น "จากทุกฉบับ"</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            {isChange
              ? 'ระบบจะสร้างฉบับเปลี่ยนแปลงพร้อมเปรียบเทียบกับข้อมูลโครงการตั้งต้น'
              : 'ระบบจะสร้างฉบับแก้ไขคำผิด/ข้อความโดยอ้างอิงโครงการตั้งต้น'}
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold transition"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
};
