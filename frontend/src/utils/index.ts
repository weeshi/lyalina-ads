// @ts-nocheck
export const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 10);

export const safeRender = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(safeRender).join('، ');
  try { return JSON.stringify(value); } catch (e) { return "[بيانات]"; }
};

export const parseCurrency = (val) => { if (typeof val === 'number') return val; return parseFloat(String(val || "0").replace(/[^0-9.-]+/g, "")) || 0; };

export const calculateProgress = (startDateStr, durationStr, status) => {
  if (status === 'مكتمل') return 100;
  if (!startDateStr || !durationStr) return 0;
  const start = new Date(startDateStr);
  const duration = parseInt(String(durationStr).replace(/\D/g, '')) || 0;
  if (isNaN(start.getTime()) || duration <= 0) return 0;
  const today = new Date();
  const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 0;
  if (diffDays >= duration) return 100;
  return Math.round((diffDays / duration) * 100);
};

export const translateAuthError = (code) => {
  switch (code) {
    case 'auth/invalid-email': return 'البريد الإلكتروني غير صالح.';
    case 'auth/user-disabled': return 'تم تعطيل هذا الحساب من قبل الإدارة.';
    case 'auth/user-not-found': return 'لا يوجد حساب مسجل بهذا البريد الإلكتروني.';
    case 'auth/wrong-password': return 'كلمة المرور غير صحيحة.';
    case 'auth/email-already-in-use': return 'البريد الإلكتروني مستخدم بالفعل لحساب آخر.';
    case 'auth/weak-password': return 'كلمة المرور ضعيفة جداً، يجب أن تكون 6 أحرف على الأقل.';
    default: return `حدث خطأ غير متوقع (${code}). يرجى المحاولة لاحقاً.`;
  }
};
