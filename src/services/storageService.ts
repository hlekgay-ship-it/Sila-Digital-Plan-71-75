import {
  Project,
  ProjectRevision,
  ProjectSnapshot,
  PlanApproval,
  BudgetApproval,
  UserItem,
  OptionsData,
  SearchCriteria,
  Report01Data,
  Report02Data,
  DashboardData,
  PlanType,
  ProjectStatus,
  TrackingLog,
  ProjectTrackingItem
} from '../types';
import {
  INITIAL_PROJECTS,
  INITIAL_APPROVALS,
  INITIAL_BUDGET_APPROVALS,
  INITIAL_USERS,
  INITIAL_OPTIONS,
  INITIAL_PROJECT_TRACKINGS,
  ORG_NAME,
  YEARS,
  STATUS_LIST,
  STANDARD_STRATEGIC_ISSUES,
  STANDARD_DEPARTMENTS,
  sortStrategicIssues
} from '../data/initialData';

const KEY_PROJECTS = 'sila_plan_projects_v3';
const KEY_APPROVALS = 'sila_plan_approvals_v3';
const KEY_BUDGET_APPROVALS = 'sila_plan_budget_approvals_v3';
const KEY_USERS = 'sila_plan_users_v3';
const KEY_OPTIONS = 'sila_plan_options_v3';
const KEY_TRACKING_LOGS = 'sila_plan_tracking_logs_v3';
const KEY_PROJECT_TRACKINGS = 'sila_plan_project_trackings_v3';

const INITIAL_TRACKING_LOGS: TrackingLog[] = [
  {
    ID: 1,
    ProjectID: 1,
    projectName: 'โครงการก่อสร้างถนน คสล. พร้อมวางท่อระบายน้ำ ซอยศิลา 12',
    department: 'กองช่าง',
    reportDate: '15/01/2571',
    milestone: 'ส่งมอบงานงวดที่ 1: วางท่อระบายน้ำ คสล. ขนาด 0.60 ม. ความยาว 500 เมตร',
    progressPct: 40,
    disbursedAmount: 600000,
    issues: 'มีฝนตกชุกทำให้งานขุดดินวางท่อชะลอตัวเล็กน้อย',
    solutions: 'เร่งเพิ่มจำนวนเครื่องจักรและคนงานเพื่อชดเชยเวลาที่ล่าช้า',
    reporterName: 'นายช่างโยธาชำนาญงาน (กองช่าง)',
    attachmentUrl: 'https://drive.google.com/drive/folders/example_sila_road12',
    createdAt: '15/01/2571 14:30'
  },
  {
    ID: 2,
    ProjectID: 1,
    projectName: 'โครงการก่อสร้างถนน คสล. พร้อมวางท่อระบายน้ำ ซอยศิลา 12',
    department: 'กองช่าง',
    reportDate: '28/02/2571',
    milestone: 'ส่งมอบงานงวดที่ 2 (งวดสุดท้าย): เทผิวจราจร คสล. แล้วเสร็จ พร้อมตรวจรับพัสดุ',
    progressPct: 100,
    disbursedAmount: 900000,
    issues: '-',
    solutions: '-',
    reporterName: 'นายช่างโยธาชำนาญงาน (กองช่าง)',
    attachmentUrl: 'https://drive.google.com/drive/folders/example_sila_road12_final',
    createdAt: '28/02/2571 16:00'
  },
  {
    ID: 3,
    ProjectID: 3,
    projectName: 'โครงการพัฒนาระบบข้อมูลดิจิทัลและแอปพลิเคชันบริการประชาชน (Smart Sila)',
    department: 'กองยุทธศาสตร์และงบประมาณ',
    reportDate: '20/03/2571',
    milestone: 'ส่งมอบงานงวดที่ 1: ออกแบบระบบฐานข้อมูลและเชื่อมโยง API ท้องถิ่น',
    progressPct: 50,
    disbursedAmount: 400000,
    issues: '-',
    solutions: '-',
    reporterName: 'นักวิชาการคอมพิวเตอร์ (กองยุทธศาสตร์ฯ)',
    attachmentUrl: '',
    createdAt: '20/03/2571 11:15'
  }
];

function getStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading localStorage key ' + key, e);
    return fallback;
  }
}

function setStored<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Error writing localStorage key ' + key, e);
  }
}

export function formatDateNow(): string {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear() + 543; // Thai BE year
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function computeSnapshotDiff(before?: Partial<ProjectSnapshot>, after?: Partial<ProjectSnapshot>): string[] {
  if (!before && !after) return [];
  if (!before && after) return ['สร้างรายการใหม่'];
  if (before && !after) return ['ยกเลิกรายการ'];

  const diffs: string[] = [];
  const b = before!;
  const a = after!;

  if (b['ชื่อโครงการ'] && a['ชื่อโครงการ'] && b['ชื่อโครงการ'].trim() !== a['ชื่อโครงการ'].trim()) {
    diffs.push(`เปลี่ยนชื่อโครงการจาก "${b['ชื่อโครงการ']}" เป็น "${a['ชื่อโครงการ']}"`);
  }

  if (b['วัตถุประสงค์'] && a['วัตถุประสงค์'] && b['วัตถุประสงค์'].trim() !== a['วัตถุประสงค์'].trim()) {
    diffs.push(`แก้ไขวัตถุประสงค์`);
  }

  if (b['เป้าหมาย (ผลผลิต)'] && a['เป้าหมาย (ผลผลิต)'] && b['เป้าหมาย (ผลผลิต)'].trim() !== a['เป้าหมาย (ผลผลิต)'].trim()) {
    diffs.push(`แก้ไขเป้าหมาย (ผลผลิต) เป็น "${a['เป้าหมาย (ผลผลิต)']}"`);
  }

  // Budget differences by year
  YEARS.forEach((y) => {
    const key = `งบประมาณ ${y}` as keyof ProjectSnapshot;
    const valB = Number(b[key]) || 0;
    const valA = Number(a[key]) || 0;
    if (valB !== valA) {
      const diff = valA - valB;
      const diffFormatted = Math.abs(diff).toLocaleString('th-TH');
      if (diff > 0) {
        diffs.push(`งบประมาณปี ${y}: เพิ่มขึ้น ${diffFormatted} บาท (จาก ${valB.toLocaleString('th-TH')} เป็น ${valA.toLocaleString('th-TH')} บาท)`);
      } else {
        diffs.push(`งบประมาณปี ${y}: ปรับลด ${diffFormatted} บาท (จาก ${valB.toLocaleString('th-TH')} เป็น ${valA.toLocaleString('th-TH')} บาท)`);
      }
    }
  });

  if (b['ผลที่คาดว่าจะได้รับ'] && a['ผลที่คาดว่าจะได้รับ'] && b['ผลที่คาดว่าจะได้รับ'].trim() !== a['ผลที่คาดว่าจะได้รับ'].trim()) {
    diffs.push(`แก้ไขผลที่คาดว่าจะได้รับ`);
  }

  if (b['หน่วยงานรับผิดชอบหลัก'] && a['หน่วยงานรับผิดชอบหลัก'] && b['หน่วยงานรับผิดชอบหลัก'].trim() !== a['หน่วยงานรับผิดชอบหลัก'].trim()) {
    diffs.push(`เปลี่ยนหน่วยงานรับผิดชอบจาก "${b['หน่วยงานรับผิดชอบหลัก']}" เป็น "${a['หน่วยงานรับผิดชอบหลัก']}"`);
  }

  return diffs.length > 0 ? diffs : ['ไม่มีการเปลี่ยนแปลงรายละเอียด'];
}

export const StorageService = {
  // === OPTIONS ===
  getOptions(): OptionsData {
    const raw = getStored<OptionsData>(KEY_OPTIONS, INITIAL_OPTIONS);
    const issues = raw['ประเด็นการพัฒนา'] || STANDARD_STRATEGIC_ISSUES;
    const combinedIssues = Array.from(new Set([...STANDARD_STRATEGIC_ISSUES, ...issues]));
    raw['ประเด็นการพัฒนา'] = sortStrategicIssues(combinedIssues);

    const depts = raw['หน่วยงานรับผิดชอบหลัก'] || STANDARD_DEPARTMENTS;
    const combinedDepts = Array.from(new Set([...STANDARD_DEPARTMENTS, ...depts]));
    raw['หน่วยงานรับผิดชอบหลัก'] = combinedDepts;
    return raw;
  },

  addOption(category: string, value: string): OptionsData {
    if (!category || !value.trim()) return this.getOptions();
    const options = this.getOptions();
    const cleanVal = value.trim();
    if (!options[category]) {
      options[category] = [];
    }
    if (!options[category].includes(cleanVal)) {
      options[category].push(cleanVal);
      setStored(KEY_OPTIONS, options);
    }
    return options;
  },

  // === PROJECTS ===
  getProjects(year?: string | number): Project[] {
    let list = getStored<Project[]>(KEY_PROJECTS, INITIAL_PROJECTS);
    if (year) {
      list = list.filter((p) => String(p['ปี พ.ศ.']) === String(year));
    }
    return list.map((p) => this.normalizeProject(p)).sort((a, b) => b.ID - a.ID);
  },

  normalizeProject(p: Project): Project {
    if (!p.revisions || p.revisions.length === 0) {
      // Auto build baseline revision for backward compatibility
      const baseRev: ProjectRevision = {
        revisionId: `rev-${p.ID}-1`,
        revisionType: (p['ประเภทรายการ'] || 'ฉบับแรก') as PlanType,
        revisionNo: p['ประเภทรายการ'] === 'ฉบับแรก' ? 'ฉบับแรก' : `${p['ประเภทรายการ']} ครั้งที่ 1/${p['ปี พ.ศ.'] || 2571}`,
        fiscalYear: p['ปี พ.ศ.'] || 2571,
        approvalDate: p['วันที่บันทึก']?.split(' ')[0] || '15/10/2570',
        approvalDocNo: 'ประกาศใช้แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575)',
        reason: p['เหตุผลและความจำเป็น'] || 'จัดทำแผนพัฒนาท้องถิ่น 5 ปี ตามระเบียบกระทรวงมหาดไทยฯ',
        createdAt: p['วันที่บันทึก'] || formatDateNow(),
        author: p['หน่วยงานรับผิดชอบหลัก'] || 'เจ้าหน้าที่วิเคราะห์นโยบายและแผน',
        data: {
          'ชื่อโครงการ': p['ชื่อโครงการ'],
          'วัตถุประสงค์': p['วัตถุประสงค์'],
          'เป้าหมาย (ผลผลิต)': p['เป้าหมาย (ผลผลิต)'],
          'งบประมาณ 2571': Number(p['งบประมาณ 2571']) || 0,
          'งบประมาณ 2572': Number(p['งบประมาณ 2572']) || 0,
          'งบประมาณ 2573': Number(p['งบประมาณ 2573']) || 0,
          'งบประมาณ 2574': Number(p['งบประมาณ 2574']) || 0,
          'งบประมาณ 2575': Number(p['งบประมาณ 2575']) || 0,
          'ผลที่คาดว่าจะได้รับ': p['ผลที่คาดว่าจะได้รับ'],
          'หน่วยงานรับผิดชอบหลัก': p['หน่วยงานรับผิดชอบหลัก'],
          'เหตุผลและความจำเป็น': p['เหตุผลและความจำเป็น'],
          'ประเด็นการพัฒนา': p['ประเด็นการพัฒนา'],
          'แผนงาน': p['แผนงาน'],
          'สถานะดำเนินงาน': p['สถานะดำเนินงาน']
        },
        previousData: p['ชื่อโครงการ (เดิม)']
          ? {
              'ชื่อโครงการ': p['ชื่อโครงการ (เดิม)'] || '',
              'วัตถุประสงค์': p['วัตถุประสงค์ (เดิม)'] || '',
              'เป้าหมาย (ผลผลิต)': p['เป้าหมาย (เดิม)'] || '',
              'งบประมาณ 2571': Number(p['งบประมาณ 2571 (เดิม)']) || 0,
              'งบประมาณ 2572': Number(p['งบประมาณ 2572 (เดิม)']) || 0,
              'งบประมาณ 2573': Number(p['งบประมาณ 2573 (เดิม)']) || 0,
              'งบประมาณ 2574': Number(p['งบประมาณ 2574 (เดิม)']) || 0,
              'งบประมาณ 2575': Number(p['งบประมาณ 2575 (เดิม)']) || 0,
              'ผลที่คาดว่าจะได้รับ': p['ผลที่คาดว่าจะได้รับ (เดิม)'] || '',
              'หน่วยงานรับผิดชอบหลัก': p['หน่วยงานรับผิดชอบหลัก (เดิม)'] || '',
              'เหตุผลและความจำเป็น': ''
            }
          : undefined,
        changeSummary: p['ประเภทรายการ'] === 'ฉบับแรก'
          ? ['บรรจุในแผนพัฒนาท้องถิ่นฉบับแรก (ตั้งต้น)']
          : ['ปรับปรุงรายละเอียดและงบประมาณตามระเบียบแผนพัฒนาท้องถิ่น']
      };

      p.revisions = [baseRev];
      p.revisionCount = 1;
      p.currentRevisionNo = baseRev.revisionNo;
    }
    return p;
  },

  getProjectsByType(type: PlanType): Project[] {
    const list = this.getProjects();
    const filtered = list.filter((p) => (p['ประเภทรายการ'] || 'ฉบับแรก') === type);
    return filtered.sort((a, b) => b.ID - a.ID);
  },

  getProjectById(id: number): Project | undefined {
    const list = this.getProjects();
    return list.find((p) => p.ID === id);
  },

  saveProject(data: Partial<Project>): { status: 'created' | 'updated'; id: number } {
    const list = getStored<Project[]>(KEY_PROJECTS, INITIAL_PROJECTS);
    const now = formatDateNow();

    if (data.ID) {
      // update
      const index = list.findIndex((p) => p.ID === data.ID);
      if (index === -1) throw new Error('ไม่พบข้อมูลโครงการที่ระบุ');

      const existing = this.normalizeProject(list[index]);
      const revisions = existing.revisions ? [...existing.revisions] : [];

      const currentSnapshot: ProjectSnapshot = {
        'ชื่อโครงการ': data['ชื่อโครงการ'] ?? existing['ชื่อโครงการ'],
        'วัตถุประสงค์': data['วัตถุประสงค์'] ?? existing['วัตถุประสงค์'],
        'เป้าหมาย (ผลผลิต)': data['เป้าหมาย (ผลผลิต)'] ?? existing['เป้าหมาย (ผลผลิต)'],
        'งบประมาณ 2571': Number(data['งบประมาณ 2571'] ?? existing['งบประมาณ 2571']) || 0,
        'งบประมาณ 2572': Number(data['งบประมาณ 2572'] ?? existing['งบประมาณ 2572']) || 0,
        'งบประมาณ 2573': Number(data['งบประมาณ 2573'] ?? existing['งบประมาณ 2573']) || 0,
        'งบประมาณ 2574': Number(data['งบประมาณ 2574'] ?? existing['งบประมาณ 2574']) || 0,
        'งบประมาณ 2575': Number(data['งบประมาณ 2575'] ?? existing['งบประมาณ 2575']) || 0,
        'ผลที่คาดว่าจะได้รับ': data['ผลที่คาดว่าจะได้รับ'] ?? existing['ผลที่คาดว่าจะได้รับ'],
        'หน่วยงานรับผิดชอบหลัก': data['หน่วยงานรับผิดชอบหลัก'] ?? existing['หน่วยงานรับผิดชอบหลัก'],
        'เหตุผลและความจำเป็น': data['เหตุผลและความจำเป็น'] ?? existing['เหตุผลและความจำเป็น'],
        'ประเด็นการพัฒนา': data['ประเด็นการพัฒนา'] ?? existing['ประเด็นการพัฒนา'],
        'แผนงาน': data['แผนงาน'] ?? existing['แผนงาน'],
        'สถานะดำเนินงาน': (data['สถานะดำเนินงาน'] ?? existing['สถานะดำเนินงาน']) as ProjectStatus
      };

      const lastRev = revisions[revisions.length - 1];
      const diffs = computeSnapshotDiff(lastRev?.data, currentSnapshot);

      // If user is explicitly logging a revision or changed plan type, record it into revisions
      const targetType = (data['ประเภทรายการ'] || existing['ประเภทรายการ']) as PlanType;
      const revisionNo = data.currentRevisionNo || `${targetType} ครั้งที่ ${revisions.length}/${data['ปี พ.ศ.'] || existing['ปี พ.ศ.'] || 2571}`;

      if (data['ประเภทรายการ'] && data['ประเภทรายการ'] !== 'ฉบับแรก' && data['ประเภทรายการ'] !== existing['ประเภทรายการ']) {
        const newRev: ProjectRevision = {
          revisionId: `rev-${existing.ID}-${revisions.length + 1}`,
          revisionType: targetType,
          revisionNo: revisionNo,
          fiscalYear: data['ปี พ.ศ.'] || existing['ปี พ.ศ.'] || 2571,
          approvalDate: now.split(' ')[0],
          approvalDocNo: `มติ/คำสั่ง ${revisionNo}`,
          reason: data['เหตุผลและความจำเป็น'] || 'บันทึกการปรับปรุงข้อมูลโครงการ',
          createdAt: now,
          author: data['หน่วยงานรับผิดชอบหลัก'] || existing['หน่วยงานรับผิดชอบหลัก'] || 'ผู้ดูแลระบบ',
          data: currentSnapshot,
          previousData: lastRev ? lastRev.data : undefined,
          changeSummary: diffs
        };
        revisions.push(newRev);
      } else if (revisions.length > 0) {
        // Update the active snapshot of latest revision
        revisions[revisions.length - 1] = {
          ...revisions[revisions.length - 1],
          data: currentSnapshot,
          changeSummary: diffs
        };
      }

      const updated: Project = {
        ...existing,
        ...data,
        ID: existing.ID,
        revisions: revisions,
        revisionCount: revisions.length,
        currentRevisionNo: revisionNo,
        'วันที่บันทึก': existing['วันที่บันทึก'] || now,
        'วันที่แก้ไขล่าสุด': now
      } as Project;

      list[index] = updated;
      setStored(KEY_PROJECTS, list);
      return { status: 'updated', id: data.ID };
    } else {
      // create
      const maxId = list.length > 0 ? Math.max(...list.map((p) => p.ID)) : 0;
      const newId = maxId + 1;
      const planType = (data['ประเภทรายการ'] as PlanType) || 'ฉบับแรก';
      const year = data['ปี พ.ศ.'] || 2571;

      const initialSnapshot: ProjectSnapshot = {
        'ชื่อโครงการ': data['ชื่อโครงการ'] || '',
        'วัตถุประสงค์': data['วัตถุประสงค์'] || '',
        'เป้าหมาย (ผลผลิต)': data['เป้าหมาย (ผลผลิต)'] || '',
        'งบประมาณ 2571': Number(data['งบประมาณ 2571']) || 0,
        'งบประมาณ 2572': Number(data['งบประมาณ 2572']) || 0,
        'งบประมาณ 2573': Number(data['งบประมาณ 2573']) || 0,
        'งบประมาณ 2574': Number(data['งบประมาณ 2574']) || 0,
        'งบประมาณ 2575': Number(data['งบประมาณ 2575']) || 0,
        'ผลที่คาดว่าจะได้รับ': data['ผลที่คาดว่าจะได้รับ'] || '',
        'หน่วยงานรับผิดชอบหลัก': data['หน่วยงานรับผิดชอบหลัก'] || '',
        'เหตุผลและความจำเป็น': data['เหตุผลและความจำเป็น'] || '',
        'ประเด็นการพัฒนา': data['ประเด็นการพัฒนา'] || '',
        'แผนงาน': data['แผนงาน'] || '',
        'สถานะดำเนินงาน': (data['สถานะดำเนินงาน'] as ProjectStatus) || 'ยังไม่ได้ดำเนินการ'
      };

      const previousSnapshot: ProjectSnapshot | undefined = data['ชื่อโครงการ (เดิม)']
        ? {
            'ชื่อโครงการ': data['ชื่อโครงการ (เดิม)'] || '',
            'วัตถุประสงค์': data['วัตถุประสงค์ (เดิม)'] || '',
            'เป้าหมาย (ผลผลิต)': data['เป้าหมาย (เดิม)'] || '',
            'งบประมาณ 2571': Number(data['งบประมาณ 2571 (เดิม)']) || 0,
            'งบประมาณ 2572': Number(data['งบประมาณ 2572 (เดิม)']) || 0,
            'งบประมาณ 2573': Number(data['งบประมาณ 2573 (เดิม)']) || 0,
            'งบประมาณ 2574': Number(data['งบประมาณ 2574 (เดิม)']) || 0,
            'งบประมาณ 2575': Number(data['งบประมาณ 2575 (เดิม)']) || 0,
            'ผลที่คาดว่าจะได้รับ': data['ผลที่คาดว่าจะได้รับ (เดิม)'] || '',
            'หน่วยงานรับผิดชอบหลัก': data['หน่วยงานรับผิดชอบหลัก (เดิม)'] || '',
            'เหตุผลและความจำเป็น': ''
          }
        : undefined;

      const firstRevision: ProjectRevision = {
        revisionId: `rev-${newId}-1`,
        revisionType: planType,
        revisionNo: planType === 'ฉบับแรก' ? 'ฉบับแรก' : `${planType} ครั้งที่ 1/${year}`,
        fiscalYear: year,
        approvalDate: now.split(' ')[0],
        approvalDocNo: planType === 'ฉบับแรก' ? 'ประกาศใช้แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575)' : `มติ/คำสั่ง ${planType} ครั้งที่ 1/${year}`,
        reason: data['เหตุผลและความจำเป็น'] || 'บรรจุในแผนพัฒนาท้องถิ่น',
        createdAt: now,
        author: data['หน่วยงานรับผิดชอบหลัก'] || 'เจ้าหน้าที่วิเคราะห์นโยบายและแผน',
        data: initialSnapshot,
        previousData: previousSnapshot,
        changeSummary: planType === 'ฉบับแรก' ? ['บรรจุในแผนพัฒนาท้องถิ่นฉบับแรก (ตั้งต้น)'] : computeSnapshotDiff(previousSnapshot, initialSnapshot)
      };

      const newProject: Project = {
        ID: newId,
        'ปี พ.ศ.': year,
        'ประเด็นการพัฒนา': data['ประเด็นการพัฒนา'] || '',
        'แผนงาน': data['แผนงาน'] || '',
        'ชื่อโครงการ': data['ชื่อโครงการ'] || '',
        'วัตถุประสงค์': data['วัตถุประสงค์'] || '',
        'เป้าหมาย (ผลผลิต)': data['เป้าหมาย (ผลผลิต)'] || '',
        'งบประมาณ 2571': Number(data['งบประมาณ 2571']) || 0,
        'งบประมาณ 2572': Number(data['งบประมาณ 2572']) || 0,
        'งบประมาณ 2573': Number(data['งบประมาณ 2573']) || 0,
        'งบประมาณ 2574': Number(data['งบประมาณ 2574']) || 0,
        'งบประมาณ 2575': Number(data['งบประมาณ 2575']) || 0,
        'ผลที่คาดว่าจะได้รับ': data['ผลที่คาดว่าจะได้รับ'] || '',
        'หน่วยงานรับผิดชอบหลัก': data['หน่วยงานรับผิดชอบหลัก'] || '',
        'ประเภทรายการ': planType,
        'สถานะดำเนินงาน': (data['สถานะดำเนินงาน'] as ProjectStatus) || 'ยังไม่ได้ดำเนินการ',
        'เหตุผลและความจำเป็น': data['เหตุผลและความจำเป็น'] || '',
        // old fields
        'ชื่อโครงการ (เดิม)': data['ชื่อโครงการ (เดิม)'],
        'วัตถุประสงค์ (เดิม)': data['วัตถุประสงค์ (เดิม)'],
        'เป้าหมาย (เดิม)': data['เป้าหมาย (เดิม)'],
        'งบประมาณ 2571 (เดิม)': Number(data['งบประมาณ 2571 (เดิม)']) || 0,
        'งบประมาณ 2572 (เดิม)': Number(data['งบประมาณ 2572 (เดิม)']) || 0,
        'งบประมาณ 2573 (เดิม)': Number(data['งบประมาณ 2573 (เดิม)']) || 0,
        'งบประมาณ 2574 (เดิม)': Number(data['งบประมาณ 2574 (เดิม)']) || 0,
        'งบประมาณ 2575 (เดิม)': Number(data['งบประมาณ 2575 (เดิม)']) || 0,
        'ผลที่คาดว่าจะได้รับ (เดิม)': data['ผลที่คาดว่าจะได้รับ (เดิม)'],
        'หน่วยงานรับผิดชอบหลัก (เดิม)': data['หน่วยงานรับผิดชอบหลัก (เดิม)'],
        'revisions': [firstRevision],
        'revisionCount': 1,
        'currentRevisionNo': firstRevision.revisionNo,
        'วันที่บันทึก': now,
        'วันที่แก้ไขล่าสุด': now
      };

      list.unshift(newProject);
      setStored(KEY_PROJECTS, list);
      return { status: 'created', id: newId };
    }
  },

  addProjectRevision(
    projectId: number,
    revisionMeta: {
      revisionType: PlanType;
      revisionNo: string;
      fiscalYear: number | string;
      approvalDate: string;
      approvalDocNo: string;
      reason: string;
      author?: string;
      newData: Partial<ProjectSnapshot>;
    }
  ): { status: 'success'; project: Project } {
    const list = getStored<Project[]>(KEY_PROJECTS, INITIAL_PROJECTS);
    const index = list.findIndex((p) => p.ID === projectId);
    if (index === -1) throw new Error('ไม่พบข้อมูลโครงการ');

    const project = this.normalizeProject(list[index]);
    const revisions = project.revisions ? [...project.revisions] : [];
    const lastRev = revisions[revisions.length - 1];

    const newSnapshot: ProjectSnapshot = {
      'ชื่อโครงการ': revisionMeta.newData['ชื่อโครงการ'] ?? project['ชื่อโครงการ'],
      'วัตถุประสงค์': revisionMeta.newData['วัตถุประสงค์'] ?? project['วัตถุประสงค์'],
      'เป้าหมาย (ผลผลิต)': revisionMeta.newData['เป้าหมาย (ผลผลิต)'] ?? project['เป้าหมาย (ผลผลิต)'],
      'งบประมาณ 2571': Number(revisionMeta.newData['งบประมาณ 2571'] ?? project['งบประมาณ 2571']) || 0,
      'งบประมาณ 2572': Number(revisionMeta.newData['งบประมาณ 2572'] ?? project['งบประมาณ 2572']) || 0,
      'งบประมาณ 2573': Number(revisionMeta.newData['งบประมาณ 2573'] ?? project['งบประมาณ 2573']) || 0,
      'งบประมาณ 2574': Number(revisionMeta.newData['งบประมาณ 2574'] ?? project['งบประมาณ 2574']) || 0,
      'งบประมาณ 2575': Number(revisionMeta.newData['งบประมาณ 2575'] ?? project['งบประมาณ 2575']) || 0,
      'ผลที่คาดว่าจะได้รับ': revisionMeta.newData['ผลที่คาดว่าจะได้รับ'] ?? project['ผลที่คาดว่าจะได้รับ'],
      'หน่วยงานรับผิดชอบหลัก': revisionMeta.newData['หน่วยงานรับผิดชอบหลัก'] ?? project['หน่วยงานรับผิดชอบหลัก'],
      'เหตุผลและความจำเป็น': revisionMeta.reason || project['เหตุผลและความจำเป็น'],
      'ประเด็นการพัฒนา': revisionMeta.newData['ประเด็นการพัฒนา'] ?? project['ประเด็นการพัฒนา'],
      'แผนงาน': revisionMeta.newData['แผนงาน'] ?? project['แผนงาน'],
      'สถานะดำเนินงาน': (revisionMeta.newData['สถานะดำเนินงาน'] ?? project['สถานะดำเนินงาน']) as ProjectStatus
    };

    const diffs = computeSnapshotDiff(lastRev?.data, newSnapshot);
    const now = formatDateNow();

    const newRevision: ProjectRevision = {
      revisionId: `rev-${project.ID}-${revisions.length + 1}`,
      revisionType: revisionMeta.revisionType,
      revisionNo: revisionMeta.revisionNo,
      fiscalYear: Number(revisionMeta.fiscalYear) || 2571,
      approvalDate: revisionMeta.approvalDate || now.split(' ')[0],
      approvalDocNo: revisionMeta.approvalDocNo || `มติ/คำสั่ง ${revisionMeta.revisionNo}`,
      reason: revisionMeta.reason,
      createdAt: now,
      author: revisionMeta.author || project['หน่วยงานรับผิดชอบหลัก'] || 'เจ้าหน้าที่วิเคราะห์นโยบายและแผน',
      data: newSnapshot,
      previousData: lastRev ? lastRev.data : undefined,
      changeSummary: diffs
    };

    revisions.push(newRevision);

    const updatedProject: Project = {
      ...project,
      'ชื่อโครงการ': newSnapshot['ชื่อโครงการ'],
      'วัตถุประสงค์': newSnapshot['วัตถุประสงค์'],
      'เป้าหมาย (ผลผลิต)': newSnapshot['เป้าหมาย (ผลผลิต)'],
      'งบประมาณ 2571': newSnapshot['งบประมาณ 2571'],
      'งบประมาณ 2572': newSnapshot['งบประมาณ 2572'],
      'งบประมาณ 2573': newSnapshot['งบประมาณ 2573'],
      'งบประมาณ 2574': newSnapshot['งบประมาณ 2574'],
      'งบประมาณ 2575': newSnapshot['งบประมาณ 2575'],
      'ผลที่คาดว่าจะได้รับ': newSnapshot['ผลที่คาดว่าจะได้รับ'],
      'หน่วยงานรับผิดชอบหลัก': newSnapshot['หน่วยงานรับผิดชอบหลัก'],
      'ประเภทรายการ': revisionMeta.revisionType,
      'เหตุผลและความจำเป็น': revisionMeta.reason,
      // Record previous data for legacy compatibility
      'ชื่อโครงการ (เดิม)': lastRev?.data['ชื่อโครงการ'],
      'วัตถุประสงค์ (เดิม)': lastRev?.data['วัตถุประสงค์'],
      'เป้าหมาย (เดิม)': lastRev?.data['เป้าหมาย (ผลผลิต)'],
      'งบประมาณ 2571 (เดิม)': lastRev?.data['งบประมาณ 2571'],
      'งบประมาณ 2572 (เดิม)': lastRev?.data['งบประมาณ 2572'],
      'งบประมาณ 2573 (เดิม)': lastRev?.data['งบประมาณ 2573'],
      'งบประมาณ 2574 (เดิม)': lastRev?.data['งบประมาณ 2574'],
      'งบประมาณ 2575 (เดิม)': lastRev?.data['งบประมาณ 2575'],
      'ผลที่คาดว่าจะได้รับ (เดิม)': lastRev?.data['ผลที่คาดว่าจะได้รับ'],
      'หน่วยงานรับผิดชอบหลัก (เดิม)': lastRev?.data['หน่วยงานรับผิดชอบหลัก'],
      'revisions': revisions,
      'revisionCount': revisions.length,
      'currentRevisionNo': revisionMeta.revisionNo,
      'วันที่แก้ไขล่าสุด': now
    };

    list[index] = updatedProject;
    setStored(KEY_PROJECTS, list);
    return { status: 'success', project: updatedProject };
  },

  deleteProject(id: number): { status: 'deleted'; id: number } {
    let list = getStored<Project[]>(KEY_PROJECTS, INITIAL_PROJECTS);
    const index = list.findIndex((p) => p.ID === id);
    if (index === -1) throw new Error('ไม่พบข้อมูลโครงการที่ต้องการลบ');
    list = list.filter((p) => p.ID !== id);
    setStored(KEY_PROJECTS, list);
    return { status: 'deleted', id };
  },

  // === APPROVALS ===
  getApprovals(): PlanApproval[] {
    const list = getStored<PlanApproval[]>(KEY_APPROVALS, INITIAL_APPROVALS);
    return list.sort((a, b) => b.ID - a.ID);
  },

  saveApproval(data: Partial<PlanApproval>): { status: 'created' | 'updated'; id: number } {
    const list = getStored<PlanApproval[]>(KEY_APPROVALS, INITIAL_APPROVALS);
    const now = formatDateNow();

    const projectIdsStr = Array.isArray(data.ProjectIDs)
      ? data.ProjectIDs.join(',')
      : data.ProjectIDs || '';

    const pIds = projectIdsStr.split(',').filter(Boolean).map((s) => Number(s.trim()));
    const allProjects = this.getProjects();
    const linkedProjects = allProjects.filter((p) => pIds.includes(p.ID));

    let total5Years = 0;
    linkedProjects.forEach((p) => {
      total5Years += (Number(p['งบประมาณ 2571']) || 0) +
                     (Number(p['งบประมาณ 2572']) || 0) +
                     (Number(p['งบประมาณ 2573']) || 0) +
                     (Number(p['งบประมาณ 2574']) || 0) +
                     (Number(p['งบประมาณ 2575']) || 0);
    });

    if (data.ID) {
      // update
      const index = list.findIndex((a) => a.ID === data.ID);
      if (index === -1) throw new Error('ไม่พบข้อมูลรายการอนุมัติที่ระบุ');

      const existing = list[index];
      const updated: PlanApproval = {
        ...existing,
        ...data,
        ID: existing.ID,
        'ประเภท': data['ประเภท'] || existing['ประเภท'],
        'ครั้งที่': data['ครั้งที่'] || existing['ครั้งที่'],
        'ปี พ.ศ.': String(data['ปี พ.ศ.'] || existing['ปี พ.ศ.']),
        'วันที่อนุมัติประกาศใช้': data['วันที่อนุมัติประกาศใช้'] || existing['วันที่อนุมัติประกาศใช้'],
        'วันที่มีผลบังคับใช้': data['วันที่มีผลบังคับใช้'] || existing['วันที่มีผลบังคับใช้'],
        'เลขที่ประกาศ': data['เลขที่ประกาศ'] || existing['เลขที่ประกาศ'],
        'ผู้อนุมัติ': data['ผู้อนุมัติ'] || existing['ผู้อนุมัติ'],
        'ผู้ลงนาม': data['ผู้ลงนาม'] || existing['ผู้ลงนาม'],
        'สถานะการประกาศ': data['สถานะการประกาศ'] || existing['สถานะการประกาศ'] || 'ประกาศใช้แล้ว',
        'ProjectIDs': projectIdsStr,
        'จำนวนโครงการ': linkedProjects.length,
        'งบประมาณรวม': total5Years,
        'บันทึกเพิ่มเติม': data['บันทึกเพิ่มเติม'] !== undefined ? data['บันทึกเพิ่มเติม'] : existing['บันทึกเพิ่มเติม'],
        'เหตุผลความจำเป็น': data['เหตุผลความจำเป็น'] !== undefined ? data['เหตุผลความจำเป็น'] : existing['เหตุผลความจำเป็น']
      };

      list[index] = updated;
      setStored(KEY_APPROVALS, list);
      return { status: 'updated', id: existing.ID };
    } else {
      // create
      const maxId = list.length > 0 ? Math.max(...list.map((a) => a.ID)) : 0;
      const newId = maxId + 1;

      const newApproval: PlanApproval = {
        ID: newId,
        'ประเภท': data['ประเภท'] || 'เพิ่มเติม',
        'ครั้งที่': data['ครั้งที่'] || '1/2571',
        'ปี พ.ศ.': String(data['ปี พ.ศ.'] || 2571),
        'วันที่อนุมัติประกาศใช้': data['วันที่อนุมัติประกาศใช้'] || '',
        'วันที่มีผลบังคับใช้': data['วันที่มีผลบังคับใช้'] || data['วันที่อนุมัติประกาศใช้'] || '',
        'เลขที่ประกาศ': data['เลขที่ประกาศ'] || `ประกาศเทศบาลเมืองศิลา เรื่อง ประกาศใช้แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) ${data['ประเภท'] || 'เพิ่มเติม'} ครั้งที่ ${data['ครั้งที่'] || '1/2571'}`,
        'ผู้อนุมัติ': data['ผู้อนุมัติ'] || (data['ประเภท'] === 'แก้ไข' ? 'ผู้บริหารท้องถิ่น (นายกเทศมนตรี)' : 'สภาท้องถิ่น (สภาเทศบาล)'),
        'ผู้ลงนาม': data['ผู้ลงนาม'] || 'นายกเทศมนตรีเมืองศิลา',
        'สถานะการประกาศ': data['สถานะการประกาศ'] || 'ประกาศใช้แล้ว',
        'ProjectIDs': projectIdsStr,
        'จำนวนโครงการ': linkedProjects.length,
        'งบประมาณรวม': total5Years,
        'บันทึกเพิ่มเติม': data['บันทึกเพิ่มเติม'] || '',
        'เหตุผลความจำเป็น': data['เหตุผลความจำเป็น'] || '',
        'วันที่บันทึก': now
      };

      list.unshift(newApproval);
      setStored(KEY_APPROVALS, list);
      return { status: 'created', id: newId };
    }
  },

  deleteApproval(id: number): { status: 'deleted'; id: number } {
    let list = getStored<PlanApproval[]>(KEY_APPROVALS, INITIAL_APPROVALS);
    list = list.filter((a) => a.ID !== id);
    setStored(KEY_APPROVALS, list);
    return { status: 'deleted', id };
  },

  // === BUDGET APPROVALS ===
  getBudgetApprovals(): BudgetApproval[] {
    const list = getStored<BudgetApproval[]>(KEY_BUDGET_APPROVALS, INITIAL_BUDGET_APPROVALS);
    return list.sort((a, b) => b.ID - a.ID);
  },

  saveBudgetApproval(data: Partial<BudgetApproval>): { status: 'created' | 'updated'; id: number } {
    const list = getStored<BudgetApproval[]>(KEY_BUDGET_APPROVALS, INITIAL_BUDGET_APPROVALS);
    const now = formatDateNow();

    const projectIdsStr = Array.isArray(data.ProjectIDs)
      ? (data.ProjectIDs as any[]).join(',')
      : data.ProjectIDs || '';

    const pIds = projectIdsStr.split(',').filter(Boolean).map((s) => Number(s.trim()));
    const allProjects = this.getProjects();
    const linkedProjects = allProjects.filter((p) => pIds.includes(p.ID));

    const yearKey = `งบประมาณ ${data['ปีงบประมาณ'] || 2571}` as keyof Project;
    const calculatedPlannedBudget = data['งบประมาณตามแผน'] !== undefined
      ? Number(data['งบประมาณตามแผน'])
      : linkedProjects.reduce((sum, p) => sum + (Number(p[yearKey]) || 0), 0);

    if (data.ID) {
      const index = list.findIndex((b) => b.ID === data.ID);
      if (index !== -1) {
        const existing = list[index];
        const updated: BudgetApproval = {
          ...existing,
          ...data,
          ID: existing.ID,
          'ปีงบประมาณ': data['ปีงบประมาณ'] !== undefined ? data['ปีงบประมาณ'] : existing['ปีงบประมาณ'],
          'แหล่งที่มาของงบประมาณ': data['แหล่งที่มาของงบประมาณ'] !== undefined ? data['แหล่งที่มาของงบประมาณ'] : existing['แหล่งที่มาของงบประมาณ'],
          'วันที่อนุมัติงบประมาณ': data['วันที่อนุมัติงบประมาณ'] !== undefined ? data['วันที่อนุมัติงบประมาณ'] : existing['วันที่อนุมัติงบประมาณ'],
          'จำนวนงบประมาณที่อนุมัติ (บาท)': data['จำนวนงบประมาณที่อนุมัติ (บาท)'] !== undefined ? Number(data['จำนวนงบประมาณที่อนุมัติ (บาท)']) : existing['จำนวนงบประมาณที่อนุมัติ (บาท)'],
          'งบประมาณตามแผน': calculatedPlannedBudget,
          'ProjectIDs': projectIdsStr || existing.ProjectIDs,
          'จำนวนโครงการ': pIds.length > 0 ? pIds.length : existing.จำนวนโครงการ,
          'มติ/หน่วยงานผู้อนุมัติ': data['มติ/หน่วยงานผู้อนุมัติ'] !== undefined ? data['มติ/หน่วยงานผู้อนุมัติ'] : existing['มติ/หน่วยงานผู้อนุมัติ'],
          'บันทึกเพิ่มเติม': data['บันทึกเพิ่มเติม'] !== undefined ? data['บันทึกเพิ่มเติม'] : existing['บันทึกเพิ่มเติม'],
          'วันที่บันทึก': existing['วันที่บันทึก'] || now
        };
        list[index] = updated;
        setStored(KEY_BUDGET_APPROVALS, list);
        return { status: 'updated', id: existing.ID };
      }
    }

    const maxId = list.length > 0 ? Math.max(...list.map((b) => b.ID)) : 0;
    const newId = maxId + 1;

    const newBudget: BudgetApproval = {
      ID: newId,
      'ปีงบประมาณ': data['ปีงบประมาณ'] || 2571,
      'แหล่งที่มาของงบประมาณ': data['แหล่งที่มาของงบประมาณ'] || 'เทศบัญญัติงบประมาณรายจ่ายประจำปี',
      'วันที่อนุมัติงบประมาณ': data['วันที่อนุมัติงบประมาณ'] || '',
      'จำนวนงบประมาณที่อนุมัติ (บาท)': Number(data['จำนวนงบประมาณที่อนุมัติ (บาท)']) || 0,
      'งบประมาณตามแผน': calculatedPlannedBudget,
      'ProjectIDs': projectIdsStr,
      'จำนวนโครงการ': linkedProjects.length,
      'มติ/หน่วยงานผู้อนุมัติ': data['มติ/หน่วยงานผู้อนุมัติ'] || '',
      'บันทึกเพิ่มเติม': data['บันทึกเพิ่มเติม'] || '',
      'วันที่บันทึก': now
    };

    list.unshift(newBudget);
    setStored(KEY_BUDGET_APPROVALS, list);
    return { status: 'created', id: newId };
  },

  deleteBudgetApproval(id: number): { status: 'deleted'; id: number } {
    let list = getStored<BudgetApproval[]>(KEY_BUDGET_APPROVALS, INITIAL_BUDGET_APPROVALS);
    list = list.filter((b) => b.ID !== id);
    setStored(KEY_BUDGET_APPROVALS, list);
    return { status: 'deleted', id };
  },

  // === USERS ===
  getUsers(): UserItem[] {
    const list = getStored<UserItem[]>(KEY_USERS, INITIAL_USERS);
    return list.sort((a, b) => b.ID - a.ID);
  },

  saveUser(data: Partial<UserItem>): { status: 'created' | 'updated'; id: number } {
    const list = getStored<UserItem[]>(KEY_USERS, INITIAL_USERS);
    const now = formatDateNow();

    if (data.ID) {
      const idx = list.findIndex((u) => u.ID === data.ID);
      if (idx === -1) throw new Error('ไม่พบผู้ใช้งาน');
      list[idx] = { ...list[idx], ...data } as UserItem;
      setStored(KEY_USERS, list);
      return { status: 'updated', id: data.ID };
    } else {
      const maxId = list.length > 0 ? Math.max(...list.map((u) => u.ID)) : 0;
      const newId = maxId + 1;
      const newUser: UserItem = {
        ID: newId,
        'ชื่อ-สกุล': data['ชื่อ-สกุล'] || '',
        'ตำแหน่ง': data['ตำแหน่ง'] || '',
        'หน่วยงาน/กอง': data['หน่วยงาน/กอง'] || '',
        'อีเมล': data['อีเมล'] || '',
        'เบอร์โทรศัพท์': data['เบอร์โทรศัพท์'] || '',
        'สิทธิ์การใช้งาน': data['สิทธิ์การใช้งาน'] || 'เจ้าหน้าที่บันทึกข้อมูล',
        'สถานะ': data['สถานะ'] || 'ใช้งาน',
        'วันที่บันทึก': now,
        username: data.username || '',
        passwordHash: data.passwordHash || '',
        lastLogin: data.lastLogin || ''
      };
      list.unshift(newUser);
      setStored(KEY_USERS, list);
      return { status: 'created', id: newId };
    }
  },

  deleteUser(id: number): { status: 'deleted'; id: number } {
    let list = getStored<UserItem[]>(KEY_USERS, INITIAL_USERS);
    list = list.filter((u) => u.ID !== id);
    setStored(KEY_USERS, list);
    return { status: 'deleted', id };
  },

  // === DASHBOARD DATA ===
  getDashboardData(): DashboardData {
    const projects = this.getProjects();
    const byStatus: Record<string, number> = {
      'ดำเนินการแล้วเสร็จ': 0,
      'เสร็จสิ้น': 0,
      'อยู่ระหว่างดำเนินการ': 0,
      'ยังไม่ได้ดำเนินการ': 0,
      'ไม่ได้ดำเนินการ': 0,
      'ไม่ดำเนินการ': 0
    };
    const byIssue: Record<string, number> = {};
    const byPlan: Record<string, number> = {};
    const byResponsible: Record<string, number> = {};
    const budgetByYear: Record<number, number> = {
      2571: 0,
      2572: 0,
      2573: 0,
      2574: 0,
      2575: 0
    };
    let totalBudget = 0;

    projects.forEach((p) => {
      const st = (p['สถานะดำเนินงาน'] || 'ไม่ดำเนินการ') as ProjectStatus;
      if (byStatus[st] === undefined) byStatus[st] = 0;
      byStatus[st]++;

      const issue = p['ประเด็นการพัฒนา'] || '(ไม่ระบุ)';
      byIssue[issue] = (byIssue[issue] || 0) + 1;

      const plan = p['แผนงาน'] || '(ไม่ระบุ)';
      byPlan[plan] = (byPlan[plan] || 0) + 1;

      const resp = p['หน่วยงานรับผิดชอบหลัก'] || '(ไม่ระบุ)';
      byResponsible[resp] = (byResponsible[resp] || 0) + 1;

      YEARS.forEach((y) => {
        const key = `งบประมาณ ${y}` as keyof Project;
        const val = Number(p[key]) || 0;
        budgetByYear[y] += val;
        totalBudget += val;
      });
    });

    return {
      totalProjects: projects.length,
      byStatus,
      byIssue,
      byPlan,
      byResponsible,
      totalBudget,
      budgetByYear,
      projects
    };
  },

  // === SEARCH PROJECTS ===
  searchProjects(criteria: SearchCriteria): Project[] {
    let list = this.getProjects();
    const approvals = this.getApprovals();

    if (criteria.issue) {
      list = list.filter((p) => (p['ประเด็นการพัฒนา'] || '').toLowerCase().includes(criteria.issue!.toLowerCase()));
    }
    if (criteria.plan) {
      list = list.filter((p) => (p['แผนงาน'] || '').toLowerCase().includes(criteria.plan!.toLowerCase()));
    }
    if (criteria.name) {
      list = list.filter((p) => (p['ชื่อโครงการ'] || '').toLowerCase().includes(criteria.name!.toLowerCase()));
    }
    if (criteria.responsible) {
      list = list.filter((p) => (p['หน่วยงานรับผิดชอบหลัก'] || '').toLowerCase().includes(criteria.responsible!.toLowerCase()));
    }
    if (criteria.type) {
      list = list.filter((p) => p['ประเภทรายการ'] === criteria.type);
    }
    if (criteria.year) {
      list = list.filter((p) => String(p['ปี พ.ศ.']) === String(criteria.year));
    }
    if (criteria.status) {
      list = list.filter((p) => p['สถานะดำเนินงาน'] === criteria.status);
    }
    if (criteria.minBudget) {
      const min = Number(criteria.minBudget) || 0;
      list = list.filter((p) => {
        return YEARS.some((y) => {
          const val = Number(p[`งบประมาณ ${y}` as keyof Project]) || 0;
          return val >= min;
        });
      });
    }

    if (criteria.approvalNo || criteria.approvalDate) {
      const matchIds = new Set<string>();
      approvals.forEach((a) => {
        const matchNo = criteria.approvalNo ? String(a['ครั้งที่']) === String(criteria.approvalNo) : true;
        const matchDate = criteria.approvalDate ? a['วันที่อนุมัติประกาศใช้'] === criteria.approvalDate : true;
        if (matchNo && matchDate) {
          String(a.ProjectIDs || '')
            .split(',')
            .forEach((id) => {
              if (id.trim()) matchIds.add(id.trim());
            });
        }
      });
      list = list.filter((p) => matchIds.has(String(p.ID)));
    }

    return list;
  },

  // === REPORT ผ.01 ===
  getReport01(): Report01Data {
    const list = this.getProjects();
    const issuesMap: Record<string, { [y: number]: { count: number; budget: number } }> = {};
    const issueOrder: string[] = [];

    list.forEach((p) => {
      const issue = p['ประเด็นการพัฒนา'] || '(ไม่ระบุ)';
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

    return {
      org: ORG_NAME,
      rows,
      totals,
      grandTotalCount,
      grandTotalBudget
    };
  },

  // === REPORT ผ.02 ===
  getReport02(filterType?: PlanType): Report02Data {
    let list = this.getProjects();
    if (filterType) {
      list = list.filter((p) => (p['ประเภทรายการ'] || 'ฉบับแรก') === filterType);
    }

    const grouped: Record<string, Project[]> = {};
    const order: string[] = [];

    list.forEach((p) => {
      const issue = p['ประเด็นการพัฒนา'] || '(ไม่ระบุ)';
      if (!grouped[issue]) {
        grouped[issue] = [];
        order.push(issue);
      }
      grouped[issue].push(p);
    });

    const groups = order.map((issue) => ({ issue, items: grouped[issue] }));

    let grandTotalBudget = 0;
    list.forEach((p) => {
      YEARS.forEach((y) => {
        grandTotalBudget += Number(p[`งบประมาณ ${y}` as keyof Project]) || 0;
      });
    });

    return {
      org: ORG_NAME,
      groups,
      count: list.length,
      grandTotalBudget
    };
  },

  // === TRACKING LOGS (ระบบติดตามและประเมินผลโครงการ) ===
  getTrackingLogs(): TrackingLog[] {
    return getStored<TrackingLog[]>(KEY_TRACKING_LOGS, INITIAL_TRACKING_LOGS);
  },

  getTrackingLogsByProject(projectId: number): TrackingLog[] {
    const logs = this.getTrackingLogs();
    return logs.filter((l) => l.ProjectID === projectId);
  },

  saveTrackingLog(data: Partial<TrackingLog> & { ProjectID: number }): { status: 'created' | 'updated'; id: number } {
    const logs = this.getTrackingLogs();
    const now = formatDateNow();
    let updatedLogs: TrackingLog[];
    let logId: number;
    let status: 'created' | 'updated';

    if (data.ID) {
      logId = data.ID;
      status = 'updated';
      updatedLogs = logs.map((l) => (l.ID === logId ? ({ ...l, ...data } as TrackingLog) : l));
    } else {
      const maxId = logs.reduce((m, l) => Math.max(m, l.ID || 0), 0);
      logId = maxId + 1;
      status = 'created';
      const newLog: TrackingLog = {
        ID: logId,
        ProjectID: data.ProjectID,
        projectName: data.projectName || '',
        department: data.department || '',
        reportDate: data.reportDate || now.split(' ')[0],
        milestone: data.milestone || '',
        progressPct: data.progressPct || 0,
        disbursedAmount: data.disbursedAmount || 0,
        issues: data.issues || '',
        solutions: data.solutions || '',
        reporterName: data.reporterName || 'เจ้าหน้าที่ผู้รับผิดชอบ',
        attachmentUrl: data.attachmentUrl || '',
        createdAt: now
      };
      updatedLogs = [newLog, ...logs];
    }

    setStored(KEY_TRACKING_LOGS, updatedLogs);

    // Also synchronize back to the master project in Local Development Plan
    const projects = this.getProjects();
    const targetProject = projects.find((p) => p.ID === data.ProjectID);
    if (targetProject) {
      const updatedProject: Partial<Project> = { ID: targetProject.ID };
      if (data.progressPct !== undefined) {
        updatedProject['ความก้าวหน้า (ร้อยละ)'] = data.progressPct;
        if (data.progressPct >= 100) {
          updatedProject['สถานะดำเนินงาน'] = 'ดำเนินการแล้วเสร็จ';
        } else if (data.progressPct > 0) {
          updatedProject['สถานะดำเนินงาน'] = 'อยู่ระหว่างดำเนินการ';
        }
      }
      if (data.disbursedAmount !== undefined) {
        // Compute total disbursed across all logs of this project
        const projectLogs = updatedLogs.filter((l) => l.ProjectID === data.ProjectID);
        const totalDisbursed = projectLogs.reduce((sum, l) => sum + (Number(l.disbursedAmount) || 0), 0);
        updatedProject['ผลการเบิกจ่าย (บาท)'] = totalDisbursed;
      }
      if (data.milestone) {
        updatedProject['บันทึกผลการดำเนินงาน'] = data.milestone;
      }
      if (data.issues) {
        updatedProject['ปัญหาและอุปสรรค'] = data.issues;
      }
      this.saveProject(updatedProject);
    }

    return { status, id: logId };
  },

  deleteTrackingLog(id: number): void {
    const logs = this.getTrackingLogs();
    const target = logs.find((l) => l.ID === id);
    const updated = logs.filter((l) => l.ID !== id);
    setStored(KEY_TRACKING_LOGS, updated);

    // Recalculate project total disbursed if needed
    if (target) {
      const remainingForProject = updated.filter((l) => l.ProjectID === target.ProjectID);
      const totalDisbursed = remainingForProject.reduce((sum, l) => sum + (Number(l.disbursedAmount) || 0), 0);
      const maxProgress = remainingForProject.reduce((max, l) => Math.max(max, l.progressPct || 0), 0);
      this.saveProject({
        ID: target.ProjectID,
        'ผลการเบิกจ่าย (บาท)': totalDisbursed,
        'ความก้าวหน้า (ร้อยละ)': maxProgress
      });
    }
  },

  // === PROJECT TRACKING SYSTEM (ระบบติดตามโครงการ) ===
  getProjectTrackings(): ProjectTrackingItem[] {
    return getStored<ProjectTrackingItem[]>(KEY_PROJECT_TRACKINGS, INITIAL_PROJECT_TRACKINGS);
  },

  saveProjectTracking(data: Partial<ProjectTrackingItem>): { status: 'created' | 'updated'; id: number } {
    const trackings = this.getProjectTrackings();
    const now = formatDateNow();
    let updatedList: ProjectTrackingItem[];
    let trackingId: number;
    let status: 'created' | 'updated';

    if (data.ID) {
      trackingId = data.ID;
      status = 'updated';
      updatedList = trackings.map((t) =>
        t.ID === trackingId
          ? ({
              ...t,
              ...data,
              'วันที่บันทึกล่าสุด': now
            } as ProjectTrackingItem)
          : t
      );
    } else {
      const maxId = trackings.reduce((m, t) => Math.max(m, t.ID || 0), 0);
      trackingId = maxId + 1;
      status = 'created';
      const newTracking: ProjectTrackingItem = {
        ID: trackingId,
        projectID: data.projectID,
        'ปีงบ': data['ปีงบ'] || 2571,
        'ประเด็นการพัฒนา': data['ประเด็นการพัฒนา'] || '',
        'ชื่อโครงการ': data['ชื่อโครงการ'] || '',
        'วัตถุประสงค์': data['วัตถุประสงค์'] || '',
        'รายละเอียดโครงการ': data['รายละเอียดโครงการ'] || '',
        'สถานะโครงการ': data['สถานะโครงการ'] || 'ยังไม่เริ่มดำเนินการ',
        'ความคืบหน้า (%)': Number(data['ความคืบหน้า (%)']) || 0,
        'วันที่เริ่มต้น': data['วันที่เริ่มต้น'] || '',
        'วันที่คาดว่าจะสิ้นสุด': data['วันที่คาดว่าจะสิ้นสุด'] || '',
        'หมายเหตุ/ปัญหาที่พบ': data['หมายเหตุ/ปัญหาที่พบ'] || '',
        'ผู้รับผิดชอบ': data['ผู้รับผิดชอบ'] || '',
        'งบประมาณที่ได้รับจัดสรร': Number(data['งบประมาณที่ได้รับจัดสรร']) || 0,
        'ผลการเบิกจ่าย': Number(data['ผลการเบิกจ่าย']) || 0,
        'แหล่งงบประมาณ': data['แหล่งงบประมาณ'] || '',
        'วันที่บันทึกล่าสุด': now,
        'วันที่สร้าง': now
      };
      updatedList = [newTracking, ...trackings];
    }

    setStored(KEY_PROJECT_TRACKINGS, updatedList);

    // Sync back to linked master project if projectID exists
    if (data.projectID) {
      const projects = this.getProjects();
      const linked = projects.find((p) => p.ID === data.projectID);
      if (linked) {
        const syncUpdates: Partial<Project> = { ID: linked.ID };
        if (data['ความคืบหน้า (%)'] !== undefined) {
          syncUpdates['ความก้าวหน้า (ร้อยละ)'] = Number(data['ความคืบหน้า (%)']);
          if (data['ความคืบหน้า (%)'] >= 100) {
            syncUpdates['สถานะดำเนินงาน'] = 'ดำเนินการแล้วเสร็จ';
          } else if (data['ความคืบหน้า (%)'] > 0) {
            syncUpdates['สถานะดำเนินงาน'] = 'อยู่ระหว่างดำเนินการ';
          }
        }
        if (data['ผลการเบิกจ่าย'] !== undefined) {
          syncUpdates['ผลการเบิกจ่าย (บาท)'] = Number(data['ผลการเบิกจ่าย']);
        }
        if (data['หมายเหตุ/ปัญหาที่พบ']) {
          syncUpdates['ปัญหาและอุปสรรค'] = data['หมายเหตุ/ปัญหาที่พบ'];
        }
        this.saveProject(syncUpdates);
      }
    }

    return { status, id: trackingId };
  },

  deleteProjectTracking(id: number): void {
    const list = this.getProjectTrackings();
    const updated = list.filter((t) => t.ID !== id);
    setStored(KEY_PROJECT_TRACKINGS, updated);
  },

  // === BACKUP & RESTORE ===
  exportAllData() {
    return {
      projects: this.getProjects(),
      approvals: this.getApprovals(),
      budgetApprovals: this.getBudgetApprovals(),
      users: this.getUsers(),
      options: this.getOptions(),
      trackingLogs: this.getTrackingLogs(),
      projectTrackings: this.getProjectTrackings(),
      exportedAt: new Date().toISOString()
    };
  },

  importAllData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.projects) setStored(KEY_PROJECTS, data.projects);
      if (data.approvals) setStored(KEY_APPROVALS, data.approvals);
      if (data.budgetApprovals) setStored(KEY_BUDGET_APPROVALS, data.budgetApprovals);
      if (data.users) setStored(KEY_USERS, data.users);
      if (data.options) setStored(KEY_OPTIONS, data.options);
      if (data.trackingLogs) setStored(KEY_TRACKING_LOGS, data.trackingLogs);
      if (data.projectTrackings) setStored(KEY_PROJECT_TRACKINGS, data.projectTrackings);
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  },

  resetToDefaultData() {
    setStored(KEY_PROJECTS, INITIAL_PROJECTS);
    setStored(KEY_APPROVALS, INITIAL_APPROVALS);
    setStored(KEY_BUDGET_APPROVALS, INITIAL_BUDGET_APPROVALS);
    setStored(KEY_USERS, INITIAL_USERS);
    setStored(KEY_OPTIONS, INITIAL_OPTIONS);
    setStored(KEY_TRACKING_LOGS, INITIAL_TRACKING_LOGS);
    setStored(KEY_PROJECT_TRACKINGS, INITIAL_PROJECT_TRACKINGS);
  }
};
