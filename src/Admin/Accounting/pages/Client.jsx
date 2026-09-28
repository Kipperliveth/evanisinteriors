import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { Search, Plus, Mail, Phone, MapPin, User, FolderKanban, Wallet, X, ArrowUpRight, Loader } from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp, orderBy, query, where } from "firebase/firestore"; 
import { txtdb } from '../../../firebase-config';

function Client() {
  const navigate = useNavigate();
  const location = useLocation();

  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null); 
  
  const [clientProjects, setClientProjects] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });

  // --- 1. READ CLIENTS FROM FIREBASE ---
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const q = query(collection(txtdb, "clients"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const clientsData = querySnapshot.docs.map(document => ({
          id: document.id,
          ...document.data()
        }));
        
        setClients(clientsData);
      } catch (error) {
        console.error("Error fetching clients: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  // --- 2. FETCH PROJECTS & AUTO-HEAL CLIENT FINANCIALS ---
  useEffect(() => {
    const fetchClientProjects = async () => {
      if (!selectedClient) {
        setClientProjects([]);
        return;
      }

      setIsLoadingProjects(true);
      try {
        const q = query(collection(txtdb, "projects"), where("clientId", "==", selectedClient.id));
        const querySnapshot = await getDocs(q);
        
        const projectsData = querySnapshot.docs.map(document => ({
          id: document.id,
          ...document.data()
        }));

        projectsData.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB - dateA; 
        });

        setClientProjects(projectsData);

        // === SELF-HEALING LOGIC ===
        // Calculate the TRUE values based on the projects that actually exist right now
        const actualLTV = projectsData.reduce((sum, p) => sum + (Number(p.billed) || 0), 0);
        const actualPaid = projectsData.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
        const actualOutstanding = actualLTV - actualPaid;

        // If the database has old/wrong data (due to manual deletion or transaction updates), FIX IT
        if (selectedClient.lifetimeValue !== actualLTV || selectedClient.outstandingBalance !== actualOutstanding) {
          
          // 1. Update Firebase
          const clientRef = doc(txtdb, "clients", selectedClient.id);
          await updateDoc(clientRef, {
            lifetimeValue: actualLTV,
            outstandingBalance: actualOutstanding
          });

          // 2. Update Local UI Lists instantly
          setClients(prevClients => prevClients.map(c => 
            c.id === selectedClient.id 
              ? { ...c, lifetimeValue: actualLTV, outstandingBalance: actualOutstanding } 
              : c
          ));

          // 3. Update the modal we are currently looking at
          setSelectedClient(prev => ({
            ...prev,
            lifetimeValue: actualLTV,
            outstandingBalance: actualOutstanding
          }));
        }

      } catch (error) {
        console.error("Error fetching client projects: ", error);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    // We only trigger this when the ID changes to prevent infinite loops from self-healing updates
    fetchClientProjects();
  }, [selectedClient?.id]); 

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const clientIdFromUrl = params.get('clientId');
    if (clientIdFromUrl && clients.length > 0) {
      const foundClient = clients.find(c => c.id === clientIdFromUrl);
      if (foundClient) setSelectedClient(foundClient);
    }
  }, [location.search, clients]);

  useEffect(() => {
    if (isNewClientModalOpen || selectedClient) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => document.body.style.overflow = 'unset';
  }, [isNewClientModalOpen, selectedClient]);

  const filteredClients = clients.filter(client => {
    const matchesTab = client.status === activeTab;
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount || 0);
  };

  const getInitials = (name) => {
    if (!name) return 'C';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // --- 3. CREATE CLIENT ---
  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      const newClientData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        status: 'active',
        lifetimeValue: 0,
        outstandingBalance: 0,
        projects: [], 
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(txtdb, "clients"), newClientData);

      setClients([{ id: docRef.id, ...newClientData }, ...clients]);
      
      setIsNewClientModalOpen(false);
      setFormData({ name: '', email: '', phone: '', address: '' });
      setActiveTab('active');
    } catch (error) {
      console.error("Error creating client: ", error);
      alert("Failed to save client. Please try again.");
    }
  };

  return (
    <div className="page-wrapper">
      <Navigation />
      
      <main className="page-content">
        
        <div className="page-top-section crm-top-section">
          <div className="header-titles">
            <h1>Client Directory</h1>
            <p>Manage relationships, contact info, and lifetime value.</p>
          </div>

          <button className="btn-primary" onClick={() => setIsNewClientModalOpen(true)}>
            <Plus size={18} />
            <span>New Client</span>
          </button>

          <div className="tabs">
            <button className={`tab ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>Active Clients</button>
            <button className={`tab ${activeTab === 'past' ? 'active' : ''}`} onClick={() => setActiveTab('past')}>Past Clients</button>
          </div>

          <div className="search-box crm-search">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="client-grid">
          {isLoading ? (
            <div className="empty-state">Loading clients from database...</div>
          ) : filteredClients.length === 0 ? (
            <div className="empty-state">No clients match your search in this category.</div>
          ) : (
            filteredClients.map((client) => (
              <div key={client.id} className="client-card" onClick={() => setSelectedClient(client)}>
                
                <div className="client-header">
                  <div className="avatar">{getInitials(client.name)}</div>
                  <div className="info">
                    <h2>{client.name}</h2>
                    <span className={`client-status ${client.status}`}>{client.status}</span>
                  </div>
                </div>

                <div className="client-contact">
                  <div className="contact-item">
                    <Mail size={20} />
                    <span>{client.email || 'No email provided'}</span>
                  </div>
                  <div className="contact-item">
                    <Phone size={20} />
                    <span>{client.phone || 'No phone provided'}</span>
                  </div>
                </div>

                <div className="client-financials">
                  <div className="fin-metric">
                    <span className="lbl">Lifetime Value</span>
                    <span className="val">{formatCurrency(client.lifetimeValue)}</span>
                  </div>
                  <div className="fin-metric">
                    <span className="lbl">Outstanding</span>
                    <span className={`val ${client.outstandingBalance > 0 ? 'text-warning' : 'text-success'}`}>
                      {formatCurrency(client.outstandingBalance)}
                    </span>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      </main>

      {isNewClientModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewClientModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Client</h2>
              <button className="close-btn" onClick={() => setIsNewClientModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateClient} className="modal-form">
              <div className="form-group">
                <label>Client / Company Name</label>
                <input type="text" placeholder="e.g. Sarah Johnson" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" placeholder="sarah@example.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="tel" placeholder="(555) 000-0000" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>

              <div className="form-group">
                <label>Billing / Project Address</label>
                <input type="text" placeholder="123 Main St, City, State" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsNewClientModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Client</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedClient && (
        <div className="modal-overlay" onClick={() => {
          setSelectedClient(null);
          navigate('/clients', { replace: true }); 
        }}>
          <div className="modal-container client-profile-modal" onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="avatar-small">{getInitials(selectedClient.name)}</div>
                <h2>{selectedClient.name} Profile</h2>
              </div>
              <button className="close-btn" onClick={() => {
                setSelectedClient(null);
                navigate('/clients', { replace: true });
              }}><X size={20} /></button>
            </div>

            <div className="profile-content">
              
              <div className="profile-grid">
                <div className="info-column">
                  
                  <div className="profile-section">
                    <h3>Contact Information</h3>
                    <div className="contact-list">
                      <div className="contact-row">
                        <Mail size={16} /> <a href={`mailto:${selectedClient.email}`}>{selectedClient.email || 'N/A'}</a>
                      </div>
                      <div className="contact-row">
                        <Phone size={16} /> <a href={`tel:${selectedClient.phone}`}>{selectedClient.phone || 'N/A'}</a>
                      </div>
                      <div className="contact-row">
                        <MapPin size={16} /> <span>{selectedClient.address || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="profile-section">
                    <h3>Client Lifetime Value (LTV)</h3>
                    <div className="ltv-card">
                      <Wallet size={24} className="text-main" />
                      <div>
                        <span className="ltv-lbl">Total Revenue Generated</span>
                        <span className="ltv-val">{formatCurrency(selectedClient.lifetimeValue)}</span>
                      </div>
                    </div>
                    {selectedClient.outstandingBalance > 0 && (
                      <div className="outstanding-alert">
                        <span>Outstanding Balance:</span>
                        <strong>{formatCurrency(selectedClient.outstandingBalance)}</strong>
                      </div>
                    )}
                  </div>

                </div>

                <div className="history-column">
                  <div className="profile-section" style={{ height: '100%' }}>
                    <div className="section-header-flex">
                      <h3>Project History</h3>
                      <button 
                        className="btn-text"
                        onClick={() => navigate(`/projects?action=new&clientId=${selectedClient.id}`)}
                      >
                        <Plus size={14} /> New Project
                      </button>
                    </div>
                    
                    <div className="project-history-list">
                      {isLoadingProjects ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                          <Loader size={16} className="animate-spin" /> Fetching projects...
                        </div>
                      ) : clientProjects.length === 0 ? (
                        <p className="text-muted">No projects associated with this client yet.</p>
                      ) : (
                        clientProjects.map(proj => (
                          <div 
                            key={proj.id} 
                            className="history-card cursor-pointer"
                            onClick={() => navigate(`/projects?projectId=${proj.id}`)}
                          >
                            <div className="hist-top">
                              <h4>{proj.name}</h4>
                              <span className={`status-badge ${proj.status}`}>{proj.status}</span>
                            </div>
                            <div className="hist-bottom">
                              <div className="hist-metric">
                                <span className="lbl">Billed</span>
                                <span className="val">{formatCurrency(proj.billed)}</span>
                              </div>
                              <div className="hist-metric">
                                <span className="lbl">Paid</span>
                                <span className="val text-success">{formatCurrency(proj.amountPaid)}</span>
                              </div>
                              <div className="hist-metric">
                                <span className="lbl">Owed</span>
                                <span className={`val ${(proj.billed || 0) - (proj.amountPaid || 0) > 0 ? 'text-warning' : 'text-muted'}`}>
                                  {formatCurrency((proj.billed || 0) - (proj.amountPaid || 0))}
                                </span>
                              </div>
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
        </div>
      )}

    </div>
  );
}

export default Client;