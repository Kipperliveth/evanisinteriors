import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { Search, Folder, Tag, X, ChevronDown, ArrowDown, ArrowUp, User, CheckCircle2 } from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { collection, getDocs, updateDoc, doc, orderBy, query, writeBatch, increment } from "firebase/firestore"; 
import { txtdb } from '../../../firebase-config';

const CATEGORIES = ['Client Payment', 'Materials', 'Labor', 'Worker Allocation', 'Software', 'Office/Overhead', 'Logistics/Shipping', 'Other'];

const TIME_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 'this_year', label: 'This Year' },
  { type: 'divider' },
  { value: '0', label: 'Jan' },
  { value: '1', label: 'Feb' },
  { value: '2', label: 'Mar' },
  { value: '3', label: 'Apr' },
  { value: '4', label: 'May' },
  { value: '5', label: 'Jun' },
  { value: '6', label: 'Jul' },
  { value: '7', label: 'Aug' },
  { value: '8', label: 'Sep' },
  { value: '9', label: 'Oct' },
  { value: '10', label: 'Nov' },
  { value: '11', label: 'Dec' }
];

function Transactions() {
  const location = useLocation();

  const [transactions, setTransactions] = useState([]);
  const [projectsList, setProjectsList] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState(new Date().getMonth().toString()); 
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');

  const [selectedTransaction, setSelectedTransaction] = useState(null); 
  const [isUpdatingTag, setIsUpdatingTag] = useState(false);
  
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const monthDropdownRef = useRef(null);

  // --- 1. READ TRANSACTIONS & PROJECTS FROM FIREBASE ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const qTx = query(collection(txtdb, "transactions"), orderBy("createdAt", "desc"));
        const txSnapshot = await getDocs(qTx);
        const txData = txSnapshot.docs.map(document => ({ id: document.id, ...document.data() }));
        setTransactions(txData);

        const qProj = query(collection(txtdb, "projects"), orderBy("name", "asc"));
        const projSnapshot = await getDocs(qProj);
        const projData = projSnapshot.docs.map(document => ({ id: document.id, name: document.data().name }));
        setProjectsList(projData);

      } catch (error) {
        console.error("Error fetching data: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- 2. HANDLE INCOMING URL FILTERS ---
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const incomingProjectName = params.get('project');

    if (incomingProjectName && projectsList.length > 0) {
      const matchedProject = projectsList.find(p => p.name === incomingProjectName);
      if (matchedProject) {
        setProjectFilter(matchedProject.id);
      }
    }
  }, [location.search, projectsList]); 

  // --- 3. UI EVENT LISTENERS ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target)) {
        setIsMonthDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedTransaction) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => document.body.style.overflow = 'unset';
  }, [selectedTransaction]);

  // --- 4. SAFE FILTERING & MATH ---
  const filteredTransactions = transactions.filter(t => {
    const searchLower = searchQuery.toLowerCase();
    
    // SAFEFALLBACK: || '' prevents crashes if description/project/vendorName is missing in old data
    const matchesSearch = (t.description || '').toLowerCase().includes(searchLower) || 
                          (t.project || '').toLowerCase().includes(searchLower) ||
                          (t.vendorName || '').toLowerCase().includes(searchLower);
                          
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    const matchesProject = projectFilter === 'all' || t.projectId === projectFilter;

    let matchesTime = true;
    
    // SAFEFALLBACK: Handle old transactions that might be missing a date string
    const tDate = t.date ? new Date(t.date) : new Date(); 
    const now = new Date();
    
    if (timeFilter === 'this_year') {
      matchesTime = tDate.getFullYear() === now.getFullYear();
    } else if (timeFilter !== 'all') {
      matchesTime = tDate.getMonth() === parseInt(timeFilter, 10) && tDate.getFullYear() === now.getFullYear();
    }

    return matchesSearch && matchesCategory && matchesProject && matchesTime;
  });

  // SAFEFALLBACK: Ensure valid dates for sorting
  filteredTransactions.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const netCashFlow = totalIncome - totalExpenses;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getMonthLabel = (val) => {
    const opt = TIME_OPTIONS.find(o => o.value === val);
    return opt ? opt.label : 'Current Month';
  };

  // Values used by the "pass-through" tag section of the details modal
  const canTagPassThrough = !!selectedTransaction && !!selectedTransaction.projectId && selectedTransaction.projectId !== 'internal';
  const isSelectedIncome = !!selectedTransaction && selectedTransaction.type === 'income';
  const isPassThroughFlagged = !!selectedTransaction && (isSelectedIncome ? !!selectedTransaction.isReimbursement : !!selectedTransaction.isReimbursable);


  // --- 5. TAG / UN-TAG AN EXISTING PROJECT TRANSACTION AS PASS-THROUGH ---
  const handleTogglePassThrough = async (tx) => {
    if (!tx || !tx.projectId || tx.projectId === 'internal') return;

    const isIncomeTx = tx.type === 'income';
    const flagKey = isIncomeTx ? 'isReimbursement' : 'isReimbursable';
    const nowFlagged = !tx[flagKey];
    const amt = Number(tx.amount) || 0;
    
    const delta = nowFlagged ? amt : -amt; 

    const projectPayload = isIncomeTx
      ? { amountPaid: increment(-delta) }
      : { expenses: increment(-delta) };

    setIsUpdatingTag(true);
    try {
      const batch = writeBatch(txtdb);
      batch.update(doc(txtdb, "projects", tx.projectId), projectPayload);
      batch.update(doc(txtdb, "transactions", tx.id), { [flagKey]: nowFlagged });
      await batch.commit();

      const updatedTx = { ...tx, [flagKey]: nowFlagged };
      setTransactions(prev => prev.map(t => (t.id === tx.id ? updatedTx : t)));
      setSelectedTransaction(updatedTx);
    } catch (error) {
      console.error("Error updating transaction tag: ", error);
      alert("Failed to update this transaction. Please try again.");
    } finally {
      setIsUpdatingTag(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Navigation />
      
      <main className="page-content">
        
        <div className="page-top-section transactions-top">
          <div className="header-titles" style={{ gridColumn: '1 / -1' }}>
            <h1>Transactions Ledger</h1>
            <p>Master record of all incoming deposits and outgoing expenses.</p>
          </div>
        </div>

        <div className="banking-header">
          <div className="header-left">
            <div className="month-selector-wrapper" ref={monthDropdownRef}>
              <button 
                className="custom-dropdown-trigger" 
                onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
              >
                <span>{getMonthLabel(timeFilter)}</span>
                <ChevronDown size={20} className="dropdown-arrow" />
              </button>

              {isMonthDropdownOpen && (
                <div className="custom-dropdown-menu">
                  {TIME_OPTIONS.map((opt, idx) => (
                    opt.type === 'divider' ? (
                      <div key={`div-${idx}`} className="dropdown-divider" />
                    ) : (
                      <button 
                        key={opt.value} 
                        className={`dropdown-item ${timeFilter === opt.value ? 'active' : ''}`}
                        onClick={() => {
                          setTimeFilter(opt.value);
                          setIsMonthDropdownOpen(false);
                        }}
                      >
                        {opt.label}
                      </button>
                    )
                  ))}
                </div>
              )}
            </div>

            <div className="in-out-totals">
              <span>In <strong className="text-main">{formatCurrency(totalIncome)}</strong></span>
              <span>Out <strong className="text-main">{formatCurrency(totalExpenses)}</strong></span>
            </div>
          </div>

          <div className="header-right">
            <span className="balance-lbl">Net Balance</span>
            <span className={`balance-val ${netCashFlow < 0 ? 'text-danger' : 'text-main'}`}>
              {netCashFlow === 0 ? formatCurrency(0) : (netCashFlow < 0 ? '-' : '+') + formatCurrency(Math.abs(netCashFlow))}
            </span>
          </div>
        </div>

        <div className="compact-filters">
          <div className="filter-item search-item">
            <Search size={16} className="sel-icon" />
            <input type="text" placeholder="Search descriptions or workers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          <div className="filter-item proj-item">
            <Folder size={14} className="sel-icon" />
            <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
              <option value="all">All Projects & Internal</option>
              <option value="internal">Internal / Overhead</option>
              {projectsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="filter-item cat-item">
            <Tag size={14} className="sel-icon" />
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="transaction-list">
          {isLoading ? (
            <div className="empty-state">Loading transactions from database...</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="empty-state">No transactions match your filters.</div>
          ) : (
            filteredTransactions.map(tx => (
              <div 
                key={tx.id} 
                className="transaction-row"
                onClick={() => setSelectedTransaction(tx)}
              >
                <div className="tx-left">
                  <div className={`tx-icon ${tx.type}`}>
                    {tx.type === 'income' ? <ArrowDown size={18} strokeWidth={2.5} /> : <ArrowUp size={18} strokeWidth={2.5} />}
                  </div>
                  <div className="tx-details">
                    <span className="tx-title">{tx.description || 'Unnamed Transaction'}</span>
                    <span className="tx-subtitle">
                      {tx.project || 'Unknown Project'} &bull; {tx.category || 'Uncategorized'}
                      {tx.vendorName && ` • Paid to: ${tx.vendorName}`}
                      {tx.isReimbursable && ' • Reimbursable'}
                      {tx.isReimbursement && ' • Reimbursement'}
                    </span>
                  </div>
                </div>

                <div className="tx-right">
                  <span className={`tx-amount ${tx.type === 'income' ? 'text-success' : 'text-main'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                  <span className="tx-date">{formatDate(tx.date)}</span>
                </div>
              </div>
            ))
          )}
        </div>

      </main>

      {/* TRANSACTION DETAILS MODAL */}
      {selectedTransaction && (
        <div className="modal-overlay" onClick={() => setSelectedTransaction(null)}>
          <div className="modal-container receipt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Transaction Details</h2>
              <button className="close-btn" onClick={() => setSelectedTransaction(null)}><X size={20} /></button>
            </div>
            
            <div className="receipt-content">
              <div className="receipt-amount-large">
                <span className={`val ${selectedTransaction.type === 'income' ? 'text-success' : 'text-main'}`}>
                  {selectedTransaction.type === 'income' ? '+' : '-'}{formatCurrency(selectedTransaction.amount)}
                </span>
                <span className="status">Successful</span>
              </div>

              <div className="receipt-grid">
                
                {selectedTransaction.isRepayment && (
                  <div className="receipt-row">
                    <span className="lbl">Payment Type</span>
                    <span className="val" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', fontWeight: 'bold' }}>
                      <CheckCircle2 size={16} /> Balance Repayment
                    </span>
                  </div>
                )}

                {selectedTransaction.isReimbursable && (
                  <div className="receipt-row">
                    <span className="lbl">Payment Type</span>
                    <span className="val" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#2563eb', fontWeight: 'bold' }}>
                      <CheckCircle2 size={16} /> Client-Reimbursable Cost
                    </span>
                  </div>
                )}
                
                {selectedTransaction.isReimbursement && (
                  <div className="receipt-row">
                    <span className="lbl">Payment Type</span>
                    <span className="val" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#2563eb', fontWeight: 'bold' }}>
                      <CheckCircle2 size={16} /> Client Reimbursement
                    </span>
                  </div>
                )}

                <div className="receipt-row">
                  <span className="lbl">Project</span>
                  <span className="val">{selectedTransaction.project || 'Unknown Project'}</span>
                </div>
                
                {selectedTransaction.type === 'expense' && selectedTransaction.vendorName && (
                  <div className="receipt-row">
                    <span className="lbl">Paid To (Worker/Vendor)</span>
                    <span className="val" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <User size={14} className="text-muted" /> {selectedTransaction.vendorName}
                    </span>
                  </div>
                )}

                {(Number(selectedTransaction.balanceAmount) || 0) > 0 && (
                  <div className="receipt-row">
                    <span className="lbl">Outstanding Balance Generated</span>
                    <span className="val text-danger" style={{ fontWeight: 'bold' }}>{formatCurrency(selectedTransaction.balanceAmount)}</span>
                  </div>
                )}

                <div className="receipt-row">
                  <span className="lbl">Category</span>
                  <span className="val">{selectedTransaction.category || 'Uncategorized'}</span>
                </div>
                <div className="receipt-row">
                  <span className="lbl">Date</span>
                  <span className="val">{formatDate(selectedTransaction.date)}</span>
                </div>
                <div className="receipt-row">
                  <span className="lbl">Description</span>
                  <span className="val">{selectedTransaction.description || 'N/A'}</span>
                </div>
                <div className="receipt-row">
                  <span className="lbl">Transaction ID</span>
                  <span className="val text-muted">{selectedTransaction.id.toUpperCase()}</span>
                </div>
              </div>

              {canTagPassThrough && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
                  <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.5 }}>
                    {isSelectedIncome
                      ? (isPassThroughFlagged
                          ? 'This payment is a reimbursement, so it is kept out of the contract balance.'
                          : 'Was this the client paying you back for money you spent (like delivery)? Mark it so it does not count toward the contract balance.')
                      : (isPassThroughFlagged
                          ? 'This cost is client-reimbursable, so it is kept out of the project budget and profit.'
                          : 'Did the client pay you back for this (like delivery)? Mark it so it does not count against the project budget.')}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleTogglePassThrough(selectedTransaction)}
                    disabled={isUpdatingTag}
                    style={{
                      width: '100%',
                      height: '42px',
                      borderRadius: '0.5rem',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      fontFamily: 'inherit',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: isUpdatingTag ? 'not-allowed' : 'pointer',
                      opacity: isUpdatingTag ? 0.6 : 1
                    }}
                  >
                    {isUpdatingTag
                      ? 'Updating...'
                      : isPassThroughFlagged
                        ? 'Remove tag'
                        : isSelectedIncome
                          ? 'Mark as client reimbursement'
                          : 'Mark as client-reimbursable cost'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Transactions;