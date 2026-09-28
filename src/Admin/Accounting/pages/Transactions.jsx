import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { Search, Plus, Folder, Tag, X, ChevronDown, ArrowDown, ArrowUp, User, CheckCircle2 } from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { collection, getDocs, addDoc, doc, updateDoc, serverTimestamp, orderBy, query, increment, writeBatch } from "firebase/firestore"; 
import { txtdb } from '../../../firebase-config';

const CATEGORIES = ['Client Payment', 'Materials', 'Labor', 'Software', 'Office/Overhead', 'Logistics/Shipping', 'Other'];

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
  const navigate = useNavigate();
  const location = useLocation();

  const [transactions, setTransactions] = useState([]);
  const [projectsList, setProjectsList] = useState([]); 
  const [vendorsList, setVendorsList] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState(new Date().getMonth().toString()); 
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null); 
  const [isUpdatingTag, setIsUpdatingTag] = useState(false);
  
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const monthDropdownRef = useRef(null);

  const [formData, setFormData] = useState({ 
    type: 'expense', 
    date: new Date().toISOString().split('T')[0], 
    description: '', 
    amount: '', 
    category: 'Materials', 
    projectId: 'internal',
    vendorId: '', 
    newVendorName: '',
    isTempStaff: false,
    hasBalance: false,
    balanceAmount: '',
    isRepayment: false,
    isReimbursable: false,
    isReimbursement: false
  });

  // --- 1. READ TRANSACTIONS, PROJECTS, & VENDORS FROM FIREBASE ---
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

        const qVen = query(collection(txtdb, "vendors"), orderBy("name", "asc"));
        const venSnapshot = await getDocs(qVen);
        const venData = venSnapshot.docs.map(document => ({ id: document.id, name: document.data().name }));
        setVendorsList(venData);

      } catch (error) {
        console.error("Error fetching data: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    const incomingType = params.get('type');
    const incomingCategory = params.get('category');
    const incomingProjectName = params.get('project');

    if (action === 'new' && projectsList.length > 0) {
      const matchedProject = projectsList.find(p => p.name === incomingProjectName);
      
      setFormData(prev => ({
        ...prev,
        type: incomingType || 'expense',
        category: incomingCategory || 'Materials',
        projectId: matchedProject ? matchedProject.id : 'internal'
      }));
      setIsModalOpen(true);
    }
  }, [location.search, projectsList]); 

  const closeActionModal = () => {
    setIsModalOpen(false);
    const params = new URLSearchParams(location.search);
    if (params.has('action')) {
      navigate('/transactions', { replace: true });
    }
  };

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
    if (isModalOpen || selectedTransaction) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => document.body.style.overflow = 'unset';
  }, [isModalOpen, selectedTransaction]);

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.project && t.project.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (t.vendorName && t.vendorName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    const matchesProject = projectFilter === 'all' || t.projectId === projectFilter;

    let matchesTime = true;
    const tDate = new Date(t.date);
    const now = new Date();
    
    if (timeFilter === 'this_year') {
      matchesTime = tDate.getFullYear() === now.getFullYear();
    } else if (timeFilter !== 'all') {
      matchesTime = tDate.getMonth() === parseInt(timeFilter) && tDate.getFullYear() === now.getFullYear();
    }

    return matchesSearch && matchesCategory && matchesProject && matchesTime;
  });

  filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
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

  // --- 2. WRITE TO FIREBASE ---
  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) return;

    const matchedProject = projectsList.find(p => p.id === formData.projectId);
    const resolvedProjectName = matchedProject ? matchedProject.name : 'Internal / Overhead';
    const txAmount = parseFloat(formData.amount);
    
    const balanceToAdd = (formData.hasBalance && formData.balanceAmount) ? parseFloat(formData.balanceAmount) : 0;

    // Pass-through flags only apply to real projects (not Internal / Overhead)
    const isPassThroughCost = formData.type === 'expense' && formData.projectId !== 'internal' && formData.isReimbursable;
    const isClientReimbursement = formData.type === 'income' && formData.projectId !== 'internal' && formData.isReimbursement;

    let finalVendorId = formData.vendorId;
    let finalVendorName = vendorsList.find(v => v.id === formData.vendorId)?.name || '';

    try {
      // Handle Vendor Updates
      if (formData.type === 'expense' && formData.vendorId === 'new') {
        if (!formData.newVendorName.trim()) {
          alert("Please enter a name for the new worker.");
          return;
        }

        const newVendorData = {
          name: formData.newVendorName,
          type: formData.isTempStaff ? 'temporary' : 'staff', 
          email: '',
          phone: '',
          terms: 'Due on Receipt',
          totalSpent: txAmount, 
          outstandingBalance: balanceToAdd, 
          createdAt: serverTimestamp()
        };

        const vDocRef = await addDoc(collection(txtdb, "vendors"), newVendorData);
        finalVendorId = vDocRef.id;
        finalVendorName = formData.newVendorName;

        setVendorsList([...vendorsList, { id: finalVendorId, name: finalVendorName }]);
      } 
      else if (formData.type === 'expense' && finalVendorId) {
        const vendorRef = doc(txtdb, "vendors", finalVendorId);
        const vendorUpdatePayload = { totalSpent: increment(txAmount) };
        
        // INCREMENT OR DECREMENT BALANCE BASED ON TOGGLES
        if (formData.hasBalance && balanceToAdd > 0) {
          vendorUpdatePayload.outstandingBalance = increment(balanceToAdd); // Add new debt
        } else if (formData.isRepayment) {
          vendorUpdatePayload.outstandingBalance = increment(-txAmount); // Deduct debt using the amount paid
        }

        await updateDoc(vendorRef, vendorUpdatePayload);
      }

      // Prepare Transaction Data
      const newTxData = {
        date: formData.date,
        description: formData.description,
        projectId: formData.projectId, 
        project: resolvedProjectName,
        vendorId: formData.type === 'expense' ? finalVendorId : null, 
        vendorName: formData.type === 'expense' ? finalVendorName : null,
        category: formData.category,
        type: formData.type,
        amount: txAmount,
        balanceAmount: formData.hasBalance ? balanceToAdd : 0, 
        isRepayment: formData.isRepayment, 
        isReimbursable: isPassThroughCost,
        isReimbursement: isClientReimbursement,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(txtdb, "transactions"), newTxData);

      // Cross-Update Project
      // Pass-through money (client-reimbursable costs and the client's repayment of them)
      // is tracked separately, so it never distorts the budget, contract balance or profit.
      if (formData.projectId !== 'internal') {
        const projectRef = doc(txtdb, "projects", formData.projectId);
        if (formData.type === 'income') {
          await updateDoc(projectRef, isClientReimbursement
            ? { reimbursementsReceived: increment(txAmount) }
            : { amountPaid: increment(txAmount) });
        } else if (formData.type === 'expense') {
          await updateDoc(projectRef, isPassThroughCost
            ? { reimbursableExpenses: increment(txAmount) }
            : { expenses: increment(txAmount) });
        }
      }

      setTransactions([{ id: docRef.id, ...newTxData }, ...transactions]);
      closeActionModal();
      
      setFormData({ 
        type: 'expense', 
        date: new Date().toISOString().split('T')[0], 
        description: '', 
        amount: '', 
        category: 'Materials', 
        projectId: 'internal',
        vendorId: '',
        newVendorName: '',
        isTempStaff: false,
        hasBalance: false,
        balanceAmount: '',
        isRepayment: false,
        isReimbursable: false,
        isReimbursement: false
      });

    } catch (error) {
      console.error("Error creating transaction: ", error);
      alert("Failed to save transaction.");
    }
  };

  // --- 3. TAG / UN-TAG AN EXISTING PROJECT TRANSACTION AS PASS-THROUGH ---
  // Moves the amount between the normal project totals and the pass-through totals
  // (and back again if the tag is removed), in one atomic write.
  const handleTogglePassThrough = async (tx) => {
    if (!tx || !tx.projectId || tx.projectId === 'internal') return;

    const isIncomeTx = tx.type === 'income';
    const flagKey = isIncomeTx ? 'isReimbursement' : 'isReimbursable';
    const nowFlagged = !tx[flagKey];
    const amt = Number(tx.amount) || 0;
    const delta = nowFlagged ? amt : -amt; // moving into (or back out of) the pass-through bucket

    const projectPayload = isIncomeTx
      ? { amountPaid: increment(-delta), reimbursementsReceived: increment(delta) }
      : { expenses: increment(-delta), reimbursableExpenses: increment(delta) };

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
          <div className="header-titles">
            <h1>Transactions Ledger</h1>
            <p>Master record of all incoming deposits and outgoing expenses.</p>
          </div>

          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            <span>Log Transaction</span>
          </button>
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
                    <span className="tx-title">{tx.description}</span>
                    <span className="tx-subtitle">
                      {tx.project} &bull; {tx.category}
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
                
                {/* Displays Repayment Tag if applicable */}
                {selectedTransaction.isRepayment && (
                  <div className="receipt-row">
                    <span className="lbl">Payment Type</span>
                    <span className="val" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', fontWeight: 'bold' }}>
                      <CheckCircle2 size={16} /> Balance Repayment
                    </span>
                  </div>
                )}

                {/* Pass-through tags */}
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
                  <span className="val">{selectedTransaction.project}</span>
                </div>
                
                {selectedTransaction.type === 'expense' && selectedTransaction.vendorName && (
                  <div className="receipt-row">
                    <span className="lbl">Paid To (Worker/Vendor)</span>
                    <span className="val" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <User size={14} className="text-muted" /> {selectedTransaction.vendorName}
                    </span>
                  </div>
                )}

                {selectedTransaction.balanceAmount > 0 && (
                  <div className="receipt-row">
                    <span className="lbl">Outstanding Balance Generated</span>
                    <span className="val text-danger" style={{ fontWeight: 'bold' }}>{formatCurrency(selectedTransaction.balanceAmount)}</span>
                  </div>
                )}

                <div className="receipt-row">
                  <span className="lbl">Category</span>
                  <span className="val">{selectedTransaction.category}</span>
                </div>
                <div className="receipt-row">
                  <span className="lbl">Date</span>
                  <span className="val">{formatDate(selectedTransaction.date)}</span>
                </div>
                <div className="receipt-row">
                  <span className="lbl">Description</span>
                  <span className="val">{selectedTransaction.description}</span>
                </div>
                <div className="receipt-row">
                  <span className="lbl">Transaction ID</span>
                  <span className="val text-muted">{selectedTransaction.id.toUpperCase()}</span>
                </div>
              </div>

              {/* Tag / un-tag as pass-through (only for transactions linked to a real project) */}
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

      {/* LOG TRANSACTION MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeActionModal}>
          <div className="modal-container action-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Log Transaction</h2>
              <button className="close-btn" onClick={closeActionModal}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleCreateTransaction} className="modal-form">
              <div className="form-group">
                <label>Transaction Type</label>
                <div className="type-toggle">
                  <button type="button" className={`toggle-btn ${formData.type === 'expense' ? 'active expense' : ''}`} onClick={() => setFormData({...formData, type: 'expense', category: 'Materials', vendorId: '', hasBalance: false, balanceAmount: '', isRepayment: false, isReimbursable: false, isReimbursement: false})}>
                    Money Out (Expense)
                  </button>
                  <button type="button" className={`toggle-btn ${formData.type === 'income' ? 'active income' : ''}`} onClick={() => setFormData({...formData, type: 'income', category: 'Client Payment', vendorId: '', hasBalance: false, balanceAmount: '', isRepayment: false, isReimbursable: false, isReimbursement: false})}>
                    Money In (Income)
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Amount Paid (₦)</label>
                  <input type="number" min="0" step="0.01" placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <input type="text" placeholder="e.g. Home Depot Materials" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required />
              </div>

              {formData.type === 'expense' && (
                <div className="form-group">
                  <label>Paid To (Worker / Vendor)</label>
                  <select 
                    className="standard-select" 
                    value={formData.vendorId} 
                    onChange={(e) => setFormData({...formData, vendorId: e.target.value, hasBalance: false, isRepayment: false})}
                  >
                    <option value="">-- Unassigned / Direct Purchase --</option>
                    <option value="new" style={{ fontWeight: 'bold', color: '#0f172a' }}>+ Add New Worker/Vendor</option>
                    {vendorsList.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>

                  {formData.vendorId === 'new' && (
                    <div style={{ marginTop: '0.75rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px dashed #cbd5e1' }}>
                      <input 
                        type="text" 
                        placeholder="Enter worker's full name" 
                        value={formData.newVendorName} 
                        onChange={(e) => setFormData({...formData, newVendorName: e.target.value})} 
                        required={formData.vendorId === 'new'}
                        style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', marginBottom: '0.75rem', boxSizing: 'border-box', outline: 'none' }}
                      />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#64748b', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={formData.isTempStaff} 
                          onChange={(e) => setFormData({...formData, isTempStaff: e.target.checked})} 
                          style={{ margin: 0, width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        Mark as Temporary Staff
                      </label>
                    </div>
                  )}

                  {/* DEBT CREATION & REPAYMENT TOGGLES */}
                  {formData.vendorId && formData.vendorId !== 'new' && (
                    <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      
                      {/* Creates Debt Toggle */}
                      <div style={{ padding: '1rem', backgroundColor: formData.hasBalance ? '#fffbeb' : '#f8fafc', border: `1px solid ${formData.hasBalance ? '#fde68a' : '#e2e8f0'}`, borderRadius: '0.5rem', transition: 'all 0.2s ease' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#0f172a', cursor: 'pointer', fontWeight: '600' }}>
                          <input 
                            type="checkbox" 
                            checked={formData.hasBalance} 
                            onChange={(e) => setFormData({...formData, hasBalance: e.target.checked, isRepayment: e.target.checked ? false : formData.isRepayment})} 
                            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#f59e0b' }}
                          />
                          This transaction leaves an outstanding balance
                        </label>

                        {formData.hasBalance && (
                          <div style={{ marginTop: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.375rem', fontWeight: '600' }}>Outstanding Balance Amount (₦)</label>
                            <input 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              placeholder="e.g. 50000" 
                              value={formData.balanceAmount} 
                              onChange={(e) => setFormData({...formData, balanceAmount: e.target.value})} 
                              required={formData.hasBalance}
                              style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none' }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Repays Debt Toggle */}
                      <div style={{ padding: '1rem', backgroundColor: formData.isRepayment ? '#ecfdf5' : '#f8fafc', border: `1px solid ${formData.isRepayment ? '#a7f3d0' : '#e2e8f0'}`, borderRadius: '0.5rem', transition: 'all 0.2s ease' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#0f172a', cursor: 'pointer', fontWeight: '600' }}>
                          <input 
                            type="checkbox" 
                            checked={formData.isRepayment} 
                            onChange={(e) => setFormData({...formData, isRepayment: e.target.checked, hasBalance: e.target.checked ? false : formData.hasBalance})} 
                            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#10b981' }}
                          />
                          This payment settles an existing outstanding balance
                        </label>
                        {formData.isRepayment && (
                          <p style={{ margin: '0.5rem 0 0 1.5rem', fontSize: '0.8125rem', color: '#64748b' }}>
                            The amount entered above ({formatCurrency(formData.amount)}) will be deducted from this worker's owed balance.
                          </p>
                        )}
                      </div>

                    </div>
                  )}

                  {/* Fallback for New Vendors */}
                  {formData.vendorId === 'new' && (
                     <div style={{ marginTop: '1.25rem', padding: '1rem', backgroundColor: formData.hasBalance ? '#fffbeb' : '#f8fafc', border: `1px solid ${formData.hasBalance ? '#fde68a' : '#e2e8f0'}`, borderRadius: '0.5rem', transition: 'all 0.2s ease' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#0f172a', cursor: 'pointer', fontWeight: '600' }}>
                          <input 
                            type="checkbox" 
                            checked={formData.hasBalance} 
                            onChange={(e) => setFormData({...formData, hasBalance: e.target.checked})} 
                            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#f59e0b' }}
                          />
                          This transaction leaves an outstanding balance
                        </label>

                        {formData.hasBalance && (
                          <div style={{ marginTop: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.375rem', fontWeight: '600' }}>Outstanding Balance Amount (₦)</label>
                            <input 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              placeholder="e.g. 50000" 
                              value={formData.balanceAmount} 
                              onChange={(e) => setFormData({...formData, balanceAmount: e.target.value})} 
                              required={formData.hasBalance}
                              style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none' }}
                            />
                          </div>
                        )}
                      </div>
                  )}

                </div>
              )}

              <div className="form-group">
                <label>Project Tag</label>
                <select
                  className="standard-select"
                  value={formData.projectId}
                  onChange={(e) => {
                    const newProjectId = e.target.value;
                    setFormData({
                      ...formData,
                      projectId: newProjectId,
                      ...(newProjectId === 'internal' ? { isReimbursable: false, isReimbursement: false } : {})
                    });
                  }}
                >
                  <option value="internal">Internal / Overhead</option>
                  {projectsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* PASS-THROUGH: expense the client will pay back (e.g. delivery) */}
              {formData.projectId !== 'internal' && formData.type === 'expense' && (
                <div style={{ marginBottom: '1.25rem', padding: '1rem', backgroundColor: formData.isReimbursable ? '#eff6ff' : '#f8fafc', border: `1px solid ${formData.isReimbursable ? '#bfdbfe' : '#e2e8f0'}`, borderRadius: '0.5rem', transition: 'all 0.2s ease' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: '#0f172a', cursor: 'pointer', fontWeight: '600', lineHeight: 1.4 }}>
                    <input
                      type="checkbox"
                      checked={formData.isReimbursable}
                      onChange={(e) => setFormData({...formData, isReimbursable: e.target.checked})}
                      style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#3b82f6', marginTop: '2px', flexShrink: 0 }}
                    />
                    Client will reimburse this cost (e.g. delivery)
                  </label>
                  <p style={{ margin: '0.5rem 0 0 1.5rem', fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.5 }}>
                    {formData.isReimbursable
                      ? "This won't count against the project's production budget or profit. It is tracked as money the client owes you."
                      : 'Tick this for out-of-pocket costs that were not in the project budget and that the client pays back.'}
                  </p>
                </div>
              )}

              {/* PASS-THROUGH: income that is the client paying back money you spent */}
              {formData.projectId !== 'internal' && formData.type === 'income' && (
                <div style={{ marginBottom: '1.25rem', padding: '1rem', backgroundColor: formData.isReimbursement ? '#eff6ff' : '#f8fafc', border: `1px solid ${formData.isReimbursement ? '#bfdbfe' : '#e2e8f0'}`, borderRadius: '0.5rem', transition: 'all 0.2s ease' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: '#0f172a', cursor: 'pointer', fontWeight: '600', lineHeight: 1.4 }}>
                    <input
                      type="checkbox"
                      checked={formData.isReimbursement}
                      onChange={(e) => setFormData({...formData, isReimbursement: e.target.checked})}
                      style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#3b82f6', marginTop: '2px', flexShrink: 0 }}
                    />
                    This is the client paying back money I spent for them
                  </label>
                  <p style={{ margin: '0.5rem 0 0 1.5rem', fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.5 }}>
                    {formData.isReimbursement
                      ? "This won't count toward the contract balance, so the client's outstanding balance stays accurate."
                      : 'Tick this when the client is repaying an out-of-pocket cost (like delivery) rather than paying toward the contract price.'}
                  </p>
                </div>
              )}

              <div className="form-group">
                <label>Category</label>
                <select className="standard-select" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeActionModal}>Cancel</button>
                <button type="submit" className="btn-primary">Save Transaction</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Transactions;