// @ts-nocheck
import { memo } from 'react';
import ModalWrapper from './ModalWrapper';
import { PackagePlus } from 'lucide-react';
import { PACKAGE_CATEGORIES } from '../../constants';

const PackageModal = ({ isOpen, onClose, form, setForm, onSave }) => (
  <ModalWrapper isOpen={isOpen} onClose={onClose} title="إضافة/تعديل باقة" icon={<PackagePlus size={20} className="text-emerald-600"/>}>
    <div className="space-y-3">
      <div>
        <label className="block text-[10px] font-bold text-slate-500 mb-1">التصنيف</label>
        <div className="flex gap-2">
          {Object.entries(PACKAGE_CATEGORIES).map(([key, cat]) => (
            <button key={key} type="button" onClick={() => setForm({...form, category: key, code: (form.code || '').replace(/^[CRG]/, '') ? form.code.replace(/^[CRG]/, '') : form.code})} className={`flex-1 p-2.5 rounded-xl border text-sm font-bold transition-all ${form.category === key ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>
      <div><label className="block text-[10px] font-bold text-slate-500 mb-1">كود الباقة</label><input type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-bold text-slate-800 text-sm" placeholder="مثال: G10" /></div>
      <div><label className="block text-[10px] font-bold text-slate-500 mb-1">العمر (أيام)</label><input type="number" value={form.days} onChange={e => setForm({...form, days: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-bold text-slate-800 text-sm" placeholder="10" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-[10px] font-bold text-slate-500 mb-1">القيمة ($)</label><input type="number" value={form.priceUSD} onChange={e => setForm({...form, priceUSD: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-bold text-slate-800 text-sm text-left" dir="ltr" /></div>
        <div><label className="block text-[10px] font-bold text-slate-500 mb-1">القيمة (د.ل)</label><input type="number" value={form.priceLYD} onChange={e => setForm({...form, priceLYD: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-bold text-slate-800 text-sm text-left" dir="ltr" /></div>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={onSave} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-bold hover:bg-emerald-700 shadow-md text-sm">حفظ</button>
        <button onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold hover:bg-slate-200 text-sm">إلغاء</button>
      </div>
    </div>
  </ModalWrapper>
);

export default memo(PackageModal);
