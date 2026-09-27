// @ts-nocheck
import { memo } from 'react';
import { Loader2 } from 'lucide-react';

const ProgressModal = ({ isOpen, title, current, total, percentage }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
       <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-200 text-center">
          <div className="flex justify-center mb-4"><Loader2 size={40} className="text-indigo-600 animate-spin" /></div>
          <h3 className="text-xl font-black text-slate-800 mb-6">{title}</h3>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div><span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-100">التقدم</span></div>
              <div className="text-right"><span className="text-xs font-semibold inline-block text-indigo-600">{percentage}%</span></div>
            </div>
            <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-indigo-100 shadow-inner">
              <div style={{ width: `${percentage}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600 transition-all duration-300 ease-out"></div>
            </div>
          </div>
          <p className="text-xs text-slate-400 font-mono font-bold mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">جاري المعالجة: <span className="text-slate-700">{current}</span> / {total}</p>
       </div>
    </div>
  );
};

export default memo(ProgressModal);
