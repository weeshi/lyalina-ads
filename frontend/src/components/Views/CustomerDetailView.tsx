// @ts-nocheck
import { memo } from 'react';
import { Edit3, Phone, Mail as MailIcon, Sparkles, Loader2, Gift, Wallet, Plus, History, CreditCard, FilePlus, Printer, MessageCircle, Mail, Coins, CheckCircle2, AlertCircle, X, Link as LinkIcon, Unlink, Globe, ChevronDown } from 'lucide-react';
import { safeRender, calculateProgress } from '../../utils';
import { useState, useRef, useEffect, useMemo } from 'react';

const CustomerDetailView = ({
  selectedCustomer, setSelectedCustomer, setCurrentView, setCustomerForm, toggleModal,
  handleAnalyzeCustomer, isAnalyzingCustomer, customerAnalysisResult, setCustomerAnalysisResult,
  activeCustomerTab, setActiveCustomerTab, sortedAndFilteredData, invoiceSelection, setInvoiceSelection,
  handleGenerateInvoice, customerStats, walletTransactions, invoices, printInvoice, printStatement,
  shareInvoiceWhatsApp, shareInvoiceEmail, isSuperAdmin,
  newPageLinkInput, setNewPageLinkInput, linkPageToCustomer, removeLinkedPage,
  uniquePageNames, handleWalletPayment, data,
}) => {
  const stats = customerStats[selectedCustomer?.id] || { totalSpend: 0, due: 0, count: 0 };
  const [showPageDropdown, setShowPageDropdown] = useState(false);
  const pageDropdownRef = useRef(null);

  const customerUnpaidCampaigns = useMemo(() => data.filter(d =>
    d["الدفع"] !== "مدفوع" && selectedCustomer?.linkedPages?.includes(d["اسم الصفحة"]) && !d.isDeleted
  ), [data, selectedCustomer]);
  const totalUnpaidUSD = useMemo(() => customerUnpaidCampaigns.reduce((sum, d) => sum + (parseFloat(d["القيمة"]) || 0), 0), [customerUnpaidCampaigns]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pageDropdownRef.current && !pageDropdownRef.current.contains(e.target)) {
        setShowPageDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPages = useMemo(() => uniquePageNames.filter(p =>
    p.toLowerCase().includes(newPageLinkInput.toLowerCase())
  ), [uniquePageNames, newPageLinkInput]);

  const customerWalletTx = useMemo(() => walletTransactions.filter(t => t.customerId === selectedCustomer.id), [walletTransactions, selectedCustomer]);
  const customerInvoices = useMemo(() => invoices.filter(inv => inv.customerId === selectedCustomer.id), [invoices, selectedCustomer]);

  return (
    <div className="flex-1 bg-canvas p-4 md:p-6 overflow-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Main Info Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-hairline lg:col-span-2 relative">
          {isSuperAdmin && <span className="absolute top-4 left-4 bg-fill text-ink-400 font-mono text-[9px] px-2 py-1 rounded">Owner: {selectedCustomer.ownerEmail}</span>}
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <div className="bg-ink-900 text-white w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-extrabold shadow-lg shrink-0">{safeRender(selectedCustomer.name).charAt(0)}</div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-extrabold text-ink-800">{safeRender(selectedCustomer.name)}</h1>
                <button onClick={() => { setCustomerForm(selectedCustomer); toggleModal('editCustomer', true); }} className="text-ink-400 hover:text-brand-600 transition-colors p-1" title="تعديل"><Edit3 size={18}/></button>
              </div>
              <div className="flex items-center gap-4 text-sm text-ink-500 font-medium">
                <span className="flex items-center gap-1 font-mono"><Phone size={14}/> {safeRender(selectedCustomer.phone)}</span>
                {selectedCustomer.email && <span className="flex items-center gap-1"><MailIcon size={14}/> {safeRender(selectedCustomer.email)}</span>}
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-6 pt-6 border-t border-fill flex-wrap">
            <button onClick={handleAnalyzeCustomer} disabled={isAnalyzingCustomer} className="px-4 py-2.5 rounded-xl font-bold bg-assist-50 text-assist-700 hover:bg-assist-100 shadow-sm flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-50">
              {isAnalyzingCustomer ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16}/>} تحليل مبيعات
            </button>
            <button onClick={() => toggleModal('points', true)} className="px-4 py-2.5 rounded-xl font-bold bg-warning-soft text-warning-500 hover:bg-warning-soft shadow-sm flex items-center justify-center gap-2 text-sm">
              <Gift size={16}/> {selectedCustomer.points || 0} نقطة
            </button>
            <div className="flex-1"></div>
            <button onClick={() => setCurrentView('crm')} className="px-6 py-2.5 rounded-xl font-bold bg-fill text-ink-600 hover:bg-hairline text-sm">عودة للقائمة</button>
          </div>
        </div>

        {/* Wallet Card */}
        <div className="bg-brand-600 rounded-3xl p-6 shadow-xl shadow-brand-500/20 text-white relative overflow-hidden lg:col-span-1 flex flex-col justify-center">
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <p className="text-brand-100 font-bold text-sm flex items-center gap-2"><Wallet size={18}/> المحفظة الإعلانية</p>
              <div className={`w-3 h-3 rounded-full ${(selectedCustomer.walletBalanceUSD||0) < 20 ? 'bg-danger-500 animate-pulse' : 'bg-brand-300'}`}></div>
            </div>
            <h2 className="text-5xl font-black mb-2">${(selectedCustomer.walletBalanceUSD || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
            <p className="text-brand-200 text-xs mb-6 font-medium">الرصيد متاح للاستخدام الفوري لتمويل الحملات.</p>
            <button onClick={() => toggleModal('topUp', true)} className="w-full bg-white text-brand-700 font-bold py-3 rounded-xl shadow-md hover:bg-brand-50 transition-colors flex items-center justify-center gap-2">
              <Plus size={18}/> شحن الرصيد
            </button>
            {customerUnpaidCampaigns.length > 0 && (
              <button onClick={() => handleWalletPayment(customerUnpaidCampaigns.map(d => d.id))} className="w-full bg-warning-500 text-white font-bold py-2.5 rounded-xl shadow-md hover:bg-warning-500 transition-colors flex items-center justify-center gap-2 mt-2 text-sm">
                <Coins size={16}/> سداد {customerUnpaidCampaigns.length} حملة (${totalUnpaidUSD.toFixed(2)})
              </button>
            )}
          </div>
          <div className="absolute -bottom-12 -right-12 text-[150px] opacity-10 leading-none">💰</div>
        </div>
      </div>

      {/* Linked Pages Management */}
      <div className="bg-white rounded-2xl shadow-sm border border-hairline p-5 mb-6">
        <h3 className="font-bold text-ink-700 flex items-center gap-2 text-sm mb-4"><Globe size={16}/> الصفحات التابعة ({selectedCustomer.linkedPages?.length || 0})</h3>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 relative" ref={pageDropdownRef}>
            <div className="flex items-center gap-1 bg-canvas rounded-xl border border-hairline focus-within:border-brand-500 transition-colors">
              <input type="text" value={newPageLinkInput} onChange={(e) => { setNewPageLinkInput(e.target.value); setShowPageDropdown(true); }} onFocus={() => setShowPageDropdown(true)} placeholder="ابحث عن اسم الصفحة..." className="flex-1 p-2.5 bg-transparent outline-none font-bold text-sm min-w-0" />
              <button type="button" onClick={() => setShowPageDropdown(!showPageDropdown)} className="p-2 text-ink-400 hover:text-ink-600"><ChevronDown size={16}/></button>
            </div>
            {showPageDropdown && filteredPages.length > 0 && (
              <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-hairline rounded-xl shadow-xl max-h-48 overflow-y-auto">
                {filteredPages.map((name, i) => (
                  <button key={i} type="button" onClick={() => { setNewPageLinkInput(name); setShowPageDropdown(false); }} className="w-full text-right px-3 py-2 text-sm font-bold text-ink-700 hover:bg-brand-50 hover:text-brand-700 transition-colors border-b border-canvas last:border-0">
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={linkPageToCustomer} className="bg-brand-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-brand-700 text-sm flex items-center gap-1 shadow-sm transition-colors"><LinkIcon size={16}/> ربط</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(selectedCustomer.linkedPages || []).length > 0 ? selectedCustomer.linkedPages.map(page => (
            <div key={page} className="flex items-center gap-1.5 bg-assist-50 text-assist-700 px-3 py-1.5 rounded-xl text-sm font-bold border border-assist-100">
              <Globe size={14}/>
              <span>{page}</span>
              <button onClick={() => removeLinkedPage(page)} className="text-assist-400 hover:text-danger-500 mr-1"><X size={14}/></button>
            </div>
          )) : <p className="text-sm text-ink-400 italic py-2">لا توجد صفحات مربوطة. اربط صفحة لتسجيل الحملات الإعلانية.</p>}
        </div>
      </div>

      {customerAnalysisResult && (
        <div className="bg-assist-50 border border-assist-100 p-5 rounded-2xl mb-6 shadow-sm animate-in fade-in">
          <h3 className="font-bold text-assist-800 flex items-center gap-2 mb-3"><Sparkles size={18} className="text-assist-600"/> ✨ تقرير الذكاء الاصطناعي:</h3>
          <div className="text-sm text-assist-900 leading-relaxed whitespace-pre-wrap">{safeRender(customerAnalysisResult)}</div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-4 border-b border-hairline pb-1">
        <button onClick={() => setActiveCustomerTab('ledger')} className={`pb-2 px-3 font-bold text-sm transition-colors ${activeCustomerTab === 'ledger' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-ink-400 hover:text-ink-600'}`}>الحملات غير المفوترة</button>
        <button onClick={() => setActiveCustomerTab('wallet_ledger')} className={`pb-2 px-3 font-bold text-sm transition-colors flex items-center gap-1 ${activeCustomerTab === 'wallet_ledger' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-ink-400 hover:text-ink-600'}`}><History size={14}/> سجل المحفظة</button>
        <button onClick={() => setActiveCustomerTab('invoices')} className={`pb-2 px-3 font-bold text-sm transition-colors ${activeCustomerTab === 'invoices' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-ink-400 hover:text-ink-600'}`}>الفواتير</button>
      </div>

      {/* Wallet Ledger Tab */}
      {activeCustomerTab === 'wallet_ledger' && (
        <div className="bg-white rounded-2xl shadow-sm border border-hairline overflow-hidden mb-20 animate-in fade-in">
          <div className="p-5 bg-canvas border-b border-hairline flex justify-between items-center">
            <h3 className="font-bold text-ink-700 flex items-center gap-2 text-sm"><History size={16}/> الدفتر المالي للمحفظة</h3>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-right min-w-[700px]">
              <thead className="bg-fill text-ink-500 text-[10px] uppercase font-bold">
                <tr>
                  <th className="p-4">المرجع</th>
                  <th className="p-4">التاريخ</th>
                  <th className="p-4">النوع / البيان</th>
                  <th className="p-4 text-center">المبلغ (د.ل)</th>
                  <th className="p-4 text-center">سعر الصرف</th>
                  <th className="p-4 text-left">التأثير بالدولار ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fill text-sm">
                {customerWalletTx.length > 0 ? customerWalletTx.map(t => (
                  <tr key={t.id} className="hover:bg-canvas transition-colors">
                    <td className="p-4 font-mono text-xs text-ink-400">{safeRender(t.id).substring(0,8)}</td>
                    <td className="p-4 text-ink-600 font-mono text-xs">{safeRender(t.date)}</td>
                    <td className="p-4 font-bold text-ink-700">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full mr-2 ${t.type === 'topup' ? 'bg-brand-100 text-brand-600' : 'bg-danger-soft text-danger-strong'}`}>
                        {t.type === 'topup' ? '+' : '-'}
                      </span>
                      {safeRender(t.note)}
                    </td>
                    <td className="p-4 text-center font-bold text-ink-600">{t.amountLYD > 0 ? t.amountLYD.toLocaleString() : '-'}</td>
                    <td className="p-4 text-center font-bold text-ink-400">{t.rate > 0 ? t.rate.toFixed(2) : '-'}</td>
                    <td className={`p-4 text-left font-black ${t.amountUSD > 0 ? 'text-brand-600' : 'text-danger-strong'}`} dir="ltr">
                      {t.amountUSD > 0 ? '+' : ''}{t.amountUSD.toFixed(2)}
                    </td>
                  </tr>
                )) : <tr><td colSpan={6} className="p-8 text-center text-ink-400 italic">لا توجد حركات مالية في هذه المحفظة.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Campaigns Ledger Tab */}
      {activeCustomerTab === 'ledger' && (
        <div className="bg-white rounded-2xl shadow-sm border border-hairline overflow-hidden mb-20 animate-in fade-in">
          <div className="p-4 bg-canvas border-b border-hairline flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h3 className="font-bold text-ink-700 flex items-center gap-2 text-sm"><CreditCard size={16}/> الحملات (للفوترة التقليدية)</h3>
            <div className="flex gap-2">
              <button onClick={() => handleGenerateInvoice('USD')} disabled={invoiceSelection.length === 0} className="flex-1 sm:flex-none px-3 py-2 rounded-lg font-bold bg-assist-600 text-white hover:bg-assist-500 shadow-sm flex items-center justify-center gap-1 disabled:opacity-50 text-[10px]"><FilePlus size={12}/> فاتورة $</button>
              <button onClick={() => handleGenerateInvoice('LYD')} disabled={invoiceSelection.length === 0} className="flex-1 sm:flex-none px-3 py-2 rounded-lg font-bold bg-brand-600 text-white hover:bg-brand-500 shadow-sm flex items-center justify-center gap-1 disabled:opacity-50 text-[10px]"><FilePlus size={12}/> فاتورة د.ل</button>
            </div>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-right min-w-[700px]">
              <thead className="bg-fill text-ink-500 text-[10px] uppercase font-bold">
                <tr>
                  <th className="p-3 w-8 text-center"><input type="checkbox" onChange={(e) => { if(e.target.checked) setInvoiceSelection(sortedAndFilteredData.map(r => r.id)); else setInvoiceSelection([]); }} className="rounded border-hairline-strong text-brand-600 focus:ring-brand-500 cursor-pointer" /></th>
                  <th className="p-3">الصفحة</th>
                  <th className="p-3">الحملة</th>
                  <th className="p-3">الباقة</th>
                  <th className="p-3">القيمة ($)</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">الدفع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fill text-xs">
                {sortedAndFilteredData.length > 0 ? sortedAndFilteredData.map(row => (
                  <tr key={`inv-${row.id}`} className="hover:bg-canvas transition-colors group">
                    <td className="p-3 text-center"><input type="checkbox" checked={invoiceSelection.includes(row.id)} onChange={(e) => { if (e.target.checked) setInvoiceSelection(prev => [...prev, row.id]); else setInvoiceSelection(prev => prev.filter(id => id !== row.id)); }} className="rounded border-hairline-strong text-brand-600 focus:ring-brand-500 cursor-pointer" /></td>
                    <td className="p-3 font-bold text-ink-600">{safeRender(row["اسم الصفحة"])}</td>
                    <td className="p-3 font-bold text-ink-800">{safeRender(row["اسم Ad"])}</td>
                    <td className="p-3 font-bold text-assist-600">{safeRender(row["كود الباقة"] || '-')}</td>
                    <td className="p-3 font-bold text-ink-800">{safeRender(row["القيمة"])}</td>
                    <td className="p-3 font-bold text-brand-600">{safeRender(row["الحالة"])}</td>
                    <td className="p-3"><span className={`px-2 py-1 rounded font-bold ${row["الدفع"] === 'مدفوع' ? 'bg-brand-100 text-brand-700' : 'bg-danger-soft text-danger-strong'}`}>{safeRender(row["الدفع"])}{row.paymentMethod && row["الدفع"] === 'مدفوع' ? ` (${row.paymentMethod})` : ''}</span></td>
                  </tr>
                )) : <tr><td colSpan={7} className="p-6 text-center text-ink-400 italic">لا توجد حملات معروضة.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoices Tab */}
      {activeCustomerTab === 'invoices' && (
        <div className="bg-white rounded-2xl shadow-sm border border-hairline overflow-hidden animate-in fade-in">
          <div className="p-4 bg-canvas border-b border-hairline flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h3 className="font-bold text-ink-700 flex items-center gap-2 text-sm"><History size={16}/> أرشيف الفواتير</h3>
            <button onClick={printStatement} className="px-3 py-2 rounded-lg font-bold bg-ink-800 text-white hover:bg-ink-700 shadow-sm flex items-center justify-center gap-1 text-[10px] transition-colors"><Printer size={12}/> كشف حساب كلي</button>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-right min-w-[500px]">
              <thead className="bg-fill text-ink-500 text-[10px] uppercase font-bold">
                <tr><th className="p-3">الفاتورة</th><th className="p-3">التاريخ</th><th className="p-3">البنود</th><th className="p-3">الإجمالي</th><th className="p-3 text-center">إجراءات</th></tr>
              </thead>
              <tbody className="divide-y divide-fill text-xs">
                {customerInvoices.length > 0 ? (
                  customerInvoices.map(inv => (
                    <tr key={`invhist-${inv.id}`} className="hover:bg-canvas">
                      <td className="p-3 font-mono font-bold text-ink-700">{safeRender(inv.invoiceNum)}</td>
                      <td className="p-3 text-ink-500 font-mono">{safeRender(inv.date)}</td>
                      <td className="p-3 font-bold">{safeRender(inv.itemCount)}</td>
                      <td className="p-3 font-black text-brand-600">{safeRender(inv.total?.toLocaleString())} <span className="text-[9px] font-bold text-ink-400">{inv.currency === 'LYD' ? 'د.ل' : '$'}</span></td>
                      <td className="p-3 flex justify-center gap-1.5">
                        <button onClick={() => printInvoice(inv)} className="p-1.5 bg-fill text-ink-600 rounded hover:bg-hairline transition-colors" title="طباعة/PDF"><Printer size={14}/></button>
                        <button onClick={() => shareInvoiceWhatsApp(inv)} className="p-1.5 bg-brand-50 text-brand-600 rounded hover:bg-brand-100 transition-colors" title="واتساب"><MessageCircle size={14}/></button>
                        <button onClick={() => shareInvoiceEmail(inv)} className="p-1.5 bg-info-soft text-info-600 rounded hover:bg-info-soft transition-colors" title="إيميل"><Mail size={14}/></button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="p-6 text-center text-ink-400 italic">لا توجد فواتير مصدرة.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(CustomerDetailView);
