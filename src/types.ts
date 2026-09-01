export type PlanType = 'ฉบับแรก' | 'เพิ่มเติม' | 'เปลี่ยนแปลง' | 'แก้ไข';

// สถานะงบประมาณ / การจัดทำข้อบัญญัติ-เทศบัญญัติ (ดูว่าโครงการในแผน ได้รับเงินงบประมาณหรือยัง)
export type BudgetStatus =
  | 'ไม่อนุมัติ / ไม่ได้รับการบรรจุงบประมาณ'
  | 'อยู่ระหว่างการจัดทำเทศบัญญัติ'
  | 'ได้รับการจัดสรรงบประมาณแล้ว (มีงบพร้อมใช้)'
  | 'โอนลด / ยกเลิกงบประมาณ';

// สถานะการดำเนินงาน (ดูว่าตัวงาน/กิจกรรมจริง ทำไปถึงไหนแล้ว) ในระบบติดตามประเมินผลโครงการ
export type ProjectExecutionStatus =
  | 'ยังไม่ได้ดำเนินการ'
  | 'อยู่ระหว่างดำเนินการ'
  | 'ดำเนินการแล้วเสร็จ'
  | 'เสร็จสิ้น'
  | 'ไม่ได้ดำเนินการ'
  | 'ไม่ดำเนินการ'
  | 'กันเงินนำไปทำต่อปีถัดไป';

export type ProjectStatus = ProjectExecutionStatus;

export interface ProjectSnapshot {
  'ชื่อโครงการ': string;
  'วัตถุประสงค์': string;
  'เป้าหมาย (ผลผลิต)': string;
  'งบประมาณ 2571': number;
  'งบประมาณ 2572': number;
  'งบประมาณ 2573': number;
  'งบประมาณ 2574': number;
  'งบประมาณ 2575': number;
  'ผลที่คาดว่าจะได้รับ': string;
  'หน่วยงานรับผิดชอบหลัก': string;
  'แหล่งที่มาของงบประมาณ'?: string;
  'งบประมาณที่อนุมัติ'?: number;
  'สถานะงบประมาณ'?: BudgetStatus;
  'การอ้างอิงแผน'?: string;
  'เหตุผลและความจำเป็น'?: string;
  'ประเด็นการพัฒนา'?: string;
  'แผนงาน'?: string;
  'สถานะดำเนินงาน'?: ProjectExecutionStatus;
  'ความก้าวหน้า (ร้อยละ)'?: number;
  'ผลการเบิกจ่าย (บาท)'?: number;
  'บันทึกผลการดำเนินงาน'?: string;
  'ปัญหาและอุปสรรค'?: string;
}

export interface ProjectRevision {
  revisionId: string;
  revisionType: PlanType; // 'ฉบับแรก' | 'เพิ่มเติม' | 'เปลี่ยนแปลง' | 'แก้ไข'
  revisionNo: string; // e.g. "ฉบับแรก", "เปลี่ยนแปลง ครั้งที่ 1/2571", "แก้ไข ครั้งที่ 1/2572", "เปลี่ยนแปลง ครั้งที่ 2/2573"
  fiscalYear: number | string; // ปี พ.ศ. เช่น 2571
  approvalDate?: string; // วันที่ประกาศใช้/อนุมัติ
  approvalDocNo?: string; // มติ/ประกาศ เช่น "มติสภาเทศบาล สมัยสามัญ สมัยที่ 2/2571"
  reason?: string; // เหตุผลและความจำเป็น
  createdAt: string; // วันที่และเวลาที่บันทึก
  author?: string; // ผู้บันทึกรายการ
  // ข้อมูลหลังการเปลี่ยนแปลง/แก้ไขในครั้งนี้ (After Snapshot)
  data: ProjectSnapshot;
  // ข้อมูลเดิมก่อนการเปลี่ยนแปลง/แก้ไขในครั้งนี้ (Before Snapshot)
  previousData?: ProjectSnapshot;
  // จุดที่มีการเปลี่ยนแปลงแบบย่อ (Human-readable difference list)
  changeSummary?: string[];
}

export interface Project {
  ID: number;
  'ปี พ.ศ.': string | number;
  'ประเด็นการพัฒนา': string;
  'แผนงาน': string;
  'ชื่อโครงการ': string;
  'วัตถุประสงค์': string;
  'เป้าหมาย (ผลผลิต)': string;
  'งบประมาณ 2571': number;
  'งบประมาณ 2572': number;
  'งบประมาณ 2573': number;
  'งบประมาณ 2574': number;
  'งบประมาณ 2575': number;
  'ผลที่คาดว่าจะได้รับ': string;
  'หน่วยงานรับผิดชอบหลัก': string;
  'แหล่งที่มาของงบประมาณ'?: string;
  'งบประมาณที่อนุมัติ'?: number;
  'สถานะงบประมาณ'?: BudgetStatus;
  'การอ้างอิงแผน'?: string;
  // e-Plan / e-LAAS standard budget approval fields
  'ชื่อโครงการตามข้อบัญญัติ'?: string;
  'วันที่อนุมัติงบประมาณ'?: string;
  'โครงการตามข้อบัญญัติ_ผ02_1'?: string;
  'โครงการตามแผนการดำเนินงาน_ผด02'?: string;
  'โครงการขออนุมัติโอนเปลี่ยนแปลง'?: string;
  'โครงการเงินสะสม'?: string;
  'โครงการอนุมัติตามเทศบัญญัติ'?: string;
  'โครงการอนุมัติจากเงินสะสม'?: string;
  'โครงการอนุมัติจากโอนเปลี่ยนแปลง'?: string;
  'โครงการอนุมัติจากอบจ'?: string;
  'โครงการอนุมัติจากหน่วยงานอื่น'?: string;
  // Comparison fields for Changes / Corrections
  'ชื่อโครงการ (เดิม)'?: string;
  'วัตถุประสงค์ (เดิม)'?: string;
  'เป้าหมาย (เดิม)'?: string;
  'งบประมาณ 2571 (เดิม)'?: number;
  'งบประมาณ 2572 (เดิม)'?: number;
  'งบประมาณ 2573 (เดิม)'?: number;
  'งบประมาณ 2574 (เดิม)'?: number;
  'งบประมาณ 2575 (เดิม)'?: number;
  'ผลที่คาดว่าจะได้รับ (เดิม)'?: string;
  'หน่วยงานรับผิดชอบหลัก (เดิม)'?: string;
  'ประเภทรายการ': PlanType;
  'เหตุผลและความจำเป็น'?: string;
  'สถานะดำเนินงาน': ProjectExecutionStatus;
  // Progress & Execution Tracking
  'ความก้าวหน้า (ร้อยละ)'?: number;
  'ผลการเบิกจ่าย (บาท)'?: number;
  'บันทึกผลการดำเนินงาน'?: string;
  'ปัญหาและอุปสรรค'?: string;
  'วันที่บันทึก'?: string;
  'วันที่แก้ไขล่าสุด'?: string;
  // Multi-revision audit trail
  revisions?: ProjectRevision[];
  revisionCount?: number;
  currentRevisionNo?: string;
}

export type ActiveView =
  | 'dashboard'
  | 'plan-first'
  | 'plan-additional'
  | 'plan-change'
  | 'plan-edit'
  | 'approval'
  | 'budget-approval'
  | 'tracking'
  | 'report'
  | 'search'
  | 'users';

export type ViewType = ActiveView;

export type TrackingStatus =
  | 'ยังไม่เริ่มดำเนินการ'
  | 'อยู่ระหว่างดำเนินการ'
  | 'ดำเนินการแล้วเสร็จ'
  | 'ล่าช้ากว่าแผน'
  | 'ระงับ/ยกเลิก';

export interface ProjectTrackingItem {
  ID: number;
  projectID?: number; // Linked Project ID from Plan
  'ปีงบ': number | string; // Fiscal Year (ปีงบ)
  'ประเด็นการพัฒนา': string; // Development Issue (ประเด็นการพัฒนา)
  'ชื่อโครงการ': string; // Project Name (ชื่อโครงการ - ดึงมาจากโครงการที่ได้รับการอนุมัติงบประมาณ)
  'วัตถุประสงค์': string; // Objective (วัตถุประสงค์)
  'รายละเอียดโครงการ': string; // Project Details / Scope (รายละเอียดโครงการ)
  'สถานะโครงการ': TrackingStatus | string; // Project Status (สถานะโครงการ)
  'ความคืบหน้า (%)': number; // Progress % (ความคืบหน้า (%))
  'วันที่เริ่มต้น': string; // Start Date (วันที่เริ่มต้น)
  'วันที่คาดว่าจะสิ้นสุด': string; // Expected End Date (วันที่คาดว่าจะสิ้นสุด)
  'หมายเหตุ/ปัญหาที่พบ'?: string; // Notes / Issues (หมายเหตุ/ปัญหาที่พบ)
  'ผู้รับผิดชอบ': string; // Responsible (ผู้รับผิดชอบ)
  'หน่วยงาน'?: string; // Responsible department/division
  'แหล่งที่มา'?: string; // Budget Source / แหล่งที่มาของงบประมาณ
  'งบประมาณที่อนุมัติ'?: number; // Approved Budget / งบประมาณที่อนุมัติ (บาท)
  'ลงนามสัญญา'?: number; // Contract Signed Amount / ลงนามสัญญา (บาท)
  'เบิกจ่าย'?: number; // Disbursed Amount / เบิกจ่าย (บาท)
  'คงเหลือ'?: number; // Remaining Amount / คงเหลือ (บาท)
  'งบประมาณที่ได้รับจัดสรร'?: number; // Approved budget allocated (บาท)
  'ผลการเบิกจ่าย'?: number; // Disbursed amount (บาท)
  'แหล่งงบประมาณ'?: string; // Budget source
  'วันที่บันทึกล่าสุด'?: string;
  'วันที่สร้าง'?: string;
}

export interface PlanApproval {
  ID: number;
  'ประเภท': PlanType | string;
  'ครั้งที่': string;
  'ปี พ.ศ.': string;
  'วันที่อนุมัติประกาศใช้': string;
  'วันที่มีผลบังคับใช้'?: string;
  'เลขที่ประกาศ'?: string; // เช่น ประกาศเทศบาลเมืองศิลา ลงวันที่ 15 มกราคม 2571
  'ผู้อนุมัติ'?: string; // เช่น นายกเทศมนตรีเมืองศิลา
  'ผู้ลงนาม'?: string; // เช่น นายกเทศมนตรีเมืองศิลา
  'สถานะการประกาศ'?: 'อนุมัติ' | 'ไม่อนุมัติ' | 'ประกาศใช้แล้ว' | 'ร่างรวบรวมข้อมูล' | 'เสนอพิจารณา' | 'ยกเลิก' | string;
  'ProjectIDs': string; // comma separated IDs or array
  'จำนวนโครงการ'?: number;
  'งบประมาณรวม'?: number;
  'บันทึกเพิ่มเติม'?: string;
  'เหตุผลความจำเป็น'?: string;
  'เหตุผลและความจำเป็น'?: string;
  'วันที่บันทึก'?: string;
}

export interface BudgetApproval {
  ID: number;
  'ปีงบประมาณ': string | number;
  'แหล่งที่มาของงบประมาณ'?: string;
  'วันที่อนุมัติงบประมาณ': string;
  'จำนวนงบประมาณที่อนุมัติ (บาท)': number;
  'งบประมาณตามแผน'?: number;
  'ProjectIDs'?: string;
  'จำนวนโครงการ'?: number;
  'มติ/หน่วยงานผู้อนุมัติ'?: string;
  'บันทึกเพิ่มเติม'?: string;
  'วันที่บันทึก'?: string;
}

export interface UserItem {
  ID: number;
  'ชื่อ-สกุล': string;
  'ตำแหน่ง': string;
  'หน่วยงาน/กอง': string;
  'อีเมล': string;
  'เบอร์โทรศัพท์': string;
  'สิทธิ์การใช้งาน': 'ผู้ดูแลระบบ' | 'เจ้าหน้าที่บันทึกข้อมูล' | 'ผู้บริหาร/ผู้อนุมัติ' | 'ผู้ใช้งานทั่วไป';
  'สถานะ': 'ใช้งาน' | 'ระงับการใช้งาน';
  'วันที่บันทึก'?: string;
  username?: string;
  passwordHash?: string;
  lastLogin?: string;
}

export interface AuthSession {
  user: UserItem;
  token: string;
  loginTime: string;
}

export interface OptionsData {
  [category: string]: string[];
}

export interface SearchCriteria {
  issue?: string;
  plan?: string;
  name?: string;
  responsible?: string;
  type?: string;
  year?: string;
  minBudget?: number | string;
  approvalNo?: string;
  approvalDate?: string;
  status?: string;
}

export interface Report01Row {
  issue: string;
  years: {
    [year: number]: {
      count: number;
      budget: number;
    };
  };
}

export interface Report01Data {
  org: string;
  rows: Report01Row[];
  totals: {
    [year: number]: {
      count: number;
      budget: number;
    };
  };
  grandTotalCount: number;
  grandTotalBudget: number;
}

export interface Report02Group {
  issue: string;
  items: Project[];
}

export interface Report02Data {
  org: string;
  groups: Report02Group[];
  count: number;
  grandTotalBudget: number;
}

export interface TrackingLog {
  ID: number;
  ProjectID: number;
  projectName: string;
  department: string;
  reportDate: string;
  milestone: string;
  progressPct: number;
  disbursedAmount: number;
  issues?: string;
  solutions?: string;
  reporterName: string;
  attachmentUrl?: string;
  createdAt: string;
}

export type SystemPortal = 'plan-system' | 'tracking-system';

export interface DashboardData {
  totalProjects: number;
  byStatus: Record<ProjectStatus, number>;
  byIssue: Record<string, number>;
  byPlan: Record<string, number>;
  byResponsible: Record<string, number>;
  totalBudget: number;
  budgetByYear: Record<number, number>;
  projects: Project[];
}
