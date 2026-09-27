# خريطة ملفات تطبيق Lyalina Ads Manager v8.0

> تم إنشاؤها بتاريخ: 2026-09-01  
> الهدف: توثيق شامل لهيكل المشروع، غرض كل ملف، ووظائفه الرئيسية لتسهيل الصيانة والنقل.

---

## شجرة المشروع (src/)

```
src/
├── main.tsx                           # نقطة الدخول، تحميل شرطي (SetupWizard / AdsManager)
├── AdsManager.tsx                     # الموزع الرئيسي: منطق الأعمال، الحالة، Firebase
├── index.css                          # ملف CSS الوحيد (Tailwind v4)
├── firebase/
│   └── index.ts                       # تهيئة Firebase (app, auth, db, secondaryApp)
├── config/
│   ├── firebaseConfig.ts              # إعدادات الاتصال المركزية (زرع + تجاوز .env)
│   └── validateConfig.ts              # تحقق Zod من الإعدادات + isConfigComplete()
├── constants/
│   └── index.ts                       # الثوابت (HEADERS, STATUS_OPTIONS, PACKAGES, ...)
├── utils/
│   └── index.ts                       # دوال مساعدة (generateId, safeRender, parseCurrency, ...)
├── hooks/
│   ├── useAuth.ts                     # إدارة المصادقة (onAuthStateChanged, سوبر أدمن)
│   ├── useData.ts                     # اشتراكات Firestore الحية (onSnapshot) لكل المجموعات
│   └── useFilters.ts                  # بحث، فلترة، فرز، ترقيم للجداول
├── components/
│   ├── Auth/
│   │   └── AuthScreen.tsx             # تسجيل دخول (إيميل/كلمة مرور + Google OAuth)
│   ├── Layout/
│   │   ├── Sidebar.tsx                # شريط جانبي: تنقل 5 أقسام + AI + إدارة مستخدمين
│   │   ├── Topbar.tsx                 # شريط علوي: مبدّل Workspace + سعر صرف + شارة سوبر أدمن
│   │   ├── AdvancedFiltersDrawer.tsx  # درج فلاتر متقدم (صفحة، حالة، دفع، تاريخ، أرشيف، محذوفات)
│   │   └── Toast.tsx                  # تنبيهات عائمة (نجاح/خطأ/معلومة) تختفي تلقائياً
│   ├── Modals/
│   │   ├── ModalWrapper.tsx           # غلاف موحد للمودال (عنوان، أيقونة، إغلاق، خلفية)
│   │   ├── CustomerModal.tsx          # إضافة/تعديل عميل (الاسم، واتساب، إيميل، مسوق)
│   │   ├── MarketerModal.tsx          # إضافة/تعديل مسوق (الاسم، واتساب، نسبة، بيانات مصرفية)
│   │   ├── PackageModal.tsx           # إضافة/تعديل باقة (تصنيف C/R/G، كود، أيام، أسعار)
│   │   ├── TopUpModal.tsx             # شحن محفظة عميل (د.ل → دولار، سعر صرف، ملاحظة)
│   │   ├── PayoutModal.tsx            # دفع عمولة مسوق (خصم من رصيد، توثيق د.ل)
│   │   ├── PointsModal.tsx            # إضافة/خصم نقاط عميل (العدد، السبب، نوع العملية)
│   │   ├── ProgressModal.tsx          # شريط تقدم للعمليات الطويلة (نسخ/استعادة)
│   │   ├── UserManagementModal.tsx    # إدارة حسابات الموظفين (إنشاء/تعطيل/دور/إعادة تعيين/حذف)
│   │   └── MarketerRequestModal.tsx   # طلب ربط/فك عميل من مسوق (يرسل للإدارة)
│   └── Views/
│       ├── CRMView.tsx                # شبكة بطاقات العملاء (رصيد محفظة، ديون، شحن، حذف)
│       ├── CustomerDetailView.tsx     # تفصيل عميل: محفظة، سجل مالي، فواتير، صفحات، تقرير AI
│       ├── MarketersView.tsx          # شبكة بطاقات المسوقين (إيرادات، عمولات، مدفوعات، رصيد)
│       ├── MarketerDetailView.tsx     # تفصيل مسوق: عملاء، حملات، مدفوعات، طلبات معلقة
│       ├── PackagesView.tsx           # جدول باقات قابل للتحرير (كود، تصنيف، مدة، أسعار)
│       ├── AnalyticsView.tsx          # لوحة تحليلات: KPIs، توزيع حالات، أعلى صفحات، ملخص مالي
│       └── SettingsView.tsx           # إعدادات: حساب، سعر صرف، Workspaces، نسخ احتياطي (Drive/محلي/استيراد)
├── components/
│   └── SetupWizard.tsx                # معالج تثبيت داخل التطبيق (يظهر عند config ناقص، يولّد .env و firebaseConfig.ts)
```

---

## تفصيل الملفات الرئيسية

### 1. نقطة الدخول والتطبيق الأساسي

| الملف | الغرض | الوظائف/التصدير الرئيسية |
|-------|-------|---------------------------|
| `main.tsx` | نقطة دخول React. يقرر عرض **SetupWizard** (إن لم يكتمل config) أو **AdsManager** (بـ `React.lazy`). | `Root()` → `<React.Suspense>` أو `<SetupWizard onComplete>` |
| `AdsManager.tsx` | **العقل المدبر**: يحمل كل الحالة (workspaces، campaigns، customers، marketers، invoices، wallets، points، payouts، packages، logs)، منطق المحفظة، النسخ الاحتياطي، Gemini AI. | `handleWalletPayment`, `handleSaveTopUp`, `handleRefundPayment`, `handleBackupAll`, `handleDriveBackup`, `handleRestore`, `handleAnalyzeCustomer`, `addLog`, `saveCampaign`, `updateDoc`, `deleteDocByType`, `handleSeedPackages` |

### 2. إعدادات Firebase و Config مركزي

| الملف | الغرض | الوظائف/التصدير الرئيسية |
|-------|-------|---------------------------|
| `firebase/index.ts` | تهيئة Firebase SDK وتصدير `app`، `auth`، `db`، `appId`، وتطبيق ثانوي `secondaryApp` لحسابات الموظفين. | `initializeApp`, `getAuth`, `getFirestore`, `secondaryApp`, `secondaryAuth` |
| `config/firebaseConfig.ts` | **ملف الزرع الوحيد**: قيم افتراضية (placeholders للمفاتيح الحساسة) + تجاوز من متغيرات `VITE_FIREBASE_*` و `VITE_GEMINI_API_KEY` عبر دالة `pick()`. | `firebaseConfig` (object)، `appId` (string المسار في Firestore)، `geminiApiKey` (string) |
| `config/validateConfig.ts` | تحقق وقت التشغيل باستخدام **Zod**: يفحص صحة القيم، يميّز بين أخطاء (مانعة) وتحذيرات (اختيارية)، يعيد `hints` للحل. | `ConfigSchema` (Zod)، `validateConfig()` → `{isValid, errors[], warnings[], hints{}}`، `isConfigComplete()`، `parseConfig()` |

### 3. الثوابت والدوال المساعدة

| الملف | الغرض | المحتويات الرئيسية |
|-------|-------|-------------------|
| `constants/index.ts` | كل الثوابت الثابتة للتطبيق. | `HEADERS` (أعمدة الحملات)، `STATUS_OPTIONS` (ألوان/أيقونات الحالات)، `CAMPAIGN_TYPES`، `SEX_OPTIONS`، `PAYMENT_METHODS`، `PACKAGE_CATEGORIES` (C/R/G)، `BASE_PACKAGES`، `DEFAULT_PACKAGES`، `PRESET_WORKSPACES`، `DEFAULT_WORKSPACE` |
| `utils/index.ts` | دوال مساعدة نقيّة. | `generateId()`، `safeRender()`، `parseCurrency()`، `calculateProgress()`، `translateAuthError()` |

### 4. الطبقات المنطقية (Hooks)

| الملف | الغرض | الوظائف/التصدير الرئيسية |
|-------|-------|---------------------------|
| `hooks/useAuth.ts` | مصادقة Firebase + التحقق من `system_users` في Firestore. يحدّد `isSuperAdmin` للبريد `ai@ly-tech.ly`. | `user`, `currentUser`, `isSuperAdmin`, `isAuthReady`, `googleAccessToken`, `handleLogout`, `globalAuthError` |
| `hooks/useData.ts` | **مصدر البيانات الحي**: ينشئ `onSnapshot` لـ 9 مجموعات (campaigns, customers, invoices, marketers, payouts, packages, marketerRequests, walletTransactions, systemLogs). يطبق فلترة `ownerId` و `workspaceId`. يحسب `customerStats` و `marketerStats`. | `data`, `customers`, `invoices`, `marketers`, `payouts`, `packages`, `marketerRequests`, `walletTransactions`, `isLoading`, `systemLogs`, `addLog`, `customerStats`, `marketerStats`, `saveCampaign`, `addCampaign`, `deleteDocByType`, `updateDoc`, `getDocRef`, `handleSeedPackages` |
| `hooks/useFilters.ts` | بحث، فلاتر (حالة، دفع، صفحة، تاريخ)، أرشيف/محذوفات، فرز، حد عرض (100 افتراضي). | `searchInput`, `searchTerm`, `filterPayment`, `filterStatus`, `filterPage`, `filterDateStart`, `filterDateEnd`, `showArchived`, `showDeleted`, `sortConfig`, `displayLimit`, `uniquePageNames`, `activeFiltersCount`, `sortedAndFilteredData`, `clearAllFilters` |

### 5. المصادقة والشاشة الرئيسية

| الملف | الغرض | الوظائف/التصدير الرئيسية |
|-------|-------|---------------------------|
| `components/Auth/AuthScreen.tsx` | شاشة تسجيل دخول: إيميل/كلمة مرور + Google OAuth (scope `drive.file`). ترجمة أخطاء Firebase للعربية. | `handleSubmit` (signInWithEmailAndPassword)، `handleGoogleSignIn` (signInWithPopup + onGoogleAuthSuccess) |

### 6. مكونات التخطيط (Layout)

| الملف | الغرض | الوظائف/التصدير الرئيسية |
|-------|-------|---------------------------|
| `components/Layout/Sidebar.tsx` | شريط جانبي ثابت: 5 أيقونات تنقل (حملات، تحليلات، عملاء، مسوقين، باقات) + زر AI Assistant + زر إدارة مستخدمين (سوبر أدمن فقط) + إعدادات. | `navItems` array، `currentView` highlighting |
| `components/Layout/Topbar.tsx` | شريط علوي: قائمة `workspaceHistory` لتبديل الحساب الإعلاني، عرض `globalExchangeRate`، شارة "إدارة" للسوبر أدمن. مخفي في عرض الإعدادات. | `workspaceId`, `workspaceHistory`, `handleWorkspaceChange`, `globalExchangeRate`, `isSuperAdmin` |
| `components/Layout/AdvancedFiltersDrawer.tsx` | درج جانبي يفتح من اليمين: فلاتر الصفحة، الحالة، الدفع، نطاق تاريخ، عرض الأرشيف/المحذوفات، مسح الفلاتر. | كل الفلاتر من `useFilters` + `clearAllFilters` |
| `components/Layout/Toast.tsx` | تنبيه عائم أعلى الشاشة (4 ثوانٍ) مع أيقونة ولون حسب النوع (success/error/info). | `toast` prop `{message, type}`, `onClose` |

### 6. معالج التثبيت (Setup Wizard)

| الملف | الغرض | الوظائف/التصدير الرئيسية |
|-------|-------|---------------------------|
| `components/SetupWizard.tsx` | **يظهر تلقائياً** عند أول تشغيل إن كان config ناقص (`!isConfigComplete()`). يعرض أخطاء/تحذيرات، حقول إدخال لكل مفاتيح Firebase + Gemini، ويولد محتوى `.env` و `firebaseConfig.ts` جاهز للنسخ/التحميل. | `validateConfig()` → `issues`، `buildEnv()`، `buildConfig()`، `copy()`، `download()`، `onComplete` callback |

### 7. المودال (Modals) — جميعها تستخدم `ModalWrapper`

| الملف | الغرض | الحقول/الوظائف الرئيسية |
|-------|-------|------------------------|
| `ModalWrapper.tsx` | غلاف موحد: خلفية ضبابية، صندوق أبيض، عنوان + أيقونة، زر إغلاق، `children`. | `isOpen`, `onClose`, `title`, `icon`, `children` |
| `CustomerModal.tsx` | إضافة/تعديل عميل. | `name`, `phone`, `email`, `marketerId` (select)، `isEdit` |
| `MarketerModal.tsx` | إضافة/تعديل مسوك. في وضع التعديل تظهر حقول مصرفية. | `name`, `phone`, `rate`, `bankName`, `accountNum`, `isEdit` |
| `PackageModal.tsx` | إضافة/تعديل باقة. أزرار تصنيف (C/R/G) + حقول كود، أيام، سعر $، سعر د.ل. | `category`, `code`, `days`, `priceUSD`, `priceLYD` |
| `TopUpModal.tsx` | شحن محفظة عميل: مبلغ د.ل → دولار عبر سعر صرف، ملاحظة. | `amountLYD`, `rate`, `note`, `amountUSD` محسوب، `onSave(amountLYD, rate, amountUSD, note)` |
| `PayoutModal.tsx` | دفع عمولة مسوق: مبلغ $ (خصم من رصيد) + توثيق د.ل + ملاحظة. | `amount`, `amountLYD`, `note`, `onSave` |
| `PointsModal.tsx` | إضافة/خصم نقاط عميل: نوع (إضافة/خصم)، عدد، سبب. | `type` ('add'/'redeem'), `amount`, `reason`, `onSave` |
| `ProgressModal.tsx` | شريط تقدم للعمليات الطويلة (نسخ/استعادة). | `title`, `current`, `total`, `percentage` |
| `UserManagementModal.tsx` | **سوبر أدمن فقط**: إنشاء حسابات موظفين عبر `secondaryAuth`، تخزين في `system_users`، تفعيل/إيقاف، تغيير دور، إعادة تعيين كلمة مرور، حذف. | `handleCreateUser`, `toggleUserStatus`, `changeUserRole`, `handleResetPassword`, `handleDeleteUser` |
| `MarketerRequestModal.tsx` | مسوق يطلب ربط/فك عميل (يرسل طلباً للإدارة). | `selectedCust`, `onSubmit('add'/'unlink', customerId)` |

### 8. العروض (Views) — الصفحات الرئيسية

| الملف | الغرض | الميزات الرئيسية |
|-------|-------|-----------------|
| `CRMView.tsx` | شبكة بطاقات العملاء (3 أعمدة). كل بطاقة: الاسم، رصيد محفظة (أخضر/أحمر إن < 20$)، إجمالي الصرف، ديون، زر شحن (`TopUpModal`)، نقر يفتح `CustomerDetailView`. | `customers`, `customerStats`, `setSelectedCustomer`, `setCurrentView`, `toggleModal('topUp')` |
| `CustomerDetailView.tsx` | تفصيل عميل كامل: بطاقة رئيسية (محفظة + زر شحن + سداد حملات غير مفوترة)، صفحات مربوطة، **سجل محفظة** (جدول حركات: نوع، مبلغ د.ل، سعر صرف، تأثير $)، تبويب حملات (لفوترة)، تبويب فواتير (طباعة/واتساب/إيميل)، **تقرير Gemini AI**. | `activeCustomerTab` ('ledger'/'wallet_ledger'/'invoices')، `customerWalletTx`، `customerInvoices`، `handleWalletPayment`, `handleGenerateInvoice`, `printInvoice`, `printStatement`, `shareInvoiceWhatsApp`, `shareInvoiceEmail`, `handleAnalyzeCustomer` |
| `MarketersView.tsx` | شبكة بطاقات المسوقين: عملاء، حملات، نسبة عمولة، إيرادات، عمولة مستحقة، مدفوع، رصيد متبقي، بيانات مصرفية إن وجدت. نقر يفتح `MarketerDetailView`. | `marketers`, `marketerStats`, `setSelectedMarketer`, `toggleModal('addMarketer')` |
| `MarketerDetailView.tsx` | تفصيل مسوق: كروت إحصائيات، تقدم الإيرادات/المدفوعات، **مدفوعات** (تاريخ + إضافة عبر `PayoutModal`)، **طلبات معلقة** (سوبر أدمن يوافق/يرفض)، **إدارة عملاء** (مرتبطين/آخرين + بحث + ربط/فك)، **حملات** المسوق (أول 20). | `myCustomers`, `otherCustomers`, `myCampaigns`, `myPayouts`, `pendingRequests`, `handleLinkCustomerToMarketer`, `handleUnlinkCustomer`, `processMarketerRequest`, `toggleModal('payout')` |
| `PackagesView.tsx` | جدول باقات قابل للتحرير للسوبر أدمن (inline editing للكود، التصنيف، الأيام، الأسعار) + أزرار استيراد افتراضيات / حذف الكل / إضافة. | `packages`, `handlePackageUpdate`, `handleSeedPackages`, `handleDeleteAllPackages`, `toggleModal('package')` |
| `AnalyticsView.tsx` | **لوحة تحليلات**: 10 بطاقات KPI (إجمالي/نشط/مكتمل/متوقف/مدفوع/غير مدفوع/عملاء/صفحات/مسوقين)، ملخص مالي (إيرادات/محصلة/مستحقة)، إحصائيات ثانوية (رصيد محافظ، باقات، عمولات، متوسط حملة)، توزيع حالات (أشرطة نسب)، **أعلى 10 صفحات إنفاقاً**. | `useMemo` للحسابات، `data`, `customers`, `packages`, `marketerStats`, `marketers` |
| `SettingsView.tsx` | إعدادات شاملة: **حساب** (خروج)، **مالي** (سعر صرف افتراضي محفوظ في localStorage)، **Workspaces** (تبديل/إنشاء حسابات إعلانية)، **نسخ احتياطي**: رفع لجوجل درايف (يتطلب `googleAccessToken`)، تصدير كل البيانات / تصدير workspace الحالي / استيراد ودمج JSON (مع شريط تقدم `ProgressModal`)، عرض آخر نسخة احتياطية. | `handleWorkspaceChange`, `setGlobalExchangeRate`, `handleBackupAll`, `handleBackupCurrentWorkspace`, `handleDriveBackup`, `restoreInputRef`, `lastBackupDate` |

---

## تدفق البيانات الرئيسي

```
main.tsx
  └─ Root()
       ├─ !isConfigComplete() → SetupWizard (يولد .env / firebaseConfig.ts)
       └─ isConfigComplete() → AdsManager (lazy)
            ├─ useAuth() → currentUser, isSuperAdmin, googleAccessToken
            ├─ useData() → data, customers, marketers, invoices, payouts, packages, walletTransactions, systemLogs, addLog, customerStats, marketerStats
            ├─ useFilters() → sortedAndFilteredData, uniquePageNames, الفلاتر
            └─ يعرض View حسب currentView:
                 ├─ 'ads'       → جدول الحملات (داخل AdsManager مباشرة)
                 ├─ 'analytics' → AnalyticsView
                 ├─ 'crm'       → CRMView
                 ├─ 'customer-detail' → CustomerDetailView
                 ├─ 'marketers' → MarketersView
                 ├─ 'marketer-detail' → MarketerDetailView
                 ├─ 'packages'  → PackagesView
                 └─ 'settings'  → SettingsView
```

---

## المجموعات في Firestore (مسار: `artifacts/{appId}/public/data/{collection}`)

| المجموعة | الوصف | الحقول الرئيسية |
|-----------|-------|----------------|
| `campaigns` | الحملات الإعلانية | `اسم Ad`, `اسم الصفحة`, `القيمة`, `الحالة`, `الدفع`, `walletTxId`, `workspaceId`, `ownerId` |
| `customers` | العملاء | `name`, `phone`, `email`, `marketerId`, `linkedPages[]`, `walletBalanceUSD`, `points` |
| `invoices` | الفواتير المصدرة | `invoiceNum`, `customerId`, `items[]`, `total`, `currency`, `date` |
| `marketers` | المسوقون | `name`, `phone`, `email`, `rate`, `bankName`, `accountNum` |
| `payouts` | مدفوعات العمولات | `marketerId`, `amount`, `amountLYD`, `note`, `date` |
| `packages` | باقات الأسعار | `code`, `category` (C/R/G), `days`, `priceUSD`, `priceLYD` |
| `marketer_requests` | طلبات ربط/فك عملاء | `marketerId`, `customerId`, `customerName`, `action` ('add'/'unlink'), `status` ('pending'/'approved'/'rejected') |
| `wallet_transactions` | حركات المحافظ | `customerId`, `type` ('topup'/'deduction'/'refund'), `amountLYD`, `rate`, `amountUSD`, `note`, `adId` |
| `point_logs` | سجل النقاط | `customerId`, `type` ('add'/'redeem'), `amount`, `reason` |
| `system_users` | حسابات الموظفين | `email`, `name`, `role` ('sales'/'marketer'/'admin'), `isActive` |

---

## الأوامر والسكريبتات

| الأمر | الوصف |
|-------|-------|
| `pnpm dev` | تشغيل خادم التطوير (Vite) على `http://localhost:3000` |
| `pnpm build` | بناء إنتاج في مجلد `dist/` |
| `pnpm preview` | معاينة البناء محلياً |
| `pnpm deploy` | بناء + نشر على Firebase Hosting (`npx firebase deploy`) |
| `pnpm bootstrap` | **معالج تثبيت سريع**: يفحص Node/pnpm/git/Firebase CLI، ينشئ `.env` من المثال، يفتح Wizard تفاعلي، يثبّت الاعتماديات، يشغّل dev. خيارات: `--ci` (غير تفاعلي)، `--no-dev` (لا يشغّل dev). |
| `docker compose up -d --build` | بناء وتشغيل حاوية Docker (Nginx على المنفذ 8080) مع تمرير متغيرات `.env` كـ build args. |

---

## ملفات التوثيق (Docs/)

| الملف | المحتوى |
|-------|---------|
| `installation.html` | دليل تثبيت كامل: خطوات، config مزروع، Firebase setup، bootstrap، Docker، troubleshooting، Firebase Hosting. |
| `README.md` | ملخص سريع: أوامر، متغيرات بيئة، نشر Firebase، نشر Docker، مسارات، سير عمل تطوير. |
| `FaQ.html` | أسئلة متكررة. |
| `wizard.html` | نسخة ويب مستقلة من معالج التثبيت (تولد `.env` و `firebaseConfig.ts`). |

---

## نسخ احتياطية (لا تُعدّل - تُنشأ جديدة عند كل تحديث)

| المسار | الوصف | الحجم | التاريخ |
|--------|-------|-------|---------|
| `C:\Users\Weeshi\Downloads\lyalina-ads-manager-backup-2026-08-31.zip` | النسخة الأصلية الكاملة (864 MB) | 864 MB | 2026-08-31 |
| `C:\Users\Weeshi\Downloads\lyalina-ads-manager-backup-2026-08-31-with-docs.zip` | نسخة مع الوثائق | 3.38 MB | 2026-08-31 |
| `C:\Users\Weeshi\Downloads\lyalina-ads-manager-backup-2026-08-31-final.zip` | نسخة بعد التحسينات الأولى | 3.54 MB | 2026-08-31 |
| `C:\Users\Weeshi\Downloads\lyalina-ads-manager-backup-2026-09-01_0214.zip` | **أحدث نسخة** (تحتوي كل تحسينات 1-5 + AGENTS.md المحدث + FILE_MAP.md) | 3.64 MB | 2026-09-01 |

> **قاعدة ملزمة (AGENTS.md #11)**: لا تعديل أبداً على النسخ الاحتياطية الموجودة مسبقاً. عند أي تحديث أنشئ نسخة جديدة باسم/تاريخ مختلف.

---

## متغيرات البيئة (.env)

| المتغير | الوصف | مثال |
|----------|-------|------|
| `VITE_FIREBASE_API_KEY` | مفتاح Firebase Web API Key | `AIza...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | نطاق المصادقة | `lyalina-ads.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | معرف المشروع | `lyalina-ads` |
| `VITE_FIREBASE_STORAGE_BUCKET` | حاوية التخزين | `lyalina-ads.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | معرف المرسل | `667813824853` |
| `VITE_FIREBASE_APP_ID` | معرف تطبيق Firebase | `1:xxx:web:yyy` |
| `VITE_FIREBASE_MEASUREMENT_ID` | معرف Google Analytics | `G-JCSN80R0S0` |
| `VITE_FIREBASE_APP_PATH` | المسار داخل Firestore | `lyalina-ads-production` |
| `VITE_GEMINI_API_KEY` | مفتاح Gemini AI | `AIza...` |

> الأولوية: متغير `.env` (إن وُجد وغير فارغ) → القيمة المزروعة في `firebaseConfig.ts`.

---

## قرارات التصميم والمعايير

1. **لغة واحدة**: العربية في الكود، التعليقات، رسائل المستخدم، والتوثيق.
2. **TypeScript مع `// @ts-nocheck`** في كل الملفات لتجاوز strict mode.
3. **فصل الطبقات**: UI في `components/`، منطق في `hooks/`، إعدادات في `config/`، ثوابت في `constants/`.
4. **ملف config واحد قابل للزرع**: `src/config/firebaseConfig.ts` — عند نقل النظام غيّر القيم فيه فقط.
5. **Tailwind CSS فقط**: لا ملفات `.css` إضافية، ألوان `emerald`/`slate`، RTL افتراضي.
6. **بناء حديث**: Vite + `React.lazy` لتقسيم الحزم (AdsManager منفصل).
7. **الأمان**: المفاتيح الحساسة placeholders في config، القيم الحقيقية في `.env` (مستبعد من Git).
8. **النسخ الاحتياطي**: أبداً لا تُعدّل نسخة سابقة — أنشئ نسخة جديدة بتاريخ مختلف.

---

## نقاط الدخول للصيانة والنقل

| المهمة | الملف/المكان |
|--------|-------------|
| تغيير مشروع Firebase | `src/config/firebaseConfig.ts` (القيم المزروعة) أو `.env` |
| تعديل هيكل الحملات/العملاء | `src/constants/index.ts` (HEADERS) + `src/hooks/useData.ts` (filterAndSort) |
| إضافة فلتر جديد | `src/hooks/useFilters.ts` + `AdvancedFiltersDrawer.tsx` |
| إضافة مودال جديد | `components/Modals/ModalWrapper.tsx` + ملف المودال الجديد |
| إضافة عرض (View) جديد | `components/Views/` + تسجيل في `AdsManager.tsx` (currentView switch) |
| تغيير ألوان/ثيم | `index.css` (Tailwind v4 config) |
| إضافة حقل للمستخدم | `UserManagementModal.tsx` + `system_users` collection |
| تصدير/استيراد بيانات | `SettingsView.tsx` (handleBackupAll/Current/Drive/Restore) |

---

## حالة المشروع الحالية (2026-09-01)

- ✅ **بناء نظيف**: `pnpm build` يمر بدون أخطاء (1.67s).
- ✅ **TypeScript نظيف**: `npx tsc --noEmit` لا أخطاء.
- ✅ **Config مركزي + تحقق**: Zod validation + In-App Setup Wizard.
- ✅ **Bootstrap script**: `pnpm bootstrap` يعمل (خيارات `--ci`/`--no-dev`).
- ✅ **Docker جاهز**: Multi-stage build + Nginx SPA + docker-compose.
- ✅ **محفظة/تقارير/سجلات**: كلها متصلة وتعمل.
- ✅ **قواعد AGENTS.md**: قاعدة 1 (عربية دائماً)، قاعدة 11 (نسخ احتياطية جديدة).
- ⏸️ **GitHub upload**: مؤجل باختيار المستخدم (device flow رمز `E6A6-C27B` معلق).
- 📝 **FILE_MAP.md**: هذا الملف — تم إنشاؤه الآن.