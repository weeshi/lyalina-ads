// @ts-nocheck
import { memo } from 'react';
import { X } from 'lucide-react';

const ModalWrapper = ({ isOpen, onClose, title, icon, children, size = 'sm' }) => {
  if (!isOpen) return null;
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  };
  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
      <div className={`bg-white w-full ${sizeClasses[size] || sizeClasses.sm} rounded-2xl shadow-2xl p-5 animate-in zoom-in duration-200 m-auto`}>
        <div className="flex justify-between items-center mb-5">
           <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">{icon} {title}</h3>
           {onClose && <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors"><X size={20}/></button>}
        </div>
        {children}
      </div>
    </div>
  );
};

export default memo(ModalWrapper);
