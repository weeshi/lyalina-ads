# ROADMAP - Lyalina Ads (ريبو موحّد)

## المرحلة 1: البنية التحتية
- ✅ Firebase project setup & hosting configuration
- ✅ Cloudflare Workers gemini-proxy deployment
- ✅ Firestore Security Rules phase 1 (basic structure)
- ✅ Environment variables segregation (dev vs prod)

## المرحلة 2: الأمان والتحقق
- ✅ OAuth client investigation (ID `227765361517-iigv000d8alqaasp5umeedhlsm8l9s5u` — **غير مستخدم** في الكود)
- ✅ Rate limiting design for free plan (KV: 100k reads/day, 1k writes/day)
- ✅ KV error-handling protocol: on failure → allow request + log `[RateLimit] KV error`
- ✅ Firestore rules registration (`firestore.rules` in `firebase.json`)
- ✅ `isActive` evidence in `getSystemUserRole` (line 175-177: `user.isActive === false` → 403)

## المرحلة 3: التشغيل والنشر
- ✅ `gemini-proxy` deployed: `https://lyalina-gemini-proxy.weeshiaia.workers.dev` (v `f0e2b794-7195-40c8-bbe7-cc51f107208c`)
- ✅ `npx tsc --noEmit` passes with no errors
- ✅ Root `firebase.json` + `frontend/firebase.json` both reference `firestore.rules`
- ✅ Backup protocol: never modify existing backups; create new copy with date/timestamp

## المرحلة 4: مستقبلي
- 🔳 Manual test: create Firestore user with `isActive=false` and verify 403 response
- 🔳 OAuth client cleanup: decide on deletion/relocation of unused `client_secrets` file
- 🔳 ROADMAP phase 4 review after isActive/OAuth tasks complete

## إصلاحات معلّقة
> بنود موقوفة بقرار صريح — لا تُنفَّذ حتى تحديد توقيتها.

*(لا توجد بنود مفتوحة حالياً — آخر بند `provider` في `useAuth.ts` تم إصلاحه، انظر المرحلة 5.)*

---

## المرحلة 5: الأمن وقوة الأنواع (2026-10)
### 5.1 الترقيع الأمني ✅
- ✅ **`pnpm.overrides` لـ `websocket-driver: ">=0.7.5"`** — يغلق الثغرة الحرجة (`Message corruption via abuse of protocol length headers`)
  - السبب الجذري: `faye-websocket@0.11.4` (أحدث إصدار) يعتمد نطاقاً فضفاضاً `>=0.5.1`، و`@firebase/database` ما زال يعتمد `faye-websocket` حتى في أحدث إصدار → **ترقية `firebase` وحدها لا تُصلح**، والـoverride هو الحل.
  - السلسلة: `firebase > @firebase/database > faye-websocket > websocket-driver`
- ✅ `react-router-dom` `^7.14.2 → ^7.18.4` — يغلق ثغرتين (DoS في مطابقة المسارات + RSC CSRF bypass)
- ✅ `vite` `^8.0.11 → ~8.0.16` — يغلق `server.fs.deny` bypass على Windows
  - ⚠️ **`~8.0.16` وليس `^`**: الإصدار `8.3.2` يُنهي البناء بانهيار أصلي (`memory allocation failed` في bundler rolldown على Windows). النطاق `~` يمنع الانجراف إلى 8.1+ اللامستقر.
- ✅ إضافة `src/vite-env.d.ts` (`/// <reference types="vite/client" />`) — كان الملف مفقوداً رغم أن `tsconfig.json` ي includه، فلم تكن أنواع `import.meta.env` و`*.css` معرَّفة إطلاقاً

**نتيجة `pnpm audit`:**

| | قبل | بعد |
|---|---|---|
| critical | 1 | **0** |
| high | 23 | **20** |
| moderate | 28 | 23 |
| low | 7 | 6 |

المتبقي من الـ20 high كلها خارج نطاق المتصفح: `firebase-tools` (CLI على جهاز التطوير) و`postcss`/`nanoid` (وقت البناء فقط) و`@grpc/grpc-js` (Node عبر `@firebase/firestore`، لا يُحزَّم للمتصفح).
> ملاحظة: `npm audit` غير صالح في المشروع (`ENOLOCK`) — استخدم `pnpm audit` فقط.

### 5.2 إصلاحات سلوكية (المرحلة A) ✅
| الملف | الخطأ | الإصلاح |
|---|---|---|
| `hooks/useAuth.ts` | `TS2304` — `provider` غير معرَّف في `catch` (كان معرَّفاً داخل `try`) | نقل الإنشاء فوق `try` |
| `AdsManager.tsx` `callGemini` | `TS2554` — معامل `contents` معلن كإجباري | `contents = null` |
| `AdsManager.tsx` `printInvoice` | `TS2554` — معامل `itemsList` معلن كإجباري | `itemsList = null` |
| `AdsManager.tsx` `addRow` / `handleAskAi` | `TS2554` ×3 | معاملات اختيارية |
| `SetupWizard.tsx` `v()` / `js()` | `TS2554` ×8 | `fb?` |

### 5.3 إزالة ضجيج الأنواع (المرحلة B) ✅
- **النتيجة: 86 خطأ → 0** على 33 ملفاً بعد إزالة `// @ts-nocheck` مؤقتاً، بإعدادات `strict: false`
- الأنماط المُصلَحة: حرفي `payload: any` (إضافة حقول بعد الإنشاء)، `map((d): any => ...)` لـ`{ id, ...doc.data() }` (الـspread_any كان يُسقط كل الحقول)، `SYSTEM_USERS_PATH` كـtuple، `colSpan={n}` بدل السلسلة، `import.meta.env`، `+new Date()` للفروق الزمنية، `Number()`/`String()` عند حدود DOM، وحذف prop غير مستخدم (`data` في `CRMView`)

### 5.4 المتبقي — إزالة `@ts-nocheck` 🔳
> **مهم:** `tsconfig.json` يعلن `strict: true` + `noUnusedLocals` + `noUncheckedIndexedAccess`، وهذه الإعدادات كانت معطّلة عملياً بواسطة `@ts-nocheck`. القياس بإعدادات strict الحقيقية = **879 خطأ متبقٍ**:
> `TS7006` (246) و`TS7031` (224) = معاملات بلا نوع صريح · `TS2339` (157) · `TS6133` (119) = متغيرات غير مستخدمة
>
> أي أن المرحلة B أزالت ضجيج الأنواع بالكامل، لكن **إزالة `@ts-nocheck` فعلياً تتطلب 879 إصلاحاً إضافياً** لأن `strict` يوفّر سطحاً أكبر.
- 🔳 إضافة `: any` آلياً للـ470 خطأ implicit-any (أكبرجزء ميكانيكي)
- 🔳 حذف 119 متغيراً غير مستخدم
- 🔳 تفعيل `strict` تدريجياً + **بوابة CI** تفحص نسخة بلا `@ts-nocheck` لمنع عودة أعطال `ReferenceError` من هذا النوع
- 🔳 (اختياري) `pnpm.overrides` لـ `postcss >=8.5.18` و`nanoid >=3.3.18` — وقت البناء فقط