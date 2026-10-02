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