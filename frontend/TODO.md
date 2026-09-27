# قائمة المهام - Lyalina Ads Manager

> تُحدث أسبوعياً. راجع ROADMAP.md للخطة الكاملة.

---

## 🔴 حرجة (هذا الأسبوع)

- [ ] تشغيل `pnpm build` وإصلاح أي أخطاء TypeScript
- [ ] التحقق من Firebase Security Rules في Console
- [ ] مراجعة `useData.ts` - تقليل إعادة الرندر غير الضرورية
- [ ] إضافة Error Boundary في `AdsManager.tsx`

## 🟡 عالية الأولوية (الأسبوعين القادمين)

### جودة الكود
- [ ] إعداد ESLint (`pnpm add -D eslint @eslint/js typescript-eslint`)
- [ ] إعداد Prettier (`pnpm add -D prettier prettier-plugin-tailwindcss`)
- [ ] إضافة Husky + lint-staged (`pnpm add -D husky lint-staged`)
- [ ] تفعيل TypeScript strict mode تدريجياً (ملف بملف)

### اختبارات
- [ ] إعداد Vitest (`pnpm add -D vitest @testing-library/react jsdom`)
- [ ] اختبار `useAuth.ts` - تسجيل الدخول/الخروج
- [ ] اختبار `useFilters.ts` - بحث، فلترة، فرز
- [ ] اختبار `useData.ts` - اشتراكات Firestore (mock)
- [ ] اختبار `CRMView.tsx` - عرض/إضافة/تعديل عميل

### أداء
- [ ] تحليل Bundle (`pnpm add -D vite-bundle-analyzer`)
- [ ] Code Splitting للمسارات (`React.lazy` + `Suspense`)
- [ ] مراجعة استعلامات Firestore - إضافة فهارس مفقودة
- [ ] تطبيق `React.memo` على المكونات الثقيلة

## 🟢 متوسطة الأولوية (الشهر القادم)

### ميزات
- [ ] Dashboard widgets قابلة للتخصيص
- [ ] تصدير تقارير (PDF/Excel) - `xlsx`, `jspdf`
- [ ] فلاتر محفوظة لكل مستخدم (localStorage + Firestore)
- [ ] وضع داكن/فاتح (Theme toggle)

### تجربة مطور
- [ ] Storybook للمكونات (`pnpm dlx storybook@latest init`)
- [ ] توثيق Hooks رئيسية (JSDoc + أمثلة)
- [ ] CI/CD مع GitHub Actions (build + test + lint)
- [ ] إضافة Sentry للمراقبة (`pnpm add @sentry/react`)

## 🔵 منخفضة الأولوية (لاحقاً)

- [ ] PWA (Service Worker، Offline support)
- [ ] اختبارات E2E مع Playwright
- [ ] API عام موثق (OpenAPI)
- [ ] تكامل WhatsApp Business
- [ ] Multi-language (i18n)

---

## ✅ مكتملة

- [x] إنشاء README.md
- [x] إنشاء ROADMAP.md
- [x] إنشاء TODO.md
- [x] تثبيت الاعتماديات (`pnpm install`)
- [x] تشغيل خادم التطوير (`pnpm dev`)

---

## ملاحظات

| المهمة | المسؤول | الموعد المستهدف | الحالة |
|---------|---------|-----------------|--------|
| Build fixes | Dev | اليوم | 🔴 |
| ESLint/Prettier | Dev | أسبوع 1 | 🟡 |
| Tests setup | Dev | أسبوع 2 | 🟡 |
| Code splitting | Dev | أسبوع 3 | 🟡 |

---

*تنسيق: [ ] معلقة | [x] مكتملة | 🔴 حرجة | 🟡 عالية | 🟢 متوسطة | 🔵 منخفضة*