// @ts-nocheck
import { memo } from 'react';
import ModalWrapper from './ModalWrapper';
import { Edit3, Briefcase } from 'lucide-react';

const MarketerModal = ({ isOpen, onClose, form, setForm, onSave, isEdit }) => (
  <ModalWrapper isOpen={isOpen} onClose={onClose} title={isEdit ? "تعديل مسوق" : "إضافة مسوق"} icon={isEdit ? <Edit3 size={20} className="text-indigo-600"/> : <Briefcase size={20} className="text-indigo-600"/>}>
    <div className="space-y-3">
        <div><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none font-bold text-slate-800 text-sm" placeholder="الاسم" /></div>
        {(!isEdit) && <div><input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none font-mono font-bold text-slate-800 text-sm text-left" placeholder="الواتساب" dir="ltr" /></div>}
        <div><input type="number" value={form.rate} onChange={e => setForm({...form, rate: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none font-bold text-slate-800 text-sm" placeholder="النسبة %" /></div>
        {isEdit && (
            <div className="border-t border-slate-100 pt-3 mt-1">
                <p className="text-[10px] font-black text-indigo-800 mb-2">البيانات المصرفية</p>
                <div className="space-y-2">
                    <input type="text" value={form.bankName} onChange={e => setForm({...form, bankName: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-xs text-slate-700" placeholder="اسم المصرف" />
                    <input type="text" value={form.accountNum} onChange={e => setForm({...form, accountNum: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none font-mono text-xs text-slate-700 text-left" placeholder="رقم الحساب" dir="ltr"/>
                </div>
            </div>
        )}
        <div className="flex gap-2 pt-2">
            <button onClick={onSave} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-bold hover:bg-indigo-700 shadow-md text-sm">حفظ</button>
            <button onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold hover:bg-slate-200 text-sm">إلغاء</button>
        </div>
    </div>
  </ModalWrapper>
);

export default memo(MarketerModal);
