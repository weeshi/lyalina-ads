// @ts-nocheck
import { useState, memo } from 'react';
import ModalWrapper from './ModalWrapper';
import { UserPlus } from 'lucide-react';
import { safeRender } from '../../utils';

const MarketerRequestModal = ({ isOpen, onClose, customers, onSubmit, marketerId }) => {
    const [selectedCust, setSelectedCust] = useState('');
    const availableCustomers = customers.filter(c => c.marketerId !== marketerId);

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} title="طلب ربط عميل" icon={<UserPlus size={20} className="text-indigo-600"/>}>
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">اختر العميل لطلب إضافته لملفك:</label>
                    <select value={selectedCust} onChange={e => setSelectedCust(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 outline-none font-bold text-sm bg-slate-50">
                        <option value="">-- اختر العميل --</option>
                        {availableCustomers.map(c => <option key={String(c.id)} value={c.id}>{safeRender(c.name)}</option>)}
                    </select>
                </div>
                <div className="flex gap-2 mt-4">
                    <button onClick={() => { onSubmit('add', selectedCust); setSelectedCust(''); }} disabled={!selectedCust} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 text-sm">إرسال الطلب للإدارة</button>
                    <button onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold hover:bg-slate-200 text-sm">إلغاء</button>
                </div>
            </div>
        </ModalWrapper>
    );
}

export default memo(MarketerRequestModal);
