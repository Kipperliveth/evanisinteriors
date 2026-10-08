import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { Search, Plus, X, User, ArrowDownRight, ArrowUpRight, CheckCircle2, Wallet, Edit2, Trash2 } from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, query, where, increment } from "firebase/firestore"; 
import { txtdb } from '../../../firebase-config';

function Projects() {
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [projectTransactions, setProjectTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingTx, setEditingTx] = useState(null); // Tracks which transaction is currently being edited
  
  // Forms state
  const [newProjectForm, setNewProjectForm] = useState({ name: '', amount: '', amountPaid: '', costOfProduction: '' });
  const [newPaymentForm, setNewPaymentForm] = useState({ amount: '', show: false });
  
  const emptyItemForm = { 
    description: '', 
    workerId: '', 
    newWorkerName: '',
    isTempStaff: false,
    amountPaidNow: '', 
    hasBalance: false, 
    balanceOwed: '', 
    isRepayment: false,
    show: false 
  };
  const [newItemForm, setNewItemForm] = useState(emptyItemForm);

  // Inline input styles for the edit form
  const editInputStyle = {
    width: '100%',
    padding: '0.625rem 0.75rem',
    borderRadius: '0.375rem',
    border: '1px solid #334155',
    backgroundColor: '#0b1120',
    color: '#f1f5f9',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
    marginTop: '0.25rem'
  };

  // --- 1. INITIAL FETCH: PROJECTS & WORKERS ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const qProjects = query(collection(txtdb, "projects"), orderBy("createdAt", "desc"));
        const projectsSnapshot = await getDocs(qProjects);
        const projectsData = projectsSnapshot.docs.map(document => ({
          id: document.id,
          ...document.data()
        }));
        setProjects(projectsData);

        const qWorkers = query(collection(txtdb, "vendors"), orderBy("name", "asc"));
        const workersSnapshot = await getDocs(qWorkers);
        const workersData = workersSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          outstandingBalance: doc.data().outstandingBalance || 0
        }));
        setWorkers(workersData);

      } catch (error) {
        console.error("Error fetching data: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- 2. FETCH PROJECT TRANSACTIONS WHEN OPENED ---
  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!selectedProject) return;
      try {
        const qTx = query(collection(txtdb, "transactions"), where("projectId", "==", selectedProject.id));
        const txSnapshot = await getDocs(qTx);
        const txData = txSnapshot.docs.map(document => ({
          id: document.id,
          ...document.data()
        }));
        
        txData.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return dateB - dateA; 
        });

        setProjectTransactions(txData);
        setEditingTx(null); // Reset edit state if project changes
      } catch (error) {
        console.error("Error fetching project transactions: ", error);
      }
    };

    fetchProjectDetails();
  }, [selectedProject]);

  useEffect(() => {
    if (isNewProjectOpen || selectedProject) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => document.body.style.overflow = 'unset';
  }, [isNewProjectOpen, selectedProject]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount || 0);
  };

  const filteredProjects = projects.filter(project => 
    (project.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getWorkerProjectDebt = (workerId) => {
    let owed = 0;
    projectTransactions.forEach(tx => {
      if (tx.type === 'expense' && tx.vendorId === workerId) {
        if (tx.isRepayment) {
          owed -= Number(tx.amount || 0);
        } else {
          owed += Number(tx.balanceAmount || 0);
        }
      }
    });
    return Math.max(0, owed);
  };

  // --- 3. CREATE NEW CUSTOMER PROJECT ---
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectForm.name || !newProjectForm.amount) return;

    const billedAmount = parseFloat(newProjectForm.amount) || 0;
    const initialPaidAmount = parseFloat(newProjectForm.amountPaid) || 0;
    const costAmount = parseFloat(newProjectForm.costOfProduction) || 0; 

    try {
      const newProjectData = {
        name: newProjectForm.name,
        billed: billedAmount,
        amountPaid: initialPaidAmount,
        costOfProduction: costAmount,
        expenses: 0, 
        status: 'active',
        createdAt: serverTimestamp() 
      };

      const projectDocRef = await addDoc(collection(txtdb, "projects"), newProjectData);

      if (initialPaidAmount > 0) {
        await addDoc(collection(txtdb, "transactions"), {
          date: new Date().toISOString().split('T')[0],
          description: `Initial Deposit`,
          projectId: projectDocRef.id,
          project: newProjectForm.name, 
          category: 'Client Payment',
          type: 'income',
          amount: initialPaidAmount,
          createdAt: serverTimestamp()
        });
      }

      setProjects([{ id: projectDocRef.id, ...newProjectData, createdAt: new Date() }, ...projects]); 
      setIsNewProjectOpen(false); 
      setNewProjectForm({ name: '', amount: '', amountPaid: '', costOfProduction: '' }); 

    } catch (error) {
      console.error("Error creating project: ", error);
      alert("Failed to save. Please try again.");
    }
  };

  // --- 4. LOG WORKER ALLOCATION ---
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemForm.description || !newItemForm.workerId || !newItemForm.amountPaidNow) return;

    const cashPaidOut = parseFloat(newItemForm.amountPaidNow) || 0;
    const isRepay = newItemForm.isRepayment;

    if (cashPaidOut <= 0) {
      alert("Amount must be greater than zero.");
      return;
    }

    const projectExpenseToAdd = cashPaidOut;
    let balanceToAdd = 0;

    if (isRepay) {
      const owedHere = getWorkerProjectDebt(newItemForm.workerId);
      if (cashPaidOut > owedHere) {
        alert(`This worker is only owed ${formatCurrency(owedHere)} on this project. You cannot repay more than what is owed here.`);
        return;
      }
      balanceToAdd = -cashPaidOut; 
    } else if (newItemForm.hasBalance) {
      const balanceOwed = parseFloat(newItemForm.balanceOwed) || 0;
      if (balanceOwed <= 0) {
        alert("Please enter the balance still owed to the worker.");
        return;
      }
      balanceToAdd = balanceOwed; 
    }

    let finalWorkerId = newItemForm.workerId;
    let finalWorkerName = '';

    try {
      if (finalWorkerId === 'new') {
        if (!newItemForm.newWorkerName.trim()) {
          alert("Please enter a name for the new worker.");
          return;
        }

        const newVendorData = {
          name: newItemForm.newWorkerName,
          type: newItemForm.isTempStaff ? 'temporary' : 'staff', 
          email: '',
          phone: '',
          terms: 'Due on Delivery',
          totalSpent: cashPaidOut, 
          outstandingBalance: balanceToAdd, 
          createdAt: serverTimestamp()
        };

        const vDocRef = await addDoc(collection(txtdb, "vendors"), newVendorData);
        finalWorkerId = vDocRef.id;
        finalWorkerName = newItemForm.newWorkerName;

        setWorkers([...workers, { id: finalWorkerId, name: finalWorkerName, outstandingBalance: balanceToAdd }]);
      } else {
        const assignedWorker = workers.find(w => w.id === finalWorkerId);
        if (!assignedWorker) return;
        finalWorkerName = assignedWorker.name;

        const workerRef = doc(txtdb, "vendors", finalWorkerId);
        await updateDoc(workerRef, { 
          outstandingBalance: increment(balanceToAdd),
          totalSpent: increment(cashPaidOut) 
        });

        setWorkers(workers.map(w => 
          w.id === finalWorkerId ? { ...w, outstandingBalance: (w.outstandingBalance || 0) + balanceToAdd } : w
        ));
      }

      const newTx = {
        date: new Date().toISOString().split('T')[0],
        description: newItemForm.description, 
        projectId: selectedProject.id,
        project: selectedProject.name,
        vendorId: finalWorkerId,
        vendorName: finalWorkerName, 
        category: 'Worker Allocation',
        type: 'expense',
        amount: cashPaidOut, 
        balanceAmount: isRepay ? 0 : balanceToAdd, 
        isRepayment: isRepay,
        createdAt: serverTimestamp()
      };
      const txRef = await addDoc(collection(txtdb, "transactions"), newTx);

      const projectRef = doc(txtdb, "projects", selectedProject.id);
      await updateDoc(projectRef, { expenses: increment(projectExpenseToAdd) });

      const updatedExpenses = (selectedProject.expenses || 0) + projectExpenseToAdd;
      setSelectedProject({ ...selectedProject, expenses: updatedExpenses });
      setProjects(projects.map(p => p.id === selectedProject.id ? { ...p, expenses: (p.expenses || 0) + projectExpenseToAdd } : p));

      setProjectTransactions([{ id: txRef.id, ...newTx, createdAt: new Date() }, ...projectTransactions]);
      setNewItemForm(emptyItemForm);

    } catch (error) {
      console.error("Error logging item:", error);
      alert("Failed to save. Please try again.");
    }
  };

  // --- 5. LOG CLIENT PAYMENT (INCOME) ---
  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!newPaymentForm.amount) return;

    const paymentAmount = parseFloat(newPaymentForm.amount) || 0;

    try {
      const newTx = {
        date: new Date().toISOString().split('T')[0],
        description: `Installment Payment`,
        projectId: selectedProject.id,
        project: selectedProject.name,
        category: 'Client Payment',
        type: 'income',
        amount: paymentAmount,
        createdAt: serverTimestamp()
      };
      const txRef = await addDoc(collection(txtdb, "transactions"), newTx);

      const projectRef = doc(txtdb, "projects", selectedProject.id);
      await updateDoc(projectRef, { amountPaid: increment(paymentAmount) });

      setProjectTransactions([{ id: txRef.id, ...newTx, createdAt: new Date() }, ...projectTransactions]);
      
      const updatedPaid = (selectedProject.amountPaid || 0) + paymentAmount;
      setSelectedProject({ ...selectedProject, amountPaid: updatedPaid });
      setProjects(projects.map(p => p.id === selectedProject.id ? { ...p, amountPaid: (p.amountPaid || 0) + paymentAmount } : p));
      
      setNewPaymentForm({ amount: '', show: false });

    } catch (error) {
      console.error("Error logging payment:", error);
    }
  };

  // --- 6. EDIT TRANSACTIONS LOGIC ---
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingTx.description || !editingTx.amount) return;

    const newAmt = parseFloat(editingTx.amount) || 0;
    const newBal = parseFloat(editingTx.balanceAmount) || 0;
    
    const originalTx = projectTransactions.find(t => t.id === editingTx.id);
    const oldAmt = parseFloat(originalTx.amount) || 0;
    const oldBal = parseFloat(originalTx.balanceAmount) || 0;

    const deltaAmt = newAmt - oldAmt;
    const deltaBal = newBal - oldBal;

    try {
      // 1. Update Transaction Details
      await updateDoc(doc(txtdb, "transactions", editingTx.id), {
        description: editingTx.description,
        amount: newAmt,
        balanceAmount: newBal
      });

      // 2. Update Project Totals
      if (editingTx.type === 'income') {
        await updateDoc(doc(txtdb, "projects", selectedProject.id), { amountPaid: increment(deltaAmt) });
        setSelectedProject(prev => ({...prev, amountPaid: prev.amountPaid + deltaAmt}));
        setProjects(prev => prev.map(p => p.id === selectedProject.id ? {...p, amountPaid: p.amountPaid + deltaAmt} : p));
      } else if (editingTx.type === 'expense') {
        await updateDoc(doc(txtdb, "projects", selectedProject.id), { expenses: increment(deltaAmt) });
        setSelectedProject(prev => ({...prev, expenses: prev.expenses + deltaAmt}));
        setProjects(prev => prev.map(p => p.id === selectedProject.id ? {...p, expenses: p.expenses + deltaAmt} : p));

        // 3. Update Vendor Totals
        if (editingTx.vendorId) {
          const vendorRef = doc(txtdb, "vendors", editingTx.vendorId);
          if (editingTx.isRepayment) {
            // Repaying MORE means debt goes DOWN further
            await updateDoc(vendorRef, { outstandingBalance: increment(-deltaAmt) });
          } else {
            await updateDoc(vendorRef, { totalSpent: increment(deltaAmt), outstandingBalance: increment(deltaBal) });
          }
          
          setWorkers(prev => prev.map(w => {
            if (w.id === editingTx.vendorId) {
              if (editingTx.isRepayment) {
                return {...w, outstandingBalance: (w.outstandingBalance || 0) - deltaAmt};
              } else {
                return {...w, outstandingBalance: (w.outstandingBalance || 0) + deltaBal};
              }
            }
            return w;
          }));
        }
      }

      setProjectTransactions(prev => prev.map(t => t.id === editingTx.id ? {...t, description: editingTx.description, amount: newAmt, balanceAmount: newBal} : t));
      setEditingTx(null);

    } catch (error) {
      console.error("Error updating transaction:", error);
      alert("Failed to update transaction.");
    }
  };

  const handleDeleteTx = async () => {
    if(!window.confirm("Are you sure you want to delete this transaction? This will automatically reverse its effects on the project and worker balances.")) return;

    const oldAmt = parseFloat(editingTx.amount) || 0;
    const oldBal = parseFloat(editingTx.balanceAmount) || 0;

    try {
      await deleteDoc(doc(txtdb, "transactions", editingTx.id));

      if (editingTx.type === 'income') {
        await updateDoc(doc(txtdb, "projects", selectedProject.id), { amountPaid: increment(-oldAmt) });
        setSelectedProject(prev => ({...prev, amountPaid: prev.amountPaid - oldAmt}));
        setProjects(prev => prev.map(p => p.id === selectedProject.id ? {...p, amountPaid: p.amountPaid - oldAmt} : p));
        
      } else if (editingTx.type === 'expense') {
        await updateDoc(doc(txtdb, "projects", selectedProject.id), { expenses: increment(-oldAmt) });
        setSelectedProject(prev => ({...prev, expenses: prev.expenses - oldAmt}));
        setProjects(prev => prev.map(p => p.id === selectedProject.id ? {...p, expenses: p.expenses - oldAmt} : p));

        if (editingTx.vendorId) {
          const vendorRef = doc(txtdb, "vendors", editingTx.vendorId);
          if (editingTx.isRepayment) {
            // Reversing a repayment means the worker's debt goes back UP
            await updateDoc(vendorRef, { outstandingBalance: increment(oldAmt) });
          } else {
            await updateDoc(vendorRef, { totalSpent: increment(-oldAmt), outstandingBalance: increment(-oldBal) });
          }
          
          setWorkers(prev => prev.map(w => {
            if (w.id === editingTx.vendorId) {
              if (editingTx.isRepayment) {
                return {...w, outstandingBalance: (w.outstandingBalance || 0) + oldAmt};
              } else {
                return {...w, outstandingBalance: (w.outstandingBalance || 0) - oldBal};
              }
            }
            return w;
          }));
        }
      }

      setProjectTransactions(prev => prev.filter(t => t.id !== editingTx.id));
      setEditingTx(null);

    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Failed to delete transaction.");
    }
  };


  const selectedWorker = workers.find(w => w.id === newItemForm.workerId);

  return (
    <div className="pj-page-wrapper">
      <Navigation />
      
      <main className="pj-main-content">
        
        <div className="pj-top-section">
          <div className="pj-header-titles">
            <h1>Ledger</h1>
            <p>Master list of all customer jobs and balances.</p>
          </div>

          <button className="pj-btn-primary" onClick={() => setIsNewProjectOpen(true)}>
            <Plus size={18} />
            <span>New Customer Job</span>
          </button>

          <div className="pj-search-box">
            <Search size={18} className="pj-search-icon" />
            <input 
              type="text" 
              placeholder="Search customers..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
        </div>

        <div className="pj-swipe-indicator">
          Swipe to see more details &rarr;
        </div>

        <div className="pj-table-container">
          {isLoading ? (
            // In Projects.jsx, find this line inside the .pj-table-container:
//
//   <div className="pj-empty-state">Loading ledger...</div>
//
// and replace it with everything below this comment:

            <table className="pj-ledger-table" aria-busy="true">
              <thead>
                <tr>
                  <th>Customers Name</th>
                  <th>Amount</th>
                  <th>Amount Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="pj-skeleton-row">
                    <td><span className="pj-skeleton" style={{ width: '60%', height: '0.9375rem' }} /></td>
                    <td><span className="pj-skeleton" style={{ width: '5rem', height: '0.9375rem' }} /></td>
                    <td><span className="pj-skeleton" style={{ width: '5rem', height: '0.9375rem' }} /></td>
                    <td><span className="pj-skeleton" style={{ width: '5rem', height: '0.9375rem' }} /></td>
                    <td><span className="pj-skeleton" style={{ width: '4.5rem', height: '1.5rem' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : filteredProjects.length === 0 ? (
            <div className="pj-empty-state">No records found.</div>
          ) : (
            <table className="pj-ledger-table">
              <thead>
                <tr>
                  <th>Customers Name</th>
                  <th>Amount</th>
                  <th>Amount Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => {
                  const billed = project.billed || 0;
                  const paid = project.amountPaid || 0;
                  const balance = billed - paid;
                  const isSettled = balance <= 0;

                  return (
                    <tr key={project.id} onClick={() => setSelectedProject(project)}>
                      <td className="pj-col-name"><strong>{project.name || 'Unnamed'}</strong></td>
                      <td className="pj-col-amount">{formatCurrency(billed)}</td>
                      <td className="pj-col-paid text-success">{formatCurrency(paid)}</td>
                      <td className={`pj-col-balance ${isSettled ? 'text-muted' : 'text-danger'}`}>
                        {formatCurrency(balance)}
                      </td>
                      <td className="pj-col-status">
                        {isSettled ? (
                          <span className="pj-badge success"><CheckCircle2 size={12}/> Settled</span>
                        ) : (
                          <span className="pj-badge warning">Active</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* --- MODAL 1: NEW CUSTOMER PROJECT --- */}
      {isNewProjectOpen && (
        <div className="pj-modal-overlay" onClick={() => setIsNewProjectOpen(false)}>
          <div className="pj-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="pj-modal-header">
              <h2>New Customer Job</h2>
              <button className="pj-close-btn" onClick={() => setIsNewProjectOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleCreateProject} className="pj-modal-form">
              <div className="pj-form-group">
                <label>Customer / Project Name</label>
                <input type="text" placeholder="e.g. Mrs Mya or Diminu Project" value={newProjectForm.name} onChange={(e) => setNewProjectForm({...newProjectForm, name: e.target.value})} required />
              </div>
              
              <div className="pj-form-row">
                <div className="pj-form-group">
                  <label>Total Amount (₦)</label>
                  <input type="number" min="0" step="0.01" placeholder="Total agreed" value={newProjectForm.amount} onChange={(e) => setNewProjectForm({...newProjectForm, amount: e.target.value})} required />
                </div>
                <div className="pj-form-group">
                  <label>Amount Paid (Deposit)</label>
                  <input type="number" min="0" step="0.01" placeholder="Optional" value={newProjectForm.amountPaid} onChange={(e) => setNewProjectForm({...newProjectForm, amountPaid: e.target.value})} />
                </div>
              </div>

              <div className="pj-form-group">
                <label>Internal Cost Estimate (₦)</label>
                <input type="number" min="0" step="0.01" placeholder="Budget for items & workers" value={newProjectForm.costOfProduction} onChange={(e) => setNewProjectForm({...newProjectForm, costOfProduction: e.target.value})} required />
              </div>

              <div className="pj-modal-footer">
                <button type="button" className="pj-btn-secondary" onClick={() => setIsNewProjectOpen(false)}>Cancel</button>
                <button type="submit" className="pj-btn-primary">Save Job</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: PROJECT COMMAND CENTER --- */}
      {selectedProject && (
        <div className="pj-modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="pj-modal-container large" onClick={(e) => e.stopPropagation()}>
            
            <div className="pj-modal-header dark">
              <div className="header-titles">
                <h2>{selectedProject.name || 'Unnamed Project'}</h2>
              </div>
              <button className="pj-close-btn" onClick={() => setSelectedProject(null)}><X size={20} /></button>
            </div>

            {/* --- 3 COLUMN STATS BREAKDOWN --- */}
            <div className="pj-stats-breakdown">
              
              {/* Money In */}
              <div className="breakdown-col">
                <div className="section-title">
                  <ArrowDownRight size={18} className="text-success" />
                  <h3>Money In (Revenue)</h3>
                </div>
                <div className="stat-row">
                  <span className="lbl">Total Contract Billed:</span>
                  <span className="val">{formatCurrency(selectedProject.billed || 0)}</span>
                </div>
                <div className="stat-row">
                  <span className="lbl">Deposits/Payments Collected:</span>
                  <span className="val text-success">{formatCurrency(selectedProject.amountPaid || 0)}</span>
                </div>
                <div className="stat-row" style={{ marginTop: '0.75rem' }}>
                  <span className="lbl">Outstanding Balance (Still Owed):</span>
                  <span className="val">{formatCurrency((selectedProject.billed || 0) - (selectedProject.amountPaid || 0))}</span>
                </div>
              </div>

              {/* Money Out */}
              <div className="breakdown-col">
                <div className="section-title">
                  <ArrowUpRight size={18} className="text-danger" />
                  <h3>Money Out (Costs)</h3>
                </div>
                <div className="stat-row">
                  <span className="lbl">Internal Cost Estimate:</span>
                  <span className="val">{formatCurrency(selectedProject.costOfProduction || 0)}</span>
                </div>
                <div className="stat-row">
                  <span className="lbl">Amount Spent on Project:</span>
                  <span className="val">{formatCurrency(selectedProject.expenses || 0)}</span>
                </div>
                <div className="stat-row" style={{ marginTop: '0.75rem' }}>
                  <span className="lbl">Status:</span>
                  <span className={`val ${((selectedProject.expenses || 0) > (selectedProject.costOfProduction || 0)) ? 'text-danger' : 'text-success'}`}>
                    {((selectedProject.expenses || 0) > (selectedProject.costOfProduction || 0)) 
                      ? `Over budget by ${formatCurrency((selectedProject.expenses || 0) - (selectedProject.costOfProduction || 0))}` 
                      : `${formatCurrency((selectedProject.costOfProduction || 0) - (selectedProject.expenses || 0))} remaining`}
                  </span>
                </div>
              </div>

              {/* Bottom Line */}
              <div className="breakdown-col">
                <div className="section-title">
                  <Wallet size={18} className="text-main" />
                  <h3>The Bottom Line</h3>
                </div>
                
                <div className="stat-row" style={{ marginBottom: '0.5rem' }}>
                  <span className="lbl">Projected Profit:</span>
                  <span className={`val ${((selectedProject.billed || 0) - (selectedProject.costOfProduction || 0)) >= 0 ? 'text-success' : 'text-danger'}`}>
                    {((selectedProject.billed || 0) - (selectedProject.costOfProduction || 0)) >= 0 ? '+' : '-'}
                    {formatCurrency(Math.abs((selectedProject.billed || 0) - (selectedProject.costOfProduction || 0)))}
                  </span>
                </div>

                <div className="stat-row bottom-line" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed #334155' }}>
                  <span className="lbl">Current Margin:</span>
                  <span className={`val large ${((selectedProject.billed || 0) - (selectedProject.expenses || 0)) >= 0 ? 'text-success' : 'text-danger'}`}>
                    {((selectedProject.billed || 0) - (selectedProject.expenses || 0)) >= 0 ? '+' : '-'}
                    {formatCurrency(Math.abs((selectedProject.billed || 0) - (selectedProject.expenses || 0)))}
                  </span>
                </div>
              </div>

            </div>

            <div className="pj-details-content">
              
              {/* LEFT COLUMN: PAYMENTS RECEIVED */}
              <div className="pj-details-column">
                <div className="column-header">
                  <h3><ArrowDownRight size={16} className="text-success"/> Payments Received</h3>
                  <button className="pj-btn-text" onClick={() => setNewPaymentForm({...newPaymentForm, show: !newPaymentForm.show})}>
                    + Log Payment
                  </button>
                </div>

                {newPaymentForm.show && (
                  <form onSubmit={handleAddPayment} className="pj-inline-form">
                    <input type="number" placeholder="Amount Received" value={newPaymentForm.amount} onChange={e => setNewPaymentForm({...newPaymentForm, amount: e.target.value})} required/>
                    <div className="form-actions">
                      <button type="submit" className="pj-btn-primary small">Save Payment</button>
                      <button type="button" className="pj-btn-secondary small" onClick={() => setNewPaymentForm({...newPaymentForm, show: false})}>Cancel</button>
                    </div>
                  </form>
                )}

                <div className="pj-inner-list">
                  {projectTransactions.filter(t => t.type === 'income').length === 0 ? (
                    <p className="empty-text">No payments logged yet.</p>
                  ) : (
                    projectTransactions.filter(t => t.type === 'income').map(tx => (
                      editingTx?.id === tx.id ? (
                        <form key={tx.id} onSubmit={handleSaveEdit} className="pj-list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.75rem', backgroundColor: '#0f172a', border: '1px solid #3b82f6', borderRadius: '0.5rem', padding: '1rem' }}>
                          <div>
                            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Description</label>
                            <input type="text" value={editingTx.description} onChange={e => setEditingTx({...editingTx, description: e.target.value})} style={editInputStyle} required />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Amount Received</label>
                            <input type="number" value={editingTx.amount} onChange={e => setEditingTx({...editingTx, amount: e.target.value})} style={editInputStyle} required />
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                            <button type="button" onClick={handleDeleteTx} className="pj-btn-secondary small" style={{ color: '#ef4444', borderColor: 'transparent', padding: '0.25rem 0.5rem' }}><Trash2 size={16}/></button>
                            <button type="button" onClick={() => setEditingTx(null)} className="pj-btn-secondary small">Cancel</button>
                            <button type="submit" className="pj-btn-primary small">Save</button>
                          </div>
                        </form>
                      ) : (
                        <div key={tx.id} className="pj-list-item" style={{ cursor: 'pointer', transition: 'background-color 0.2s' }} onClick={() => setEditingTx({ ...tx })}>
                          <div className="item-info">
                            <strong>{tx.description}</strong>
                            <span>{tx.date}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                            <strong className="item-cost text-success">+{formatCurrency(tx.amount)}</strong>
                            <span style={{ fontSize: '0.6875rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem', opacity: 0.8 }}><Edit2 size={10}/> Edit</span>
                          </div>
                        </div>
                      )
                    ))
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: ITEMS & WORKERS */}
              <div className="pj-details-column">
                <div className="column-header">
                  <h3><ArrowUpRight size={16} className="text-danger"/> Items & Allocations</h3>
                  <button className="pj-btn-text" onClick={() => setNewItemForm({...newItemForm, show: !newItemForm.show})}>
                    + Add Item
                  </button>
                </div>

                {newItemForm.show && (
                  <form onSubmit={handleAddItem} className="pj-inline-form">
                    <input type="text" placeholder="Item Name (e.g. 6x6 Bedframe)" value={newItemForm.description} onChange={e => setNewItemForm({...newItemForm, description: e.target.value})} required/>
                    
                    <select value={newItemForm.workerId} onChange={e => setNewItemForm({...newItemForm, workerId: e.target.value, hasBalance: false, isRepayment: false})} required>
                      <option value="" disabled>Assign Worker</option>
                      <option value="new">+ Add New / Temp Worker</option>
                      {workers.map(w => {
                        const owedHere = getWorkerProjectDebt(w.id);
                        return (
                          <option key={w.id} value={w.id}>
                            {w.name}{owedHere > 0 ? ` (Owed ${formatCurrency(owedHere)})` : ''}
                          </option>
                        );
                      })}
                    </select>

                    {/* NEW WORKER / TEMP STAFF INPUT FIELDS */}
                    {newItemForm.workerId === 'new' && (
                      <div style={{ padding: '0.75rem', backgroundColor: '#0b1120', border: '1px dashed #334155', borderRadius: '0.375rem', marginTop: '0.25rem' }}>
                        <input 
                          type="text" 
                          placeholder="Worker or Vendor Name (e.g. Hotel XYZ)" 
                          value={newItemForm.newWorkerName} 
                          onChange={(e) => setNewItemForm({...newItemForm, newWorkerName: e.target.value})} 
                          required={newItemForm.workerId === 'new'}
                          style={{ marginBottom: '0.75rem' }}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#f1f5f9', cursor: 'pointer', fontWeight: '500' }}>
                          <input 
                            type="checkbox" 
                            checked={newItemForm.isTempStaff} 
                            onChange={(e) => setNewItemForm({...newItemForm, isTempStaff: e.target.checked})} 
                            style={{ width: '14px', height: '14px', margin: 0, accentColor: '#3b82f6', cursor: 'pointer' }}
                          />
                          Mark as Temporary/Misc Worker
                        </label>
                      </div>
                    )}

                    <input 
                      type="number" 
                      min="0"
                      step="0.01"
                      placeholder="How much are you paying now (₦)" 
                      value={newItemForm.amountPaidNow} 
                      onChange={e => setNewItemForm({...newItemForm, amountPaidNow: e.target.value})} 
                      required
                    />
                    
                    {/* DEBT CREATION TOGGLE */}
                    {!newItemForm.isRepayment && (
                      <div style={{ padding: '0.75rem', backgroundColor: newItemForm.hasBalance ? '#fffbeb' : '#0b1120', border: `1px solid ${newItemForm.hasBalance ? '#fde68a' : '#334155'}`, borderRadius: '0.375rem', transition: 'all 0.2s ease', marginTop: '0.25rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: newItemForm.hasBalance ? '#92400e' : '#f1f5f9', cursor: 'pointer', fontWeight: '600' }}>
                          <input 
                            type="checkbox" 
                            checked={newItemForm.hasBalance} 
                            onChange={(e) => setNewItemForm({...newItemForm, hasBalance: e.target.checked, balanceOwed: ''})} 
                            style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: '#f59e0b', margin: 0 }}
                          />
                          This leaves an unpaid balance
                        </label>

                        {newItemForm.hasBalance && (
                          <div style={{ marginTop: '0.75rem' }}>
                            <input 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              placeholder="Balance still owed to worker (₦)" 
                              value={newItemForm.balanceOwed} 
                              onChange={(e) => setNewItemForm({...newItemForm, balanceOwed: e.target.value})} 
                              required={newItemForm.hasBalance}
                              style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #fcd34d', backgroundColor: '#ffffff', color: '#0f172a', boxSizing: 'border-box', outline: 'none' }}
                            />
                            {newItemForm.balanceOwed && (
                              <p style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: '#f59e0b', fontWeight: 600 }}>
                                Paying now: {formatCurrency(parseFloat(newItemForm.amountPaidNow || 0))} · Owed later: {formatCurrency(parseFloat(newItemForm.balanceOwed || 0))}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* DEBT REPAYMENT TOGGLE */}
                    {!newItemForm.hasBalance && newItemForm.workerId && newItemForm.workerId !== 'new' && (selectedWorker?.outstandingBalance || 0) > 0 && (
                      <div style={{ padding: '0.75rem', backgroundColor: newItemForm.isRepayment ? '#ecfdf5' : '#0b1120', border: `1px solid ${newItemForm.isRepayment ? '#a7f3d0' : '#334155'}`, borderRadius: '0.375rem', transition: 'all 0.2s ease', marginTop: '0.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: newItemForm.isRepayment ? '#065f46' : '#f1f5f9', cursor: 'pointer', fontWeight: '600' }}>
                          <input 
                            type="checkbox" 
                            checked={newItemForm.isRepayment} 
                            onChange={(e) => setNewItemForm({...newItemForm, isRepayment: e.target.checked})} 
                            style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: '#10b981', margin: 0 }}
                          />
                          This payment settles an existing balance
                        </label>
                        {newItemForm.isRepayment && (
                          <p style={{ margin: '0.5rem 0 0 1.5rem', fontSize: '0.75rem', color: '#065f46', lineHeight: 1.4 }}>
                            This will deduct from the worker's owed balance and count toward the project's spending.
                            Owed here: {formatCurrency(getWorkerProjectDebt(newItemForm.workerId))}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="form-actions" style={{ marginTop: '0.5rem' }}>
                      <button type="submit" className="pj-btn-primary small">Save Item</button>
                      <button type="button" className="pj-btn-secondary small" onClick={() => setNewItemForm(emptyItemForm)}>Cancel</button>
                    </div>
                  </form>
                )}

                <div className="pj-inner-list">
                  {projectTransactions.filter(t => t.type === 'expense').length === 0 ? (
                    <p className="empty-text">No items added yet.</p>
                  ) : (
                    projectTransactions.filter(t => t.type === 'expense').map(tx => (
                      editingTx?.id === tx.id ? (
                        <form key={tx.id} onSubmit={handleSaveEdit} className="pj-list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.75rem', backgroundColor: '#0f172a', border: '1px solid #3b82f6', borderRadius: '0.5rem', padding: '1rem' }}>
                          <div>
                            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Description</label>
                            <input type="text" value={editingTx.description} onChange={e => setEditingTx({...editingTx, description: e.target.value})} style={editInputStyle} required />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Amount Paid (Cash Out)</label>
                            <input type="number" value={editingTx.amount} onChange={e => setEditingTx({...editingTx, amount: e.target.value})} style={editInputStyle} required />
                          </div>
                          {!editingTx.isRepayment && (
                            <div>
                              <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Balance Owed Created</label>
                              <input type="number" value={editingTx.balanceAmount} onChange={e => setEditingTx({...editingTx, balanceAmount: e.target.value})} style={editInputStyle} />
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                            <button type="button" onClick={handleDeleteTx} className="pj-btn-secondary small" style={{ color: '#ef4444', borderColor: 'transparent', padding: '0.25rem 0.5rem' }}><Trash2 size={16}/></button>
                            <button type="button" onClick={() => setEditingTx(null)} className="pj-btn-secondary small">Cancel</button>
                            <button type="submit" className="pj-btn-primary small">Save</button>
                          </div>
                        </form>
                      ) : (
                        <div key={tx.id} className="pj-list-item" style={{ cursor: 'pointer', transition: 'background-color 0.2s' }} onClick={() => setEditingTx({ ...tx })}>
                          <div className="item-info">
                            <strong>{tx.description}</strong>
                            <span>
                              <User size={12}/> {tx.vendorName || 'Unassigned'}
                              {tx.isRepayment && <span style={{ marginLeft: '0.5rem', color: '#10b981', fontWeight: '600' }}>(Repayment)</span>}
                            </span>
                            {tx.balanceAmount > 0 && (
                              <span className="text-warning" style={{ fontWeight: 600, marginTop: '0.125rem' }}>Owed: {formatCurrency(tx.balanceAmount)}</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                            <strong className="item-cost">
                              {formatCurrency(tx.amount)}
                            </strong>
                            <span style={{ fontSize: '0.6875rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem', opacity: 0.8 }}><Edit2 size={10}/> Edit</span>
                          </div>
                        </div>
                      )
                    ))
                  )}
                  <div className="pj-list-total">
                    <span>Amount Spent on Project</span>
                    <strong>{formatCurrency(selectedProject.expenses || 0)}</strong>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Projects;