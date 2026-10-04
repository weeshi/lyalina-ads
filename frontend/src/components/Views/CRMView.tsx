// @ts-nocheck
import { useState, useMemo, memo } from 'react';
import {
  Users, UserPlus, Plus, Trash2, Wallet, Search, ChevronDown, CreditCard,
  Phone, Mail, LayoutGrid, List, Download, MessageCircle, Edit3,
  Coins, Banknote, Activity, Layers, X, Check, CircleDollarSign, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Loader2
} from 'lucide-react';
import { safeRender } from '../../utils';

const fmtUSD = (v) => '$' + Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const cleanPhone = (p) => String(p || '').replace(/[^\d]/g, '');

const FILTERS = [
  { key: 'all', label: 'جميع العملاء' },
  { key: 'positive', label: 'محافظ موجبة' },
  { key: 'zero', label: 'رصيد صفر' },
  { key: 'debt', label: 'عليهم ديون' },
];

const categoryOf = (cust, stats) => {
  const due = stats.due || 0;
  const bal = cust.walletBalanceUSD || 0;
  if (due > 0) return { key: 'debt', label: 'عليه ديون', cls: 'bg-warning-soft text-warning-800', dot: 'bg-warning-500' };
  if (bal > 0) return { key: 'positive', label: 'محفظة موجبة', cls: 'bg-brand-100 text-brand-800', dot: 'bg-brand-500' };
  return { key: 'zero', label: 'رصيد صفر', cls: 'bg-fill text-ink-600', dot: 'bg-ink-400' };
};

const CRMView = ({ customers, customerStats, setSelectedCustomer, setCurrentView, setCustomerForm, toggleModal, requestDelete, isSuperAdmin, globalExchangeRate }) => {
  const rate = Number(globalExchangeRate) || 5;
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('all');
  const [mode, setMode] = useState('cards');
  const [selected, setSelected] = useState(new Set());
  const [exporting, setExporting] = useState(false);

  const customersArray = customers || [];

  const stats = useMemo(() => {
    let wallet = 0, spend = 0, due = 0, count = 0, positive = 0, zero = 0, debtCount = 0;
    customersArray.forEach(c => {
      const s = customerStats[c.id] || { totalSpend: 0, due: 0, count: 0 };
      const bal = c.walletBalanceUSD || 0;
      wallet += bal;
      spend += s.totalSpend || 0;
      due += s.due || 0;
      count += s.count || 0;
      if (bal > 0) positive++;
      else zero++;
      if ((s.due || 0) > 0) debtCount++;
    });
    return { total: customersArray.length, wallet, spend, due, count, positive, zero, debtCount };
  }, [customersArray, customerStats]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return customersArray.filter(c => {
      if (tab === 'positive' && !((c.walletBalanceUSD || 0) > 0)) return false;
      if (tab === 'zero' && !((c.walletBalanceUSD || 0) <= 0)) return false;
      if (tab === 'debt' && !((customerStats[c.id]?.due || 0) > 0)) return false;
      if (!needle) return true;
      const hay = `${safeRender(c.name)}${safeRender(c.phone)}${safeRender(c.email)}${(c.linkedPages || []).join(' ')}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [customersArray, customerStats, q, tab]);

  const toggleSel = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selList = customersArray.filter(c => selected.has(String(c.id)));

  const exportCSV = () => {
    setExporting(true);
    const rows = selList.length ? selList : filtered;
    setTimeout(() => {
      const head = ['العميل', 'الهاتف', 'البريد', 'رصيد المحفظة ($)', 'رصيد المحفظة (د.ل)', 'إجمالي الصرف ($)', 'الديون ($)', 'عدد الحملات', 'الصفحات'];
      const lines = rows.map(c => {
        const s = customerStats[c.id] || { totalSpend: 0, due: 0, count: 0 };
        return [safeRender(c.name), safeRender(c.phone), safeRender(c.email), (c.walletBalanceUSD || 0).toFixed(2), ((c.walletBalanceUSD || 0) * rate).toFixed(2), (s.totalSpend || 0).toFixed(2), (s.due || 0).toFixed(2), s.count || 0, (c.linkedPages || []).join(' | ')];
      });
      const csv = '\uFEFF' + [head, ...lines].map(r => r.map(x => `"${String(x).replaceAll('"', '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'customers-report.csv'; a.click();
      URL.revokeObjectURL(url);
      setExporting(false);
    }, 250);
  };

  const waReminder = () => {
    const target = selList.length ? selList : filtered;
    const first = target.find(c => (customerStats[c.id]?.due || 0) > 0) || target[0];
    if (!first || !cleanPhone(first.phone)) return;
    const dueUrl = customerStats[first.id]?.due || 0;
    const msg = encodeURIComponent(`مرحباً ${safeRender(first.name)}، نود تذكيرك بوجود مبلغ مستحق ${fmtUSD(dueUrl)} لدى وكالة LYALINA للإعلانات الرقمية. الثنائي الممكن: LYALINA-ADS`);
    window.open(`https://wa.me/${cleanPhone(first.phone)}?text=${msg}`, '_blank');
  };

  const echSub = (c) => `${(c.linkedPages || []).length} صفحة مرتبطة`;

  const heroCards = [
    {
      title: 'إجمالي العملاء النشطين', icon: Users, value: stats.total, accent: 'from-brand-700 to-brand-500',
      sub: `${stats.positive} محفظة موجبة · ${stats.debtCount} بديون`, badge: { txt: 'إجمالي المسجلين', up: true },
      bar: { pct: stats.total ? Math.round(stats.positive / stats.total * 100) : 0, txt: 'العملاء النشطون' },
    },
    {
      title: 'إجمالي أرصدة المحافظ', icon: CircleDollarSign, value: fmtUSD(stats.wallet), accent: 'from-info-700 via-info-500 to-brand-500',
      sub: `≈ ${Number(stats.wallet * rate).toLocaleString('en-US', { maximumFractionDigits: 0 })} د.ل`, badge: { txt: 'محافظ إلكترونية', up: true },
      bar: { pct: stats.total ? Math.round(stats.positive / stats.total * 100) : 0, txt: 'محافظ برصيد موجبة' },
    },
    {
      title: 'الدفعات المستحقة', icon: Coins, value: fmtUSD(stats.due), accent: 'from-warning-500 via-warning-500 to-warning-500',
      sub: `${stats.debtCount} حساب عليه ديون`, badge: { txt: 'يتطلب متابعة', up: false },
      bar: { pct: stats.spend > 0 ? Math.round(stats.due / stats.spend * 100) : 0, txt: 'حصة المستحقات من الصرف' },
    },
    {
      title: 'نشاط حملات العملاء', icon: Layers, value: stats.count, accent: 'from-assist-700 via-assist-600 to-assist-500',
      sub: `صرف إجمالي ${fmtUSD(stats.spend)}`, badge: { txt: 'دوران مستقر', up: true },
      bar: { pct: Math.min(100, stats.total ? Math.round(stats.count / (stats.total * 2) * 100) : 0), txt: 'كثافة الحملات' },
    },
  ];

  const CustomerCard = ({ cust }) => {
    const s = customerStats[cust.id] || { totalSpend: 0, due: 0, count: 0 };
    const cat = categoryOf(cust, s);
    const bal = cust.walletBalanceUSD || 0;
    const openAccount = () => { setSelectedCustomer(cust); setCurrentView('customer-detail'); };
    return (
      <div
        onClick={openAccount}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAccount(); } }}
        role="button"
        tabIndex={0}
        aria-label={`فتح حساب ${safeRender(cust.name)}`}
        className="group bg-white rounded-3xl border border-hairline/80 p-4 sm:p-5 shadow-sm hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 transition-all cursor-pointer relative overflow-hidden"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-brand-600 via-brand-400 to-info-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative shrink-0">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-brand-900/10">
                {safeRender(cust.name).charAt(0)}
              </div>
              <span className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white ${cat.dot}`} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-ink-800 truncate">{safeRender(cust.name)}</h3>
              <p className="text-[11px] text-ink-400 font-mono mt-0.5 truncate" style={{ direction: 'ltr' }}>{safeRender(cust.phone)}</p>
            </div>
          </div>
          <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold ${cat.cls}`}>{cat.label}</span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-600 text-white px-3 sm:px-4 py-3 shadow-lg shadow-brand-900/10">
          <div className="min-w-0">
            <p className="text-[9px] text-brand-100/80 font-bold uppercase">رصيد المحفظة</p>
            <p className="text-lg sm:text-xl font-black font-mono mt-0.5 truncate" style={{ direction: 'ltr' }}>{fmtUSD(bal)}</p>
            <p className="text-[9px] text-brand-100/70 font-mono truncate" style={{ direction: 'ltr' }}>≈ {Number(bal * rate).toLocaleString('en-US', { maximumFractionDigits: 0 })} د.ل</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedCustomer(cust); toggleModal('topUp', true); }}
            className="shrink-0 flex items-center gap-1.5 bg-white text-brand-700 px-3 py-2 rounded-xl text-xs font-bold shadow hover:bg-brand-50 transition-all"
          >
            <Plus size={14} /> شحن
          </button>
        </div>

        {(cust.linkedPages || []).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(cust.linkedPages || []).slice(0, 3).map(pg => (
              <span key={pg} className="flex items-center gap-1 text-[9px] font-bold bg-canvas border border-fill text-ink-500 px-2 py-0.5 rounded-lg">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> {pg}
              </span>
            ))}
            {(cust.linkedPages || []).length > 3 && <span className="text-[9px] font-bold text-ink-400 self-center">+{(cust.linkedPages || []).length - 3}</span>}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 border-t border-fill pt-4">
          <div className="min-w-0">
            <p className="text-[9px] text-ink-400 font-bold">الديون السابقة</p>
            <p className={`font-black text-sm font-mono mt-0.5 truncate ${(s.due || 0) > 0 ? 'text-warning-500' : 'text-ink-400'}`} style={{ direction: 'ltr' }}>{fmtUSD(s.due)}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[9px] text-ink-400 font-bold">إجمالي الصرف</p>
            <p className="font-black text-sm font-mono mt-0.5 text-ink-700 truncate" style={{ direction: 'ltr' }}>{fmtUSD(s.totalSpend)}</p>
          </div>
          <div>
            <p className="text-[9px] text-ink-400 font-bold">حملات</p>
            <p className="font-black text-sm font-mono mt-0.5 text-ink-700" style={{ direction: 'ltr' }}>{s.count}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-fill pt-4">
          <div className="flex items-center gap-1.5">
            <button onClick={(e) => { e.stopPropagation(); if (cleanPhone(cust.phone)) window.open(`https://wa.me/${cleanPhone(cust.phone)}`, '_blank'); }} className="text-[10px] font-bold text-brand-600 hover:bg-brand-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"><MessageCircle size={13} /> واتساب</button>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); setCustomerForm({ name: safeRender(cust.name), phone: safeRender(cust.phone), email: safeRender(cust.email), marketerId: cust.marketerId || '', walletBalanceUSD: cust.walletBalanceUSD || 0 }); toggleModal('addCustomer', true); }} className="text-ink-400 hover:text-assist-600 p-1.5 hover:bg-assist-50 rounded-lg transition-colors" title="تعديل"><Edit3 size={14} /></button>
            <button onClick={(e) => { e.stopPropagation(); requestDelete('customer', cust.id); }} className="text-hairline-strong hover:text-danger-500 p-1.5 hover:bg-danger-soft rounded-lg transition-colors" title="حذف"><Trash2 size={14} /></button>
          </div>
        </div>
        {isSuperAdmin && (
          <div className="mt-3 text-[9px] text-ink-400 font-mono bg-canvas rounded-xl px-3 py-1.5 text-center">👤 {safeRender(cust.ownerEmail).split('@')[0]}</div>
        )}
      </div>
    );
  };

  const tableRow = (cust, i) => {
    const s = customerStats[cust.id] || { totalSpend: 0, due: 0, count: 0 };
    const cat = categoryOf(cust, s);
    const id = String(cust.id);
    return (
      <tr
        key={id}
        onClick={() => { setSelectedCustomer(cust); setCurrentView('customer-detail'); }}
        className={`hover:bg-brand-50/30 transition-colors cursor-pointer ${selected.has(id) ? 'bg-brand-50/60' : ''}`}
      >
        <td className="p-3 pr-5">
          <button onClick={(e) => { e.stopPropagation(); toggleSel(id); }} className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${selected.has(id) ? 'bg-brand-600 border-brand-600 text-white' : 'border-hairline-strong text-transparent hover:border-brand-400'}`}>
            <Check size={12} strokeWidth={4} />
          </button>
        </td>
        <td className="p-3">
          <div className="flex items-center gap-3 min-w-[180px]">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-700 to-brand-500 flex items-center justify-center text-white font-bold text-sm shrink-0">{safeRender(cust.name).charAt(0)}</div>
            <div>
              <p className="font-bold text-ink-800 text-sm">{safeRender(cust.name)}</p>
              <p className="text-[10px] text-ink-400 font-mono" style={{ direction: 'ltr' }}>{safeRender(cust.email)}</p>
            </div>
          </div>
        </td>
        <td className="p-3">
          <span className="flex items-center gap-1.5 text-ink-600 font-mono text-xs" style={{ direction: 'ltr' }}><Phone size={12} className="text-hairline-strong" /> {safeRender(cust.phone)}</span>
        </td>
        <td className="p-3">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${cat.cls}`}>{cat.label}</span>
        </td>
        <td className="p-3 font-black font-mono text-brand-600 text-sm" style={{ direction: 'ltr' }}>{fmtUSD(cust.walletBalanceUSD || 0)}</td>
        <td className={`p-3 font-black font-mono text-sm ${(s.due || 0) > 0 ? 'text-warning-500' : 'text-ink-400'}`} style={{ direction: 'ltr' }}>{fmtUSD(s.due)}</td>
        <td className="p-3">
          <div className="flex flex-wrap gap-1 max-w-[220px]">
            {(cust.linkedPages || []).slice(0, 2).map(pg => <span key={pg} className="text-[9px] font-bold bg-canvas border border-fill text-ink-500 px-2 py-0.5 rounded-lg">{pg}</span>)}
            {(cust.linkedPages || []).length > 2 && <span className="text-[9px] font-bold text-ink-400">+{(cust.linkedPages || []).length - 2}</span>}
          </div>
        </td>
        <td className="p-3">
          <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); setSelectedCustomer(cust); toggleModal('topUp', true); }} className="p-1.5 rounded-lg text-assist-600 hover:bg-assist-50" title="شحن"><Plus size={14} /></button>
            <button onClick={(e) => { e.stopPropagation(); setCustomerForm({ name: safeRender(cust.name), phone: safeRender(cust.phone), email: safeRender(cust.email), marketerId: cust.marketerId || '', walletBalanceUSD: cust.walletBalanceUSD || 0 }); toggleModal('addCustomer', true); }} className="p-1.5 rounded-lg text-ink-400 hover:text-assist-600 hover:bg-assist-50" title="تعديل"><Edit3 size={14} /></button>
            <button onClick={(e) => { e.stopPropagation(); if (cleanPhone(cust.phone)) window.open(`https://wa.me/${cleanPhone(cust.phone)}`, '_blank'); }} className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50" title="واتساب"><MessageCircle size={14} /></button>
            <button onClick={(e) => { e.stopPropagation(); requestDelete('customer', cust.id); }} className="p-1.5 rounded-lg text-hairline-strong hover:text-danger-500 hover:bg-danger-soft" title="حذف"><Trash2 size={14} /></button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="flex-1 bg-canvas p-3 sm:p-4 md:p-6 overflow-auto relative" dir="rtl">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute top-24 -right-24 h-72 w-72 rounded-full bg-brand-300/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 -left-20 h-80 w-80 rounded-full bg-info-500/20 blur-3xl" />

      <div className="max-w-[1400px] mx-auto space-y-6 relative">
        {/* header */}
        <div className="flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-500 flex items-center justify-center shadow-lg shadow-brand-900/10">
              <Wallet size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-ink-800">إدارة العملاء والمحافظ الإلكترونية</h2>
              <p className="text-xs text-ink-500 mt-0.5">شحن الأرصدة · إدارة الديون · المتابعة اليومية</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button onClick={waReminder} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-hairline text-ink-600 text-xs font-bold hover:border-brand-400 hover:text-brand-700 transition-all shadow-sm">
              <MessageCircle size={15} /> تذكير سداد
            </button>
            <button onClick={() => { setCustomerForm({ name: "", phone: "", email: "", marketerId: "", walletBalanceUSD: 0 }); toggleModal('addCustomer', true); }} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-700 text-white text-xs font-bold shadow-lg shadow-brand-900/15 hover:bg-brand-800 transition-all">
              <UserPlus size={15} /> إضافة عميل
            </button>
          </div>
        </div>

        {/* stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {heroCards.map(card => (
            <div key={card.title} className="rounded-3xl bg-white border border-hairline/80 p-5 shadow-sm hover:shadow-lg transition-all">
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.accent} shadow-md shadow-black/5`}>
                  <card.icon size={19} className="text-white" />
                </div>
                <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${card.badge.up ? 'bg-brand-100 text-brand-800' : 'bg-warning-soft text-warning-800'}`}>
                  {card.badge.up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />} {card.badge.txt}
                </span>
              </div>
              <p className="mt-4 text-2xl sm:text-3xl font-black font-mono text-ink-800 truncate" style={{ direction: 'ltr' }}>{card.value}</p>
              <p className="mt-1 text-[11px] font-bold text-ink-400">{card.sub}</p>
              <div className="mt-3">
                <div className="flex justify-between text-[9px] font-bold text-ink-400 mb-1">
                  <span>{card.bar.txt}</span>
                  <span className="font-mono" style={{ direction: 'ltr' }}>{card.bar.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-fill overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-l ${card.accent}`} style={{ width: `${card.bar.pct}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* operations + filters */}
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => { setTab(f.key); setSelected(new Set()); }} className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${tab === f.key ? 'bg-brand-700 text-white shadow-md shadow-brand-900/10' : 'bg-white border border-hairline text-ink-500 hover:text-ink-800'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <Search size={15} className="absolute top-1/2 -translate-y-1/2 right-3 text-ink-400" />
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="ابحث بالاسم، الهاتف، البريد أو الصفحة"
                className="bg-white border border-hairline rounded-2xl pr-9 pl-4 py-2.5 text-xs font-bold text-ink-700 placeholder:text-ink-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 w-full lg:w-72 transition-all"
              />
            </div>
            <div className="flex items-center gap-1 bg-white border border-hairline rounded-2xl p-1">
              <button onClick={() => setMode('cards')} className={`p-2 rounded-xl transition-all ${mode === 'cards' ? 'bg-brand-700 text-white shadow-md' : 'text-ink-400 hover:text-ink-700'}`} title="عرض البطاقات"><LayoutGrid size={15} /></button>
              <button onClick={() => setMode('table')} className={`p-2 rounded-xl transition-all ${mode === 'table' ? 'bg-brand-700 text-white shadow-md' : 'text-ink-400 hover:text-ink-700'}`} title="عرض الجدول"><List size={15} /></button>
            </div>
          </div>
        </div>

        {/* bulk bar */}
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-ink-900 text-white px-4 sm:px-5 py-3 shadow-xl">
            <div className="flex items-center gap-3 text-sm font-bold">
              <span className="h-7 w-7 rounded-xl bg-brand-600 flex items-center justify-center text-white text-xs font-bold">{selected.size}</span>
              تم تحديد {selected.size} عميل
            </div>
            <div className="flex items-center gap-2">
              <button onClick={exportCSV} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl text-[11px] font-bold transition-colors">{exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} تصدير كشف</button>
              <button onClick={waReminder} className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-400 px-3 py-2 rounded-xl text-[11px] font-bold transition-colors"><MessageCircle size={13} /> تذكير واتساب</button>
              <button onClick={() => setSelected(new Set())} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl text-[11px] font-bold transition-colors"><X size={13} /> إلغاء</button>
            </div>
          </div>
        )}

        {/* content */}
        {mode === 'cards' ? (
          <div className="grid gap-4 md:gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 pb-10">
            {filtered.map(cust => <CustomerCard key={String(cust.id)} cust={cust} />)}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-hairline/80 shadow-sm overflow-hidden pb-10">
            <div className="overflow-x-auto">
              <table className="min-w-[680px] w-full text-right text-sm">
                <thead>
                  <tr className="bg-canvas text-[10px] text-ink-400 font-bold uppercase">
                    <th className="p-3 pr-5"></th>
                    <th className="p-3">العميل</th>
                    <th className="p-3">الهاتف</th>
                    <th className="p-3">الفئة</th>
                    <th className="p-3">المحفظة</th>
                    <th className="p-3">الديون</th>
                    <th className="p-3">الصفحات</th>
                    <th className="p-3 pl-5">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-canvas">
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="p-12 text-center text-ink-400 text-sm font-bold">لا توجد عملاء مطابقة للمعايير</td></tr>
                  )}
                  {filtered.map((c, i) => tableRow(c, i))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(CRMView);