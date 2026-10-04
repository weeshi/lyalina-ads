// @ts-nocheck
import { memo } from 'react';
import ModalWrapper from './ModalWrapper';
import { Banknote } from 'lucide-react';

const PayoutModal = ({ isOpen, onClose, form, setForm, onSave }) => (
  <ModalWrapper isOpen={isOpen} onClose={onClose} title="دفع عمولة" icon={<Banknote size={20} className="text-brand-600"/>}>
    <div className="space-y-3">
        <div><label className="block text-[10px] font-bold text-ink-500 mb-1">المبلغ (يخصم من الرصيد) $</label><input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full p-2.5 rounded-xl border border-hairline focus:border-brand-500 outline-none font-extrabold text-lg text-brand-600" /></div>
        <div><label className="block text-[10px] font-bold text-ink-500 mb-1">المبلغ المدفوع (للتوثيق) د.ل</label><input type="number" value={form.amountLYD} onChange={e => setForm({...form, amountLYD: e.target.value})} className="w-full p-2.5 rounded-xl border border-hairline focus:border-brand-500 outline-none font-extrabold text-lg text-ink-600" /></div>
        <div><input type="text" value={form.note} onChange={e => setForm({...form, note: e.target.value})} className="w-full p-2.5 rounded-xl border border-hairline focus:border-brand-500 outline-none text-sm font-bold text-ink-700" placeholder="ملاحظات..." /></div>
        <div className="flex gap-2 pt-2">
            <button onClick={onSave} className="flex-1 bg-brand-600 text-white py-2.5 rounded-xl font-bold hover:bg-brand-700 shadow-md text-sm">تأكيد</button>
            <button onClick={onClose} className="flex-1 bg-fill text-ink-600 py-2.5 rounded-xl font-bold hover:bg-hairline text-sm">إلغاء</button>
        </div>
    </div>
  </ModalWrapper>
);

export default memo(PayoutModal);
