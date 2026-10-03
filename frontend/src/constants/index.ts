// @ts-nocheck
export const GEMINI_PROXY_URL = (import.meta.env.VITE_GEMINI_PROXY_URL || '').trim() || 'http://localhost:8787';
export const PRESET_WORKSPACES = ["Weeshi Ads 2", "Weeshi Ads 3", "Weeshi Ad 3", "weeshi Ads 4", "Weeshi Ads 5", "Boost Ads", "Cars Ads", "Mutasem Ads", "Real Estate Ads", "main-ads-db"];
export const DEFAULT_WORKSPACE = "Weeshi Ads 2";

// مطابقة تصميم Stitch - 17 عمود + عمود الإجراءات
export const HEADERS = ["#ID", "الحالة", "اسم الصفحة", "الرابط", "كود الباقة", "الدفع", "القيمة ($)", "القيمة (د.ل)", "التاريخ", "المدة والانقضاء", "المكان", "الأعمار", "الجنس", "الاهتمامات", "نوع الحملة", "اسم Ad", "كود المنشور"];
export const AI_HEADERS = HEADERS.filter(h => !["#ID", "الحالة", "الدفع", "كود الباقة"].includes(h));
export const STATUS_OPTIONS = {
  "نشط": { color: "text-emerald-700", icon: "🟢", bg: "bg-emerald-50 border-emerald-200" },
  "قيد المراجعة": { color: "text-amber-700", icon: "🟡", bg: "bg-amber-50 border-amber-200" },
  "متوقف": { color: "text-red-700", icon: "🔴", bg: "bg-red-50 border-red-200" },
  "مكتمل": { color: "text-blue-700", icon: "✅", bg: "bg-blue-50 border-blue-200" }
};
export const CAMPAIGN_TYPES = ["استهداف زيادة التفاعل", "زيادة عدد الرسائل", "زيادة الوصول", "زيادة المبيعات", "مشاهدات الفيديو", "زيادة المتابعين", "تثبيت التطبيق"];
export const SEX_OPTIONS = ["جنسين", "رجال", "نساء"];
export const PAYMENT_METHODS = {
  'مدفوع': { label: 'مدفوع', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  'غير مدفوع': { label: 'غير مدفوع', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  'يدوي (نقدي)': { label: 'يدوي (نقدي)', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  'مدفوع (محفظة)': { label: 'مدفوع (محفظة)', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
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
