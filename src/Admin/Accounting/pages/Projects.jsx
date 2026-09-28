import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import Navigation from '../components/Navigation';
import { Search, Plus, MoreVertical, TrendingUp, TrendingDown, Calendar, X, FileText, ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp, orderBy, query, arrayUnion, increment } from "firebase/firestore"; 
import { txtdb } from '../../../firebase-config';

function Projects() {
  const navigate = useNavigate(); 
  const location = useLocation();

  const [projects, setProjects] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all'); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailsModalData, setDetailsModalData] = useState(null); 
  
  const [formData, setFormData] = useState({ name: '', clientId: '', billed: '', costOfProduction: '', amountPaid: '' });
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // --- 1. READ PROJECTS & CLIENTS FROM FIREBASE ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const qProjects = query(collection(txtdb, "projects"), orderBy("createdAt", "desc"));
        const projectsSnapshot = await getDocs(qProjects);
        const projectsData = projectsSnapshot.docs.map(document => {
          const data = document.data();
          const createdAtStr = data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
          return { id: document.id, ...data, createdAt: createdAtStr };
        });
        setProjects(projectsData);

        const qClients = query(collection(txtdb, "clients"), orderBy("name", "asc"));
        const clientsSnapshot = await getDocs(qClients);
        const clientsData = clientsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        setClientsList(clientsData);

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
    const clientIdParam = params.get('clientId');
    const projectId = params.get('projectId');

    if (action === 'new') {
      setIsModalOpen(true);
      if (clientIdParam) {
        setFormData(prev => ({ ...prev, clientId: clientIdParam }));
      }
    }

    if (projectId && projects.length > 0) {
      const foundProject = projects.find(p => p.id.toString() === projectId);
      if (foundProject) {
        setDetailsModalData(foundProject);
      }
    }
  }, [location.search, projects]);

  const clearQueryParams = () => {
    const params = new URLSearchParams(location.search);
    if (params.has('action') || params.has('clientId') || params.has('projectId')) {
      navigate('/projects', { replace: true });
    }
  };

  const closeNewProjectModal = () => {
    setIsModalOpen(false);
    clearQueryParams();
  };

  const closeDetailsModal = () => {
    setDetailsModalData(null);
    clearQueryParams();
  };

  useEffect(() => {
    if (isModalOpen || detailsModalData) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => document.body.style.overflow = 'unset';
  }, [isModalOpen, detailsModalData]);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    if (openDropdownId !== null) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdownId]);

  const filteredProjects = projects.filter(project => {
    const matchesTab = project.status === activeTab;
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (project.clientName && project.clientName.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchesTime = true;
    const projectDate = new Date(project.createdAt);
    const now = new Date();
    
    if (timeFilter === 'this_month') {
      matchesTime = projectDate.getMonth() === now.getMonth() && projectDate.getFullYear() === now.getFullYear();
    } else if (timeFilter === 'last_month') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      matchesTime = projectDate.getMonth() === lastMonth.getMonth() && projectDate.getFullYear() === lastMonth.getFullYear();
    } else if (timeFilter === 'this_year') {
      matchesTime = projectDate.getFullYear() === now.getFullYear();
    } else if (!isNaN(timeFilter) && timeFilter !== 'all') {
      matchesTime = projectDate.getMonth() === parseInt(timeFilter, 10) && projectDate.getFullYear() === now.getFullYear();
    }

    return matchesTab && matchesSearch && matchesTime;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount || 0);
  };

  // --- 2. WRITE TO FIREBASE (CROSS-UPDATING FIX ADDED HERE) ---
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.clientId || !formData.billed || !formData.costOfProduction) {
      alert("Please fill in all required fields, including selecting a client.");
      return;
    }

    const selectedClientObj = clientsList.find(c => c.id === formData.clientId);
    const clientName = selectedClientObj ? selectedClientObj.name : 'Unknown Client';

    const billedAmount = parseFloat(formData.billed) || 0;
    const initialPaidAmount = parseFloat(formData.amountPaid) || 0;

    try {
      const newProjectData = {
        clientId: formData.clientId, 
        clientName: clientName, 
        name: formData.name,
        status: 'active',
        billed: billedAmount,
        costOfProduction: parseFloat(formData.costOfProduction) || 0,
        amountPaid: initialPaidAmount,
        expenses: 0, 
        reimbursableExpenses: 0,
        reimbursementsReceived: 0,
        createdAt: serverTimestamp() 
      };

      // 1. Add project to 'projects' collection
      const projectDocRef = await addDoc(collection(txtdb, "projects"), newProjectData);

      // 2. Update the specific Client document in 'clients' collection
      const clientDocRef = doc(txtdb, "clients", formData.clientId);
      await updateDoc(clientDocRef, {
        projectIds: arrayUnion(projectDocRef.id),
        lifetimeValue: increment(billedAmount),
        outstandingBalance: increment(billedAmount - initialPaidAmount)
      });

      // 3. AUTO-LOG INITIAL DEPOSIT TO TRANSACTIONS (IF > 0)
      if (initialPaidAmount > 0) {
        const depositTxData = {
          date: new Date().toISOString().split('T')[0],
          description: `Initial Deposit - ${formData.name}`,
          projectId: projectDocRef.id,
          project: formData.name, 
          category: 'Client Payment',
          type: 'income',
          amount: initialPaidAmount,
          createdAt: serverTimestamp()
        };
        await addDoc(collection(txtdb, "transactions"), depositTxData);
      }

      // Update Local State instantly
      setProjects([{ id: projectDocRef.id, ...newProjectData, createdAt: new Date().toISOString() }, ...projects]); 
      
      setIsModalOpen(false); 
      setFormData({ name: '', clientId: '', billed: '', costOfProduction: '', amountPaid: '' }); 
      setActiveTab('active'); 
      clearQueryParams(); 

    } catch (error) {
      console.error("Error creating project: ", error);
      alert("Failed to save project. Please try again.");
    }
  };

  const handleEndProject = async (projectId) => {
    try {
      const projectRef = doc(txtdb, "projects", projectId);
      await updateDoc(projectRef, { status: 'past' });
      
      setProjects(projects.map(p => p.id === projectId ? { ...p, status: 'past' } : p));
      setOpenDropdownId(null);
    } catch (error) {
      console.error("Error completing project: ", error);
      alert("Failed to update project status.");
    }
  };

  return (
    <div className="page-wrapper">
      <Navigation />
      
      <main className="page-content">
        
        <div className="page-top-section">
          <div className="header-titles">
            <h1>Projects</h1>
            <p>Manage active builds, procurements, and past portfolios.</p>
          </div>

          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            <span>New Project</span>
          </button>

          <div className="tabs">
            <button className={`tab ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>Active Projects</button>
            <button className={`tab ${activeTab === 'past' ? 'active' : ''}`} onClick={() => setActiveTab('past')}>Past Projects</button>
          </div>

          <div className="time-filter-wrapper">
            <div className="select-container">
              <Calendar size={16} className="calendar-icon" />
              <select className="filter-select" value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
                <option value="all">All Time</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="this_year">This Year</option>
                <optgroup label="Specific Month (This Year)">
                  <option value="0">January</option>
                  <option value="1">February</option>
                  <option value="2">March</option>
                  <option value="3">April</option>
                  <option value="4">May</option>
                  <option value="5">June</option>
                  <option value="6">July</option>
                  <option value="7">August</option>
                  <option value="8">September</option>
                  <option value="9">October</option>
                  <option value="10">November</option>
                  <option value="11">December</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Search projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div className="projects-grid">
          {isLoading ? (
            <div className="empty-state">Loading projects from database...</div>
          ) : filteredProjects.length === 0 ? (
            <div className="empty-state">No projects match your filters for this time period.</div>
          ) : (
            filteredProjects.map((project) => {
              
              const paymentPercent = project.billed > 0 ? Math.min((project.amountPaid / project.billed) * 100, 100) : 0;
              const outstandingBalance = project.billed - project.amountPaid;

              const budgetUsedPercent = project.costOfProduction > 0 ? Math.min((project.expenses / project.costOfProduction) * 100, 100) : 0;
              const isOverCost = project.expenses > project.costOfProduction;
              
              const currentProfit = project.billed - project.expenses;
              const isLoss = currentProfit < 0;

              // Pass-through money: out-of-pocket costs the client pays back (e.g. delivery).
              // Kept out of the budget, contract balance and profit above.
              const reimbursableCosts = project.reimbursableExpenses || 0;
              const reimbursementsIn = project.reimbursementsReceived || 0;
              const owedBack = Math.round(reimbursableCosts - reimbursementsIn);
              const hasPassThrough = reimbursableCosts > 0 || reimbursementsIn > 0;
              const passThroughTone = owedBack > 0
                ? { bg: '#fffbeb', border: '#fde68a', text: '#b45309' }
                : { bg: '#ecfdf5', border: '#a7f3d0', text: '#047857' };
              const passThroughMessage = owedBack > 0
                ? `Client still owes you ${formatCurrency(owedBack)} for out-of-pocket costs (not counted in the budget).`
                : owedBack === 0
                  ? `Out-of-pocket costs of ${formatCurrency(reimbursableCosts)} fully reimbursed (not counted in the budget).`
                  : `Client has reimbursed ${formatCurrency(Math.abs(owedBack))} more than the out-of-pocket costs logged.`;

              return (
                <div key={project.id} className="project-card cursor-pointer">
                  
                  <div className="card-header">
                    <div className="title-area">
                      <h2>{project.name}</h2>
                      <span className="client-name">{project.clientName}</span>
                    </div>
                    
                    <div className="dropdown-container">
                      <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === project.id ? null : project.id); }}>
                        <MoreVertical size={18} />
                      </button>
                      {openDropdownId === project.id && (
                        <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                          
                          <button 
                            className="dropdown-item" 
                            onClick={() => {
                              setDetailsModalData(project);
                              setOpenDropdownId(null);
                            }}
                          >
                            View full project details
                          </button>
                          
                          <button 
                            className="dropdown-item" 
                            onClick={() => {
                              setOpenDropdownId(null);
                              navigate(`/clients?clientId=${project.clientId}`); 
                            }}
                          >
                            View client
                          </button>

                          <button 
                            className="dropdown-item"
                            onClick={() => {
                              setOpenDropdownId(null);
                              navigate(`/transactions?action=new&type=income&category=Client+Payment&project=${encodeURIComponent(project.name)}`);
                            }}
                          >
                            Log client payment
                          </button>
                          <button 
                            className="dropdown-item"
                            onClick={() => {
                              setOpenDropdownId(null);
                              navigate(`/transactions?action=new&type=expense&category=Materials&project=${encodeURIComponent(project.name)}`);
                            }}
                          >
                            Add an expense
                          </button>

                          {project.status === 'active' && (
                            <button className="dropdown-item danger" onClick={() => handleEndProject(project.id)}>
                              End/complete project
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="trackers-container">
                    <div className="budget-tracker">
                      <div className="tracker-labels">
                        <span>Payment Collected</span>
                        <span className={paymentPercent === 100 ? 'text-success' : 'text-main'}>{paymentPercent.toFixed(0)}%</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill success" style={{ width: `${paymentPercent}%` }} />
                      </div>
                    </div>

                    <div className="budget-tracker">
                      <div className="tracker-labels">
                        <span>Production Cost Usage</span>
                        <span className={isOverCost ? 'text-danger' : 'text-main'}>{budgetUsedPercent.toFixed(0)}%</span>
                      </div>
                      <div className="progress-track">
                        <div className={`progress-fill ${isOverCost ? 'danger' : budgetUsedPercent > 85 ? 'warning' : 'safe'}`} style={{ width: `${budgetUsedPercent}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="metrics-grid-3x2">
                    <div className="metric">
                      <span className="label">Billed to Client</span>
                      <span className="value">{formatCurrency(project.billed)}</span>
                    </div>
                    <div className="metric">
                      <span className="label">Deposit</span>
                      <span className="value text-success">{formatCurrency(project.amountPaid)}</span>
                    </div>
                    <div className="metric">
                      <span className="label">Outstanding Bal.</span>
                      <span className="value">{formatCurrency(outstandingBalance)}</span>
                    </div>

                    <div className="metric">
                      <span className="label">Cost of Production</span>
                      <span className="value">{formatCurrency(project.costOfProduction)}</span>
                    </div>
                    <div className="metric">
                      <span className="label">{project.status === 'active' ? 'Expenses So Far' : 'Actual Expenses'}</span>
                      <span className={`value ${isOverCost ? 'text-warning' : ''}`}>{formatCurrency(project.expenses)}</span>
                    </div>
                    <div className="metric">
                      <span className="label">{project.status === 'active' ? 'Profit So Far' : 'Net Profit'}</span>
                      <div className="margin-value">
                        {isLoss ? <TrendingDown size={16} className="text-danger" /> : <TrendingUp size={16} className="text-success" />}
                        <span className={isLoss ? 'text-danger' : 'text-success'}>
                          {isLoss ? '-' : '+'}{formatCurrency(Math.abs(currentProfit))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {hasPassThrough && (
                    <div style={{ marginTop: '1rem', padding: '0.625rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8125rem', lineHeight: 1.5, backgroundColor: passThroughTone.bg, border: `1px solid ${passThroughTone.border}`, color: passThroughTone.text }}>
                      {passThroughMessage}
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>
      </main>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeNewProjectModal}>
          <div className="modal-container action-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Project</h2>
              <button className="close-btn" onClick={closeNewProjectModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateProject} className="modal-form">
              <div className="form-group">
                <label>Project Name</label>
                <input type="text" placeholder="e.g. Johnson Kitchen Remodel" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              
              <div className="form-group">
                <label>Select Client</label>
                <select 
                  className="filter-select"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginTop: '0.25rem' }}
                  value={formData.clientId} 
                  onChange={(e) => setFormData({...formData, clientId: e.target.value})} 
                  required
                >
                  <option value="" disabled>-- Select a Client --</option>
                  {clientsList.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Total Billed (₦)</label>
                  <input type="number" min="0" step="0.01" placeholder="Contract Value" value={formData.billed} onChange={(e) => setFormData({...formData, billed: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Initial Deposit Paid (₦)</label>
                  <input type="number" min="0" step="0.01" placeholder="Optional" value={formData.amountPaid} onChange={(e) => setFormData({...formData, amountPaid: e.target.value})} />
                </div>
              </div>

              <div className="form-group">
                <label>Est. Cost of Production (₦)</label>
                <input type="number" min="0" step="0.01" placeholder="Internal Budget" value={formData.costOfProduction} onChange={(e) => setFormData({...formData, costOfProduction: e.target.value})} required />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeNewProjectModal}>Cancel</button>
                <button type="submit" className="btn-primary">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailsModalData && (
        <div className="modal-overlay" onClick={closeDetailsModal}>
          <div className="modal-container details-modal" onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} className="text-muted" />
                <h2>Project Breakdown</h2>
              </div>
              <button className="close-btn" onClick={closeDetailsModal}><X size={20} /></button>
            </div>

            <div className="details-content">
              
              <div className="context-block">
                <div className="context-item">
                  <span className="lbl">Project:</span>
                  <span className="val">{detailsModalData.name}</span>
                </div>
                <div className="context-item">
                  <span className="lbl">Client:</span>
                  <span className="val">{detailsModalData.clientName}</span>
                </div>
              </div>

              <div className="breakdown-grid">
                <div className="breakdown-section">
                  <div className="section-title">
                    <ArrowDownRight size={18} className="text-success" />
                    <h3>Money In (Revenue)</h3>
                  </div>
                  <ul className="plain-list">
                    <li><strong>Total Contract Billed:</strong> {formatCurrency(detailsModalData.billed)}</li>
                    <li><strong>Deposits/Payments Collected:</strong> <span className="text-success">{formatCurrency(detailsModalData.amountPaid)}</span></li>
                    <li><strong>Outstanding Balance (Still Owed):</strong> {formatCurrency(detailsModalData.billed - detailsModalData.amountPaid)}</li>
                  </ul>
                </div>

                <div className="breakdown-section">
                  <div className="section-title">
                    <ArrowUpRight size={18} className="text-danger" />
                    <h3>Money Out (Costs)</h3>
                  </div>
                  <ul className="plain-list">
                    <li><strong>Internal Cost Estimate:</strong> {formatCurrency(detailsModalData.costOfProduction)}</li>
                    <li><strong>Actual Expenses So Far:</strong> {formatCurrency(detailsModalData.expenses)}</li>
                    
                    {detailsModalData.expenses > detailsModalData.costOfProduction ? (
                      <li className="text-danger">
                        <strong>Status:</strong> Over budget by {formatCurrency(detailsModalData.expenses - detailsModalData.costOfProduction)}
                      </li>
                    ) : (
                      <li className="text-main">
                        <strong>Status:</strong> {formatCurrency(detailsModalData.costOfProduction - detailsModalData.expenses)} remaining in budget
                      </li>
                    )}

                    {((detailsModalData.reimbursableExpenses || 0) > 0 || (detailsModalData.reimbursementsReceived || 0) > 0) && (
                      <>
                        <li><strong>Client-Reimbursable Costs (e.g. delivery):</strong> {formatCurrency(detailsModalData.reimbursableExpenses || 0)}</li>
                        <li><strong>Reimbursed by Client:</strong> <span className="text-success">{formatCurrency(detailsModalData.reimbursementsReceived || 0)}</span></li>
                        <li style={{ color: '#64748b' }}>Reimbursable costs are kept out of the budget and profit shown here.</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="breakdown-section bottom-line">
                  <div className="section-title">
                    <Wallet size={18} className="text-main" />
                    <h3>The Bottom Line</h3>
                  </div>
                  <div className="profit-display">
                    <span className="profit-lbl">Current Net Profit:</span>
                    <span className={`profit-val ${detailsModalData.billed - detailsModalData.expenses < 0 ? 'text-danger' : 'text-success'}`}>
                      {detailsModalData.billed - detailsModalData.expenses < 0 ? '-' : '+'}
                      {formatCurrency(Math.abs(detailsModalData.billed - detailsModalData.expenses))}
                    </span>
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