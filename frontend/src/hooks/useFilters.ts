// @ts-nocheck
import { useState, useMemo } from 'react';
import { parseCurrency } from '../utils';
import { STATUS_OPTIONS } from '../constants';

const useFilters = ({ data, currentView, selectedCustomer }) => {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPayment, setFilterPayment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPage, setFilterPage] = useState("all");
  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [displayLimit, setDisplayLimit] = useState(100);

  const uniquePageNames = useMemo(() => [...new Set(data.map(item => item["اسم الصفحة"]).filter(Boolean))], [data]);

  const activeFiltersCount = (filterStatus !== 'all' ? 1 : 0) + (filterPayment !== 'all' ? 1 : 0) + (filterPage !== 'all' ? 1 : 0) + (filterDateStart ? 1 : 0) + (filterDateEnd ? 1 : 0) + (showArchived ? 1 : 0) + (showDeleted ? 1 : 0);

  const sortedAndFilteredData = useMemo(() => {
    let processData = [...data];
    processData = processData.filter(row => {
      if (showDeleted) { if (!row.isDeleted) return false; }
      else { if (row.isDeleted) return false; if (showArchived ? !row.isArchived : row.isArchived) return false; }
      if (currentView === 'customer-detail' && selectedCustomer) { if (!selectedCustomer.linkedPages?.includes(row["اسم الصفحة"])) return false; }
      const matchesSearch = Object.values(row).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesPayment = filterPayment === 'all' ? true : filterPayment === 'paid' ? row['الدفع'] === 'مدفوع' : row['الدفع'] === 'غير مدفوع';
      const matchesStatus = filterStatus === 'all' ? true : row['الحالة'] === filterStatus;
      const matchesPage = filterPage === 'all' ? true : row['اسم الصفحة'] === filterPage;
      let matchesDate = true;
      if (row['التاريخ'] && (filterDateStart || filterDateEnd)) {
        const rDate = new Date(row['التاريخ']);
        if (filterDateStart && rDate < new Date(filterDateStart)) matchesDate = false;
        if (filterDateEnd && rDate > new Date(filterDateEnd)) matchesDate = false;
      }
      return matchesSearch && matchesPayment && matchesStatus && matchesPage && matchesDate;
    });

    if (sortConfig.key) {
      processData.sort((a, b) => {
        let valA = a[sortConfig.key] || "", valB = b[sortConfig.key] || "";
        if (['القيمة', 'المدة', 'القيمة (د.ل)'].includes(sortConfig.key)) { valA = parseCurrency(valA); valB = parseCurrency(valB); }
        return (valA < valB ? -1 : 1) * (sortConfig.direction === 'ascending' ? 1 : -1);
      });
    }
    return processData;
  }, [data, searchTerm, filterPayment, filterStatus, filterPage, sortConfig, showArchived, showDeleted, currentView, selectedCustomer, filterDateStart, filterDateEnd]);

  const clearAllFilters = () => {
    setSearchInput(""); setSearchTerm(""); setFilterStatus("all"); setFilterPayment("all");
    setFilterPage("all"); setFilterDateStart(""); setFilterDateEnd(""); setShowArchived(false); setShowDeleted(false);
  };

  return {
    searchInput, setSearchInput,
    searchTerm, setSearchTerm,
    filterPayment, setFilterPayment,
    filterStatus, setFilterStatus,
    filterPage, setFilterPage,
    filterDateStart, setFilterDateStart,
    filterDateEnd, setFilterDateEnd,
    showArchived, setShowArchived,
    showDeleted, setShowDeleted,
    sortConfig, setSortConfig,
    displayLimit, setDisplayLimit,
    uniquePageNames,
    activeFiltersCount,
    sortedAndFilteredData,
    clearAllFilters,
  };
};

export default useFilters;
