import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { Search, Plus, X, Calculator, User, Building2, HardHat, Package, Trash2, ArrowRight } from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp, orderBy, query } from "firebase/firestore"; 
import { txtdb } from '../../../firebase-config';

function Estimates() {
  const [estimates, setEstimates] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [vendorsList, setVendorsList] = useState([]);
  const [projectsList, setProjectsList] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); 

  // Modal State
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [currentEstimate, setCurrentEstimate] = useState(null);

  // --- 1. READ FROM FIREBASE ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Estimates
        const qEst = query(collection(txtdb, "estimates"), orderBy("createdAt", "desc"));
        const estSnapshot = await getDocs(qEst);
        const estData = estSnapshot.docs.map(document => ({ id: document.id, ...document.data() }));
        setEstimates(estData);

        // Fetch Clients
        const qCli = query(collection(txtdb, "clients"), orderBy("name", "asc"));
        const cliSnapshot = await getDocs(qCli);
        const cliData = cliSnapshot.docs.map(document => ({ id: document.id, name: document.data().name }));
        setClientsList(cliData);

        // Fetch Vendors
        const qVen = query(collection(txtdb, "vendors"), orderBy("name", "asc"));
        const venSnapshot = await getDocs(qVen);
        const venData = venSnapshot.docs.map(document => ({ id: document.id, name: document.data().name }));
        setVendorsList(venData);

        // Fetch Projects
        const qProj = query(collection(txtdb, "projects"), orderBy("name", "asc"));
        const projSnapshot = await getDocs(qProj);
        const projData = projSnapshot.docs.map(document => ({ 
          id: document.id, 
          name: document.data().name,
          clientId: document.data().clientId 
        }));
        setProjectsList(projData);

      } catch (error) {
        console.error("Error fetching data: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Lock scrolling when modal is open
  useEffect(() => {
    if (isBuilderOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => document.body.style.overflow = 'unset';
  }, [isBuilderOpen]);

  const filteredEstimates = estimates.filter(est => {
    const matchesSearch = (est.title && est.title.toLowerCase().includes(searchQuery.toLowerCase())) || 
                          (est.clientName && est.clientName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTab = activeTab === 'all' || est.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount || 0);
  };

  const calculateTotals = (items) => {
    if (!items || items.length === 0) return { totalCost: 0, totalPrice: 0, netProfit: 0, margin: 0 };
    
    const totalCost = items.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0);
    const totalPrice = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
    const netProfit = totalPrice - totalCost;
    const margin = totalPrice > 0 ? (netProfit / totalPrice) * 100 : 0;
    return { totalCost, totalPrice, netProfit, margin };
  };

  const handleOpenBuilder = (estimate = null) => {
    if (estimate) {
      setCurrentEstimate({ ...estimate, items: [...(estimate.items || [])] });
    } else {
      setCurrentEstimate({
        isNew: true, 
        projectId: '', 
        title: '',
        clientId: '',
        newClientName: '', // NEW: Track inline client creation
        clientName: '',
        status: 'draft',
        date: new Date().toISOString().split('T')[0],
        items: []
      });
    }
    setIsBuilderOpen(true);
  };

  const handleAddItem = () => {
    setCurrentEstimate(prev => ({
      ...prev,
      items: [...prev.items, { id: `i${Date.now()}`, type: 'material', description: '', vendorId: '', vendorName: '', cost: '', price: '' }]
    }));
  };

  const handleRemoveItem = (itemId) => {
    setCurrentEstimate(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const handleItemChange = (itemId, field, value) => {
    setCurrentEstimate(prev => {
      const updatedItems = prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'vendorId') {
            const matchedVendor = vendorsList.find(v => v.id === value);
            updatedItem.vendorName = matchedVendor ? matchedVendor.name : '';
          }
          return updatedItem;
        }
        return item;
      });
      return { ...prev, items: updatedItems };
    });
  };

  const handleProjectSelection = (selectedProjectId) => {
    const matchedProject = projectsList.find(p => p.id === selectedProjectId);
    
    if (matchedProject) {
      setCurrentEstimate(prev => ({
        ...prev,
        projectId: matchedProject.id,
        title: matchedProject.name,
        clientId: matchedProject.clientId || prev.clientId 
      }));
    }
  };

  // --- 2. WRITE/UPDATE FIREBASE ---
  const handleSaveEstimate = async (e) => {
    e.preventDefault();
    if (!currentEstimate.title || !currentEstimate.clientId) {
      alert("Please provide a title/project and select a client.");
      return;
    }

    let finalClientId = currentEstimate.clientId;
    let finalClientName = '';

    try {
      // Inline Client Creation
      if (finalClientId === 'new') {
        if (!currentEstimate.newClientName || !currentEstimate.newClientName.trim()) {
          alert("Please enter a name for the new client.");
          return;
        }

        const newClientData = {
          name: currentEstimate.newClientName,
          email: '',
          phone: '',
          address: '',
          status: 'active',
          lifetimeValue: 0,
          outstandingBalance: 0,
          projects: [], 
          createdAt: serverTimestamp()
        };

        const cDocRef = await addDoc(collection(txtdb, "clients"), newClientData);
        finalClientId = cDocRef.id;
        finalClientName = currentEstimate.newClientName;

        // Update local list instantly
        setClientsList([...clientsList, { id: finalClientId, name: finalClientName }]);
      } else {
        // Find existing client name
        const matchedClient = clientsList.find(c => c.id === finalClientId);
        finalClientName = matchedClient ? matchedClient.name : 'Unknown Client';
      }

      // Clean up empty items and ensure numbers
      const cleanedItems = currentEstimate.items.filter(i => i.description).map(i => ({
        ...i,
        cost: parseFloat(i.cost) || 0,
        price: parseFloat(i.price) || 0
      }));

      const payloadData = {
        projectId: currentEstimate.projectId || null,
        title: currentEstimate.title,
        clientId: finalClientId,
        clientName: finalClientName,
        status: currentEstimate.status,
        date: currentEstimate.date,
        items: cleanedItems
      };

      if (currentEstimate.isNew) {
        payloadData.createdAt = serverTimestamp();
        const docRef = await addDoc(collection(txtdb, "estimates"), payloadData);
        setEstimates([{ id: docRef.id, ...payloadData }, ...estimates]);
      } else {
        const estRef = doc(txtdb, "estimates", currentEstimate.id);
        await updateDoc(estRef, payloadData);
        setEstimates(estimates.map(est => est.id === currentEstimate.id ? { ...est, ...payloadData } : est));
      }

      setIsBuilderOpen(false);
    } catch (error) {
      console.error("Error saving estimate: ", error);
      alert("Failed to save estimate. Please try again.");
    }
  };

  return (
    <div className="page-wrapper">
      <Navigation />
      
      <main className="page-content">
        
        <div className="page-top-section estimates-top">
          <div className="header-titles">
            <h1>Costing & Estimates</h1>
            <p>Internal tool to break down project costs, vendors, and calculate profit margins.</p>
          </div>

          <button className="btn-primary" onClick={() => handleOpenBuilder()}>
            <Calculator size={18} />
            <span>New Estimate</span>
          </button>

          <div className="tabs">
            <button className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All</button>
            <button className={`tab ${activeTab === 'draft' ? 'active' : ''}`} onClick={() => setActiveTab('draft')}>Drafts</button>
            <button className={`tab ${activeTab === 'approved' ? 'active' : ''}`} onClick={() => setActiveTab('approved')}>Approved</button>
          </div>

          <div className="search-box est-search">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search titles or clients..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="empty-state">Loading estimates...</div>
        ) : (
          <div className="estimates-grid">
            {filteredEstimates.length === 0 ? (
              <div className="empty-state">No estimates found.</div>
            ) : (
              filteredEstimates.map(est => {
                const totals = calculateTotals(est.items);
                return (
                  <div key={est.id} className="estimate-card" onClick={() => handleOpenBuilder(est)}>
                    <div className="est-header">
                      <div className="titles">
                        <h2>{est.title}</h2>
                        <span className="client"><User size={14}/> {est.clientName}</span>
                      </div>
                      <span className={`status-badge ${est.status}`}>{est.status}</span>
                    </div>

                    <div className="est-body">
                      <div className="fin-row">
                        <span className="lbl">Total Cost (Our Cost)</span>
                        <span className="val text-danger">{formatCurrency(totals.totalCost)}</span>
                      </div>
                      <div className="fin-row">
                        <span className="lbl">Total Price (Client Pays)</span>
                        <span className="val">{formatCurrency(totals.totalPrice)}</span>
                      </div>
                    </div>

                    <div className="est-footer">
                      <div className="profit-box">
                        <span className="lbl">Projected Profit</span>
                        <span className="val text-success">+{formatCurrency(totals.netProfit)}</span>
                      </div>
                      <div className="margin-box">
                        <span className="lbl">Margin</span>
                        <span className="val">{totals.margin.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </main>

      {/* ESTIMATE BUILDER MODAL */}
      {isBuilderOpen && currentEstimate && (
        <div className="modal-overlay" onClick={() => setIsBuilderOpen(false)}>
          <div className="modal-container builder-modal action-modal" onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header">
              <div className="header-left">
                <Calculator size={20} className="text-muted" />
                <h2>{currentEstimate.status === 'draft' ? 'Estimate Builder' : 'View Estimate'}</h2>
              </div>
              <button className="close-btn" onClick={() => setIsBuilderOpen(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveEstimate} className="builder-layout">
              
              <div className="builder-scroll-content">
                
                {/* 1. Basic Info */}
                <div className="builder-section basic-info">
                  
                  <div className="form-group">
                    <label>Estimate Status</label>
                    <div className="type-toggle">
                      <button 
                        type="button" 
                        className={`toggle-btn ${currentEstimate.status === 'draft' ? 'active' : ''}`} 
                        onClick={() => setCurrentEstimate({...currentEstimate, status: 'draft'})}
                      >
                        Draft (Planning)
                      </button>
                      <button 
                        type="button" 
                        className={`toggle-btn ${currentEstimate.status === 'approved' ? 'active' : ''}`} 
                        onClick={() => setCurrentEstimate({...currentEstimate, status: 'approved'})}
                      >
                        Approved (Active Project)
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    
                    <div className="form-group">
                      <label>{currentEstimate.status === 'draft' ? 'Draft Title / Project Name' : 'Select Active Project'}</label>
                      {currentEstimate.status === 'draft' ? (
                        <input 
                          type="text" 
                          placeholder="e.g. Master Bath Renovation" 
                          value={currentEstimate.title} 
                          onChange={(e) => setCurrentEstimate({...currentEstimate, title: e.target.value})} 
                          required 
                        />
                      ) : (
                        <select 
                          className="standard-select" 
                          value={currentEstimate.projectId || ''} 
                          onChange={(e) => handleProjectSelection(e.target.value)}
                          required
                        >
                          <option value="" disabled>-- Choose an Active Project --</option>
                          {projectsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label>Select Client</label>
                      <select 
                        className="standard-select" 
                        value={currentEstimate.clientId} 
                        onChange={(e) => setCurrentEstimate({...currentEstimate, clientId: e.target.value})} 
                        required
                      >
                        <option value="" disabled>-- Select a Client --</option>
                        <option value="new" style={{ fontWeight: 'bold', color: '#0f172a' }}>+ Add New Client</option>
                        {clientsList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>

                      {/* INLINE NEW CLIENT CREATION */}
                      {currentEstimate.clientId === 'new' && (
                        <div style={{ marginTop: '0.75rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px dashed #cbd5e1' }}>
                          <input 
                            type="text" 
                            placeholder="Enter new client's full name" 
                            value={currentEstimate.newClientName || ''} 
                            onChange={(e) => setCurrentEstimate({...currentEstimate, newClientName: e.target.value})} 
                            required={currentEstimate.clientId === 'new'}
                            style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none' }}
                          />
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                {/* 2. Line Items (Cost Breakdown) */}
                <div className="builder-section items-section">
                  <div className="section-head">
                    <h3>Cost Breakdown & Pricing</h3>
                    <button type="button" className="btn-text" onClick={handleAddItem}>
                      <Plus size={16} /> Add Item
                    </button>
                  </div>

                  <div className="line-items-container">
                    {currentEstimate.items.length === 0 ? (
                      <div className="empty-items">Click "Add Item" to start costing this project.</div>
                    ) : (
                      currentEstimate.items.map((item, idx) => (
                        <div key={item.id} className="line-item-card">
                          <div className="item-header">
                            <span className="item-num">#{idx + 1}</span>
                            <button type="button" className="del-btn" onClick={() => handleRemoveItem(item.id)}><Trash2 size={16}/></button>
                          </div>
                          
                          <div className="item-grid">
                            <div className="input-group">
                              <label>Type</label>
                              <div className="type-toggle minimal">
                                <button type="button" className={`toggle-btn ${item.type === 'material' ? 'active' : ''}`} onClick={() => handleItemChange(item.id, 'type', 'material')}><Package size={14}/> Mat.</button>
                                <button type="button" className={`toggle-btn ${item.type === 'labor' ? 'active' : ''}`} onClick={() => handleItemChange(item.id, 'type', 'labor')}><HardHat size={14}/> Labor</button>
                              </div>
                            </div>
                            
                            <div className="input-group wide">
                              <label>Description (What are we doing/buying?)</label>
                              <input type="text" placeholder="e.g. Custom Cabinets" value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} required />
                            </div>

                            <div className="input-group">
                              <label>Vendor / Worker</label>
                              <select 
                                className="standard-select" 
                                value={item.vendorId} 
                                onChange={(e) => handleItemChange(item.id, 'vendorId', e.target.value)}
                              >
                                <option value="">-- Internal / Unassigned --</option>
                                {vendorsList.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                              </select>
                            </div>

                            <div className="input-group money-input">
                              <label className="text-danger">Our Cost (₦)</label>
                              <input type="number" min="0" step="0.01" placeholder="0.00" value={item.cost} onChange={(e) => handleItemChange(item.id, 'cost', e.target.value)} />
                            </div>

                            <div className="input-group money-input">
                              <label className="text-success">Charge Client (₦)</label>
                              <input type="number" min="0" step="0.01" placeholder="0.00" value={item.price} onChange={(e) => handleItemChange(item.id, 'price', e.target.value)} />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Fixed Bottom Footer (Live Calculator) */}
              <div className="builder-footer">
                <div className="live-totals">
                  {(() => {
                    const totals = calculateTotals(currentEstimate.items);
                    return (
                      <>
                        <div className="tot-block">
                          <span className="lbl">Total Cost</span>
                          <span className="val text-danger">{formatCurrency(totals.totalCost)}</span>
                        </div>
                        <ArrowRight size={20} className="text-light arrow-hide-mobile" />
                        <div className="tot-block">
                          <span className="lbl">Total Price</span>
                          <span className="val">{formatCurrency(totals.totalPrice)}</span>
                        </div>
                        <div className="tot-divider"></div>
                        <div className="tot-block highlight">
                          <span className="lbl">Est. Profit</span>
                          <span className={`val ${totals.netProfit < 0 ? 'text-danger' : 'text-success'}`}>
                            {totals.netProfit < 0 ? '-' : '+'}{formatCurrency(Math.abs(totals.netProfit))}
                          </span>
                          <span className="margin-pill">{totals.margin.toFixed(1)}% Margin</span>
                        </div>
                      </>
                    )
                  })()}
                </div>

                <div className="footer-actions">
                  <button type="button" className="btn-secondary" onClick={() => setIsBuilderOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Save Estimate</button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Estimates;