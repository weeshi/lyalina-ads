// @ts-nocheck
import { z } from 'zod';
import { firebaseConfig, appId } from './firebaseConfig';

/**
 * مخطط (Schema) التحقق من إعدادات الاتصال بقاعدة البيانات (Firebase).
 * يتحقق من صحة القيم المزروعة أو القادمة من `.env` قبل تشغيل التطبيق.
 */

export const ConfigSchema = z.object({
  apiKey: z.string().min(20, 'مفتاح Firebase (apiKey) قصير جداً — تأكد من تعبئته'),
  authDomain: z.string().min(5, 'authDomain غير مكتمل — انسخه من Firebase Console'),
  projectId: z.string().min(3, 'projectId غير مكتمل'),
  storageBucket: z.string().min(5, 'storageBucket غير مكتمل'),
  messagingSenderId: z.string().min(5, 'messagingSenderId غير مكتمل'),
  appId: z.string().min(10, 'appId غير مكتمل — انسخه من Firebase Console'),
});

/**
 * نتيجة فحص الإعدادات: فهرس الأخطاء + فهرس التحذيرات + حالة الاكتمال.
 */
export interface ValidationResult {
  /** هل كل القيم المطلوبة سليمة؟ */
  isValid: boolean;
  /** أخطاء تمنع تشغيل التطبيق بشكل صحيح (مفاتيح placeholder أو قيم ناقصة). */
  errors: string[];
  /** تحذيرات غير مانعة (مثل مفاتيح حساسة مكشوفة في config بدل .env). */
  warnings: string[];
  /** تعليمات دليلية للمستخدم لكل خطأ. */
  hints: Record<string, string>;
}

/** القيم الوصفية للعناصر مقابل تلميحات الحل. */
const HINTS: Record<string, string> = {
  apiKey: 'اذهب إلى Firebase Console ← إعدادات المشروع ← عام ← تطبيقاتك وانسخ "Web API Key"',
  authDomain: 'ينبغي أن يكون {projectId}.firebaseapp.com',
  projectId: 'غيّره إلى projectId الخاص بك (من إعدادات المشروع)',
  storageBucket: 'ينبغي أن يكون {projectId}.firebasestorage.app',
  messagingSenderId: 'ينبغي أن يكون الرقم التسلسلي لمشروعك',
  appId: 'انسخ "App ID" من Firebase Console ← تطبيقاتك',
};

/** كشف المفاتيح التي لا تزال تحمل القيمة الافتراضية (placeholder). */
function isPlaceholder(value) {
  return typeof value === 'string' && value.trim().startsWith('PASTE_YOUR_');
}

/** كشف ما إذا كان المتغير يُتجاوز من `.env` (غير فارغ). */
function hasEnvValue(envKey) {
  const v = (import.meta.env[envKey] || '').trim();
  return v.length > 0;
}

/**
 * إجراء الفحص الكامل لإعدادات الاتصال.
 * يُستدعى عند بدء تشغيل التطبيق لإظهار تنبيهات واضحة للمستخدم.
 */
export function validateConfig(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const hints: Record<string, string> = {};

  const items = {
    apiKey:    { value: firebaseConfig.apiKey,          env: 'VITE_FIREBASE_API_KEY', required: true },
    authDomain:{ value: firebaseConfig.authDomain,      env: 'VITE_FIREBASE_AUTH_DOMAIN', required: true },
    projectId: { value: firebaseConfig.projectId,       env: 'VITE_FIREBASE_PROJECT_ID', required: true },
    storageBucket: { value: firebaseConfig.storageBucket, env: 'VITE_FIREBASE_STORAGE_BUCKET', required: true },
    messagingSenderId: { value: firebaseConfig.messagingSenderId, env: 'VITE_FIREBASE_MESSAGING_SENDER_ID', required: true },
    appId:     { value: firebaseConfig.appId,           env: 'VITE_FIREBASE_APP_ID', required: true },
  };

  for (const [key, item] of Object.entries(items)) {
    const val = item.value;
    if (isPlaceholder(val)) {
      const src = hasEnvValue(item.env) ? `متغير .env (${item.env})` : 'القيمة المزروعة في config';
      errors.push(`المفتاح "${key}" ما زال بقيمة افتراضية placeholder (من ${src}).`);
      hints[key] = key === 'apiKey'
        ? 'أدخل المفتاح الحقيقي إما في `.env` (VITE_FIREBASE_API_KEY) أو في src/config/firebaseConfig.ts'
        : (HINTS[key] || 'أدخل القيمة الحقيقية من Firebase Console');
    } else if (item.required) {
      // تحقق من الصيغة عبر Zod
      const fieldSchema = ConfigSchema.shape[key];
      const r = fieldSchema.safeParse(val);
      if (!r.success) {
        errors.push(r.error.issues[0]?.message || `قيمة غير صالحة للمفتاح "${key}"`);
        hints[key] = HINTS[key] || 'تحقق من القيمة المدخلة';
      }
    }
  }

  // تحذير: مفاتيح حساسة مكشوفة داخل الكود المصدري (config) بدل .env
  for (const [key, item] of Object.entries(items)) {
    if (!isPlaceholder(item.value) && !hasEnvValue(item.env)) {
      warnings.push(`المفتاح الحساس "${key}" مكتوب مباشرةً في config وسيُرفع مع الكود — يفضّل وضعه في .env (${item.env}).`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    hints,
  };
}

/**
 * فحص سريع يُستخدم في واجهة الاستخدام: هل الإعدادات كاملة لتشغيل التطبيق؟
 * إذا لم تكتمل، تُعرض شاشة معالج التثبيت (Setup Wizard).
 */
export function isConfigComplete(): boolean {
  return validateConfig().isValid;
}

/**
 * التحقق من صحة كائن config كامل ضد المخطط (للاستخدام في الاختبارات).
 */
export function parseConfig(raw) {
  return ConfigSchema.parse(raw);
}
