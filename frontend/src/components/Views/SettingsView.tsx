// @ts-nocheck
import { Settings, UserCircle, LogOut, Coins, Layers, Database, Download, HardDrive, Upload, Cloud, ChevronDown, Loader2, Plus, ShieldAlert, Link, Unlink, CheckCircle2 } from 'lucide-react';
import { memo, useState } from 'react';
import { safeRender } from '../../utils';

const SettingsView = ({
  currentUser, isSuperAdmin, workspaceId, workspaceHistory, handleWorkspaceChange,
  globalExchangeRate, setGlobalExchangeRate, tempWorkspaceId, setTempWorkspaceId,
  setWorkspaceHistory, addLog, handleLogout, handleBackupAll, handleBackupCurrentWorkspace,
  handleDriveBackup, googleAccessToken, restoreInputRef, lastBackupDate, setConfirmModal,
  linkGoogleAccount, refreshGoogleToken, isLinkingGoogle,
}) => {
  const [linkMessage, setLinkMessage] = useState({ text: '', type: '' });
  return (
    <div className="flex-1 bg-slate-50 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto pb-20">
        <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2"><Settings size={28} className="text-slate-600"/> الإعدادات المتقدمة</h2>

        {/* Account Profile Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-6 relative overflow-hidden">
          {isSuperAdmin && <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-black px-8 py-1 rotate-45 translate-x-6 translate-y-3 shadow-sm">SUPER ADMIN</div>}
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><UserCircle size={20} className="text-blue-600"/> الحساب الشخصي</h3>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 text-blue-700 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
                {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h4 className="font-bold text-slate-800">{currentUser?.displayName || 'حساب موثق رسمي'}</h4>
                <p className="text-xs text-slate-500 font-mono">{currentUser?.email || currentUser?.uid}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button onClick={() => setConfirmModal({show: true, message: "هل أنت متأكد من تسجيل الخروج؟", action: () => handleLogout()})} className="flex-1 sm:flex-none px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                <LogOut size={16}/> تسجيل خروج
              </button>
              {/* Google Account Linking */}
              <div className="flex items-center gap-2">
                {googleAccessToken ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-700">مرتبط بجوجل</span>
                    <button
                      onClick={async () => {
                        setLinkMessage({ text: 'جاري تحديث الصلاحية...', type: 'loading' });
                        const result = await refreshGoogleToken();
                        setLinkMessage({ text: result.success ? 'تم تحديث صلاحية جوجل درايف بنجاح!' : result.error, type: result.success ? 'success' : 'error' });
                      }}
                      disabled={isLinkingGoogle}
                      className="ml-2 px-3 py-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
                      title="تحديث صلاحية جوجل درايف"
                    >
                      {isLinkingGoogle ? <Loader2 size={12} className="inline-block align-middle ml-1 animate-spin" /> : <Loader2 size={12} className="inline-block align-middle ml-1" />} تحديث
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      setLinkMessage({ text: 'جاري الربط...', type: 'loading' });
                      const result = await linkGoogleAccount();
                      setLinkMessage({ text: result.success ? 'تم ربط حساب جوجل بنجاح! يمكنك الآن استخدام النسخ الاحتياطي السحابي.' : result.error, type: result.success ? 'success' : 'error' });
                    }}
                    disabled={isLinkingGoogle}
                    className="flex-1 sm:flex-none px-4 py-2 bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <Link size={16} /> {isLinkingGoogle ? 'جاري الربط...' : 'ربط حساب جوجل'}
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {linkMessage.text && linkMessage.type === 'loading' && (
            <div className="mt-4 p-3 rounded-xl text-sm font-bold bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" /> {linkMessage.text}
            </div>
          )}
          {linkMessage.text && linkMessage.type === 'error' && (
            <div className="mt-4 p-3 rounded-xl text-sm font-bold bg-red-50 text-red-700 border border-red-100">
              {linkMessage.text}
              {linkMessage.text.includes('403') && (
                <div className="mt-2 text-[11px] text-red-600 font-normal">
                  <p className="font-bold">خطوات الإصلاح:</p>
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>اذهب إلى <a href="https://console.cloud.google.com/apis/library/drive.googleapis.com" target="_blank" className="underline">Google Cloud Console</a></li>
                    <li>فعّل Google Drive API</li>
                    <li>اذهب إلى OAuth consent screen وأضف نطاق (scope): https://www.googleapis.com/auth/drive.file</li>
                    <li>تأكد من أن المستخدمين قد وافقوا على الصلاحيات</li>
                  </ol>
                </div>
              )}
            </div>
          )}
          {linkMessage.text && linkMessage.type === 'success' && (
            <div className="mt-4 p-3 rounded-xl text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
              {linkMessage.text}
            </div>
          )}
        </div>

        {/* Financial Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Coins size={20} className="text-amber-500"/> الإعدادات المالية وأسعار الصرف</h3>
          <p className="text-sm text-slate-500 mb-6">حدد سعر صرف الدولار الإعلاني (LYD/USD) الذي سيتم اعتماده كقيمة افتراضية عند شحن محافظ العملاء.</p>
          <div className="max-w-xs">
            <label className="block text-xs font-bold text-slate-500 mb-2">سعر الصرف الافتراضي اليومي</label>
            <div className="flex gap-2">
              <input type="number" step="0.01" value={globalExchangeRate} onChange={(e) => {
                const val = parseFloat(e.target.value);
                setGlobalExchangeRate(val);
                localStorage.setItem('lyalina_exchange_rate', val);
              }} className="flex-1 p-3 bg-amber-50 rounded-xl border border-amber-200 focus:border-amber-500 outline-none font-black text-xl text-amber-800 text-center" />
            </div>
            <p className="text-[10px] text-slate-400 mt-2">تحديث السعر هنا سيؤثر فقط على عمليات الشحن المستقبلية للمحافظ.</p>
          </div>
        </div>

        {/* Workspace Management */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Layers size={20} className="text-emerald-600"/> إدارة الحسابات الإعلانية (Workspaces)</h3>
          <p className="text-sm text-slate-500 mb-6">الحساب النشط حالياً هو الذي يتم تسجيل الحملات والفواتير داخله. يمكنك التبديل بين الحسابات أو إنشاء حساب جديد كلياً.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">الحساب الإعلاني النشط:</label>
              <div className="relative group">
                <select value={safeRender(workspaceId)} onChange={(e) => handleWorkspaceChange(e.target.value)} className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none appearance-none cursor-pointer font-bold text-slate-800 text-sm transition-all">
                  {workspaceHistory.map(ws => <option key={String(ws)} value={String(ws)}>{safeRender(ws)}</option>)}
                </select>
                <ChevronDown size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">إنشاء حساب جديد:</label>
              <div className="flex gap-2">
                <input type="text" value={tempWorkspaceId} onChange={(e) => setTempWorkspaceId(e.target.value)} placeholder="اكتب اسم الحساب هنا..." className="flex-1 p-3.5 bg-white rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-bold text-sm" />
                <button onClick={() => { const cleanId = tempWorkspaceId.trim(); if(cleanId) { handleWorkspaceChange(cleanId); const newHist = [...new Set([cleanId, ...workspaceHistory])]; setWorkspaceHistory(newHist); localStorage.setItem('ads_workspace_history', JSON.stringify(newHist)); setTempWorkspaceId(""); addLog(`تم إنشاء الحساب: ${cleanId}`); } }} className="bg-emerald-600 text-white px-6 rounded-xl font-bold hover:bg-emerald-700 shadow-md text-sm transition-all whitespace-nowrap">
                  حفظ وانتقال
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Database size={20} className="text-indigo-600"/> النسخ الاحتياطي وإدارة البيانات</h3>
          <p className="text-sm text-slate-500 mb-6">احفظ بياناتك محلياً كملف JSON لضمان عدم ضياعها أبداً، أو استعد بياناتك القديمة إلى هيكلة النظام الجديد بضغطة زر.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button onClick={handleDriveBackup} className={`p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-3 transition shadow-sm group ${googleAccessToken ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`} title={!googleAccessToken ? "سجل الدخول بحساب جوجل لتفعيل هذه الميزة" : ""}>
              <Cloud size={28} className={`${googleAccessToken ? 'text-blue-200 group-hover:scale-110 transition-transform' : ''}`}/>
              <div className="text-center">
                <span className="block text-sm">رفع لجوجل درايف</span>
                <span className="text-[10px] font-normal mt-1 block opacity-80">{googleAccessToken ? 'حفظ نسخة سحابية مباشرة' : 'يتطلب تسجيل الدخول بجوجل'}</span>
              </div>
            </button>
            <button onClick={handleBackupAll} className="bg-slate-800 text-white p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-3 hover:bg-slate-700 transition shadow-sm group">
              <Download size={28} className="text-slate-300 group-hover:scale-110 transition-transform"/>
              <div className="text-center">
                <span className="block text-sm">تصدير {isSuperAdmin ? 'كل البيانات' : 'شامل (All)'}</span>
                <span className="text-[10px] text-slate-400 font-normal mt-1 block">تنزيل كل الحسابات الإعلانية {isSuperAdmin && '(للجميع)'}</span>
              </div>
            </button>
            <button onClick={handleBackupCurrentWorkspace} className="bg-white border-2 border-slate-800 text-slate-800 p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-3 hover:bg-slate-50 transition shadow-sm group">
              <HardDrive size={28} className="text-slate-500 group-hover:scale-110 transition-transform"/>
              <div className="text-center">
                <span className="block text-sm">تصدير مخصص</span>
                <span className="text-[10px] text-slate-500 font-normal mt-1 block">تحميل الحساب ({workspaceId}) فقط</span>
              </div>
            </button>
            <button onClick={() => restoreInputRef.current?.click()} className="bg-indigo-600 text-white p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-3 hover:bg-indigo-700 transition shadow-sm group">
              <Upload size={28} className="text-indigo-200 group-hover:scale-110 transition-transform"/>
              <div className="text-center">
                <span className="block text-sm">استيراد ودمج (Import)</span>
                <span className="text-[10px] text-indigo-200 font-normal mt-1 block">استعادة من ملف JSON</span>
              </div>
            </button>
          </div>
          <p className="text-[10px] text-center mt-4 text-slate-500 font-mono">آخر عملية نسخ احتياطي: {lastBackupDate || 'لا توجد سجلات'}</p>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pb-6 border-t border-slate-200 pt-6">
          <p className="text-xs text-slate-400 font-bold">إصدار المنصة: <span className="text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">v8.0 (Wallet Edition)</span></p>
          <p className="text-[10px] text-slate-400 mt-2">نظام المحافظ الرقمية والدفع المسبق المتكامل.</p>
        </div>
      </div>
    </div>
  );
};

export default memo(SettingsView);
