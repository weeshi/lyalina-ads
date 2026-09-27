# دستور العمل - Lyalina Gemini Proxy (Cloudflare Worker)

> **نطاق هذا الدستور:** يخص ريبو `lyalina-gemini-proxy` فقط. القواعد 10/11 الخاصة بالفرونت إند (نسخ احتياطية، أسرار) موثّقة بـ `AGENTS.md` منفصل في ريبو `lyalina-ads-manager`.

## المهمة

وسيط (Proxy) يُخفي مفتاح **Gemini API** خلف Cloudflare Worker. الفرونت إند لا يرى المفتاح أبداً — يرسل طلباته هنا فقط.

## هيكل المشروع

```
lyalina-gemini-proxy/
├── src/
│   └── index.ts              # كامل منطق الـ Worker (ملف واحد)
├── wrangler.toml             # إعدادات النشر + Vars (غير سرية)
├── .dev.vars                 # الأسرار المحلية للتطوير (مستبعد من git)
├── package.json              # الاعتماديات: jose (JWT)، typescript، wrangler
├── tsconfig.json
└── .gitignore                # يستبعد node_modules/, .wrangler/, .dev.vars
```

## قواعد التطوير

1. **اللغة**: تحدّث دائماً باللغة العربية مع المستخدم، والعربية فقط في التعليقات
2. **الأمان (الأهم)**: أي سر حساس (مفتاح Gemini، إيميلات السوبر أدمن) يُخزَّن حصراً:
   - محلياً → `.dev.vars`
   - بالإنتاج → `npx wrangler secret put <NAME>`
   - **ممنوع** إدراج أي سر في `wrangler.toml` أو `src/` أو أي ملف مراقَب من git
3. **Vars (غير سرية)** في `wrangler.toml` ضمن `[vars]` — تُقرأ عبر `env.NAME`
4. **التوثيق**: فحص `jwtVerify` (issuer/audience/email_verified) + فحص الأدوار + `email_verified` إلزامي
5. **البناء/التحقق**: `npx tsc --noEmit` قبل أي deploy
6. **النشر**: `npx wrangler deploy` بعد تعديل الكود أو الأسرار
7. **النسخ الاحتياطية**: لا تعديل على النسخ الاحتياطية الموجودة؛ أنشئ نسخة باسم/تاريخ جديد

8. **بروتوكول التحقق (إلزامي لكل مهمة)**:
   - ممنوع الإبلاغ "تم بنجاح" بدون دليل مباشر (status code فعلي، ناتج أمر حرفي، لقطة شاشة)
   - أي جزء لا يمكن التحقق منه ذاتياً (يتطلب متصفح/جلسة مستخدم حقيقية) يُذكر صراحة: "هذا يحتاج اختبارك أنت"
   - لا افتراضات: لو معلومة غير مؤكدة (مثل مصدر تعديل خارجي)، تُذكر كسؤال لا كحقيقة

9. **أي عملية لا رجعة فيها** (force push، حذف فرع، إعادة كتابة تاريخ git، حذف بيانات) تتطلب:
   - عرض التفاصيل كاملة (diff/log) + انتظار موافقة صريحة مكتوبة من المستخدم
   - ممنوع الافتراض أو "المتابعة لأنه يبدو آمناً"

10. **اسم موديل Gemini**: لا يُثبَّت (pin) اسم موديل محدد بتاريخ/رقم نسخة إطلاقاً — استخدام alias فقط (مثل `gemini-flash-latest`) إلا بطلب صريح من المستخدم مع سبب موثّق

11. **اعتماد خارجي**: هذا الـ Worker يعتمد على Firestore Security Rules المُدارة خارج هذا الريبو (Firebase Console، مشروع lyalina-ads). أي تعديل عليها له أثر على النظام كامل — يُنسَّق صراحة مع المستخدم قبل أي اقتراح تعديل

12. **الريبو Public مؤقتاً** (قرار المستخدم). طالما الحال كذلك: ممنوع إدراج أي قيمة حساسة جديدة بالكود مهما كان السبب أو الاستعجال — Secret فوراً عبر wrangler، بدون استثناء

13. **فحص أمان روتيني**: قبل أي deploy فيه تغيير بالاعتماديات (`package.json`): `npm audit --audit-level=high`، وأي ثغرة عالية تُحل أو تُذكر صراحة للمستخدم قبل النشر

14. **أي أمر git أو فحص يشمل أكثر من ريبو محتمل**: يُذكر صراحة اسم المجلد/الريبو الذي نُفّذ فيه الأمر ضمن التقرير نفسه — لا افتراض أن القارئ يعرف "أي مجلد" يقصد

## سير العمل

| الخطوة | الأمر |
|--------|-------|
| تطوير محلي | `cd D:\ERP-Projects\lyalina-gemini-proxy && npx wrangler dev --port 8787` |
| فرونت محلي | `cd D:\ERP-Projects\lyalina-ads-manager && pnpm dev` (يوجه إلى localhost:8787 عبر `.env.local`) |
| فحص النوع | `npx tsc --noEmit` |
| تعيين سر | `"<value>" | npx wrangler secret put <NAME>` |
| نشر | `npx wrangler deploy` |
| مراجعة الأسرار | `npx wrangler secret list` |

## المتغيرات وأنواعها

| الاسم | النوع | أمثلة/ملاحظات |
|-------|-------|---------------|
| `GEMINI_API_KEY` | 🔐 Secret | مفتاح Gemini الجديد |
| `SUPER_ADMIN_EMAILS` | 🔐 Secret | صيغة CSV: `a@x.com,b@y.com` |
| `ALLOWED_ORIGINS` | 📦 Var | CSV من `origin` المستحقة |
| `ALLOWED_ROLES` | 📦 Var | CSV، مثال: `sales,marketer,admin` |
| `GEMINI_MODEL` | 📦 Var | افتراضياً `gemini-flash-latest` |

## نقاط الأمان المثبتة

- CORS صارم بقائمة `ALLOWED_ORIGINS` (401/403 للمصادر الأجنبية)
- تحقق JWT من Firebase (issuer/audience) + `email_verified` إلزامي
- سوبر أدمن يتجاوز فحص الدور؛ غيره يُفحص عبر `system_users/{uid}` (قراءة ذاتية فقط — منع الترقية الذاتية)
- حد حجم الطلب (1MB) + rate limit لكل `uid` (30 req/دقيقة)
- إعادة محاولة تلقائية عند ازدحام Gemini (429/503) -> 4 محاولات بتأخير تصاعدي

## اختبار محلي سريع

```powershell
curl.exe -s -X POST -H "Origin: http://localhost:3000" http://localhost:8787/
# توقع: {"error":"Missing Authorization header"} HTTP 401
```