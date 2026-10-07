import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { Search, Plus, X, Users, Truck, HardHat, Briefcase, CreditCard, ArrowUpRight, Loader } from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { collection, getDocs, addDoc, serverTimestamp, orderBy, query, where } from "firebase/firestore"; 
import { txtdb } from '../../../firebase-config';

function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);

  const [vendorTransactions, setVendorTransactions] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'subcontractor'
  });

  // --- 1. READ VENDORS FROM FIREBASE ---
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const q = query(collection(txtdb, "vendors"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const vendorsData = querySnapshot.docs.map(document => ({
          id: document.id,
          ...document.data()
        }));
        
        setVendors(vendorsData);
      } catch (error) {
        console.error("Error fetching vendors: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendors();
  }, []);

  // --- 2. FETCH TRANSACTION HISTORY WHEN A VENDOR IS SELECTED ---
  useEffect(() => {
    const fetchVendorHistory = async () => {
      if (!selectedVendor) {
        setVendorTransactions([]);
        return;
      }

      setIsLoadingHistory(true);
      try {
        const q = query(collection(txtdb, "transactions"), where("vendorId", "==", selectedVendor.id));
        const querySnapshot = await getDocs(q);
        
        const historyData = querySnapshot.docs.map(document => ({
          id: document.id,
          ...document.data()
        }));

        // Sort newest first
        historyData.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return dateB - dateA; 
        });

        setVendorTransactions(historyData);

      } catch (error) {
        console.error("Error fetching vendor history: ", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchVendorHistory();
  }, [selectedVendor?.id]);

  useEffect(() => {
    if (isModalOpen || selectedVendor) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => document.body.style.overflow = 'unset';
  }, [isModalOpen, selectedVendor]);

  const filteredVendors = vendors.filter(v => {
    const matchesSearch = (v.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || v.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const totalOwed = vendors.reduce((sum, v) => sum + (v.outstandingBalance || 0), 0);
  const totalHistoricalSpend = vendors.reduce((sum, v) => sum + (v.totalSpent || 0), 0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getInitials = (name) => {
    if (!name) return 'V';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'supplier': return <Truck size={14} />;
      case 'subcontractor': return <HardHat size={14} />;
      case 'staff': return <Briefcase size={14} />;
      default: return <Users size={14} />;
    }
  };

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      const newVendorData = {
        name: formData.name,
        type: formData.type,
        totalSpent: 0,
        outstandingBalance: 0,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(txtdb, "vendors"), newVendorData);

      setVendors([{ id: docRef.id, ...newVendorData, createdAt: new Date() }, ...vendors]);
      
      setIsModalOpen(false);
      setFormData({ name: '', type: 'subcontractor' });
      
    } catch (error) {
      console.error("Error adding vendor: ", error);
      alert("Failed to save. Please try again.");
    }
  };

  return (
    <div className="vw-page-wrapper">
      <Navigation />
      
      <main className="vw-main-content">
        
        <div className="vw-top-section">
          <div className="vw-header-titles">
            <h1>Workers & Vendors</h1>
            <p>Directory of subcontractors, suppliers, and staff.</p>
          </div>

          <button className="vw-btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            <span>Add Profile</span>
          </button>

          <div className="vw-tabs">
            <button className={`vw-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All</button>
            <button className={`vw-tab ${activeTab === 'supplier' ? 'active' : ''}`} onClick={() => setActiveTab('supplier')}>Suppliers</button>
            <button className={`vw-tab ${activeTab === 'subcontractor' ? 'active' : ''}`} onClick={() => setActiveTab('subcontractor')}>Subcontractors</button>
            <button className={`vw-tab ${activeTab === 'staff' ? 'active' : ''}`} onClick={() => setActiveTab('staff')}>Staff</button>
          </div>

          <div className="vw-search-box">
            <Search size={18} className="vw-search-icon" />
            <input 
              type="text" 
              placeholder="Search names..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="vw-metrics-grid">
          <div className="vw-metric-card alert">
            <div className="vw-card-icon"><ArrowUpRight size={20} /></div>
            <div className="vw-card-info">
              <span className="vw-lbl">Total Owed (Payables)</span>
              <span className="vw-val vw-text-danger">{formatCurrency(totalOwed)}</span>
            </div>
          </div>
          <div className="vw-metric-card">
            <div className="vw-card-icon"><CreditCard size={20} className="vw-text-main" /></div>
            <div className="vw-card-info">
              <span className="vw-lbl">Total Historical Spend</span>
              <span className="vw-val">{formatCurrency(totalHistoricalSpend)}</span>
            </div>
          </div>
          <div className="vw-metric-card">
            <div className="vw-card-icon"><Users size={20} className="vw-text-main" /></div>
            <div className="vw-card-info">
              <span className="vw-lbl">Active Profiles</span>
              <span className="vw-val">{vendors.length}</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="vw-empty-state">Loading directory from database...</div>
        ) : (
          <div className="vw-directory-grid">
            {filteredVendors.length === 0 ? (
              <div className="vw-empty-state">No workers or vendors found.</div>
            ) : (
              filteredVendors.map(vendor => (
                <div key={vendor.id} className="vw-profile-card" onClick={() => setSelectedVendor(vendor)}>
                  
                  {/* Avatar, Name, and Role */}
                  <div className="vw-card-header">
                    <div className={`vw-avatar ${vendor.type}`}>
                      {getInitials(vendor.name)}
                    </div>
                    <div className="vw-user-info">
                      <h2>{vendor.name}</h2>
                      <span className="vw-role">{vendor.type}</span>
                    </div>
                  </div>

                  <div className="vw-card-divider"></div>

                  {/* Financials */}
                  <div className="vw-card-financials">
                    <div className="vw-fin-metric">
                      <span className="vw-lbl">Total Spent</span>
                      <span className="vw-val">{formatCurrency(vendor.totalSpent)}</span>
                    </div>
                    <div className="vw-fin-metric right">
                      <span className="vw-lbl">Outstanding</span>
                      <span className={`vw-val ${vendor.outstandingBalance > 0 ? 'vw-text-danger' : 'vw-text-success'}`}>
                        {formatCurrency(vendor.outstandingBalance)}
                      </span>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* ADD VENDOR MODAL */}
      {isModalOpen && (
        <div className="vw-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="vw-modal-container vw-action-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vw-modal-header">
              <div className="vw-header-left">
                <Users size={20} className="vw-text-muted" />
                <h2>Add Worker or Vendor</h2>
              </div>
              <button className="vw-close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateVendor} className="vw-modal-form">
              <div className="vw-form-content">
                <div className="vw-form-group">
                  <label>Profile Type</label>
                  <div className="vw-type-toggle">
                    <button type="button" className={`vw-toggle-btn ${formData.type === 'subcontractor' ? 'active' : ''}`} onClick={() => setFormData({...formData, type: 'subcontractor'})}>
                      <HardHat size={16}/> Subcontractor
                    </button>
                    <button type="button" className={`vw-toggle-btn ${formData.type === 'supplier' ? 'active' : ''}`} onClick={() => setFormData({...formData, type: 'supplier'})}>
                      <Truck size={16}/> Supplier
                    </button>
                    <button type="button" className={`vw-toggle-btn ${formData.type === 'staff' ? 'active' : ''}`} onClick={() => setFormData({...formData, type: 'staff'})}>
                      <Briefcase size={16}/> Staff
                    </button>
                  </div>
                </div>

                <div className="vw-form-group">
                  <label>Worker / Company Name</label>
                  <input type="text" placeholder="e.g. Adams or Home Depot" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                </div>
              </div>

              <div className="vw-modal-footer">
                <button type="button" className="vw-btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="vw-btn-primary">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VENDOR PROFILE MODAL */}
      {selectedVendor && (
        <div className="vw-modal-overlay" onClick={() => setSelectedVendor(null)}>
          <div className="vw-modal-container vw-profile-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            
            <div className="vw-modal-header">
              <div className="vw-header-left">
                <div className={`vw-avatar-small ${selectedVendor.type}`}>
                  {getInitials(selectedVendor.name)}
                </div>
                <h2>{selectedVendor.name}</h2>
              </div>
              <button className="vw-close-btn" onClick={() => setSelectedVendor(null)}><X size={20} /></button>
            </div>

            <div className="vw-profile-content">
              
              <div className="vw-ledger-snapshot">
                <div className="vw-snap-box">
                  <span className="vw-lbl">Total Historical Spend</span>
                  <span className="vw-val">{formatCurrency(selectedVendor.totalSpent)}</span>
                </div>
                <div className="vw-snap-divider"></div>
                <div className="vw-snap-box outstanding">
                  <span className="vw-lbl">Currently Owed</span>
                  <span className={`vw-val ${selectedVendor.outstandingBalance > 0 ? 'vw-text-danger' : 'vw-text-success'}`}>
                    {formatCurrency(selectedVendor.outstandingBalance)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f1f5f9', margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment History</h3>
                
                <div className="vw-history-list">
                  {isLoadingHistory ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                      <Loader size={16} className="animate-spin" /> Fetching history...
                    </div>
                  ) : vendorTransactions.length === 0 ? (
                    <div className="empty-text">
                      No payments logged for this worker yet.
                    </div>
                  ) : (
                    vendorTransactions.map(tx => (
                      <div key={tx.id} className="vw-history-item">
                        <div className="tx-top">
                          <strong>{tx.description}</strong>
                          <span>{formatDate(tx.date)}</span>
                        </div>
                        
                        <div className="tx-project">Project: {tx.project}</div>
                        
                        <div className="tx-bottom">
                          <span className="paid">Paid: {formatCurrency(tx.amount)}</span>
                          <span className={`owed ${tx.balanceAmount > 0 ? 'vw-text-danger' : 'vw-text-muted'}`}>
                            Owed: {formatCurrency(tx.balanceAmount || 0)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Vendors;