import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { Search, Plus, X, ShoppingCart, Truck, CheckCircle, Clock, Building2, FileText, ArrowRight, User } from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp, orderBy, query, increment } from "firebase/firestore"; 
import { txtdb } from '../../../firebase-config';

function Purchases() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [vendorsList, setVendorsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);

  const [formData, setFormData] = useState({
    vendorId: '',
    newVendorName: '',
    projectId: 'internal',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    expectedDate: ''
  });

  // --- 1. READ FROM FIREBASE ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch POs
        const qPO = query(collection(txtdb, "purchaseOrders"), orderBy("createdAt", "desc"));
        const poSnapshot = await getDocs(qPO);
        const poData = poSnapshot.docs.map(document => ({ id: document.id, ...document.data() }));
        setPurchaseOrders(poData);

        // Fetch Projects
        const qProj = query(collection(txtdb, "projects"), orderBy("name", "asc"));
        const projSnapshot = await getDocs(qProj);
        const projData = projSnapshot.docs.map(document => ({ id: document.id, name: document.data().name }));
        setProjectsList(projData);

        // Fetch Vendors
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
    if (isModalOpen || selectedPO) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => document.body.style.overflow = 'unset';
  }, [isModalOpen, selectedPO]);

  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSearch = (po.vendorName && po.vendorName.toLowerCase().includes(searchQuery.toLowerCase())) || 
                          (po.projectName && po.projectName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (po.description && po.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTab = activeTab === 'all' || po.status === activeTab;
    return matchesSearch && matchesTab;
  });

  filteredPOs.sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalCommitted = purchaseOrders.reduce((sum, po) => sum + (Number(po.amount) || 0), 0);
  const totalPaid = purchaseOrders.filter(po => po.status === 'paid').reduce((sum, po) => sum + (Number(po.amount) || 0), 0);
  const totalOutstanding = purchaseOrders.filter(po => po.status === 'pending').reduce((sum, po) => sum + (Number(po.amount) || 0), 0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // --- 2. CREATE PURCHASE ORDER ---
  const handleCreatePO = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;

    const matchedProject = projectsList.find(p => p.id === formData.projectId);
    const resolvedProjectName = matchedProject ? matchedProject.name : 'Internal / Overhead';
    const poAmount = parseFloat(formData.amount);

    let finalVendorId = formData.vendorId;
    let finalVendorName = vendorsList.find(v => v.id === formData.vendorId)?.name || 'Unknown Vendor';

    try {
      // Inline Vendor Creation
      if (formData.vendorId === 'new') {
        if (!formData.newVendorName.trim()) {
          alert("Please enter a name for the new vendor.");
          return;
        }

        const newVendorData = {
          name: formData.newVendorName,
          type: 'supplier',
          email: '',
          phone: '',
          terms: 'Due on Receipt',
          totalSpent: 0,
          outstandingBalance: 0,
          createdAt: serverTimestamp()
        };

        const vDocRef = await addDoc(collection(txtdb, "vendors"), newVendorData);
        finalVendorId = vDocRef.id;
        finalVendorName = formData.newVendorName;

        setVendorsList([...vendorsList, { id: finalVendorId, name: finalVendorName }]);
      }

      const newPOData = {
        poNumber: `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
        vendorId: finalVendorId,
        vendorName: finalVendorName,
        projectId: formData.projectId,
        projectName: resolvedProjectName,
        description: formData.description,
        amount: poAmount,
        date: formData.date,
        expectedDate: formData.expectedDate,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(txtdb, "purchaseOrders"), newPOData);

      setPurchaseOrders([{ id: docRef.id, ...newPOData, createdAt: new Date().toISOString() }, ...purchaseOrders]);
      setIsModalOpen(false);
      setFormData({ vendorId: '', newVendorName: '', projectId: 'internal', description: '', amount: '', date: new Date().toISOString().split('T')[0], expectedDate: '' });

    } catch (error) {
      console.error("Error creating PO: ", error);
      alert("Failed to save Purchase Order.");
    }
  };

  // --- 3. AUTO-MAGIC MARK AS PAID ---
  const handleMarkAsPaid = async (po) => {
    try {
      // 1. Update PO Status
      const poRef = doc(txtdb, "purchaseOrders", po.id);
      await updateDoc(poRef, { status: 'paid' });

      // 2. Automatically log the expense transaction
      const newTxData = {
        date: new Date().toISOString().split('T')[0],
        description: `PO Payment: ${po.description}`,
        projectId: po.projectId,
        project: po.projectName,
        vendorId: po.vendorId,
        vendorName: po.vendorName,
        category: 'Materials', // Defaults POs to Materials
        type: 'expense',
        amount: po.amount,
        balanceAmount: 0, // Fully paid
        isRepayment: false,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(txtdb, "transactions"), newTxData);

      // 3. Update the Project budget
      if (po.projectId !== 'internal') {
        const projectRef = doc(txtdb, "projects", po.projectId);
        await updateDoc(projectRef, { expenses: increment(po.amount) });
      }

      // 4. Update the Vendor total spent
      if (po.vendorId) {
        const vendorRef = doc(txtdb, "vendors", po.vendorId);
        await updateDoc(vendorRef, { totalSpent: increment(po.amount) });
      }

      // Update Local State
      setPurchaseOrders(purchaseOrders.map(p => p.id === po.id ? { ...p, status: 'paid' } : p));
      setSelectedPO(null);
      alert("PO marked as paid! A transaction has been automatically added to the ledger.");

    } catch (error) {
      console.error("Error marking PO as paid: ", error);
      alert("Failed to update PO status.");
    }
  };

  return (
    <div className="po-page-wrapper">
      <Navigation />
      
      <main className="po-main-content">
        
        <div className="po-top-section">
          <div className="po-header-titles">
            <h1>Purchase Orders (POs)</h1>
            <p>Track vendor commitments and spoken-for capital.</p>
          </div>

          <button className="po-btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            <span>Create PO</span>
          </button>

          <div className="po-tabs">
            <button className={`po-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All POs</button>
            <button className={`po-tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>Pending (Unpaid)</button>
            <button className={`po-tab ${activeTab === 'paid' ? 'active' : ''}`} onClick={() => setActiveTab('paid')}>Paid</button>
          </div>

          <div className="po-search-box">
            <Search size={18} className="po-search-icon" />
            <input 
              type="text" 
              placeholder="Search vendors or projects..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* FINANCIAL COMMITMENT SUMMARY */}
        <div className="po-metrics-grid">
          <div className="po-metric-card outstanding">
            <div className="po-card-icon"><Clock size={20} /></div>
            <div className="po-card-info">
              <span className="po-lbl">"Spoken For" (Unpaid)</span>
              <span className="po-val po-text-danger">{formatCurrency(totalOutstanding)}</span>
            </div>
          </div>
          <div className="po-metric-card">
            <div className="po-card-icon"><CheckCircle size={20} className="po-text-success" /></div>
            <div className="po-card-info">
              <span className="po-lbl">Already Paid</span>
              <span className="po-val po-text-success">{formatCurrency(totalPaid)}</span>
            </div>
          </div>
          <div className="po-metric-card">
            <div className="po-card-icon"><ShoppingCart size={20} className="po-text-main" /></div>
            <div className="po-card-info">
              <span className="po-lbl">Total Committed</span>
              <span className="po-val po-text-main">{formatCurrency(totalCommitted)}</span>
            </div>
          </div>
        </div>

        {/* PO LISTING */}
        <div className="po-list-container">
          {isLoading ? (
            <div className="po-empty-state">Loading purchase orders...</div>
          ) : filteredPOs.length === 0 ? (
            <div className="po-empty-state">No purchase orders found.</div>
          ) : (
            filteredPOs.map(po => (
              <div key={po.id} className="po-row" onClick={() => setSelectedPO(po)}>
                <div className="po-left">
                  <div className={`po-icon ${po.status}`}>
                    {po.status === 'paid' ? <CheckCircle size={18} /> : <ShoppingCart size={18} />}
                  </div>
                  <div className="po-details">
                    <span className="po-vendor">{po.vendorName}</span>
                    <span className="po-project">{po.projectName} &bull; {po.poNumber || po.id}</span>
                  </div>
                </div>

                <div className="po-right">
                  <span className={`po-amount ${po.status === 'pending' ? 'po-text-danger' : 'po-text-main'}`}>
                    {formatCurrency(po.amount)}
                  </span>
                  <span className={`po-status-badge ${po.status}`}>
                    {po.status === 'pending' ? 'Unpaid' : 'Paid'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* CREATE PO MODAL */}
      {isModalOpen && (
        <div className="po-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="po-modal-container po-action-modal" onClick={(e) => e.stopPropagation()}>
            
            <div className="po-modal-header">
              <div className="po-header-left">
                <ShoppingCart size={20} className="po-text-muted" />
                <h2>Create Purchase Order</h2>
              </div>
              <button className="po-close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreatePO} className="po-modal-form">
              <div className="po-form-content">
                
                <div className="po-form-group">
                  <label>Vendor / Supplier</label>
                  <select 
                    className="po-standard-select" 
                    value={formData.vendorId} 
                    onChange={(e) => setFormData({...formData, vendorId: e.target.value})}
                    required
                  >
                    <option value="" disabled>-- Select a Vendor --</option>
                    <option value="new" style={{ fontWeight: 'bold', color: '#0f172a' }}>+ Add New Vendor</option>
                    {vendorsList.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>

                  {formData.vendorId === 'new' && (
                    <div style={{ marginTop: '0.75rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px dashed #cbd5e1' }}>
                      <input 
                        type="text" 
                        placeholder="Enter new vendor's name" 
                        value={formData.newVendorName} 
                        onChange={(e) => setFormData({...formData, newVendorName: e.target.value})} 
                        required={formData.vendorId === 'new'}
                        style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none' }}
                      />
                    </div>
                  )}
                </div>

                <div className="po-form-group">
                  <label>Project Allocation</label>
                  <select className="po-standard-select" value={formData.projectId} onChange={(e) => setFormData({...formData, projectId: e.target.value})}>
                    <option value="internal">Internal / Overhead</option>
                    {projectsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div className="po-form-group">
                  <label>Description (What are we buying?)</label>
                  <input type="text" placeholder="e.g. 5x Marble Slabs" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required />
                </div>

                <div className="po-form-group">
                  <label>Total Commitment Amount (₦)</label>
                  <input type="number" min="0" step="0.01" placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="po-form-group">
                    <label>Order Date</label>
                    <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
                  </div>
                  <div className="po-form-group">
                    <label>Expected Delivery</label>
                    <input type="date" value={formData.expectedDate} onChange={(e) => setFormData({...formData, expectedDate: e.target.value})} />
                  </div>
                </div>

              </div>

              <div className="po-modal-footer">
                <button type="button" className="po-btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="po-btn-primary">Create PO</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PO DETAILS MODAL */}
      {selectedPO && (
        <div className="po-modal-overlay" onClick={() => setSelectedPO(null)}>
          <div className="po-modal-container po-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="po-modal-header">
              <h2>Purchase Order {selectedPO.poNumber || selectedPO.id}</h2>
              <button className="po-close-btn" onClick={() => setSelectedPO(null)}><X size={20} /></button>
            </div>
            
            <div className="po-receipt-content">
              <div className="po-receipt-amount-large">
                <span className={`po-val ${selectedPO.status === 'pending' ? 'po-text-danger' : 'po-text-main'}`}>
                  {formatCurrency(selectedPO.amount)}
                </span>
                <span className={`po-status ${selectedPO.status}`}>
                  {selectedPO.status === 'pending' ? 'Awaiting Payment' : 'Paid in Full'}
                </span>
              </div>

              <div className="po-receipt-grid">
                <div className="po-receipt-row">
                  <span className="po-lbl">Vendor</span>
                  <span className="po-val" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <User size={14} className="po-text-muted" /> {selectedPO.vendorName}
                  </span>
                </div>
                <div className="po-receipt-row">
                  <span className="po-lbl">Allocated Project</span>
                  <span className="po-val">{selectedPO.projectName}</span>
                </div>
                <div className="po-receipt-row">
                  <span className="po-lbl">Description</span>
                  <span className="po-val">{selectedPO.description}</span>
                </div>
                <div className="po-receipt-row">
                  <span className="po-lbl">Order Date</span>
                  <span className="po-val">{formatDate(selectedPO.date)}</span>
                </div>
                <div className="po-receipt-row">
                  <span className="po-lbl">Expected Delivery</span>
                  <span className="po-val">{formatDate(selectedPO.expectedDate)}</span>
                </div>
              </div>

              {selectedPO.status === 'pending' && (
                <div className="po-modal-actions-centered">
                  <button className="po-btn-primary po-full-width" onClick={() => handleMarkAsPaid(selectedPO)}>
                    Mark as Paid
                  </button>
                  <p className="po-helper-text">Logging this as paid will clear it from your "Spoken For" liability and automatically log the expense into your Transactions ledger.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Purchases;