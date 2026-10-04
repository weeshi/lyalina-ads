// @ts-nocheck
export const GEMINI_PROXY_URL = (import.meta.env.VITE_GEMINI_PROXY_URL || '').trim() || 'http://localhost:8787';
export const PRESET_WORKSPACES = ["Weeshi Ads 2", "Weeshi Ads 3", "Weeshi Ad 3", "weeshi Ads 4", "Weeshi Ads 5", "Boost Ads", "Cars Ads", "Mutasem Ads", "Real Estate Ads", "main-ads-db"];
export const DEFAULT_WORKSPACE = "Weeshi Ads 2";
export const HEADERS = ["الحالة", "اسم الصفحة", "الرابط", "كود الباقة", "الدفع", "القيمة", "القيمة (د.ل)", "التاريخ", "المدة", "المكان", "الاعمار", "الجنس", "الاهتمامات", "نوع الحملة", "اسم Ad", "كود المنشور", "المعرف"];
export const AI_HEADERS = HEADERS.filter(h => !["المعرف", "الحالة", "الدفع", "كود الباقة"].includes(h));

// ─── طبقة فصل تصميم Stitch: مفتاح التخزين (key) ≠ التسمية المعروضة (label) ───
// HEADERS تبقى مفاتيح Firestore كما هي. COLUMN_DEFS يعرض تسميات Stitch فقط.
export const COLUMN_DEFS = [
  { key: "المعرف", label: "#ID", type: "id" },
  { key: "الحالة", label: "الحالة", type: "status" },
  { key: "اسم الصفحة", label: "اسم الصفحة", type: "text" },
  { key: "الرابط", label: "الرابط", type: "link" },
  { key: "كود الباقة", label: "كود الباقة", type: "package" },
  { key: "الدفع", label: "الدفع", type: "payment" },
  { key: "القيمة", label: "القيمة ($)", type: "currency" },
  { key: "القيمة (د.ل)", label: "القيمة (د.ل)", type: "currency" },
  { key: "التاريخ", label: "التاريخ", type: "date" },
  { key: "المدة", label: "المدة والانقضاء", type: "duration" },
  { key: "المكان", label: "المكان", type: "text" },
  { key: "الاعمار", label: "الأعمار", type: "text" },
  { key: "الجنس", label: "الجنس", type: "gender" },
  { key: "الاهتمامات", label: "الاهتمامات", type: "text" },
  { key: "نوع الحملة", label: "نوع الحملة", type: "text" },
  { key: "اسم Ad", label: "اسم Ad", type: "text" },
  { key: "كود المنشور", label: "كود المنشور", type: "text" },
];

export const STATUS_OPTIONS = {
  "نشط": { color: "text-brand-700", icon: "🟢", bg: "bg-brand-50 text-brand-800 border-brand-200" },
  "قيد المراجعة": { color: "text-warning-500", icon: "🟡", bg: "bg-warning-soft text-warning-800 border-warning-soft" },
  "متوقف": { color: "text-danger-strong", icon: "🔴", bg: "bg-danger-soft text-danger-800 border-danger-soft" },
  "مكتمل": { color: "text-info-700", icon: "✅", bg: "bg-info-soft text-info-800 border-info-200" },
};

// حالة الدفع المعروضة = مفاتيح "الدفع" في البيانات (تبقى مدفوع/غير مدفوع فقط)
export const PAYMENT_STATES = {
  'مدفوع': { label: 'مدفوع', color: 'text-brand-700', bg: 'bg-brand-50 text-brand-800 border-brand-200' },
  'غير مدفوع': { label: 'غير مدفوع', color: 'text-warning-500', bg: 'bg-warning-soft text-warning-800 border-warning-soft' },
};
export const CAMPAIGN_TYPES = ["استهداف زيادة التفاعل", "زيادة عدد الرسائل", "زيادة الوصول", "زيادة المبيعات", "مشاهدات الفيديو", "زيادة المتابعين", "تثبيت التطبيق"];
export const SEX_OPTIONS = ["جنسين", "رجال", "نساء"];
export const PAYMENT_METHODS = {
  'يدوي': { label: 'يدوي', color: 'text-info-700', bg: 'bg-info-soft' },
  'محفظة': { label: 'محفظة', color: 'text-brand-700', bg: 'bg-brand-100' },
  'نقدي': { label: 'نقدي', color: 'text-warning-500', bg: 'bg-warning-soft' },
  'حوالة': { label: 'حوالة', color: 'text-assist-700', bg: 'bg-assist-100' },
};
export const PACKAGE_CATEGORIES = {
  C: { label: 'سيارات', icon: '🚗' },
  R: { label: 'عقارات', icon: '🏠' },
  G: { label: 'متنوعة', icon: '📦' },
};
export const ROLE_OPTIONS = [
  { value: 'sales', label: 'موظف مبيعات (Sales)', shortLabel: 'مبيعات' },
  { value: 'marketer', label: 'مسوق (Marketer)', shortLabel: 'مسوق' },
  { value: 'admin', label: 'مدير فرعي (Admin)', shortLabel: 'مدير' },
];

const BASE_PACKAGES = [
  { days: 7, priceUSD: 50, priceLYD: 360 },
  { days: 10, priceUSD: 70, priceLYD: 500 },
  { days: 15, priceUSD: 100, priceLYD: 720 },
  { days: 20, priceUSD: 130, priceLYD: 935 },
  { days: 30, priceUSD: 180, priceLYD: 1295 },
];

export const DEFAULT_PACKAGES = Object.entries(PACKAGE_CATEGORIES).flatMap(([prefix, cat]) =>
  BASE_PACKAGES.map(pkg => ({
    code: `${prefix}${pkg.days}`,
    days: pkg.days,
    priceUSD: pkg.priceUSD,
    priceLYD: pkg.priceLYD,
    category: prefix,
    categoryLabel: cat.label,
  }))
);
