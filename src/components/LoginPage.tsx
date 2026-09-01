import React, { useState } from 'react';
import {
  Building2,
  Lock,
  User,
  KeyRound,
  Eye,
  EyeOff,
  UserPlus,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Shield,
  Briefcase,
  Layers,
  Sparkles,
  ChevronRight,
  Crown,
  FileEdit,
  BadgeCheck
} from 'lucide-react';
import { AuthService } from '../services/authService';
import { StorageService } from '../services/storageService';
import { UserItem, AuthSession } from '../types';
import { ORG_NAME, STANDARD_DEPARTMENTS } from '../data/initialData';

interface LoginPageProps {
  onLoginSuccess: (session: AuthSession) => void;
}

type AuthMode = 'login' | 'register';

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regDepartment, setRegDepartment] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regPosition, setRegPosition] = useState('');
  const [regRole, setRegRole] = useState<'เจ้าหน้าที่บันทึกข้อมูล' | 'ผู้บริหาร/ผู้อนุมัติ' | 'ผู้ดูแลระบบ'>('เจ้าหน้าที่บันทึกข้อมูล');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Status & Feedback state
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const users = StorageService.getUsers();

  // Reset errors when changing modes
  const handleSwitchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) {
      setErrorMsg('กรุณาระบุชื่อผู้ใช้งาน หรืออีเมล');
      return;
    }
    if (!loginPassword.trim()) {
      setErrorMsg('กรุณาระบุรหัสผ่าน');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await AuthService.login(loginIdentifier, loginPassword);
      if (res.success && res.session) {
        onLoginSuccess(res.session);
      } else {
        setErrorMsg(res.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบชื่อผู้ใช้งานหรือรหัสผ่าน');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Register submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regDepartment) {
      setErrorMsg('กรุณาเลือกสำนัก/กอง สังกัดของท่าน');
      return;
    }
    if (!regFullName.trim()) {
      setErrorMsg('กรุณาระบุชื่อ-นามสกุล');
      return;
    }
    if (!regPosition.trim()) {
      setErrorMsg('กรุณาระบุตำแหน่งงาน');
      return;
    }
    if (!regRole) {
      setErrorMsg('กรุณาเลือกบทบาท / สิทธิ์การใช้งาน');
      return;
    }
    if (!regUsername.trim()) {
      setErrorMsg('กรุณาระบุชื่อผู้ใช้งาน');
      return;
    }
    if (regUsername.trim().length < 3) {
      setErrorMsg('ชื่อผู้ใช้งานต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
      return;
    }
    if (!regPassword.trim()) {
      setErrorMsg('กรุณาระบุรหัสผ่าน');
      return;
    }
    if (regPassword.length < 4) {
      setErrorMsg('รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setIsLoading(true);

    try {
      const res = await AuthService.register({
        fullName: regFullName,
        department: regDepartment,
        position: regPosition,
        role: regRole,
        username: regUsername,
        password: regPassword
      });

      if (res.success && res.session) {
        setSuccessMsg('ลงทะเบียนสำเร็จ! กำลังเข้าสู่ระบบ...');
        setTimeout(() => {
          onLoginSuccess(res.session!);
        }, 600);
      } else {
        setErrorMsg(res.message || 'ไม่สามารถลงทะเบียนได้ กรุณาลองใหม่อีกครั้ง');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click Shortcut login for testing roles
  const handleQuickLogin = (u: UserItem) => {
    const session = AuthService.quickLoginAsUser(u);
    onLoginSuccess(session);
  };

  // Demo accounts categorized for test buttons (นายชัชชัย, นายประเสริฐ, นายสมศักดิ์)
  const officerUser =
    users.find((u) => u['ชื่อ-สกุล']?.includes('ชัชชัย') || u['ชื่อ-สกุล']?.includes('ธวัชชัย')) ||
    users.find((u) => u['สิทธิ์การใช้งาน'] === 'เจ้าหน้าที่บันทึกข้อมูล') ||
    users[1] ||
    users[0];

  const execUser =
    users.find((u) => u['ชื่อ-สกุล']?.includes('ประเสริฐ')) ||
    users.find((u) => u['สิทธิ์การใช้งาน'] === 'ผู้บริหาร/ผู้อนุมัติ') ||
    users[2] ||
    users[0];

  const adminUser =
    users.find((u) => u['ชื่อ-สกุล']?.includes('สมศักดิ์')) ||
    users.find((u) => u['สิทธิ์การใช้งาน'] === 'ผู้ดูแลระบบ') ||
    users[0];

  return (
    <div
      id="login-page-container"
      className="min-h-screen w-full flex flex-col justify-between items-center py-6 px-4 sm:px-6 relative overflow-x-hidden"
      style={{
        background: 'linear-gradient(135deg, #006853 0%, #004d3d 100%)'
      }}
    >
      {/* Decorative ambient lighting overlays */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00A878]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00BD87]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Organization Header Badge */}
      <div className="w-full max-w-4xl flex items-center justify-between z-10 mb-3 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-1 shadow-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="text-white font-bold text-sm sm:text-base tracking-wide flex items-center gap-2">
              <span>{ORG_NAME}</span>
              <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 font-medium">
                จ.ขอนแก่น
              </span>
            </div>
            <div className="text-emerald-100/70 text-xs">
              ระบบสารสนเทศเพื่อการบริหารและจัดทำแผนพัฒนาท้องถิ่น (e-Plan)
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-emerald-200 bg-white/10 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-white/15">
          <Shield className="w-3.5 h-3.5 text-emerald-300" />
          <span>ระบบความปลอดภัยตามมาตรฐานความมั่นคงปลอดภัย (RBAC)</span>
        </div>
      </div>

      {/* Center Form Card */}
      <div className="w-full max-w-[500px] z-10 my-auto transition-all duration-300">
        <div
          id="auth-card"
          className="bg-white rounded-[20px] p-6 sm:p-8 transition-all duration-300"
          style={{
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)'
          }}
        >
          {/* ===================== 1. LOGIN VIEW ===================== */}
          {mode === 'login' ? (
            <div className="space-y-5">
              {/* Header Card Icon & Titles */}
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-[#E6F4F1] flex items-center justify-center mx-auto shadow-inner transition-transform duration-200 hover:scale-105">
                  <Building2 className="w-8 h-8 text-[#006853]" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
                    ระบบแผนพัฒนาเทศบาลเมืองศิลา
                  </h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Sila Digital Plan • แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575)
                  </p>
                </div>
              </div>

              {/* Error / Success Alerts */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[#006853] text-xs flex items-center gap-2.5 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-[#00A878] shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Username field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ชื่อผู้ใช้งาน <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4 text-[#006853]" />
                    </div>
                    <input
                      type="text"
                      id="login-username-input"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="ระบุชื่อผู้ใช้งาน หรือ อีเมล"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-slate-200 focus:border-[#006853] focus:ring-2 focus:ring-[#006853]/20 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-150"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      รหัสผ่าน <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      (ค่าเริ่มต้น: admin1234 / user1234)
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4 text-[#006853]" />
                    </div>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      id="login-password-input"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="ระบุรหัสผ่านเข้าใช้งาน"
                      required
                      className="w-full pl-10 pr-10 py-2.5 bg-[#F8FAFC] border border-slate-200 focus:border-[#006853] focus:ring-2 focus:ring-[#006853]/20 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-150"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#006853] transition-colors cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit button in Emerald #00A878 */}
                <button
                  type="submit"
                  id="btn-login-submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-[#00A878] hover:bg-[#00BD87] active:bg-[#00966B] active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#00A878]/30 hover:shadow-lg hover:shadow-[#00A878]/40 flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>กำลังเข้าสู่ระบบ...</span>
                    </div>
                  ) : (
                    <>
                      <span>เข้าสู่ระบบ</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </>
                  )}
                </button>
              </form>

              {/* Footer Switch to Register */}
              <div className="pt-2 text-center text-xs text-slate-600 border-t border-slate-100">
                ยังไม่มีบัญชี?{' '}
                <button
                  type="button"
                  id="btn-switch-to-register"
                  onClick={() => handleSwitchMode('register')}
                  className="text-[#006853] hover:text-[#00A878] font-bold hover:underline cursor-pointer transition-colors"
                >
                  ลงทะเบียนใหม่
                </button>
              </div>
            </div>
          ) : (
            /* ===================== 2. REGISTER VIEW ===================== */
            <div className="space-y-4">
              {/* Header Card Icon & Titles */}
              <div className="text-center space-y-1.5">
                <div className="w-16 h-16 rounded-full bg-[#E6F4F1] flex items-center justify-center mx-auto shadow-inner transition-transform duration-200 hover:scale-105">
                  <UserPlus className="w-8 h-8 text-[#006853]" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
                    ลงทะเบียนผู้ใช้งานใหม่
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    สร้างบัญชีเพื่อเข้าใช้งานระบบแผนพัฒนาเทศบาลเมืองศิลา
                  </p>
                </div>
              </div>

              {/* Error / Success Alerts */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[#006853] text-xs flex items-center gap-2.5 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-[#00A878] shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Register Form */}
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                {/* Department Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    สำนัก/กอง <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#006853]">
                      <Layers className="w-4 h-4" />
                    </div>
                    <select
                      id="reg-department-select"
                      value={regDepartment}
                      onChange={(e) => setRegDepartment(e.target.value)}
                      required
                      className="w-full pl-9 pr-8 py-2.5 bg-[#F8FAFC] border border-slate-200 focus:border-[#006853] focus:ring-2 focus:ring-[#006853]/20 rounded-xl text-xs text-slate-800 outline-none transition-all duration-150 cursor-pointer"
                    >
                      <option value="">-- กรุณาเลือกสำนัก / กอง --</option>
                      {STANDARD_DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Full Name and Position in 2 columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#006853]">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        id="reg-fullname-input"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="เช่น นายสมใจ ใจดี"
                        required
                        className="w-full pl-9 pr-3 py-2.5 bg-[#F8FAFC] border border-slate-200 focus:border-[#006853] focus:ring-2 focus:ring-[#006853]/20 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ตำแหน่ง <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#006853]">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        id="reg-position-input"
                        value={regPosition}
                        onChange={(e) => setRegPosition(e.target.value)}
                        placeholder="เช่น นักวิเคราะห์นโยบายและแผน"
                        required
                        className="w-full pl-9 pr-3 py-2.5 bg-[#F8FAFC] border border-slate-200 focus:border-[#006853] focus:ring-2 focus:ring-[#006853]/20 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Role Dropdown (3 Roles requested by user) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    บทบาท / สิทธิ์การใช้งาน <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#006853]">
                      <Shield className="w-4 h-4" />
                    </div>
                    <select
                      id="reg-role-select"
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as any)}
                      required
                      className="w-full pl-9 pr-8 py-2.5 bg-[#F8FAFC] border border-slate-200 focus:border-[#006853] focus:ring-2 focus:ring-[#006853]/20 rounded-xl text-xs font-medium text-slate-800 outline-none transition-all duration-150 cursor-pointer"
                    >
                      <option value="เจ้าหน้าที่บันทึกข้อมูล">
                        เจ้าหน้าที่บันทึกข้อมูล (Data Entry Officer)
                      </option>
                      <option value="ผู้บริหาร/ผู้อนุมัติ">
                        ผู้อนุมัติ / ผู้บริหาร (Approver / Executive)
                      </option>
                      <option value="ผู้ดูแลระบบ">ผู้ดูแลระบบ (Admin)</option>
                    </select>
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อผู้ใช้งาน <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#006853]">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      id="reg-username-input"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="เช่น somchai.j หรือ user01"
                      required
                      className="w-full pl-9 pr-3 py-2.5 bg-[#F8FAFC] border border-slate-200 focus:border-[#006853] focus:ring-2 focus:ring-[#006853]/20 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Password & Confirm Password in 2 columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      รหัสผ่าน <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#006853]">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        id="reg-password-input"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="อย่างน้อย 4 ตัวอักษร"
                        required
                        className="w-full pl-9 pr-8 py-2.5 bg-[#F8FAFC] border border-slate-200 focus:border-[#006853] focus:ring-2 focus:ring-[#006853]/20 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-[#006853]"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ยืนยันรหัสผ่าน <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#006853]">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type={showRegConfirmPassword ? 'text' : 'password'}
                        id="reg-confirm-password-input"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                        required
                        className="w-full pl-9 pr-8 py-2.5 bg-[#F8FAFC] border border-slate-200 focus:border-[#006853] focus:ring-2 focus:ring-[#006853]/20 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-[#006853]"
                      >
                        {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Primary Button in Emerald #00A878 */}
                <button
                  type="submit"
                  id="btn-register-submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-[#00A878] hover:bg-[#00BD87] active:bg-[#00966B] active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#00A878]/30 hover:shadow-lg hover:shadow-[#00A878]/40 flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>กำลังบันทึกข้อมูล...</span>
                    </div>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 text-white" />
                      <span>ลงทะเบียน</span>
                    </>
                  )}
                </button>
              </form>

              {/* Footer Switch back to Login */}
              <div className="pt-2 text-center text-xs text-slate-600 border-t border-slate-100">
                มีบัญชีผู้ใช้งานแล้ว?{' '}
                <button
                  type="button"
                  id="btn-switch-to-login"
                  onClick={() => handleSwitchMode('login')}
                  className="text-[#006853] hover:text-[#00A878] font-bold hover:underline cursor-pointer transition-colors"
                >
                  เข้าสู่ระบบ
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===================== 3. DEMO ROLES SHORTCUT SECTION ===================== */}
        {mode === 'login' && (
          <div className="mt-4 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-white/30 shadow-lg space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#006853] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#00A878]" />
                <span>บัญชีทดสอบระบบตามระดับสิทธิ์ (Demo Roles)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">คลิกเพื่อสลับสิทธิ์ทันที</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Officer Demo */}
              {officerUser && (
                <button
                  type="button"
                  id="btn-demo-officer"
                  onClick={() => handleQuickLogin(officerUser)}
                  className="flex flex-col p-2.5 rounded-xl bg-[#F8FAFC] hover:bg-emerald-50/80 border border-slate-200 hover:border-[#00A878] transition-all duration-150 text-left group cursor-pointer shadow-2xs hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100/70 text-[#006853] border border-emerald-200">
                      เจ้าหน้าที่
                    </span>
                    <FileEdit className="w-3 h-3 text-[#006853] opacity-60 group-hover:opacity-100" />
                  </div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-[#006853] truncate">
                    {officerUser['ชื่อ-สกุล']}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {officerUser['ตำแหน่ง'] || 'เจ้าหน้าที่บันทึกข้อมูล'}
                  </div>
                </button>
              )}

              {/* Executive / Approver Demo */}
              {execUser && (
                <button
                  type="button"
                  id="btn-demo-executive"
                  onClick={() => handleQuickLogin(execUser)}
                  className="flex flex-col p-2.5 rounded-xl bg-[#F8FAFC] hover:bg-amber-50/80 border border-slate-200 hover:border-amber-400 transition-all duration-150 text-left group cursor-pointer shadow-2xs hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                      ผู้อนุมัติ/ผู้บริหาร
                    </span>
                    <Crown className="w-3 h-3 text-amber-700 opacity-60 group-hover:opacity-100" />
                  </div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-amber-800 truncate">
                    {execUser['ชื่อ-สกุล']}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {execUser['ตำแหน่ง'] || 'นายกเทศมนตรี'}
                  </div>
                </button>
              )}

              {/* Admin Demo */}
              {adminUser && (
                <button
                  type="button"
                  id="btn-demo-admin"
                  onClick={() => handleQuickLogin(adminUser)}
                  className="flex flex-col p-2.5 rounded-xl bg-[#F8FAFC] hover:bg-rose-50/80 border border-slate-200 hover:border-rose-400 transition-all duration-150 text-left group cursor-pointer shadow-2xs hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                      ผู้ดูแลระบบ
                    </span>
                    <BadgeCheck className="w-3 h-3 text-rose-700 opacity-60 group-hover:opacity-100" />
                  </div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-rose-800 truncate">
                    {adminUser['ชื่อ-สกุล']}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {adminUser['ตำแหน่ง'] || 'ผอ.กองยุทธศาสตร์ฯ'}
                  </div>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Copyright */}
      <div className="w-full max-w-4xl text-center text-[11px] sm:text-xs text-emerald-100/70 z-10 pt-4 border-t border-white/10">
        © {new Date().getFullYear() + 543} {ORG_NAME} • ฝ่ายแผนงานและงบประมาณ กองยุทธศาสตร์และงบประมาณ
      </div>
    </div>
  );
};
