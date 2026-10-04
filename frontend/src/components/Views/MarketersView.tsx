// @ts-nocheck
import { useState, useMemo, memo } from 'react';
import {
  Users, UserPlus, Plus, Trash2, Phone, Percent, Receipt, MoreVertical,
  Wallet, Banknote, CreditCard, Download, Search, LayoutGrid, List, History,
  Printer, CheckCircle2, TrendingUp, ArrowUpRight, Briefcase, X, Loader2,
  CircleDollarSign, Activity, Coins, Landmark, Edit3
} from 'lucide-react';
import { safeRender } from '../../utils';

const fmtUSD = (v) => '$' + Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtLYD = (v) => Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' د.ل';
const refCode = (m) => '#REF-' + String(m?.id || '').slice(-4).toUpperCase();
const payCode = (p) => '#PAY-' + String(p?.id || '').slice(-5).toUpperCase();

const AVATARS = [
  { bg: 'bg-brand-50 border-brand-100 text-brand-700' },
  { bg: 'bg-brand-50 border-brand-100 text-brand-700' },
  { bg: 'bg-assist-50 border-assist-100 text-assist-700' },
  { bg: 'bg-warning-soft border-warning-soft text-warning-500' },
];

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'pending', label: 'مستحقات معلقة' },
  { key: 'active', label: 'نشط هذا الشهر' },
  { key: 'new', label: 'مسوقون جدد' },
];

const MarketersView = ({ marketers, marketerStats, setSelectedMarketer, setCurrentView, setMarketerForm, toggleModal, requestDelete, payouts, setPayoutForm, globalExchangeRate, isSuperAdmin }) => {
  const rate = Number(globalExchangeRate) || 5;
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('all');
  const [mode, setMode] = useState('grid');
  const [selected, setSelected] = useState(new Set());
  const [exporting, setExporting] = useState(false);
  const [stmtRange, setStmtRange] = useState('30');

  const list = marketers || [];
  const statsOf = (m) => marketerStats?.[m.id] || { customerCount: 0, campaignCount: 0, totalRevenue: 0, totalCommission: 0, paid: 0, balance: 0 };

  const totals = useMemo(() => {
    let active = 0, fresh = 0, pending = 0, commission = 0, paid = 0, revenue = 0, campaigns = 0;
    list.forEach(m => {
      const s = statsOf(m);
      if ((s.customerCount || 0) > 0) active++;
      if ((s.customerCount || 0) === 0) fresh++;
      if ((s.balance || 0) > 0.001) pending++;
      commission += s.totalCommission || 0;
      paid += s.paid || 0;
      revenue += s.totalRevenue || 0;
      campaigns += s.campaignCount || 0;
    });
    return { active, fresh, pending, commission, paid, revenue, campaigns };
  }, [list, marketerStats]);

  const monthPaid = useMemo(() => {
    const now = new Date();
    return (payouts || []).reduce((sum, p) => {
      const t = p.createdAt?.seconds ? new Date(p.createdAt.seconds * 1000) : (p.createdAt ? new Date(p.createdAt) : null);
      if (!t || isNaN(t.getTime())) return sum;
      return (t.getFullYear() === now.getFullYear() && t.getMonth() === now.getMonth()) ? sum + (p.amount || 0) : sum;
    }, 0);
  }, [payouts]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return list.filter(m => {
      const s = statsOf(m);
      if (tab === 'pending' && !((s.balance || 0) > 0.001)) return false;
      if (tab === 'active' && !((s.campaignCount || 0) > 0)) return false;
      if (tab === 'new' && !((s.customerCount || 0) === 0)) return false;
      if (!needle) return true;
      return `${safeRender(m.name)}${safeRender(m.phone)}${safeRender(m.email)}${refCode(m)}`.toLowerCase().includes(needle);
    });
  }, [list, marketerStats, q, tab]);

  const countFor = (key) => {
    if (key === 'all') return list.length;
    if (key === 'pending') return list.filter(m => (statsOf(m).balance || 0) > 0.001).length;
    if (key === 'active') return list.filter(m => (statsOf(m).campaignCount || 0) > 0).length;
    return list.filter(m => (statsOf(m).customerCount || 0) === 0).length;
  };

  const toggleSel = (id) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(String(id));
    return next;
  });

  const selList = list.filter(m => selected.has(String(m.id)));

  const openPayout = (m) => {
    const s = statsOf(m);
    const amount = Math.max(0, s.balance || 0);
    setSelectedMarketer(m);
    setPayoutForm({ amount: amount ? amount.toFixed(2) : '', amountLYD: amount ? (amount * rate).toFixed(2) : '', note: '' });
    toggleModal('payout', true);
  };

  const exportCSV = () => {
    setExporting(true);
    const rows = selList.length ? selList : filtered;
    setTimeout(() => {
      const head = ['المسوق', 'الكود', 'الهاتف', 'العملاء', 'الحملات', 'نسبة العمولة', 'إجمالي الإيرادات ($)', 'العمولة ($)', 'المصروف ($)', 'الصافي ($)'];
      const lines = rows.map(m => {
        const s = statsOf(m);
        return [safeRender(m.name), refCode(m), safeRender(m.phone), s.customerCount, s.campaignCount, m.rate || 0, (s.totalRevenue || 0).toFixed(2), (s.totalCommission || 0).toFixed(2), (s.paid || 0).toFixed(2), (s.balance || 0).toFixed(2)];
      });
      const csv = '\uFEFF' + [head, ...lines].map(r => r.map(x => `"${String(x).replaceAll('"', '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'marketers-commissions.csv'; a.click();
      URL.revokeObjectURL(url);
      setExporting(false);
    }, 250);
  };

  const kpis = [
    {
      label: 'إجمالي المسوّقين', value: totals.active ? list.length : list.length, sub: `${totals.active} نشطون حالياً`,
      badge: `${totals.fresh} بدون عملاء`, icon: Users, iconCls: 'bg-fill border-hairline text-ink-700',
      valCls: 'text-ink-900', bar: list.length ? Math.round(totals.active / list.length * 100) : 0, barCls: 'bg-brand-600',
    },
    {
      label: 'مستحقات معلقة للصرف', value: fmtUSD(Math.max(0, totals.commission - totals.paid)), sub: `تعادل ${fmtLYD(Math.max(0, totals.commission - totals.paid) * rate)}`,
      badge: `${totals.pending} بانتظار التسوية`, icon: Coins, iconCls: 'bg-assist-50 border-assist-100 text-assist-600',
      valCls: 'text-assist-600', bar: totals.commission > 0 ? Math.round(Math.max(0, totals.commission - totals.paid) / totals.commission * 100) : 0, barCls: 'bg-assist-600',
    },
    {
      label: 'عمولات مصروفة (هذا الشهر)', value: fmtUSD(monthPaid), sub: `تعادل ${fmtLYD(monthPaid * rate)}`,
      badge: monthPaid > 0 ? 'تسويات مسجلة' : 'لا تسويات هذا الشهر', icon: Banknote, iconCls: 'bg-brand-50 border-brand-100 text-brand-700',
      valCls: 'text-brand-600', bar: totals.commission > 0 ? Math.min(100, Math.round(monthPaid / totals.commission * 100)) : 0, barCls: 'bg-brand-600',
    },
    {
      label: 'إيرادات عبر المسوقين', value: fmtUSD(totals.revenue), sub: `${fmtLYD(totals.revenue * rate)} إجمالي`,
      badge: `${totals.campaigns} حملة موكلة`, icon: Activity, iconCls: 'bg-brand-50 border-brand-100 text-brand-700',
      valCls: 'text-ink-900', bar: totals.revenue > 0 ? Math.min(100, Math.round(totals.campaigns / Math.max(1, totals.campaigns + totals.pending) * 100)) : 0, barCls: 'bg-brand-600',
    },
  ];

  const settlements = useMemo(() => {
    const all = (payouts || []).filter(p => !p.isDeleted);
    if (stmtRange === 'all') return all;
    const days = Number(stmtRange) || 30;
    const cutoff = Date.now() - days * 86400000;
    return all.filter(p => {
      const t = p.createdAt?.seconds ? p.createdAt.seconds * 1000 : (p.createdAt ? new Date(p.createdAt).getTime() : NaN);
      return !isNaN(t) && t >= cutoff;
    });
  }, [payouts, stmtRange]);

  const marketerName = (id) => {
    const m = list.find(x => x.id === id);
    return m ? safeRender(m.name) : 'مسوق محذوف';
  };

  const badgeOf = (m, s) => {
    if ((s.balance || 0) > 0.001) return { txt: 'مستحقات معلقة', cls: 'bg-assist-100 border border-assist-200 text-assist-800' };
    if ((s.customerCount || 0) === 0) return { txt: 'جديد', cls: 'bg-brand-100 border border-brand-200 text-brand-900' };
    if ((s.campaignCount || 0) > 0) return { txt: 'نشط', cls: 'bg-brand-100 border border-brand-200 text-brand-800' };
    return { txt: 'مكتمل التسوية', cls: 'bg-fill border border-hairline text-ink-600' };
  };

  const Card = ({ m, i }) => {
    const s = statsOf(m);
    const av = AVATARS[i % AVATARS.length];
    const b = badgeOf(m, s);
    const net = Math.max(0, s.balance || 0);
    const id = String(m.id);
    return (
      <article className={`relative flex flex-col justify-between rounded-2xl bg-white border border-hairline p-4 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${selected.has(id) ? 'ring-2 ring-brand-600/30 border-brand-300' : ''}`}>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <input type="checkbox" checked={selected.has(id)} onChange={() => toggleSel(id)} className="h-4 w-4 rounded accent-brand-700 cursor-pointer mt-1" />
              <div className={`relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border text-xl font-bold ${av.bg}`}>
                {safeRender(m.name).charAt(0)}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="font-bold text-ink-900 truncate">{safeRender(m.name)}</h3>
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${b.cls}`}>{b.txt}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-ink-500 font-mono" dir="ltr">
                  <span>{safeRender(m.phone)}</span>
                  <Phone size={12} className="text-ink-400" />
                </div>
              </div>
            </div>
            <span className="rounded-full bg-fill border border-hairline px-2 py-1 text-[10px] font-bold text-brand-800 shrink-0">{refCode(m)}</span>
          </div>

          <div className="grid grid-cols-3 gap-1 rounded-xl bg-canvas border border-fill p-2 text-center">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] sm:text-[11px] text-ink-500 font-medium truncate">العملاء</span>
              <span className="text-base sm:text-lg font-bold text-ink-900">{s.customerCount}</span>
            </div>
            <div className="flex flex-col min-w-0 border-x border-hairline/60">
              <span className="text-[10px] sm:text-[11px] text-ink-500 font-medium truncate">الحملات</span>
              <span className="text-base sm:text-lg font-bold text-ink-900">{s.campaignCount}</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] sm:text-[11px] text-ink-500 font-medium truncate">نسبة العمولة</span>
              <span className="text-base sm:text-lg font-bold text-brand-700">{m.rate || 0}%</span>
            </div>
          </div>

          <div className="space-y-1.5 rounded-xl bg-canvas/60 border border-fill p-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-ink-500">إجمالي الإيرادات المولدة:</span>
              <span className="font-bold font-mono text-ink-900">{fmtUSD(s.totalRevenue)}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-ink-500">العمولة الكلية المستحقة:</span>
              <span className="font-bold font-mono text-assist-600">{fmtUSD(s.totalCommission)}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-ink-500">المصروف سابقاً:</span>
              <span className="font-bold font-mono text-brand-700">{fmtUSD(s.paid)}</span>
            </div>
          </div>

          <div className={`flex flex-wrap items-center justify-between gap-2 rounded-xl p-3 border ${net > 0.001 ? 'bg-brand-50/60 border-brand-100' : 'bg-canvas border-hairline'}`}>
            <div className="flex flex-col min-w-0">
              <span className={`text-[11px] font-bold truncate ${net > 0.001 ? 'text-ink-800' : 'text-ink-600'}`}>الصافي المتبقي للصرف</span>
              <div className="flex items-baseline gap-1">
                <span className={`text-lg sm:text-xl font-extrabold font-mono truncate ${net > 0.001 ? 'text-assist-600' : 'text-brand-700'}`}>{fmtUSD(net)}</span>
                <span className="text-[11px] text-ink-500 font-mono font-medium">({fmtLYD(net * rate)})</span>
              </div>
            </div>
            {net > 0.001 ? (
              <button onClick={(e) => { e.stopPropagation(); openPayout(m); }} className="shrink-0 flex items-center gap-1.5 rounded-xl bg-brand-700 px-3.5 py-2 text-[11px] font-bold text-white shadow-sm hover:bg-brand-800 active:scale-95 transition-all">
                <Wallet size={15} /> تسوية وصرف
              </button>
            ) : (
              <span className="flex items-center gap-1.5 rounded-xl bg-white border border-hairline px-3.5 py-2 text-[11px] font-bold text-brand-700 shadow-sm">
                <CheckCircle2 size={15} /> مسدّد بالكامل
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-fill">
          <div className="flex items-center gap-1">
            <button onClick={() => { setSelectedMarketer(m); setCurrentView('marketer-detail'); }} className="flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:underline">
              <Receipt size={15} /> كشف الحساب التفصيلي
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => { setMarketerForm({ name: safeRender(m.name), phone: safeRender(m.phone), email: safeRender(m.email), rate: String(m.rate || ''), bankName: m.bankName || '', accountNum: m.accountNum || '' }); toggleModal('addMarketer', true); }} className="rounded-lg p-1.5 text-ink-400 hover:bg-fill hover:text-ink-700 transition-colors" title="تعديل النسبة أو البيانات">
              <Percent size={17} />
            </button>
            <button onClick={() => { setSelectedMarketer(m); setCurrentView('marketer-detail'); }} className="rounded-lg p-1.5 text-ink-400 hover:bg-fill hover:text-ink-700 transition-colors" title="مزيد من الخيارات">
              <MoreVertical size={17} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); requestDelete('marketer', m.id); }} className="rounded-lg p-1.5 text-hairline-strong hover:text-danger-500 hover:bg-danger-soft transition-colors" title="حذف">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        {isSuperAdmin && <div className="mt-3 text-[9px] text-ink-400 font-mono bg-canvas rounded-xl px-3 py-1.5 text-center">👤 {safeRender(m.ownerEmail).split('@')[0]}</div>}
      </article>
    );
  };

  return (
    <div className="flex-1 bg-canvas p-3 sm:p-4 md:p-6 overflow-auto" dir="rtl">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-500 flex items-center justify-center shadow-lg shadow-brand-900/10">
              <Users size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-ink-800">لوحة إدارة المسوّقين وعمولاتهم</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-black bg-brand-100 text-brand-800 px-2 py-0.5 rounded-md">v8.5 Prod</span>
                <p className="text-xs text-ink-500">تتبّع العمولات · متابعة الأداء · تسويات مالية موثّقة</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-hairline text-[11px] font-bold text-ink-600 shadow-sm">
              <CircleDollarSign size={14} className="text-brand-600" /> سعر الصرف: <span className="font-mono" style={{ direction: 'ltr' }}>{rate.toFixed(2)} د.ل / $</span>
            </span>
            <button onClick={() => { setMarketerForm({ name: "", phone: "", email: "", rate: "", bankName: "", accountNum: "" }); toggleModal('addMarketer', true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-700 text-white text-xs font-bold shadow-md hover:bg-brand-800 active:scale-95 transition-all">
              <UserPlus size={16} /> إضافة مسوّق جديد
            </button>
          </div>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map(k => (
            <div key={k.label} className="group relative overflow-hidden rounded-2xl bg-white border border-hairline/90 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] uppercase text-ink-500 font-semibold">{k.label}</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-2xl font-extrabold font-mono ${k.valCls}`} style={{ direction: 'ltr' }}>{k.value}</span>
                  </div>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${k.iconCls}`}>
                  <k.icon size={22} />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-[11px]">
                <span className="font-mono text-ink-600 font-semibold" style={{ direction: 'ltr' }}>{k.sub}</span>
                <span className="rounded-full bg-fill border border-hairline px-2 py-0.5 text-[10px] font-bold text-ink-600">{k.badge}</span>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-fill">
                <div className={`h-full rounded-full ${k.barCls}`} style={{ width: `${k.bar}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl bg-white border border-hairline/90 p-4 shadow-sm">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1">
              <Search size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="بحث باسم المسوق، رقم الهاتف، أو كود الإحالة..."
                className="w-full rounded-xl bg-canvas border border-hairline py-2 pl-3 pr-10 text-xs text-ink-900 placeholder:text-ink-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1 rounded-xl bg-fill border border-hairline/80 p-1">
              {FILTERS.map(f => {
                const active = tab === f.key;
                return (
                  <button key={f.key} onClick={() => { setTab(f.key); setSelected(new Set()); }} className={`rounded-lg px-3 py-1.5 text-[11px] transition-all ${active ? 'bg-white font-bold text-brand-700 shadow-sm border border-hairline/80' : 'text-ink-600 hover:text-ink-900 font-medium'}`}>
                    {f.label} ({countFor(f.key)})
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <div className="flex items-center rounded-xl bg-fill border border-hairline p-1">
              <button onClick={() => setMode('grid')} className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${mode === 'grid' ? 'bg-white text-brand-700 shadow-sm border border-hairline/60' : 'text-ink-600 hover:text-ink-900'}`} title="عرض الشبكة"><LayoutGrid size={17} /></button>
              <button onClick={() => setMode('table')} className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${mode === 'table' ? 'bg-white text-brand-700 shadow-sm border border-hairline/60' : 'text-ink-600 hover:text-ink-900'}`} title="عرض الجدول"><List size={17} /></button>
            </div>
            <button onClick={exportCSV} className="flex items-center gap-1.5 rounded-xl bg-canvas border border-hairline px-3.5 py-2 text-[11px] font-bold text-ink-700 hover:bg-fill transition-colors shadow-sm">
              {exporting ? <Loader2 size={17} className="animate-spin" /> : <Download size={17} />} تصدير كشف
            </button>
          </div>
        </div>

        {/* Bulk tray */}
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand-100 border border-brand-300 p-3 px-4 shadow-sm">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={e => setSelected(e.target.checked ? new Set(filtered.map(m => String(m.id))) : new Set())} className="h-4 w-4 rounded accent-brand-700 cursor-pointer" />
                <span className="text-xs font-bold text-brand-950">تحديد الكل</span>
              </label>
              <span className="h-4 w-px bg-brand-700/20" />
              <span className="text-[11px] font-semibold text-brand-900">تم تحديد ({selected.size}) مسوّق</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { const t = selList.find(m => (statsOf(m).balance || 0) > 0.001) || selList[0]; if (t) openPayout(t); }} disabled={selList.length !== 1} title={selList.length !== 1 ? 'التسوية تُنفَّد لمسوّق واحد في كل مرة' : 'تسوية العمولة'} className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[11px] font-bold transition-all ${selList.length === 1 ? 'bg-brand-700 text-white shadow-sm hover:bg-brand-800' : 'bg-brand-700/40 text-white cursor-not-allowed'}`}>
                <CreditCard size={15} /> تسوية وصرف المحدد
              </button>
              <button onClick={exportCSV} className="flex items-center gap-1.5 rounded-lg bg-white border border-brand-200 px-3 py-1.5 text-[11px] font-bold text-ink-700 shadow-sm hover:bg-canvas transition-all">
                <Printer size={15} /> طباعة إيصالات الصرف
              </button>
              <button onClick={() => setSelected(new Set())} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold text-ink-600 hover:text-ink-900 transition-colors"><X size={14} /></button>
            </div>
          </div>
        )}

        {/* Content */}
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-ink-400">
            <Briefcase size={48} className="mb-4 opacity-50" />
            <p className="font-bold text-lg">لا يوجد مسوّقون بعد</p>
            <p className="text-sm">أضف أول مسوّق لبدء تتبّع العمولات</p>
          </div>
        ) : mode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((m, i) => <Card key={String(m.id)} m={m} i={i} />)}
            {filtered.length === 0 && <div className="col-span-full text-center py-16 text-ink-400 font-bold text-sm">لا يوجد مسوّقون مطابقون للفلترة</div>}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-hairline/90 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[680px] w-full text-right border-collapse text-sm">
                <thead>
                  <tr className="bg-canvas border-b border-hairline text-[11px] font-bold text-ink-700">
                    <th className="p-3"></th>
                    <th className="p-3">المسوّق</th>
                    <th className="p-3 text-center">العملاء</th>
                    <th className="p-3 text-center">الحملات</th>
                    <th className="p-3 text-center">النسبة</th>
                    <th className="p-3">الإيرادات</th>
                    <th className="p-3">العمولة</th>
                    <th className="p-3">المصروف</th>
                    <th className="p-3">الصافي</th>
                    <th className="p-3 pl-5 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filtered.length === 0 && <tr><td colSpan={10} className="p-12 text-center text-ink-400 font-bold text-sm">لا يوجد مسوّقون مطابقون للفلترة</td></tr>}
                  {filtered.map((m, i) => {
                    const s = statsOf(m);
                    const net = Math.max(0, s.balance || 0);
                    const id = String(m.id);
                    return (
                      <tr key={id} className={`hover:bg-canvas/80 transition-colors ${selected.has(id) ? 'bg-brand-50/40' : ''}`}>
                        <td className="p-3">
                          <input type="checkbox" checked={selected.has(id)} onChange={() => toggleSel(id)} className="h-4 w-4 rounded accent-brand-700 cursor-pointer" />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <span className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-bold ${AVATARS[i % AVATARS.length].bg}`}>{safeRender(m.name).charAt(0)}</span>
                            <div>
                              <p className="font-bold text-ink-900 text-xs">{safeRender(m.name)}</p>
                              <p className="text-[10px] text-ink-400 font-mono" dir="ltr">{refCode(m)} · {safeRender(m.phone)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-ink-700">{s.customerCount}</td>
                        <td className="p-3 text-center font-mono font-bold text-ink-700">{s.campaignCount}</td>
                        <td className="p-3 text-center font-mono font-bold text-brand-700">{m.rate || 0}%</td>
                        <td className="p-3 font-mono font-bold text-ink-900" style={{ direction: 'ltr' }}>{fmtUSD(s.totalRevenue)}</td>
                        <td className="p-3 font-mono font-bold text-assist-600" style={{ direction: 'ltr' }}>{fmtUSD(s.totalCommission)}</td>
                        <td className="p-3 font-mono font-bold text-brand-700" style={{ direction: 'ltr' }}>{fmtUSD(s.paid)}</td>
                        <td className={`p-3 font-mono font-bold ${net > 0.001 ? 'text-warning-500' : 'text-ink-400'}`} style={{ direction: 'ltr' }}>{fmtUSD(net)}</td>
                        <td className="p-3 pl-5">
                          <div className="flex items-center gap-1 justify-center">
                            {net > 0.001 && <button onClick={() => openPayout(m)} className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50" title="تسوية وصرف"><Wallet size={15} /></button>}
                            <button onClick={() => { setSelectedMarketer(m); setCurrentView('marketer-detail'); }} className="rounded-lg p-1.5 text-ink-500 hover:text-brand-700 hover:bg-fill" title="كشف الحساب"><Receipt size={15} /></button>
                            <button onClick={() => { setMarketerForm({ name: safeRender(m.name), phone: safeRender(m.phone), email: safeRender(m.email), rate: String(m.rate || ''), bankName: m.bankName || '', accountNum: m.accountNum || '' }); toggleModal('addMarketer', true); }} className="rounded-lg p-1.5 text-ink-500 hover:text-assist-600 hover:bg-fill" title="تعديل"><Edit3 size={15} /></button>
                            <button onClick={() => requestDelete('marketer', m.id)} className="rounded-lg p-1.5 text-hairline-strong hover:text-danger-500 hover:bg-danger-soft" title="حذف"><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settlements ledger */}
        <div className="space-y-4 rounded-2xl bg-white border border-hairline/90 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <History size={20} className="text-brand-700" />
                <h3 className="font-bold text-ink-900">سجل تسويات وصرف العمولات الأخيرة</h3>
              </div>
              <p className="text-[11px] text-ink-500">توثيق مالي مزدوج لعمليات التسوية مع طرق الدفع المنفذة.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-ink-500 font-medium">عرض:</span>
              <select value={stmtRange} onChange={e => setStmtRange(e.target.value)} className="rounded-lg bg-canvas border border-hairline px-3 py-1.5 text-[11px] text-ink-800 focus:outline-none focus:ring-1 focus:ring-brand-500">
                <option value="30">آخر 30 يوم</option>
                <option value="90">الربع الحالي</option>
                <option value="all">كامل السنة المالية</option>
              </select>
              <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-lg bg-canvas border border-hairline px-3.5 py-1.5 text-[11px] font-bold text-ink-700 hover:bg-fill transition-colors shadow-sm">
                <Printer size={15} /> طباعة ميزان العمولات
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-hairline">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-canvas border-b border-hairline text-[11px] font-bold text-ink-700">
                  <th className="p-4">رقم الإيصال / السند</th>
                  <th className="p-4">المسوّق المستفيد</th>
                  <th className="p-4">المبلغ المصروف ($ USD)</th>
                  <th className="p-4">القيمة بالدينار (LYD)</th>
                  <th className="p-4">سعر الصرف</th>
                  <th className="p-4">طريقة التسوية</th>
                  <th className="p-4">تاريخ العملية</th>
                  <th className="p-4">حالة الصرف</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline text-xs">
                {settlements.length === 0 && (
                  <tr><td colSpan={9} className="p-10 text-center text-ink-400 font-bold">لا توجد تسويات مسجلة في هذه الفترة</td></tr>
                )}
                {settlements.slice(0, 12).map((p, i) => {
                  const m = list.find(x => x.id === p.marketerId);
                  const t = p.createdAt?.seconds ? new Date(p.createdAt.seconds * 1000) : (p.createdAt ? new Date(p.createdAt) : null);
                  return (
                    <tr key={p.id} className="hover:bg-canvas/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-brand-700" style={{ direction: 'ltr' }}>{payCode(p)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`flex h-7 w-7 items-center justify-center rounded-lg border text-[12px] font-bold ${AVATARS[i % AVATARS.length].bg}`}>{marketerName(p.marketerId).charAt(0)}</span>
                          <span className="font-bold text-ink-900">{marketerName(p.marketerId)}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-ink-900" style={{ direction: 'ltr' }}>{fmtUSD(p.amount)}</td>
                      <td className="p-4 font-mono text-ink-600 font-medium" style={{ direction: 'ltr' }}>{fmtLYD(p.amountLYD || (p.amount || 0) * rate)}</td>
                      <td className="p-4 font-mono text-ink-600" style={{ direction: 'ltr' }}>{rate.toFixed(2)}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 rounded bg-fill border border-hairline px-2 py-0.5 text-[11px] text-ink-800 font-medium">
                          {m?.bankName ? <Landmark size={13} /> : <Banknote size={13} />} {safeRender(p.note) || (m?.bankName ? `تحويل مصرفي (${safeRender(m.bankName)})` : 'تسليم نقدي (الخزينة)')}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-ink-600" style={{ direction: 'ltr' }}>{t && !isNaN(t.getTime()) ? t.toLocaleString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' + t.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td className="p-4">
                        <span className="rounded-full bg-brand-100 border border-brand-200 px-2 py-0.5 text-[10px] font-bold text-brand-800">مكتمل ومعتمد</span>
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => { if (m) { setSelectedMarketer(m); setCurrentView('marketer-detail'); } }} className="rounded-lg p-1 text-ink-500 hover:text-brand-700 hover:bg-fill transition-colors" title="عرض حساب المسوّق">
                          <Receipt size={17} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {settlements.length > 12 && (
            <p className="text-center text-[11px] text-ink-400 font-bold">عرض {Math.min(12, settlements.length)} من أصل {settlements.length} عملية تسوية معتمدة</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(MarketersView);