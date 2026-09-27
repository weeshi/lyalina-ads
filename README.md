# Lyalina Ads

نظام إدارة الإعلانات والعملاء لشركة ليالينا — ريبو موحّد يجمع الفرونت إند ووسيط Gemini في مشروع واحد.

## نظرة عامة

| جزء | المجلد | التقنية | الهدف |
|-----|--------|---------|-------|
| **Frontend** | `frontend/` | React 19 + Vite + Firebase | واجهة إدارة العملاء، المسوقين، الباقات، التحليلات |
| **Gemini Proxy** | `gemini-proxy/` | Cloudflare Worker | وسيط يُخفي مفتاح Gemini عن المتصفح |

```
[ React App (frontend/) ] ──(idToken)──> [ Cloudflare Worker (gemini-proxy/) ] ──(secret)──> [ Gemini API ]
```

الفرونت لا يحتوي أي مفتاح Gemini إطلاقاً — الطلبات تمر عبر الـ Worker فقط، الذي يتحقق من هوية المستخدم (JWT من Firebase) وأدواره ثم يمررها للمفتاح السري.

## التشغيل السريع

### 1) التطوير المحلي (PM2 — يدير الخدمتين معاً)

```powershell
cd D:\ERP-Projects\lyalina-ads
# تثبيت الاعتماديات (مرة واحدة)
cd frontend && pnpm install
cd ..\gemini-proxy && npm install
cd ..
# تشغيل الخدمتين
pm2 start ecosystem.config.cjs
pm2 save   # يعيد تشغيلهما تلقائياً بعد إقلاع الجهاز
```

- الفرونت على: `http://localhost:3000`
- الـ Proxy على: `http://localhost:8787`

### 2) دون تشغيل PM2 — يدوياً

```powershell
# نافذة 1 — الفرونت
cd D:\ERP-Projects\lyalina-ads\frontend && pnpm dev

# نافذة 2 — الـ Proxy
cd D:\ERP-Projects\lyalina-ads\gemini-proxy && npm run dev
```

## متغيرات البيئة

### الفرونت (`frontend/.env` — مستبعد من git)

| المتغير | الوصف |
|---------|--------|
| `VITE_FIREBASE_API_KEY` | مفتاح Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | نطاق المصادقة |
| `VITE_FIREBASE_PROJECT_ID` | معرف المشروع |
| `VITE_FIREBASE_STORAGE_BUCKET` | حاوية التخزين |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | معرف المرسل |
| `VITE_FIREBASE_APP_ID` | معرف التطبيق |
| `VITE_FIREBASE_MEASUREMENT_ID` | معرف القياس |
| `VITE_FIREBASE_APP_PATH` | مسار البيانات في Firestore (اختياري) |
| `VITE_GEMINI_PROXY_URL` | عنوان الـ Worker (اختياري — الافتراضي `localhost:8787`) |

نموذج: انسخ `frontend/.env.example` إلى `frontend/.env` وعبّئ القيم، أو استخدم معالج الإعداد (`pnpm bootstrap`).

### الـ Proxy (`gemini-proxy/.dev.vars` محلياً / Secrets بالنشر)

| الاسم | النوع | الغرض |
|-------|-------|-------|
| `GEMINI_API_KEY` | Secret | مفتاح Gemini (سري) |
| `SUPER_ADMIN_EMAILS` | Secret | إيميلات السوبر أدمن (CSV) — سري |
| `ALLOWED_ORIGINS` | Var | `origin` المسموحة: `https://lyalina-ads.web.app`, `https://lyalina-ads.firebaseapp.com`, `http://localhost:3000` |
| `ALLOWED_ROLES` | Var | الأدوار المسموحة: sales, marketer, admin |
| `GEMINI_MODEL` | Var | النموذج، افتراضياً `gemini-flash-latest` |

## النشر

### الفرونت → Firebase Hosting

```bash
cd frontend
pnpm build
pnpm deploy        # أو: npx firebase deploy --only hosting
```

المشروع المربوط: `lyalina-ads`

### الـ Proxy → Cloudflare Workers

```bash
cd gemini-proxy
"<GEMINI_API_KEY>" | npx wrangler secret put GEMINI_API_KEY
"<a@x.com,b@y.com>" | npx wrangler secret put SUPER_ADMIN_EMAILS
npx wrangler deploy
```

بعد النشر يُطرح رابط `https://lyalina-gemini-proxy.<account>.workers.dev` — اضبطه في `frontend/.env` عبر `VITE_GEMINI_PROXY_URL`.

## الأمان

- **الأسرار أبداً لا تُلتزم**: `.env`, `.env.local`, `.dev.vars`, `Backup/`, `*.zip` كلها في `.gitignore`
- CORS مقيد بقائمة `ALLOWED_ORIGINS`
- تحقق JWT: issuer + audience + `email_verified` إلزامياً
- فحص الأدوار عبر `system_users/{uid}` (قراءة ذاتية فقط — منع الترقية الذاتية)
- حد حجم الطلب (1MB) + rate limit (30 req/دقيقة)
- إعادة محاولة تلقائية عند ازدحام Gemini (429/503)

## المسارات الرئيسية (Frontend)

| المسار | العرض | الوصف |
|--------|-------|--------|
| `/` | CRMView | إدارة العملاء |
| `/marketers` | MarketersView | إدارة المسوقين |
| `/packages` | PackagesView | إدارة الباقات |
| `/analytics` | AnalyticsView | التحليلات والتقارير |
| `/settings` | SettingsView | الإعدادات |

## سير العمل للتطوير

1. شغّل الخدمتين (PM2 أعلاه)
2. قبل أي commit: `cd frontend && pnpm build` + `cd ../gemini-proxy && npx tsc --noEmit`
3. Firebase Console: https://console.firebase.google.com/project/lyalina-ads
4. قواعد التطوير الكاملة في `AGENTS.md`

## ريبوهات تاريخية

- `weeshi/lyalina-ads-manager` — الفرونت القديم (مؤرشف)
- `weeshi/lyalina-gemini-proxy` — الـ Worker القديم (مؤرشف)

## الترخيص

خاص — شركة ليالينا