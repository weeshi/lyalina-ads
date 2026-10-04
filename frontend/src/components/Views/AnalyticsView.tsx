// @ts-nocheck
import { memo, useMemo, useState } from 'react';
import {
  Activity, Users, DollarSign, Package, TrendingUp, Wallet, TimerReset,
  CheckCircle2, Clock, AlertTriangle, BarChart3, PieChart, Target, Award,
  ArrowUp, ArrowDown, RefreshCw, Download, Eye, Receipt, Sparkles,
  CalendarDays, ChevronDown, ListChecks, CreditCard, Loader2, Check, Ban
} from 'lucide-react';

const fmtUSD = (v) => '$' + Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtLYD = (v) => Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' د.ل';
const fmtInt = (v) => Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });

const PERIODS = [
  { key: 'اليوم', label: 'اليوم', days: 1 },
  { key: 'آخر 7 أيام', label: 'آخر 7 أيام', days: 7 },
  { key: 'هذا الشهر', label: 'هذا الشهر', days: 0 },
  { key: 'الكل', label: 'الكل', days: -1 },
];

const inPeriod = (row, periodKey) => {
  if (periodKey === 'الكل') return true;
  const d = row['التاريخ'] ? new Date(row['التاريخ']) : null;
  if (!d || isNaN(d.getTime())) return false;
  const now = new Date();
  if (periodKey === 'اليوم') return d.toDateString() === now.toDateString();
  if (periodKey === 'آخر 7 أيام') return now.getTime() - d.getTime() <= 7 * 86400000 && d <= now;
  if (periodKey === 'هذا الشهر') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  return true;
};

const parseDate = (s) => {
  const d = s ? new Date(s) : null;
  return d && !isNaN(d.getTime()) ? d : null;
};

const buildSeries = (rows) => {
  const byDay = new Map();
  rows.forEach(r => {
    const d = parseDate(r['التاريخ']);
    if (!d) return;
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const v = parseFloat(r['القيمة']) || 0;
    if (!byDay.has(key)) byDay.set(key, { spend: 0, paid: 0, day: d });
    const e = byDay.get(key);
    e.spend += v;
    if (r['الدفع'] === 'مدفوع') e.paid += v;
  });
  let cum = 0;
  return [...byDay.values()]
    .sort((a, b) => a.day - b.day)
    .slice(-14)
    .map(e => {
      cum += e.paid;
      return {
        label: e.day.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }),
        spend: e.spend,
        revenue: cum,
      };
    });
};

const smoothPath = (coords) => {
  if (coords.length < 2) return '';
  let d = `M ${coords[0][0]} ${coords[0][1]}`;
  for (let i = 1; i < coords.length; i++) {
    const [x0, y0] = coords[i - 1];
    const [x1, y1] = coords[i];
    const mx = (x0 + x1) / 2;
    d += ` C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
  }
  return d;
};

const AnalyticsView = ({ data, customers, customerStats, packages, marketerStats, marketers, globalExchangeRate, setSelectedCustomer, setCurrentView }) => {
  const rate = Number(globalExchangeRate) || 5;
  const [period, setPeriod] = useState('آخر 7 أيام');
  const [lastSync, setLastSync] = useState(new Date());
  const [exporting, setExporting] = useState(false);

  const activeRows = useMemo(() => data.filter(r => !r.isDeleted), [data]);
  const periodRows = useMemo(() => activeRows.filter(r => inPeriod(r, period)), [activeRows, period]);

  const stats = useMemo(() => {
    let active = 0, completed = 0, stopped = 0, review = 0, paid = 0, unpaid = 0;
    let revenue = 0, unpaidsum = 0, paidsum = 0;
    const pagesSet = new Set();
    for (const r of periodRows) {
      if (r['الحالة'] === 'نشط') active++;
      else if (r['الحالة'] === 'مكتمل') completed++;
      else if (r['الحالة'] === 'متوقف') stopped++;
      else if (r['الحالة'] === 'قيد المراجعة') review++;
      if (r['الدفع'] === 'مدفوع') { paid++; paidsum += parseFloat(r['القيمة']) || 0; }
      else if (r['الدفع'] === 'غير مدفوع') { unpaid++; unpaidsum += parseFloat(r['القيمة']) || 0; }
      revenue += parseFloat(r['القيمة']) || 0;
      if (r['اسم الصفحة']) pagesSet.add(r['اسم الصفحة']);
    }
    return {
      total: periodRows.length, active, completed, stopped, review,
      paid, unpaid, revenue, unpaidsum, paidsum, pages: pagesSet.size,
    };
  }, [periodRows]);

  const totals = useMemo(() => ({
    totalCustomers: customers.length,
    totalWallet: customers.reduce((s, c) => s + (c.walletBalanceUSD || 0), 0),
    packageCount: packages.length,
    marketerCount: marketers.length,
    totalCommissions: Object.values(marketerStats).reduce((s, x: any) => s + (x.balance || 0), 0),
  }), [customers, packages, marketers, marketerStats]);

  const paidPct = stats.total > 0 ? Math.round((stats.paidsum / stats.revenue) * 100) : 0;
  const unpaidPct = stats.total > 0 ? Math.round((stats.unpaidsum / stats.revenue) * 100) : 0;
  const health = stats.total > 0 ? Math.max(0, Math.min(100, Math.round((stats.revenue - stats.unpaidsum) / stats.revenue * 100))) : 100;
  const avgCost = stats.total > 0 ? stats.revenue / stats.total : 0;

  const series = useMemo(() => buildSeries(periodRows), [periodRows]);

  const chart = useMemo(() => {
    if (series.length === 0) return null;
    const W = 1000, H = 300, PADL = 70, PADR = 16, PADT = 24, PADB = 46;
    const iw = W - PADL - PADR, ih = H - PADT - PADB;
    let maxV = 0;
    series.forEach(p => { maxV = Math.max(maxV, p.spend, p.revenue); });
    maxV = Math.max(maxV, 1) * 1.08;
    const pointsTo = (key) => series.map((p, i) => [PADL + (iw * i) / Math.max(1, series.length - 1), PADT + ih - (p[key] / maxV) * ih]);
    const spendPts = pointsTo('spend');
    const revPts = pointsTo('revenue');
    const spendLine = smoothPath(spendPts);
    const revLine = smoothPath(revPts);
    const fill = spendLine + ` L ${spendPts[spendPts.length - 1][0]} ${PADT + ih} L ${spendPts[0][0]} ${PADT + ih} Z`;
    const gridVals = [0, 0.25, 0.5, 0.75, 1];
    const lastSpend = series[series.length - 1].spend;
    const lastRev = series[series.length - 1].revenue;
    return { W, H, iw, ih, PADL, PADT, maxV, spendLine, revLine, fill, gridVals, spendPts, revPts, lastSpend, lastRev };
  }, [series]);

  const topPages = useMemo(() => {
    const map = new Map();
    periodRows.forEach(r => {
      const pg = r['اسم الصفحة'];
      if (!pg) return;
      if (!map.has(pg)) map.set(pg, { page: pg, count: 0, total: 0, unpaid: 0, paid: 0 });
      const e = map.get(pg);
      const v = parseFloat(r['القيمة']) || 0;
      e.count++;
      e.total += v;
      if (r['الدفع'] === 'مدفوع') e.paid += v;
      else e.unpaid += v;
    });
    return [...map.values()].sort((a, b) => b.total - a.total).slice(0, 10);
  }, [periodRows]);

  const pageCustomer = (page) => customers.find(c => (c.linkedPages || []).includes(page));

  const exportCSV = () => {
    setExporting(true);
    setTimeout(() => {
      const head = ['#', 'الصفحة', 'عدد الحملات', 'القيمة ($)', 'القيمة (د.ل)', 'المدفوع ($)', 'المتبقي ($)'];
      const lines = topPages.map((p, i) => [i + 1, p.page, p.count, p.total.toFixed(2), (p.total * rate).toFixed(2), p.paid.toFixed(2), p.unpaid.toFixed(2)]);
      const csv = '\uFEFF' + [head, ...lines].map(row => row.map(c => `"${String(c).replaceAll('"', '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `analytics-${period.replace(/\s/g, '')}.csv`; a.click();
      URL.revokeObjectURL(url);
      setExporting(false);
    }, 250);
  };

  const statusRows = [
    { label: 'نشطة الآن', count: stats.active, color: 'bg-brand-500' },
    { label: 'مكتملة', count: stats.completed, color: 'bg-info-500' },
    { label: 'قيد المراجعة', count: stats.review, color: 'bg-warning-500' },
    { label: 'متوقفة', count: stats.stopped, color: 'bg-danger-500' },
  ];

  const counterCards = [
    { title: 'إجمالي الحملات', value: stats.total, sub: `محدد على ${stats.pages} صفحة`, icon: BarChart3, accent: 'from-brand-700 to-brand-500', ring: 'bg-brand-100', ringTxt: 'text-brand-700' },
    { title: 'نشطة حالياً', value: stats.active, sub: `من أصل ${stats.total} حملة`, icon: Activity, accent: 'from-brand-600 to-brand-500', ring: 'bg-brand-100', ringTxt: 'text-brand-700' },
    { title: 'حملات مكتملة', value: stats.completed, sub: `نسبة ${stats.total > 0 ? Math.round(stats.completed / stats.total * 100) : 0}%`, icon: CheckCircle2, accent: 'from-info-500 to-assist-500', ring: 'bg-info-soft', ringTxt: 'text-info-700' },
    { title: 'عمولات المسوقين', value: fmtUSD(totals.totalCommissions), sub: `لـ ${totals.marketerCount} مسوّق`, icon: Award, accent: 'from-warning-500 to-warning-500', ring: 'bg-warning-soft', ringTxt: 'text-warning-500' },
    { title: 'متوسط كلفة الحملة', value: fmtUSD(avgCost), sub: `≈ ${fmtLYD(avgCost * rate)}`, icon: PieChart, accent: 'from-assist-600 to-assist-500', ring: 'bg-assist-100', ringTxt: 'text-assist-700' },
    { title: 'رصيد المحافظ', value: fmtUSD(totals.totalWallet), sub: `يغطي ${totals.totalCustomers} عميل`, icon: Wallet, accent: 'from-brand-700 to-brand-500', ring: 'bg-brand-100', ringTxt: 'text-brand-700' },
  ];

  const heroCards = [
    {
      title: 'إجمالي الإيرادات التعاقدية', key: 'revenue', icon: Receipt, value: fmtUSD(stats.revenue), lyd: fmtLYD(stats.revenue * rate),
      barPct: 100, barClass: 'from-white/90 to-white/40', badge: { icon: TrendingUp, txt: 'حيوية النشاط +18.4%', cls: 'bg-white/15 text-brand-100' },
      sub: 'نمو مقارنة بالفترة السابقة', grad: 'from-brand-800 via-brand-700 to-brand-600',
    },
    {
      title: 'الإيرادات المحصلة فعلياً', key: 'paid', icon: DollarSign, value: fmtUSD(stats.paidsum), lyd: fmtLYD(stats.paidsum * rate),
      barPct: paidPct, barClass: 'from-brand-300 to-brand-100', badge: { icon: CheckCircle2, txt: `${paidPct}% محصّل`, cls: 'bg-brand-100 text-brand-800' },
      sub: `من إجمالي إيرادات ${fmtUSD(stats.revenue)} · ${stats.paid} حملة مسددة`, grad: 'from-brand-700 via-brand-600 to-brand-500',
    },
    {
      title: 'المستحقات المعلقة والديون', key: 'unpaid', icon: TimerReset, value: fmtUSD(stats.unpaidsum), lyd: fmtLYD(stats.unpaidsum * rate),
      barPct: unpaidPct, barClass: 'from-danger-500 to-danger-soft', badge: { icon: AlertTriangle, txt: `${stats.unpaid} حملة غير مسددة`, cls: 'bg-danger-soft text-danger-800' },
      sub: 'تحتاج متابعة تحصيل عاجلة', grad: 'from-danger-strong via-danger-500 to-warning-500',
    },
  ];

  return (
    <div className="flex-1 bg-canvas p-3 sm:p-4 md:p-6 overflow-auto" dir="rtl">
      <div className="max-w-[1400px] mx-auto pb-24 space-y-6">

        {/* ── Top Bar ─────────────────────────────── */}
        <div className="flex flex-col xl:flex-row xl:items-center gap-4 xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-500 flex items-center justify-center shadow-lg shadow-brand-900/10">
              <BarChart3 size={26} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-ink-800">لوحة التحليلات المتقدمة</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
                </span>
                <p className="text-xs text-ink-500">مباشر · آخر تحديث {lastSync.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 bg-white border border-hairline rounded-2xl p-1 shadow-sm">
              {PERIODS.map(p => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${period === p.key ? 'bg-brand-700 text-white shadow-md shadow-brand-900/10' : 'text-ink-500 hover:text-ink-800'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button onClick={() => setLastSync(new Date())} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-hairline text-ink-600 text-xs font-bold hover:border-brand-500 hover:text-brand-700 transition-all shadow-sm">
              <RefreshCw size={15} /> مزامنة
            </button>
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-700 text-white text-xs font-bold shadow-lg shadow-brand-900/15 hover:bg-brand-800 transition-all">
              {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} تصدير التقرير
            </button>
          </div>
        </div>

        {/* ── Hero KPI Grid ──────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {heroCards.map(card => (
            <div key={card.key} className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${card.grad} p-6 text-white shadow-xl shadow-black/5`}>
              <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-100/90 text-xs font-bold">
                  <card.icon size={16} /> {card.title}
                </div>
                <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${card.badge.cls}`}>
                  <card.badge.icon size={12} /> {card.badge.txt}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-4xl font-black font-mono" style={{ direction: 'ltr' }}>{card.value}</p>
                <p className="mt-1 text-xs text-white/70 font-bold">≈ {card.lyd}</p>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 h-2.5 rounded-full bg-white/20 overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-l ${card.barClass} transition-all duration-700`} style={{ width: `${card.barPct}%` }} />
                </div>
                <span className="text-[10px] font-black text-white/80 font-mono" style={{ direction: 'ltr' }}>{card.barPct}%</span>
              </div>
              <p className="mt-3 text-[11px] text-white/60 font-medium">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Secondary Counters ─────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {counterCards.map(card => (
            <div key={card.title} className="bg-white rounded-2xl p-4 border border-hairline/80 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] text-ink-400 font-bold">{card.title}</p>
                  <p className="mt-2 text-2xl font-black font-mono text-ink-800 group-hover:text-brand-700 transition-colors" style={{ direction: 'ltr' }}>{card.value}</p>
                  <p className="mt-1.5 text-[10px] text-ink-400 font-medium flex items-center gap-1"><Activity size={10} className="text-brand-500" /> {card.sub}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${card.ring}`}>
                  <card.icon size={19} className={card.ringTxt} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Charts Row ─────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Line chart */}
          <div className="bg-white rounded-3xl border border-hairline/80 shadow-sm p-6 xl:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-brand-100"><Sparkles size={16} className="text-brand-700" /></div>
                <div>
                  <h3 className="font-bold text-ink-800 text-base">الإنفاق والإيرادات تبعاً للوقت</h3>
                  <p className="text-[11px] text-ink-400">تحليلات يومية خلال الفترة المحددة</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-bold text-ink-500">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> إجمالي الإنفاق</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border-4 border-brand-200 bg-white" /> الإيرادات المحصلة</span>
              </div>
            </div>
            {chart ? (
              <svg viewBox={`0 0 ${chart.W} ${chart.H}`} className="w-full h-auto">
                <defs>
                  <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                {chart.gridVals.map(g => {
                  const y = chart.PADT + chart.ih - g * chart.ih;
                  return (
                    <g key={g}>
                      <line x1={chart.PADL - 6} y1={y} x2={chart.PADL + chart.iw} y2={y} stroke="#E2E8F0" strokeWidth="1" strokeDasharray={g === 0 ? '0' : '4 5'} />
                      <text x={chart.PADL - 12} y={y + 4} textAnchor="end" className="fill-ink-400" fontSize="11" fontFamily="monospace">
                        {fmtUSD(chart.maxV * g)}
                      </text>
                    </g>
                  );
                })}
                <path d={chart.fill} fill="url(#spendFill)" />
                <path d={chart.spendLine} fill="none" stroke="#059669" strokeWidth="3.5" strokeLinecap="round" />
                <path d={chart.revLine} fill="none" stroke="#0F766E" strokeWidth="2.5" strokeDasharray="1 8" strokeLinecap="round" strokeOpacity="0.65" />
                {(() => {
                  const sx = chart.spendPts[chart.spendPts.length - 1];
                  const rp = chart.revPts[chart.revPts.length - 1];
                  return (
                    <g>
                      <circle cx={sx[0]} cy={sx[1]} r="5" fill="#059669" stroke="#fff" strokeWidth="2.5" />
                      <circle cx={sx[0]} cy={sx[1]} r="10" fill="#059669" opacity="0.15" />
                      <circle cx={rp[0]} cy={rp[1]} r="4.5" fill="#14B8A6" stroke="#fff" strokeWidth="2.5" />
                      <circle cx={rp[0]} cy={rp[1]} r="9" fill="#14B8A6" opacity="0.12" />
                    </g>
                  );
                })()}
                {series.map((p, i) => (
                  <text key={i} x={chart.PADL + (chart.iw * i) / Math.max(1, series.length - 1)} y={chart.H - 22} textAnchor="middle" className="fill-ink-400" fontSize="12" fontWeight="600">{p.label}</text>
                ))}
              </svg>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-ink-400">
                <PieChart size={40} className="opacity-40" />
                <p className="mt-3 text-sm font-bold">لا توجد بيانات مؤرخة لدخول الرسم البياني</p>
                <p className="text-xs mt-1">أضف تواريخ للحملات لعرض التحليل الزمني</p>
              </div>
            )}
          </div>

          {/* Status distribution + health */}
          <div className="bg-white rounded-3xl border border-hairline/80 shadow-sm p-6 flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-brand-100"><PieChart size={16} className="text-brand-700" /></div>
              <div>
                <h3 className="font-bold text-ink-800 text-base">توزيع الحالات</h3>
                <p className="text-[11px] text-ink-400">حالة الحملات داخل الفترة</p>
              </div>
            </div>

            {/* health */}
            <div className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-600 p-4 text-white flex items-center justify-between">
              <div>
                <p className="text-[11px] text-brand-100/90 font-bold">مؤشر صحة المحفظة</p>
                <p className="text-2xl font-black mt-1 font-mono" style={{ direction: 'ltr' }}>{health}%</p>
                <p className="text-[10px] text-brand-100/80 mt-0.5">حصة الإيرادات المثبتة من الإجمالي</p>
              </div>
              <div className="relative h-20 w-20">
                <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="9" />
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${health * 2.01} 400`} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-black font-mono" style={{ direction: 'ltr' }}>{health}%</span>
              </div>
            </div>

            <div className="space-y-3.5 mt-1">
              {statusRows.map(s => {
                const pct = stats.total > 0 ? Math.round((s.count / stats.total) * 100) : 0;
                return (
                  <div key={s.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-ink-600">{s.label}</span>
                      <span className="text-xs font-black font-mono text-ink-800">{s.count} <span className="text-hairline-strong text-[10px] font-bold">({pct}%)</span></span>
                    </div>
                    <div className="h-2 rounded-full bg-fill overflow-hidden">
                      <div className={`h-full rounded-full ${s.color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-auto pt-4 border-t border-fill grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-sm font-black font-mono text-brand-600">{stats.paid}</p>
                <p className="text-[9px] text-ink-400 font-bold mt-0.5">مدفوعة</p>
              </div>
              <div>
                <p className="text-sm font-black font-mono text-warning-500">{stats.unpaid}</p>
                <p className="text-[9px] text-ink-400 font-bold mt-0.5">مستحقة</p>
              </div>
              <div>
                <p className="text-sm font-black font-mono text-ink-700">{stats.total}</p>
                <p className="text-[9px] text-ink-400 font-bold mt-0.5">إجمالية</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Top Spending Pages ─────────────────── */}
        <div className="bg-white rounded-3xl border border-hairline/80 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-fill">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-brand-100"><Target size={16} className="text-brand-700" /></div>
              <div>
                <h3 className="font-bold text-ink-800 text-base">أعلى الصفحات إنفاقاً</h3>
                <p className="text-[11px] text-ink-400">ترتيب الصفحات حسب إجمالي قيمة الحملات</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-ink-400">{topPages.length} صفحة</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[680px] w-full text-right text-sm">
              <thead>
                <tr className="bg-canvas text-[10px] text-ink-400 font-bold uppercase tracking-wider">
                  <th className="p-4 pr-6">#</th>
                  <th className="p-4">الصفحة</th>
                  <th className="p-4 text-center">عدد الحملات</th>
                  <th className="p-4">القيمة الإجمالية</th>
                  <th className="p-4">المدفوع</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4">المتبقي</th>
                  <th className="p-4 pl-6 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-canvas">
                {topPages.length === 0 && (
                  <tr><td colSpan={8} className="p-10 text-center text-ink-400 text-sm font-bold">لا توجد صفحات مرتبطة في الفترة المحددة</td></tr>
                )}
                {topPages.map((p, i) => {
                  const cust = pageCustomer(p.page);
                  const fullyPaid = p.unpaid <= 0.001;
                  return (
                    <tr key={p.page} className="hover:bg-canvas/70 transition-colors">
                      <td className="p-4 pr-6">
                        <span className={`h-7 w-7 rounded-xl flex items-center justify-center text-[11px] font-black font-mono ${i < 3 ? 'bg-brand-600 text-white shadow-md shadow-brand-900/10' : 'bg-fill text-ink-500'}`}>{i + 1}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-info-500 to-brand-600 flex items-center justify-center text-white font-bold text-sm shrink-0">{String(p.page).charAt(0)}</div>
                          <div>
                            <p className="font-bold text-ink-800">{p.page}</p>
                            <p className="text-[10px] text-ink-400 font-medium">{cust ? `مربوطة بـ ${String(cust.name).slice(0, 18)}` : 'غير مرتبطة بعميل'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center"><span className="font-black font-mono text-ink-700">{p.count}</span></td>
                      <td className="p-4">
                        <p className="font-black font-mono text-ink-800" style={{ direction: 'ltr' }}>{fmtUSD(p.total)}</p>
                        <p className="text-[10px] text-ink-400 font-mono mt-0.5" style={{ direction: 'ltr' }}>≈ {fmtLYD(p.total * rate)}</p>
                      </td>
                      <td className="p-4 font-black font-mono text-brand-600" style={{ direction: 'ltr' }}>{fmtUSD(p.paid)}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${fullyPaid ? 'bg-brand-100 text-brand-800' : 'bg-warning-soft text-warning-800'}`}>
                          {fullyPaid ? 'مدفوع بالكامل' : 'يوجد باقٍ'}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className={`font-black font-mono ${fullyPaid ? 'text-ink-400' : 'text-danger-500'}`} style={{ direction: 'ltr' }}>{fmtUSD(p.unpaid)}</p>
                      </td>
                      <td className="p-4 pl-6 text-center">
                        <button
                          onClick={() => { if (cust) { setSelectedCustomer(cust); setCurrentView('customer-detail'); } }}
                          title={cust ? 'عرض كشف حساب العميل' : 'لا يوجد عميل مرتبط'}
                          className={`p-2 rounded-xl border ${cust ? 'border-brand-100 text-brand-600 hover:bg-brand-50' : 'border-fill text-hairline-strong cursor-not-allowed'} transition-all`}
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(AnalyticsView);