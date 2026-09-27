// @ts-nocheck
import { memo } from 'react';
import ModalWrapper from './ModalWrapper';
import { Award } from 'lucide-react';

const PointsModal = ({ isOpen, onClose, type, setType, amount, setAmount, reason, setReason, onSave }) => (
  <ModalWrapper isOpen={isOpen} onClose={onClose} title="إدارة النقاط" icon={<Award size={20} className="text-amber-500"/>}>
    <div className="space-y-4">
        <div className="flex bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setType('add')} className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${type === 'add' ? 'bg-white shadow text-emerald-600' : 'text-slate-500'}`}>إضافة</button>
            <button onClick={() => setType('redeem')} className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${type === 'redeem' ? 'bg-white shadow text-red-600' : 'text-slate-500'}`}>خصم</button>
        </div>
        <div><label className="block text-[10px] font-bold text-slate-500 mb-1">العدد</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-black text-lg text-slate-800" placeholder="0" /></div>
        <div><label className="block text-[10px] font-bold text-slate-500 mb-1">السبب (اختياري)</label><input type="text" value={reason} onChange={e => setReason(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-sm font-bold text-slate-700" /></div>
        <div className="flex gap-2 mt-2">
            <button onClick={onSave} className={`flex-1 text-white py-2.5 rounded-xl font-bold shadow-md text-sm ${type === 'add' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>تأكيد</button>
            <button onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold hover:bg-slate-200 text-sm">إلغاء</button>
        </div>
    </div>
  </ModalWrapper>
);

export default memo(PointsModal);
