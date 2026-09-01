/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ระบบจัดการแผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) เทศบาลเมืองศิลา
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar, ActiveView } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { Plan5View } from './components/Plan5View';
import { ApprovalView } from './components/ApprovalView';
import { BudgetApprovalView } from './components/BudgetApprovalView';
import { ReportView } from './components/ReportView';
import { SearchView } from './components/SearchView';
import { UserManagementView } from './components/UserManagementView';
import { ProjectTrackingView } from './components/ProjectTrackingView';
import { LoginPage } from './components/LoginPage';
import { PdfExportModal } from './components/PdfExportModal';
import { BackupModal } from './components/BackupModal';
import { AppsScriptModal } from './components/AppsScriptModal';
import { Toast, ToastMessage } from './components/Toast';
import { StorageService } from './services/storageService';
import { AuthService } from './services/authService';
import { IndexedDbBackupService } from './services/indexedDbService';
import { ApiSyncService } from './services/apiSyncService';
import {
  Project,
  PlanApproval,
  BudgetApproval,
  UserItem,
  OptionsData,
  PlanType,
  SearchCriteria,
  ProjectTrackingItem,
  AuthSession
} from './types';
import { ProjectFormModal } from './components/ProjectFormModal';

export default function App() {
  // Authentication State
  const [authSession, setAuthSession] = useState<AuthSession | null>(() =>
    AuthService.getCurrentSession()
  );
  const [currentUser, setCurrentUser] = useState<UserItem | null>(() =>
    AuthService.getCurrentUser()
  );

  // View & Filter State
  const [currentView, setCurrentView] = useState<ActiveView>('dashboard');
  const [globalFiscalYear, setGlobalFiscalYear] = useState<number>(2571);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [isAppsScriptModalOpen, setIsAppsScriptModalOpen] = useState<boolean>(false);
  const [isPdfExportModalOpen, setIsPdfExportModalOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Selected project for direct inspection/edit across views
  const [inspectingProject, setInspectingProject] = useState<Project | null>(null);

  // Selected edition for Report ผ.02
  const [reportEdition, setReportEdition] = useState<string>('ทั้งหมด');

  // Loaded database items
  const [projects, setProjects] = useState<Project[]>([]);
  const [approvals, setApprovals] = useState<PlanApproval[]>([]);
  const [budgetApprovals, setBudgetApprovals] = useState<BudgetApproval[]>([]);
  const [projectTrackings, setProjectTrackings] = useState<ProjectTrackingItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [options, setOptions] = useState<OptionsData>({});

  // Reload data from storage
  const loadAllData = useCallback(() => {
    setProjects(StorageService.getProjects());
    setApprovals(StorageService.getApprovals());
    setBudgetApprovals(StorageService.getBudgetApprovals());
    setProjectTrackings(StorageService.getProjectTrackings());
    setUsers(StorageService.getUsers());
    setOptions(StorageService.getOptions());
    setCurrentUser(AuthService.getCurrentUser());
  }, []);

  useEffect(() => {
    loadAllData();

    // Background Auto-Pull from Google Sheets if configured
    if (ApiSyncService.isAutoSyncEnabled()) {
      ApiSyncService.pullFromSheets().then((res) => {
        if (res.success && res.count && res.count > 0) {
          loadAllData();
        }
      }).catch((e) => {
        console.warn('Background auto-pull error:', e);
      });
    }
  }, [loadAllData]);

  // Handle Login Success
  const handleLoginSuccess = (session: AuthSession) => {
    setAuthSession(session);
    setCurrentUser(session.user);
    loadAllData();
    addToast('เข้าสู่ระบบสำเร็จ', `ยินดีต้อนรับ ${session.user['ชื่อ-สกุล']} (${session.user['สิทธิ์การใช้งาน']})`);
  };

  // Handle Logout
  const handleLogout = () => {
    AuthService.logout();
    setAuthSession(null);
    setCurrentUser(null);
    addToast('ออกจากระบบเรียบร้อย', 'ท่านได้ออกจากระบบความปลอดภัยแล้ว', 'info');
  };

  // Toast helper
  const addToast = useCallback(
    (title: string, message?: string, type: ToastMessage['type'] = 'success') => {
      const id = Date.now().toString() + Math.random().toString().slice(2, 6);
      setToasts((prev) => [...prev, { id, title, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Counts by plan type
  const countsByType = useMemo(() => {
    const counts: Record<PlanType, number> = {
      'ฉบับแรก': 0,
      'เพิ่มเติม': 0,
      'เปลี่ยนแปลง': 0,
      'แก้ไข': 0
    };
    projects.forEach((p) => {
      const t = (p['ประเภทรายการ'] || 'ฉบับแรก') as PlanType;
      if (counts[t] !== undefined) counts[t]++;
    });
    return counts;
  }, [projects]);

  // Dashboard calculations
  const dashboardData = useMemo(() => {
    return StorageService.getDashboardData();
  }, [projects]);

  // Report calculations
  const report01Data = useMemo(() => {
    return StorageService.getReport01();
  }, [projects]);

  const report02Data = useMemo(() => {
    const filter = reportEdition !== 'ทั้งหมด' ? (reportEdition as PlanType) : undefined;
    return StorageService.getReport02(filter);
  }, [projects, reportEdition]);

  // Handlers for Projects
  const handleSaveProject = (data: Partial<Project>) => {
    try {
      const res = StorageService.saveProject(data);
      loadAllData();
      IndexedDbBackupService.createSnapshot(
        res.status === 'created' ? `เพิ่มโครงการ #${res.id}` : `แก้ไขโครงการ #${res.id}`
      );
      ApiSyncService.triggerAutoPush();
      if (res.status === 'created') {
        addToast('บันทึกโครงการสำเร็จ', `เพิ่มโครงการ #${res.id} ในแผนเรียบร้อย`);
      } else {
        addToast('อัปเดตข้อมูลสำเร็จ', `ปรับปรุงข้อมูลโครงการ #${res.id} เรียบร้อย`);
      }
    } catch (e: any) {
      addToast('เกิดข้อผิดพลาด', e.message || 'ไม่สามารถบันทึกข้อมูลได้', 'error');
    }
  };

  const handleDeleteProject = (id: number) => {
    try {
      StorageService.deleteProject(id);
      loadAllData();
      IndexedDbBackupService.createSnapshot(`ลบโครงการ #${id}`);
      ApiSyncService.triggerAutoPush();
      addToast('ลบโครงการเรียบร้อย', `โครงการ #${id} ถูกลบออกจากระบบแล้ว`);
    } catch (e: any) {
      addToast('เกิดข้อผิดพลาด', e.message || 'ไม่สามารถลบข้อมูลได้', 'error');
    }
  };

  // Handlers for Approvals
  const handleSaveApproval = (data: Partial<PlanApproval>) => {
    try {
      const res = StorageService.saveApproval(data);
      loadAllData();
      IndexedDbBackupService.createSnapshot(`บันทึกมติประกาศใช้แผน ครั้งที่ ${data['ครั้งที่']}`);
      ApiSyncService.triggerAutoPush();
      addToast('บันทึกการอนุมัติสำเร็จ', `บันทึกมติประกาศใช้แผน ครั้งที่ ${data['ครั้งที่']}`);
    } catch (e: any) {
      addToast('เกิดข้อผิดพลาด', e.message || 'ไม่สามารถบันทึกการอนุมัติได้', 'error');
    }
  };

  const handleDeleteApproval = (id: number) => {
    try {
      StorageService.deleteApproval(id);
      loadAllData();
      IndexedDbBackupService.createSnapshot(`ลบรายการอนุมัติ #${id}`);
      ApiSyncService.triggerAutoPush();
      addToast('ลบรายการอนุมัติเรียบร้อย', `รายการอนุมัติ #${id} ถูกลบแล้ว`);
    } catch (e: any) {
      addToast('เกิดข้อผิดพลาด', e.message || 'ไม่สามารถลบรายการได้', 'error');
    }
  };

  // Handlers for Budget Approvals
  const handleSaveBudgetApproval = (data: Partial<BudgetApproval>) => {
    try {
      const res = StorageService.saveBudgetApproval(data);
      loadAllData();
      IndexedDbBackupService.createSnapshot(`บันทึกข้อบัญญัติงบประมาณ พ.ศ. ${data['ปีงบประมาณ']}`);
      ApiSyncService.triggerAutoPush();
      addToast('บันทึกการอนุมัติงบประมาณสำเร็จ', `ปีงบประมาณ พ.ศ. ${data['ปีงบประมาณ']}`);
    } catch (e: any) {
      addToast('เกิดข้อผิดพลาด', e.message || 'ไม่สามารถบันทึกข้อมูลได้', 'error');
    }
  };

  const handleDeleteBudgetApproval = (id: number) => {
    try {
      StorageService.deleteBudgetApproval(id);
      loadAllData();
      IndexedDbBackupService.createSnapshot(`ลบรายการอนุมัติงบประมาณ #${id}`);
      ApiSyncService.triggerAutoPush();
      addToast('ลบรายการอนุมัติงบประมาณเรียบร้อย', `รายการ #${id} ถูกลบแล้ว`);
    } catch (e: any) {
      addToast('เกิดข้อผิดพลาด', e.message || 'ไม่สามารถลบข้อมูลได้', 'error');
    }
  };

  // Handlers for Users
  const handleSaveUser = (data: Partial<UserItem>) => {
    try {
      const res = StorageService.saveUser(data);
      loadAllData();
      IndexedDbBackupService.createSnapshot(`บันทึกข้อมูลผู้ใช้งาน ${data['ชื่อ-สกุล']}`);
      ApiSyncService.triggerAutoPush();
      if (res.status === 'created') {
        addToast('เพิ่มผู้ใช้งานสำเร็จ', `บันทึกข้อมูล ${data['ชื่อ-สกุล']} เรียบร้อย`);
      } else {
        addToast('อัปเดตผู้ใช้งานสำเร็จ', `ปรับปรุงข้อมูล ${data['ชื่อ-สกุล']} เรียบร้อย`);
      }
    } catch (e: any) {
      addToast('เกิดข้อผิดพลาด', e.message || 'ไม่สามารถบันทึกผู้ใช้งานได้', 'error');
    }
  };

  const handleDeleteUser = (id: number) => {
    try {
      StorageService.deleteUser(id);
      loadAllData();
      IndexedDbBackupService.createSnapshot(`ลบผู้ใช้งาน #${id}`);
      ApiSyncService.triggerAutoPush();
      addToast('ลบผู้ใช้งานเรียบร้อย', `ผู้ใช้งาน #${id} ถูกลบออกจากระบบแล้ว`);
    } catch (e: any) {
      addToast('เกิดข้อผิดพลาด', e.message || 'ไม่สามารถลบผู้ใช้งานได้', 'error');
    }
  };

  // Project Tracking Handlers
  const handleSaveProjectTracking = useCallback(
    (data: Partial<ProjectTrackingItem>) => {
      try {
        const res = StorageService.saveProjectTracking(data);
        loadAllData();
        IndexedDbBackupService.createSnapshot(`อัปเดตติดตามโครงการ #${data.projectID || res.id}`);
        ApiSyncService.triggerAutoPush();
        addToast(
          res.status === 'created' ? 'เพิ่มรายการติดตามสำเร็จ' : 'อัปเดตข้อมูลติดตามสำเร็จ',
          `โครงการ "${data['ชื่อโครงการ'] || ''}" ได้รับการบันทึกแล้ว`
        );
      } catch (e: any) {
        addToast('เกิดข้อผิดพลาด', e.message || 'ไม่สามารถบันทึกข้อมูลติดตามได้', 'error');
      }
    },
    [loadAllData, addToast]
  );

  const handleDeleteProjectTracking = useCallback(
    (id: number) => {
      try {
        StorageService.deleteProjectTracking(id);
        loadAllData();
        IndexedDbBackupService.createSnapshot(`ลบรายการติดตาม #${id}`);
        ApiSyncService.triggerAutoPush();
        addToast('ลบรายการติดตามสำเร็จ', 'ลบข้อมูลติดตามโครงการออกจากระบบแล้ว', 'info');
      } catch (e: any) {
        addToast('เกิดข้อผิดพลาด', e.message || 'ไม่สามารถลบข้อมูลได้', 'error');
      }
    },
    [loadAllData, addToast]
  );

  // Option Adding
  const handleAddOption = (category: string, value: string) => {
    const updated = StorageService.addOption(category, value);
    setOptions(updated);
    addToast('เพิ่มตัวเลือกสำเร็จ', `เพิ่ม "${value}" ในหมวด ${category}`);
  };

  // Direct select project from Search or Topbar Quick-Search
  const handleSelectProjectDirect = (p: Project) => {
    setInspectingProject(p);
  };

  // Search filter function
  const handlePerformSearch = (criteria: SearchCriteria) => {
    return StorageService.searchProjects(criteria);
  };

  // If user is not authenticated, render Login Page
  if (!authSession) {
    return (
      <>
        <LoginPage onLoginSuccess={handleLoginSuccess} />
        <Toast toasts={toasts} onDismiss={removeToast} />
      </>
    );
  }

  return (
    <div id="app" className="flex h-screen overflow-hidden bg-slate-900 font-sans antialiased text-slate-900">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={(v) => setCurrentView(v)}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        onOpenAppsScript={() => setIsAppsScriptModalOpen(true)}
        isOpenMobile={isMobileSidebarOpen}
        onToggleMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        countsByType={countsByType}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <div id="main" className="flex-1 flex flex-col min-w-0 h-screen bg-[#f8fafc] overflow-hidden">
        {/* Dynamic Main Content Canvas */}
        <main
          id="content"
          className="flex-1 px-3 py-2.5 sm:px-4 sm:py-3 max-w-[1600px] w-full mx-auto space-y-2.5 overflow-y-auto custom-scrollbar"
        >
          {currentView === 'dashboard' && (
            <DashboardView
              data={dashboardData}
              allProjects={projects}
              onSelectProject={handleSelectProjectDirect}
              onNavigate={(v) => setCurrentView(v)}
              onToggleMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            />
          )}

          {currentView === 'plan-first' && (
            <Plan5View
              planType="ฉบับแรก"
              projects={projects}
              options={options}
              onSaveProject={handleSaveProject}
              onDeleteProject={handleDeleteProject}
              onAddOption={handleAddOption}
              onToggleMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            />
          )}

          {currentView === 'plan-additional' && (
            <Plan5View
              planType="เพิ่มเติม"
              projects={projects}
              options={options}
              onSaveProject={handleSaveProject}
              onDeleteProject={handleDeleteProject}
              onAddOption={handleAddOption}
              onToggleMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            />
          )}

          {currentView === 'plan-change' && (
            <Plan5View
              planType="เปลี่ยนแปลง"
              projects={projects}
              options={options}
              onSaveProject={handleSaveProject}
              onDeleteProject={handleDeleteProject}
              onAddOption={handleAddOption}
              onToggleMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            />
          )}

          {currentView === 'plan-edit' && (
            <Plan5View
              planType="แก้ไข"
              projects={projects}
              options={options}
              onSaveProject={handleSaveProject}
              onDeleteProject={handleDeleteProject}
              onAddOption={handleAddOption}
              onToggleMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            />
          )}

          {currentView === 'approval' && (
            <ApprovalView
              approvals={approvals}
              projects={projects}
              onSaveApproval={handleSaveApproval}
              onDeleteApproval={handleDeleteApproval}
              onNavigate={(v) => setCurrentView(v)}
              onSelectProject={handleSelectProjectDirect}
              onToggleMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            />
          )}

          {currentView === 'budget-approval' && (
            <BudgetApprovalView
              budgetApprovals={budgetApprovals}
              onSaveBudgetApproval={handleSaveBudgetApproval}
              onDeleteBudgetApproval={handleDeleteBudgetApproval}
              globalFiscalYear={globalFiscalYear}
              projects={projects}
              approvals={approvals}
              options={options}
              onSelectProject={handleSelectProjectDirect}
              onSaveProject={handleSaveProject}
              onToggleMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            />
          )}

          {currentView === 'tracking' && (
            <ProjectTrackingView
              trackings={projectTrackings}
              projects={projects}
              budgetApprovals={budgetApprovals}
              options={options}
              globalFiscalYear={globalFiscalYear}
              onSaveTracking={handleSaveProjectTracking}
              onDeleteTracking={handleDeleteProjectTracking}
              onSelectProject={handleSelectProjectDirect}
              onToggleMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            />
          )}

          {currentView === 'report' && (
            <ReportView
              report01={report01Data}
              report02={report02Data}
              selectedEdition={reportEdition}
              onSelectEdition={(ed) => setReportEdition(ed)}
              projects={projects}
              onToggleMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            />
          )}

          {currentView === 'search' && (
            <SearchView
              options={options}
              allProjects={projects}
              onSearch={handlePerformSearch}
              onSelectProject={handleSelectProjectDirect}
              onToggleMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              globalFiscalYear={globalFiscalYear}
            />
          )}

          {currentView === 'users' && (
            <UserManagementView
              users={users}
              onSaveUser={handleSaveUser}
              onDeleteUser={handleDeleteUser}
              onToggleMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              currentUser={currentUser}
            />
          )}
        </main>
      </div>

      {/* Global Project Inspect / Edit Modal */}
      {inspectingProject && (
        <ProjectFormModal
          project={inspectingProject}
          planType={inspectingProject['ประเภทรายการ'] || 'ฉบับแรก'}
          options={options}
          onSave={(data) => {
            handleSaveProject(data);
            setInspectingProject(null);
          }}
          onDelete={(id) => {
            handleDeleteProject(id);
            setInspectingProject(null);
          }}
          onClose={() => setInspectingProject(null)}
          onAddOption={handleAddOption}
        />
      )}

      {/* Global PDF Export Modal */}
      {isPdfExportModalOpen && (
        <PdfExportModal
          isOpen={isPdfExportModalOpen}
          onClose={() => setIsPdfExportModalOpen(false)}
          projects={projects}
          initialReportType="ผ02-baseline"
        />
      )}

      {/* Backup and Restore Modal (IndexedDB + JSON) */}
      {isBackupModalOpen && (
        <BackupModal
          onClose={() => setIsBackupModalOpen(false)}
          onRefreshAll={loadAllData}
          onShowToast={addToast}
        />
      )}

      {/* Google Apps Script Modal */}
      {isAppsScriptModalOpen && (
        <AppsScriptModal
          isOpen={isAppsScriptModalOpen}
          onClose={() => setIsAppsScriptModalOpen(false)}
          onRefreshAll={loadAllData}
          onShowToast={addToast}
        />
      )}

      {/* Notifications Toast */}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
