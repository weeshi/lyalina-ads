// @ts-nocheck
import { memo, useEffect } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const STYLES = {
  success: 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20',
  error: 'bg-red-600 text-white shadow-lg shadow-red-500/20',
  info: 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20',
};

const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const Icon = ICONS[toast.type] || AlertCircle;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-2 fade-in duration-300">
      <div className={`${STYLES[toast.type] || STYLES.info} px-5 py-3 rounded-2xl flex items-center gap-3 min-w-[300px] max-w-[500px] shadow-2xl`}>
        <Icon size={20} className="shrink-0" />
        <span className="flex-1 text-sm font-bold">{toast.message}</span>
        <button onClick={onClose} className="p-0.5 hover:opacity-70 transition-opacity shrink-0">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default memo(Toast);
