// @ts-nocheck

/**
 * ملف إعدادات الاتصال بقاعدة البيانات (Firebase)
 * ───────────────────────────────────────────────
 * هذا هو الملف المركزي الوحيد لزرع إعدادات الاتصال بمشروع Firebase.
 *
 * ▸ القيم الافتراضية أدناه قابلة للتعديل مباشرة (زرع) عند نقل النظام
 *   إلى بيئة/قاعدة بيانات أخرى.
 * ▸ يمكن تجاوز أي قيمة من ملف `.env` عبر متغيرات `VITE_FIREBASE_*`
 *   (يُعطي متغير البيئة الأولوية إذا وُجد).
 */

// ═══════════ إعدادات الاتصال (قابلة للزرع) ═══════════

// 🌿 المفتاح الفعلي لمشروع Firebase
const DEFAULT_API_KEY = 'PASTE_YOUR_FIREBASE_API_KEY';

// 🌿 نطاق المصادقة (authDomain = projectId + .firebaseapp.com)
const DEFAULT_AUTH_DOMAIN = 'lyalina-ads.firebaseapp.com';

// 🌿 معرّف مشروع Firebase (projectId)
const DEFAULT_PROJECT_ID = 'lyalina-ads';

// 🌿 حاوية التخزين (storageBucket = projectId + .firebasestorage.app)
const DEFAULT_STORAGE_BUCKET = 'lyalina-ads.firebasestorage.app';

// 🌿 معرّف الإرسال (messagingSenderId)
const DEFAULT_MESSAGING_SENDER_ID = '667813824853';

// 🌿 معرّف التطبيق (appId)
const DEFAULT_FIREBASE_APP_ID = 'PASTE_YOUR_FIREBASE_APP_ID';

// 🌿 معرّف القياس (measurementId) — اختياري
const DEFAULT_MEASUREMENT_ID = 'G-JCSN80R0S0';

/**
 * المسار (App Path) داخل Firestore الذي تُخزَّن تحته جميع البيانات.
 * هذا المفتاح يحدد موضع مجموعات البيانات في المستوى:
 *   artifacts/{APP_PATH}/public/data/{collection}
 *
 * عند النقل أو عمل بيئة (dev/production) غيّر القيمة للحصول على
 * مساحة بيانات مستقلة داخل نفس مشروع Firebase.
 */
const DEFAULT_APP_PATH = 'lyalina-ads-production';

// ═══════════ أولوية القراءة: .env ثم القيم المزروعة ═══════════

function pick(envValue, defaultValue) {
  // متغير البيئة (إن وُجد وغير فارغ) له الأولوية على القيمة المزروعة.
  const v = (envValue || '').trim();
  return v.length > 0 ? v : defaultValue;
}

const N = (k) => import.meta.env[k];

export const firebaseConfig = {
  apiKey: pick(N('VITE_FIREBASE_API_KEY'), DEFAULT_API_KEY),
  authDomain: pick(N('VITE_FIREBASE_AUTH_DOMAIN'), DEFAULT_AUTH_DOMAIN),
  projectId: pick(N('VITE_FIREBASE_PROJECT_ID'), DEFAULT_PROJECT_ID),
  storageBucket: pick(N('VITE_FIREBASE_STORAGE_BUCKET'), DEFAULT_STORAGE_BUCKET),
  messagingSenderId: pick(N('VITE_FIREBASE_MESSAGING_SENDER_ID'), DEFAULT_MESSAGING_SENDER_ID),
  appId: pick(N('VITE_FIREBASE_APP_ID'), DEFAULT_FIREBASE_APP_ID),
  measurementId: pick(N('VITE_FIREBASE_MEASUREMENT_ID'), DEFAULT_MEASUREMENT_ID),
};

/**
 * المسار (App Path) داخل Firestore — يُقرأ من `.env` عبر
 * `VITE_FIREBASE_APP_PATH` أو يقع على القيمة المزروعة أعلاه.
 */
export const appId = pick(N('VITE_FIREBASE_APP_PATH'), DEFAULT_APP_PATH);
