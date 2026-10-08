import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { Wallet, ArrowDownRight, ArrowUpRight, TrendingUp, Clock, ChevronRight, HardHat, FolderOpen } from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { collection, getDocs, query, orderBy } from "firebase/firestore"; 
import { txtdb } from '../../../firebase-config';

function AccountingDashboard() {
  const navigate = useNavigate();

  // --- LIVE DATA STATES ---
  const [totalCash, setTotalCash] = useState(0);
  
  const [receivables, setReceivables] = useState(0);
  const [clientsOwingCount, setClientsOwingCount] = useState(0);
  
  const [payables, setPayables] = useState(0);
  
  const [activeProjects, setActiveProjects] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);

  // --- FETCH AND CALCULATE DASHBOARD DATA ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Calculate Total Cash (from Transactions) & Get Recent Activity
        const qTx = query(collection(txtdb, "transactions"), orderBy("createdAt", "desc"));
        const txSnapshot = await getDocs(qTx);
        let totalIncome = 0;
        let totalExpenses = 0;
        const recentTx = [];

        txSnapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          const amt = Number(data.amount) || 0;
          
          if (data.type === 'income') totalIncome += amt;
          if (data.type === 'expense') totalExpenses += amt;

          // Grab the 5 most recent transactions for the feed
          if (index < 5) {
            recentTx.push({ id: doc.id, ...data });
          }
        });
        
        setTotalCash(totalIncome - totalExpenses);
        setRecentTransactions(recentTx);

        // 2. Calculate Pending Balances & Active Projects (from unified Projects Ledger)
        const qProj = query(collection(txtdb, "projects"), orderBy("createdAt", "desc"));
        const projSnapshot = await getDocs(qProj);
        
        let totalOwedByClients = 0;
        let owingClientsCount = 0;
        let activeProjList = [];

        projSnapshot.docs.forEach(doc => {
          const data = doc.data();
          
          const billed = Number(data.billed) || 0;
          const paid = Number(data.amountPaid) || 0;
          const balance = billed - paid;

          if (balance > 0) {
            totalOwedByClients += balance;
            owingClientsCount++;
          }

          if (data.status === 'active') {
            activeProjList.push({ id: doc.id, ...data });
          }
        });
        
        setReceivables(totalOwedByClients);
        setClientsOwingCount(owingClientsCount);

        activeProjList.sort((a, b) => {
          const percentA = a.costOfProduction > 0 ? ((a.expenses || 0) / a.costOfProduction) : 0;
          const percentB = b.costOfProduction > 0 ? ((b.expenses || 0) / b.costOfProduction) : 0;
          return percentB - percentA;
        });

        setActiveProjects(activeProjList);

        // 3. Calculate Unpaid Workers & Vendors
        let totalLiabilities = 0;
        const qVendors = query(collection(txtdb, "vendors"));
        const vendorsSnapshot = await getDocs(qVendors);
        
        vendorsSnapshot.docs.forEach(doc => {
          totalLiabilities += (Number(doc.data().outstandingBalance) || 0);
        });

        setPayables(totalLiabilities);

      } catch (error) {
        console.error("Error fetching dashboard data: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount || 0);
  };

  const getTodayDate = () => {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  const formatTxDate = (dateString) => {
    if (!dateString) return '';
    const dateObj = new Date(dateString);
    const today = new Date();
    
    const isToday = dateObj.setHours(0,0,0,0) === today.setHours(0,0,0,0);
    if (isToday) return 'Today';
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateObj.setHours(0,0,0,0) === yesterday.setHours(0,0,0,0)) return 'Yesterday';

    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Short "where did the money go" line: project + who was paid (or what kind of income)
  const getTxSubtitle = (tx) => {
    const parts = [tx.project || 'Unknown Project'];
    if (tx.type === 'expense' && tx.vendorName) parts.push(`Paid to: ${tx.vendorName}`);
    else parts.push(tx.category || 'Uncategorized');
    if (tx.isReimbursable) parts.push('Reimbursable');
    if (tx.isReimbursement) parts.push('Reimbursement');
    return parts.join(' • ');
  };

  return (
    <div className="dash-page-wrapper">
      <Navigation />

      <main className="dash-main-content">
        
        <header className="dash-page-header">
          <div className="dash-header-titles">
            <h1>Financial Overview</h1>
            <p>{getTodayDate()}</p>
          </div>
        </header>

        {isLoading ? (
          // --- SKELETON LOADER ---
          <div aria-busy="true">
            <div className="dash-metrics-grid">
              {[0, 1, 2].map(i => (
                <div key={i} className="dash-metric-card">
                  <div className="dash-card-header">
                    <span className="dash-skeleton" style={{ width: '7rem', height: '0.75rem' }} />
                    <span className="dash-skeleton" style={{ width: '18px', height: '18px' }} />
                  </div>
                  <div className="dash-card-body">
                    <span className="dash-skeleton" style={{ width: '9rem', height: '1.5rem' }} />
                    <span className="dash-skeleton" style={{ width: '11rem', height: '0.75rem', marginTop: '0.5rem' }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="dash-bottom-grid">
              <div className="dash-section-card">
                <div className="dash-section-header">
                  <span className="dash-skeleton" style={{ width: '9rem', height: '1rem' }} />
                  <span className="dash-skeleton" style={{ width: '4.5rem', height: '1rem' }} />
                </div>
                <div className="dash-alerts-list">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="dash-alert-item">
                      <div className="dash-alert-info">
                        <span className="dash-skeleton" style={{ width: '9rem', height: '0.875rem' }} />
                        <span className="dash-skeleton" style={{ width: '5rem', height: '0.75rem' }} />
                      </div>
                      <div className="dash-progress-container">
                        <span className="dash-skeleton" style={{ flex: 1, height: '6px' }} />
                        <span className="dash-skeleton" style={{ width: '7rem', height: '0.8125rem' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dash-section-card">
                <div className="dash-section-header">
                  <span className="dash-skeleton" style={{ width: '8rem', height: '1rem' }} />
                  <span className="dash-skeleton" style={{ width: '3.5rem', height: '0.75rem' }} />
                </div>
                <div className="dash-activity-list">
                  {[0, 1, 2, 3, 4].map(i => (
                    <div key={i} className="dash-activity-item">
                      <span className="dash-skeleton dash-skeleton-circle" />
                      <div className="dash-activity-details">
                        <span className="dash-skeleton" style={{ width: '60%', height: '0.875rem', marginBottom: '0.375rem' }} />
                        <span className="dash-skeleton" style={{ width: '80%', height: '0.75rem' }} />
                      </div>
                      <div className="dash-activity-right">
                        <span className="dash-skeleton" style={{ width: '4.5rem', height: '0.875rem', marginBottom: '0.375rem' }} />
                        <span className="dash-skeleton" style={{ width: '3rem', height: '0.75rem' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* --- 1. CORE FINANCIAL SNAPSHOT --- */}
            <div className="dash-metrics-grid">
              
              <div className="dash-metric-card interactive" onClick={() => navigate('/transactions')}>
                <div className="dash-card-header">
                  <h3>Total Cash Balance</h3>
                  <div className="dash-icon-wrapper"><Wallet size={18} /></div>
                </div>
                <div className="dash-card-body">
                  <span className={`dash-value ${totalCash < 0 ? 'dash-text-danger' : ''}`}>
                    {totalCash < 0 ? '-' : ''}{formatCurrency(Math.abs(totalCash))}
                  </span>
                  <span className="dash-subtitle">Available in accounts</span>
                </div>
              </div>

              <div className="dash-metric-card interactive" onClick={() => navigate('/projects')}>
                <div className="dash-card-header">
                  <h3>Pending Balances</h3>
                  <div className="dash-icon-wrapper success"><ArrowDownRight size={18} /></div>
                </div>
                <div className="dash-card-body">
                  <span className="dash-value dash-text-success">{formatCurrency(receivables)}</span>
                  <span className="dash-subtitle">Outstanding from ({clientsOwingCount}) clients</span>
                </div>
              </div>

              <div className="dash-metric-card interactive" onClick={() => navigate('/vendors')}>
                <div className="dash-card-header">
                  <h3>Unpaid Workers & Bills</h3>
                  <div className="dash-icon-wrapper danger"><HardHat size={18} /></div>
                </div>
                <div className="dash-card-body">
                  <span className="dash-value dash-text-danger">{formatCurrency(payables)}</span>
                  <span className="dash-subtitle">Total worker balances owed</span>
                </div>
              </div>

            </div>

            <div className="dash-bottom-grid">
              
              {/* --- 2. ACTIVE PROJECTS --- */}
              <div className="dash-section-card interactive-section" onClick={() => navigate('/projects')}>
                <div className="dash-section-header">
                  <div className="dash-title-group">
                    <FolderOpen size={18} className="dash-text-main" />
                    <h2>Active Projects</h2>
                  </div>
                  <span className="dash-badge neutral">{activeProjects.length} Ongoing</span>
                </div>
                
                <div className="dash-alerts-list">
                  
                  {activeProjects.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: '0.8125rem' }}>No active projects found.</p>
                  ) : (
                    activeProjects.map(project => {
                      const percentUsed = project.costOfProduction > 0 ? ((project.expenses || 0) / project.costOfProduction) * 100 : 0;
                      const isWarning = percentUsed >= 75 && percentUsed < 90;
                      const isCritical = percentUsed >= 90;

                      return (
                        <div key={project.id} className="dash-alert-item">
                          <div className="dash-alert-info">
                            <span className="dash-project-name">{project.name || 'Unnamed Project'}</span>
                            <span className="dash-project-stats">
                              {percentUsed.toFixed(0)}% budget used
                            </span>
                          </div>
                          
                          <div className="dash-progress-container">
                            <div className="dash-progress-bar">
                              <div 
                                className={`dash-progress-fill ${isCritical ? 'critical' : isWarning ? 'warning' : 'safe'}`} 
                                style={{ width: `${Math.min(percentUsed, 100)}%` }} 
                              />
                            </div>
                            
                            <span className={`dash-progress-text ${isCritical ? 'dash-text-danger' : ''}`}>
                              {formatCurrency(project.expenses || 0)} 
                              <span className="dash-budget-total"> / {formatCurrency(project.costOfProduction || 0)}</span>
                            </span>

                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* --- 3. RECENT ACTIVITY --- */}
              <div className="dash-section-card interactive-section" onClick={() => navigate('/transactions')}>
                <div className="dash-section-header">
                  <div className="dash-title-group">
                    <Clock size={18} className="dash-text-muted" />
                    <h2>Recent Activity</h2>
                  </div>
                  {/* VIEW ALL BUTTON MOVED HERE */}
                  {recentTransactions.length > 0 && (
                    <button className="dash-view-all-btn" onClick={(e) => { e.stopPropagation(); navigate('/transactions'); }}>
                      View all <ChevronRight size={14} />
                    </button>
                  )}
                </div>

                <div className="dash-activity-list">
                  {recentTransactions.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: '0.8125rem', padding: '1rem 0' }}>No transactions logged yet.</p>
                  ) : (
                    recentTransactions.map(tx => (
                      <div key={tx.id} className="dash-activity-item">
                        <div className={`dash-activity-icon ${tx.type}`}>
                          {tx.type === 'income' ? <TrendingUp size={14} /> : <ArrowUpRight size={14} />}
                        </div>
                        <div className="dash-activity-details">
                          <span className="dash-desc">{(tx.description || '').trim() || 'Unnamed'}</span>
                          <span className="dash-tx-meta">{getTxSubtitle(tx)}</span>
                        </div>
                        <div className="dash-activity-right">
                          <span className={`dash-activity-amount ${tx.type === 'income' ? 'dash-text-success' : 'dash-text-main'}`}>
                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount || 0)}
                          </span>
                          <span className="dash-date">{formatTxDate(tx.date)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default AccountingDashboard;