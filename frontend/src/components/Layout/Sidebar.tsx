// @ts-nocheck
import { memo } from 'react';
import { BrainCircuit, TableIcon, Activity, Users, Briefcase, Layers, Settings as SettingsIcon, Bot, Key } from 'lucide-react';

const Sidebar = ({ currentView, setCurrentView, setSelectedCustomer, isSuperAdmin, toggleModal }) => {
  const navItems = [
    { view: 'ads', icon: TableIcon, title: 'الحملات' },
    { view: 'analytics', icon: Activity, title: 'التحليلات' },
    { view: 'crm', icon: Users, title: 'العملاء' },
    { view: 'marketers', icon: Briefcase, title: 'المسوقين' },
    { view: 'packages', icon: Layers, title: 'الباقات' },
  ];

  const isActive = (view) =>
    currentView === view ||
    (view === 'crm' && currentView === 'customer-detail') ||
    (view === 'marketers' && currentView === 'marketer-detail');

  const go = (view) => { setCurrentView(view); setSelectedCustomer(null); };

  return (
    <>
      {/* Rail عمودي — أعلى من md */}
      <div className="hidden md:flex bg-brand-900 flex-col items-center py-6 gap-4 z-30 shrink-0 shadow-xl overflow-y-auto transition-all w-20">
        <div className="bg-brand-800 p-2 rounded-xl mb-1 border border-brand-700/50 flex flex-col items-center">
          <BrainCircuit size={24} className="text-brand-300" />
        </div>
        <span className="text-[10px] text-brand-400 font-mono font-bold -mt-3 mb-2">v8.0</span>

        {navItems.map(({ view, icon: Icon, title }) => (
          <button
            key={view}
            onClick={() => go(view)}
            className={`p-2.5 rounded-xl transition-all ${
              isActive(view) ? 'bg-white text-brand-900 shadow-lg scale-110' : 'text-brand-200 hover:bg-brand-800'
            }`}
            title={title}
          >
            <Icon size={20} />
          </button>
        ))}

        <div className="flex-1" />

        <button
          onClick={() => toggleModal('ai', true)}
          className="p-2.5 rounded-xl bg-assist-600 text-white shadow-lg hover:bg-assist-500 transition-all hover:scale-110 animate-pulse mb-2"
          title="المساعد الذكي"
        >
          <Bot size={20} />
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => toggleModal('userManagement', true)}
            className="p-2.5 rounded-xl bg-ink-800 text-warning-500 shadow-lg hover:bg-ink-700 transition-all mb-2 border border-ink-700"
            title="إدارة المستخدمين"
          >
            <Key size={20} />
          </button>
        )}

        <button
          onClick={() => setCurrentView('settings')}
          className={`p-2.5 rounded-xl transition-all ${currentView === 'settings' ? 'bg-white text-brand-900 shadow-lg scale-110' : 'text-brand-200 hover:bg-brand-800'}`}
          title="الإعدادات الشاملة"
        >
          <SettingsIcon size={20} />
        </button>
      </div>

      {/* شريط تنقل سفلي ثابت للموبايل */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-brand-900 border-t border-brand-700/60 flex items-stretch justify-around px-1 pt-1 pb-[calc(env(safe-area-inset-bottom)+4px)] shadow-elev3">
        {navItems.map(({ view, icon: Icon, title }) => (
          <button
            key={view}
            onClick={() => go(view)}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-1 rounded-lg transition-colors ${
              isActive(view) ? 'text-white bg-brand-800' : 'text-brand-200'
            }`}
            title={title}
          >
            <Icon size={18} />
            <span className="text-[9px] font-bold leading-none truncate w-full text-center px-0.5">{title}</span>
          </button>
        ))}

        <button onClick={() => toggleModal('ai', true)} className="flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-1 rounded-lg text-white bg-assist-600/90" title="المساعد الذكي">
          <Bot size={18} />
          <span className="text-[9px] font-bold leading-none">المساعد</span>
        </button>

        {isSuperAdmin && (
          <button onClick={() => toggleModal('userManagement', true)} className="flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-1 rounded-lg text-warning-500" title="إدارة المستخدمين">
            <Key size={18} />
            <span className="text-[9px] font-bold leading-none truncate w-full text-center px-0.5">المستخدمون</span>
          </button>
        )}

        <button
          onClick={() => setCurrentView('settings')}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-1 rounded-lg ${currentView === 'settings' ? 'text-white bg-brand-800' : 'text-brand-200'}`}
          title="الإعدادات الشاملة"
        >
          <SettingsIcon size={18} />
          <span className="text-[9px] font-bold leading-none truncate w-full text-center px-0.5">الإعدادات</span>
        </button>
      </nav>
    </>
  );
};

export default memo(Sidebar);