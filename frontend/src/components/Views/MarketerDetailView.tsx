// @ts-nocheck
import { memo, useMemo } from 'react';
import { Edit3, Phone, Mail as MailIcon, Briefcase, DollarSign, Users, TrendingUp, Plus, History, CreditCard, Wallet, Printer, Coins, ArrowUpRight, Search, UserPlus, UserX, Link as LinkIcon, Unlink, CheckCircle2, XCircle, Clock, SendHorizontal } from 'lucide-react';
import { safeRender } from '../../utils';
import { useState } from 'react';

const MarketerDetailView = ({
  selectedMarketer, setSelectedMarketer, setCurrentView, setMarketerForm, toggleModal,
  marketerStats, customers, data, payouts, setPayoutForm, customerStats,
  isSuperAdmin, handleLinkCustomerToMarketer, handleUnlinkCustomer,
  marketerRequests, processMarketerRequest,
}) => {
  const [customerSearch, setCustomerSearch] = useState("");
  const stats = marketerStats[selectedMarketer?.id] || { customerCount: 0, campaignCount: 0, totalRevenue: 0, totalCommission: 0, paid: 0, balance: 0 };
  const myCustomers = useMemo(() => customers.filter(c => c.marketerId === selectedMarketer?.id), [customers, selectedMarketer]);
  const otherCustomers = useMemo(() => customers.filter(c => c.marketerId !== selectedMarketer?.id), [customers, selectedMarketer]);
  const myPageNames = useMemo(() => myCustomers.flatMap(c => c.linkedPages || []), [myCustomers]);
  const myCampaigns = useMemo(() => data.filter(r => myPageNames.includes(r["اسم الصفحة"]) && !r.isDeleted), [data, myPageNames]);
  const myPayouts = useMemo(() => payouts.filter(p => p.marketerId === selectedMarketer?.id), [payouts, selectedMarketer]);
  const pendingRequests = useMemo(() => marketerRequests.filter(r => r.marketerId === selectedMarketer?.id && r.status === 'pending'), [marketerRequests, selectedMarketer]);

  const filteredLinked = myCustomers.filter(c =>
    c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone?.includes(customerSearch)
  );
  const filteredUnlinked = otherCustomers.filter(c =>
    c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone?.includes(customerSearch)
  );

  return (
    <div className="flex-1 bg-canvas p-4 md:p-6 overflow-auto">
      <div className="max-w-6xl mx-auto pb-20">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-hairline mb-6 relative">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <div className="bg-warning-500 text-white w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-extrabold shadow-lg shrink-0">
              {safeRender(selectedMarketer.name).charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-extrabold text-ink-800">{safeRender(selectedMarketer.name)}</h1>
                <button onClick={() => { setMarketerForm(selectedMarketer); toggleModal('editMarketer', true); }} className="text-ink-400 hover:text-brand-600 transition-colors p-1" title="تعديل"><Edit3 size={18}/></button>
              </div>
              <div className="flex items-center gap-4 text-sm text-ink-500 font-medium flex-wrap">
                <span className="flex items-center gap-1 font-mono"><Phone size={14}/> {safeRender(selectedMarketer.phone)}</span>
                {selectedMarketer.email && <span className="flex items-center gap-1"><MailIcon size={14}/> {safeRender(selectedMarketer.email)}</span>}
                <span className="flex items-center gap-1 bg-warning-soft text-warning-500 px-2 py-0.5 rounded-lg font-bold text-xs">
                  <TrendingUp size={12}/> عمولة: {selectedMarketer.rate || 0}%
                </span>
              </div>
              {selectedMarketer.bankName && (
                <div className="mt-2 text-xs text-ink-400 font-mono">
                  🏦 {selectedMarketer.bankName} - {selectedMarketer.accountNum}
                </div>
              )}
            </div>
            <button onClick={() => setCurrentView('marketers')} className="px-6 py-2.5 rounded-xl font-bold bg-fill text-ink-600 hover:bg-hairline text-sm shrink-0">عودة للقائمة</button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-hairline">
            <Users size={20} className="text-assist-500 mb-2"/>
            <p className="text-2xl font-extrabold text-ink-800">{stats.customerCount}</p>
            <p className="text-xs text-ink-500 font-bold">العملاء</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-hairline">
            <Briefcase size={20} className="text-brand-500 mb-2"/>
            <p className="text-2xl font-extrabold text-ink-800">{stats.campaignCount}</p>
            <p className="text-xs text-ink-500 font-bold">الحملات</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-hairline">
            <DollarSign size={20} className="text-brand-600 mb-2"/>
            <p className="text-2xl font-black text-ink-800">${stats.totalCommission.toFixed(2)}</p>
            <p className="text-xs text-ink-500 font-bold">إجمالي العمولة</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-hairline">
            <Wallet size={20} className="text-warning-500 mb-2"/>
            <p className={`text-2xl font-black ${stats.balance > 0 ? 'text-warning-500' : 'text-ink-400'}`}>${stats.balance.toFixed(2)}</p>
            <p className="text-xs text-ink-500 font-bold">الرصيد المتبقي</p>
          </div>
        </div>

        {/* Revenue & Payout Progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gradient-to-br from-assist-600 to-assist-800 rounded-3xl p-6 text-white shadow-xl">
            <p className="text-assist-200 text-sm font-bold mb-1">إجمالي الإيرادات</p>
            <h3 className="text-4xl font-black">${stats.totalRevenue.toFixed(2)}</h3>
            <div className="mt-4 bg-assist-500/30 rounded-full h-3 overflow-hidden">
              <div className="bg-white h-full rounded-full transition-all" style={{width: `${stats.totalRevenue > 0 ? Math.min(100, (stats.paid / stats.totalCommission) * 100) : 0}%`}}></div>
            </div>
            <div className="flex justify-between mt-2 text-assist-200 text-xs font-bold">
              <span>مدفوع: ${stats.paid.toFixed(2)}</span>
              <span>{stats.totalCommission > 0 ? ((stats.paid / stats.totalCommission) * 100).toFixed(1) : 0}%</span>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-hairline">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-ink-700 flex items-center gap-2"><Coins size={18}/> المدفوعات</h3>
              <button onClick={() => { setPayoutForm({amount:"", amountLYD:"", note:""}); toggleModal('payout', true); }} className="px-3 py-2 bg-brand-600 text-white rounded-xl font-bold text-xs hover:bg-brand-700 flex items-center gap-1 shadow-sm transition-colors">
                <Plus size={14}/> إضافة دفعة
              </button>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {myPayouts.length > 0 ? myPayouts.slice(0, 10).map(p => (
                <div key={p.id} className="flex justify-between items-center bg-canvas p-3 rounded-xl border border-fill">
                  <div>
                    <p className="font-bold text-ink-700 text-sm">${p.amount?.toFixed(2)}</p>
                    {p.note && <p className="text-[10px] text-ink-400">{safeRender(p.note)}</p>}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-mono text-ink-400">{safeRender(p.date)}</p>
                    {p.amountLYD > 0 && <p className="text-[10px] text-warning-500 font-bold">{p.amountLYD?.toFixed(2)} د.ل</p>}
                  </div>
                </div>
              )) : (
                <p className="text-sm text-ink-400 italic text-center py-4">لا توجد مدفوعات بعد</p>
              )}
            </div>
          </div>
        </div>

        {/* Pending Requests (Super Admin) */}
        {isSuperAdmin && pendingRequests.length > 0 && (
          <div className="bg-warning-soft border border-warning-soft rounded-2xl p-4 mb-6">
            <h3 className="font-bold text-warning-800 flex items-center gap-2 text-sm mb-3"><Clock size={16}/> طلبات معلقة ({pendingRequests.length})</h3>
            <div className="space-y-2">
              {pendingRequests.map(req => {
                const customer = customers.find(c => c.id === req.customerId);
                return (
                  <div key={req.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-warning-soft">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-ink-700">{safeRender(req.customerName)}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-warning-soft text-warning-500">
                        {req.action === 'add' ? 'طلب ربط' : 'طلب فك'}
                      </span>
                      <span className="text-[10px] text-ink-400 font-mono">{safeRender(req.ownerEmail?.split('@')[0])}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => processMarketerRequest(req.id, 'approved')} className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-[10px] font-bold hover:bg-brand-700 flex items-center gap-1"><CheckCircle2 size={12}/> موافقة</button>
                      <button onClick={() => processMarketerRequest(req.id, 'rejected')} className="px-3 py-1.5 bg-danger-500 text-white rounded-lg text-[10px] font-bold hover:bg-danger-strong flex items-center gap-1"><XCircle size={12}/> رفض</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Customer Management Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-hairline overflow-hidden mb-6">
          <div className="p-4 bg-canvas border-b border-hairline">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="font-bold text-ink-700 flex items-center gap-2 text-sm"><Users size={16}/> إدارة العملاء</h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" size={14} />
                <input type="text" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} placeholder="بحث عن عميل..." className="w-full pr-9 pl-3 py-1.5 rounded-lg border border-hairline focus:border-brand-500 outline-none text-xs font-bold text-ink-700 bg-white" />
              </div>
            </div>
          </div>

          {/* Linked Customers */}
          <div className="px-4 pt-3 pb-1">
            <h4 className="text-xs font-bold text-brand-600 flex items-center gap-1"><LinkIcon size={12}/> العملاء التابعون ({filteredLinked.length})</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-canvas text-ink-400 text-[10px] uppercase font-bold">
                <tr><th className="p-2.5">العميل</th><th className="p-2.5">الهاتف</th><th className="p-2.5">المحفظة</th><th className="p-2.5">الإنفاق</th><th className="p-2.5 text-center">إجراءات</th></tr>
              </thead>
              <tbody className="divide-y divide-fill text-sm">
                {filteredLinked.length > 0 ? filteredLinked.map(c => (
                  <tr key={c.id} className="hover:bg-brand-50/50">
                    <td className="p-2.5 font-bold text-ink-700">{safeRender(c.name)}</td>
                    <td className="p-2.5 font-mono text-xs text-ink-500">{safeRender(c.phone)}</td>
                    <td className="p-2.5 font-black text-brand-600">${(c.walletBalanceUSD || 0).toFixed(2)}</td>
                    <td className="p-2.5 font-black text-ink-700">${(customerStats?.[c.id]?.totalSpend || 0).toFixed(2)}</td>
                    <td className="p-2.5 text-center">
                      {isSuperAdmin ? (
                        <button onClick={() => handleUnlinkCustomer(c.id)} className="px-2 py-1 bg-danger-soft text-danger-strong rounded-lg text-[10px] font-bold hover:bg-danger-soft transition-colors flex items-center gap-1 mx-auto">
                          <Unlink size={11}/> فك
                        </button>
                      ) : (
                        <button onClick={() => handleUnlinkCustomer(c.id)} className="px-2 py-1 bg-warning-soft text-warning-500 rounded-lg text-[10px] font-bold hover:bg-warning-soft transition-colors flex items-center gap-1 mx-auto">
                          <SendHorizontal size={11}/> طلب فك
                        </button>
                      )}
                    </td>
                  </tr>
                )) : <tr><td colSpan={5} className="p-4 text-center text-ink-400 italic text-xs">لا يوجد {customerSearch ? 'عملاء مطابقون' : 'عملاء تابعون'}</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Unlinked Customers */}
          <div className="px-4 pt-4 pb-1 border-t border-fill">
            <h4 className="text-xs font-bold text-assist-600 flex items-center gap-1"><UserPlus size={12}/> عملاء آخرون ({filteredUnlinked.length})</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-canvas text-ink-400 text-[10px] uppercase font-bold">
                <tr><th className="p-2.5">العميل</th><th className="p-2.5">الهاتف</th><th className="p-2.5">المحفظة</th><th className="p-2.5">الإنفاق</th><th className="p-2.5 text-center">إجراءات</th></tr>
              </thead>
              <tbody className="divide-y divide-fill text-sm">
                {filteredUnlinked.length > 0 ? filteredUnlinked.map(c => (
                  <tr key={c.id} className="hover:bg-assist-50/50">
                    <td className="p-2.5 font-bold text-ink-700">{safeRender(c.name)}</td>
                    <td className="p-2.5 font-mono text-xs text-ink-500">{safeRender(c.phone)}</td>
                    <td className="p-2.5 font-black text-brand-600">${(c.walletBalanceUSD || 0).toFixed(2)}</td>
                    <td className="p-2.5 font-black text-ink-700">${(customerStats?.[c.id]?.totalSpend || 0).toFixed(2)}</td>
                    <td className="p-2.5 text-center">
                      {isSuperAdmin ? (
                        <button onClick={() => handleLinkCustomerToMarketer(c.id, selectedMarketer.id)} className="px-2 py-1 bg-brand-50 text-brand-600 rounded-lg text-[10px] font-bold hover:bg-brand-100 transition-colors flex items-center gap-1 mx-auto">
                          <LinkIcon size={11}/> ربط
                        </button>
                      ) : (
                        <button onClick={() => handleLinkCustomerToMarketer(c.id, selectedMarketer.id)} className="px-2 py-1 bg-assist-50 text-assist-600 rounded-lg text-[10px] font-bold hover:bg-assist-100 transition-colors flex items-center gap-1 mx-auto">
                          <SendHorizontal size={11}/> طلب ربط
                        </button>
                      )}
                    </td>
                  </tr>
                )) : <tr><td colSpan={5} className="p-4 text-center text-ink-400 italic text-xs">لا يوجد {customerSearch ? 'عملاء مطابقون' : 'عملاء غير تابعين'}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Campaigns Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-hairline overflow-hidden">
          <div className="p-4 bg-canvas border-b border-hairline">
            <h3 className="font-bold text-ink-700 flex items-center gap-2 text-sm"><Briefcase size={16}/> الحملات ({myCampaigns.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-fill text-ink-500 text-[10px] uppercase font-bold">
                <tr><th className="p-3">الحملة</th><th className="p-3">الصفحة</th><th className="p-3">القيمة</th><th className="p-3">الحالة</th><th className="p-3">الدفع</th></tr>
              </thead>
              <tbody className="divide-y divide-fill text-sm">
                {myCampaigns.length > 0 ? myCampaigns.slice(0, 20).map(row => (
                  <tr key={row.id} className="hover:bg-canvas">
                    <td className="p-3 font-bold text-ink-700">{safeRender(row["اسم Ad"])}</td>
                    <td className="p-3 text-ink-500">{safeRender(row["اسم الصفحة"])}</td>
                    <td className="p-3 font-bold text-ink-800">${safeRender(row["القيمة"])}</td>
                    <td className="p-3"><span className="px-2 py-1 rounded text-[10px] font-bold bg-info-soft text-info-700">{safeRender(row["الحالة"])}</span></td>
                    <td className="p-3"><span className={`px-2 py-1 rounded text-[10px] font-bold ${row["الدفع"] === 'مدفوع' ? 'bg-brand-50 text-brand-700' : 'bg-danger-soft text-danger-strong'}`}>{safeRender(row["الدفع"])}</span></td>
                  </tr>
                )) : <tr><td colSpan={5} className="p-6 text-center text-ink-400 italic">لا توجد حملات مرتبطة</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(MarketerDetailView);
