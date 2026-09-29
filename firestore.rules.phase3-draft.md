# مسودة المرحلة 3 — firestore.rules (ليست فعّالة، توثيق فقط)

> **ملاحظة هامة**: هذه مسودة تحتاج جولة اختبار كاملة بـ Rules Playground قبل أي نشر — لم تُختبر بعد، لا تُنشر مباشرة.

---

```plaintext
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // دوال مساعدة
    function appId() {
      return 'lyalina-ads-production';
    }
    
    function isNotAnonymous() {
      return request.auth != null 
        && request.auth.token.firebase.sign_in_provider != 'anonymous';
    }
    
    function getSystemUser(uid) {
      return get(/databases/$(database)/documents/artifacts/$(appId())/public/data/system_users/$(uid));
    }
    
    function isValidUser(uid) {
      let userDoc = getSystemUser(uid);
      return userDoc.exists 
        && userDoc.data.isActive != false
        && userDoc.data.role in ['admin', 'sales', 'marketer'];
    }
    
    function isAdmin(uid) {
      let userDoc = getSystemUser(uid);
      return userDoc.exists && userDoc.data.role == 'admin';
    }
    
    function canManageSystemUsers(uid) {
      return isAdmin(uid);
    }
    
    function resourceOwnerOrAdmin(uid) {
      return resource.data.ownerId == uid || isAdmin(uid);
    }

    // system_users: قراءة للمسجلين الصالحين، كتابة للأدمن فقط
    match /artifacts/{appId}/public/data/system_users/{uid} {
      allow read: if isNotAnonymous() && isValidUser(request.auth.uid);
      allow create: if isNotAnonymous() && canManageSystemUsers(request.auth.uid);
      allow update: if isNotAnonymous() 
        && canManageSystemUsers(request.auth.uid)
        && (!request.resource.data.keys().hasAny(['role', 'isActive']) 
            || request.resource.data.role == resource.data.role
            && request.resource.data.isActive == resource.data.isActive);
      allow delete: if isNotAnonymous() && canManageSystemUsers(request.auth.uid);
    }

    // باقي المجموعات: قراءة/كتابة للمستخدمين الصالحين، حذف للأدمن
    match /artifacts/{appId}/public/data/{collection}/{docId} {
      allow read: if isNotAnonymous() && isValidUser(request.auth.uid);
      allow create: if isNotAnonymous() && isValidUser(request.auth.uid);
      allow update: if isNotAnonymous() 
        && isValidUser(request.auth.uid)
        && (resourceOwnerOrAdmin(request.auth.uid) 
            || collection == 'wallet_transactions');
      allow delete: if isNotAnonymous() && isAdmin(request.auth.uid);
    }
  }
}
```

---

## الفروقات الجوهرية عن النسخة المنشورة حالياً:

| الميزة | النسخة المنشورة (الحالية) | مسودة المرحلة 3 |
|----------|------------------------|-----------------|
| **SuperAdmin** | عبر email في `isSuperAdmin()` | عبر role == 'admin' في Firestore |
| **التحقق من المستخدم** | `userExists()` + `isActive != false` | `isValidUser(uid)` + role في `['admin','sales','marketer']` |
| **system_users read** | `signedIn()` فقط | `isNotAnonymous() && isValidUser()` |
| **system_users write** | `isSuperAdmin()` فقط | `canManageSystemUsers()` (admin فقط) |
| **system_users update** | SuperAdmin أو صاحب الحساب (بدون role/isActive) | Admin فقط، مع حماية role/isActive |
| **باقي المجموعات read/write** | `isSuperAdmin() || isValidUser()` | `isNotAnonymous() && isValidUser()` |
| **wallet_transactions** | لا يوجد استثناء خاص | استثناء في update: يسمح للكل |
| **الحذف** | Admin فقط | Admin فقط |

---

## مخاطر محتملة في المسودة تحتاج اختبار:

1. **`hasAny(['role', 'isActive'])`** — صياغة نصية وليست حقول حقيقية، قد تفشل
2. **`wallet_transactions` exception** — يسمح بالتحديث للجميع، قد يفتح ثغرة
3. **`resourceOwnerOrAdmin`** — يعتمد على `ownerId` الحقل، يجب تأكيد وجوده بكل المجموعات
4. **عدم وجود default deny** — النسخة المنشورة فيها `match /{document=**} { allow read, write: if false; }`

---

**تاريخ الإنشاء**: $(date) — للتوثيق فقط.