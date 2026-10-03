// @ts-nocheck
import { FolderKanban, ArrowRightLeft, ShieldAlert } from 'lucide-react';
import { memo } from 'react';
import { safeRender } from '../../utils';

const Topbar = ({ workspaceId, workspaceHistory, handleWorkspaceChange, globalExchangeRate, isSuperAdmin, currentView }) => {
  if (currentView === 'settings') return null;

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center shadow-sm z-20 flex-none">
      <div className="flex items-center gap-2 max-w-[60%] w-full">
        <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700 shrink-0"><FolderKanban size={18}/></div>
        <select value={safeRender(workspaceId)} onChange={(e) => handleWorkspaceChange(e.target.value)} className="bg-transparent outline-none font-black text-slate-800 text-sm cursor-pointer w-full text-ellipsis overflow-hidden whitespace-nowrap">
          {workspaceHistory.map(ws => <option key={String(ws)} value={String(ws)}>{safeRender(ws)}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
          <ArrowRightLeft size={12}/> سعر الصرف: {globalExchangeRate.toFixed(2)} د.ل
        </div>
        {isSuperAdmin && <span className="hidden sm:flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-lg text-[10px] font-bold"><ShieldAlert size={12}/> إدارة</span>}
      </div>
    </div>
  );
};

export default memo(Topbar);
