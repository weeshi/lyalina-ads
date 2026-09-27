// @ts-nocheck
import { useState, useEffect, memo } from 'react';
import { X, Filter, Calendar, Archive, Eye, Undo2, Trash, XCircle, Search } from 'lucide-react';
import { safeRender } from '../../utils';
import { STATUS_OPTIONS } from '../../constants';

const AdvancedFiltersDrawer = ({
  isOpen, onClose,
  filterPage, setFilterPage,
  filterStatus, setFilterStatus,
  filterPayment, setFilterPayment,
  filterDateStart, setFilterDateStart,
  filterDateEnd, setFilterDateEnd,
  showArchived, setShowArchived,
  showDeleted, setShowDeleted,
  uniquePageNames,
  activeFiltersCount,
  clearAllFilters,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] flex justify-start">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="relative w-80 max-w-full bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-black text-slate-800 flex items-center gap-2"><Filter size={18} className="text-emerald-600"/> فلاتر متقدمة</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded text-slate-500"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">اسم الصفحة</label>
            <select value={filterPage} onChange={(e) => setFilterPage(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-bold text-sm bg-slate-50">
              <option value="all">كل الصفحات</option>
              {uniquePageNames.map(page => <option key={String(page)} value={page}>{safeRender(page)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">حالة الحملة</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-bold text-sm bg-slate-50">
              <option value="all">كل الحالات</option>
              {Object.keys(STATUS_OPTIONS).map(s => <option key={String(s)} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">حالة الدفع</label>
            <select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-bold text-sm bg-slate-50">
              <option value="all">الكل</option>
              <option value="paid">المدفوع</option>
              <option value="غير مدفوع">الديون</option>
            </select>
          </div>
          <div className="border-t border-slate-100 pt-4">
            <label className="block text-xs font-bold text-slate-500 mb-2 flex items-center gap-1"><Calendar size={14}/> نطاق التاريخ</label>
            <div className="space-y-3">
              <div><span className="text-[10px] text-slate-400">من تاريخ</span><input type="date" value={filterDateStart} onChange={(e) => setFilterDateStart(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 outline-none text-sm text-slate-700 bg-white" /></div>
              <div><span className="text-[10px] text-slate-400">إلى تاريخ</span><input type="date" value={filterDateEnd} onChange={(e) => setFilterDateEnd(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 outline-none text-sm text-slate-700 bg-white" /></div>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
            <button onClick={() => setShowArchived(!showArchived)} disabled={showDeleted} className={`flex items-center justify-center gap-2 p-3 rounded-xl font-bold text-xs disabled:opacity-50 transition-all border ${showArchived ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              {showArchived ? <Eye size={16} /> : <Archive size={16} />} {showArchived ? "إخفاء الأرشيف" : "عرض الأرشيف"}
            </button>
            <button onClick={() => { setShowDeleted(!showDeleted); setShowArchived(false); }} className={`flex items-center justify-center gap-2 p-3 rounded-xl font-bold text-xs transition-all border ${showDeleted ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              {showDeleted ? <Undo2 size={16} /> : <Trash size={16} />} {showDeleted ? "العودة للسجلات النشطة" : "عرض المحذوفات"}
            </button>
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 bg-white space-y-2 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
          <button onClick={clearAllFilters} disabled={activeFiltersCount === 0} className="w-full py-3 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 flex items-center justify-center gap-2 text-sm disabled:opacity-50 transition-all">
            <XCircle size={16}/> مسح الفلاتر
          </button>
          <button onClick={onClose} className="w-full py-3 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md">تطبيق وإغلاق</button>
        </div>
      </div>
    </div>
  );
};

export default memo(AdvancedFiltersDrawer);
