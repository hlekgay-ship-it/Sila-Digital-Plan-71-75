import React, { useState } from 'react';
import {
  X,
  History,
  GitCompare,
  ArrowRight,
  Printer,
  Calendar,
  Layers,
  Building2,
  Coins,
  CheckCircle2,
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Plus,
  Edit3
} from 'lucide-react';
import { Project, ProjectRevision, ProjectSnapshot, PlanType } from '../types';
import { YEARS, ORG_NAME, ORG_PROVINCE } from '../data/initialData';

interface ProjectRevisionModalProps {
  project: Project;
  onClose: () => void;
  onCreateNewRevision?: (project: Project) => void;
}

export const ProjectRevisionModal: React.FC<ProjectRevisionModalProps> = ({
  project,
  onClose,
  onCreateNewRevision
}) => {
  const revisions = project.revisions && project.revisions.length > 0
    ? project.revisions
    : [
        {
          revisionId: 'rev-base',
          revisionType: (project['ประเภทรายการ'] || 'ฉบับแรก') as PlanType,
          revisionNo: project['ประเภทรายการ'] === 'ฉบับแรก' ? 'ฉบับแรก' : `${project['ประเภทรายการ']} ครั้งที่ 1/${project['ปี พ.ศ.'] || 2571}`,
          fiscalYear: project['ปี พ.ศ.'] || 2571,
          approvalDate: project['วันที่บันทึก'] || '15/10/2570',
          approvalDocNo: 'ประกาศใช้แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575)',
          reason: project['เหตุผลและความจำเป็น'] || 'จัดทำแผนพัฒนาท้องถิ่น 5 ปี ตามระเบียบกระทรวงมหาดไทยฯ',
          createdAt: project['วันที่บันทึก'] || '15/10/2570 09:00',
          author: 'เจ้าหน้าที่วิเคราะห์นโยบายและแผน',
          data: {
            'ชื่อโครงการ': project['ชื่อโครงการ'],
            'วัตถุประสงค์': project['วัตถุประสงค์'],
            'เป้าหมาย (ผลผลิต)': project['เป้าหมาย (ผลผลิต)'],
            'งบประมาณ 2571': Number(project['งบประมาณ 2571']) || 0,
            'งบประมาณ 2572': Number(project['งบประมาณ 2572']) || 0,
            'งบประมาณ 2573': Number(project['งบประมาณ 2573']) || 0,
            'งบประมาณ 2574': Number(project['งบประมาณ 2574']) || 0,
            'งบประมาณ 2575': Number(project['งบประมาณ 2575']) || 0,
            'ผลที่คาดว่าจะได้รับ': project['ผลที่คาดว่าจะได้รับ'],
            'หน่วยงานรับผิดชอบหลัก': project['หน่วยงานรับผิดชอบหลัก'],
            'เหตุผลและความจำเป็น': project['เหตุผลและความจำเป็น'],
            'ประเด็นการพัฒนา': project['ประเด็นการพัฒนา'],
            'แผนงาน': project['แผนงาน'],
            'สถานะดำเนินงาน': project['สถานะดำเนินงาน']
          },
          previousData: project['ชื่อโครงการ (เดิม)']
            ? {
                'ชื่อโครงการ': project['ชื่อโครงการ (เดิม)'] || '',
                'วัตถุประสงค์': project['วัตถุประสงค์ (เดิม)'] || '',
                'เป้าหมาย (ผลผลิต)': project['เป้าหมาย (เดิม)'] || '',
                'งบประมาณ 2571': Number(project['งบประมาณ 2571 (เดิม)']) || 0,
                'งบประมาณ 2572': Number(project['งบประมาณ 2572 (เดิม)']) || 0,
                'งบประมาณ 2573': Number(project['งบประมาณ 2573 (เดิม)']) || 0,
                'งบประมาณ 2574': Number(project['งบประมาณ 2574 (เดิม)']) || 0,
                'งบประมาณ 2575': Number(project['งบประมาณ 2575 (เดิม)']) || 0,
                'ผลที่คาดว่าจะได้รับ': project['ผลที่คาดว่าจะได้รับ (เดิม)'] || '',
                'หน่วยงานรับผิดชอบหลัก': project['หน่วยงานรับผิดชอบหลัก (เดิม)'] || '',
                'เหตุผลและความจำเป็น': ''
              }
            : undefined,
          changeSummary: project['ประเภทรายการ'] === 'ฉบับแรก'
            ? ['บรรจุในแผนพัฒนาท้องถิ่นฉบับแรก (ตั้งต้น)']
            : ['มีการเปลี่ยนแปลง/แก้ไขรายละเอียดโครงการและงบประมาณ']
        }
      ];

  // Default to the latest revision (last in array)
  const [selectedRevisionIdx, setSelectedRevisionIdx] = useState<number>(revisions.length - 1);
  const [comparisonBaseIdx, setComparisonBaseIdx] = useState<number>(
    revisions.length > 1 ? selectedRevisionIdx - 1 : 0
  );
  const [compareMode, setCompareMode] = useState<'withPrevious' | 'withBaseline' | 'custom'>('withPrevious');

  const currentRev = revisions[selectedRevisionIdx] || revisions[revisions.length - 1];

  // Determine what is "Before" snapshot
  let beforeSnapshot: ProjectSnapshot | undefined;
  if (compareMode === 'withBaseline') {
    beforeSnapshot = revisions[0].data;
  } else if (compareMode === 'withPrevious') {
    if (selectedRevisionIdx > 0) {
      beforeSnapshot = revisions[selectedRevisionIdx - 1].data;
    } else {
      beforeSnapshot = currentRev.previousData;
    }
  } else {
    beforeSnapshot = revisions[comparisonBaseIdx]?.data;
  }

  const afterSnapshot: ProjectSnapshot = currentRev.data;

  // Budget calculations
  const calculateTotal = (snapshot?: ProjectSnapshot) => {
    if (!snapshot) return 0;
    return YEARS.reduce((sum, y) => sum + (Number(snapshot[`งบประมาณ ${y}` as keyof ProjectSnapshot]) || 0), 0);
  };

  const totalBefore = calculateTotal(beforeSnapshot);
  const totalAfter = calculateTotal(afterSnapshot);
  const budgetDiff = totalAfter - totalBefore;

  const formatMoney = (n: number | undefined) => {
    const val = Number(n) || 0;
    return val > 0 ? val.toLocaleString('th-TH') : '-';
  };

  const isDiff = (valA?: any, valB?: any) => {
    if (valA === undefined && valB === undefined) return false;
    return String(valA || '').trim() !== String(valB || '').trim();
  };

  const getRevisionTypeColor = (type: PlanType) => {
    switch (type) {
      case 'ฉบับแรก':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'เพิ่มเติม':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'เปลี่ยนแปลง':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'แก้ไข':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div
        id="project-revision-modal"
        className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-4 flex items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                  โครงการ #{project.ID}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getRevisionTypeColor(project['ประเภทรายการ'])}`}>
                  {project['ประเภทรายการ']}
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  (มีประวัติการปรับปรุง {revisions.length} ฉบับ)
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white mt-1 leading-tight line-clamp-1">
                {project['ชื่อโครงการ']}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onCreateNewRevision && (
              <button
                onClick={() => {
                  onClose();
                  onCreateNewRevision(project);
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                บันทึกการเปลี่ยนแปลง/แก้ไขใหม่
              </button>
            )}
            <button
              onClick={() => window.print()}
              title="พิมพ์แบบเปรียบเทียบ"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Step / Timeline Sequence */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                  ลำดับไทม์ไลน์และประวัติการเปลี่ยนแปลง/แก้ไข (Version History)
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                คลิกเลือกฉบับเพื่อดูรายละเอียดและเปรียบเทียบ
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {revisions.map((rev, idx) => {
                const isSelected = idx === selectedRevisionIdx;
                const isLatest = idx === revisions.length - 1;
                const isBase = idx === 0;

                return (
                  <button
                    key={rev.revisionId || idx}
                    type="button"
                    onClick={() => {
                      setSelectedRevisionIdx(idx);
                      if (compareMode === 'withPrevious') {
                        setComparisonBaseIdx(idx > 0 ? idx - 1 : 0);
                      }
                    }}
                    className={`text-left p-3 rounded-xl border transition relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    {isLatest && (
                      <span className="absolute -top-2 right-2 text-[9px] font-bold bg-emerald-600 text-white px-1.5 py-0.2 rounded-full uppercase">
                        ฉบับปัจจุบัน
                      </span>
                    )}
                    {isBase && (
                      <span className="absolute -top-2 right-2 text-[9px] font-bold bg-blue-600 text-white px-1.5 py-0.2 rounded-full uppercase">
                        ฉบับตั้งต้น
                      </span>
                    )}

                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getRevisionTypeColor(rev.revisionType)}`}>
                          {rev.revisionType}
                        </span>
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {rev.revisionNo}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{rev.approvalDate || rev.createdAt}</span>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">งบรวม:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {calculateTotal(rev.data).toLocaleString('th-TH')} บ.
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compare Control Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800">
                เปรียบเทียบการเปลี่ยนแปลง:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  onClick={() => setCompareMode('withPrevious')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    compareMode === 'withPrevious'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  เทียบกับฉบับก่อนหน้า
                </button>
                <button
                  onClick={() => setCompareMode('withBaseline')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    compareMode === 'withBaseline'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  เทียบกับฉบับตั้งต้น
                </button>
              </div>

              {/* Status pill for budget diff */}
              <div className="ml-auto sm:ml-0 flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold bg-slate-50 border border-slate-200">
                <span className="text-slate-500 text-[11px] font-sans">ผลต่างงบประมาณ:</span>
                {budgetDiff > 0 ? (
                  <span className="text-emerald-700 flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +{budgetDiff.toLocaleString('th-TH')} บาท (เพิ่มขึ้น)
                  </span>
                ) : budgetDiff < 0 ? (
                  <span className="text-rose-700 flex items-center gap-0.5">
                    <TrendingDown className="w-3.5 h-3.5" />
                    {budgetDiff.toLocaleString('th-TH')} บาท (ลดลง)
                  </span>
                ) : (
                  <span className="text-slate-600">0 บาท (คงเดิม)</span>
                )}
              </div>
            </div>
          </div>

          {/* Revision Metadata Card */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-xs space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-700" />
                <span className="font-bold text-amber-900 text-sm">
                  ข้อมูลการอนุมัติและเหตุผลความจำเป็น — {currentRev.revisionNo}
                </span>
              </div>
              <div className="flex items-center gap-3 text-amber-800">
                <span><strong>วันที่อนุมัติ:</strong> {currentRev.approvalDate || '-'}</span>
                <span><strong>มติ/คำสั่ง:</strong> {currentRev.approvalDocNo || 'ตามระเบียบฯ'}</span>
              </div>
            </div>

            <div>
              <span className="font-bold text-amber-900">เหตุผลและความจำเป็นในการเปลี่ยนแปลง/แก้ไข:</span>
              <p className="text-amber-950 mt-0.5 leading-relaxed bg-white/70 p-2 rounded-lg border border-amber-200/60">
                {currentRev.reason || project['เหตุผลและความจำเป็น'] || 'เพื่อปรับปรุงรายละเอียดและงบประมาณให้สอดคล้องกับสภาพข้อเท็จจริงและความต้องการของประชาชน'}
              </p>
            </div>

            {currentRev.changeSummary && currentRev.changeSummary.length > 0 && (
              <div className="pt-1">
                <span className="font-bold text-amber-900">สรุปจุดสำคัญที่มีการเปลี่ยนแปลง:</span>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-900">
                  {currentRev.changeSummary.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Official Side-by-Side Comparison Table (บัญชีเปรียบเทียบ โครงการเดิม vs โครงการที่เปลี่ยนแปลง/แก้ไข) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs sm:text-sm font-bold">
                  ตารางเปรียบเทียบรายละเอียดโครงการ (เดิม ➔ ใหม่)
                </h4>
              </div>
              <span className="text-[11px] text-slate-300">
                เปรียบเทียบ: <strong className="text-white">{compareMode === 'withBaseline' ? 'ฉบับตั้งต้น' : 'ฉบับก่อนหน้า'}</strong> ➔ <strong className="text-emerald-300">{currentRev.revisionNo}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <th className="py-2.5 px-3 font-bold border-r border-slate-200 w-1/4">
                      หัวข้อข้อมูล
                    </th>
                    <th className="py-2.5 px-3 font-bold border-r border-slate-200 w-[37.5%] bg-slate-100/80">
                      <div className="flex items-center justify-between">
                        <span>โครงการเดิม (ก่อนการปรับปรุง)</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">Before</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-3 font-bold w-[37.5%] bg-emerald-50/50 text-emerald-900">
                      <div className="flex items-center justify-between">
                        <span>โครงการที่เปลี่ยนแปลง / แก้ไข</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-800 font-bold">After (ใหม่)</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* 1. Project Name */}
                  {(() => {
                    const nameDiff = isDiff(beforeSnapshot?.['ชื่อโครงการ'], afterSnapshot['ชื่อโครงการ']);
                    return (
                      <tr className={nameDiff ? 'bg-amber-50/40' : ''}>
                        <td className="py-2.5 px-3 font-bold text-slate-800 border-r border-slate-200">
                          1. ชื่อโครงการ
                          {nameDiff && (
                            <span className="ml-1.5 px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[10px] font-bold">
                              แก้ไข
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200">
                          {beforeSnapshot?.['ชื่อโครงการ'] || <span className="text-slate-400 italic">- ไม่มีข้อมูลเดิม -</span>}
                        </td>
                        <td className={`py-2.5 px-3 font-semibold ${nameDiff ? 'text-emerald-900 bg-emerald-50/40' : 'text-slate-900'}`}>
                          {afterSnapshot['ชื่อโครงการ']}
                        </td>
                      </tr>
                    );
                  })()}

                  {/* 2. Objectives */}
                  {(() => {
                    const objDiff = isDiff(beforeSnapshot?.['วัตถุประสงค์'], afterSnapshot['วัตถุประสงค์']);
                    return (
                      <tr className={objDiff ? 'bg-amber-50/40' : ''}>
                        <td className="py-2.5 px-3 font-bold text-slate-800 border-r border-slate-200">
                          2. วัตถุประสงค์
                          {objDiff && (
                            <span className="ml-1.5 px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[10px] font-bold">
                              แก้ไข
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200 whitespace-pre-line leading-relaxed">
                          {beforeSnapshot?.['วัตถุประสงค์'] || '-'}
                        </td>
                        <td className={`py-2.5 px-3 whitespace-pre-line leading-relaxed ${objDiff ? 'text-emerald-900 bg-emerald-50/40 font-medium' : 'text-slate-800'}`}>
                          {afterSnapshot['วัตถุประสงค์']}
                        </td>
                      </tr>
                    );
                  })()}

                  {/* 3. Target / Outputs */}
                  {(() => {
                    const targetDiff = isDiff(beforeSnapshot?.['เป้าหมาย (ผลผลิต)'], afterSnapshot['เป้าหมาย (ผลผลิต)']);
                    return (
                      <tr className={targetDiff ? 'bg-amber-50/40' : ''}>
                        <td className="py-2.5 px-3 font-bold text-slate-800 border-r border-slate-200">
                          3. เป้าหมาย (ผลผลิตของโครงการ)
                          {targetDiff && (
                            <span className="ml-1.5 px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[10px] font-bold">
                              แก้ไข
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200 whitespace-pre-line leading-relaxed">
                          {beforeSnapshot?.['เป้าหมาย (ผลผลิต)'] || '-'}
                        </td>
                        <td className={`py-2.5 px-3 whitespace-pre-line leading-relaxed ${targetDiff ? 'text-emerald-900 bg-emerald-50/40 font-medium' : 'text-slate-800'}`}>
                          {afterSnapshot['เป้าหมาย (ผลผลิต)']}
                        </td>
                      </tr>
                    );
                  })()}

                  {/* 4. Budget Year by Year */}
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-800 border-r border-slate-200 align-top">
                      4. งบประมาณรายปี (พ.ศ. 2571 - 2575)
                    </td>
                    <td colSpan={2} className="p-0">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600">
                            <th className="py-1.5 px-2 text-center w-16 border-r border-slate-200">ปี พ.ศ.</th>
                            <th className="py-1.5 px-2 text-right border-r border-slate-200 w-[35%]">เดิม (บาท)</th>
                            <th className="py-1.5 px-2 text-right border-r border-slate-200 w-[35%]">ใหม่ (บาท)</th>
                            <th className="py-1.5 px-2 text-center w-[30%]">ผลต่าง (+/-)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {YEARS.map((y) => {
                            const valBefore = Number(beforeSnapshot?.[`งบประมาณ ${y}` as keyof ProjectSnapshot]) || 0;
                            const valAfter = Number(afterSnapshot[`งบประมาณ ${y}` as keyof ProjectSnapshot]) || 0;
                            const diff = valAfter - valBefore;
                            const changed = valBefore !== valAfter;

                            return (
                              <tr key={y} className={changed ? 'bg-amber-50/30' : ''}>
                                <td className="py-1.5 px-2 text-center font-bold text-slate-700 border-r border-slate-200">
                                  {y}
                                </td>
                                <td className="py-1.5 px-2 text-right font-mono text-slate-600 border-r border-slate-200">
                                  {formatMoney(valBefore)}
                                </td>
                                <td className={`py-1.5 px-2 text-right font-mono font-bold border-r border-slate-200 ${changed ? 'text-emerald-800 bg-emerald-50/40' : 'text-slate-900'}`}>
                                  {formatMoney(valAfter)}
                                </td>
                                <td className="py-1.5 px-2 text-right font-mono font-bold">
                                  {diff > 0 ? (
                                    <span className="text-emerald-700">+{diff.toLocaleString('th-TH')}</span>
                                  ) : diff < 0 ? (
                                    <span className="text-rose-700">{diff.toLocaleString('th-TH')}</span>
                                  ) : (
                                    <span className="text-slate-400 font-normal">คงเดิม</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="bg-emerald-50/70 font-bold border-t-2 border-emerald-200 text-slate-900">
                            <td className="py-2 px-2 text-center border-r border-emerald-200">รวม 5 ปี</td>
                            <td className="py-2 px-2 text-right font-mono border-r border-emerald-200">
                              {formatMoney(totalBefore)}
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-emerald-900 border-r border-emerald-200">
                              {formatMoney(totalAfter)}
                            </td>
                            <td className="py-2 px-2 text-right font-mono">
                              {budgetDiff > 0 ? (
                                <span className="text-emerald-800">+{budgetDiff.toLocaleString('th-TH')}</span>
                              ) : budgetDiff < 0 ? (
                                <span className="text-rose-800">{budgetDiff.toLocaleString('th-TH')}</span>
                              ) : (
                                <span className="text-slate-500 font-normal">คงเดิม</span>
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>

                  {/* 5. Expected Outcome */}
                  {(() => {
                    const outDiff = isDiff(beforeSnapshot?.['ผลที่คาดว่าจะได้รับ'], afterSnapshot['ผลที่คาดว่าจะได้รับ']);
                    return (
                      <tr className={outDiff ? 'bg-amber-50/40' : ''}>
                        <td className="py-2.5 px-3 font-bold text-slate-800 border-r border-slate-200">
                          5. ผลที่คาดว่าจะได้รับ
                          {outDiff && (
                            <span className="ml-1.5 px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[10px] font-bold">
                              แก้ไข
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200">
                          {beforeSnapshot?.['ผลที่คาดว่าจะได้รับ'] || '-'}
                        </td>
                        <td className={`py-2.5 px-3 ${outDiff ? 'text-emerald-900 bg-emerald-50/40 font-medium' : 'text-slate-800'}`}>
                          {afterSnapshot['ผลที่คาดว่าจะได้รับ']}
                        </td>
                      </tr>
                    );
                  })()}

                  {/* 6. Responsible Dept */}
                  {(() => {
                    const deptDiff = isDiff(beforeSnapshot?.['หน่วยงานรับผิดชอบหลัก'], afterSnapshot['หน่วยงานรับผิดชอบหลัก']);
                    return (
                      <tr className={deptDiff ? 'bg-amber-50/40' : ''}>
                        <td className="py-2.5 px-3 font-bold text-slate-800 border-r border-slate-200">
                          6. หน่วยงานรับผิดชอบหลัก
                          {deptDiff && (
                            <span className="ml-1.5 px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[10px] font-bold">
                              แก้ไข
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200">
                          {beforeSnapshot?.['หน่วยงานรับผิดชอบหลัก'] || '-'}
                        </td>
                        <td className={`py-2.5 px-3 ${deptDiff ? 'text-emerald-900 bg-emerald-50/40 font-medium' : 'text-slate-800'}`}>
                          {afterSnapshot['หน่วยงานรับผิดชอบหลัก']}
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-4 sm:px-6 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500">
            ระบบบันทึกประวัติการเปลี่ยนแปลงและแก้ไขแผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) | {ORG_NAME}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              พิมพ์บัญชีเปรียบเทียบ
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
