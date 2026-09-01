import React, { useState } from 'react';
import {
  X,
  Save,
  Trash2,
  Plus,
  Layers,
  ArrowRightLeft,
  Coins
} from 'lucide-react';
import { Project, PlanType, OptionsData } from '../types';
import { YEARS, STANDARD_STRATEGIC_ISSUES, STANDARD_DEPARTMENTS, sortStrategicIssues } from '../data/initialData';

interface ProjectFormModalProps {
  project: Project | null;
  sourceProject?: Project | null;
  planType: PlanType;
  options: OptionsData;
  onSave: (data: Partial<Project>) => void;
  onDelete?: (id: number) => void;
  onClose: () => void;
  onAddOption: (category: string, value: string) => void;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  project,
  sourceProject,
  planType,
  options,
  onSave,
  onDelete,
  onClose,
  onAddOption
}) => {
  const isEditing = !!project;
  const isCompare = planType === 'เปลี่ยนแปลง' || planType === 'แก้ไข';

  // Base project object for initialization (either the existing project being edited, or source project being changed)
  const baseProject = project || sourceProject;

  // Common Header State
  const [year, setYear] = useState<number>(baseProject ? Number(baseProject['ปี พ.ศ.']) || 2571 : 2571);
  const [issue, setIssue] = useState<string>(baseProject ? baseProject['ประเด็นการพัฒนา'] || '' : '');
  const [plan, setPlan] = useState<string>(baseProject ? baseProject['แผนงาน'] || '' : '');
  const [reason, setReason] = useState<string>(
    project ? project['เหตุผลและความจำเป็น'] || '' : ''
  );

  // New Data (for the modified version)
  const [name, setName] = useState<string>(baseProject ? baseProject['ชื่อโครงการ'] || '' : '');
  const [objective, setObjective] = useState<string>(baseProject ? baseProject['วัตถุประสงค์'] || '' : '');
  const [target, setTarget] = useState<string>(baseProject ? baseProject['เป้าหมาย (ผลผลิต)'] || '' : '');
  const [outcome, setOutcome] = useState<string>(baseProject ? baseProject['ผลที่คาดว่าจะได้รับ'] || '' : '');
  const [responsible, setResponsible] = useState<string>(
    baseProject ? baseProject['หน่วยงานรับผิดชอบหลัก'] || '' : ''
  );
  const [budget, setBudget] = useState<{ [y: number]: number }>({
    2571: baseProject ? Number(baseProject['งบประมาณ 2571']) || 0 : 0,
    2572: baseProject ? Number(baseProject['งบประมาณ 2572']) || 0 : 0,
    2573: baseProject ? Number(baseProject['งบประมาณ 2573']) || 0 : 0,
    2574: baseProject ? Number(baseProject['งบประมาณ 2574']) || 0 : 0,
    2575: baseProject ? Number(baseProject['งบประมาณ 2575']) || 0 : 0
  });

  // Old Data (for comparison in เปลี่ยนแปลง / แก้ไข)
  const [oldName, setOldName] = useState<string>(() => {
    if (project && project['ชื่อโครงการ (เดิม)']) return project['ชื่อโครงการ (เดิม)'];
    if (sourceProject) return sourceProject['ชื่อโครงการ'] || '';
    return project ? project['ชื่อโครงการ'] || '' : '';
  });
  const [oldObjective, setOldObjective] = useState<string>(() => {
    if (project && project['วัตถุประสงค์ (เดิม)']) return project['วัตถุประสงค์ (เดิม)'];
    if (sourceProject) return sourceProject['วัตถุประสงค์'] || '';
    return project ? project['วัตถุประสงค์'] || '' : '';
  });
  const [oldTarget, setOldTarget] = useState<string>(() => {
    if (project && project['เป้าหมาย (เดิม)']) return project['เป้าหมาย (เดิม)'];
    if (sourceProject) return sourceProject['เป้าหมาย (ผลผลิต)'] || '';
    return project ? project['เป้าหมาย (ผลผลิต)'] || '' : '';
  });
  const [oldOutcome, setOldOutcome] = useState<string>(() => {
    if (project && project['ผลที่คาดว่าจะได้รับ (เดิม)']) return project['ผลที่คาดว่าจะได้รับ (เดิม)'];
    if (sourceProject) return sourceProject['ผลที่คาดว่าจะได้รับ'] || '';
    return project ? project['ผลที่คาดว่าจะได้รับ'] || '' : '';
  });
  const [oldResponsible, setOldResponsible] = useState<string>(() => {
    if (project && project['หน่วยงานรับผิดชอบหลัก (เดิม)']) return project['หน่วยงานรับผิดชอบหลัก (เดิม)'];
    if (sourceProject) return sourceProject['หน่วยงานรับผิดชอบหลัก'] || '';
    return project ? project['หน่วยงานรับผิดชอบหลัก'] || '' : '';
  });
  const [oldBudget, setOldBudget] = useState<{ [y: number]: number }>(() => {
    if (project && project['งบประมาณ 2571 (เดิม)'] !== undefined) {
      return {
        2571: Number(project['งบประมาณ 2571 (เดิม)']) || 0,
        2572: Number(project['งบประมาณ 2572 (เดิม)']) || 0,
        2573: Number(project['งบประมาณ 2573 (เดิม)']) || 0,
        2574: Number(project['งบประมาณ 2574 (เดิม)']) || 0,
        2575: Number(project['งบประมาณ 2575 (เดิม)']) || 0
      };
    }
    if (sourceProject) {
      return {
        2571: Number(sourceProject['งบประมาณ 2571']) || 0,
        2572: Number(sourceProject['งบประมาณ 2572']) || 0,
        2573: Number(sourceProject['งบประมาณ 2573']) || 0,
        2574: Number(sourceProject['งบประมาณ 2574']) || 0,
        2575: Number(sourceProject['งบประมาณ 2575']) || 0
      };
    }
    return {
      2571: project ? Number(project['งบประมาณ 2571']) || 0 : 0,
      2572: project ? Number(project['งบประมาณ 2572']) || 0 : 0,
      2573: project ? Number(project['งบประมาณ 2573']) || 0 : 0,
      2574: project ? Number(project['งบประมาณ 2574']) || 0 : 0,
      2575: project ? Number(project['งบประมาณ 2575']) || 0 : 0
    };
  });

  // Add custom option UI
  const [newOptionCategory, setNewOptionCategory] = useState<string | null>(null);
  const [newOptionValue, setNewOptionValue] = useState<string>('');

  const totalNewBudget = YEARS.reduce((sum, y) => sum + (Number(budget[y]) || 0), 0);
  const totalOldBudget = YEARS.reduce((sum, y) => sum + (Number(oldBudget[y]) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('กรุณาระบุชื่อโครงการ');
      return;
    }

    const payload: Partial<Project> = {
      'ปี พ.ศ.': year,
      'ประเด็นการพัฒนา': issue,
      'แผนงาน': plan,
      'ประเภทรายการ': planType,
      'ชื่อโครงการ': name.trim(),
      'วัตถุประสงค์': objective.trim(),
      'เป้าหมาย (ผลผลิต)': target.trim(),
      'ผลที่คาดว่าจะได้รับ': outcome.trim(),
      'หน่วยงานรับผิดชอบหลัก': responsible.trim(),
      'งบประมาณ 2571': Number(budget[2571]) || 0,
      'งบประมาณ 2572': Number(budget[2572]) || 0,
      'งบประมาณ 2573': Number(budget[2573]) || 0,
      'งบประมาณ 2574': Number(budget[2574]) || 0,
      'งบประมาณ 2575': Number(budget[2575]) || 0,
      'งบประมาณที่อนุมัติ': project?.['งบประมาณที่อนุมัติ'],
      'สถานะงบประมาณ': project?.['สถานะงบประมาณ'],
      'การอ้างอิงแผน': project?.['การอ้างอิงแผน']
    };

    if (isCompare) {
      payload['ชื่อโครงการ (เดิม)'] = oldName.trim();
      payload['วัตถุประสงค์ (เดิม)'] = oldObjective.trim();
      payload['เป้าหมาย (เดิม)'] = oldTarget.trim();
      payload['ผลที่คาดว่าจะได้รับ (เดิม)'] = oldOutcome.trim();
      payload['หน่วยงานรับผิดชอบหลัก (เดิม)'] = oldResponsible.trim();
      payload['งบประมาณ 2571 (เดิม)'] = Number(oldBudget[2571]) || 0;
      payload['งบประมาณ 2572 (เดิม)'] = Number(oldBudget[2572]) || 0;
      payload['งบประมาณ 2573 (เดิม)'] = Number(oldBudget[2573]) || 0;
      payload['งบประมาณ 2574 (เดิม)'] = Number(oldBudget[2574]) || 0;
      payload['งบประมาณ 2575 (เดิม)'] = Number(oldBudget[2575]) || 0;
      payload['เหตุผลและความจำเป็น'] = reason.trim();
    } else if (planType === 'เพิ่มเติม') {
      payload['เหตุผลและความจำเป็น'] = reason.trim();
    }

    if (project && project.ID) {
      payload.ID = project.ID;
    }

    onSave(payload);
  };

  const handleAddCustomOption = (cat: string) => {
    if (newOptionValue.trim()) {
      onAddOption(cat, newOptionValue.trim());
      if (cat === 'ประเด็นการพัฒนา') setIssue(newOptionValue.trim());
      if (cat === 'แผนงาน') setPlan(newOptionValue.trim());
      if (cat === 'หน่วยงานรับผิดชอบหลัก') setResponsible(newOptionValue.trim());
      setNewOptionValue('');
      setNewOptionCategory(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 z-50 flex items-center justify-center p-1 sm:p-2 overflow-hidden backdrop-blur-2xs">
      <div className="bg-white rounded-xl max-w-6xl w-full h-[98vh] max-h-[98vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-3 py-1.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-emerald-600 flex items-center justify-center text-white shrink-0">
              {isCompare ? <ArrowRightLeft className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
            </div>
            <div>
              <h3 className="text-xs font-bold text-white leading-tight">
                {sourceProject
                  ? planType === 'เปลี่ยนแปลง'
                    ? `ขออนุมัติเปลี่ยนแปลงโครงการ (อ้างอิง #${sourceProject.ID}: ${sourceProject['ชื่อโครงการ']})`
                    : `ขอแก้ไขข้อความ/คำผิด (อ้างอิง #${sourceProject.ID}: ${sourceProject['ชื่อโครงการ']})`
                  : isEditing
                  ? `แก้ไขข้อมูลโครงการ #${project?.ID}`
                  : `เพิ่มข้อมูลโครงการใหม่ (${planType})`}
              </h3>
              <p className="text-[10px] text-emerald-400 font-medium leading-none">
                แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) — ประเภทรายการ: {planType}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden p-2 space-y-1.5 text-xs">
          {/* Top metadata grid (Compact 12-column grid) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-1.5 p-1.5 rounded-lg bg-slate-50 border border-slate-200 shrink-0">
            {/* Fiscal Year */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-700 leading-tight">
                ปี พ.ศ. บรรจุแผน
              </label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full bg-white text-xs border border-slate-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    พ.ศ. {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Type badge (read-only indicator) */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-700 leading-tight">ประเภทรายการ</label>
              <div className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-xs font-bold flex items-center justify-between">
                <span>{planType}</span>
                <span className="text-[9px] text-emerald-600 bg-emerald-100 px-1 rounded">
                  ผ.02
                </span>
              </div>
            </div>

            {/* Development Issue */}
            <div className="md:col-span-4">
              <label className="block text-[10px] font-bold text-slate-700 leading-tight">
                ประเด็นการพัฒนา (ยุทธศาสตร์)
              </label>
              <select
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                className="w-full bg-white text-xs border border-slate-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none truncate"
              >
                <option value="">-- เลือกประเด็นการพัฒนา --</option>
                {sortStrategicIssues(options['ประเด็นการพัฒนา'] || STANDARD_STRATEGIC_ISSUES).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Plan */}
            <div className="md:col-span-4">
              <label className="block text-[10px] font-bold text-slate-700 leading-tight">
                แผนงาน
              </label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full bg-white text-xs border border-slate-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none truncate"
              >
                <option value="">-- เลือกแผนงาน --</option>
                {(options['แผนงาน'] || []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Inline Add Option Dialog */}
          {newOptionCategory && (
            <div className="p-1.5 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center gap-2 shrink-0">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-emerald-900 leading-tight">
                  เพิ่มตัวเลือกใหม่สำหรับหมวด: {newOptionCategory}
                </label>
                <input
                  type="text"
                  value={newOptionValue}
                  onChange={(e) => setNewOptionValue(e.target.value)}
                  placeholder="พิมพ์ชื่อตัวเลือกใหม่..."
                  className="w-full bg-white text-xs border border-emerald-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  autoFocus
                />
              </div>
              <button
                type="button"
                onClick={() => handleAddCustomOption(newOptionCategory)}
                className="mt-3 px-3 py-0.5 bg-emerald-700 text-white rounded text-xs font-bold hover:bg-emerald-800"
              >
                บันทึก
              </button>
              <button
                type="button"
                onClick={() => setNewOptionCategory(null)}
                className="mt-3 px-2 py-0.5 text-slate-500 hover:text-slate-700 text-xs"
              >
                ยกเลิก
              </button>
            </div>
          )}

          {/* COMPARE FORM (เปลี่ยนแปลง / แก้ไข) vs STANDARD SINGLE VIEW FORM (ฉบับแรก / เพิ่มเติม) */}
          {isCompare ? (
            <div className="space-y-1.5 flex-1 flex flex-col justify-between">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 flex-1">
                {/* Column 1: ข้อมูลเดิม (Previous) */}
                <div className="p-2 rounded-lg bg-slate-100/90 border border-slate-300 space-y-1 opacity-90 flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-0.5 border-b border-slate-200">
                    <span className="font-bold text-[10.5px] text-slate-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block" />
                      ข้อมูลเดิม (ก่อน{planType})
                    </span>
                    <span className="text-[9px] text-slate-500">
                      {sourceProject ? `#${sourceProject.ID}` : ''}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[9.5px] font-semibold text-slate-600 leading-tight">
                      ชื่อโครงการ (เดิม)
                    </label>
                    <input
                      type="text"
                      value={oldName}
                      onChange={(e) => setOldName(e.target.value)}
                      className="w-full bg-white text-[11px] border border-slate-300 rounded px-1.5 py-0.5 text-slate-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-1">
                    <div>
                      <label className="block text-[9.5px] font-semibold text-slate-600 leading-tight">
                        วัตถุประสงค์ (เดิม)
                      </label>
                      <textarea
                        rows={1.5 as any}
                        value={oldObjective}
                        onChange={(e) => setOldObjective(e.target.value)}
                        className="w-full bg-white text-[11px] border border-slate-300 rounded px-1.5 py-0.5 text-slate-700 resize-none leading-tight"
                      />
                    </div>
                    <div>
                      <label className="block text-[9.5px] font-semibold text-slate-600 leading-tight">
                        เป้าหมาย (ผลผลิตเดิม)
                      </label>
                      <textarea
                        rows={1.5 as any}
                        value={oldTarget}
                        onChange={(e) => setOldTarget(e.target.value)}
                        className="w-full bg-white text-[11px] border border-slate-300 rounded px-1.5 py-0.5 text-slate-700 resize-none leading-tight"
                      />
                    </div>
                  </div>

                  {/* Old Budget 5 Years */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[9.5px] font-semibold text-slate-600 leading-tight">
                        งบประมาณ 5 ปี เดิม
                      </label>
                      <span className="text-[9px] text-slate-500 font-mono">
                        รวม: {totalOldBudget.toLocaleString('th-TH')} บ.
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1 text-[9px]">
                      {YEARS.map((y) => (
                        <div key={y} className="bg-white p-0.5 rounded border border-slate-200 text-center">
                          <div className="text-[8px] text-slate-400">{y}</div>
                          <input
                            type="number"
                            value={oldBudget[y]}
                            onChange={(e) =>
                              setOldBudget({ ...oldBudget, [y]: Number(e.target.value) || 0 })
                            }
                            className="w-full text-[9.5px] text-right font-mono border-0 p-0 focus:ring-0"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1">
                    <div>
                      <label className="block text-[9.5px] font-semibold text-slate-600 leading-tight">
                        ผลที่คาดว่าจะได้รับ (เดิม)
                      </label>
                      <textarea
                        rows={1.5 as any}
                        value={oldOutcome}
                        onChange={(e) => setOldOutcome(e.target.value)}
                        className="w-full bg-white text-[11px] border border-slate-300 rounded px-1.5 py-0.5 text-slate-700 resize-none leading-tight"
                      />
                    </div>
                    <div>
                      <label className="block text-[9.5px] font-semibold text-slate-600 leading-tight">
                        หน่วยงานรับผิดชอบ (เดิม)
                      </label>
                      <input
                        type="text"
                        value={oldResponsible}
                        onChange={(e) => setOldResponsible(e.target.value)}
                        className="w-full bg-white text-[11px] border border-slate-300 rounded px-1.5 py-0.5 text-slate-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Column 2: ข้อมูลใหม่ที่ขอเปลี่ยนแปลง/แก้ไข (New) */}
                <div className="p-2 rounded-lg bg-emerald-50/50 border border-emerald-300 space-y-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-0.5 border-b border-emerald-200">
                    <span className="font-bold text-[10.5px] text-emerald-900 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block animate-pulse" />
                      ข้อมูลใหม่ (ที่ขอ{planType})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setName(oldName);
                        setObjective(oldObjective);
                        setTarget(oldTarget);
                        setOutcome(oldOutcome);
                        setResponsible(oldResponsible);
                        setBudget({ ...oldBudget });
                      }}
                      className="text-[9.5px] text-emerald-700 hover:text-emerald-800 underline font-semibold"
                    >
                      คัดลอกจากเดิมทั้งหมด
                    </button>
                  </div>

                  <div>
                    <label className="block text-[9.5px] font-bold text-slate-800 leading-tight">
                      ชื่อโครงการ (ใหม่) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white text-[11px] border border-emerald-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-1">
                    <div>
                      <label className="block text-[9.5px] font-bold text-slate-800 leading-tight">
                        วัตถุประสงค์ (ใหม่)
                      </label>
                      <textarea
                        rows={1.5 as any}
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                        className="w-full bg-white text-[11px] border border-emerald-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-none leading-tight"
                      />
                    </div>
                    <div>
                      <label className="block text-[9.5px] font-bold text-slate-800 leading-tight">
                        เป้าหมาย (ผลผลิตใหม่)
                      </label>
                      <textarea
                        rows={1.5 as any}
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        className="w-full bg-white text-[11px] border border-emerald-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-none leading-tight"
                      />
                    </div>
                  </div>

                  {/* New Budget 5 Years */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[9.5px] font-bold text-emerald-950 leading-tight">
                        งบประมาณ 5 ปี ใหม่ (รวม: {totalNewBudget.toLocaleString('th-TH')} บ.)
                      </label>
                      {totalNewBudget !== totalOldBudget && (
                        <span
                          className={`text-[8.5px] font-bold font-mono px-1 rounded ${
                            totalNewBudget > totalOldBudget
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-blue-100 text-blue-900'
                          }`}
                        >
                          {totalNewBudget > totalOldBudget ? '+' : ''}
                          {(totalNewBudget - totalOldBudget).toLocaleString('th-TH')} บ.
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-5 gap-1 text-[9px]">
                      {YEARS.map((y) => (
                        <div key={y} className="bg-white p-0.5 rounded border border-emerald-300 text-center">
                          <div className="text-[8px] text-emerald-700 font-bold">{y}</div>
                          <input
                            type="number"
                            min="0"
                            value={budget[y]}
                            onChange={(e) =>
                              setBudget({ ...budget, [y]: Number(e.target.value) || 0 })
                            }
                            className="w-full text-[9.5px] text-right font-mono font-bold border-0 p-0 focus:ring-0 text-slate-900"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1">
                    <div>
                      <label className="block text-[9.5px] font-bold text-slate-800 leading-tight">
                        ผลที่คาดว่าจะได้รับ (ใหม่)
                      </label>
                      <textarea
                        rows={1.5 as any}
                        value={outcome}
                        onChange={(e) => setOutcome(e.target.value)}
                        className="w-full bg-white text-[11px] border border-emerald-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-none leading-tight"
                      />
                    </div>
                    <div>
                      <label className="block text-[9.5px] font-bold text-slate-800 leading-tight">
                        หน่วยงานรับผิดชอบ (ใหม่)
                      </label>
                      <select
                        value={responsible}
                        onChange={(e) => setResponsible(e.target.value)}
                        className="w-full bg-white text-[11px] border border-emerald-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none truncate"
                      >
                        <option value="">-- เลือกหน่วยงานรับผิดชอบ --</option>
                        {(options['หน่วยงานรับผิดชอบหลัก'] || STANDARD_DEPARTMENTS).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* STANDARD SINGLE VIEW FORM (ฉบับแรก / เพิ่มเติม) - Full view without scroll */
            <div className="space-y-2 flex-1">
              {/* Row 1: ชื่อโครงการ (Full width) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  ชื่อโครงการ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น โครงการก่อสร้างถนนคอนกรีตเสริมเหล็ก..."
                  className="w-full bg-white text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-medium"
                />
              </div>

              {/* Row 2: วัตถุประสงค์ & เป้าหมาย */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">วัตถุประสงค์</label>
                  <textarea
                    rows={2}
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    placeholder="เพื่ออำนวยความสะดวกในการสัญจรและขนส่งผลผลิตทางการเกษตร..."
                    className="w-full bg-white text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    เป้าหมาย (ผลผลิตของโครงการ)
                  </label>
                  <textarea
                    rows={2}
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    placeholder="ก่อสร้างถนน คสล. กว้าง 6 เมตร ยาว 1,500 เมตร หนา 0.15 เมตร..."
                    className="w-full bg-white text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Row 3: 5-Year Budget Box */}
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-emerald-600" />
                    ประมาณการงบประมาณ 5 ปี (พ.ศ. 2571 - 2575)
                  </label>
                  <div className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    งบประมาณรวม: {totalNewBudget.toLocaleString('th-TH')} บาท
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {YEARS.map((y) => (
                    <div key={y} className="bg-white p-1 rounded border border-slate-200">
                      <div className="text-[9px] font-semibold text-slate-500 text-center">พ.ศ. {y}</div>
                      <input
                        type="number"
                        min="0"
                        value={budget[y]}
                        onChange={(e) =>
                          setBudget({ ...budget, [y]: Number(e.target.value) || 0 })
                        }
                        className="w-full text-xs font-mono font-bold text-slate-900 border border-slate-200 rounded px-1.5 py-0.5 text-right focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 4: ผลที่คาดว่าจะได้รับ & หน่วยงานรับผิดชอบหลัก */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                <div className="md:col-span-8">
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    ผลที่คาดว่าจะได้รับ
                  </label>
                  <textarea
                    rows={1.5 as any}
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                    placeholder="ประชาชนสัญจรได้สะดวกรวดเร็วและปลอดภัย มีเส้นทางคมนาคมที่ได้มาตรฐาน..."
                    className="w-full bg-white text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-none"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    หน่วยงานรับผิดชอบหลัก
                  </label>
                  <select
                    value={responsible}
                    onChange={(e) => setResponsible(e.target.value)}
                    className="w-full bg-white text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="">-- เลือกหน่วยงานรับผิดชอบ --</option>
                    {(options['หน่วยงานรับผิดชอบหลัก'] || STANDARD_DEPARTMENTS).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Reason Box for Additional, Changed, or Corrected */}
          {(isCompare || planType === 'เพิ่มเติม') && (
            <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 shrink-0">
              <label className="block text-[10px] font-bold text-amber-900 leading-tight mb-0.5">
                เหตุผลและความจำเป็น {planType === 'เพิ่มเติม' ? 'ที่ต้องเพิ่มเติม' : `ที่ต้อง${planType}`}
              </label>
              <textarea
                rows={1.5 as any}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="ระบุเหตุผลความจำเป็นและข้อเท็จจริงประกอบการพิจารณา..."
                className="w-full bg-white text-[11px] border border-amber-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-amber-500 focus:outline-none text-slate-800 resize-none leading-tight"
              />
            </div>
          )}

          {/* Action buttons footer */}
          <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between shrink-0">
            <div>
              {isEditing && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`ยืนยันการลบโครงการ #${project?.ID} หรือไม่?`)) {
                      onDelete(project!.ID);
                    }
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold border border-rose-200 transition"
                >
                  <Trash2 className="w-3 h-3" />
                  ลบโครงการ
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="flex items-center gap-1 px-4 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition"
              >
                <Save className="w-3.5 h-3.5" />
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
