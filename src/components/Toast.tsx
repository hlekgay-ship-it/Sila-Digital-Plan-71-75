import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none no-print">
      {toasts.map((t) => {
        let bgClass = 'bg-emerald-800 text-emerald-50 border-emerald-700';
        let Icon = CheckCircle2;

        if (t.type === 'error') {
          bgClass = 'bg-rose-800 text-rose-50 border-rose-700';
          Icon = XCircle;
        } else if (t.type === 'warning') {
          bgClass = 'bg-amber-800 text-amber-50 border-amber-700';
          Icon = AlertTriangle;
        } else if (t.type === 'info') {
          bgClass = 'bg-sky-800 text-sky-50 border-sky-700';
          Icon = Info;
        }

        return (
          <div
            key={t.id}
            id={`toast-${t.id}`}
            className={`pointer-events-auto flex items-start gap-2.5 p-3 rounded-lg border shadow-xl transition-all duration-200 transform translate-y-0 ${bgClass}`}
          >
            <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-xs">
              <div className="font-bold">{t.title}</div>
              {t.message && <div className="text-[11px] opacity-90 mt-0.5">{t.message}</div>}
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              className="text-white/70 hover:text-white transition p-0.5 rounded"
              aria-label="ปิดการแจ้งเตือน"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
