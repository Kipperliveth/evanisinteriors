import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { Search, Plus, X, Users, Truck, HardHat, Briefcase } from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { collection, getDocs, addDoc, serverTimestamp, orderBy, query, where } from "firebase/firestore"; 
import { txtdb } from '../../../firebase-config';

const Skeleton = ({ width = '100%', height = '0.875rem' }) => (
  <span className="vw-skeleton" style={{ width, height }} />
);

const getTime = (tx) => (tx.createdAt?.toDate ? tx.createdAt.toDate().getTime() : 0);

// Repayments are applied to the oldest unpaid balances first.
// What's left tells us which projects the worker is still owed from (newest first).
const buildOwedProjects = (transactions) => {
  const byVendor = {};
  transactions.forEach(tx => {
    if (!tx.vendorId) return;
    if (!byVendor[tx.vendorId]) byVendor[tx.vendorId] = [];
    byVendor[tx.vendorId].push(tx);
  });

  const result = {};
  Object.keys(byVendor).forEach(vendorId => {
    const list = byVendor[vendorId].sort((a, b) => getTime(a) - getTime(b)); // oldest first

    let repaid = list
      .filter(t => t.isRepayment)
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const debts = list
      .filter(t => !t.isRepayment && (t.balanceAmount || 0) > 0)
      .map(t => ({ key: t.projectId || t.project, name: t.project || 'Unknown project', remaining: t.balanceAmount }));

    debts.forEach(d => {
      const used = Math.min(d.remaining, repaid);
      d.remaining -= used;
      repaid -= used;
    });

    const seen = new Set();
    const projects = [];
    debts
      .filter(d => d.remaining > 0)
      .reverse() // newest first
      .forEach(d => {
        if (!seen.has(d.key)) {
          seen.add(d.key);
          projects.push(d.name);
        }
      });

    result[vendorId] = projects;
  });

  return result;
};

function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); 
  const [showOwedOnly, setShowOwedOnly] = useState(false);

  const [isLoadingOwed, setIsLoadingOwed] = useState(true);
  const [owedProjects, setOwedProjects] = useState({}); // { vendorId: [project names, newest first] }

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

      // Work out which projects each worker's outstanding balance is still coming from
      try {
        const txQuery = query(collection(txtdb, "transactions"), where("category", "==", "Worker Allocation"));
        const txSnapshot = await getDocs(txQuery);
        const allTx = txSnapshot.docs.map(document => ({ id: document.id, ...document.data() }));
        setOwedProjects(buildOwedProjects(allTx));
      } catch (error) {
        console.error("Error fetching owed projects: ", error);
      } finally {
        setIsLoadingOwed(false);
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
    const matchesOwed = !showOwedOnly || (v.outstandingBalance || 0) > 0;
    return matchesSearch && matchesTab && matchesOwed;
  });

  const totalOwed = vendors.reduce((sum, v) => sum + (v.outstandingBalance || 0), 0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getOwedLabel = (vendorId) => {
    const projects = owedProjects[vendorId] || [];
    if (projects.length === 0) return null;
    if (projects.length === 1) return projects[0];
    return `${projects[0]} +${projects.length - 1} more`;
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
            <button className={`vw-tab ${activeTab === 'temporary' ? 'active' : ''}`} onClick={() => setActiveTab('temporary')}>Temporary</button>
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

        {/* SUMMARY STRIP */}
        <div className="vw-summary-strip">
          <button
            type="button"
            className={`vw-summary-item clickable ${showOwedOnly ? 'active' : ''}`}
            onClick={() => setShowOwedOnly(!showOwedOnly)}
          >
            <span className="vw-lbl">Total Amount Owed</span>
            <span className="vw-val vw-text-danger">{isLoading ? <Skeleton width="8rem" height="1.5rem" /> : formatCurrency(totalOwed)}</span>
            <span className="vw-hint">{showOwedOnly ? 'Showing only people you owe. Click to show everyone.' : 'Click to show only people you owe.'}</span>
          </button>
          <div className="vw-summary-item">
            <span className="vw-lbl">Active Profiles</span>
            <span className="vw-val">{isLoading ? <Skeleton width="3rem" height="1.5rem" /> : vendors.length}</span>
          </div>
        </div>

        <div className="vw-swipe-indicator">
          Swipe to see more details &rarr;
        </div>

        {/* DIRECTORY TABLE */}
        <div className="vw-table-container">
          {isLoading ? (
            <table className="vw-directory-table" aria-busy="true">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Outstanding</th>
                  <th>Total Spent</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="vw-skeleton-row">
                    <td><Skeleton width="55%" /></td>
                    <td><Skeleton width="45%" /><Skeleton width="30%" height="0.625rem" /></td>
                    <td><Skeleton width="50%" /></td>
                    <td><Skeleton width="40%" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : filteredVendors.length === 0 ? (
            <div className="vw-empty-state">{showOwedOnly ? 'You don\'t owe anyone right now.' : 'No workers or vendors found.'}</div>
          ) : (
            <table className="vw-directory-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Outstanding</th>
                  <th>Total Spent</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map(vendor => {
                  const owed = vendor.outstandingBalance || 0;
                  const owedLabel = owed > 0 ? getOwedLabel(vendor.id) : null;
                  return (
                    <tr key={vendor.id} onClick={() => setSelectedVendor(vendor)}>
                      <td className="vw-col-name"><strong>{vendor.name || 'Unnamed'}</strong></td>
                      <td className="vw-col-owed">
                        <span className={owed > 0 ? 'vw-text-danger' : 'vw-text-muted'}>{formatCurrency(owed)}</span>
                        {owed > 0 && isLoadingOwed && <Skeleton width="5rem" height="0.625rem" />}
                        {owedLabel && <span className="vw-owed-projects">{owedLabel}</span>}
                      </td>
                      <td className="vw-col-spent">{formatCurrency(vendor.totalSpent)}</td>
                      <td className="vw-col-type">
                        <span className="vw-type-label">{getTypeIcon(vendor.type)} {vendor.type}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* ADD VENDOR MODAL */}
      {isModalOpen && (
        <div className="vw-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="vw-modal-container vw-action-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vw-modal-header">
              <div className="vw-header-left">
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
          <div className="vw-modal-container vw-profile-modal" onClick={(e) => e.stopPropagation()}>
            
            <div className="vw-modal-header">
              <div className="vw-header-left">
                <h2>{selectedVendor.name}</h2>
                <span className="vw-type-label">{getTypeIcon(selectedVendor.type)} {selectedVendor.type}</span>
              </div>
              <button className="vw-close-btn" onClick={() => setSelectedVendor(null)}><X size={20} /></button>
            </div>

            <div className="vw-profile-content">
              
              <div className="vw-ledger-snapshot">
                <div className="vw-snap-box">
                  <span className="vw-lbl">Total Historical Spend</span>
                  <span className="vw-val">{formatCurrency(selectedVendor.totalSpent)}</span>
                </div>
                <div className="vw-snap-box outstanding">
                  <span className="vw-lbl">Currently Owed</span>
                  <span className={`vw-val ${selectedVendor.outstandingBalance > 0 ? 'vw-text-danger' : 'vw-text-success'}`}>
                    {formatCurrency(selectedVendor.outstandingBalance)}
                  </span>
                </div>
              </div>

              <h3 className="vw-section-heading">Payment History</h3>

              <div className="vw-history-container">
                {isLoadingHistory ? (
                  <table className="vw-history-table" aria-busy="true">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Item / Project</th>
                        <th className="right">Paid</th>
                        <th className="right">Owed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i}>
                          <td><Skeleton width="4.5rem" /></td>
                          <td><Skeleton width="70%" /><Skeleton width="40%" height="0.625rem" /></td>
                          <td className="right"><Skeleton width="4rem" /></td>
                          <td className="right"><Skeleton width="3rem" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : vendorTransactions.length === 0 ? (
                  <div className="vw-empty-state">No payments logged for this worker yet.</div>
                ) : (
                  <table className="vw-history-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Item / Project</th>
                        <th className="right">Paid</th>
                        <th className="right">Owed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendorTransactions.map(tx => (
                        <tr key={tx.id}>
                          <td className="vw-col-date">{formatDate(tx.date)}</td>
                          <td className="vw-col-desc">
                            <strong>{tx.description}</strong>
                            <span>{tx.project}{tx.isRepayment ? ' · Repayment' : ''}</span>
                          </td>
                          <td className="right vw-col-paid">{formatCurrency(tx.amount)}</td>
                          <td className={`right vw-col-owed ${tx.balanceAmount > 0 ? 'vw-text-danger' : 'vw-text-muted'}`}>
                            {formatCurrency(tx.balanceAmount || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Vendors;