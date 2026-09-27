// @ts-nocheck
import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { generateId, parseCurrency } from '../utils';
import { DEFAULT_WORKSPACE, DEFAULT_PACKAGES } from '../constants';

const useData = ({ currentUser, isSuperAdmin, workspaceId }) => {
  const [data, setData] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [marketers, setMarketers] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [packages, setPackages] = useState([]);
  const [marketerRequests, setMarketerRequests] = useState([]);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [systemLogs, setSystemLogs] = useState([]);

  const addLog = (msg, type = "success") => setSystemLogs(prev => [{ id: generateId(), time: new Date().toLocaleTimeString(), msg, type }, ...prev].slice(0, 20));

  useEffect(() => {
    if (!currentUser) return;
    setIsLoading(true);
    addLog(`جاري قراءة البيانات لمساحة العمل: ${workspaceId}`);

    const getQuery = (colName) => query(collection(db, 'artifacts', appId, 'public', 'data', colName));

    const filterAndSort = (docs) => {
      let fetched = docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(item => {
        const hasPermission = isSuperAdmin || item.ownerId === currentUser.uid;
        if (!hasPermission) return false;
        return item.workspaceId === workspaceId || (!item.workspaceId && workspaceId === DEFAULT_WORKSPACE);
      });
      return fetched;
    };

    const unsubscribers = [];
    unsubscribers.push(onSnapshot(getQuery('campaigns'), (snapshot) => {
      let fetched = filterAndSort(snapshot.docs);
      fetched.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setData(fetched); setIsLoading(false);
    }, (err) => { console.error(err); setIsLoading(false); }));

    unsubscribers.push(onSnapshot(getQuery('customers'), (snapshot) => {
      setCustomers(filterAndSort(snapshot.docs).map(c => ({ linkedPages: [], email: "", marketerId: "", points: 0, walletBalanceUSD: 0, ...c })));
    }, (err) => console.error(err)));

    unsubscribers.push(onSnapshot(getQuery('invoices'), (snapshot) => {
      setInvoices(filterAndSort(snapshot.docs).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    }, (err) => console.error(err)));

    unsubscribers.push(onSnapshot(getQuery('marketers'), (snapshot) => {
      setMarketers(filterAndSort(snapshot.docs));
    }, (err) => console.error(err)));

    unsubscribers.push(onSnapshot(getQuery('payouts'), (snapshot) => {
      setPayouts(filterAndSort(snapshot.docs).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    }, (err) => console.error(err)));

    unsubscribers.push(onSnapshot(getQuery('packages'), (snapshot) => {
      setPackages(filterAndSort(snapshot.docs).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    }, (err) => console.error(err)));

    unsubscribers.push(onSnapshot(getQuery('marketer_requests'), (snapshot) => {
      let reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(item => isSuperAdmin || item.ownerId === currentUser.uid);
      setMarketerRequests(reqs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    }, (err) => console.error(err)));

    unsubscribers.push(onSnapshot(getQuery('wallet_transactions'), (snapshot) => {
      setWalletTransactions(filterAndSort(snapshot.docs).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    }, (err) => console.error(err)));

    return () => unsubscribers.forEach(unsub => unsub());
  }, [currentUser, workspaceId, isSuperAdmin]);

  useEffect(() => {
    if (!data.length || !currentUser) return;
    async function checkCampaigns() {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      data.forEach(async (row) => {
        if (!isSuperAdmin && row.ownerId !== currentUser.uid) return;
        if (row.isArchived || row.isDeleted) return;
        const startDate = row['التاريخ'] ? new Date(row['التاريخ']) : null;
        const durationDays = row['المدة'] ? (parseInt(String(row['المدة']).replace(/\D/g, '')) || 0) : 0;
        if (startDate && !isNaN(startDate.getTime()) && durationDays > 0) {
          const endDate = new Date(startDate); endDate.setDate(startDate.getDate() + durationDays);
          if (row['الحالة'] === 'نشط' && today > endDate) {
            try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'campaigns', row.id), { ...row, "الحالة": "مكتمل", updatedAt: serverTimestamp() }, { merge: true }); } catch (e) {}
          }
        }
      });
    }
    checkCampaigns();
  }, [data, workspaceId, currentUser, isSuperAdmin]);

  const customerStats = useMemo(() => {
    const stats = {};
    customers.forEach(c => {
      const linked = c.linkedPages || [];
      const custCampaigns = data.filter(r => linked.includes(r["اسم الصفحة"]) && !r.isDeleted);
      const totalSpend = custCampaigns.reduce((sum, r) => sum + parseCurrency(r["القيمة"]), 0);
      const totalPaid = custCampaigns.filter(r => r["الدفع"] === "مدفوع").reduce((sum, r) => sum + parseCurrency(r["القيمة"]), 0);
      stats[c.id] = { totalSpend, due: totalSpend - totalPaid, count: custCampaigns.length };
    });
    return stats;
  }, [customers, data]);

  const marketerStats = useMemo(() => {
    const stats = {};
    marketers.forEach(m => {
      const myCustomers = customers.filter(c => c.marketerId === m.id);
      const myPageNames = myCustomers.flatMap(c => c.linkedPages || []);
      const myCampaigns = data.filter(r => myPageNames.includes(r["اسم الصفحة"]) && !r.isDeleted);
      const totalRevenue = myCampaigns.reduce((sum, r) => sum + parseCurrency(r["القيمة"]), 0);
      const totalCommission = totalRevenue * ((parseFloat(m.rate) || 0) / 100);
      const paid = payouts.filter(p => p.marketerId === m.id).reduce((sum, p) => sum + p.amount, 0);
      stats[m.id] = { customerCount: myCustomers.length, campaignCount: myCampaigns.length, totalRevenue, totalCommission, paid, balance: totalCommission - paid };
    });
    return stats;
  }, [marketers, customers, data, payouts]);

  const saveCampaign = async (row) => {
    if (!currentUser || !row.id) return;
    try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'campaigns', row.id), { ...row, workspaceId, updatedAt: serverTimestamp() }, { merge: true }); }
    catch (err) { addLog("فشل الحفظ", "error"); }
  };

  const addCampaign = (newRow) => {
    setData(prev => [newRow, ...prev]);
    saveCampaign(newRow);
    addLog("تم إضافة صف جديد");
  };

  const deleteDocByType = async (type, id) => {
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', type, id)); } catch (e) {}
  };

  const updateDoc = async (type, id, payload) => {
    try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', type, id), payload, { merge: true }); } catch (e) {}
  };

  const getDocRef = (type, id) => doc(db, 'artifacts', appId, 'public', 'data', type, id);

  const handleSeedPackages = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      for (const pkg of DEFAULT_PACKAGES) {
        const newId = generateId();
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'packages', newId), {
          id: newId, code: pkg.code, days: pkg.days, priceUSD: pkg.priceUSD, priceLYD: pkg.priceLYD,
          category: pkg.category, categoryLabel: pkg.categoryLabel,
          workspaceId, ownerId: currentUser.uid, ownerEmail: currentUser.email, createdAt: serverTimestamp()
        });
      }
      addLog(`تم استيراد ${DEFAULT_PACKAGES.length} باقة`);
    } catch (e) { addLog("خطأ أثناء استيراد الباقات", "error"); }
    setIsLoading(false);
  };

  return {
    data, setData,
    customers, setCustomers,
    invoices, setInvoices,
    marketers, setMarketers,
    payouts, setPayouts,
    packages, setPackages,
    marketerRequests, setMarketerRequests,
    walletTransactions, setWalletTransactions,
    isLoading, setIsLoading,
    systemLogs, setSystemLogs,
    addLog,
    customerStats,
    marketerStats,
    saveCampaign,
    addCampaign,
    deleteDocByType,
    updateDoc,
    getDocRef,
    handleSeedPackages,
  };
};

export default useData;
