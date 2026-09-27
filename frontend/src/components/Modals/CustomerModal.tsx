// @ts-nocheck
import { memo } from 'react';
import ModalWrapper from './ModalWrapper';
import { UserPlus, Edit3 } from 'lucide-react';
import { safeRender } from '../../utils';

const CustomerModal = ({ isOpen, onClose, form, setForm, onSave, marketers, isEdit }) => (
  <ModalWrapper isOpen={isOpen} onClose={onClose} title={isEdit ? "تعديل بيانات العميل" : "إضافة عميل"} icon={isEdit ? <Edit3 size={20} className="text-emerald-600"/> : <UserPlus size={20} className="text-emerald-600"/>}>
    <div className="space-y-3">
        <div><label className="block text-[10px] font-bold text-slate-500 mb-1">الاسم</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-bold text-slate-800 text-sm" /></div>
        <div><label className="block text-[10px] font-bold text-slate-500 mb-1">الواتساب</label><input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-mono font-bold text-slate-800 text-sm text-left" dir="ltr" placeholder="+218..."/></div>
        <div><label className="block text-[10px] font-bold text-slate-500 mb-1">الإيميل</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-bold text-slate-800 text-sm" /></div>
        <div><label className="block text-[10px] font-bold text-slate-500 mb-1">مسوق</label>
            <select value={form.marketerId} onChange={e => setForm({...form, marketerId: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-bold text-slate-800 text-sm">
                <option value="">بدون مسوق</option>
                {marketers.map(m => <option key={m.id} value={m.id}>{safeRender(m.name)}</option>)}
            </select>
        </div>
        <div className="flex gap-2 mt-4">
            <button onClick={onSave} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-bold hover:bg-emerald-700 shadow-md text-sm">حفظ</button>
            <button onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold hover:bg-slate-200 text-sm">إلغاء</button>
        </div>
    </div>
  </ModalWrapper>
);

export default memo(CustomerModal);
