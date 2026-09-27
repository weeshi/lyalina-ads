// @ts-nocheck
import { useState, useEffect, memo } from 'react';
import ModalWrapper from './ModalWrapper';
import { Coins } from 'lucide-react';

const TopUpModal = ({ isOpen, onClose, customer, exchangeRate, onSave }) => {
    const [amountLYD, setAmountLYD] = useState('');
    const [rate, setRate] = useState(exchangeRate || 7.20);
    const [note, setNote] = useState('');

    useEffect(() => { setRate(exchangeRate); setAmountLYD(''); setNote(''); }, [isOpen, exchangeRate]);

    const amountUSD = (parseFloat(amountLYD) || 0) / (parseFloat(rate) || 1);

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} title="إيداع مالي للمحفظة" icon={<Coins size={20} className="text-emerald-600"/>}>
            <div className="space-y-4">
                <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-100 mb-4">
                    <p className="text-xs font-bold">العميل: <span className="font-black text-sm">{customer?.name}</span></p>
                    <p className="text-[10px] opacity-70 mt-1">يتم تحويل المبلغ بالدينار إلى دولار أمريكي إعلاني فوراً.</p>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">المبلغ المدفوع (دينار ليبي)</label>
                    <input type="number" value={amountLYD} onChange={e => setAmountLYD(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-black text-xl text-slate-800" placeholder="1000" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">سعر الصرف المعتمد</label>
                        <input type="number" step="0.01" value={rate} onChange={e => setRate(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-bold text-slate-800 text-sm" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">الصافي بالدولار ($)</label>
                        <div className="w-full p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 font-black text-emerald-700 text-sm text-center flex items-center justify-center">
                            ${amountUSD.toFixed(2)}
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">ملاحظات (اختياري)</label>
                    <input type="text" value={note} onChange={e => setNote(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-sm font-bold text-slate-700" placeholder="مثال: نقداً، إيداع مصرفي..." />
                </div>
                <div className="flex gap-2 mt-4">
                    <button onClick={() => onSave(parseFloat(amountLYD), parseFloat(rate), amountUSD, note)} disabled={!amountLYD || amountLYD <= 0} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-black hover:bg-emerald-700 shadow-md text-sm disabled:opacity-50 transition-all">تأكيد الإيداع</button>
                    <button onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 text-sm">إلغاء</button>
                </div>
            </div>
        </ModalWrapper>
    );
};

export default memo(TopUpModal);
