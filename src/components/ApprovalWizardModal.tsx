import React, { useState, useMemo } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileCheck2,
  Search,
  Building2,
  Calendar,
  Layers,
  Save,
  Check
} from 'lucide-react';
import { PlanApproval, Project, PlanType } from '../types';
import { TYPE_LIST, YEARS, ORG_NAME, STANDARD_DEPARTMENTS } from '../data/initialData';

interface ApprovalWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<PlanApproval>) => void;
  editingApproval?: PlanApproval | null;
  projects: Project[];
  preselectedType?: PlanType;
  preselectedProjectIds?: number[];
}

export const ApprovalWizardModal: React.FC<ApprovalWizardModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingApproval,
  projects,
  preselectedType = 'เพิ่มเติม',
  preselectedProjectIds = []
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form states
  const [formType, setFormType] = useState<PlanType>(() => {
    if (editingApproval) {
      return (editingApproval['ประเภท']?.replace('แผนพัฒนาท้องถิ่น ', '') as PlanType) || 'เพิ่มเติม';
    }
    return preselectedType;
  });

  const [formNo, setFormNo] = useState<string>(() => {
    if (editingApproval) return editingApproval['ครั้งที่'] || '';
    return preselectedType === 'ฉบับแรก' ? 'ฉบับแรก' : `1/${YEARS[0]}`;
  });

  const [formYear, setFormYear] = useState<string>(() => {
    if (editingApproval) return String(editingApproval['ปี พ.ศ.'] || YEARS[0]);
    return String(YEARS[0]);
  });

  const [formDate, setFormDate] = useState<string>(() => {
    if (editingApproval) return editingApproval['วันที่อนุมัติประกาศใช้'] || '';
    return new Date().toISOString().split('T')[0];
  });

  const [formEffectiveDate, setFormEffectiveDate] = useState<string>(() => {
    if (editingApproval) return editingApproval['วันที่มีผลบังคับใช้'] || editingApproval['วันที่อนุมัติประกาศใช้'] || '';
    return new Date().toISOString().split('T')[0];
  });

  const [formDocNo, setFormDocNo] = useState<string>(() => {
    if (editingApproval) return editingApproval['เลขที่ประกาศ'] || '';
    return preselectedType === 'ฉบับแรก'
      ? `ประกาศ${ORG_NAME} เรื่อง ประกาศใช้แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575)`
      : `ประกาศ${ORG_NAME} เรื่อง ประกาศใช้แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) ${preselectedType} ครั้งที่ 1/${YEARS[0]}`;
  });

  const [formApprover, setFormApprover] = useState<string>(() => {
    if (editingApproval) return editingApproval['ผู้อนุมัติ'] || 'นายกเทศมนตรีเมืองศิลา';
    return 'นายกเทศมนตรีเมืองศิลา';
  });

  const [formStatus, setFormStatus] = useState<'อนุมัติ' | 'ไม่อนุมัติ'>(() => {
    if (editingApproval) return editingApproval['สถานะการประกาศ'] === 'ไม่อนุมัติ' ? 'ไม่อนุมัติ' : 'อนุมัติ';
    return 'อนุมัติ';
  });

  const [formSelectedProjectIds, setFormSelectedProjectIds] = useState<number[]>(() => {
    if (editingApproval) {
      return String(editingApproval.ProjectIDs || '')
        .split(',')
        .filter(Boolean)
        .map((s) => Number(s.trim()));
    }
    return preselectedProjectIds;
  });

  // Step 2 search & department filters
  const [projectSearch, setProjectSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ทั้งหมด');
  const [typeFilter, setTypeFilter] = useState('ทั้งหมด');

  // Format currency
  const formatMoney = (n: number | undefined | null): string => {
    const val = Number(n) || 0;
    return val.toLocaleString('th-TH');
  };

  // Distinct departments
  const departments = useMemo(() => {
    const set = new Set<string>(STANDARD_DEPARTMENTS);
    projects.forEach((p) => {
      if (p['หน่วยงานรับผิดชอบหลัก']) set.add(p['หน่วยงานรับผิดชอบหลัก']);
    });
    return Array.from(set);
  }, [projects]);

  // Filtered projects for selection in step 2
  const filteredSelectableProjects = useMemo(() => {
    return projects.filter((p) => {
      if (typeFilter !== 'ทั้งหมด') {
        const cleanType = (p['ประเภทรายการ'] || 'ฉบับแรก').replace('แผนพัฒนาท้องถิ่น ', '');
        if (cleanType !== typeFilter && (p['ประเภทรายการ'] || 'ฉบับแรก') !== typeFilter) return false;
      }
      if (departmentFilter !== 'ทั้งหมด' && p['หน่วยงานรับผิดชอบหลัก'] !== departmentFilter) {
        return false;
      }
      if (projectSearch.trim()) {
        const q = projectSearch.toLowerCase();
        const nameMatch = (p['ชื่อโครงการ'] || '').toLowerCase().includes(q);
        const objMatch = (p['วัตถุประสงค์'] || '').toLowerCase().includes(q);
        const deptMatch = (p['หน่วยงานรับผิดชอบหลัก'] || '').toLowerCase().includes(q);
        const idMatch = String(p.ID).includes(q);
        if (!nameMatch && !objMatch && !deptMatch && !idMatch) return false;
      }
      return true;
    });
  }, [projects, typeFilter, departmentFilter, projectSearch]);

  // Selected projects list and total budget calculation
  const selectedProjectsData = useMemo(() => {
    const selected = projects.filter((p) => formSelectedProjectIds.includes(p.ID));
    let total5Y = 0;
    selected.forEach((p) => {
      YEARS.forEach((yr) => {
        total5Y += Number((p as any)[`งบประมาณ ${yr}`]) || 0;
      });
    });
    return { selected, total5Y };
  }, [projects, formSelectedProjectIds]);

  const toggleProject = (id: number) => {
    setFormSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredSelectableProjects.map((p) => p.ID);
    const allSelected = filteredIds.every((id) => formSelectedProjectIds.includes(id));
    if (allSelected) {
      setFormSelectedProjectIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setFormSelectedProjectIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formNo.trim()) {
        alert('กรุณาระบุครั้งที่อนุมัติ');
        return;
      }
      if (!formDate) {
        alert('กรุณาระบุวันที่อนุมัติประกาศใช้');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ID: editingApproval ? editingApproval.ID : undefined,
      'ประเภท': formType,
      'ครั้งที่': formNo.trim(),
      'ปี พ.ศ.': formYear.trim(),
      'วันที่อนุมัติประกาศใช้': formDate,
      'วันที่มีผลบังคับใช้': formEffectiveDate || formDate,
      'เลขที่ประกาศ': formDocNo.trim(),
      'ผู้อนุมัติ': formApprover.trim() || 'นายกเทศมนตรีเมืองศิลา',
      'ผู้ลงนาม': formApprover.trim() || 'นายกเทศมนตรีเมืองศิลา',
      'สถานะการประกาศ': formStatus,
      'ProjectIDs': formSelectedProjectIds.join(','),
      'จำนวนโครงการ': formSelectedProjectIds.length
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-3 backdrop-blur-2xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header Strip with Wizard Step Indicator */}
        <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 text-white flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/90 text-white flex items-center justify-center shadow-xs">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">
                  {editingApproval ? 'แก้ไขการอนุมัติและประกาศใช้' : 'เพิ่มการอนุมัติและประกาศใช้แผนพัฒนาท้องถิ่น'}
                </h3>
                <p className="text-[11px] text-emerald-300 font-medium">
                  {ORG_NAME} (พ.ศ. 2571-2575)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              aria-label="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 3-Step Wizard Indicator */}
          <div className="grid grid-cols-3 gap-2 text-xs pt-1">
            {[
              { num: 1, title: 'ข้อมูลการอนุมัติ', desc: 'ประเภท, วันที่, ผู้อนุมัติ' },
              { num: 2, title: 'เลือกโครงการ', desc: `${formSelectedProjectIds.length} โครงการที่เลือก` },
              { num: 3, title: 'สรุปก่อนบันทึก', desc: 'ตรวจสอบและยืนยัน' }
            ].map((st) => {
              const isActive = step === st.num;
              const isPast = step > st.num;
              return (
                <div
                  key={st.num}
                  className={`flex items-center gap-2 p-2 rounded-xl border transition cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500/20 border-emerald-400/80 text-white'
                      : isPast
                      ? 'bg-white/5 border-emerald-500/40 text-emerald-200'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                  onClick={() => {
                    if (isPast) setStep(st.num as any);
                  }}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      isActive
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : isPast
                        ? 'bg-emerald-600/80 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {isPast ? <Check className="w-3.5 h-3.5" /> : st.num}
                  </div>
                  <div className="min-w-0 hidden sm:block">
                    <div className="font-bold text-[11px] truncate">{st.title}</div>
                    <div className="text-[10px] text-slate-300/80 truncate">{st.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-5 text-xs text-slate-700 space-y-4">
          {/* STEP 1: ข้อมูลการอนุมัติ */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-emerald-50/60 border border-emerald-200/80 p-3.5 rounded-xl text-emerald-900 text-xs">
                <div className="font-bold mb-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  ขั้นตอนที่ 1: กำหนดข้อมูลประกาศและการอนุมัติ
                </div>
                <div className="text-[11px] text-emerald-800">
                  ระบุประเภทแผน ครั้งที่อนุมัติ และวันที่มีผลบังคับใช้ตามระเบียบกระทรวงมหาดไทยว่าด้วยการจัดทำแผนพัฒนาของ อปท.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5 text-xs">
                    ประเภทแผน <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => {
                      const newT = e.target.value as PlanType;
                      setFormType(newT);
                      if (newT === 'ฉบับแรก') {
                        setFormNo('ฉบับแรก');
                        setFormDocNo(`ประกาศ${ORG_NAME} เรื่อง ประกาศใช้แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575)`);
                      } else {
                        setFormNo(`1/${formYear}`);
                        setFormDocNo(`ประกาศ${ORG_NAME} เรื่อง ประกาศใช้แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) ${newT} ครั้งที่ 1/${formYear}`);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition shadow-2xs"
                  >
                    {TYPE_LIST.map((t) => (
                      <option key={t} value={t}>
                        แผนพัฒนาท้องถิ่น {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1.5 text-xs">
                    ครั้งที่อนุมัติ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formNo}
                    onChange={(e) => setFormNo(e.target.value)}
                    placeholder="เช่น 1/2571 หรือ ฉบับแรก"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1.5 text-xs">
                    ปี พ.ศ. ที่อนุมัติ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formYear}
                    onChange={(e) => {
                      setFormYear(e.target.value);
                      if (formType !== 'ฉบับแรก') {
                        setFormNo(`1/${e.target.value}`);
                        setFormDocNo(`ประกาศ${ORG_NAME} เรื่อง ประกาศใช้แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) ${formType} ครั้งที่ 1/${e.target.value}`);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition shadow-2xs"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={String(y)}>
                        พ.ศ. {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5 text-xs">
                    วันที่อนุมัติประกาศใช้ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => {
                      setFormDate(e.target.value);
                      if (!formEffectiveDate) setFormEffectiveDate(e.target.value);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1.5 text-xs">
                    วันที่มีผลบังคับใช้
                  </label>
                  <input
                    type="date"
                    value={formEffectiveDate}
                    onChange={(e) => setFormEffectiveDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5 text-xs">
                  ชื่อ / เลขที่ประกาศ
                </label>
                <input
                  type="text"
                  value={formDocNo}
                  onChange={(e) => setFormDocNo(e.target.value)}
                  placeholder={`ประกาศ${ORG_NAME} เรื่อง ประกาศใช้แผนพัฒนาท้องถิ่น...`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5 text-xs">
                    ผู้อนุมัติ / ผู้ลงนาม
                  </label>
                  <input
                    type="text"
                    value={formApprover}
                    onChange={(e) => setFormApprover(e.target.value)}
                    placeholder="นายกเทศมนตรีเมืองศิลา"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1.5 text-xs">
                    สถานะการประกาศ
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition shadow-2xs"
                  >
                    <option value="อนุมัติ">อนุมัติ (ประกาศใช้แล้ว)</option>
                    <option value="ไม่อนุมัติ">ไม่อนุมัติ (ยกเลิก)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: เลือกโครงการที่จะบรรจุในชุดนี้ */}
          {step === 2 && (
            <div className="space-y-3 animate-in fade-in duration-150">
              {/* Real-time Budget & Selection Summary Header */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-900 to-slate-900 text-white flex items-center justify-between gap-3 flex-wrap shadow-xs">
                <div>
                  <div className="text-[11px] text-emerald-300 font-medium">ยอดโครงการที่เลือกบรรจุในรอบนี้</div>
                  <div className="text-base font-bold flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-emerald-400 text-lg">{formSelectedProjectIds.length}</span>
                    <span className="text-xs text-slate-300 font-normal">โครงการ</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-emerald-300 font-medium">งบประมาณรวม 5 ปี (ตามแผน)</div>
                  <div className="text-lg font-bold font-mono text-white tracking-tight">
                    ฿{formatMoney(selectedProjectsData.total5Y)}{' '}
                    <span className="text-xs text-emerald-300 font-sans font-normal">บาท</span>
                  </div>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 flex-wrap flex-1">
                  <div className="relative min-w-[180px] flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="ค้นหาชื่อโครงการ, วัตถุประสงค์..."
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1.5 focus:ring-emerald-500"
                    />
                  </div>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-1.5 focus:ring-emerald-500"
                  >
                    <option value="ทั้งหมด">ทุกประเภทแผน</option>
                    {TYPE_LIST.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>

                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-1.5 focus:ring-emerald-500"
                  >
                    <option value="ทั้งหมด">ทุกสำนัก/กอง</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition shrink-0"
                >
                  เลือกทั้งหมดในผลค้นหานี้ ({filteredSelectableProjects.length})
                </button>
              </div>

              {/* Projects Scroll List */}
              <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                {filteredSelectableProjects.length > 0 ? (
                  filteredSelectableProjects.map((p) => {
                    const isSelected = formSelectedProjectIds.includes(p.ID);
                    const totalP = YEARS.reduce(
                      (acc, yr) => acc + (Number((p as any)[`งบประมาณ ${yr}`]) || 0),
                      0
                    );

                    return (
                      <div
                        key={p.ID}
                        onClick={() => toggleProject(p.ID)}
                        className={`p-3 text-xs flex items-center justify-between gap-3 cursor-pointer transition ${
                          isSelected
                            ? 'bg-emerald-50/80 hover:bg-emerald-100/70 border-l-4 border-l-emerald-600'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleProject(p.ID)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-slate-500 text-[11px]">#{p.ID}</span>
                              <span className="font-bold text-slate-900 leading-snug">{p['ชื่อโครงการ']}</span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {p['ประเภทรายการ'] || 'ฉบับแรก'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {p['หน่วยงานรับผิดชอบหลัก']} • {p['ประเด็นการพัฒนา']}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-mono font-bold text-slate-800 text-xs">
                            ฿{formatMoney(totalP)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-sans">งบ 5 ปี</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    ไม่พบโครงการตามคำค้นหาหรือตัวกรอง
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: สรุปก่อนบันทึก */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-emerald-950 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-bold text-xs">ขั้นตอนที่ 3: ตรวจสอบความถูกต้องก่อนบันทึก</div>
                    <div className="text-[11px] text-emerald-800">
                      กรุณาตรวจสอบข้อมูลประกาศและรายชื่อโครงการที่บรรจุในรอบนี้
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-emerald-700 font-semibold">สถานะรอบประกาศ</div>
                  <div className="font-bold text-xs text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-full inline-block border border-emerald-300">
                    {formStatus}
                  </div>
                </div>
              </div>

              {/* Summary Metadata Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-normal">ประเภทแผน:</span>
                    <span className="font-bold text-slate-800">{formType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-normal">ครั้งที่ / ปี:</span>
                    <span className="font-bold text-slate-800 font-mono">{formNo} (พ.ศ. {formYear})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-normal">วันที่ประกาศใช้:</span>
                    <span className="font-bold text-slate-800 font-mono">{formDate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-normal">วันที่มีผลบังคับใช้:</span>
                    <span className="font-bold text-slate-800 font-mono">{formEffectiveDate || formDate}</span>
                  </div>
                </div>

                <div className="text-xs pt-1">
                  <span className="text-[10px] text-slate-400 block font-normal">ชื่อประกาศ:</span>
                  <span className="font-bold text-slate-800 leading-snug">{formDocNo}</span>
                </div>

                <div className="text-xs">
                  <span className="text-[10px] text-slate-400 block font-normal">ผู้อนุมัติ / ผู้ลงนาม:</span>
                  <span className="font-bold text-slate-800">{formApprover}</span>
                </div>
              </div>

              {/* Summary Projects List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    บัญชีโครงการที่เลือกบรรจุ ({selectedProjectsData.selected.length} โครงการ)
                  </div>
                  <div className="font-mono font-bold text-emerald-800 text-xs">
                    งบรวม 5 ปี: ฿{formatMoney(selectedProjectsData.total5Y)} บาท
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                  {selectedProjectsData.selected.length > 0 ? (
                    selectedProjectsData.selected.map((p, idx) => {
                      const totalP = YEARS.reduce(
                        (acc, yr) => acc + (Number((p as any)[`งบประมาณ ${yr}`]) || 0),
                        0
                      );
                      return (
                        <div key={p.ID} className="p-2.5 text-xs flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-slate-400 text-[11px] w-5 text-center shrink-0">
                              {idx + 1}.
                            </span>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-800 truncate block">
                                {p['ชื่อโครงการ']}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {p['หน่วยงานรับผิดชอบหลัก']}
                              </span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-slate-700 text-xs shrink-0">
                            ฿{formatMoney(totalP)}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-amber-600 text-xs bg-amber-50/50">
                      ยังไม่ได้เลือกโครงการสำหรับบรรจุในรอบประกาศนี้
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls with Back / Next / Submit */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs shadow-2xs transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>ย้อนกลับ</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-semibold text-xs transition"
            >
              ยกเลิก
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-xs shadow-xs transition"
              >
                <span>ถัดไป</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-md transition"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกและประกาศใช้</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
