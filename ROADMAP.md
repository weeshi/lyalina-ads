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

---

## المرحلة 6: خطة الثغرات المتبقية وإزالة `@ts-nocheck` 🔳
> **توثيق فقط — بلا تنفيذ.** هذه الخطة مرتّبة لتسلسل التنفيذ الآمن. كل مرحلة تُقاس قبل الانتقال للتالية، ولا تُدمج مرحلتان في Commit واحد.

### 6.1 تصنيف الثغرات المتبقية (بعد إصلاح المرحلة 5)

| الحزمة | الخطورة | المسار | وقت الأثر | قرار |
|---|---|---|---|---|
| `postcss` | high | `@tailwindcss/postcss` ← `vite` | **وقت البناء فقط** (DEV) | 🔳 `pnpm.overrides`: `postcss >=8.5.18` |
| `nanoid` | high | `@tailwindcss/postcss` ← `vite` | **وقت البناء فقط** | 🔳 `pnpm.overrides`: `nanoid >=3.3.18` |
| `firebase-tools` (حزمه الفرعية) | high ×~14 | `devDependencies` | جهاز التطوير فقط (CLI) | 🔴 **بلا إجراء** — لا يُحزَّم للمتصفح، ومُستثنى من `pnpm audit --prod` (مُتحقَّق) |
| `@grpc/grpc-js` | **high ×3** | `firebase > @firebase/firestore` | بيئة Node (الدوال/Serverless) | 🔴 **بلا إجراء** — الاستبدال بـ`@grpc/grpc-js-next` نضج فقط في 2026؛ firebase-sdk يتعامل معها |
| `protobufjs` | **high ×1** + moderate ×3 | `firebase > @firebase/firestore > @grpc/proto-loader` | بيئة Node | 🔴 **بلا إجراء** — حساسة للأداء، والبديل ترقّي دلالي كبير |
| `@modelcontextprotocol/sdk` + `hono` + `ajv` + `express` + `tar` | moderate ×~9 | `firebase-tools` فقط | جهاز التطوير | 🔴 **بلا إجراء** — نفس عائلة CLI |
| `firebase` | low ×2 | مباشر | المتصفح | 🔵 متابعة عند ترقية firebase |

**نطاق الإنتاج فقط (`pnpm audit --prod`):** 8 ثغرات = `4 high + 3 moderate + 1 low`، كلها في سلسلة `@firebase/firestore` (grpc-js/protobufjs). `firebase-tools` و`postcss` مُستثناة ✓.

**القاعدة الحاكمة:** لا يُعتبر أي high «غير مهم» قبل تصنيف مساره. الأولوية للأثري في المتصفح (runtime) > وقت البناء > جهاز التطوير.

**المرجع المعتمد:** `pnpm audit` فقط. `npm audit` يُرجع `ENOLOCK` في هذا المشروع (pnpm layout لا يفهمه npm) — أي رقم من `npm audit` هنا غير صالح.

### 6.2 سجل التسلسل A → E

| # | النطاق | الأثر المتوقع | المخاطر |
|---|---|---|---|
| **A** | إصلاحات سلوكية: TS2554 (معاملات ناقصة), TS2304 (رمز خارج النطاق) | **✅ منجزة** — صفر تغيير سلوك | صفر |
| **B** | إزالة ضجيج الأنواع (فحص non-strict): 86 → 0 | **✅ منجزة** | منخفضة |
| **C** | `@ts-nocheck` + `strict:false` مؤقتاً + `: any` آلي على 470 معامل | 879 → ~270 | متوسطة — `: any` يكبح future inference |
| **D** | حذف 119 متغيراً غير مستخدم + 157 `TS2339` (استبدال `any` بأنواع `Firestore`/واجهات حقيقية) | 270 → **0** | متوسطة — `TS2339` يمسّ منطق |
| **E** | `tsconfig` ≡ `strict:true` + حذف الـoverrides المؤقتة + **بوابة CI** تفحص نسخة بلا `@ts-nocheck` | جاهزية دائمة | منخفض |

#### المرحلة C — `@ts-nocheck` + `strict: false` مؤقتاً 🔳
```bash
# 1) أزل التعليقات (32 ملفاً) واستبدلها بـ ts-nocheck=false
# 2) قياس بـ strict=false => ~86 خطأ (الباقي يظهر عند strict فقط)
npx tsc --noEmit -p tsconfig.typecheck.json
# 3) الآلية: TS7006 (246) و TS7031 (224) = 470 معامل بلا نوع صريح
# 4) آلياً : any  — آمن مع TS7006/TS7031 فقط، ولا يمسّ TS2339 ولا TS6133
```
- **لا تستخدم** codemod عشوائي على `TS2339` — هو خطأ منطقي لا نقص نوع.
- **لا تلمس** `noUncheckedIndexedAccess` في C — يعطي أخطاء كتابة صحيحة التمم، اتركه لـE.

#### المرحلة D — الصنف الأخير يدوياً 🔳
- `TS6133` (119 متغيراً): احذف، أو `void x` إن كان له تأثير جانبي. **لا تبقِ bailout.**
- `TS2339` (157): استبدل `any` بـ:
  - `Firestore Data Converter` لـ`doc.data()` ← يعطي `docId()` و`withConverter()` مجاناً
  - واجهات صريحة لـ`Report` / `Customer` / `Marketer` / `Package`
  - النتيجة: `doc.data()` يبدأ بإرجاع `{...} | undefined` — وهذا مقصود؛ `strict` يفرض `?? {}` أو فحصاً صريحاً بدل `undefined` صامت.

#### المرحلة E — البوابة الدائمة 🔳
```jsonc
// scripts/typecheck.gate.json  — لا يُضمَّن في tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```
```bash
# في package.json scripts
"typecheck": "tsc -p tsconfig.typecheck.json",
"typecheck:strict": "tsc -p scripts/typecheck.gate.json",
"prebuild": "pnpm run typecheck:strict"   # البوابة: لا بناء بلا أنواع نظيفة
```
- `prebuild` يمنع المكسرات قبل النشر، لا بعده.
- **شرط الإنهاء:** 0 خطأ في `strict:true` مع 0 استخدام لـ `@ts-nocheck`، وخلوّ مسار المتصفح من أي high في `pnpm audit --prod`.

### 6.3 ترتيب التنفيذ الموصى به 🔳
1. **postcss + nanoid overrides** (يوم واحد، يغلق ~2 high) — منفصل عن مراحل الأنواع.
2. **C** (`strict:false` + آلي) — أكبر مكسب بأقل مخاطرة، قابل للمراجعة آلياً.
3. **D** (يدوي، على دفعات حسب المجلد: `Modals/` ← `Views/` ← `Layout/` ← `AdsManager`).
4. **E** (تشغيل CI + `prebuild`).
5. `firebase-tools` و`@grpc/grpc-js`: **بلا إجراء** — لا يوجد بديل نظيف.

### 6.4 حالة `@ts-nocheck` الآن 🔳
| البند | العدد |
|---|---|
| ملفات المصدر (`*.ts`/`*.tsx`) | 34 |
| فيها `@ts-nocheck` | **32** |
| بلا `@ts-nocheck` | 2 فقط: `main.tsx` و`vite-env.d.ts` (لا تحتاج فحص أنواع) |
| `strict` مُعلن في `tsconfig.json` | `true` — لكن معطّل عملياً بـ `@ts-nocheck` |
| `strict` مُفعّل فعلياً على الكود | **لا** |
| `vite-env.d.ts` | أُضيف في المرحلة 5 (كان مفقوداً رغم `include`) |