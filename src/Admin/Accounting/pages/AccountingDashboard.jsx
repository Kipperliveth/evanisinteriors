import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { Wallet, ArrowDownRight, ArrowUpRight, TrendingUp, Clock, ChevronRight, HardHat, FolderOpen, Loader } from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore"; 
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

        // 2. Calculate Pending Receivables (from Clients)
        const qClients = query(collection(txtdb, "clients"));
        const clientsSnapshot = await getDocs(qClients);
        let totalOwedByClients = 0;
        let owingClientsCount = 0;

        clientsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const balance = Number(data.outstandingBalance) || 0;
          if (balance > 0) {
            totalOwedByClients += balance;
            owingClientsCount++;
          }
        });
        
        setReceivables(totalOwedByClients);
        setClientsOwingCount(owingClientsCount);

        // 3. Calculate Unpaid Workers & Bills (Vendors + Pending POs)
        let totalLiabilities = 0;

        const qVendors = query(collection(txtdb, "vendors"));
        const vendorsSnapshot = await getDocs(qVendors);
        vendorsSnapshot.docs.forEach(doc => {
          totalLiabilities += (Number(doc.data().outstandingBalance) || 0);
        });

        const qPOs = query(collection(txtdb, "purchaseOrders"), where("status", "==", "pending"));
        const posSnapshot = await getDocs(qPOs);
        posSnapshot.docs.forEach(doc => {
          totalLiabilities += (Number(doc.data().amount) || 0);
        });

        setPayables(totalLiabilities);

        // 4. Get Active Projects for Progress Tracker
        const qProj = query(collection(txtdb, "projects"), where("status", "==", "active"));
        const projSnapshot = await getDocs(qProj);
        let activeProjList = projSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Sort projects by highest budget usage percentage
        activeProjList.sort((a, b) => {
          const percentA = a.costOfProduction > 0 ? (a.expenses / a.costOfProduction) : 0;
          const percentB = b.costOfProduction > 0 ? (b.expenses / b.costOfProduction) : 0;
          return percentB - percentA;
        });

        setActiveProjects(activeProjList);

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
    
    // Reset time portion for accurate day comparison
    const isToday = dateObj.setHours(0,0,0,0) === today.setHours(0,0,0,0);
    
    if (isToday) return 'Today';
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateObj.setHours(0,0,0,0) === yesterday.setHours(0,0,0,0)) return 'Yesterday';

    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b', gap: '0.5rem' }}>
            <Loader className="animate-spin" size={24} /> Syncing financials...
          </div>
        ) : (
          <>
            {/* --- 1. CORE FINANCIAL SNAPSHOT (Clickable) --- */}
            <div className="dash-metrics-grid">
              
              <div className="dash-metric-card highlight interactive" onClick={() => navigate('/transactions')}>
                <div className="dash-card-header">
                  <h3>Total Cash Balance</h3>
                  <div className="dash-icon-wrapper"><Wallet size={20} /></div>
                </div>
                <div className="dash-card-body">
                  <span className={`dash-value ${totalCash < 0 ? 'dash-text-danger' : ''}`}>
                    {totalCash < 0 ? '-' : ''}{formatCurrency(Math.abs(totalCash))}
                  </span>
                  <span className="dash-subtitle">Available in accounts</span>
                </div>
              </div>

              <div className="dash-metric-card success interactive" onClick={() => navigate('/clients')}>
                <div className="dash-card-header">
                  <h3>Pending Receivables</h3>
                  <div className="dash-icon-wrapper"><ArrowDownRight size={20} /></div>
                </div>
                <div className="dash-card-body">
                  <span className="dash-value">{formatCurrency(receivables)}</span>
                  <span className="dash-subtitle">Outstanding from ({clientsOwingCount}) clients</span>
                </div>
              </div>

              <div className="dash-metric-card danger interactive" onClick={() => navigate('/vendors')}>
                <div className="dash-card-header">
                  <h3>Unpaid Workers & Bills</h3>
                  <div className="dash-icon-wrapper"><HardHat size={20} /></div>
                </div>
                <div className="dash-card-body">
                  <span className="dash-value">{formatCurrency(payables)}</span>
                  <span className="dash-subtitle">Pending POs and worker balances</span>
                </div>
              </div>

            </div>

            <div className="dash-bottom-grid">
              
              {/* --- 2. ACTIVE PROJECTS --- */}
              <div className="dash-section-card interactive-section" onClick={() => navigate('/projects')}>
                <div className="dash-section-header">
                  <div className="dash-title-group">
                    <FolderOpen size={20} className="dash-text-main" />
                    <h2>Active Projects</h2>
                  </div>
                  <span className="dash-badge neutral">{activeProjects.length} Ongoing</span>
                </div>
                
                <div className="dash-alerts-list">
                  <p className="dash-helper-text">Latest internal budget tracking for active jobs.</p>
                  
                  {activeProjects.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '1rem' }}>No active projects found.</p>
                  ) : (
                    activeProjects.map(project => {
                      const percentUsed = project.costOfProduction > 0 ? (project.expenses / project.costOfProduction) * 100 : 0;
                      const isWarning = percentUsed >= 75 && percentUsed < 90;
                      const isCritical = percentUsed >= 90;

                      return (
                        <div key={project.id} className="dash-alert-item">
                          <div className="dash-alert-info">
                            <span className="dash-project-name">{project.name}</span>
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
                              {formatCurrency(project.expenses)} 
                              <span className="dash-budget-total"> / {formatCurrency(project.costOfProduction)}</span>
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
                    <Clock size={20} className="dash-text-muted" />
                    <h2>Recent Activity</h2>
                  </div>
                </div>

                <div className="dash-activity-list">
                  {recentTransactions.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', padding: '1rem 0' }}>No transactions logged yet.</p>
                  ) : (
                    recentTransactions.map(tx => (
                      <div key={tx.id} className="dash-activity-item">
                        <div className={`dash-activity-icon ${tx.type}`}>
                          {tx.type === 'income' ? <TrendingUp size={16} /> : <ArrowUpRight size={16} />}
                        </div>
                        <div className="dash-activity-details">
                          <span className="dash-desc">{tx.description}</span>
                          <span className="dash-date">{formatTxDate(tx.date)}</span>
                        </div>
                        <div className={`dash-activity-amount ${tx.type === 'income' ? 'dash-text-success' : 'dash-text-main'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </div>
                      </div>
                    ))
                  )}
                  
                  {recentTransactions.length > 0 && (
                    <button className="dash-view-all-btn">
                      View all transactions <ChevronRight size={16} />
                    </button>
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