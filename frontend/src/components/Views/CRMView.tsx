// @ts-nocheck
import { Users, UserPlus, Plus, Trash2, Wallet } from 'lucide-react';
import { memo } from 'react';
import { safeRender } from '../../utils';

const CRMView = ({ customers, customerStats, setSelectedCustomer, setCurrentView, setCustomerForm, toggleModal, requestDelete, isSuperAdmin }) => {
  return (
    <div className="flex-1 bg-slate-50 p-4 md:p-6 overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800">إدارة العملاء والمحافظ</h2>
          <p className="text-sm text-slate-500 mt-1">شحن الأرصدة وإدارة التمويل الإعلاني</p>
        </div>
        <button onClick={() => { setCustomerForm({name:"", phone:"", email:"", marketerId:"", walletBalanceUSD: 0}); toggleModal('addCustomer', true); }} className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg hover:bg-emerald-700 flex items-center gap-2 text-sm">
          <UserPlus size={16}/> إضافة عميل
        </button>
      </div>
      <div className="grid gap-4 md:gap-6 pb-20 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {customers.map(cust => {
          const stats = customerStats[cust.id] || { totalSpend: 0, due: 0, count: 0 };
          return (
            <div key={String(cust.id)} onClick={() => { setSelectedCustomer(cust); setCurrentView('customer-detail'); }} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-md cursor-pointer transition-all group relative">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 p-3 rounded-2xl text-slate-500 font-bold text-xl h-12 w-12 flex items-center justify-center shrink-0">{safeRender(cust.name).charAt(0)}</div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{safeRender(cust.name)}</h3>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">{safeRender(cust.phone)}</p>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); requestDelete('customer', cust.id); }} className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">رصيد المحفظة</p>
                  <p className={`text-2xl font-black ${(cust.walletBalanceUSD || 0) < 20 ? 'text-rose-500' : 'text-emerald-600'}`}>
                    ${(cust.walletBalanceUSD || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setSelectedCustomer(cust); toggleModal('topUp', true); }} className="bg-white border border-emerald-100 text-emerald-600 hover:bg-emerald-50 p-2 rounded-xl shadow-sm transition-all">
                  <Plus size={20}/>
                </button>
              </div>

              <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                <div><p className="text-[10px] text-slate-400 font-bold uppercase">الديون السابقة</p><p className="font-black text-sm text-amber-500">${safeRender(stats.due)}</p></div>
                <div className="text-left"><p className="text-[10px] text-slate-400 font-bold uppercase">إجمالي الصرف</p><p className="font-black text-sm text-slate-700">${safeRender(stats.totalSpend)}</p></div>
              </div>
              {isSuperAdmin && <div className="text-[9px] text-slate-400 font-mono mt-4 border-t border-slate-100 pt-2 text-center bg-slate-50 rounded-b-2xl -mx-6 -mb-6 pb-2">👤 {cust.ownerEmail?.split('@')[0]}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default memo(CRMView);
