// @ts-nocheck
import { useMemo, useState } from 'react';
import { validateConfig } from '../config/validateConfig';
import { AlertCircle, CheckCircle2, Copy, Download, RefreshCw, Settings, Loader2, Wand2 } from 'lucide-react';

/**
 * معالج التثبيت داخل التطبيق (In-App Setup Wizard).
 * تظهر هذه الشاشة تلقائياً عند أول تشغيل إذا كانت إعدادات الاتصال بقاعدة
 * البيانات غير مكتملة، وتُرشد المستخدم لتعبئة القيم الصحيحة وتوليد
 * ملفات `.env` و `firebaseConfig.ts` جاهزة.
 */
const SetupWizard = ({ onComplete }) => {
    const issues = useMemo(() => validateConfig(), []);

    const [form, setForm] = useState({
        apiKey: '',
        authDomain: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: '',
        measurementId: '',
        appPath: 'lyalina-ads-production',
    });
    const [tab, setTab] = useState('env');
    const [copied, setCopied] = useState('');

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    // توليد محتوى .env
    const buildEnv = () => {
        const v = (k, fb) => form[k]?.trim() || fb || '';
        return [
            `VITE_FIREBASE_API_KEY=${v('apiKey')}`,
            `VITE_FIREBASE_AUTH_DOMAIN=${v('authDomain', form.projectId.trim() ? form.projectId.trim() + '.firebaseapp.com' : '')}`,
            `VITE_FIREBASE_PROJECT_ID=${v('projectId')}`,
            `VITE_FIREBASE_STORAGE_BUCKET=${v('storageBucket', form.projectId.trim() ? form.projectId.trim() + '.firebasestorage.app' : '')}`,
            `VITE_FIREBASE_MESSAGING_SENDER_ID=${v('messagingSenderId')}`,
            `VITE_FIREBASE_APP_ID=${v('appId')}`,
            `VITE_FIREBASE_MEASUREMENT_ID=${v('measurementId')}`,
            `VITE_FIREBASE_APP_PATH=${v('appPath', 'lyalina-ads-production')}`,
            '',
        ].join('\n');
    };

    // توليد محتوى firebaseConfig.ts
    const buildConfig = () => {
        const js = (v, fb) => JSON.stringify(form[v]?.trim() || fb || '');
        const project = form.projectId?.trim() || 'YOUR_PROJECT_ID';
        return [
            '// @ts-nocheck',
            'export const firebaseConfig = {',
            `  apiKey: ${js('apiKey', 'PASTE_YOUR_FIREBASE_API_KEY')},`,
            `  authDomain: ${js('authDomain') || JSON.stringify(project + '.firebaseapp.com')},`.replace(',,', ','),
            `  projectId: ${js('projectId') || JSON.stringify(project)},`.replace(',,', ','),
            `  storageBucket: ${js('storageBucket') || JSON.stringify(project + '.firebasestorage.app')},`.replace(',,', ','),
            `  messagingSenderId: ${js('messagingSenderId', 'YOUR_SENDER_ID')},`,
            `  appId: ${js('appId', 'PASTE_YOUR_FIREBASE_APP_ID')},`,
            `  measurementId: ${js('measurementId', 'YOUR_MEASUREMENT_ID')},`,
            '};',
            `export const appId = ${JSON.stringify(form.appPath?.trim() || 'lyalina-ads-production')};`,
            '',
        ].join('\n');
    };

    const envContent = buildEnv();
    const configContent = buildConfig();

    const copy = async (text, key) => {
        try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1500); }
        catch (e) { /* تجاهل */ }
    };

    const download = (filename, text) => {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-start justify-center p-4 py-10 font-sans text-right" dir="rtl">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 max-w-2xl w-full">
                {/* الرأس */}
                <div className="flex flex-col items-center mb-6 text-center">
                    <div className="bg-emerald-100 p-4 rounded-full text-emerald-600 mb-4">
                        <Wand2 size={36} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">معالج الإعداد الأولي</h1>
                    <p className="text-sm text-slate-500 mt-2">يبدو أن إعدادات الاتصال بقاعدة البيانات لم تكتمل بعد. أكمل الحقول أدناه لتجهيز المنصة.</p>
                </div>

                {/* ملخص المشاكل */}
                {issues.errors.length > 0 && (
                    <div className="bg-red-50 rounded-2xl border border-red-100 p-4 mb-5">
                        <div className="flex items-center gap-2 text-red-600 font-black text-sm mb-2">
                            <AlertCircle size={18} /> {issues.errors.length} ملاحظة يجب معالجتها
                        </div>
                        <ul className="text-xs text-red-700 space-y-1 pr-1">
                            {issues.errors.map((e, i) => <li key={i} className="flex gap-2"><span>•</span><span>{e}</span></li>)}
                        </ul>
                    </div>
                )}
                {issues.warnings.length > 0 && (
                    <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 mb-5">
                        <div className="flex items-center gap-2 text-amber-700 font-black text-sm mb-1">
                            <Settings size={16} /> تحذيرات (اختيارية)
                        </div>
                        <ul className="text-xs text-amber-700 space-y-0.5 pr-1">
                            {issues.warnings.map((w, i) => <li key={i} className="flex gap-2"><span>•</span><span>{w}</span></li>)}
                        </ul>
                    </div>
                )}

                {/* حقول الإدخال */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                    <Field label="مفتاح Firebase (apiKey)" value={form.apiKey} onChange={set('apiKey')} placeholder="AIza..." ltr />
                    <Field label="معرّف المشروع (projectId)" value={form.projectId} onChange={set('projectId')} placeholder="my-project" ltr />
                    <Field label="نطاق المصادقة (authDomain)" value={form.authDomain} onChange={set('authDomain')} placeholder="project.firebaseapp.com" ltr />
                    <Field label="حاوية التخزين (storageBucket)" value={form.storageBucket} onChange={set('storageBucket')} placeholder="project.firebasestorage.app" ltr />
                    <Field label="معرّف المرسل (messagingSenderId)" value={form.messagingSenderId} onChange={set('messagingSenderId')} placeholder="1234567890" ltr />
                    <Field label="معرّف التطبيق (appId)" value={form.appId} onChange={set('appId')} placeholder="1:xxx:web:yyy" ltr />
                    <Field label="معرّف القياس (measurementId) - اختياري" value={form.measurementId} onChange={set('measurementId')} placeholder="G-XXXXXXX" ltr />
                    <Field label="مسار البيانات (appPath)" value={form.appPath} onChange={set('appPath')} placeholder="lyalina-ads-production" ltr />
                </div>

                {/* المخرجات */}
                <div className="mt-4">
                    <div className="flex items-center gap-2 border-b border-slate-200 mb-3">
                        <TabBtn active={tab === 'env'} onClick={() => setTab('env')} label=".env (مُستبعد من Git)" />
                        <TabBtn active={tab === 'config'} onClick={() => setTab('config')} label="firebaseConfig.ts (زرع دائم)" />
                    </div>

                    {tab === 'env' && (
                        <CodeBlock
                            content={envContent}
                            hint="الصق هذا المحتوى في ملف ‎.env‎ في جذر المشروع (أو حمّله).
                                إعادة تشغيل خادم التطوير (pnpm dev) ستطبّق القيم."
                            onCopy={() => copy(envContent, 'env')}
                            onDownload={() => download('.env', envContent)}
                            copiedKey={copied} thisKey="env"
                        />
                    )}
                    {tab === 'config' && (
                        <CodeBlock
                            content={configContent}
                            hint="بديل للحقول أعلاه: استبدل ‎src/config/firebaseConfig.ts‎ بهذا المحتوى (لا يرافق Git حساسية).
                                اختيار أحد المسارين يكفي — الأولوية دائماً لملف ‎.env‎ إن وُجد."
                            onCopy={() => copy(configContent, 'config')}
                            onDownload={() => download('firebaseConfig.ts', configContent)}
                            copiedKey={copied} thisKey="config"
                        />
                    )}
                </div>

                {/* إجراءات */}
                <div className="flex items-center justify-between gap-3 mt-6">
                    <div className="text-xs text-slate-400 font-bold flex items-center gap-1">
                        <CheckCircle2 size={14} className="text-emerald-500" /> بعد الحفظ، انقر للمتابعة
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => window.location.reload()}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 flex items-center gap-1.5 transition-all">
                            <RefreshCw size={15} /> إعادة التحقق
                        </button>
                        <button onClick={onComplete}
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 shadow-lg shadow-emerald-200 flex items-center gap-1.5 transition-all">
                            <Loader2 size={15} /> متابعة التطبيق
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* حقل إدخال مضمّن */
const Field = ({ label, value, onChange, placeholder, ltr }) => (
    <div>
        <label className="block text-xs font-bold text-slate-600 mb-1">{label}</label>
        <input type="text" value={value} onChange={onChange} placeholder={placeholder} dir={ltr ? 'ltr' : 'rtl'}
            className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-bold text-sm text-slate-800 transition-all" />
    </div>
);

/* زر تبويب */
const TabBtn = ({ active, onClick, label }) => (
    <button onClick={onClick}
        className={`px-4 py-2 text-sm font-black rounded-t-xl transition-all ${active ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-emerald-600'}`}>
        {label}
    </button>
);

/* كتلة الكود مع النسخ/التحميل */
const CodeBlock = ({ content, hint, onCopy, onDownload, copiedKey, thisKey }) => (
    <div>
        {hint && <p className="text-xs text-slate-500 mb-2 font-semibold leading-relaxed">{hint}</p>}
        <div className="relative">
            <pre dir="ltr" className="text-left bg-slate-900 text-emerald-100 text-xs p-4 rounded-2xl overflow-auto max-h-60 whitespace-pre font-mono leading-relaxed">{content}</pre>
            <div className="absolute top-2 left-2 flex gap-2">
                <button onClick={onCopy}
                    className="bg-slate-700/80 hover:bg-slate-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all">
                    {copiedKey === thisKey ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                    {copiedKey === thisKey ? 'تم النسخ' : 'نسخ'}
                </button>
                <button onClick={onDownload}
                    className="bg-slate-700/80 hover:bg-slate-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all">
                    <Download size={13} /> تحميل
                </button>
            </div>
        </div>
    </div>
);

export default SetupWizard;
