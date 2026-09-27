// @ts-nocheck
import { Briefcase, UserPlus, Plus, Trash2, DollarSign, TrendingUp, Users } from 'lucide-react';
import { memo } from 'react';
import { safeRender } from '../../utils';

const MarketersView = ({ marketers, marketerStats, setSelectedMarketer, setCurrentView, setMarketerForm, toggleModal, requestDelete }) => {
  return (
    <div className="flex-1 bg-slate-50 p-4 md:p-6 overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800">إدارة المسوقين</h2>
          <p className="text-sm text-slate-500 mt-1">تتبع عمولات المسوقين وأدائهم</p>
        </div>
        <button onClick={() => { setMarketerForm({name:"", phone:"", email:"", rate:"", bankName:"", accountNum:""}); toggleModal('addMarketer', true); }} className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg hover:bg-emerald-700 flex items-center gap-2 text-sm">
          <UserPlus size={16}/> إضافة مسوق
        </button>
      </div>
      <div className="grid gap-4 md:gap-6 pb-20 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {marketers.length > 0 ? marketers.map(mkt => {
          const stats = marketerStats[mkt.id] || { customerCount: 0, campaignCount: 0, totalRevenue: 0, totalCommission: 0, paid: 0, balance: 0 };
          return (
            <div key={String(mkt.id)} onClick={() => { setSelectedMarketer(mkt); setCurrentView('marketer-detail'); }} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-md cursor-pointer transition-all group relative">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-3 rounded-2xl text-orange-600 font-bold text-xl h-12 w-12 flex items-center justify-center shrink-0">{safeRender(mkt.name).charAt(0)}</div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{safeRender(mkt.name)}</h3>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">{safeRender(mkt.phone)}</p>
                    {mkt.email && <p className="text-[10px] text-slate-400 font-mono">{safeRender(mkt.email)}</p>}
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); requestDelete('marketer', mkt.id); }} className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-center flex-1">
                    <p className="text-[10px] text-slate-400 font-bold mb-1">العملاء</p>
                    <p className="text-xl font-black text-slate-700">{stats.customerCount}</p>
                  </div>
                  <div className="text-center flex-1 border-x border-slate-200">
                    <p className="text-[10px] text-slate-400 font-bold mb-1">الحملات</p>
                    <p className="text-xl font-black text-slate-700">{stats.campaignCount}</p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-[10px] text-slate-400 font-bold mb-1">نسبة العمولة</p>
                    <p className="text-xl font-black text-emerald-600">{mkt.rate || 0}%</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-bold text-xs">إجمالي الإيرادات</span>
                  <span className="font-black text-slate-800">${stats.totalRevenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-bold text-xs">العمولة المستحقة</span>
                  <span className="font-black text-indigo-600">${stats.totalCommission.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-100">
                  <span className="text-slate-500 font-bold text-xs">المدفوع</span>
                  <span className="font-black text-emerald-600">${stats.paid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-bold text-xs">المتبقي</span>
                  <span className={`font-black ${stats.balance > 0 ? 'text-amber-600' : 'text-slate-400'}`}>${stats.balance.toFixed(2)}</span>
                </div>
              </div>

              {mkt.bankName && (
                <div className="text-[9px] text-slate-400 font-mono mt-4 border-t border-slate-100 pt-3">
                  🏦 {mkt.bankName} - {mkt.accountNum}
                </div>
              )}
            </div>
          );
        }) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
            <Briefcase size={48} className="mb-4 opacity-50"/>
            <p className="font-bold text-lg">لا يوجد مسوقون بعد</p>
            <p className="text-sm">أضف أول مسوق لبدء تتبع العمولات</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(MarketersView);
