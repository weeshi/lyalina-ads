# خطة بناء المشروع - Lyalina Ads Manager

## الرؤية
بناء نظام إدارة إعلانات متكامل، سريع، وقابل للتوسع لشركة ليالينا.

---

## المرحلة 1: الأساسيات والاستقرار (v6.5 - v6.9)
**الهدف**: تثبيت النسخة الحالية وإصلاح المشاكل الحرجة

### v6.5 - إصلاحات حرجة (أسبوع 1)
- [ ] إصلاح أي أخطاء TypeScript في `pnpm build`
- [ ] مراجعة وإصلاح Firebase rules
- [ ] تحسين أداء `useData` hook (تقليل إعادة الرندر)
- [ ] إضافة Error Boundaries للمكونات الحرجة

### v6.6 - تحسين تجربة المطور (أسبوع 2)
- [ ] إضافة ESLint + Prettier config
- [ ] إعداد pre-commit hooks (husky)
- [ ] إضافة TypeScript strict mode تدريجياً
- [ ] توثيق الـ Hooks الرئيسية (JSDoc)

### v6.7 - اختبارات (أسبوع 3)
- [ ] إعداد Vitest + React Testing Library
- [ ] اختبارات وحدة للـ hooks (`useAuth`, `useFilters`, `useData`)
- [ ] اختبارات تكامل للـ Views الرئيسية
- [ ] تغطية 60%+ للكود الحرج

### v6.8 - أداء (أسبوع 4)
- [ ] Code splitting للمسارات (React.lazy + Suspense)
- [ ] تحسين Bundle size (تحليل vite-bundle-analyzer)
- [ ] تحسين استعلامات Firestore (فهرسة، pagination)
- [ ] إضافة React DevTools Profiler markers

### v6.9 - توثيق ونشر (أسبوع 5)
- [ ] توثيق API الداخلي (Storybook أو Markdown)
- [ ] دليل نشر produção (Vercel/Netlify/Firebase Hosting)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Monitoring (Sentry أو Firebase Crashlytics)

---

## المرحلة 2: الميزات الجديدة (v7.0 - v7.9)
**الهدف**: إضافة ميزات مطلوبة من العمل

### v7.0 - لوحة معلومات محسنة (شهر 1)
- [ ] Dashboard قابل للتخصيص (Widgets)
- [ ] تقارير PDF/Excel قابلة للتصدير
- [ ] رسوم بيانية تفاعلية (Recharts/Chart.js)
- [ ] فلاتر محفوظة لكل مستخدم

### v7.1 - إدارة الحملات (شهر 2)
- [ ] إنشاء/تعديل حملات إعلانية
- [ ] جدولة الحملات (التاريخ، الميزانية)
- [ ] تتبع الإنفاق مقابل الميزانية
- [ ] تنبيهات تلقائية (تجاوز الميزانية، انتهاء الحملة)

### v7.2 - أتمتة وإشعارات (شهر 3)
- [ ] إشعارات فورية (Firebase Cloud Messaging)
- [ ] إشعارات البريد الإلكتروني (SendGrid/Resend)
- [ ] مهام مجدولة (Cron jobs عبر Firebase Functions)
- [ ] Webhooks للتكامل الخارجي

### v7.3 - أدوار وصلاحيات متقدمة (شهر 4)
- [ ] RBAC كامل (Admin, Manager, Marketer, Viewer)
- [ ] صلاحيات على مستوى الحقل
- [ ] سجل تدقيق (Audit log)
- [ ] جلسات متعددة الأجهزة

### v7.4 - تطبيق جوال (PWA) (شهر 5)
- [ ] تحويل إلى PWA (Service Worker، Manifest)
- [ ] وضع عدم الاتصال (Offline-first مع IndexedDB)
- [ ] Push notifications على الجوال
- [ ] واجهة متجاوبة محسنة للجوال

### v7.5 - تكاملات خارجية (شهر 6)
- [ ] API عام موثق (OpenAPI/Swagger)
- [ ] Webhooks للتكامل مع CRM خارجي
- [ ] مزامنة مع Google Sheets/Excel
- [ ] تكامل WhatsApp Business API

---

## المرحلة 3: إعادة هيكلة شاملة (v8.0)
**الهدف**: تطوير نظيف، قابل للصيانة، وجاهز للمستقبل (حسب AGENTS.md)

### v8.0 - إعادة كتابة (Q3-Q4 2026)
- [ ] **هيكلة جديدة**: Feature-based architecture
- [ ] **State Management**: استبدال Zustand بـ TanStack Query + Context
- [ ] **Forms**: React Hook Form + Zod validation
- [ ] **UI Kit**: مكونات تصميم موحدة (Storybook)
- [ ] **Type Safety**: Typescript strict mode كامل،types-generators من Firestore
- [ ] **Testing**: E2E مع Playwright، وحدة 80%+
- [ ] **Performance**: RSC (React Server Components) إذا انتقل لـ Next.js
- [ ] **Documentation**: دليلي مستخدم ومطور كاملين

### قرارات تقنية معلقة لـ v8.0
| القرار | الخيارات | التوصية المبدئية |
|----------|----------|------------------|
| Framework | Vite SPA vs Next.js | Next.js (App Router) |
| State | Zustand vs TanStack Query | TanStack Query + Server State |
| Styling | Tailwind v4 vs CSS Modules | Tailwind v4 (مستمر) |
| Auth | Firebase Auth vs Auth.js | Firebase Auth (مستمر) |
| Database | Firestore vs PostgreSQL | Firestore (مستمر) + Sync |

---

## المرحلة 4: التوسع والنمو (v9.0+)
**الهدف**: منتج ناضج قابل للتوسع التجاري

- [ ] Multi-tenancy (منظمات متعددة)
- [ ] Marketplace للقوالب والتكاملات
- [ ] AI-powered insights (Gemini تحليل البيانات)
- [ ] White-label solution
- [ ] Enterprise SSO (SAML/OIDC)

---

## معايير الجودة لكل إصدار

| المعيار | v6.x | v7.x | v8.0 |
|----------|------|------|------|
| TypeScript strict | جزئي | mostly | كامل |
| Test coverage | 60% | 75% | 85%+ |
| Bundle size | < 500KB | < 400KB | < 300KB |
| Lighthouse score | 80+ | 90+ | 95+ |
| Zero critical bugs | ✓ | ✓ | ✓ |

---

## المراجعة والتحديث

- **أسبوعياً**: مراجعة Sprint، تحديث TODO
- **شهرياً**: مراجعة Roadmap، تعديل أولويات
- **ربع سنوي**: تخطيط المرحلة التالية

---

*آخر تحديث: 2026-08-31*
*الإصدار الحالي: 6.4.0*
*الهدف التالي: v6.5*