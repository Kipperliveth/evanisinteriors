import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { Search, Plus, X, Users, Truck, HardHat, Briefcase, Phone, FileText, CreditCard, ArrowUpRight, Loader } from 'lucide-react';

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
    type: 'supplier',
    phone: '',
    terms: 'Due on Delivery'
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
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
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
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase());
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
        phone: formData.phone,
        terms: formData.terms,
        totalSpent: 0,
        outstandingBalance: 0,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(txtdb, "vendors"), newVendorData);

      setVendors([{ id: docRef.id, ...newVendorData }, ...vendors]);
      
      setIsModalOpen(false);
      setFormData({ name: '', type: 'supplier', phone: '', terms: 'Due on Delivery' });
      
    } catch (error) {
      console.error("Error adding vendor: ", error);
      alert("Failed to save vendor. Please try again.");
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
              <span className="vw-lbl">Active Workers</span>
              <span className="vw-val">{vendors.length}</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="vw-empty-state">Loading directory from database...</div>
        ) : (
          <div className="vw-directory-grid">
            {filteredVendors.length === 0 ? (
              <div className="vw-empty-state">No workers or vendors found matching your filters.</div>
            ) : (
              filteredVendors.map(vendor => (
                <div key={vendor.id} className="vw-profile-card" onClick={() => setSelectedVendor(vendor)}>
                  
                  {/* Avatar, Name, and Role in a Single Row */}
                  <div className="vw-card-header">
                    <div className={`vw-avatar ${vendor.type}`}>
                      {getInitials(vendor.name)}
                    </div>
                    <div className="vw-user-info">
                      <h2>{vendor.name}</h2>
                      <span className="vw-role">{vendor.type}</span>
                    </div>
                  </div>

                  {/* Contact Info (Clean List) */}
                  <div className="vw-card-contact">
                    <div className="vw-contact-item">
                      <Phone size={16} />
                      <span>
                        {vendor.phone ? (
                          <a href={`tel:${vendor.phone}`} onClick={(e) => e.stopPropagation()}>
                            {vendor.phone}
                          </a>
                        ) : (
                          'No phone'
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="vw-card-divider"></div>

                  {/* Financials */}
                  <div className="vw-card-financials">
                    <div className="vw-fin-metric">
                      <span className="vw-lbl">Total Spent</span>
                      <span className="vw-val">{formatCurrency(vendor.totalSpent)}</span>
                    </div>
                    <div className="vw-fin-metric">
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
                    <button type="button" className={`vw-toggle-btn ${formData.type === 'supplier' ? 'active' : ''}`} onClick={() => setFormData({...formData, type: 'supplier'})}>
                      <Truck size={16}/> Supplier
                    </button>
                    <button type="button" className={`vw-toggle-btn ${formData.type === 'subcontractor' ? 'active' : ''}`} onClick={() => setFormData({...formData, type: 'subcontractor'})}>
                      <HardHat size={16}/> Subcontractor
                    </button>
                    <button type="button" className={`vw-toggle-btn ${formData.type === 'staff' ? 'active' : ''}`} onClick={() => setFormData({...formData, type: 'staff'})}>
                      <Briefcase size={16}/> Staff
                    </button>
                  </div>
                </div>

                <div className="vw-form-group">
                  <label>Company / Individual Name</label>
                  <input type="text" placeholder="e.g. Home Depot or John Doe" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                </div>

                <div className="vw-form-group">
                  <label>Phone Number (Optional)</label>
                  <input type="tel" placeholder="(555) 000-0000" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>

                <div className="vw-form-group">
                  <label>Payment Terms</label>
                  <select className="vw-standard-select" value={formData.terms} onChange={(e) => setFormData({...formData, terms: e.target.value})}>
                    <option value="Due on Delivery">Due on Delivery</option>
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Net 60">Net 60 Days</option>
                    <option value="Weekly Payroll">Weekly Payroll</option>
                    <option value="Bi-Weekly Payroll">Bi-Weekly Payroll</option>
                    <option value="Monthly Payroll">Monthly Payroll</option>
                  </select>
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
          <div className="vw-modal-container vw-profile-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            
            <div className="vw-modal-header">
              <div className="vw-header-left">
                <div className={`vw-avatar-small ${selectedVendor.type}`}>
                  {getInitials(selectedVendor.name)}
                </div>
                <h2>{selectedVendor.name}</h2>
              </div>
              <button className="vw-close-btn" onClick={() => setSelectedVendor(null)}><X size={20} /></button>
            </div>

            <div className="vw-profile-content" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
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

              <div className="vw-profile-body-grid">
                
                <div className="vw-profile-details-grid" style={{ marginBottom: 0 }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1rem 0', textTransform: 'uppercase' }}>Contact Info</h3>
                  <div className="vw-detail-row">
                    <span className="vw-lbl"><Phone size={16}/> Phone</span>
                    <span className="vw-val">
                      {selectedVendor.phone ? (
                        <a href={`tel:${selectedVendor.phone}`}>{selectedVendor.phone}</a>
                      ) : (
                        'N/A'
                      )}
                    </span>
                  </div>
                  <div className="vw-detail-row">
                    <span className="vw-lbl"><FileText size={16}/> Terms</span>
                    <span className="vw-val"><strong>{selectedVendor.terms}</strong></span>
                  </div>
                  <div className="vw-detail-row">
                    <span className="vw-lbl"><Briefcase size={16}/> Class</span>
                    <span className="vw-val" style={{textTransform: 'capitalize'}}>{selectedVendor.type}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1rem 0', textTransform: 'uppercase' }}>Payment History</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {isLoadingHistory ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.875rem' }}>
                        <Loader size={16} className="animate-spin" /> Fetching history...
                      </div>
                    ) : vendorTransactions.length === 0 ? (
                      <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', color: '#64748b', fontSize: '0.875rem', textAlign: 'center' }}>
                        No payments logged for this worker yet.
                      </div>
                    ) : (
                      vendorTransactions.map(tx => (
                        <div key={tx.id} style={{ padding: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <strong style={{ color: '#0f172a', fontSize: '0.9375rem' }}>{tx.description}</strong>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{formatDate(tx.date)}</span>
                          </div>
                          
                          <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>Project: {tx.project}</div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
                            <span style={{ fontSize: '0.875rem', color: '#0f172a', fontWeight: '600' }}>Paid: {formatCurrency(tx.amount)}</span>
                            
                            <span style={{ fontSize: '0.875rem', color: (tx.balanceAmount > 0) ? '#ef4444' : '#94a3b8', fontWeight: '600' }}>
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
        </div>
      )}

    </div>
  );
}

export default Vendors;