import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronRight, Coins, Building2, Layers } from 'lucide-react';
import { Project } from '../types';
import { ActiveView } from './Sidebar';

export interface QuickSearchBoxProps {
  allProjects: Project[];
  onSelectProject: (project: Project) => void;
  onNavigate?: (view: ActiveView) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export const QuickSearchBox: React.FC<QuickSearchBoxProps> = ({
  allProjects,
  onSelectProject,
  onNavigate,
  placeholder = 'ค้นหาชื่อโครงการ, รหัส ID, ประเด็นการพัฒนา, หน่วยงาน...',
  className = '',
  autoFocus = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickResults, setShowQuickResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Click outside listener to close search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowQuickResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowQuickResults(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const quickResults = searchQuery.trim()
    ? allProjects
        .filter((p) => {
          const q = searchQuery.toLowerCase();
          const nameMatch = (p['ชื่อโครงการ'] || '').toLowerCase().includes(q);
          const issueMatch = (p['ประเด็นการพัฒนา'] || '').toLowerCase().includes(q);
          const deptMatch = (p['หน่วยงานรับผิดชอบหลัก'] || '').toLowerCase().includes(q);
          const stratMatch = (p['ยุทธศาสตร์'] || '').toLowerCase().includes(q);
          const idMatch = String(p.ID) === searchQuery.trim();
          return nameMatch || issueMatch || deptMatch || stratMatch || idMatch;
        })
        .slice(0, 8)
    : [];

  const handleSelect = (project: Project) => {
    onSelectProject(project);
    setShowQuickResults(false);
    setSearchQuery('');
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          autoFocus={autoFocus}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowQuickResults(true);
          }}
          onFocus={() => setShowQuickResults(true)}
          className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs sm:text-sm rounded-xl pl-9 pr-8 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 shadow-2xs transition"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setShowQuickResults(false);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200/60 transition"
            aria-label="ล้างคำค้นหา"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Quick search dropdown results */}
      {showQuickResults && searchQuery.trim() && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 max-w-full">
          <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
            <span className="flex items-center gap-1.5 text-emerald-800">
              <Search className="w-3.5 h-3.5 text-emerald-600" />
              ผลการค้นหาด่วน ({quickResults.length} จาก {allProjects.length} โครงการ)
            </span>
            <span className="text-[10px] text-slate-400 font-normal">กด ESC หรือคลิกด้านนอกเพื่อปิด</span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
            {quickResults.length > 0 ? (
              quickResults.map((p) => (
                <button
                  key={p.ID}
                  type="button"
                  onClick={() => handleSelect(p)}
                  className="w-full text-left p-3 hover:bg-emerald-50/70 transition flex flex-col gap-1 group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-700">
                    <span className="line-clamp-1 flex-1 pr-2">{p['ชื่อโครงการ']}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex-shrink-0 font-mono">
                      #{p.ID}
                    </span>
                  </div>
                  
                  {p['ประเด็นการพัฒนา'] && (
                    <div className="text-[11px] text-slate-500 line-clamp-1">
                      ประเด็น: {p['ประเด็นการพัฒนา']}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    {p['หน่วยงานรับผิดชอบหลัก'] && (
                      <span className="flex items-center gap-1 text-slate-600">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {p['หน่วยงานรับผิดชอบหลัก']}
                      </span>
                    )}
                    <span>•</span>
                    <span className="font-semibold text-slate-600">
                      {p['ประเภทรายการ'] || 'ฉบับแรก'}
                    </span>
                    {p['งบประมาณรวม (บาท)'] ? (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 font-mono font-bold text-slate-700">
                          <Coins className="w-3 h-3 text-amber-500" />
                          {(Number(p['งบประมาณรวม (บาท)']) || 0).toLocaleString('th-TH')} บ.
                        </span>
                      </>
                    ) : null}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">ไม่พบโครงการที่ตรงกับ &quot;{searchQuery}&quot;</p>
                <p className="text-slate-400 text-[11px]">ลองค้นหาด้วยคำสำคัญอื่น หรือเปิดหน้าค้นหาละเอียด</p>
              </div>
            )}
          </div>

          {onNavigate && (
            <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => {
                  onNavigate('search');
                  setShowQuickResults(false);
                }}
                className="text-xs text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                ไปยังหน้าค้นหาขั้นสูง (Advanced Search) <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
