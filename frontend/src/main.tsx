import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import SetupWizard from './components/SetupWizard';
import { isConfigComplete } from './config/validateConfig';

// تحميل كسول لمنصة الإدارة: يُحمَّل ملف التهيئة (initializeApp) فقط بعد اكتمال
// إعدادات الاتصال بقاعدة البيانات — حتى لا تبدأ جلسة Firebase بقيم placeholder.
const AdsManager = React.lazy(() => import('./AdsManager'));

// إذا كانت إعدادات الاتصال بقاعدة البيانات غير مكتملة، نعرض معالج التثبيت
// بدلاً من شاشة تسجيل الدخول لتوجيه المستخدم لتعبئة القيم أولاً.
function Root() {
  const [complete, setComplete] = React.useState(() => isConfigComplete());
  return complete ? (
    <React.Suspense fallback={<div className="min-h-screen bg-slate-100 flex items-center justify-center">جارٍ التحميل...</div>}>
      <AdsManager />
    </React.Suspense>
  ) : (
    <SetupWizard onComplete={() => setComplete(true)} />
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
