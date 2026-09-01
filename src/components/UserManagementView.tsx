import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Ban,
  CheckCircle2,
  Mail,
  Phone,
  Edit,
  Trash2,
  X,
  Save,
  KeyRound,
  Lock,
  Menu,
  ShieldAlert
} from 'lucide-react';
import { UserItem } from '../types';
import { STANDARD_DEPARTMENTS } from '../data/initialData';
import { StandardFilterBar } from './StandardFilterBar';
import { TablePagination } from './TablePagination';
import { exportUsers } from '../utils/exportHelpers';
import { AuthService } from '../services/authService';

interface UserManagementViewProps {
  users: UserItem[];
  onSaveUser: (data: Partial<UserItem>) => void;
  onDeleteUser: (id: number) => void;
  onToggleMobile?: () => void;
  currentUser?: UserItem | null;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  onSaveUser,
  onDeleteUser,
  onToggleMobile,
  currentUser
}) => {
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string | number>('ทั้งหมด');
  const [filterRole, setFilterRole] = useState<string>('ทั้งหมด');
  const [filterDepartment, setFilterDepartment] = useState<string>('ทั้งหมด');
  const [filterStatus, setFilterStatus] = useState<string>('ทั้งหมด');
  const [filterSearch, setFilterSearch] = useState<string>('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserItem['สิทธิ์การใช้งาน']>('เจ้าหน้าที่บันทึกข้อมูล');
  const [status, setStatus] = useState<'ใช้งาน' | 'ระงับการใช้งาน'>('ใช้งาน');

  const availableRoles = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u['สิทธิ์การใช้งาน']) set.add(u['สิทธิ์การใช้งาน']);
    });
    return Array.from(set);
  }, [users]);

  const availableDepartments = useMemo(() => {
    const set = new Set<string>(STANDARD_DEPARTMENTS);
    users.forEach((u) => {
      if (u['หน่วยงาน/กอง']) set.add(u['หน่วยงาน/กอง']);
    });
    return Array.from(set);
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (filterRole !== 'ทั้งหมด' && u['สิทธิ์การใช้งาน'] !== filterRole) return false;
      if (filterDepartment !== 'ทั้งหมด' && u['หน่วยงาน/กอง'] !== filterDepartment) return false;
      if (filterStatus !== 'ทั้งหมด' && u['สถานะ'] !== filterStatus) return false;

      if (filterSearch.trim()) {
        const q = filterSearch.toLowerCase();
        const matchName = (u['ชื่อ-สกุล'] || '').toLowerCase().includes(q);
        const matchUsername = (u.username || '').toLowerCase().includes(q);
        const matchPos = (u['ตำแหน่ง'] || '').toLowerCase().includes(q);
        const matchDept = (u['หน่วยงาน/กอง'] || '').toLowerCase().includes(q);
        const matchEmail = (u['อีเมล'] || '').toLowerCase().includes(q);
        const matchPhone = (u['เบอร์โทรศัพท์'] || '').toLowerCase().includes(q);
        if (!matchName && !matchUsername && !matchPos && !matchDept && !matchEmail && !matchPhone) {
          return false;
        }
      }

      return true;
    });
  }, [users, filterRole, filterDepartment, filterStatus, filterSearch]);

  const paginatedUsers = useMemo(() => {
    if (pageSize >= 999 || pageSize === 0) return filteredUsers;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredUsers.slice(startIndex, startIndex + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setName('');
    setUsername('');
    setPassword('');
    setPosition('');
    setDepartment('กองยุทธศาสตร์และงบประมาณ');
    setEmail('');
    setPhone('');
    setRole('เจ้าหน้าที่บันทึกข้อมูล');
    setStatus('ใช้งาน');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: UserItem) => {
    setEditingUser(u);
    setName(u['ชื่อ-สกุล']);
    setUsername(u.username || (u['อีเมล'] ? u['อีเมล'].split('@')[0] : ''));
    setPassword(''); // Leave blank if not changing
    setPosition(u['ตำแหน่ง'] || '');
    setDepartment(u['หน่วยงาน/กอง'] || '');
    setEmail(u['อีเมล'] || '');
    setPhone(u['เบอร์โทรศัพท์'] || '');
    setRole(u['สิทธิ์การใช้งาน']);
    setStatus(u['สถานะ']);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('กรุณากรอกชื่อ-สกุล');
      return;
    }

    const payload: Partial<UserItem> = {
      ID: editingUser ? editingUser.ID : undefined,
      'ชื่อ-สกุล': name.trim(),
      username: username.trim() || (email ? email.split('@')[0] : name.trim().replace(/\s+/g, '').toLowerCase()),
      'ตำแหน่ง': position.trim(),
      'หน่วยงาน/กอง': department.trim(),
      'อีเมล': email.trim(),
      'เบอร์โทรศัพท์': phone.trim(),
      'สิทธิ์การใช้งาน': role,
      'สถานะ': status
    };

    if (password.trim()) {
      payload.passwordHash = await AuthService.hashPassword(password.trim());
    } else if (editingUser && editingUser.passwordHash) {
      payload.passwordHash = editingUser.passwordHash;
    }

    onSaveUser(payload);
    setIsModalOpen(false);
  };

  const getRoleBadge = (r: string) => {
    let color = 'bg-slate-100 text-slate-800 border-slate-200';
    if (r === 'ผู้ดูแลระบบ') color = 'bg-rose-100 text-rose-800 border-rose-200';
    if (r === 'ผู้บริหาร/ผู้อนุมัติ') color = 'bg-purple-100 text-purple-800 border-purple-200';
    if (r === 'เจ้าหน้าที่บันทึกข้อมูล') color = 'bg-amber-100 text-amber-900 border-amber-300';

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${color}`}>
        <ShieldCheck className="w-3 h-3" />
        {r}
      </span>
    );
  };

  const getStatusBadge = (st: string) => {
    if (st === 'ใช้งาน') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          ใช้งาน
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
        <Ban className="w-3 h-3 text-rose-600" />
        ระงับการใช้งาน
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {/* UNIFIED TOP CONTAINER */}
      <div className="bg-white rounded-xl border border-purple-100 shadow-2xs overflow-hidden shrink-0 no-print">
        {/* Header - Royal Purple */}
        <div className="bg-gradient-to-r from-[#1e0d3d] via-purple-900 to-[#120824] text-white px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            {onToggleMobile && (
              <button
                type="button"
                onClick={onToggleMobile}
                className="lg:hidden p-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-950 text-purple-200 border border-purple-700/40 cursor-pointer"
                aria-label="เปิดเมนู"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}
            <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-700/50 flex items-center justify-center font-bold text-xs text-amber-300">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold leading-tight flex items-center gap-2 flex-wrap">
                <span>จัดการบัญชีผู้ใช้งานและสิทธิ์การเข้าถึงข้อมูลระบบ</span>
                <span className="text-purple-400 font-normal">|</span>
                <span className="text-purple-200 text-xs sm:text-sm font-semibold">
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
          allYearsLabel="ทุกปีงบประมาณ"
          actionButton={
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-amber-300" />
              <span>เพิ่มผู้ใช้งานใหม่</span>
            </button>
          }
          issueLabel="ระดับสิทธิ์การใช้งาน"
          issueValue={filterRole}
          onIssueChange={(val) => setFilterRole(val)}
          issueOptions={availableRoles}
          issueAllLabel="-- ทุกระดับสิทธิ์ --"
          departmentLabel="หน่วยงาน / กอง"
          departmentValue={filterDepartment}
          onDepartmentChange={(val) => setFilterDepartment(val)}
          departmentOptions={availableDepartments}
          departmentAllLabel="-- ทุกหน่วยงาน/กอง --"
          searchLabel="ค้นหาชื่อ/ตำแหน่ง/อีเมล"
          searchValue={filterSearch}
          onSearchChange={(val) => setFilterSearch(val)}
          searchPlaceholder="ค้นหาชื่อ, ชื่อผู้ใช้, ตำแหน่ง, อีเมล, เบอร์โทร..."
          budgetLabel="สถานะการใช้งาน"
          budgetValue={filterStatus === 'ทั้งหมด' ? '' : filterStatus}
          onBudgetChange={(val) => setFilterStatus(val || 'ทั้งหมด')}
          budgetPlaceholder="ทั้งหมด / ใช้งาน / ระงับ"
          onSearch={() => {}}
          onShowAll={() => {
            setSelectedFiscalYear('ทั้งหมด');
            setFilterRole('ทั้งหมด');
            setFilterDepartment('ทั้งหมด');
            setFilterStatus('ทั้งหมด');
            setFilterSearch('');
          }}
          onReset={() => {
            setSelectedFiscalYear('ทั้งหมด');
            setFilterRole('ทั้งหมด');
            setFilterDepartment('ทั้งหมด');
            setFilterStatus('ทั้งหมด');
            setFilterSearch('');
          }}
          onExportExcel={() => exportUsers(filteredUsers, 'excel', 'รายชื่อผู้ใช้งานระบบ')}
          onExportCsv={() => exportUsers(filteredUsers, 'csv', 'รายชื่อผู้ใช้งานระบบ')}
          exportItemsCount={filteredUsers.length}
          onPrint={() => window.print()}
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="sticky top-0 z-20">
              <tr className="bg-[#241144] text-white border-b border-purple-950 shadow-xs">
                <th className="py-2.5 px-2.5 text-center w-12 font-bold border-r border-white/15">ที่</th>
                <th className="py-2.5 px-2.5 font-bold text-center min-w-[160px] border-r border-white/15">ชื่อ-สกุล (Username)</th>
                <th className="py-2.5 px-2.5 font-bold text-center min-w-[140px] border-r border-white/15">ตำแหน่ง</th>
                <th className="py-2.5 px-2.5 font-bold text-center min-w-[160px] border-r border-white/15">หน่วยงาน / กอง</th>
                <th className="py-2.5 px-2.5 font-bold text-center min-w-[180px] border-r border-white/15">ข้อมูลการติดต่อ</th>
                <th className="py-2.5 px-2.5 font-bold text-center min-w-[130px] border-r border-white/15">สิทธิ์การใช้งาน</th>
                <th className="py-2.5 px-2.5 font-bold text-center w-28 border-r border-white/15">สถานะ</th>
                <th className="py-2.5 px-2.5 font-bold text-center w-24">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((u, idx) => {
                  const globalIdx = (pageSize >= 999 || pageSize === 0 ? 0 : (currentPage - 1) * pageSize) + idx;
                  return (
                    <tr key={u.ID} className="hover:bg-purple-50/30 transition">
                      <td className="py-2 px-2.5 text-center font-bold text-slate-900 font-mono">{globalIdx + 1}</td>
                      <td className="py-2 px-2.5 font-bold text-slate-900">
                        <div>{u['ชื่อ-สกุล']}</div>
                        {u.username && (
                          <div className="text-[11px] font-mono text-purple-700 font-normal">
                            @{u.username}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2.5 text-slate-700 font-medium">{u['ตำแหน่ง'] || '-'}</td>
                      <td className="py-2 px-2.5 text-slate-700">{u['หน่วยงาน/กอง'] || '-'}</td>
                      <td className="py-2 px-2.5 space-y-0.5">
                        {u['อีเมล'] && (
                          <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                            <Mail className="w-2.5 h-2.5 text-purple-600" />
                            <span>{u['อีเมล']}</span>
                          </div>
                        )}
                        {u['เบอร์โทรศัพท์'] && (
                          <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                            <Phone className="w-2.5 h-2.5 text-amber-600" />
                            <span>{u['เบอร์โทรศัพท์']}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2.5 text-center">{getRoleBadge(u['สิทธิ์การใช้งาน'])}</td>
                      <td className="py-2 px-2.5 text-center">{getStatusBadge(u['สถานะ'])}</td>
                      <td className="py-2 px-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition cursor-pointer"
                            title="แก้ไขผู้ใช้งาน"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`ยืนยันการลบผู้ใช้งาน ${u['ชื่อ-สกุล']} หรือไม่?`)) {
                                onDeleteUser(u.ID);
                              }
                            }}
                            className="p-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
                            title="ลบผู้ใช้งาน"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400 text-xs">
                    ยังไม่มีข้อมูลผู้ใช้งาน
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer - Standard Pagination */}
        {filteredUsers.length > 0 && (
          <TablePagination
            currentPage={currentPage}
            totalItems={filteredUsers.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 20, 50, 100, 999]}
          />
        )}
      </div>

      {/* Modal User Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-3 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-2xl border border-purple-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-700 text-white flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-amber-300" />
                </div>
                <span>{editingUser ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    ชื่อ-สกุล <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น นายสมศักดิ์ นามศิลา"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-semibold focus:ring-1 focus:ring-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ชื่อผู้ใช้ (Username)</label>
                  <input
                    type="text"
                    placeholder="admin_sila"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-mono focus:ring-1 focus:ring-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    รหัสผ่าน (Password)
                    {editingUser && <span className="text-slate-400 font-normal ml-1">(เว้นว่างถ้าไม่เปลี่ยน)</span>}
                  </label>
                  <input
                    type="password"
                    placeholder={editingUser ? '••••••••' : 'กำหนดรหัสผ่าน'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-1 focus:ring-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ตำแหน่ง</label>
                  <input
                    type="text"
                    placeholder="เช่น นักวิเคราะห์นโยบายและแผน"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-1 focus:ring-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">หน่วยงาน / กอง</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-1 focus:ring-purple-600 focus:outline-none"
                  >
                    <option value="">-- เลือกหน่วยงาน / กอง --</option>
                    {STANDARD_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">อีเมล</label>
                  <input
                    type="email"
                    placeholder="user@sila.go.th"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-1 focus:ring-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    placeholder="043-246-888"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-1 focus:ring-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">สิทธิ์การใช้งาน</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserItem['สิทธิ์การใช้งาน'])}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-semibold focus:ring-1 focus:ring-purple-600 focus:outline-none"
                  >
                    <option value="เจ้าหน้าที่บันทึกข้อมูล">เจ้าหน้าที่บันทึกข้อมูล (บันทึก/แก้ไขโครงการ)</option>
                    <option value="ผู้บริหาร/ผู้อนุมัติ">ผู้บริหาร/ผู้อนุมัติ (ดูรายงาน/อนุมัติแผน)</option>
                    <option value="ผู้ดูแลระบบ">ผู้ดูแลระบบ (Admin สิทธิ์สูงสุด)</option>
                    <option value="ผู้ใช้งานทั่วไป">ผู้ใช้งานทั่วไป (ดูอย่างเดียว)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">สถานะการใช้งาน</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'ใช้งาน' | 'ระงับการใช้งาน')}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-semibold focus:ring-1 focus:ring-purple-600 focus:outline-none"
                  >
                    <option value="ใช้งาน">ใช้งาน</option>
                    <option value="ระงับการใช้งาน">ระงับการใช้งาน</option>
                  </select>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition text-xs cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-xs transition text-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-amber-300" />
                  <span>บันทึกข้อมูล</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
