# دستور العمل - Lyalina Ads Manager v8.0

## هيكل المشروع

```
src/
├── AdsManager.tsx          # الموزع الرئيسي (يستورد الهوك والمكونات)
├── main.tsx                # نقطة الدخول
├── index.css               # ملف CSS الوحيد (Tailwind v4)
├── firebase/
│   └── index.ts            # تهيئة Firebase
├── constants/
│   └── index.ts            # الثوابت (HEADERS, STATUS_OPTIONS, ...)
├── utils/
│   └── index.ts            # الدوال المساعدة
├── hooks/
│   ├── useAuth.ts          # إدارة المصادقة
│   ├── useData.ts          # اشتراكات Firestore
│   └── useFilters.ts       # بحث، فلترة، فرز
├── components/
│   ├── Auth/
│   │   └── AuthScreen.tsx
│   ├── Layout/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   └── AdvancedFiltersDrawer.tsx
│   ├── Modals/             # 10 ملفات مودال مستقلة
│   └── Views/
│       ├── AnalyticsView.tsx
│       ├── CRMView.tsx
│       ├── CustomerDetailView.tsx
│       ├── MarketersView.tsx
│       ├── MarketerDetailView.tsx
│       ├── PackagesView.tsx
│       └── SettingsView.tsx
```

## قواعد التطوير

1. **اللغة**: تحدّث دائماً باللغة العربية مع المستخدم، والعربية فقط في التعليقات ورسائل المستخدمين
2. **TypeScript**: استخدام `// @ts-nocheck` في جميع الملفات لتجاوز strict mode
3. **التقسيم**: فصل UI عن منطق الأعمال - UI في `components/`، منطق في `hooks/`
4. **المكونات**: مكون صغير واحد لكل ملف، يستقبل props فقط
5. **الهوك**: هوك واحد للاشتراك (`useData`) وهوك منفصل للفلترة (`useFilters`)
6. **Firebase**: إعدادات Firebase في `.env` (متغيرات `VITE_FIREBASE_*` تُقرأ عبر `import.meta.env`)
7. **التصميم**: Tailwind CSS utility classes فقط - لا ملفات `.css` إضافية
8. **البناء**: `pnpm dev` للتطوير، `pnpm build` للإنتاج
9. **التسمية**: `id` و `data-component` للعناصر المهمة
10. **الأمان**: أي مفتاح API أو سر حساس (Gemini، إلخ) يُخزَّن حصراً عبر Secrets بجانب السيرفر (Cloudflare Workers / Firebase Functions)، ولا يُكتب بأي ملف بالفرونت إند تحت أي ظرف
11. **النسخ الاحتياطية**: لا تعديل أبدا على النسخ الاحتياطية الموجودة مسبقا (طوق نجاة للطوارئ). عند أي تحديث أنشئ نسخة جديدة باسم/تاريخ مختلف بدلا من تعديل القديمة.

## سير العمل

1. تشغيل `pnpm dev` في `D:\ERP-Projects\lyalina`
2. التحقق من `pnpm build` قبل أي commit
3. Firebase Console: https://console.firebase.google.com/project/lyalina-ads
4. نَشر الـ Worker: في `D:\ERP-Projects\lyalina-gemini-proxy` → `npx wrangler secret put GEMINI_API_KEY` ثم `npx wrangler deploy` (تعيين `VITE_GEMINI_PROXY_URL` بالفرونت إند بعد النشر)

## مشروع الـ Proxy المنفصل

- **المسار**: `D:\ERP-Projects\lyalina-gemini-proxy` (ريبو GitHub مستقل: `weeshi/lyalina-gemini-proxy`)
- **الغرض**: وسيط Cloudflare Worker يخفي مفتاح Gemini عن الفرونت — لا يُكتب أي مفتاح في الفرونت أبداً
- **دستوره الخاص**: `D:\ERP-Projects\lyalina-gemini-proxy\AGENTS.md` (انظر إليه قبل تعديل الـ Worker)
- **التشغيل المحلي**: `npx wrangler dev --port 8787` (الفرونت يوجه إلى `localhost:8787` عبر `.env.local`)
