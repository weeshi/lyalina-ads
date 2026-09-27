// @ts-nocheck
import { memo } from 'react';
import { PackagePlus, Plus, Trash2, Download } from 'lucide-react';
import { safeRender } from '../../utils';
import { PACKAGE_CATEGORIES } from '../../constants';

const COLS = [
  { key: 'code', label: 'الكود' },
  { key: 'category', label: 'التصنيف' },
  { key: 'days', label: 'المدة' },
  { key: 'priceUSD', label: 'السعر ($)' },
  { key: 'priceLYD', label: 'السعر (د.ل)' },
  { key: 'daily', label: 'اليومي ($)' },
  { key: 'actions', label: '' },
];

const PackagesView = ({ packages, setPackageForm, toggleModal, requestDelete, handleSeedPackages, handleDeleteAllPackages, isSuperAdmin, handlePackageUpdate }) => {
  return (
    <div className="flex-1 bg-slate-50 p-4 md:p-6 overflow-auto">
      <div className="pb-20">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800">إدارة الباقات</h2>
            <p className="text-sm text-slate-500 mt-1">الباقات الجاهزة للاستخدام السريع في الحملات</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSeedPackages} className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg hover:bg-indigo-700 flex items-center gap-2 text-sm">
              <Download size={16}/> استيراد الباقات الافتراضية
            </button>
            <button onClick={handleDeleteAllPackages} className="bg-red-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg hover:bg-red-700 flex items-center gap-2 text-sm">
              <Trash2 size={16}/> حذف الكل
            </button>
            <button onClick={() => { setPackageForm({id: null, code: "", days: "", priceUSD: "", priceLYD: "", category: "G"}); toggleModal('package', true); }} className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg hover:bg-emerald-700 flex items-center gap-2 text-sm">
              <Plus size={16}/> إضافة باقة
            </button>
          </div>
        </div>

        {packages.length > 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    {COLS.map(col => (
                      <th key={col.key} className={`p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider ${col.key === 'actions' ? 'w-16' : 'text-right'}`}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {packages.map(pkg => (
                    <tr key={String(pkg.id)} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        {isSuperAdmin ? (
                          <input type="text" defaultValue={safeRender(pkg.code)} onBlur={e => { const v = e.target.value.trim(); if (v && v !== pkg.code) handlePackageUpdate(pkg.id, 'code', v); }} className="w-full bg-transparent outline-none font-black text-slate-800 text-sm border-b border-dashed border-transparent focus:border-indigo-400" />
                        ) : (
                          <span className="font-black text-slate-800">{safeRender(pkg.code)}</span>
                        )}
                      </td>
                      <td className="p-3">
                        {isSuperAdmin ? (
                          <select defaultValue={pkg.category || 'G'} onChange={e => handlePackageUpdate(pkg.id, 'category', e.target.value)} className="bg-transparent outline-none font-bold text-xs cursor-pointer border-b border-dashed border-transparent focus:border-indigo-400">
                            {Object.entries(PACKAGE_CATEGORIES).map(([k, cat]) => <option key={k} value={k}>{cat.icon} {cat.label}</option>)}
                          </select>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                            {PACKAGE_CATEGORIES[pkg.category]?.icon || '📦'} {PACKAGE_CATEGORIES[pkg.category]?.label || 'عام'}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {isSuperAdmin ? (
                          <input type="number" defaultValue={pkg.days} onBlur={e => { const v = parseInt(e.target.value); if (v > 0 && v !== pkg.days) handlePackageUpdate(pkg.id, 'days', v); }} className="w-16 bg-transparent outline-none font-bold text-slate-600 text-sm border-b border-dashed border-transparent focus:border-indigo-400 text-center" />
                        ) : (
                          <span className="font-bold text-slate-600">{pkg.days} يوم</span>
                        )}
                      </td>
                      <td className="p-3">
                        {isSuperAdmin ? (
                          <input type="number" step="0.01" defaultValue={pkg.priceUSD} onBlur={e => { const v = parseFloat(e.target.value); if (v >= 0 && v !== pkg.priceUSD) handlePackageUpdate(pkg.id, 'priceUSD', v); }} className="w-20 bg-transparent outline-none font-black text-emerald-600 text-sm border-b border-dashed border-transparent focus:border-indigo-400 text-left" dir="ltr" />
                        ) : (
                          <span className="font-black text-emerald-600">${pkg.priceUSD?.toFixed(2)}</span>
                        )}
                      </td>
                      <td className="p-3">
                        {isSuperAdmin ? (
                          <input type="number" step="0.01" defaultValue={pkg.priceLYD} onBlur={e => { const v = parseFloat(e.target.value); if (v >= 0 && v !== pkg.priceLYD) handlePackageUpdate(pkg.id, 'priceLYD', v); }} className="w-20 bg-transparent outline-none font-black text-amber-600 text-sm border-b border-dashed border-transparent focus:border-indigo-400 text-left" dir="ltr" />
                        ) : (
                          <span className="font-black text-amber-600">{pkg.priceLYD?.toFixed(2)} د.ل</span>
                        )}
                      </td>
                      <td className="p-3 text-xs text-slate-400 font-bold">${(pkg.priceUSD / pkg.days).toFixed(2)}</td>
                      <td className="p-3">
                        {isSuperAdmin && <button onClick={() => requestDelete('package', pkg.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={14} /></button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-3xl border border-slate-200">
            <PackagePlus size={64} className="mb-4 opacity-50"/>
            <p className="font-bold text-xl mb-2">لا توجد باقات بعد</p>
            <p className="text-sm mb-6">يمكنك استيراد الباقات الافتراضية أو إضافة باقة يدوياً</p>
            <div className="flex gap-3">
              <button onClick={handleSeedPackages} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-md flex items-center gap-2">
                <Download size={18}/> استيراد الباقات الافتراضية
              </button>
              <button onClick={() => { setPackageForm({id: null, code: "", days: "", priceUSD: "", priceLYD: "", category: "G"}); toggleModal('package', true); }} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-md flex items-center gap-2">
                <Plus size={18}/> إضافة باقة
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(PackagesView);
