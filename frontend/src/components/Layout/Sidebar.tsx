// @ts-nocheck
import { memo } from 'react';
import { BrainCircuit, TableIcon, Activity, Users, Briefcase, Layers, Settings as SettingsIcon, Bot, Key } from 'lucide-react';

const Sidebar = ({ currentView, setCurrentView, setSelectedCustomer, isSuperAdmin, toggleModal }) => {
  const navItems = [
    { view: 'ads', icon: TableIcon, title: 'الحملات' },
    { view: 'analytics', icon: Activity, title: 'التحليلات' },
    { view: 'crm', icon: Users, title: 'العملاء والمحافظ' },
    { view: 'marketers', icon: Briefcase, title: 'المسوقين' },
    { view: 'packages', icon: Layers, title: 'الباقات' },
  ];

  return (
    <div className="bg-emerald-900 flex flex-col items-center py-6 gap-4 z-30 shrink-0 shadow-xl overflow-y-auto transition-all w-14 sm:w-16 md:w-20">
      <div className="bg-emerald-800 p-2 rounded-xl mb-1 border border-emerald-700/50 flex flex-col items-center">
        <BrainCircuit size={24} className="text-emerald-300" />
      </div>
      <span className="hidden sm:block text-[10px] text-emerald-400 font-mono font-bold -mt-3 mb-2">v8.0</span>

      {navItems.map(({ view, icon: Icon, title }) => (
        <button
          key={view}
          onClick={() => { setCurrentView(view); setSelectedCustomer(null); }}
          className={`p-2.5 rounded-xl transition-all ${
            currentView === view || (view === 'crm' && currentView === 'customer-detail') || (view === 'marketers' && currentView === 'marketer-detail')
              ? 'bg-white text-emerald-900 shadow-lg scale-110'
              : 'text-emerald-200 hover:bg-emerald-800'
          }`}
          title={title}
        >
          <Icon size={20} />
        </button>
      ))}

      <div className="flex-1" />

      <button
        onClick={() => toggleModal('ai', true)}
        className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-lg hover:bg-indigo-500 transition-all hover:scale-110 animate-pulse mb-2"
        title="المساعد الذكي"
      >
        <Bot size={20} />
      </button>

      {isSuperAdmin && (
        <button
          onClick={() => toggleModal('userManagement', true)}
          className="p-2.5 rounded-xl bg-slate-800 text-amber-500 shadow-lg hover:bg-slate-700 transition-all mb-2 border border-slate-700"
          title="إدارة المستخدمين"
        >
          <Key size={20} />
        </button>
      )}

      <button
        onClick={() => setCurrentView('settings')}
        className={`p-2.5 rounded-xl transition-all ${
          currentView === 'settings' ? 'bg-white text-emerald-900 shadow-lg scale-110' : 'text-emerald-200 hover:bg-emerald-800'
        }`}
        title="الإعدادات الشاملة"
      >
        <SettingsIcon size={20} />
      </button>
    </div>
  );
};

export default memo(Sidebar);
