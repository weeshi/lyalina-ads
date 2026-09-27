// @ts-nocheck
import { memo, useMemo } from 'react';
import { Activity, Users, DollarSign, Package, TrendingUp, Wallet, CheckCircle, Clock, AlertTriangle, BarChart3, PieChart, Target, Award } from 'lucide-react';

const AnalyticsView = ({ data, customers, customerStats, packages, marketerStats, marketers }) => {
  const activeData = useMemo(() => data.filter(r => !r.isDeleted), [data]);
  const {
    totalCampaigns, activeCampaigns, completedCampaigns, stoppedCampaigns,
    paidCampaigns, unpaidCampaigns, totalRevenue, totalUnpaid, totalPaid, totalPages
  } = useMemo(() => {
    let active = 0, completed = 0, stopped = 0, paid = 0, unpaid = 0;
    let revenue = 0, unpaidsum = 0, paidsum = 0;
    const pagesSet = new Set();
    for (const r of activeData) {
      if (r["الحالة"] === 'نشط') active++;
      else if (r["الحالة"] === 'مكتمل') completed++;
      else if (r["الحالة"] === 'متوقف') stopped++;
      if (r["الدفع"] === 'مدفوع') { paid++; paidsum += parseFloat(r["القيمة"]) || 0; }
      else if (r["الدفع"] === 'غير مدفوع') { unpaid++; unpaidsum += parseFloat(r["القيمة"]) || 0; }
      revenue += parseFloat(r["القيمة"]) || 0;
      if (r["اسم الصفحة"]) pagesSet.add(r["اسم الصفحة"]);
    }
    return {
      totalCampaigns: activeData.length, activeCampaigns: active, completedCampaigns: completed,
      stoppedCampaigns: stopped, paidCampaigns: paid, unpaidCampaigns: unpaid,
      totalRevenue: revenue, totalUnpaid: unpaidsum, totalPaid: paidsum, totalPages: pagesSet.size,
    };
  }, [activeData]);
  const totalCustomers = customers.length;
  const totalWalletBalance = customers.reduce((sum, c) => sum + (c.walletBalanceUSD || 0), 0);
  const packageCount = packages.length;
  const marketerCount = marketers.length;
  const totalCommissions = Object.values(marketerStats).reduce((sum, s) => sum + (s.balance || 0), 0);

  const cards = [
    { title: 'إجمالي الحملات', value: totalCampaigns, icon: BarChart3, color: 'bg-blue-600', textColor: 'text-blue-600', bgLight: 'bg-blue-50' },
    { title: 'نشطة حالياً', value: activeCampaigns, icon: Activity, color: 'bg-emerald-600', textColor: 'text-emerald-600', bgLight: 'bg-emerald-50' },
    { title: 'مكتملة', value: completedCampaigns, icon: CheckCircle, color: 'bg-teal-600', textColor: 'text-teal-600', bgLight: 'bg-teal-50' },
    { title: 'متوقفة', value: stoppedCampaigns, icon: AlertTriangle, color: 'bg-rose-600', textColor: 'text-rose-600', bgLight: 'bg-rose-50' },
    { title: 'مدفوعة', value: paidCampaigns, icon: DollarSign, color: 'bg-emerald-600', textColor: 'text-emerald-600', bgLight: 'bg-emerald-50' },
    { title: 'غير مدفوعة', value: unpaidCampaigns, icon: Clock, color: 'bg-amber-600', textColor: 'text-amber-600', bgLight: 'bg-amber-50' },
    { title: 'العملاء', value: totalCustomers, icon: Users, color: 'bg-indigo-600', textColor: 'text-indigo-600', bgLight: 'bg-indigo-50' },
    { title: 'الصفحات', value: totalPages, icon: Target, color: 'bg-violet-600', textColor: 'text-violet-600', bgLight: 'bg-violet-50' },
    { title: 'المسوقين', value: marketerCount, icon: Award, color: 'bg-orange-600', textColor: 'text-orange-600', bgLight: 'bg-orange-50' },
  ];

  return (
    <div className="flex-1 bg-slate-50 p-4 md:p-6 overflow-auto">
      <div className="max-w-7xl mx-auto pb-20">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-emerald-100 p-3 rounded-2xl"><Activity size={28} className="text-emerald-600" /></div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">لوحة التحليلات</h2>
            <p className="text-sm text-slate-500">نظرة عامة على أداء الحملات والمؤشرات الرئيسية</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {cards.map((card, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all">
              <div className={`${card.bgLight} p-3 rounded-xl w-fit mb-3`}>
                <card.icon size={20} className={card.textColor} />
              </div>
              <p className="text-3xl font-black text-slate-800">{card.value}</p>
              <p className="text-xs text-slate-500 font-bold mt-1">{card.title}</p>
            </div>
          ))}
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-3xl p-6 text-white shadow-xl">
            <p className="text-emerald-200 text-sm font-bold mb-2 flex items-center gap-2"><DollarSign size={16}/> إجمالي الإيرادات</p>
            <h3 className="text-4xl font-black">${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-6 text-white shadow-xl">
            <p className="text-blue-200 text-sm font-bold mb-2 flex items-center gap-2"><CheckCircle size={16}/> الإيرادات المحصلة</p>
            <h3 className="text-4xl font-black">${totalPaid.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-3xl p-6 text-white shadow-xl">
            <p className="text-amber-200 text-sm font-bold mb-2 flex items-center gap-2"><Clock size={16}/> المستحقات غير المدفوعة</p>
            <h3 className="text-4xl font-black">${totalUnpaid.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-bold">رصيد المحافظ الإجمالي</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">${totalWalletBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl"><Wallet size={24} className="text-emerald-500"/></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-bold">الباقات المتاحة</p>
                <p className="text-2xl font-black text-indigo-600 mt-1">{packageCount}</p>
              </div>
              <div className="bg-indigo-50 p-3 rounded-xl"><Package size={24} className="text-indigo-500"/></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-bold">إجمالي العمولات المستحقة</p>
                <p className="text-2xl font-black text-amber-600 mt-1">${totalCommissions.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-xl"><TrendingUp size={24} className="text-amber-500"/></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-bold">متوسط قيمة الحملة</p>
                <p className="text-2xl font-black text-rose-600 mt-1">${totalCampaigns > 0 ? (totalRevenue / totalCampaigns).toFixed(2) : '0.00'}</p>
              </div>
              <div className="bg-rose-50 p-3 rounded-xl"><PieChart size={24} className="text-rose-500"/></div>
            </div>
          </div>
        </div>

        {/* Campaign Status Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><BarChart3 size={20} className="text-emerald-600"/> توزيع الحملات حسب الحالة</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'نشط', count: activeCampaigns, color: 'bg-emerald-500', percent: totalCampaigns > 0 ? (activeCampaigns / totalCampaigns * 100).toFixed(1) : 0 },
              { label: 'قيد المراجعة', count: data.filter(r => r["الحالة"] === 'قيد المراجعة' && !r.isDeleted).length, color: 'bg-amber-500' },
              { label: 'مكتمل', count: completedCampaigns, color: 'bg-blue-500' },
              { label: 'متوقف', count: stoppedCampaigns, color: 'bg-red-500' },
            ].map((item, i) => {
              const pct = totalCampaigns > 0 ? (item.count / totalCampaigns * 100).toFixed(1) : 0;
              return (
                <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-700 text-sm">{item.label}</span>
                    <span className="font-black text-slate-800">{item.count}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div className={`${item.color} h-full rounded-full transition-all duration-500`} style={{width: `${pct}%`}}></div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-bold">{pct}% من الإجمالي</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Pages */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Target size={20} className="text-emerald-600"/> أعلى الصفحات إنفاقاً</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-100 text-slate-500 text-[10px] uppercase font-bold">
                <tr><th className="p-3">#</th><th className="p-3">اسم الصفحة</th><th className="p-3">عدد الحملات</th><th className="p-3">إجمالي الإنفاق</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {(() => {
                  const pageStats = {};
                  data.filter(r => !r.isDeleted).forEach(r => {
                    const page = r["اسم الصفحة"];
                    if (!page) return;
                    if (!pageStats[page]) pageStats[page] = { count: 0, total: 0 };
                    pageStats[page].count++;
                    pageStats[page].total += parseFloat(r["القيمة"]) || 0;
                  });
                  return Object.entries(pageStats).sort((a, b) => b[1].total - a[1].total).slice(0, 10).map(([page, stats], i) => (
                    <tr key={page} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-400">{i + 1}</td>
                      <td className="p-3 font-bold text-slate-700">{page}</td>
                      <td className="p-3 font-bold text-slate-600">{stats.count}</td>
                      <td className="p-3 font-black text-emerald-600">${stats.total.toFixed(2)}</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(AnalyticsView);
