import { UserItem, AuthSession } from '../types';
import { StorageService } from './storageService';

const KEY_AUTH_SESSION = 'sila_plan_auth_session_v1';

// SHA-256 Hash helper using Web Crypto API
export async function hashPassword(plainText: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Generate simple mock session token
function generateToken(): string {
  return 'sila_tok_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Default pre-computed SHA-256 hashes for standard accounts:
// 'admin1234' -> '313970b809a473a21532f50bd3ddcaea4efba77f152d11394b9f06dd1a5cf957'
// 'mayor1234' -> 'e97ef4662d51b3ba7fb525f0393c52a5a54e531fec793cae19a4e8d356fe3c5d'
// 'user1234'  -> '7955ba9cb39d22d4f2081f95c4794e77cb36f45bb6a908a85f9eec21e0ca09f8'

export const AuthService = {
  hashPassword,
  // Get active session from sessionStorage (or fallback to localStorage)
  getCurrentSession(): AuthSession | null {
    try {
      const raw = sessionStorage.getItem(KEY_AUTH_SESSION) || localStorage.getItem(KEY_AUTH_SESSION);
      if (!raw) return null;
      const session = JSON.parse(raw) as AuthSession;
      return session;
    } catch {
      return null;
    }
  },

  getCurrentUser(): UserItem | null {
    const session = this.getCurrentSession();
    return session ? session.user : null;
  },

  async login(identifier: string, plainTextPassword: string): Promise<{ success: boolean; session?: AuthSession; message?: string }> {
    const users = StorageService.getUsers();
    const cleanId = identifier.trim().toLowerCase();
    const inputHash = await hashPassword(plainTextPassword.trim());

    // Find user by email or username or exact Thai name
    const user = users.find(
      (u) =>
        (u['อีเมล'] && u['อีเมล'].toLowerCase() === cleanId) ||
        (u.username && u.username.toLowerCase() === cleanId) ||
        (u['ชื่อ-สกุล'] && u['ชื่อ-สกุล'].toLowerCase() === cleanId)
    );

    if (!user) {
      return { success: false, message: 'ไม่พบบัญชีผู้ใช้งานนี้ในระบบ' };
    }

    if (user['สถานะ'] === 'ระงับการใช้งาน') {
      return { success: false, message: 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ' };
    }

    // Determine expected hash:
    // If user has a passwordHash saved, check it.
    // Otherwise fallback to default role passwords (admin1234, mayor1234, user1234)
    let isPasswordCorrect = false;

    if (user.passwordHash) {
      isPasswordCorrect = user.passwordHash === inputHash;
    } else {
      // Default fallbacks
      const adminHash = '313970b809a473a21532f50bd3ddcaea4efba77f152d11394b9f06dd1a5cf957'; // admin1234
      const mayorHash = 'e97ef4662d51b3ba7fb525f0393c52a5a54e531fec793cae19a4e8d356fe3c5d'; // mayor1234
      const userHash = '7955ba9cb39d22d4f2081f95c4794e77cb36f45bb6a908a85f9eec21e0ca09f8';  // user1234

      if (user['สิทธิ์การใช้งาน'] === 'ผู้ดูแลระบบ') {
        isPasswordCorrect = inputHash === adminHash || inputHash === userHash;
      } else if (user['สิทธิ์การใช้งาน'] === 'ผู้บริหาร/ผู้อนุมัติ') {
        isPasswordCorrect = inputHash === mayorHash || inputHash === adminHash;
      } else {
        isPasswordCorrect = inputHash === userHash || inputHash === adminHash;
      }
    }

    if (!isPasswordCorrect) {
      return { success: false, message: 'รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง' };
    }

    const session: AuthSession = {
      user: {
        ...user,
        lastLogin: new Date().toISOString()
      },
      token: generateToken(),
      loginTime: new Date().toISOString()
    };

    // Store in sessionStorage
    sessionStorage.setItem(KEY_AUTH_SESSION, JSON.stringify(session));

    // Update last login in users database
    StorageService.saveUser({
      ID: user.ID,
      lastLogin: session.loginTime
    });

    return { success: true, session };
  },

  // User Registration
  async register(params: {
    fullName: string;
    department: string;
    position: string;
    role: 'เจ้าหน้าที่บันทึกข้อมูล' | 'ผู้บริหาร/ผู้อนุมัติ' | 'ผู้ดูแลระบบ';
    username: string;
    password: string;
    email?: string;
    phone?: string;
  }): Promise<{ success: boolean; session?: AuthSession; message?: string }> {
    const { fullName, department, position, role, username, password, email, phone } = params;

    if (!fullName.trim() || !department.trim() || !position.trim() || !username.trim() || !password.trim()) {
      return { success: false, message: 'กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน' };
    }

    if (password.length < 4) {
      return { success: false, message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร' };
    }

    const users = StorageService.getUsers();
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = (email || '').trim().toLowerCase();

    // Check duplicate username or email
    const exists = users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === cleanUsername) ||
        (cleanEmail && u['อีเมล'] && u['อีเมล'].toLowerCase() === cleanEmail) ||
        (u['ชื่อ-สกุล'] && u['ชื่อ-สกุล'].trim() === fullName.trim())
    );

    if (exists) {
      if (exists.username && exists.username.toLowerCase() === cleanUsername) {
        return { success: false, message: 'ชื่อผู้ใช้งานนี้ถูกใช้งานแล้ว กรุณาเลือกชื่ออื่น' };
      }
      if (cleanEmail && exists['อีเมล'] && exists['อีเมล'].toLowerCase() === cleanEmail) {
        return { success: false, message: 'อีเมลนี้มีอยู่ในระบบแล้ว' };
      }
      return { success: false, message: 'ชื่อ-สกุลนี้มีอยู่ในระบบแล้ว' };
    }

    const passwordHash = await hashPassword(password.trim());
    const nowTime = new Date().toISOString();

    const saveRes = StorageService.saveUser({
      'ชื่อ-สกุล': fullName.trim(),
      'หน่วยงาน/กอง': department.trim(),
      'ตำแหน่ง': position.trim(),
      'สิทธิ์การใช้งาน': role,
      'สถานะ': 'ใช้งาน',
      'อีเมล': email ? email.trim() : `${username.trim()}@sila.go.th`,
      'เบอร์โทรศัพท์': phone ? phone.trim() : '043-246-888',
      username: username.trim(),
      passwordHash: passwordHash,
      lastLogin: nowTime
    });

    const registeredUser: UserItem = {
      ID: saveRes.id,
      'ชื่อ-สกุล': fullName.trim(),
      'หน่วยงาน/กอง': department.trim(),
      'ตำแหน่ง': position.trim(),
      'สิทธิ์การใช้งาน': role,
      'สถานะ': 'ใช้งาน',
      'อีเมล': email ? email.trim() : `${username.trim()}@sila.go.th`,
      'เบอร์โทรศัพท์': phone ? phone.trim() : '043-246-888',
      username: username.trim(),
      passwordHash: passwordHash,
      lastLogin: nowTime
    };

    const session: AuthSession = {
      user: registeredUser,
      token: generateToken(),
      loginTime: nowTime
    };

    sessionStorage.setItem(KEY_AUTH_SESSION, JSON.stringify(session));

    return { success: true, session };
  },

  // 1-Click Quick login for demo / role testing
  quickLoginAsUser(user: UserItem): AuthSession {
    const session: AuthSession = {
      user: {
        ...user,
        lastLogin: new Date().toISOString()
      },
      token: generateToken(),
      loginTime: new Date().toISOString()
    };
    sessionStorage.setItem(KEY_AUTH_SESSION, JSON.stringify(session));
    return session;
  },

  logout(): void {
    sessionStorage.removeItem(KEY_AUTH_SESSION);
    localStorage.removeItem(KEY_AUTH_SESSION);
  },

  // Permission helpers
  isAdmin(user?: UserItem | null): boolean {
    if (!user) return false;
    return user['สิทธิ์การใช้งาน'] === 'ผู้ดูแลระบบ';
  },

  isExecutive(user?: UserItem | null): boolean {
    if (!user) return false;
    return user['สิทธิ์การใช้งาน'] === 'ผู้บริหาร/ผู้อนุมัติ' || user['สิทธิ์การใช้งาน'] === 'ผู้ดูแลระบบ';
  },

  canApprove(user?: UserItem | null): boolean {
    if (!user) return false;
    return user['สิทธิ์การใช้งาน'] === 'ผู้บริหาร/ผู้อนุมัติ' || user['สิทธิ์การใช้งาน'] === 'ผู้ดูแลระบบ';
  },

  canManageUsers(user?: UserItem | null): boolean {
    if (!user) return false;
    return user['สิทธิ์การใช้งาน'] === 'ผู้ดูแลระบบ';
  },

  canEdit(user?: UserItem | null): boolean {
    if (!user) return false;
    return (
      user['สิทธิ์การใช้งาน'] === 'ผู้ดูแลระบบ' ||
      user['สิทธิ์การใช้งาน'] === 'ผู้บริหาร/ผู้อนุมัติ' ||
      user['สิทธิ์การใช้งาน'] === 'เจ้าหน้าที่บันทึกข้อมูล'
    );
  }
};
