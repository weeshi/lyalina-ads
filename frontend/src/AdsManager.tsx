// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Plus, Trash2, Table as TableIcon, AlertCircle, Sparkles, Loader2, X, BrainCircuit,
  Zap, Copy, Settings, Database, Save, FileUp, FileSpreadsheet, History, ChevronDown,
  ExternalLink, Search, Filter, Calendar, ArrowUpDown, ArrowUp, ArrowDown, Archive,
  RotateCcw, Eye, Undo2, XCircle, Users, Phone, Wallet, Printer, CreditCard, Link as LinkIcon,
  UserPlus, Edit3, Trash, Mail, FilePlus, Layers, Briefcase, Percent, Banknote, Landmark,
  Image as ImageIcon, AlertTriangle, Award, Gift, Download, Upload, FolderKanban as WorkspaceIcon,
  SlidersHorizontal, PackagePlus, Bot, SendHorizontal, RefreshCw, Info, MessageCircle, Activity, DollarSign,
  HardDrive, UserCircle, LogOut, CheckCircle2, Lock, Mail as MailIcon, Cloud, ShieldAlert, Key, Coins, ArrowRightLeft, Cog
} from 'lucide-react';
import { doc, setDoc, getDocs, collection, query, onSnapshot, deleteDoc, serverTimestamp, getDoc } from 'firebase/firestore';

// --- Internal imports ---
import { app, auth, db, appId } from './firebase';
import { HEADERS, AI_HEADERS, STATUS_OPTIONS, CAMPAIGN_TYPES, SEX_OPTIONS, PRESET_WORKSPACES, DEFAULT_WORKSPACE, PACKAGE_CATEGORIES, PAYMENT_METHODS, GEMINI_PROXY_URL } from './constants';
import { generateId, safeRender, parseCurrency, calculateProgress } from './utils';
import useAuth from './hooks/useAuth';
import useData from './hooks/useData';
import useFilters from './hooks/useFilters';

// --- Components ---
import AuthScreen from './components/Auth/AuthScreen';
import Sidebar from './components/Layout/Sidebar';
import Topbar from './components/Layout/Topbar';
import AdvancedFiltersDrawer from './components/Layout/AdvancedFiltersDrawer';
import Toast from './components/Layout/Toast';
import ModalWrapper from './components/Modals/ModalWrapper';
import ProgressModal from './components/Modals/ProgressModal';
import TopUpModal from './components/Modals/TopUpModal';
import PackageModal from './components/Modals/PackageModal';
import CustomerModal from './components/Modals/CustomerModal';
import MarketerModal from './components/Modals/MarketerModal';
import PointsModal from './components/Modals/PointsModal';
import PayoutModal from './components/Modals/PayoutModal';
import UserManagementModal from './components/Modals/UserManagementModal';
import MarketerRequestModal from './components/Modals/MarketerRequestModal';
import SettingsView from './components/Views/SettingsView';
import CRMView from './components/Views/CRMView';
import CustomerDetailView from './components/Views/CustomerDetailView';
import AnalyticsView from './components/Views/AnalyticsView';
import MarketersView from './components/Views/MarketersView';
import PackagesView from './components/Views/PackagesView';
import MarketerDetailView from './components/Views/MarketerDetailView';

const App = () => {
  // --- Refs ---
  const imageUploadRef = useRef(null);
  const tableContainerRef = useRef(null);
  const restoreInputRef = useRef(null);
  const chatEndRef = useRef(null);

  // --- Auth ---
  const {
    user, currentUser, isSuperAdmin, isAuthReady, googleAccessToken, setGoogleAccessToken, globalAuthError, handleLogout: authLogout,
    linkGoogleAccount, refreshGoogleToken, isLinkingGoogle,
  } = useAuth();

  // --- Persistent State (must be before useData) ---
  const [lastBackupDate, setLastBackupDate] = useState(() => localStorage.getItem('ads_last_backup') || null);
  const [globalExchangeRate, setGlobalExchangeRate] = useState(() => {
    try { return parseFloat(localStorage.getItem('lyalina_exchange_rate')) || 7.20; } catch { return 7.20; }
  });

  // --- Workspace (must be before useData) ---
  const [workspaceId, setWorkspaceId] = useState(() => {
    try { return localStorage.getItem('ads_workspace_id') || DEFAULT_WORKSPACE; } catch { return DEFAULT_WORKSPACE; }
  });
  const [workspaceHistory, setWorkspaceHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('ads_workspace_history');
      const parsed = saved ? JSON.parse(saved) : [];
      const validStrings = parsed.filter(item => typeof item === 'string');
      return [...new Set([...PRESET_WORKSPACES, ...validStrings])];
    } catch { return PRESET_WORKSPACES; }
  });

  // --- Data ---
  const {
    data, setData, customers, setCustomers, invoices, setInvoices, marketers, setMarketers,
    payouts, setPayouts, packages, setPackages, marketerRequests, setMarketerRequests,
    walletTransactions, setWalletTransactions, isLoading, setIsLoading, systemLogs, setSystemLogs,
    addLog, customerStats, marketerStats, saveCampaign, addCampaign, deleteDocByType, updateDoc, getDocRef, handleSeedPackages,
  } = useData({ currentUser, isSuperAdmin, workspaceId });

  // --- UI State ---
  const [currentView, setCurrentView] = useState('ads');
  const [activeCustomerTab, setActiveCustomerTab] = useState('ledger');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedMarketer, setSelectedMarketer] = useState(null);
  const [selectedAds, setSelectedAds] = useState([]);
  const [invoiceSelection, setInvoiceSelection] = useState([]);
  const [showSmartInput, setShowSmartInput] = useState(false);

  // --- Modals ---
  const [modals, setModals] = useState({
    addCustomer: false, editCustomer: false, addMarketer: false, editMarketer: false,
    payout: false, points: false, advancedFilters: false, package: false, ai: false,
    marketerRequest: false, userManagement: false, topUp: false,
  });
  const toggleModal = useCallback((name, state) => setModals(prev => ({ ...prev, [name]: state })), [setModals]);

  const [confirmModal, setConfirmModal] = useState({ show: false, message: "", action: null, type: "info" });
  const [progressModal, setProgressModal] = useState({ show: false, title: "", current: 0, total: 0, percentage: 0 });
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  // --- Forms ---
  const [customerForm, setCustomerForm] = useState({ name: "", phone: "", email: "", marketerId: "", walletBalanceUSD: 0 });
  const [marketerForm, setMarketerForm] = useState({ name: "", phone: "", email: "", rate: "", bankName: "", accountNum: "" });
  const [packageForm, setPackageForm] = useState({ id: null, code: "", days: "", priceUSD: "", priceLYD: "", category: "G" });
  const [payoutForm, setPayoutForm] = useState({ amount: "", amountLYD: "", note: "" });
  const [pointsForm, setPointsForm] = useState({ amount: "", reason: "", type: "add" });
  const [newPageLinkInput, setNewPageLinkInput] = useState("");
  const [rawInput, setRawInput] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [aiChatPrompt, setAiChatPrompt] = useState("");
  const [aiChatResponse, setAiChatResponse] = useState("");
  const [conversationHistory, setConversationHistory] = useState([]);
  const [aiSystemInstruction, setAiSystemInstruction] = useState(localStorage.getItem('aiSystemInstruction') || "أنت خبير تسويق رقمي. أجب باللغة العربية باختصار واحترافية.");
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [tempWorkspaceId, setTempWorkspaceId] = useState("");

  // --- AI State ---
  const [isAnalyzingCustomer, setIsAnalyzingCustomer] = useState(false);
  const [customerAnalysisResult, setCustomerAnalysisResult] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleWorkspaceChange = useCallback((newId) => {
    setWorkspaceId(newId);
    setTempWorkspaceId(newId);
    localStorage.setItem('ads_workspace_id', newId);
    addLog(`تم التبديل إلى مساحة العمل: ${newId}`);
  }, [addLog]);

  // --- Workspace discovery ---
  useEffect(() => {
    if (!currentUser) return;
    const findAllWorkspaces = async () => {
      try {
        const snap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'campaigns'));
        const wSet = new Set(workspaceHistory);
        snap.docs.forEach(d => {
          const row = d.data();
          if (isSuperAdmin || row.ownerId === currentUser.uid) {
            if (row.workspaceId) wSet.add(row.workspaceId);
          }
        });
        const newHistory = Array.from(wSet);
        setWorkspaceHistory(newHistory);
        localStorage.setItem('ads_workspace_history', JSON.stringify(newHistory));
      } catch (e) {
        console.error('فشل تحميل مساحات العمل', e);
      }
    };
    findAllWorkspaces();
  }, [currentUser, isSuperAdmin]);

  // --- Workspace change effects ---
  useEffect(() => { setDisplayLimit(100); }, [workspaceId]);

  // --- Filters ---
  const filters = useFilters({ data, currentView, selectedCustomer });
  const {
    searchInput, setSearchInput, searchTerm, setSearchTerm,
    filterPayment, setFilterPayment, filterStatus, setFilterStatus,
    filterPage, setFilterPage, filterDateStart, setFilterDateStart, filterDateEnd, setFilterDateEnd,
    showArchived, setShowArchived, showDeleted, setShowDeleted,
    sortConfig, setSortConfig, displayLimit, setDisplayLimit,
    uniquePageNames, activeFiltersCount, sortedAndFilteredData, clearAllFilters,
  } = filters;

  // --- Debounce search ---
  useEffect(() => {
    const timer = setTimeout(() => { setSearchTerm(searchInput); setDisplayLimit(100); }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => { setDisplayLimit(100); }, [filterStatus, filterPayment, filterPage, showArchived, showDeleted]);

  // --- Auto-scroll chat ---
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [conversationHistory]);

  // --- Dynamic headers ---
  const dynamicHeaders = useMemo(() => (isSuperAdmin ? ["المستخدم", ...HEADERS] : HEADERS), [isSuperAdmin]);

  // --- Create new campaign row ---
  const createNewRow = useCallback((initialData = {}) => ({
    ...HEADERS.reduce((acc, h) => ({ ...acc, [h]: "" }), {}),
    id: generateId(), campaignRef: '#' + Math.random().toString(36).substr(2, 6).toUpperCase(),
    "التاريخ": new Date().toLocaleDateString('en-CA'), "نوع الحملة": "استهداف زيادة التفاعل",
    "الدفع": "غير مدفوع", "الحالة": "قيد المراجعة", "المكان": "بنغازي",
    paymentMethod: '', paidAt: null, walletTxId: '',
    workspaceId, ownerId: currentUser?.uid, ownerEmail: currentUser?.email,
    isArchived: false, isDeleted: false, ...initialData, createdAt: serverTimestamp(),
  }), [workspaceId, currentUser]);

  // --- Logout ---
  const handleLogout = useCallback(async () => {
    setConfirmModal({ show: false, message: "", action: null, type: "info" });
    setIsLoading(true);
    try {
      await authLogout();
      setGoogleAccessToken(null);
      setData([]); setCustomers([]); setMarketers([]); setInvoices([]); setPayouts([]); setPackages([]);
      setCurrentView('ads');
      addLog("تم تسجيل الخروج وتفريغ البيانات بنجاح.", "success");
    } catch (e) {
      addLog("فشل تسجيل الخروج", "error");
      console.error(e);
      showToast('فشل تسجيل الخروج', 'error');
    }
    setIsLoading(false);
  }, [authLogout, setGoogleAccessToken, addLog, setIsLoading, setData, setCustomers, setMarketers, setInvoices, setPayouts, setPackages]);

  // --- Campaign Operations ---
  const addRow = useCallback((initialData) => {
    try {
      const row = createNewRow(initialData && !initialData.nativeEvent ? initialData : {});
      setData(prev => [row, ...prev]);
      saveCampaign(row);
      addLog("تم إضافة صف جديد");
    } catch (e) {
      console.error(e);
      showToast('فشل إضافة الصف', 'error');
    }
  }, [createNewRow, setData, saveCampaign, addLog, showToast]);

  const updateCell = useCallback((rowIndex, header, value) => {
    const actualRowId = sortedAndFilteredData[rowIndex]?.id;
    const originalIndex = data.findIndex(r => r.id === actualRowId);
    if (originalIndex === -1) return;
    let updatedRow = { ...data[originalIndex], [header]: value };
    if (header === "كود الباقة" && value) {
      const pkg = packages.find(p => p.code === value);
      if (pkg) {
        updatedRow["المدة"] = String(pkg.days);
        updatedRow["القيمة"] = String(pkg.priceUSD);
        updatedRow["القيمة (د.ل)"] = String(pkg.priceLYD);
      }
    }
    const newData = [...data];
    newData[originalIndex] = updatedRow;
    setData(newData);
    saveCampaign(updatedRow);
  }, [sortedAndFilteredData, data, packages, setData, saveCampaign]);

  const handlePaymentChange = useCallback((rowIndex, value) => {
    const actualRowId = sortedAndFilteredData[rowIndex]?.id;
    const originalIndex = data.findIndex(r => r.id === actualRowId);
    if (originalIndex === -1) return;
    let updatedRow = { ...data[originalIndex], 'الدفع': value };
    if (value === 'مدفوع') {
      updatedRow.paymentMethod = 'يدوي';
      updatedRow.paidAt = new Date().toISOString();
    }
    const newData = [...data];
    newData[originalIndex] = updatedRow;
    setData(newData);
    saveCampaign(updatedRow);
  }, [sortedAndFilteredData, data, setData, saveCampaign]);

  const toggleSelectAll = useCallback(() => {
    setSelectedAds(prev => prev.length === sortedAndFilteredData.length && sortedAndFilteredData.length > 0 ? [] : sortedAndFilteredData.map(r => r.id));
  }, [sortedAndFilteredData, setSelectedAds]);
  const toggleSelectRow = useCallback((id) => {
    setSelectedAds(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  }, [setSelectedAds]);

  const handleBulkAction = useCallback(async (action, value) => {
    if (!selectedAds.length || !currentUser) return;
    try {
      const updates = [];
      const newData = [...data];
      selectedAds.forEach(id => {
        const idx = newData.findIndex(r => r.id === id);
        if (idx !== -1) {
          let row = { ...newData[idx] };
          if (action === 'status') row['الحالة'] = value;
          else if (action === 'payment') { row['الدفع'] = value; if (value === 'مدفوع') { if (!row.paymentMethod) row.paymentMethod = 'يدوي'; row.paidAt = serverTimestamp(); } else { row.paymentMethod = ''; row.paidAt = null; } }
          else if (action === 'archive') row.isArchived = true;
          else if (action === 'delete') row.isDeleted = true;
          newData[idx] = row;
          updates.push(row);
        }
      });
      setData(newData);
      setSelectedAds([]);
      for (const r of updates) await saveCampaign(r);
      addLog(`تعديل جماعي لـ ${updates.length} سجل`);
      showToast(`تم تعديل ${updates.length} سجل بنجاح`, 'success');
    } catch (e) {
      console.error(e);
      showToast('فشل العملية الجماعية', 'error');
    }
  }, [selectedAds, currentUser, data, setData, setSelectedAds, saveCampaign, addLog, showToast]);

  const handleBulkDuplicate = useCallback(() => {
    if (!selectedAds.length) return;
    try {
      let added = 0;
      const newRows = [];
      data.forEach(row => {
        if (selectedAds.includes(row.id)) {
          const dup = createNewRow({ ...row, isArchived: false, isDeleted: false });
          dup.id = generateId();
          dup.campaignRef = '#' + Math.random().toString(36).substr(2, 6).toUpperCase();
          newRows.push(dup);
          added++;
        }
      });
      setData(prev => [...newRows, ...prev]);
      setSelectedAds([]);
      newRows.forEach(r => saveCampaign(r));
      showToast(`تم نسخ ${added} حملة`, 'success');
    } catch (e) {
      console.error(e);
      showToast('فشل نسخ الحملات', 'error');
    }
  }, [selectedAds, data, createNewRow, generateId, setData, setSelectedAds, saveCampaign, showToast]);

  const handleWalletPayment = useCallback(async (adIds) => {
    const ids = adIds || selectedAds;
    if (!ids.length || !currentUser) return;
    setIsLoading(true);
    let successCount = 0;
    let failCount = 0;

    const processOne = async (adId) => {
      const ad = data.find(r => r.id === adId);
      if (!ad || ad["الدفع"] === "مدفوع") return;
      const costUSD = parseCurrency(ad["القيمة"]);
      if (costUSD <= 0) { showToast(`تم تخطي الحملة ${ad["اسم Ad"]} لعدم وجود تكلفة`, 'info'); return; }
      const customer = customers.find(c => c.linkedPages?.includes(ad["اسم الصفحة"]));
      if (!customer) { showToast(`فشل الخصم للحملة ${ad["اسم Ad"]}: الصفحة غير مربوطة بأي عميل`, 'error'); failCount++; return; }
      if ((customer.walletBalanceUSD || 0) < costUSD) { showToast(`الرصيد غير كافٍ للعميل ${customer.name} لتمويل ${ad["اسم Ad"]}`, 'error'); failCount++; return; }

      const costLYD = costUSD * (globalExchangeRate || 5);
      const newBalance = customer.walletBalanceUSD - costUSD;
      const tid = generateId();
      await Promise.all([
        updateDoc('customers', customer.id, { walletBalanceUSD: newBalance, updatedAt: serverTimestamp() }),
        setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'wallet_transactions', tid), {
          id: tid, customerId: customer.id, type: 'deduction', amountLYD: costLYD, rate: globalExchangeRate || 5, amountUSD: -costUSD,
          date: new Date().toLocaleDateString('en-CA'), note: `تمويل حملة: ${ad["اسم Ad"]}`,
          adId: ad.id, workspaceId, ownerId: currentUser.uid, ownerEmail: currentUser.email, createdAt: serverTimestamp(),
        }),
        updateDoc('campaigns', ad.id, {
          "الدفع": "مدفوع", paymentMethod: 'محفظة', paidAt: serverTimestamp(), walletTxId: tid, updatedAt: serverTimestamp(),
        }),
      ]);
      successCount++;
    };

    for (const adId of ids) {
      try { await processOne(adId); } catch (e) { console.error(e); showToast(`حدث خطأ أثناء خصم الحملة`, 'error'); failCount++; }
    }

    setSelectedAds([]);
    setIsLoading(false);
    if (successCount > 0) setConfirmModal({ show: true, type: 'success', message: `تم تمويل ${successCount} حملة بنجاح من محافظ العملاء.` });
    else if (failCount > 0) setConfirmModal({ show: true, type: 'error', message: `فشل تمويل ${failCount} حملة. راجع سجل الأخطاء.` });
  }, [selectedAds, currentUser, data, customers, globalExchangeRate, addLog, setIsLoading, generateId, setSelectedAds, setConfirmModal, updateDoc, workspaceId, appId, db, setDoc, doc, parseCurrency, serverTimestamp]);

  const handleRefundPayment = useCallback(async (adId) => {
    if (!currentUser) return;
    const ad = data.find(r => r.id === adId);
    if (!ad || ad["الدفع"] !== "مدفوع" || !ad.walletTxId) return;
    const customer = customers.find(c => c.linkedPages?.includes(ad["اسم الصفحة"]));
    if (!customer) return;
    const costUSD = parseCurrency(ad["القيمة"]);
    setConfirmModal({
      show: true, type: "info",
      message: `إعادة ${costUSD.toFixed(2)}$ إلى محفظة ${customer.name} وإلغاء دفع الحملة "${ad["اسم Ad"]}"؟`,
      action: async () => {
        try {
          const newBalance = (customer.walletBalanceUSD || 0) + costUSD;
          await updateDoc('customers', customer.id, { walletBalanceUSD: newBalance, updatedAt: serverTimestamp() });
          const tid = generateId();
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'wallet_transactions', tid), {
            id: tid, customerId: customer.id, type: 'refund', amountLYD: 0, rate: 0, amountUSD: costUSD,
            date: new Date().toLocaleDateString('en-CA'), note: `استرداد: ${ad["اسم Ad"]}`,
            adId: ad.id, workspaceId, ownerId: currentUser.uid, ownerEmail: currentUser.email, createdAt: serverTimestamp(),
          });
          await updateDoc('campaigns', ad.id, {
            "الدفع": "غير مدفوع", paymentMethod: '', paidAt: null, walletTxId: '', updatedAt: serverTimestamp(),
          });
          setConfirmModal({ show: false, message: "", action: null, type: "info" });
          addLog(`تم استرداد ${costUSD.toFixed(2)}$ للحملة ${ad["اسم Ad"]}`);
          showToast(`تم إلغاء الدفع واسترداد ${costUSD.toFixed(2)}$`, 'success');
        } catch (e) {
          console.error(e);
          showToast('فشل إلغاء الدفع', 'error');
        }
      },
    });
  }, [currentUser, data, customers, generateId, addLog, setConfirmModal, updateDoc, appId, workspaceId, db, setDoc, doc, parseCurrency, serverTimestamp]);

  const duplicateRow = useCallback((index) => {
    try {
      const original = sortedAndFilteredData[index];
      const duplicated = createNewRow({
        ...original,
        isArchived: false, isDeleted: false,
        "كود المنشور": original["كود المنشور"] ? `${original["كود المنشور"]} (نسخة)` : "",
      });
      duplicated.id = generateId();
      duplicated.campaignRef = '#' + Math.random().toString(36).substr(2, 6).toUpperCase();
      setData(prev => [duplicated, ...prev]);
      saveCampaign(duplicated);
    } catch (e) {
      console.error(e);
      showToast('فشل تكرار الصف', 'error');
    }
  }, [sortedAndFilteredData, createNewRow, setData, saveCampaign, showToast, generateId]);

  const toggleArchiveRow = useCallback((index) => {
    try {
      const row = sortedAndFilteredData[index];
      const updatedRow = { ...row, isArchived: !row.isArchived };
      const originalIndex = data.findIndex(r => r.id === row.id);
      if (originalIndex !== -1) {
        const newData = [...data];
        newData[originalIndex] = updatedRow;
        setData(newData);
        saveCampaign(updatedRow);
      }
    } catch (e) {
      console.error(e);
      showToast('فشل أرشفة الصف', 'error');
    }
  }, [sortedAndFilteredData, data, setData, saveCampaign, showToast]);

  const requestDelete = useCallback((type, id, index) => {
    setConfirmModal({
      show: true, type: "info",
      message: type === 'ad' ? "نقل للسلة؟" : type === 'hard' ? "حذف نهائي؟" : "هل أنت متأكد من الحذف؟",
      action: async () => {
        if (type === 'ad') {
          const row = sortedAndFilteredData[index];
          if (currentUser && row?.id) {
            const updated = { ...row, isDeleted: true };
            const d = [...data];
            d[data.findIndex(r => r.id === row.id)] = updated;
            setData(d);
            await saveCampaign(updated);
          }
        } else if (type === 'hard') {
          const row = sortedAndFilteredData[index];
          if (currentUser && row?.id) {
            setData(prev => prev.filter(r => r.id !== row.id));
            await deleteDocByType('campaigns', row.id);
          }
        } else if (type === 'customer') {
          await deleteDocByType('customers', id);
          if (selectedCustomer?.id === id) { setSelectedCustomer(null); setCurrentView('crm'); }
        } else if (type === 'marketer') {
          await deleteDocByType('marketers', id);
          if (selectedMarketer?.id === id) { setSelectedMarketer(null); setCurrentView('marketers'); }
        } else if (type === 'package') {
          await deleteDocByType('packages', id);
        }
        setConfirmModal({ show: false, message: "", action: null, type: "info" });
      },
    });
  }, [sortedAndFilteredData, data, currentUser, setData, saveCampaign, deleteDocByType, setConfirmModal, selectedCustomer, selectedMarketer, setSelectedCustomer, setCurrentView, setSelectedMarketer]);

  // --- Smart Input / AI ---
  const AI_MODEL = "gemini-flash-latest";

  const callGemini = useCallback(async (parts, systemInstruction, generationConfig, contents) => {
    const body = {
      contents: contents || [{ role: "user", parts: Array.isArray(parts) ? parts : [{ text: parts }] }],
      ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
      ...(generationConfig || {}),
    };
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error("غير مسجل الدخول");
    const res = await fetch(GEMINI_PROXY_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : (data?.error?.message || `HTTP ${res.status}`));
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }, [AI_MODEL]);

  const handleAskAi = useCallback(async (overridePrompt) => {
    const promptToUse = typeof overridePrompt === 'string' ? overridePrompt : aiChatPrompt;
    if (!promptToUse.trim()) return;
    setIsAiLoading(true);
    if (typeof overridePrompt === 'string') setAiChatPrompt(overridePrompt);
    const userEntry = { role: "user", parts: [{ text: promptToUse }] };
    const updated = [...conversationHistory, userEntry];
    setConversationHistory(updated);
    try {
      const text = await callGemini(null, aiSystemInstruction, null, updated);
      setConversationHistory(prev => [...prev, { role: "model", parts: [{ text: text || "لم يتم استلام رد." }] }]);
      if (typeof overridePrompt !== 'string') setAiChatPrompt("");
    } catch (e) {
      console.error(e);
      setConversationHistory(prev => [...prev, { role: "model", parts: [{ text: `خطأ: ${e.message}` }] }]);
    }
    setIsAiLoading(false);
  }, [conversationHistory, aiSystemInstruction, setIsAiLoading, setAiChatPrompt, callGemini]);

  const handleSmartAnalysis = useCallback(async () => {
    if (!rawInput.trim() && !selectedImage) return;
    setIsAiLoading(true);
    const p = rawInput.trim() ? `Analyze: "${rawInput}".` : "Analyze image.";
    const parts = [{ text: `${p} Return JSON mapping to columns: ${AI_HEADERS.join(',')}. Default Campaign: استهداف زيادة التفاعل. Default Payment: غير مدفوع.` }];
    if (selectedImage) {
      parts.push({ inlineData: { mimeType: selectedImage.match(/data:(.*);/)?.[1] || "image/png", data: selectedImage.split(',')[1] } });
    }
    try {
      const txt = await callGemini(parts, aiSystemInstruction, { generationConfig: { responseMimeType: "application/json" } });
      if (txt) {
        const jsonMatch = txt.match(/\{[\s\S]*\}/);
        const clean = jsonMatch ? jsonMatch[0] : txt;
        addRow(JSON.parse(clean));
        setRawInput("");
        setSelectedImage(null);
        setShowSmartInput(false);
        showToast('تم إدراج البيانات بنجاح', 'success');
      }
    } catch (e) {
      console.error(e);
      showToast(`فشل التحليل الذكي: ${e.message}`, 'error');
    }
    setIsAiLoading(false);
  }, [rawInput, selectedImage, aiSystemInstruction, setIsAiLoading, addRow, setRawInput, setSelectedImage, setShowSmartInput, showToast, AI_HEADERS, callGemini]);

  const handlePaste = useCallback((e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        const reader = new FileReader();
        reader.onloadend = () => setSelectedImage(reader.result);
        reader.readAsDataURL(blob);
      }
    }
  }, [setSelectedImage]);

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (file) { const reader = new FileReader(); reader.onloadend = () => setSelectedImage(reader.result); reader.readAsDataURL(file); }
  }, [setSelectedImage]);

  // --- Customer Operations ---
  const handleSaveCustomer = useCallback(async () => {
    if (!customerForm.name.trim()) return setConfirmModal({ show: true, type: "error", message: "يرجى إدخال اسم العميل" });
    if (!currentUser) return;
    try {
      const cid = selectedCustomer ? selectedCustomer.id : generateId();
      const payload = {
        id: cid, name: customerForm.name, phone: customerForm.phone, email: customerForm.email,
        marketerId: customerForm.marketerId, workspaceId, updatedAt: serverTimestamp(),
      };
      if (!selectedCustomer) {
        payload.linkedPages = []; payload.points = 0; payload.walletBalanceUSD = 0;
        payload.ownerId = currentUser.uid; payload.ownerEmail = currentUser.email; payload.createdAt = serverTimestamp();
      }
      await updateDoc('customers', cid, payload);
      if (selectedCustomer) setSelectedCustomer({ ...selectedCustomer, ...payload });
      toggleModal('addCustomer', false);
      toggleModal('editCustomer', false);
      setCustomerForm({ name: "", phone: "", email: "", marketerId: "", walletBalanceUSD: 0 });
      showToast('تم حفظ العميل بنجاح', 'success');
    } catch (e) {
      console.error(e);
      showToast('فشل حفظ العميل', 'error');
    }
  }, [customerForm, selectedCustomer, currentUser, workspaceId, generateId, setConfirmModal, updateDoc, serverTimestamp, toggleModal, setSelectedCustomer, setCustomerForm, showToast]);

  const handleSaveTopUp = useCallback(async (amountLYD, rate, amountUSD, note) => {
    if (!selectedCustomer || !amountLYD || !currentUser) return;
    setIsLoading(true);
    try {
      const newBalance = (selectedCustomer.walletBalanceUSD || 0) + amountUSD;
      await updateDoc('customers', selectedCustomer.id, { walletBalanceUSD: newBalance, updatedAt: serverTimestamp() });
      const tid = generateId();
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'wallet_transactions', tid), {
        id: tid, customerId: selectedCustomer.id, type: 'topup', amountLYD, rate, amountUSD,
        date: new Date().toLocaleDateString('en-CA'), note: note || "شحن محفظة",
        workspaceId, ownerId: currentUser.uid, ownerEmail: currentUser.email, createdAt: serverTimestamp(),
      });
      addLog(`تم شحن ${amountUSD.toFixed(2)}$ للعميل ${selectedCustomer.name}`);
      showToast(`تم شحن ${amountUSD.toFixed(2)}$ للعميل ${selectedCustomer.name}`, 'success');
      toggleModal('topUp', false);
    } catch (e) {
      console.error(e);
      showToast('فشل شحن الرصيد', 'error');
    }
    setIsLoading(false);
  }, [selectedCustomer, currentUser, addLog, updateDoc, generateId, toggleModal, workspaceId, appId, db, setIsLoading, setDoc, doc, serverTimestamp, showToast]);

  const linkPageToCustomer = useCallback(async () => {
    if (!selectedCustomer || !newPageLinkInput.trim() || !currentUser) return;
    const pageName = newPageLinkInput.trim();
    if (selectedCustomer.linkedPages?.includes(pageName)) return;
    const existingOwner = customers.find(c => c.id !== selectedCustomer.id && c.linkedPages?.includes(pageName));
    if (existingOwner) {
      setConfirmModal({
        show: true, type: "info", message: `الصفحة "${pageName}" مربوطة حالياً بالعميل "${existingOwner.name}". هل تريد نقل ملكيتها؟`,
        action: async () => {
          try {
            setConfirmModal({ show: false, message: "", action: null, type: "info" });
            const oldOwnerUpdated = { ...existingOwner, linkedPages: existingOwner.linkedPages.filter(p => p !== pageName) };
            await updateDoc('customers', existingOwner.id, { linkedPages: oldOwnerUpdated.linkedPages, updatedAt: serverTimestamp() });
            const updated = { ...selectedCustomer, linkedPages: [...(selectedCustomer.linkedPages || []), pageName] };
            await updateDoc('customers', updated.id, { ...updated, updatedAt: serverTimestamp() });
            setSelectedCustomer(updated);
            setNewPageLinkInput("");
            addLog(`تم نقل الصفحة "${pageName}" من "${existingOwner.name}" إلى "${selectedCustomer.name}".`);
            showToast(`تم نقل الصفحة "${pageName}" بنجاح`, 'success');
          } catch (e) {
            console.error(e);
            showToast('فشل ربط الصفحة', 'error');
          }
        },
      });
    } else {
      try {
        const updated = { ...selectedCustomer, linkedPages: [...(selectedCustomer.linkedPages || []), pageName] };
        await updateDoc('customers', updated.id, { ...updated, updatedAt: serverTimestamp() });
        setSelectedCustomer(updated);
        setNewPageLinkInput("");
        addLog(`تم ربط الصفحة "${pageName}" بالعميل "${selectedCustomer.name}".`);
        showToast(`تم ربط الصفحة "${pageName}" بنجاح`, 'success');
      } catch (e) {
        console.error(e);
        showToast('فشل ربط الصفحة', 'error');
      }
    }
  }, [selectedCustomer, newPageLinkInput, currentUser, customers, updateDoc, setConfirmModal, setSelectedCustomer, setNewPageLinkInput, addLog, serverTimestamp]);

  const removeLinkedPage = useCallback(async (pageName) => {
    if (!selectedCustomer || !currentUser) return;
    try {
      const updated = { ...selectedCustomer, linkedPages: selectedCustomer.linkedPages.filter(p => p !== pageName) };
      await updateDoc('customers', updated.id, { ...updated, updatedAt: serverTimestamp() });
      setSelectedCustomer(updated);
      showToast(`تم فك الصفحة "${pageName}" بنجاح`, 'success');
    } catch (e) {
      console.error(e);
      showToast('فشل فك الصفحة', 'error');
    }
  }, [selectedCustomer, currentUser, updateDoc, setSelectedCustomer, serverTimestamp, showToast]);

  // --- Marketer Operations ---
  const handleSaveMarketer = useCallback(async () => {
    if (!marketerForm.name.trim()) return setConfirmModal({ show: true, type: "error", message: "اسم المسوق مطلوب" });
    if (!currentUser) return;
    try {
      const mid = selectedMarketer ? selectedMarketer.id : generateId();
      const payload = { id: mid, ...marketerForm, rate: parseFloat(marketerForm.rate) || 0, workspaceId, updatedAt: serverTimestamp() };
      if (!selectedMarketer) { payload.ownerId = currentUser.uid; payload.ownerEmail = currentUser.email; payload.createdAt = serverTimestamp(); }
      await updateDoc('marketers', mid, payload);
      if (selectedMarketer) setSelectedMarketer({ ...selectedMarketer, ...payload });
      toggleModal('addMarketer', false);
      toggleModal('editMarketer', false);
      setMarketerForm({ name: "", phone: "", email: "", rate: "", bankName: "", accountNum: "" });
      showToast('تم حفظ المسوق بنجاح', 'success');
    } catch (e) {
      console.error(e);
      showToast('فشل حفظ المسوق', 'error');
    }
  }, [marketerForm, selectedMarketer, currentUser, workspaceId, generateId, updateDoc, setConfirmModal, setSelectedMarketer, toggleModal, setMarketerForm, serverTimestamp, showToast]);

  const handleAddPayout = useCallback(async () => {
    if (!selectedMarketer || !payoutForm.amount || !currentUser) return;
    try {
      const newId = generateId();
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'payouts', newId), {
        id: newId, marketerId: selectedMarketer.id, amount: parseFloat(payoutForm.amount),
        amountLYD: parseFloat(payoutForm.amountLYD) || 0, note: payoutForm.note,
        date: new Date().toLocaleDateString('en-CA'), workspaceId,
        ownerId: currentUser.uid, ownerEmail: currentUser.email, createdAt: serverTimestamp(),
      });
      toggleModal('payout', false);
      setPayoutForm({ amount: "", amountLYD: "", note: "" });
      showToast('تم إضافة الدفعة بنجاح', 'success');
    } catch (e) {
      console.error(e);
      showToast('فشل إضافة الدفعة', 'error');
    }
  }, [selectedMarketer, payoutForm, currentUser, generateId, appId, db, setDoc, doc, toggleModal, setPayoutForm, workspaceId, serverTimestamp, showToast]);

  // --- Points ---
  const handleUpdatePoints = useCallback(async () => {
    if (!selectedCustomer || !pointsForm.amount || !currentUser) return;
    const val = parseInt(pointsForm.amount) || 0;
    if (val <= 0) return;
    try {
      const newPoints = pointsForm.type === 'add' ? (selectedCustomer.points || 0) + val : (selectedCustomer.points || 0) - val;
      const updatedCustomer = { ...selectedCustomer, points: Math.max(0, newPoints) };
      await updateDoc('customers', updatedCustomer.id, updatedCustomer);
      setSelectedCustomer(updatedCustomer);
      const logId = generateId();
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'point_logs', logId), {
        id: logId, customerId: selectedCustomer.id, customerName: selectedCustomer.name,
        type: pointsForm.type, amount: val, reason: pointsForm.reason,
        workspaceId, ownerId: currentUser.uid, ownerEmail: currentUser.email, createdAt: serverTimestamp(),
      });
      toggleModal('points', false);
      setPointsForm({ amount: "", reason: "", type: "add" });
      showToast('تم تحديث النقاط بنجاح', 'success');
    } catch (e) {
      console.error(e);
      showToast('فشل تحديث النقاط', 'error');
    }
  }, [selectedCustomer, pointsForm, currentUser, updateDoc, setSelectedCustomer, generateId, appId, db, setDoc, doc, toggleModal, setPointsForm, workspaceId, serverTimestamp, showToast]);

  // --- Marketer Requests ---
  const submitMarketerRequest = useCallback(async (action, customerId) => {
    if (!selectedMarketer || !customerId || !currentUser) return;
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    const reqId = generateId();
    const payload = {
      id: reqId, marketerId: selectedMarketer.id, marketerName: selectedMarketer.name,
      customerId: customer.id, customerName: customer.name, action, status: 'pending',
      workspaceId, ownerId: currentUser.uid, ownerEmail: currentUser.email, createdAt: serverTimestamp(),
    };
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'marketer_requests', reqId), payload);
      addLog(`تم إرسال طلب ${action === 'add' ? 'إضافة' : 'إزالة'} العميل للإدارة بنجاح.`);
      showToast(`تم إرسال طلب ${action === 'add' ? 'إضافة' : 'إزالة'} العميل للإدارة بنجاح.`, 'success');
      toggleModal('marketerRequest', false);
    } catch (e) {
      console.error(e);
      showToast('فشل إرسال الطلب', 'error');
    }
  }, [selectedMarketer, customers, currentUser, generateId, appId, db, setDoc, doc, addLog, toggleModal, workspaceId, serverTimestamp, showToast]);

  const processMarketerRequest = useCallback(async (reqId, newStatus) => {
    if (!isSuperAdmin) return;
    const req = marketerRequests.find(r => r.id === reqId);
    if (!req) return;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'marketer_requests', req.id), { status: newStatus, updatedAt: serverTimestamp() }, { merge: true });
      if (newStatus === 'approved') {
        const newMarketerId = req.action === 'add' ? req.marketerId : "";
        await updateDoc('customers', req.customerId, { marketerId: newMarketerId, updatedAt: serverTimestamp() });
        addLog("تمت الموافقة وتحديث بيانات العميل بنجاح.");
        showToast("تمت الموافقة وتحديث بيانات العميل بنجاح.", 'success');
      } else {
        addLog("تم رفض الطلب.");
        showToast("تم رفض الطلب.", 'info');
      }
    } catch (e) {
      console.error(e);
      showToast('فشل معالجة الطلب', 'error');
    }
  }, [isSuperAdmin, marketerRequests, appId, db, setDoc, doc, updateDoc, addLog, serverTimestamp, showToast]);

  const handleUnlinkCustomer = useCallback(async (customerId) => {
    if (isSuperAdmin) {
      try {
        await updateDoc('customers', customerId, { marketerId: "", updatedAt: serverTimestamp() });
        addLog("تم فك ارتباط العميل بالمسوق.");
        showToast('تم فك العميل بنجاح', 'success');
      } catch (e) {
        console.error(e);
        showToast('فشل فك العميل', 'error');
      }
    } else { submitMarketerRequest('remove', customerId); }
  }, [isSuperAdmin, updateDoc, addLog, submitMarketerRequest, serverTimestamp, showToast]);

  const handleLinkCustomerToMarketer = useCallback(async (customerId, marketerId) => {
    if (!customerId || !marketerId || !currentUser) return;
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    if (customer.marketerId) {
      setConfirmModal({
        show: true, type: "info", message: `العميل "${customer.name}" مرتبط حالياً بمسوق آخر. هل تريد نقل ملكيته للمسوق "${selectedMarketer.name}"؟`,
        action: async () => {
          try {
            setConfirmModal({ show: false, message: "", action: null, type: "info" });
            if (isSuperAdmin) {
              await updateDoc('customers', customerId, { marketerId, updatedAt: serverTimestamp() });
              addLog(`تم نقل العميل "${customer.name}" إلى المسوق "${selectedMarketer.name}".`);
              showToast(`تم نقل العميل "${customer.name}" بنجاح`, 'success');
            } else {
              submitMarketerRequest('add', customerId);
            }
          } catch (e) {
            console.error(e);
            showToast('فشل ربط العميل', 'error');
          }
        },
      });
    } else {
      try {
        if (isSuperAdmin) {
          await updateDoc('customers', customerId, { marketerId, updatedAt: serverTimestamp() });
          addLog(`تم ربط العميل "${customer.name}" بالمسوق "${selectedMarketer.name}".`);
          showToast(`تم ربط العميل "${customer.name}" بنجاح`, 'success');
        } else {
          submitMarketerRequest('add', customerId);
        }
      } catch (e) {
        console.error(e);
        showToast('فشل ربط العميل', 'error');
      }
    }
  }, [customers, currentUser, isSuperAdmin, updateDoc, addLog, setConfirmModal, selectedMarketer, submitMarketerRequest, serverTimestamp, showToast]);

  // --- Package Operations ---
  const handlePackageUpdate = useCallback(async (pkgId, field, value) => {
    try {
      await updateDoc('packages', pkgId, { [field]: value, updatedAt: serverTimestamp() });
    } catch (e) {
      console.error(e);
      showToast('فشل تحديث الباقة', 'error');
    }
  }, [updateDoc, serverTimestamp, showToast]);

  const handleSavePackage = useCallback(async () => {
    if (!packageForm.code.trim()) return setConfirmModal({ show: true, type: "error", message: "كود الباقة مطلوب" });
    if (!currentUser) return;
    try {
      const pkgId = packageForm.id || generateId();
      const cat = packageForm.category || "G";
      const payload = {
        id: pkgId, code: packageForm.code, days: parseInt(packageForm.days) || 0,
        priceUSD: parseFloat(packageForm.priceUSD) || 0, priceLYD: parseFloat(packageForm.priceLYD) || 0,
        category: cat, categoryLabel: PACKAGE_CATEGORIES[cat]?.label || 'متنوعة',
        workspaceId, createdAt: serverTimestamp(),
      };
      if (!packageForm.id) { payload.ownerId = currentUser.uid; payload.ownerEmail = currentUser.email; }
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'packages', pkgId), payload, { merge: true });
      toggleModal('package', false);
      setPackageForm({ id: null, code: "", days: "", priceUSD: "", priceLYD: "", category: "G" });
      showToast('تم حفظ الباقة بنجاح', 'success');
    } catch (e) {
      console.error(e);
      showToast('فشل حفظ الباقة', 'error');
    }
  }, [packageForm, currentUser, generateId, workspaceId, appId, db, setDoc, doc, toggleModal, setPackageForm, setConfirmModal, serverTimestamp, showToast]);

  const handleDeleteAllPackages = useCallback(() => {
    setConfirmModal({
      show: true, type: "info",
      message: "هل أنت متأكد من حذف جميع الباقات؟ هذا الإجراء لا يمكن التراجع عنه.",
      action: async () => {
        try {
          await Promise.all(packages.map(pkg => deleteDocByType('packages', pkg.id)));
          addLog(`تم حذف ${packages.length} باقة`);
          showToast(`تم حذف ${packages.length} باقة`, 'success');
          setConfirmModal({ show: false, message: "", action: null, type: "info" });
        } catch (e) {
          console.error(e);
          showToast('فشل حذف الباقات', 'error');
        }
      },
    });
  }, [packages, deleteDocByType, addLog, setConfirmModal, showToast]);

  // --- Invoice ---
  const handleGenerateInvoice = useCallback(async (currency = 'USD') => {
    if (!selectedCustomer || invoiceSelection.length === 0 || !currentUser) return;
    const items = sortedAndFilteredData.filter(r => invoiceSelection.includes(r.id));
    const valKey = currency === 'USD' ? "القيمة" : "القيمة (د.ل)";
    let totalPaid = 0, totalUnpaid = 0;
    items.forEach(r => { const val = parseCurrency(r[valKey]); if (r["الدفع"] === "مدفوع") totalPaid += val; else totalUnpaid += val; });
    const total = totalPaid + totalUnpaid;
    const invoiceData = {
      id: generateId(), customerId: selectedCustomer.id,
      invoiceNum: `INV-${Math.floor(Math.random() * 100000)}`,
      date: new Date().toLocaleDateString('en-GB'), total, totalPaid, totalUnpaid, currency,
      itemCount: items.length,
      items: items.map(i => ({
        id: i.id, name: i["اسم Ad"], page: i["اسم الصفحة"], amount: i[valKey],
        packageCode: i["كود الباقة"] || '-', days: i["المدة"] || '-', payment: i["الدفع"], date: i["التاريخ"],
      })),
      workspaceId, ownerId: currentUser.uid, ownerEmail: currentUser.email, createdAt: serverTimestamp(),
    };
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'invoices', invoiceData.id), invoiceData);
      printInvoice(invoiceData);
      setInvoiceSelection([]);
      setActiveCustomerTab('invoices');
    } catch (e) {
      console.error(e);
      showToast('فشل إنشاء الفاتورة', 'error');
    }
  }, [selectedCustomer, invoiceSelection, sortedAndFilteredData, currentUser, workspaceId]);

  const printInvoice = useCallback((invoiceObj, itemsList) => {
    const items = itemsList || invoiceObj.items;
    const curSym = invoiceObj.currency === 'LYD' ? 'د.ل' : '$';
    const itemsHtml = items.map((i, idx) =>
      `<tr><td class="center">${idx + 1}</td><td><strong>${safeRender(i.name)}</strong><br><span style="color:#64748b; font-size: 11px;">${safeRender(i.page)}</span></td><td class="center font-bold" style="color:#1e3a8a;">${safeRender(i.packageCode || i["كود الباقة"] || '-')}</td><td class="center">${safeRender(i.days || i["المدة"] || '-')}</td><td class="center">${safeRender(i.date || i["التاريخ"])}</td><td class="center"><span class="badge ${i.payment || i["الدفع"] === 'مدفوع' ? 'badge-success' : 'badge-danger'}">${safeRender(i.payment || i["الدفع"])}</span></td><td class="text-left font-black" style="color:#1e3a8a; direction:ltr;">${safeRender(i.amount || i[invoiceObj.currency === 'USD' ? "القيمة" : "القيمة (د.ل)"])} ${curSym}</td></tr>`
    ).join('');
    const htmlContent = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>فاتورة رقم ${safeRender(invoiceObj.invoiceNum)}</title><style>body{font-family:sans-serif;background:#f8fafc;padding:40px 20px;color:#334155;margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}.invoice-wrapper{max-width:800px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 10px 25px rgba(0,0,0,.05);padding:50px;position:relative}.invoice-wrapper::before{content:'';position:absolute;top:0;left:0;right:0;height:8px;background:linear-gradient(90deg,#1e3a8a,#7c3aed)}.header-section{display:flex;justify-content:space-between;border-bottom:2px solid #f1f5f9;padding-bottom:25px;margin-bottom:30px}.company-name{font-size:28px;font-weight:900;color:#1e3a8a;margin:0 0 5px 0}.company-sub{font-size:14px;color:#7c3aed;font-weight:700;margin:0}.contact-info{text-align:left;font-size:12px;line-height:1.8;color:#475569}.meta-box{background:#f8fafc;border-radius:12px;padding:20px;display:flex;justify-content:space-between;margin-bottom:30px;border:1px solid #e2e8f0;border-right:4px solid #7c3aed}.meta-label{font-size:12px;color:#64748b;font-weight:700;margin-bottom:6px}.meta-value{font-size:16px;font-weight:900;color:#0f172a}table{width:100%;border-collapse:separate;border-spacing:0;margin-bottom:30px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden}th{background:#1e3a8a;color:#fff;padding:16px 12px;text-align:right;font-size:14px;font-weight:700}th.center,td.center{text-align:center}th.text-left,td.text-left{text-align:left}td{padding:14px 12px;border-bottom:1px solid #e2e8f0}tr:nth-child(even) td{background:#f8fafc}.badge{padding:4px 8px;border-radius:6px;font-size:11px;font-weight:700}.badge-success{background:#dcfce7;color:#166534}.badge-danger{background:#fee2e2;color:#991b1b}.summary-box{width:360px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px}.summary-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:14px}.summary-total{display:flex;justify-content:space-between;padding:14px 0 0;font-size:18px;font-weight:900;color:#1e3a8a}</style></head><body><div class="invoice-wrapper"><div class="header-section"><div><h1 class="company-name">LYALINA</h1><p class="company-sub">وكالة إعلانات رقمية</p></div><div class="contact-info"><strong>LYALINA-ADS</strong><br>بنغازي - ليبيا<br>0915955991<br>www.ly-tech.ly</div></div><div class="meta-box"><div class="meta-item"><span class="meta-label">رقم الفاتورة</span><span class="meta-value">${safeRender(invoiceObj.invoiceNum)}</span></div><div class="meta-item"><span class="meta-label">تاريخ الإصدار</span><span class="meta-value">${safeRender(invoiceObj.date)}</span></div><div class="meta-item"><span class="meta-label">العميل</span><span class="meta-value">${invoiceObj.customerName || safeRender(selectedCustomer?.name) || '-'}</span></div><div class="meta-item"><span class="meta-label">العملة</span><span class="meta-value highlight">${curSym}</span></div></div><table><thead><tr><th class="center">#</th><th>البيان / المنشور</th><th class="center">الباقة</th><th class="center">المدة</th><th class="center">التاريخ</th><th class="center">الدفع</th><th class="text-left">المبلغ</th></tr></thead><tbody>${itemsHtml}</tbody></table><div style="display:flex;justify-content:flex-end"><div class="summary-box"><div class="summary-row"><span>المدفوع</span><strong style="color:#166534">${safeRender(invoiceObj.totalPaid)} ${curSym}</strong></div><div class="summary-row"><span>المتبقي</span><strong style="color:#991b1b">${safeRender(invoiceObj.totalUnpaid)} ${curSym}</strong></div><div class="summary-total"><span>الإجمالي الكلي</span><span>${safeRender(invoiceObj.total)} ${curSym}</span></div></div></div></div></body></html>`;
    const printWindow = window.open('', '', 'width=900,height=800');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }, [safeRender]);

  const printStatement = useCallback(() => {
    if (!selectedCustomer) return;
    const stats = customerStats[selectedCustomer.id] || { totalSpend: 0, due: 0, count: 0 };
    const linkedPages = selectedCustomer.linkedPages || [];
    const items = data.filter(r => linkedPages.includes(r["اسم الصفحة"]) && !r.isDeleted).sort((a, b) => new Date(b["التاريخ"]) - new Date(a["التاريخ"]));
    const itemsHtml = items.map((i, idx) =>
      `<tr><td class="center">${idx+1}</td><td class="center">${safeRender(i["التاريخ"])}</td><td><strong>${safeRender(i["اسم Ad"])}</strong><br><span style="color:#64748b;font-size:11px">${safeRender(i["اسم الصفحة"])}</span></td><td class="center font-bold" style="color:#1e3a8a">${safeRender(i["كود الباقة"]||'-')}</td><td class="center"><span class="badge ${i["الدفع"]==='مدفوع'?'badge-success':'badge-danger'}">${safeRender(i["الدفع"])}</span></td><td class="text-left font-black" style="direction:ltr">${safeRender(i["القيمة"])} $</td><td class="text-left font-black" style="direction:ltr">${safeRender(i["القيمة (د.ل)"])} د.ل</td></tr>`
    ).join('');
    const htmlContent = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>كشف حساب - ${safeRender(selectedCustomer.name)}</title><style>body{font-family:sans-serif;background:#f8fafc;padding:40px 20px;color:#334155;margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}.invoice-wrapper{max-width:900px;margin:0 auto;background:#fff;border-radius:16px;padding:50px}.header-section{display:flex;justify-content:space-between;border-bottom:2px solid #f1f5f9;padding-bottom:25px;margin-bottom:30px}.company-name{font-size:28px;font-weight:900;color:#1e3a8a;margin:0}.meta-box{background:#f8fafc;border-radius:12px;padding:20px;display:flex;gap:20px;margin-bottom:30px;border:1px solid #e2e8f0;border-right:4px solid #1e3a8a}.meta-item{display:flex;flex-direction:column}.meta-label{font-size:12px;color:#64748b;font-weight:700;margin-bottom:6px}.meta-value{font-size:18px;font-weight:900;color:#0f172a}table{width:100%;border-collapse:separate;border-spacing:0;margin-bottom:30px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden}th{background:#1e3a8a;color:#fff;padding:16px 12px;text-align:right}th.center,td.center{text-align:center}th.text-left,td.text-left{text-align:left}td{padding:14px 12px;border-bottom:1px solid #e2e8f0}tr:nth-child(even) td{background:#f8fafc}.badge{padding:4px 8px;border-radius:6px;font-size:11px;font-weight:700}.badge-success{background:#dcfce7;color:#166534}.badge-danger{background:#fee2e2;color:#991b1b}</style></head><body><div class="invoice-wrapper"><div class="header-section"><div><h1 class="company-name">LYALINA</h1><p style="color:#7c3aed;font-weight:700;margin:5px 0 0">وكالة إعلانات رقمية</p></div><div style="font-size:12px;line-height:1.8;color:#475569;text-align:left"><strong>LYALINA-ADS</strong><br>بنغازي - ليبيا<br>0915955991<br>www.ly-tech.ly</div></div><div class="meta-box"><div class="meta-item"><span class="meta-label">اسم العميل</span><span class="meta-value">${safeRender(selectedCustomer.name)}</span></div><div class="meta-item"><span class="meta-label">إجمالي الإنفاق</span><span class="meta-value">$${safeRender(stats.totalSpend)}</span></div><div class="meta-item"><span class="meta-label">الرصيد المتبقي</span><span class="meta-value" style="color:#991b1b">$${safeRender(stats.due)}</span></div></div><table><thead><tr><th class="center">#</th><th class="center">التاريخ</th><th>الحملة</th><th class="center">الباقة</th><th class="center">الدفع</th><th class="text-left">المبلغ ($)</th><th class="text-left">المبلغ (د.ل)</th></tr></thead><tbody>${itemsHtml}</tbody></table></div></body></html>`;
    const printWindow = window.open('', '', 'width=900,height=800');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }, [selectedCustomer, customerStats, data, safeRender]);

  const shareInvoiceWhatsApp = useCallback((inv) => {
    if (!selectedCustomer?.phone) { setConfirmModal({ show: true, type: "error", message: "لا يوجد رقم هاتف مسجل لهذا العميل." }); return; }
    const curSym = inv.currency === 'LYD' ? 'د.ل' : '$';
    let text = `📄 *فاتورة مطالبة مالية - LYALINA*\n\n👤 العميل: *${safeRender(selectedCustomer.name)}*\n🧾 الفاتورة: *${safeRender(inv.invoiceNum)}*\n📅 التاريخ: ${safeRender(inv.date)}\n\n*التفاصيل:*\n`;
    inv.items.forEach((item, idx) => { text += `${idx+1}. ${safeRender(item.name)} (${safeRender(item.page)})\n   الباقة: ${safeRender(item.packageCode)} | القيمة: ${safeRender(item.amount)} ${curSym}\n`; });
    text += `\n-------------------\n💰 *الإجمالي الكلي:* ${safeRender(inv.total)} ${curSym}\n✅ *المدفوع:* ${safeRender(inv.totalPaid)} ${curSym}\n🔴 *المتبقي (ديون):* ${safeRender(inv.totalUnpaid)} ${curSym}\n\nللتواصل: 0915955991 | www.ly-tech.ly`;
    window.open(`https://wa.me/${String(selectedCustomer.phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  }, [selectedCustomer, setConfirmModal, safeRender]);

  const shareInvoiceEmail = useCallback((inv) => {
    if (!selectedCustomer?.email) { setConfirmModal({ show: true, type: "error", message: "لا يوجد إيميل مسجل." }); return; }
    const curSym = inv.currency === 'LYD' ? 'د.ل' : '$';
    let text = `مرحباً ${safeRender(selectedCustomer.name)}،\n\nمرفق أدناه تفاصيل فاتورتكم رقم ${safeRender(inv.invoiceNum)} بتاريخ ${safeRender(inv.date)} من وكالة إعلانات LYALINA.\n\nالتفاصيل:\n`;
    inv.items.forEach((item, idx) => { text += `${idx+1}. ${safeRender(item.name)} (${safeRender(item.page)}) - الباقة: ${safeRender(item.packageCode)} - القيمة: ${safeRender(item.amount)} ${curSym}\n`; });
    text += `\nالإجمالي الكلي: ${safeRender(inv.total)} ${curSym}\nالمدفوع: ${safeRender(inv.totalPaid)} ${curSym}\nالمتبقي (ديون): ${safeRender(inv.totalUnpaid)} ${curSym}\n\nمع التحيات.`;
    window.open(`mailto:${selectedCustomer.email}?subject=${encodeURIComponent(`فاتورة إعلانات ${inv.invoiceNum} - LYALINA`)}&body=${encodeURIComponent(text)}`, '_blank');
  }, [selectedCustomer, setConfirmModal, safeRender]);

  // --- Bulk Export ---
  const exportToExcel = useCallback(() => {
    const tableHTML = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"><style>td{mso-number-format:"\\@"}</style></head><body><table border="1"><thead><tr style="background-color:#065f46;color:white">${dynamicHeaders.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${sortedAndFilteredData.map(row => `<tr>${dynamicHeaders.map(h => {
      if (h === "المستخدم") return `<td>${safeRender(row.ownerEmail)}</td>`;
      return `<td>${safeRender(row[h])}</td>`;
    }).join('')}</tr>`).join('')}</tbody></table></body></html>`;
    const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `Ads_${workspaceId}_${showArchived ? 'Archive' : 'Active'}.xls`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }, [dynamicHeaders, sortedAndFilteredData, workspaceId, showArchived, safeRender]);

  // --- AI Customer Analysis ---
  const handleAnalyzeCustomer = useCallback(async () => {
    if (!selectedCustomer) return;
    setIsAnalyzingCustomer(true);
    setCustomerAnalysisResult("");
    const stats = customerStats[selectedCustomer.id] || { totalSpend: 0, due: 0, count: 0 };
    const customerCampaigns = data.filter(r => selectedCustomer.linkedPages?.includes(r["اسم الصفحة"]) && !r.isDeleted);
    const campaignSummary = customerCampaigns.map(c => `- ${c["نوع الحملة"]} بقيمة (${c["القيمة"]}$)`).join('\n');
    const prompt = `أنت مستشار تسويق رقمي ومهندس مبيعات. حلل بيانات هذا العميل واقترح خطة التسويق القادمة لزيادة مبيعاته.\nاسم العميل: ${selectedCustomer.name}\nإجمالي الإنفاق السابق: $${stats.totalSpend}\nعدد الحملات السابقة: ${stats.count}\nسجل الحملات السابقة:\n${campaignSummary || 'لا توجد حملات'}\n\nقدم رداً مختصراً ومنسقاً في 3 نقاط: \n1. تقييم سريع لسلوك العميل التسويقي.\n2. الحملة القادمة المقترحة والسبب.\n3. نصيحة سريعة لمدير الحساب لزيادة مبيعات هذا العميل (Upselling).`;
    try {
      const text = await callGemini(prompt, aiSystemInstruction);
      setCustomerAnalysisResult(text || "لم أتمكن من تحليل البيانات حالياً.");
    } catch (e) {
      console.error(e);
      setCustomerAnalysisResult(`عذراً، حدث خطأ: ${e.message}`);
    }
    setIsAnalyzingCustomer(false);
  }, [selectedCustomer, customerStats, data, aiSystemInstruction, setIsAnalyzingCustomer, setCustomerAnalysisResult, callGemini]);

  const handleGenerateAdCopy = useCallback((row) => {
    const prompt = `✨ قم بكتابة نص إعلاني جذاب (Ad Copy) مع الإيموجي لصفحة "${row["اسم الصفحة"] || 'غير محدد'}".\nالهدف: ${row["نوع الحملة"] || 'غير محدد'}.\nالجمهور المستهدف: المكان (${row["المكان"] || 'غير محدد'})، الاهتمامات (${row["الاهتمامات"] || ' عام'}).\nالمدة: ${row["المدة"] || 'غير محدد'} أيام.\nاجعل النص جاهزاً للنسخ واللصق ومقنعاً للمبيعات.`;
    toggleModal('ai', true);
    handleAskAi(prompt);
  }, [toggleModal, handleAskAi]);

  // --- Backup & Restore ---
  const handleBackupAll = useCallback(async () => {
    if (!currentUser) return setConfirmModal({ show: true, type: "error", message: "يجب تسجيل الدخول لعمل نسخة احتياطية" });
    setProgressModal({ show: true, title: "جاري تجهيز النسخة الشاملة...", current: 0, total: 9, percentage: 0 });
    try {
      const fetchAll = async (colName) => {
        const snap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', colName));
        return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(item => isSuperAdmin || item.ownerId === currentUser.uid);
      };
      const [campaigns, customers, invoices, marketers, payouts, pointLogs, packages, marketerRequests, walletTransactions] = await Promise.all([
        fetchAll('campaigns'), fetchAll('customers'), fetchAll('invoices'), fetchAll('marketers'),
        fetchAll('payouts'), fetchAll('point_logs'), fetchAll('packages'), fetchAll('marketer_requests'),
        fetchAll('wallet_transactions'),
      ]);
      setProgressModal(p => ({ ...p, current: 9, percentage: 100 }));
      const backup = {
        version: "8.0", timestamp: new Date().toISOString(), activeWorkspace: workspaceId,
        campaigns, customers, invoices, marketers, payouts, pointLogs, packages, marketerRequests, walletTransactions,
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `Lyalina_FullBackup_${new Date().toISOString().slice(0, 10)}.json`; a.click();
      const nowStr = new Date().toLocaleString('en-GB');
      setLastBackupDate(nowStr);
      localStorage.setItem('ads_last_backup', nowStr);
      addLog("تم تصدير النسخة الشاملة بنجاح");
      setProgressModal({ show: false, title: "", current: 0, total: 0, percentage: 0 });
      setConfirmModal({ show: true, type: "success", message: "تم تحميل النسخة الاحتياطية بنجاح." });
    } catch (e) {
      setProgressModal({ show: false, title: "", current: 0, total: 0, percentage: 0 });
      setConfirmModal({ show: true, type: "error", message: "حدث خطأ أثناء الاتصال بقاعدة البيانات." });
      addLog("حدث خطأ أثناء النسخ الاحتياطي", "error");
    }
  }, [currentUser, isSuperAdmin, appId, db, getDocs, collection, setProgressModal, workspaceId, setLastBackupDate, addLog, setConfirmModal]);

  const handleBackupCurrentWorkspace = useCallback(async () => {
    if (!currentUser) return setConfirmModal({ show: true, type: "error", message: "يجب تسجيل الدخول لعمل نسخة احتياطية" });
    setProgressModal({ show: true, title: `جاري سحب بيانات (${workspaceId})...`, current: 0, total: 9, percentage: 0 });
    try {
      const fetchCurrent = async (colName) => {
        const snap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', colName));
        return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(item =>
          (isSuperAdmin || item.ownerId === currentUser.uid) && (item.workspaceId === workspaceId || (!item.workspaceId && workspaceId === DEFAULT_WORKSPACE))
        );
      };
      const [campaigns, customers, invoices, marketers, payouts, pointLogs, packages, marketerRequests, walletTransactions] = await Promise.all([
        fetchCurrent('campaigns'), fetchCurrent('customers'), fetchCurrent('invoices'), fetchCurrent('marketers'),
        fetchCurrent('payouts'), fetchCurrent('point_logs'), fetchCurrent('packages'), fetchCurrent('marketer_requests'),
        fetchCurrent('wallet_transactions'),
      ]);
      setProgressModal(p => ({ ...p, current: 9, percentage: 100 }));
      const backup = {
        version: "8.0", timestamp: new Date().toISOString(), activeWorkspace: workspaceId, isPartial: true,
        campaigns, customers, invoices, marketers, payouts, pointLogs, packages, marketerRequests, walletTransactions,
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `Lyalina_${workspaceId}_Backup_${new Date().toISOString().slice(0, 10)}.json`; a.click();
      const nowStr = new Date().toLocaleString('en-GB');
      setLastBackupDate(nowStr);
      localStorage.setItem('ads_last_backup', nowStr);
      addLog("تم التصدير المخصص بنجاح");
      setProgressModal({ show: false, title: "", current: 0, total: 0, percentage: 0 });
      setConfirmModal({ show: true, type: "success", message: `تم تحميل بيانات الحساب (${workspaceId}) بنجاح.` });
    } catch (e) {
      setProgressModal({ show: false, title: "", current: 0, total: 0, percentage: 0 });
      setConfirmModal({ show: true, type: "error", message: "حدث خطأ أثناء الاتصال بقاعدة البيانات." });
      addLog("حدث خطأ أثناء النسخ الاحتياطي المخصص", "error");
    }
  }, [currentUser, isSuperAdmin, appId, db, getDocs, collection, setProgressModal, workspaceId, setLastBackupDate, addLog, setConfirmModal, DEFAULT_WORKSPACE]);

  const handleDriveBackup = useCallback(async () => {
    if (!googleAccessToken) {
      setConfirmModal({ show: true, type: "error", message: "لا يوجد ربط مع حساب جوجل. يرجى ربط حساب جوجل من إعدادات الحساب أولاً." });
      return;
    }
    
    const attemptBackup = async (token) => {
      setProgressModal({ show: true, title: "جاري التحقق من الصلاحيات...", current: 0, total: 9, percentage: 0 });
      
      // فحص الصلاحيات أولاً
      try {
        const tokenInfo = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`);
        const tokenData = await tokenInfo.json();
        console.log("Token scopes:", tokenData.scope);
        console.log("Token email:", tokenData.email);
        console.log("Full token info:", tokenData);
        if (!tokenData.scope || !tokenData.scope.includes('drive.file')) {
          throw new Error(`التوكن لا يحتوي على صلاحية drive.file. الصلاحيات الحالية: ${tokenData.scope || 'لا توجد صلاحيات'}`);
        }
      } catch (e) {
        console.error("Token check error:", e);
        if (e.message && e.message.includes('drive.file')) {
          throw e;
        }
      }

      setProgressModal({ show: true, title: "جاري الرفع إلى Google Drive...", current: 0, total: 9, percentage: 0 });
      const fetchAll = async (colName) => {
        const snap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', colName));
        return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(item => isSuperAdmin || item.ownerId === currentUser.uid);
      };
      const [campaigns, customers, invoices, marketers, payouts, pointLogs, packages, marketerRequests, walletTransactions] = await Promise.all([
        fetchAll('campaigns'), fetchAll('customers'), fetchAll('invoices'), fetchAll('marketers'),
        fetchAll('payouts'), fetchAll('point_logs'), fetchAll('packages'), fetchAll('marketer_requests'),
        fetchAll('wallet_transactions'),
      ]);
      setProgressModal(p => ({ ...p, current: 9, percentage: 50 }));
      const fullBackup = {
        version: "8.0", timestamp: new Date().toISOString(),
        campaigns, customers, invoices, marketers, payouts, pointLogs, packages, marketerRequests, walletTransactions,
      };
      setProgressModal(p => ({ ...p, title: "جاري الإرسال للخوادم السحابية...", percentage: 75 }));
      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";
      const fileName = `Lyalina_CloudBackup_${new Date().toISOString().slice(0, 10)}.json`;
      const metadata = { name: fileName, mimeType: 'application/json' };
      const multipartRequestBody = delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata) + delimiter + 'Content-Type: application/json\r\n\r\n' + JSON.stringify(fullBackup, null, 2) + close_delim;
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` }, body: multipartRequestBody,
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Drive API error:", response.status, errorText);
        if (response.status === 401) {
          throw new Error("TOKEN_EXPIRED");
        }
        if (response.status === 403) {
          let detail = "";
          try {
            const errorJson = JSON.parse(errorText);
            detail = errorJson.error?.message || errorText;
            if (errorJson.error?.errors) {
              detail += " | " + errorJson.error.errors.map(e => e.reason).join(", ");
            }
          } catch(e) {
            detail = errorText;
          }
          console.error("403 Full error:", detail);
          throw new Error(`403: ${detail}`);
        }
        throw new Error(`فشل الرفع السحابي: ${response.status} - ${errorText}`);
      }
      const nowStr = new Date().toLocaleString('en-GB');
      setLastBackupDate(nowStr);
      localStorage.setItem('ads_last_backup', nowStr);
      addLog("تم رفع النسخة لجوجل درايف بنجاح", "success");
      setProgressModal({ show: false, title: "", current: 0, total: 0, percentage: 0 });
      setConfirmModal({ show: true, type: "success", message: `تم حفظ نسخة احتياطية سحابية باسم (${fileName}) في حساب Google Drive الخاص بك بنجاح.` });
    };

    try {
      await attemptBackup(googleAccessToken);
    } catch (err) {
      if (err.message === "TOKEN_EXPIRED" && refreshGoogleToken) {
        setProgressModal(p => ({ ...p, title: "انتهت صلاحية التوكن، جاري تحديثه...", percentage: 10 }));
        const refreshResult = await refreshGoogleToken();
        if (refreshResult.success) {
          try {
            await attemptBackup(refreshResult.success && googleAccessToken);
          } catch (retryErr) {
            console.error("Retry failed:", retryErr);
            setProgressModal({ show: false, title: "", current: 0, total: 0, percentage: 0 });
            setConfirmModal({ show: true, type: "error", message: "فشل تحديث صلاحية جوجل درايف. يرجى إعادة ربط الحساب من الإعدادات." });
            addLog("فشل الرفع إلى جوجل درايف بعد محاولة تحديث التوكن", "error");
          }
          return;
        }
      }
      console.error(err);
      setProgressModal({ show: false, title: "", current: 0, total: 0, percentage: 0 });
      let errorMsg = "تعذر الرفع إلى جوجل درايف";
      if (err.message && err.message.includes('403')) {
        errorMsg = "خطأ 403: صلاحية Google Drive API غير مفعلة. يرجى تفعيل Google Drive API في Google Cloud Console وإضافة نطاق drive.file";
      } else if (err.message === "TOKEN_EXPIRED") {
        errorMsg = "انتهت صلاحية اتصال جوجل درايف. يرجى تحديث الصلاحية من إعدادات الحساب.";
      } else if (err.message) {
        errorMsg = `تعذر الرفع إلى جوجل درايف: ${err.message}`;
      }
      setConfirmModal({ show: true, type: "error", message: errorMsg });
      addLog("فشل الرفع إلى جوجل درايف", "error");
    }
  }, [googleAccessToken, setConfirmModal, setProgressModal, isSuperAdmin, currentUser, appId, db, getDocs, collection, setLastBackupDate, addLog, refreshGoogleToken]);

  const handleRestoreAll = useCallback((e) => {
    const file = e.target.files[0];
    if (!file || !currentUser) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backup = JSON.parse(event.target.result);
        setConfirmModal({
          show: true, type: "info", message: `هل أنت متأكد من دمج هذه النسخة؟`,
          action: async () => {
            setConfirmModal({ show: false, message: "", action: null });
            const collections = ['campaigns', 'customers', 'invoices', 'marketers', 'payouts', 'point_logs', 'packages', 'marketerRequests', 'walletTransactions'];
            let totalItems = 0;
            collections.forEach(col => { if (backup[col]) totalItems += backup[col].length; });
            setProgressModal({ show: true, title: "جاري دمج البيانات في النظام...", current: 0, total: totalItems, percentage: 0 });
            let processedItems = 0;
            const restoreCol = async (dbColName, items) => {
              if (items && items.length > 0) {
                const writes = items.map(item => {
                  const itemToSave = { ...item };
                  if (!itemToSave.ownerId) { itemToSave.ownerId = currentUser.uid; itemToSave.ownerEmail = currentUser.email; }
                  return setDoc(doc(db, 'artifacts', appId, 'public', 'data', dbColName, item.id), itemToSave, { merge: true });
                });
                await Promise.all(writes);
                processedItems += items.length;
                setProgressModal(p => ({ ...p, current: processedItems, percentage: Math.round((processedItems / totalItems) * 100) }));
              }
            };
            await Promise.all([
              restoreCol('campaigns', backup.campaigns),
              restoreCol('customers', backup.customers),
              restoreCol('invoices', backup.invoices),
              restoreCol('marketers', backup.marketers),
              restoreCol('payouts', backup.payouts),
              restoreCol('point_logs', backup.pointLogs),
              restoreCol('packages', backup.packages),
              restoreCol('marketer_requests', backup.marketerRequests),
              restoreCol('wallet_transactions', backup.walletTransactions),
            ]);
            const wSet = new Set(workspaceHistory);
            if (backup.campaigns) backup.campaigns.forEach(c => { if (c.workspaceId) wSet.add(c.workspaceId); });
            const newHistory = Array.from(wSet);
            setWorkspaceHistory(newHistory);
            localStorage.setItem('ads_workspace_history', JSON.stringify(newHistory));
            setProgressModal({ show: false, title: "", current: 0, total: 0, percentage: 0 });
            addLog("تمت عملية الاستيراد بنجاح");
            setConfirmModal({ show: true, type: "success", message: "تمت الاستعادة بنجاح! تم دمج البيانات في القاعدة المركزية." });
          },
        });
      } catch (err) { setConfirmModal({ show: true, type: "error", message: "عفواً، ملف النسخة الاحتياطية غير صالح أو تالف." }); }
    };
    reader.readAsText(file);
    e.target.value = null;
  }, [currentUser, appId, db, setDoc, setConfirmModal, setProgressModal, workspaceHistory, setWorkspaceHistory, addLog]);

  // --- Cell copy ---
  const [cellCopyFeedback, setCellCopyFeedback] = useState(null);
  function handleCellClick(text, rowId, col) {
    if (!text) return;
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try { document.execCommand('copy'); setCellCopyFeedback(`${rowId}-${col}`); setTimeout(() => setCellCopyFeedback(null), 1000); } catch (err) {}
    document.body.removeChild(textArea);
  }

  // --- Get row style ---
  const getRowStyle = (status, payment, isSelected) => {
    if (isSelected) return 'bg-emerald-100 ring-2 ring-emerald-500 z-10 scale-[1.01] shadow-md';
    if (payment === 'غير مدفوع') {
      if (status === 'مكتمل') return 'bg-red-100/90 hover:bg-red-200 text-red-900 border-red-300 font-bold';
      if (status === 'متوقف') return 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200';
      if (status === 'نشط') return 'bg-orange-50 hover:bg-orange-100 text-orange-900 border-orange-200';
      return 'bg-amber-50/50 hover:bg-amber-50 text-amber-900 border-amber-100';
    } else {
      if (status === 'نشط') return 'bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 border-emerald-100';
      if (status === 'مكتمل') return 'bg-teal-50 hover:bg-teal-100 text-teal-900 border-teal-100 opacity-80';
      if (status === 'متوقف') return 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200';
      return 'bg-blue-50/60 hover:bg-blue-100 text-blue-900 border-blue-100';
    }
  };

  // --- Render ---
  if (!isAuthReady) {
    return <div className="h-screen bg-slate-50 flex items-center justify-center"><Loader2 size={40} className="animate-spin text-emerald-600"/></div>;
  }

  if (!currentUser) {
    return <AuthScreen onGoogleAuthSuccess={setGoogleAccessToken} externalError={globalAuthError} />;
  }

  return (
    <div className="flex flex-col bg-slate-50 text-right font-sans overflow-hidden transition-all duration-500 ease-in-out shadow-2xl relative mx-auto bg-white w-full h-full min-h-[600px]" dir="rtl">
      {/* Global Modals */}
      <ProgressModal isOpen={progressModal.show} title={progressModal.title} current={progressModal.current} total={progressModal.total} percentage={progressModal.percentage} />
      <TopUpModal isOpen={modals.topUp} onClose={() => toggleModal('topUp', false)} customer={selectedCustomer} exchangeRate={globalExchangeRate} onSave={handleSaveTopUp} />
      <PackageModal isOpen={modals.package} onClose={() => toggleModal('package', false)} form={packageForm} setForm={setPackageForm} onSave={handleSavePackage} />
      <CustomerModal isOpen={modals.addCustomer || modals.editCustomer} onClose={() => { toggleModal('addCustomer', false); toggleModal('editCustomer', false); }} form={customerForm} setForm={setCustomerForm} onSave={handleSaveCustomer} marketers={marketers} isEdit={modals.editCustomer} />
      <MarketerModal isOpen={modals.addMarketer || modals.editMarketer} onClose={() => { toggleModal('addMarketer', false); toggleModal('editMarketer', false); }} form={marketerForm} setForm={setMarketerForm} onSave={handleSaveMarketer} isEdit={modals.editMarketer} />
      <PointsModal isOpen={modals.points} onClose={() => toggleModal('points', false)} type={pointsForm.type} setType={(t) => setPointsForm({ ...pointsForm, type: t })} amount={pointsForm.amount} setAmount={(a) => setPointsForm({ ...pointsForm, amount: a })} reason={pointsForm.reason} setReason={(r) => setPointsForm({ ...pointsForm, reason: r })} onSave={handleUpdatePoints} />
      <PayoutModal isOpen={modals.payout} onClose={() => toggleModal('payout', false)} form={payoutForm} setForm={setPayoutForm} onSave={handleAddPayout} />
      <UserManagementModal isOpen={modals.userManagement} onClose={() => toggleModal('userManagement', false)} />
      <MarketerRequestModal isOpen={modals.marketerRequest} onClose={() => toggleModal('marketerRequest', false)} customers={customers} onSubmit={submitMarketerRequest} marketerId={selectedMarketer?.id} />

      {/* Confirm Modal */}
      {confirmModal.show && (
        <ModalWrapper isOpen={true} onClose={() => setConfirmModal({ show: false })} title="إشعار النظام" icon={confirmModal.type === 'success' ? <CheckCircle2 size={24} className="text-emerald-500"/> : <AlertCircle size={24} className="text-indigo-500"/>}>
          <p className="mb-4 text-sm text-slate-600 font-bold leading-relaxed">{safeRender(confirmModal.message)}</p>
          <div className="flex gap-2">
            {confirmModal.action && <button onClick={confirmModal.action} className="flex-1 bg-indigo-600 text-white p-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700">تأكيد</button>}
            <button onClick={() => setConfirmModal({ show: false })} className="flex-1 bg-slate-100 text-slate-600 p-2.5 rounded-xl text-sm font-bold hover:bg-slate-200">إغلاق</button>
          </div>
        </ModalWrapper>
      )}

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Advanced Filters Drawer */}
      <AdvancedFiltersDrawer
        isOpen={modals.advancedFilters}
        onClose={() => toggleModal('advancedFilters', false)}
        filterPage={filterPage} setFilterPage={setFilterPage}
        filterStatus={filterStatus} setFilterStatus={setFilterStatus}
        filterPayment={filterPayment} setFilterPayment={setFilterPayment}
        filterDateStart={filterDateStart} setFilterDateStart={setFilterDateStart}
        filterDateEnd={filterDateEnd} setFilterDateEnd={setFilterDateEnd}
        showArchived={showArchived} setShowArchived={setShowArchived}
        showDeleted={showDeleted} setShowDeleted={setShowDeleted}
        uniquePageNames={uniquePageNames}
        activeFiltersCount={activeFiltersCount}
        clearAllFilters={clearAllFilters}
      />

      <datalist id="pageNamesOptions">{uniquePageNames.map((name, i) => <option key={`p-${i}`} value={String(name)} />)}</datalist>

      <input type="file" ref={restoreInputRef} onChange={handleRestoreAll} accept=".json" className="hidden" />

      <div className="flex h-full overflow-hidden relative">
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} setSelectedCustomer={setSelectedCustomer} isSuperAdmin={isSuperAdmin} toggleModal={toggleModal} />

        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-slate-50 relative">
          <Topbar workspaceId={workspaceId} workspaceHistory={workspaceHistory} handleWorkspaceChange={handleWorkspaceChange} globalExchangeRate={globalExchangeRate} isSuperAdmin={isSuperAdmin} currentView={currentView} />

          {/* VIEW: Settings */}
          {currentView === 'settings' && (
            <SettingsView
              currentUser={currentUser} isSuperAdmin={isSuperAdmin} workspaceId={workspaceId}
              workspaceHistory={workspaceHistory} handleWorkspaceChange={handleWorkspaceChange}
              globalExchangeRate={globalExchangeRate} setGlobalExchangeRate={setGlobalExchangeRate}
              tempWorkspaceId={tempWorkspaceId} setTempWorkspaceId={setTempWorkspaceId}
              setWorkspaceHistory={setWorkspaceHistory} addLog={addLog}
              handleLogout={handleLogout} handleBackupAll={handleBackupAll}
              handleBackupCurrentWorkspace={handleBackupCurrentWorkspace}
              handleDriveBackup={handleDriveBackup} googleAccessToken={googleAccessToken}
              restoreInputRef={restoreInputRef} lastBackupDate={lastBackupDate}
              setConfirmModal={setConfirmModal}
              linkGoogleAccount={linkGoogleAccount}
              refreshGoogleToken={refreshGoogleToken}
              isLinkingGoogle={isLinkingGoogle}
            />
          )}

          {/* VIEW: CRM */}
          {currentView === 'crm' && (
            <CRMView
              customers={customers} customerStats={customerStats}
              setSelectedCustomer={setSelectedCustomer} setCurrentView={setCurrentView}
              setCustomerForm={setCustomerForm} toggleModal={toggleModal}
              requestDelete={requestDelete} isSuperAdmin={isSuperAdmin}
            />
          )}

          {/* VIEW: Customer Detail */}
          {currentView === 'customer-detail' && selectedCustomer && (
            <CustomerDetailView
              selectedCustomer={selectedCustomer} setSelectedCustomer={setSelectedCustomer}
              setCurrentView={setCurrentView} setCustomerForm={setCustomerForm}
              toggleModal={toggleModal} handleAnalyzeCustomer={handleAnalyzeCustomer}
              isAnalyzingCustomer={isAnalyzingCustomer} customerAnalysisResult={customerAnalysisResult}
              setCustomerAnalysisResult={setCustomerAnalysisResult}
              activeCustomerTab={activeCustomerTab} setActiveCustomerTab={setActiveCustomerTab}
              sortedAndFilteredData={sortedAndFilteredData}
              invoiceSelection={invoiceSelection} setInvoiceSelection={setInvoiceSelection}
              handleGenerateInvoice={handleGenerateInvoice} customerStats={customerStats}
              walletTransactions={walletTransactions} invoices={invoices}
              printInvoice={printInvoice} printStatement={printStatement}
              shareInvoiceWhatsApp={shareInvoiceWhatsApp} shareInvoiceEmail={shareInvoiceEmail}
              isSuperAdmin={isSuperAdmin}
              newPageLinkInput={newPageLinkInput} setNewPageLinkInput={setNewPageLinkInput}
              linkPageToCustomer={linkPageToCustomer} removeLinkedPage={removeLinkedPage}
              uniquePageNames={uniquePageNames}
              handleWalletPayment={handleWalletPayment} data={data}
            />
          )}

          {/* VIEW: Ads (Main Table) */}
          {currentView === 'ads' && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Filters Bar */}
              <div className="bg-white border-b border-slate-200 px-4 py-3 flex flex-col lg:flex-row items-stretch lg:items-center shadow-sm z-10 flex-none gap-3">
                {selectedAds.length > 0 ? (
                  <div className="w-full flex items-center justify-between bg-emerald-50 p-2 rounded-lg border border-emerald-200 animate-in slide-in-from-top-2 overflow-x-auto">
                    <div className="flex items-center gap-3 min-w-max px-2">
                      <span className="font-bold text-emerald-800 text-sm">{safeRender(selectedAds.length)} محدد</span>
                      <div className="h-4 w-px bg-emerald-200"></div>
                      <button onClick={handleWalletPayment} className="text-xs md:text-sm font-black bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1"><Coins size={14}/> خصم من المحفظة</button>
                      <button onClick={handleBulkDuplicate} className="text-[10px] md:text-xs font-bold text-indigo-600 hover:bg-indigo-100 px-2 py-1 rounded transition"><Copy size={12}/> نسخ</button>
                      <button onClick={() => handleBulkAction('status', 'نشط')} className="text-[10px] md:text-xs font-bold text-emerald-700 hover:bg-emerald-100 px-2 py-1 rounded transition">تنشيط</button>
                      <button onClick={() => handleBulkAction('status', 'متوقف')} className="text-[10px] md:text-xs font-bold text-red-600 hover:bg-red-100 px-2 py-1 rounded transition">إيقاف</button>
                      <button onClick={() => handleBulkAction('payment', 'مدفوع')} className="text-[10px] md:text-xs font-bold text-blue-600 hover:bg-blue-100 px-2 py-1 rounded transition">تعيين مدفوع</button>
                      <button onClick={() => handleBulkAction('payment', 'غير مدفوع')} className="text-[10px] md:text-xs font-bold text-orange-600 hover:bg-orange-100 px-2 py-1 rounded transition">غير مدفوع</button>
                      <button onClick={() => handleBulkAction('archive', true)} className="text-[10px] md:text-xs font-bold text-amber-600 hover:bg-amber-100 px-2 py-1 rounded transition">أرشفة</button>
                      <button onClick={() => handleBulkAction('delete', true)} className="text-[10px] md:text-xs font-bold text-slate-600 hover:bg-slate-200 px-2 py-1 rounded transition">حذف</button>
                    </div>
                    <button onClick={() => setSelectedAds([])} className="p-1 hover:bg-emerald-200 rounded-full text-emerald-700 shrink-0 mx-1"><X size={14}/></button>
                  </div>
                ) : (
                  <>
                    <div className="relative flex-1 w-full lg:max-w-md">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input type="text" placeholder="بحث شامل..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full pl-3 pr-9 py-1.5 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none text-xs font-bold text-slate-700 bg-slate-50" />
                    </div>
                    <div className="flex gap-2 flex-wrap items-center w-full lg:w-auto">
                      <button onClick={() => toggleModal('advancedFilters', true)} className="flex-1 lg:flex-none relative flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 transition border border-slate-200">
                        <Filter size={14} /> فلاتر {activeFiltersCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] shadow-sm">{activeFiltersCount}</span>}
                      </button>
                      {activeFiltersCount > 0 && <button onClick={clearAllFilters} className="flex-none flex items-center gap-1 px-2 py-1.5 rounded-lg font-bold text-xs bg-red-50 text-red-600 hover:bg-red-100 transition border border-red-100 animate-in fade-in"><X size={14}/></button>}
                    </div>
                    <div className="flex justify-end gap-2 w-full lg:w-auto">
                      <button onClick={exportToExcel} className="flex-none bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-bold shadow-sm hover:bg-blue-100 text-xs flex items-center gap-1"><Download size={14} /></button>
                      <button onClick={() => setShowSmartInput(!showSmartInput)} className="flex-1 lg:flex-none flex justify-center items-center gap-1 px-3 py-1.5 rounded-lg font-bold bg-emerald-500 text-white hover:bg-emerald-400 shadow-sm text-xs"><Zap size={14} /> ✨ ذكي</button>
                      <button onClick={() => toggleModal('ai', true)} className="flex-1 lg:flex-none flex justify-center items-center gap-1 px-3 py-1.5 rounded-lg font-bold bg-indigo-500 text-white hover:bg-indigo-400 shadow-sm text-xs"><Bot size={14} /> مساعد</button>
                      <button onClick={() => addRow()} className="flex-none bg-emerald-800 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm hover:bg-emerald-900 text-xs flex items-center gap-1"><Plus size={14} /> إضافة</button>
                    </div>
                  </>
                )}
              </div>

              {/* Smart Input Drawer */}
              {showSmartInput && (
                <div className="bg-white border-b border-slate-200 p-4 animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-bold text-slate-700 text-sm">📋 إدراج ذكي</span>
                    <button onClick={() => setShowSmartInput(false)} className="mr-auto text-slate-400 hover:text-red-500"><X size={16}/></button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <textarea value={rawInput} onChange={(e) => setRawInput(e.target.value)} onPaste={handlePaste} className="w-full p-3 rounded-xl border border-slate-200 outline-none text-sm font-bold text-slate-700 h-20 resize-none" placeholder="الصق البيانات أو استخدم صورة شاشة..." />
                    <div className="flex gap-2 items-center">
                      <input type="file" ref={imageUploadRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                      <button onClick={() => imageUploadRef.current?.click()} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 flex items-center gap-1"><ImageIcon size={14}/> صورة</button>
                      {selectedImage && <span className="text-xs text-emerald-600 font-bold">✅ تم تحديد صورة</span>}
                       <button onClick={handleSmartAnalysis} disabled={isAiLoading} className="px-6 py-2 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 flex items-center gap-1">
                         {isAiLoading ? <Loader2 size={14} className="animate-spin"/> : <Zap size={14}/>} تحليل ذكي
                      </button>
                      {selectedImage && <button onClick={() => setSelectedImage(null)} className="px-2 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100"><Trash2 size={14}/></button>}
                    </div>
                  </div>
                </div>
              )}

              {/* Smart Input Drawer (AI) */}
              {modals.ai && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] flex justify-end" onClick={() => toggleModal('ai', false)}>
                  <div className="relative w-96 max-w-full bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300" onClick={e => e.stopPropagation()}>
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
                      <h3 className="font-black text-slate-800 flex items-center gap-2"><Bot size={18} className="text-indigo-600"/> المساعد الذكي</h3>
                      <div className="flex items-center gap-1">
                        {conversationHistory.length > 0 && <button onClick={() => setConversationHistory([])} className="p-1.5 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition" title="محادثة جديدة"><Trash2 size={15}/></button>}
                        <button onClick={() => setShowAiSettings(!showAiSettings)} className={`p-1.5 rounded-lg transition-all ${showAiSettings ? 'bg-indigo-200 text-indigo-700' : 'hover:bg-slate-200 text-slate-500'}`} title="إعدادات الوكيل"><Cog size={16}/></button>
                        <button onClick={() => toggleModal('ai', false)} className="p-1 hover:bg-slate-200 rounded text-slate-500"><X size={18}/></button>
                      </div>
                    </div>
                    {showAiSettings && (
                      <div className="bg-amber-50 border-b border-amber-200 p-4">
                        <h4 className="text-xs font-bold text-amber-700 flex items-center gap-1 mb-2"><Cog size={14}/> تعليمات الوكيل</h4>
                        <textarea value={aiSystemInstruction} onChange={e => { setAiSystemInstruction(e.target.value); localStorage.setItem('aiSystemInstruction', e.target.value); }} className="w-full p-2.5 rounded-lg border border-amber-200 outline-none text-xs font-bold text-slate-700 h-16 resize-none bg-white" placeholder="تعليمات الوكيل..." />
                      </div>
                    )}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {conversationHistory.length === 0 && !isAiLoading && (
                        <div className="text-center text-slate-400 text-sm py-10">
                          <Bot size={32} className="mx-auto mb-2 text-indigo-300" />
                          <p>اسأل الذكاء الاصطناعي</p>
                        </div>
                      )}
                      {conversationHistory.map((msg, i) => (
                        <div key={i} className={`p-3 rounded-xl whitespace-pre-wrap text-sm leading-relaxed ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-900 mr-6' : 'bg-slate-100 text-slate-700 ml-6'}`}>
                          {msg.parts[0].text}
                        </div>
                      ))}
                      {isAiLoading && (
                        <div className="bg-slate-100 p-3 rounded-xl ml-6 text-sm text-slate-400 animate-pulse flex items-center gap-2">
                          <Loader2 size={14} className="animate-spin" /> جارٍ الكتابة...
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    <div className="border-t border-slate-100 p-4 space-y-2">
                      <textarea value={aiChatPrompt} onChange={e => setAiChatPrompt(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAskAi(); } }} className="w-full p-3 rounded-xl border border-slate-200 outline-none text-sm font-bold text-slate-700 h-20 resize-none" placeholder="اسأل الذكاء الاصطناعي..." />
                      <div className="flex gap-2">
                        <button onClick={() => handleAskAi()} disabled={isAiLoading || !aiChatPrompt.trim()} className="flex-1 bg-indigo-600 text-white py-2 rounded-xl font-bold hover:bg-indigo-700 shadow-md text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                          {isAiLoading ? <Loader2 size={16} className="animate-spin"/> : <SendHorizontal size={16}/>} إرسال
                        </button>
                      </div>
                      <div className="pt-2">
                        <h4 className="text-[10px] font-bold text-slate-400 mb-2">إجراءات سريعة:</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {data.slice(0, 5).map((row, i) => (
                            <button key={i} onClick={() => handleGenerateAdCopy(row)} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-bold hover:bg-indigo-100 transition">
                              ✨ {safeRender(row["اسم الصفحة"] || `حملة ${i+1}`)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Table */}
              <div ref={tableContainerRef} className="flex-1 overflow-auto bg-slate-50 relative">
                {isLoading && <div className="absolute inset-0 bg-white/60 z-50 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600"/></div>}
                <div className="pb-8 min-w-max">
                  <table className="w-full border-collapse text-right" dir="rtl">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 shadow-sm">
                        <th className="p-2 w-10 text-center text-[10px] font-bold bg-slate-100">
                          <input type="checkbox" checked={selectedAds.length === sortedAndFilteredData.length && sortedAndFilteredData.length > 0} onChange={toggleSelectAll} className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                        </th>
                        <th className="p-2 w-10 text-center text-[10px] font-bold bg-slate-100">#</th>
                        {dynamicHeaders.map((h, i) => (
                          <th key={`th-${i}`} className={`p-2 text-[10px] font-black border-l border-slate-200 whitespace-nowrap cursor-pointer hover:bg-slate-200 bg-slate-100 ${h === "القيمة" || h === "القيمة (د.ل)" ? 'w-[60px] md:w-[70px]' : ''}`} onClick={() => setSortConfig({ key: h, direction: sortConfig.direction === 'ascending' ? 'descending' : 'ascending' })}>
                            <div className="flex items-center gap-1 justify-between">{safeRender(h)}{sortConfig.key === h ? (sortConfig.direction === 'ascending' ? <ArrowUp size={10} className="text-emerald-500" /> : <ArrowDown size={10} className="text-emerald-500" />) : (<ArrowUpDown size={10} className="text-slate-300" />)}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {sortedAndFilteredData.slice(0, displayLimit).map((row, index) => (
                        <tr key={String(row.id)} className={`border-b transition-all duration-200 group text-xs ${getRowStyle(row["الحالة"], row["الدفع"], selectedAds.includes(row.id))}`}>
                          <td className="p-2 text-center"><input type="checkbox" checked={selectedAds.includes(row.id)} onChange={() => toggleSelectRow(row.id)} className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4" /></td>
                          <td className="p-2 text-center font-mono text-[10px] opacity-60 font-bold">{index + 1}</td>
                          {dynamicHeaders.map((h, i) => {
                            const isNarrow = h === "القيمة" || h === "القيمة (د.ل)";
                            return (
                            <td key={`td-${row.id}-${i}`} className={`p-0 border-l border-black/5 relative ${isNarrow ? 'min-w-[60px] md:min-w-[70px]' : 'min-w-[100px] md:min-w-[120px]'}`}>
                              {h === "المستخدم" ? (
                                <div className="p-2 text-center font-mono text-[10px] font-bold text-slate-500 bg-black/5 h-full flex items-center justify-center truncate max-w-[100px]" title={row.ownerEmail}>{safeRender(row.ownerEmail?.split('@')[0] || 'غير معروف')}</div>
                              ) : h === "المدة" ? (
                                <div className="relative flex flex-col justify-center px-2 py-1">
                                  <input type="text" value={safeRender(row[h])} onChange={(e) => updateCell(index, h, e.target.value)} className="w-full bg-transparent outline-none font-bold text-center text-xs inherit-color" />
                                  <div className="w-full bg-black/10 rounded-full h-1 mt-0.5 overflow-hidden"><div className="bg-current h-full rounded-full transition-all duration-500 opacity-50" style={{ width: `${Math.min(100, calculateProgress(row["التاريخ"], row[h], row["الحالة"]))}%` }}></div></div>
                                </div>
                              ) : h === "التاريخ" ? (
                                <input type="date" value={safeRender(row[h])} onChange={(e) => updateCell(index, h, e.target.value)} className="w-full p-2.5 bg-transparent outline-none font-bold text-center cursor-pointer text-xs inherit-color" />
                              ) : h === "الحالة" ? (
                                <select value={safeRender(row[h]) || "قيد المراجعة"} onChange={(e) => updateCell(index, h, e.target.value)} className="w-full p-2.5 bg-transparent outline-none font-black text-center cursor-pointer appearance-none inherit-color">
                                  {Object.keys(STATUS_OPTIONS).map(opt => <option key={opt} value={opt} className="text-slate-800">{opt}</option>)}
                                </select>
                              ) : h === "الدفع" ? (
                                <div className="flex items-center gap-1 px-2">
                                  <select value={safeRender(row[h]) || "غير مدفوع"} onChange={(e) => handlePaymentChange(index, e.target.value)} className="flex-1 bg-transparent outline-none font-black text-center cursor-pointer appearance-none inherit-color text-xs">
                                    <option value="غير مدفوع" className="text-slate-800">غير مدفوع</option>
                                    <option value="مدفوع" className="text-slate-800">مدفوع</option>
                                  </select>
                                  {row[h] === 'مدفوع' && row.paymentMethod && (
                                    <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${PAYMENT_METHODS[row.paymentMethod]?.bg || 'bg-slate-100'} ${PAYMENT_METHODS[row.paymentMethod]?.color || 'text-slate-500'} shrink-0`}>
                                      {PAYMENT_METHODS[row.paymentMethod]?.label || row.paymentMethod}
                                    </span>
                                  )}
                                  {row[h] === 'مدفوع' && row.walletTxId && isSuperAdmin && (
                                    <button onClick={() => handleRefundPayment(row.id)} className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded" title="إلغاء الدفع وإعادة الرصيد"><Undo2 size={11}/></button>
                                  )}
                                </div>
                              ) : h === "الجنس" ? (
                                <select value={safeRender(row[h]) || "جنسين"} onChange={(e) => updateCell(index, h, e.target.value)} className="w-full p-2.5 bg-transparent outline-none font-bold text-center cursor-pointer appearance-none inherit-color">
                                  {SEX_OPTIONS.map(opt => <option key={opt} value={opt} className="text-slate-800">{opt}</option>)}
                                </select>
                              ) : h === "كود الباقة" ? (
                                <select value={safeRender(row[h]) || ""} onChange={(e) => updateCell(index, h, e.target.value)} className="w-full p-2.5 bg-transparent outline-none font-bold text-center cursor-pointer inherit-color">
                                  <option value="" className="text-slate-400">- مخصص -</option>
                                  {packages.map(pkg => <option key={String(pkg.id)} value={pkg.code} className="text-slate-800">{PACKAGE_CATEGORIES[pkg.category]?.icon || ''} {pkg.code} ({pkg.priceUSD}$)</option>)}
                                </select>
                              ) : h === "المعرف" ? (
                                <div className="p-2.5 text-center font-mono text-[10px] font-black opacity-70 select-all" title="معرف الحملة (تلقائي)">{safeRender(row.campaignRef)}</div>
                              ) : h === "الرابط" ? (
                                <div className="relative group/link">
                                  <input type="text" value={safeRender(row[h])} onChange={(e) => updateCell(index, h, e.target.value)} className="w-full p-2.5 pl-8 bg-transparent outline-none font-medium text-xs inherit-color placeholder-black/30" placeholder="الصق الرابط..." dir="ltr" />
                                  {row[h] && <a href={safeRender(row[h])} target="_blank" rel="noopener noreferrer" className="absolute left-1 top-1/2 -translate-y-1/2 p-1.5 opacity-50 hover:opacity-100 hover:text-blue-600 transition-all"><ExternalLink size={12} /></a>}
                                </div>
                              ) : (
                                <input type="text" value={safeRender(row[h])} onChange={(e) => updateCell(index, h, e.target.value)} className="w-full p-2.5 bg-transparent outline-none font-semibold text-xs inherit-color placeholder-black/20" placeholder="-" list={h === "اسم الصفحة" ? "pageNamesOptions" : h === "المكان" ? "locationsOptions" : h === "الاهتمامات" ? "interestsOptions" : undefined} />
                              )}
                            </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: Analytics */}
          {currentView === 'analytics' && (
            <AnalyticsView
              data={data} customers={customers} customerStats={customerStats}
              packages={packages} marketerStats={marketerStats} marketers={marketers}
            />
          )}

          {/* VIEW: Marketers */}
          {currentView === 'marketers' && (
            <MarketersView
              marketers={marketers} marketerStats={marketerStats}
              setSelectedMarketer={setSelectedMarketer} setCurrentView={setCurrentView}
              setMarketerForm={setMarketerForm} toggleModal={toggleModal}
              requestDelete={requestDelete}
            />
          )}

          {/* VIEW: Marketer Detail */}
          {currentView === 'marketer-detail' && selectedMarketer && (
            <MarketerDetailView
              selectedMarketer={selectedMarketer} setSelectedMarketer={setSelectedMarketer}
              setCurrentView={setCurrentView} setMarketerForm={setMarketerForm}
              toggleModal={toggleModal} marketerStats={marketerStats}
              customers={customers} data={data} payouts={payouts}
              setPayoutForm={setPayoutForm} customerStats={customerStats}
              isSuperAdmin={isSuperAdmin}
              handleLinkCustomerToMarketer={handleLinkCustomerToMarketer}
              handleUnlinkCustomer={handleUnlinkCustomer}
              marketerRequests={marketerRequests}
              processMarketerRequest={processMarketerRequest}
            />
          )}

          {/* VIEW: Packages */}
          {currentView === 'packages' && (
            <PackagesView
              packages={packages}
              setPackageForm={setPackageForm} toggleModal={toggleModal}
              requestDelete={requestDelete} handleSeedPackages={handleSeedPackages} handleDeleteAllPackages={handleDeleteAllPackages}
              isSuperAdmin={isSuperAdmin} handlePackageUpdate={handlePackageUpdate}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
