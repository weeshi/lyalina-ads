# Lyalina Gemini Proxy

وسيط (Cloudflare Worker) يحمي مفتاح **Gemini API** لتطبيق Lyalina Ads Manager.

## لماذا؟

- الفرونت إند (React) لا يحتوي **أي مفتاح API** — الطلبات تمر عبر هذا الـ Worker فقط.
- يتحقق الـ Worker من هوية المستخدم (JWT من Firebase) وأدواره، ثم يمرّر الطلب إلى Gemini باستخدام المفتاح السري.

## البنية

```
[ React App ] ──(idToken)→ [ Cloudflare Worker ] ──(GEMINI_API_KEY secret)→ [ Gemini API ]
```

## المتطلبات

- Node.js + npm/pnpm
- حساب Cloudflare (Workers) مع حزمة `wrangler`

## التشغيل

### 1) التطوير المحلي

```bash
npm install
npx wrangler dev --port 8787
```

### 2) تعيين الأسرار (مرة واحدة للنشر)

```bash
"<GEMINI_API_KEY>" | npx wrangler secret put GEMINI_API_KEY
"<a@x.com,b@y.com>" | npx wrangler secret put SUPER_ADMIN_EMAILS
```

### 3) النشر

```bash
npx wrangler deploy
```

بعد النشر سترى الرابط (مثلاً `https://lyalina-gemini-proxy.<account>.workers.dev`) — ضبطه بالفرونت عبر متغير `VITE_GEMINI_PROXY_URL`.

## المتغيرات

| Var | النوع | الغرض |
|-----|-------|-------|
| `GEMINI_API_KEY` | Secret | مفتاح Gemini (سري) |
| `SUPER_ADMIN_EMAILS` | Secret | إيميلات السوبر أدمن (CSV) — سري |
| `ALLOWED_ORIGINS` | Var | مكوّنات `Origin` المسموح بها (CSV) |
| `ALLOWED_ROLES` | Var | الأدوار المسموحة: sales, marketer, admin |
| `GEMINI_MODEL` | Var | النموذج، افتراضياً `gemini-flash-latest` |

## الأمان

- CORS مقيد بقائمة `ALLOWED_ORIGINS`
- تحقق JWT: issuer + audience + `email_verified` إلزامياً
- فحص الأدوار: سوبر أدمن يتجاوز، الغير يقارن عبر Firestore `system_users/{uid}` (قراءة ذاتية فقط)
- حد حجم الطلب (1MB) + rate limit (30 req/دقيقة لكل uid)
- إعادة محاولة تلقائية عند ازدحام Gemini (429/503)

## اختبار

```powershell
curl.exe -s -X POST -H "Origin: http://localhost:3000" http://localhost:8787/
```

النتيجة المتوقعة بدون توكن: `401 Missing Authorization header`

## ريبوهات مرتبطة

- الفرونت إند: `D:\ERP-Projects\lyalina-ads-manager` — GitHub `weeshi/lyalina-ads-manager`
- مشروع الـ Worker: GitHub `weeshi/lyalina-gemini-proxy`