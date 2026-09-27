// @ts-nocheck
/**
 * bootstrap.js — معالج التثبيت من سطر الأوامر (CLI).
 *
 * الأمر:  pnpm bootstrap
 *
 * ينجز الخطوات التالية تفاعلياً:
 *   1) فحص جاهزية المتطلبات (Node, pnpm, git, Firebase CLI).
 *   2) إنشاء ملف `.env` من `.env.example` إن لم يكن موجوداً.
 *   3) تعبئة قيم Firebase/Gemini تفاعلياً (اختياري).
 *   4) تثبيت الاعتماديات (pnpm install).
 *   5) تشغيل خادم التطوير (pnpm dev) أو النشر.
 *
 * وضع غير تفاعلي:  pnpm bootstrap --ci   (يتخطى الإدخال ويستخدم القيم الموجودة).
 */
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const ENV_TEMPLATE = resolve(ROOT, '.env.example');
const ENV_FILE = resolve(ROOT, '.env');
const CI = process.argv.includes('--ci');

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

const info = (m) => console.log(`${CYAN}${BOLD}[bootstrap]${RESET} ${m}`);
const ok = (m) => console.log(`${GREEN}✓ ${m}${RESET}`);
const warn = (m) => console.log(`${YELLOW}! ${m}${RESET}`);
const fail = (m) => { console.log(`${RED}✗ ${m}${RESET}`); process.exitCode = 1; };

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', stdio: opts.silent ? 'pipe' : 'inherit', shell: process.platform === 'win32' });
  return r;
}

function checkTool(name, args, versionRe, minVersion) {
  try {
    const r = spawnSync(name, args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 15000,
      shell: process.platform === 'win32',
    });
    if (r.status !== 0) return { ok: false, version: null };
    const out = (r.stdout || '').trim();
    const m = out.match(versionRe);
    const version = m ? m[1] : out;
    let meets = true;
    if (minVersion && version) {
      const [a, b] = [parseInt(version.split('.')[0], 10), parseInt(minVersion.split('.')[0], 10)];
      meets = a >= b;
    }
    return { ok: true, version, meets };
  } catch (e) {
    return { ok: false, version: null };
  }
}

// قراءة إصدار Firebase CLI من الحزمة المحلية (أسرع وأدق من تشغيل ثنائي .cmd).
function localFirebaseVersion() {
  try {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'node_modules', 'firebase-tools', 'package.json'), 'utf8'));
    return pkg.version || null;
  } catch (e) {
    return null;
  }
}

function open(url) {
  const cmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  if (process.platform === 'win32') {
    spawnSync('cmd', ['/c', 'start', '', url], { stdio: 'ignore' });
  } else {
    spawnSync(cmd, [url], { stdio: 'ignore' });
  }
}

async function main() {
  console.log('');
  info(`${BOLD}Lyalina Ads Manager — معالج التثبيت (bootstrap)${RESET}`);
  console.log('');

  // ── 1) فحص المتطلبات ─────────────────────────────────────────
  console.log(`${CYAN}[1/4] فحص المتطلبات...${RESET}`);
  const localFirebase = process.platform === 'win32'
    ? resolve(ROOT, 'node_modules', '.bin', 'firebase.cmd')
    : resolve(ROOT, 'node_modules', '.bin', 'firebase');

  const tools = [
    { name: 'Node.js', cmd: 'node', args: ['--version'], re: /v?(\d+\.\d+\.\d+)/, min: '20', hint: 'ثبّت Node.js من https://nodejs.org' },
    { name: 'pnpm', cmd: 'pnpm', args: ['--version'], re: /(\d+\.\d+\.\d+)/, min: '9', hint: 'ثبّت عبر: npm install -g pnpm' },
    { name: 'git', cmd: 'git', args: ['--version'], re: /(\d+\.\d+\.\d+)/, min: null, hint: 'ثبّت git من https://git-scm.com' },
    { name: 'Firebase CLI', cmd: existsSync(localFirebase) ? localFirebase : 'npx', args: existsSync(localFirebase) ? ['--version'] : ['firebase', '--version'], re: /(\d+\.\d+\.\d+)/, min: null, hint: 'تشغيل: npx firebase login' },
  ];

  const results = tools.map((t) => {
    let r;
    if (t.name === 'Firebase CLI') {
      const v = localFirebaseVersion();
      r = v ? { ok: true, version: v, meets: true } : checkTool(t.cmd, t.args, t.re, t.min);
    } else {
      r = checkTool(t.cmd, t.args, t.re, t.min);
    }
    const label = `${t.name} ${r.version ? '(' + r.version + ')' : ''}`;
    if (!r.ok) { warn(`${label} — غير مثبّت. ${t.hint}`); return false; }
    if (r.min && t.min && !r.meets) { warn(`${label} — إصدار قديم. المطلوب ${t.min}+. ${t.hint}`); return false; }
    ok(label);
    return true;
  });

  const allOk = results.every(Boolean);
  if (!allOk) {
    console.log('');
    warn('بعض المتطلبات غير مكتملة. استكملها ثم أعد تشغيل: pnpm bootstrap');
    if (CI) process.exit(1);
  } else {
    console.log('');
    ok('البيئة جاهزة بالكامل');
  }

  // ── 2) إنشاء ملف .env ────────────────────────────────────────
  console.log('');
  console.log(`${CYAN}[2/4] تجهيز ملف البيئة (.env)...${RESET}`);
  if (existsSync(ENV_FILE)) {
    ok('ملف .env موجود مسبقاً — لن نكتب فوقه');
  } else if (!existsSync(ENV_TEMPLATE)) {
    warn('ملف .env.example غير موجود — أنشئ .env يدوياً');
  } else {
    writeFileSync(ENV_FILE, readFileSync(ENV_TEMPLATE, 'utf8'));
    ok('تم إنشاء .env من .env.example');
    if (!CI) open('Docs/wizard.html'); // فتح المعالج التفاعلي
  }

  // ── 3) تعبئة القيم تفاعلياً (إن لم يكن --ci) ─────────────────
  if (!CI && existsSync(ENV_FILE)) {
    console.log('');
    console.log(`${CYAN}[3/4] تعبئة إعدادات الاتصال...${RESET}`);
    console.log(`${YELLOW}(اضغط Enter للاحتفاظ بالقيمة الفارغة الحالية)${RESET}`);
    const rl = readline.createInterface({ input, output });
    const env = readFileSync(ENV_FILE, 'utf8');
    const getKey = (k) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [null, ''])[1];

    const ask = async (field, label, placeholder) => {
      const cur = getKey(field);
      const answer = await rl.question(`${BOLD}${label}${RESET} (${cur ? 'حالي: ' + cur : placeholder || 'فارغ'}): `);
      return answer.trim() !== '' ? answer : cur;
    };

    const projectId = await ask('VITE_FIREBASE_PROJECT_ID', 'معرّف المشروع (projectId)');
    const apiKey = await ask('VITE_FIREBASE_API_KEY', 'مفتاح Firebase (apiKey)');
    const authDomain = await ask('VITE_FIREBASE_AUTH_DOMAIN', 'نطاق المصادقة (authDomain)', projectId + '.firebaseapp.com');
    const bucket = await ask('VITE_FIREBASE_STORAGE_BUCKET', 'حاوية التخزين (storageBucket)', projectId + '.firebasestorage.app');
    const sender = await ask('VITE_FIREBASE_MESSAGING_SENDER_ID', 'معرّف الإرسال (messagingSenderId)');
    const appId = await ask('VITE_FIREBASE_APP_ID', 'معرّف التطبيق (appId)');
    const meas = await ask('VITE_FIREBASE_MEASUREMENT_ID', 'معرّف القياس (measurementId)');
    const gemini = await ask('VITE_GEMINI_API_KEY', 'مفتاح Gemini AI (اختياري)');
    rl.close();

    const kv = (k, v) => v ? `${k}=${v}` : `${k}=`;
    const updated = [
      kv('VITE_FIREBASE_API_KEY', apiKey),
      kv('VITE_FIREBASE_AUTH_DOMAIN', authDomain),
      kv('VITE_FIREBASE_PROJECT_ID', projectId),
      kv('VITE_FIREBASE_STORAGE_BUCKET', bucket),
      kv('VITE_FIREBASE_MESSAGING_SENDER_ID', sender),
      kv('VITE_FIREBASE_APP_ID', appId),
      kv('VITE_FIREBASE_MEASUREMENT_ID', meas),
      kv('VITE_FIREBASE_APP_PATH', getKey('VITE_FIREBASE_APP_PATH')),
      kv('VITE_GEMINI_API_KEY', gemini),
      '', '',
    ].join('\n');
    writeFileSync(ENV_FILE, updated, 'utf8');
    ok('تم تحديث ملف .env بالقيم المدخلة');
  }

  // ── 4) التثبيت والإطلاق ───────────────────────────────────────
  console.log('');
  console.log(`${CYAN}[4/4] تثبيت الاعتماديات...${RESET}`);
  if (!existsSync(resolve(ROOT, 'node_modules'))) {
    const ir = run(process.platform === 'win32' ? 'pnpm' : 'pnpm', ['install']);
    if (ir.status === 0) ok('تم تثبيت الاعتماديات (pnpm install)');
    else fail('فشل تثبيت الاعتماديات');
  } else {
    ok('الاعتماديات مثبتة مسبقاً (node_modules موجود)');
  }

  // ── ملخص واقتراح الخطوة التالية ──────────────────────────────
  console.log('');
  console.log(`${GREEN}════════════════════════════════════════${RESET}`);
  info(`أصبحت المنصة جاهزة للانطلاق!`);
  console.log(`   • تطوير:   ${CYAN}pnpm dev${RESET}   (ثم افتح http://localhost:3000)`);
  console.log(`   • إنتاج:   ${CYAN}pnpm build${RESET}`);
  console.log(`   • نشر:     ${CYAN}pnpm deploy${RESET}   (يتطلب تسجيل الدخول إلى Firebase)`);
  console.log('');

  if (!CI && !process.argv.includes('--no-dev')) {
    const rl2 = readline.createInterface({ input, output });
    const run = await rl2.question('هل تريد تشغيل خادم التطوير الآن؟ (نعم/لا) [نعم]: ');
    rl2.close();
    if (!/^(لا|لا|n|no)$/i.test(run.trim())) {
      info('جارٍ تشغيل خادم التطوير...');
      spawnSync(process.platform === 'win32' ? 'pnpm' : 'pnpm', ['dev'], { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' });
    }
  }
}

main().catch((e) => { fail('حدث خطأ غير متوقع: ' + e.message); });
