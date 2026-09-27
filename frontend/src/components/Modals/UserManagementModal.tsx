// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import ModalWrapper from './ModalWrapper';
import { db, secondaryAuth, auth, appId } from '../../firebase';
import { safeRender, translateAuthError } from '../../utils';
import { ROLE_OPTIONS } from '../../constants';
import { Key, Loader2, Trash2, UserPlus, Users, Eye, EyeOff, AlertCircle, CheckCircle, X } from 'lucide-react';

const SYSTEM_USERS_PATH = ['artifacts', appId, 'public', 'data', 'system_users'];

const ConfirmDialog = ({ isOpen, onClose, title, message, onConfirm, confirmText = 'تأكيد', variant = 'destructive' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in duration-150" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${variant === 'destructive' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
            {variant === 'destructive' ? <Trash2 size={20} /> : <AlertCircle size={20} />}
          </div>
          <div className="flex-1">
            <h4 className="font-black text-slate-800">{title}</h4>
            <p className="text-sm text-slate-600 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition-colors">إلغاء</button>
          <button onClick={() => { onConfirm(); onClose(); }} className={`px-4 py-2 rounded-lg font-bold transition-colors ${variant === 'destructive' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-amber-600 text-white hover:bg-amber-700'}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const PasswordInput = ({ value, onChange, placeholder, label, error }) => {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="relative">
      <label className="block text-[10px] font-bold text-slate-500 mb-1">{label}</label>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full p-2.5 pr-10 rounded-lg border border-slate-200 outline-none text-sm font-bold text-slate-700 focus:border-emerald-500 transition-colors"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <p className="text-[10px] text-red-600 mt-1">{error}</p>}
    </div>
  );
};

const UserManagementModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('list');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('sales');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [systemUsers, setSystemUsers] = useState([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showToggleConfirm, setShowToggleConfirm] = useState(false);
  const [userToToggle, setUserToToggle] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const q = query(collection(db, ...SYSTEM_USERS_PATH));
    const unsub = onSnapshot(q, (snap) => {
      setSystemUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });
    return () => unsub();
  }, [isOpen]);

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ text: '', type: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [message.text]);

  const clearForm = useCallback(() => {
    setEmail(''); setPassword(''); setConfirmPassword(''); setName(''); setRole('sales');
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ text: 'كلمة المرور غير متطابقة', type: 'error' });
      return;
    }
    if (password.length < 6) {
      setMessage({ text: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', type: 'error' });
      return;
    }
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      await setDoc(doc(db, ...SYSTEM_USERS_PATH, userCredential.user.uid), {
        email, name, role, isActive: false, createdAt: serverTimestamp()
      });
      await signOut(secondaryAuth);
      setMessage({ text: 'تم إنشاء حساب الموظف بنجاح! الحساب في انتظار تفعيل المدير.', type: 'success' });
      clearForm();
      setActiveTab('list');
    } catch (error) {
      setMessage({ text: translateAuthError(error.code), type: 'error' });
    }
    setIsLoading(false);
  };

  const toggleUserStatus = async (user) => {
    try {
      await setDoc(doc(db, ...SYSTEM_USERS_PATH, user.id), { isActive: user.isActive === false ? true : false }, { merge: true });
      setMessage({ text: `تم ${user.isActive === false ? 'تنشيط' : 'إيقاف'} الحساب بنجاح`, type: 'success' });
    } catch(e) { setMessage({ text: 'حدث خطأ أثناء التحديث', type: 'error' }); }
  };

  const handleToggleConfirm = (user) => {
    setUserToToggle(user);
    setShowToggleConfirm(true);
  };

  const confirmToggle = () => {
    if (userToToggle) toggleUserStatus(userToToggle);
    setShowToggleConfirm(false);
    setUserToToggle(null);
  };

  const changeUserRole = async (userId, newRole) => {
    try { await setDoc(doc(db, ...SYSTEM_USERS_PATH, userId), { role: newRole }, { merge: true }); setMessage({ text: 'تم تحديث الصلاحية', type: 'success' }); } catch(e) { setMessage({ text: 'حدث خطأ أثناء التحديث', type: 'error' }); }
  };

  const handleResetPassword = async (userEmail) => {
    try { await sendPasswordResetEmail(auth, userEmail); setMessage({ text: `تم إرسال رابط لإعادة التعيين إلى ${userEmail}`, type: 'success' }); } catch(e) { setMessage({ text: 'حدث خطأ أثناء إرسال الرابط', type: 'error' }); }
  };

  const handleDeleteUser = async (userId) => {
    try { await deleteDoc(doc(db, ...SYSTEM_USERS_PATH, userId)); setShowDeleteConfirm(false); setConfirmDeleteId(null); setMessage({ text: 'تم حذف سجل الموظف', type: 'success' }); } catch(e) { setMessage({ text: 'حدث خطأ أثناء الحذف', type: 'error' }); }
  };

  const renderUserCard = (u) => {
    const roleOption = ROLE_OPTIONS.find(r => r.value === (u.role || 'sales')) || ROLE_OPTIONS[0];
    return (
      <div key={u.id} className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border ${u.isActive === false ? 'bg-red-50/50 border-red-100' : 'bg-white border-slate-100 hover:bg-slate-50/50 transition-colors'}`}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-black flex-shrink-0">
            {safeRender(u.name).charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-bold text-sm truncate ${u.isActive === false ? 'text-red-700 line-through' : 'text-slate-800'}`}>{safeRender(u.name)}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.isActive === false ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {u.isActive === false ? 'متجمد' : 'نشط'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono block mt-0.5 truncate">{safeRender(u.email)}</span>
            {u.createdAt?.seconds && (
              <span className="text-[10px] text-slate-400 block mt-0.5">مضاف: {new Date(u.createdAt.seconds * 1000).toLocaleDateString('ar-LY')}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={u.role || 'sales'}
            onChange={(e) => changeUserRole(u.id, e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 outline-none shadow-sm cursor-pointer focus:border-emerald-500 min-w-[140px]"
          >
            {ROLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.shortLabel}</option>)}
          </select>
          <button
            onClick={() => handleToggleConfirm(u)}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm transition-colors whitespace-nowrap ${u.isActive === false ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
          >
            {u.isActive === false ? 'تنشيط' : 'تجميد'}
          </button>
          <button
            onClick={() => handleResetPassword(u.email)}
            className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 shadow-sm transition-colors whitespace-nowrap"
            title="إرسال رابط لتغيير الرقم السري"
          >
            <Key size={14} className="inline-block align-middle ml-1" /> كلمة المرور
          </button>
          <button
            onClick={() => { setConfirmDeleteId(u.id); setShowDeleteConfirm(true); }}
            className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 shadow-sm transition-colors whitespace-nowrap"
          >
            <Trash2 size={14} className="inline-block align-middle ml-1" /> حذف
          </button>
        </div>
      </div>
    );
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="إدارة حسابات الموظفين" icon={<Key size={20} className="text-amber-600"/>} size="xl">
      <div className="space-y-4">
        <div className="flex border-b border-slate-200" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'list'}
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-3 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'list' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <Users size={16} className="inline-block align-middle ml-1" /> الموظفون الحاليون ({systemUsers.length})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'create'}
            onClick={() => { clearForm(); setActiveTab('create'); }}
            className={`flex-1 py-3 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'create' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <UserPlus size={16} className="inline-block align-middle ml-1" /> إضافة موظف
          </button>
        </div>

        {message.text && (
          <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-bold ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
            {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            <span>{message.text}</span>
            <button onClick={() => setMessage({ text: '', type: '' })} className="ml-auto text-slate-400 hover:text-slate-600"><X size={16} /></button>
          </div>
        )}

        {activeTab === 'list' && (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {systemUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-slate-300" />
                <p className="text-slate-500 mt-3 font-medium">لا توجد حسابات مسجلة بعد</p>
                <button
                  onClick={() => { clearForm(); setActiveTab('create'); }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors"
                >
                  <UserPlus size={16} /> إضافة أول موظف
                </button>
              </div>
            ) : (
              systemUsers.map(renderUserCard)
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">اسم الموظف</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-200 outline-none text-sm font-bold text-slate-700 focus:border-emerald-500 transition-colors"
                placeholder="مثال: أحمد محمد"
                autoComplete="name"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-200 outline-none text-sm font-bold text-slate-700 focus:border-emerald-500 transition-colors"
                placeholder="مثال: ahmed@company.com"
                autoComplete="email"
              />
            </div>
            <PasswordInput
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="6 أحرف على الأقل"
              label="كلمة المرور"
            />
            <PasswordInput
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="تأكيد كلمة المرور"
              label="تأكيد كلمة المرور"
            />
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">الصلاحية</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-200 outline-none text-sm font-bold text-slate-700 bg-white cursor-pointer focus:border-emerald-500 transition-colors"
              >
                {ROLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-800 text-white py-3 rounded-lg font-bold hover:bg-slate-700 text-sm flex justify-center items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'تسجيل الموظف'}
            </button>
          </form>
        )}

        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => { setShowDeleteConfirm(false); setConfirmDeleteId(null); }}
          title="حذف الموظف"
          message="هل أنت متأكد من حذف هذا الموظف؟ لا يمكن التراجع عن هذا الإجراء."
          onConfirm={() => handleDeleteUser(confirmDeleteId)}
          confirmText="حذف نهائي"
          variant="destructive"
        />

        <ConfirmDialog
          isOpen={showToggleConfirm}
          onClose={() => { setShowToggleConfirm(false); setUserToToggle(null); }}
          title={userToToggle?.isActive === false ? 'تنشيط الحساب' : 'تجميد الحساب'}
          message={userToToggle ? `هل تريد ${userToToggle.isActive === false ? 'تنشيط' : 'تجميد'} حساب "${safeRender(userToToggle.name)}"؟` : ''}
          onConfirm={confirmToggle}
          confirmText={userToToggle?.isActive === false ? 'تنشيط' : 'تجميد'}
          variant={userToToggle?.isActive === false ? 'success' : 'destructive'}
        />
      </div>
    </ModalWrapper>
  );
};

export default UserManagementModal;