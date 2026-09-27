# دستور العمل - Lyalina Ads (ريبو موحّد)

> **النطاق:** يخص الريبو الموحّد `lyalina-ads` الذي يجمع مشروعين فرعيين:
> - `frontend/` — تطبيق Lyalina Ads Manager (React + Firebase Hosting)
> - `gemini-proxy/` — وسيط Cloudflare Worker لإخفاء مفتاح Gemini
>
> للنشر، يبقى كل مشروع فرعي مستقلاً تماماً (Firebase Hosting وCloudflare Workers).

## هيكل المشروع

```
lyalina-ads/
├── frontend/              ← الفرونت إند (React، Firebase)
│   ├── src/
│   │   ├── AdsManager.tsx     # الموزع الرئيسي
│   │   ├── main.tsx           # نقطة الدخول
│   │   ├── firebase/index.ts  # تهيئة Firebase
│   │   ├── constants/         # الثوابت
│   │   ├── hooks/             # useAuth, useData, useFilters
│   │   └── components/        # Modals, Views, Layout, Auth
│   ├── vite.config.ts         # المنفذ 3000 (محلي)
│   └── package.json
├── gemini-proxy/          ← وسميط Cloudflare Worker
│   ├── src/index.ts           # كامل منطق الـ Worker
│   ├── wrangler.toml          # [vars] غير سرية
│   └── .dev.vars              # الأسرار المحلية (مستبعد)
├── scripts/
│   └── pm2-app.js             # wrapper تشغيل PM2 على Windows
├── ecosystem.config.cjs       # يدير الخدمتين معاً (frontend:3000, proxy:8787)
├── Docs/                      # التوثيق
├── TODO.md / README.md / AGENTS.md
└── .gitignore
```

## قواعد التطوير

### مشتركة (كل الأقسام)

1. **اللغة**: تحدّث دائماً باللغة العربية مع المستخدم، والعربية فقط في التعليقات
2. **تصحيحات أثناء النقل**: لا تُنقل `node_modules/`, `.wrangler/`, `dist/`, `build/`, `Backup/`, `*.zip`, `.env`, `.env.local`, `.dev.vars`, أي ملف `client_secret` أو ملف يحوي سراً — إطلاقاً
3. **النسخ الاحتياطية**: لا تعديل على النسخ الاحتياطية الموجودة؛ أنشئ نسخة باسم/تاريخ جديد
4. **بروتوكول التحقق (إلزامي لكل مهمة)**:
   - ممنوع الإبلاغ "تم بنجاح" بدون دليل مباشر (status code فعلي، ناتج أمر حرفي، لقطة شاشة)
   - أي جزء لا يمكن التحقق منه ذاتياً (يتطلب متصفح/جلسة مستخدم حقيقية) يُذكر صراحة: "هذا يحتاج اختبارك أنت"
   - لا افتراضات: لو معلومة غير مؤكدة، تُذكر كسؤال لا كحقيقة
5. **أي عملية لا رجعة فيها** (force push، حذف فرع، إعادة كتابة تاريخ git، حذف بيانات) تتطلب عرض التفاصيل كاملة + انتظار موافقة صريحة مكتوبة من المستخدم
6. **فحص أمان روتيني**: قبل أي deploy فيه تغيير اعتماديات: `npm audit --audit-level=high`، وأي ثغرة عالية تُحل أو تُذكر صراحةً قبل النشر
7. **الريبو Private** (قرار المستخدم الدائم): ممنوع إدراج أي سر بالكود — Secrets فوراً عبر الأنظمة المخصصة (wrangler / Firebase Functions)، بلا استثناء

8. **المجلدات الفرعية صراحةً**: عند العمل بريبو موحّد لمشروعين فرعيين (`frontend/`, `gemini-proxy/`): أي أمر أو تقرير يذكر صراحة أي مجلد فرعي يخص — لا اعتماد على "معروف ضمنياً" (نفس سبب لبس 8f1bad5/74ebc89 سابقاً)

### قسم الفرونت (`frontend/`)

9. **TypeScript**: استخدام `// @ts-nocheck` في جميع الملفات لتجاوز strict mode
10. **التقسيم**: فصل UI عن منطق الأعمال - UI في `components/`، منطق في `hooks/`
11. **المكونات**: مكوّن صغير واحد لكل ملف، يستقبل props فقط
12. **الهوك**: هوك واحد للاشتراك (`useData`) وهوك منفصل للفلترة (`useFilters`)
13. **Firebase**: إعدادات Firebase في `.env` (متغيرات `VITE_FIREBASE_*` عبر `import.meta.env`)
14. **التصميم**: Tailwind CSS utility classes فقط — لا ملفات `.css` إضافية
15. **البناء**: `pnpm dev` (منفذ 3000) للتطوير، `pnpm build` للإنتاج
16. **التسمية**: `id` و `data-component` للعناصر المهمة

### قسم الـ Proxy (`gemini-proxy/`)

17. **الأمان (الأهم)**: أي سر (مفتاح Gemini، إيميلات سوبر أدمن) حصراً: محلياً `.dev.vars`، بالإنتاج `npx wrangler secret put <NAME>` — ممنوع في `wrangler.toml` أو `src/`
18. **Vars (غير سرية)** في `wrangler.toml` ضمن `[vars]`
19. **التوثيق**: فحص `jwtVerify` (issuer/audience/email_verified) + الأدوار + `email_verified` إلزامي
20. **البناء/التحقق**: `npx tsc --noEmit` قبل أي deploy
21. **النشر**: `npx wrangler deploy` بعد تعديل الكود أو الأسرار
22. **اسم موديل Gemini**: لا يُثبَّت للنسخة بتاريخ — استخدم alias (`gemini-flash-latest`) إلا بطلب صريح موثّق
23. **اعتماد خارجي**: الـ Worker يعتمد على Firestore Security Rules المُدارة خارج هذا الريبو (Firebase Console، مشروع lyalina-ads) — أي تعديل يُنسَّق صراحةً مع المستخدم

### تشغيل الريبو الموحّد

| الخطوة | الأمر |
|--------|-------|
| تشغيل الخدمتين (PM2) | `cd D:\ERP-Projects\lyalina-ads && pm2 start ecosystem.config.cjs && pm2 save` |
| فرونت محلي | يعمل على `http://localhost:3000` (vite) |
| Proxy محلي | يعمل على `http://localhost:8787` (wrangler) |
| فحص النوع (Frontend) | `cd frontend && pnpm build` |
| فحص النوع (Proxy) | `cd gemini-proxy && npx tsc --noEmit` |
| نشر الفرونت | `cd frontend && pnpm deploy` |
| نشر الـ Worker | `cd gemini-proxy && npx wrangler deploy` |
| تعيين سر Proxy | `"<value>" | npx wrangler secret put <NAME>` |

## متغيرات البيئة

| الملف | الغرض |
|-------|-------|
| `frontend/.env` | إعدادات Firebase (`VITE_FIREBASE_*`) + `VITE_GEMINI_PROXY_URL` (اعتمادياً على `localhost:8787`) |
| `gemini-proxy/.dev.vars` | أسرار محلية للـ Worker (مستبعد من git) |
| `ALLOWED_ORIGINS` (Vars) | `https://lyalina-ads.web.app,https://lyalina-ads.firebaseapp.com,http://localhost:3000` |

## سير العمل

1. تشغيل الخدمتين: `pm2 start ecosystem.config.cjs` ثم `pm2 save` (إعادة تشغيل تلقائية)
2. قبل أي commit: `pnpm build` (frontend) + `npx tsc --noEmit` (proxy) + فحص تشدّد للأسماء الممنوعة في `.gitignore`
3. Firebase Console: https://console.firebase.google.com/project/lyalina-ads
4. نشر الـ Worker: `npx wrangler secret put GEMINI_API_KEY` ثم `npx wrangler deploy` ثم تعيين `VITE_GEMINI_PROXY_URL` بالفرونت