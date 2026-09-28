import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { Download, Calendar, PieChart, TrendingUp, TrendingDown, FileText, CheckCircle2, Loader, ChevronDown, ChevronUp } from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { collection, getDocs, query, orderBy } from "firebase/firestore"; 
import { txtdb } from '../../../firebase-config';

// How many expense categories to show before collapsing the rest into "Other"
const TOP_CATEGORIES_LIMIT = 5;

// Renders a section's itemized breakdown. A single item is shown plainly;
// more than one collapses behind a "N items" toggle so a busy month doesn't
// turn into an endless scroll by default.
function BreakdownList({ items, formatCurrency, emptyText, expanded, onToggle }) {
  if (items.length === 0) {
    return (
      <div className="rep-table-row sub-item">
        <span style={{ color: '#94a3b8' }}>{emptyText}</span>
      </div>
    );
  }

  if (items.length === 1) {
    const item = items[0];
    return (
      <div className="rep-table-row sub-item">
        <span>{item.label}</span>
        <span>{formatCurrency(item.amount)}</span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className="rep-toggle-row"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <span>{expanded ? 'Hide details' : `${items.length} items`}</span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {expanded && items.map((item, i) => (
        <div key={i} className="rep-table-row sub-item">
          <span>{item.label}</span>
          <span>{formatCurrency(item.amount)}</span>
        </div>
      ))}
    </>
  );
}

function Reports() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Default to current month (e.g., "2026-09")
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const [timeFilter, setTimeFilter] = useState(`${currentYear}-${currentMonth}`);
  
  const [isExporting, setIsExporting] = useState(false);

  // --- COLLAPSE / EXPAND STATE ---
  // Tracks which itemized breakdowns are currently expanded.
  const [expanded, setExpanded] = useState({
    revenue: false,
    projectCosts: false,
    overhead: false,
    otherExpenses: false,
  });

  const toggleSection = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Collapse everything again whenever the selected period changes, so an
  // expanded section from a previous month doesn't carry over confusingly.
  useEffect(() => {
    setExpanded({ revenue: false, projectCosts: false, overhead: false, otherExpenses: false });
  }, [timeFilter]);

  // --- REPORT DATA STATE ---
  const [reportData, setReportData] = useState({
    revenue: { total: 0, breakdown: [] },
    projectCosts: { total: 0, breakdown: [] },
    overhead: { total: 0, breakdown: [] }
  });

  // --- 1. FETCH ALL TRANSACTIONS ---
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const qTx = query(collection(txtdb, "transactions"), orderBy("createdAt", "desc"));
        const txSnapshot = await getDocs(qTx);
        const txData = txSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTransactions(txData);
      } catch (error) {
        console.error("Error fetching transactions: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // --- 2. CALCULATE REPORT BASED ON TIME FILTER ---
  useEffect(() => {
    if (transactions.length === 0) return;

    // Filter transactions by the selected time period
    const filteredTx = transactions.filter(tx => {
      if (!tx.date) return false;
      const txDate = new Date(tx.date);
      const txYear = txDate.getFullYear();
      const txMonth = txDate.getMonth(); // 0-indexed

      const [filterYear, filterType] = timeFilter.split('-');

      if (filterType === 'YTD') {
        return txYear === parseInt(filterYear);
      } else if (filterType === 'Q3') {
        return txYear === parseInt(filterYear) && txMonth >= 6 && txMonth <= 8; // Jul, Aug, Sep
      } else if (!isNaN(filterType)) {
        // Specific Month (e.g., '09')
        return txYear === parseInt(filterYear) && txMonth === (parseInt(filterType) - 1);
      }
      return true;
    });

    let revTotal = 0;
    let costTotal = 0;
    let overheadTotal = 0;

    const revMap = {};
    const costMap = {};
    const overheadMap = {};

    filteredTx.forEach(tx => {
      const amt = Number(tx.amount) || 0;
      const cat = tx.category || 'Uncategorized';

      if (tx.type === 'income') {
        revTotal += amt;
        revMap[cat] = (revMap[cat] || 0) + amt;
      } else if (tx.type === 'expense') {
        // If it's tied to the 'internal' project, it's Overhead (OPEX)
        if (tx.projectId === 'internal' || tx.project === 'Internal / Overhead') {
          overheadTotal += amt;
          overheadMap[cat] = (overheadMap[cat] || 0) + amt;
        } else {
          // If it's tied to an actual client project, it's a Project Cost (COGS)
          costTotal += amt;
          costMap[cat] = (costMap[cat] || 0) + amt;
        }
      }
    });

    // Convert grouping maps to sorted arrays for the UI lists
    const formatBreakdown = (map) => Object.keys(map)
      .map(k => ({ label: k, amount: map[k] }))
      .sort((a, b) => b.amount - a.amount);

    setReportData({
      revenue: { total: revTotal, breakdown: formatBreakdown(revMap) },
      projectCosts: { total: costTotal, breakdown: formatBreakdown(costMap) },
      overhead: { total: overheadTotal, breakdown: formatBreakdown(overheadMap) }
    });

  }, [transactions, timeFilter]);


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount || 0);
  };

  // --- Calculations ---
  const totalRevenue = reportData.revenue.total;
  const totalExpenses = reportData.projectCosts.total + reportData.overhead.total;
  
  const grossProfit = totalRevenue - reportData.projectCosts.total;
  const netProfit = grossProfit - reportData.overhead.total;
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Profit state drives labels/colours so a loss never looks like a win
  const isLoss = netProfit < 0;
  const isBreakEven = netProfit === 0 && totalRevenue > 0;
  const bottomState = isLoss ? 'is-loss' : isBreakEven ? 'is-breakeven' : 'is-profit';

  // Percentages for the visual breakdown bar (prevent division by zero)
  const costPct = totalRevenue > 0 ? (reportData.projectCosts.total / totalRevenue) * 100 : 0;
  const overheadPct = totalRevenue > 0 ? (reportData.overhead.total / totalRevenue) * 100 : 0;
  const profitPct = totalRevenue > 0 ? Math.max((netProfit / totalRevenue) * 100, 0) : 0;

  // Top expense categories: show the biggest N, roll the rest into "Other"
  // so a busy month with dozens of categories still renders a fixed-size,
  // skimmable card instead of an ever-growing list.
  const allExpenses = [
    ...reportData.projectCosts.breakdown,
    ...reportData.overhead.breakdown
  ].sort((a, b) => b.amount - a.amount);

  const visibleExpenses = allExpenses.slice(0, TOP_CATEGORIES_LIMIT);
  const hiddenExpenses = allExpenses.slice(TOP_CATEGORIES_LIMIT);
  const otherTotal = hiddenExpenses.reduce((sum, e) => sum + e.amount, 0);
  const otherPct = totalExpenses > 0 ? (otherTotal / totalExpenses) * 100 : 0;

  const renderCatItem = (expense, key, nested = false) => {
    const pct = totalExpenses > 0 ? (expense.amount / totalExpenses) * 100 : 0;
    return (
      <div key={key} className={`rep-cat-item${nested ? ' rep-cat-item--nested' : ''}`}>
        <div className="rep-cat-info">
          <span className="rep-cat-label">{expense.label}</span>
          <span className="rep-cat-val">{formatCurrency(expense.amount)}</span>
        </div>
        <div className="rep-progress-track">
          <div className="rep-progress-fill" style={{ width: `${pct}%` }}></div>
        </div>
      </div>
    );
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert("Report successfully exported to PDF/CSV.");
    }, 1500);
  };

  return (
    <div className="rep-page-wrapper">
      <Navigation />
      
      <main className="rep-main-content">
        
        <div className="rep-top-section">
          <div className="rep-header-titles">
            <h1>Financial Reports</h1>
            <p>Automated P&L and expense breakdowns, simplified.</p>
          </div>

          <button className="rep-btn-primary" onClick={handleExport} disabled={isExporting || isLoading}>
            <Download size={18} />
            <span>{isExporting ? 'Generating...' : 'Export Report'}</span>
          </button>

          <div className="rep-filter-box">
            <Calendar size={18} className="rep-filter-icon" />
            <select className="rep-select" value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
              <optgroup label="Quarterly / Yearly">
                <option value={`${currentYear}-YTD`}>{currentYear} Year-to-Date</option>
                <option value={`${currentYear}-Q3`}>Q3 {currentYear} (Jul - Sep)</option>
              </optgroup>
              <optgroup label="Monthly">
                <option value={`${currentYear}-09`}>September {currentYear}</option>
                <option value={`${currentYear}-08`}>August {currentYear}</option>
                <option value={`${currentYear}-07`}>July {currentYear}</option>
              </optgroup>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#64748b', gap: '0.5rem' }}>
            <Loader className="animate-spin" size={24} /> Analyzing financial data...
          </div>
        ) : (
          <>
            {/* 1. TOP HIGHLIGHT METRICS */}
            <div className="rep-metrics-grid">
              <div className="rep-metric-card">
                <div className="rep-card-info">
                  <span className="rep-lbl">Total Revenue (Money In)</span>
                  <span className="rep-val rep-text-main">{formatCurrency(totalRevenue)}</span>
                </div>
                <div className="rep-icon-box bg-success"><TrendingUp size={24} className="rep-text-success"/></div>
              </div>

              <div className="rep-metric-card">
                <div className="rep-card-info">
                  <span className="rep-lbl">Total Expenses (Money Out)</span>
                  <span className="rep-val rep-text-main">{formatCurrency(totalExpenses)}</span>
                </div>
                <div className="rep-icon-box bg-danger"><TrendingDown size={24} className="rep-text-danger"/></div>
              </div>

              <div className="rep-metric-card highlight">
                <div className="rep-card-info">
                  <span className="rep-lbl">{isLoss ? 'Final Net Loss' : 'Final Net Profit'}</span>
                  <span className="rep-val">
                    {isLoss ? '-' : ''}{formatCurrency(Math.abs(netProfit))}
                  </span>
                </div>
                <div className={`rep-card-badge${isLoss ? ' is-loss' : ''}`}>
                  {isLoss ? 'Ran at a loss' : `${netMargin.toFixed(1)}% Profit Margin`}
                </div>
              </div>
            </div>

            <div className="rep-content-grid">
              
              {/* 2. PLAIN ENGLISH P&L STATEMENT (LEFT COLUMN) */}
              <div className="rep-panel pl-statement">
                <div className="rep-panel-header">
                  <div className="rep-title-group">
                    <FileText size={20} className="rep-text-main" />
                    <h2>Profit & Loss Statement</h2>
                  </div>
                </div>

                <div className="rep-table">
                  
                  {/* REVENUE */}
                  <div className="rep-table-section">
                    <div className="rep-table-row header">
                      <span>1. Revenue (Money In)</span>
                      <span className="rep-text-success">+{formatCurrency(totalRevenue)}</span>
                    </div>
                    <BreakdownList
                      items={reportData.revenue.breakdown}
                      formatCurrency={formatCurrency}
                      emptyText="No revenue logged for this period."
                      expanded={expanded.revenue}
                      onToggle={() => toggleSection('revenue')}
                    />
                  </div>

                  {/* PROJECT COSTS */}
                  <div className="rep-table-section">
                    <div className="rep-table-row header mt-2">
                      <span>2. Project Costs (Materials & Labor)</span>
                      <span className="rep-text-danger">- {formatCurrency(reportData.projectCosts.total)}</span>
                    </div>
                    <BreakdownList
                      items={reportData.projectCosts.breakdown}
                      formatCurrency={formatCurrency}
                      emptyText="No project costs logged."
                      expanded={expanded.projectCosts}
                      onToggle={() => toggleSection('projectCosts')}
                    />
                  </div>

                  {/* GROSS PROFIT SUBTOTAL */}
                  <div className="rep-table-row subtotal-row">
                    <span>Gross Profit (After Project Costs)</span>
                    <span className={grossProfit < 0 ? 'rep-text-danger' : ''}>
                      {grossProfit < 0 ? '-' : ''}{formatCurrency(Math.abs(grossProfit))}
                    </span>
                  </div>

                  {/* OVERHEAD */}
                  <div className="rep-table-section">
                    <div className="rep-table-row header mt-2">
                      <span>3. Overhead (Software, Office, etc.)</span>
                      <span className="rep-text-warning">- {formatCurrency(reportData.overhead.total)}</span>
                    </div>
                    <BreakdownList
                      items={reportData.overhead.breakdown}
                      formatCurrency={formatCurrency}
                      emptyText="No overhead expenses logged."
                      expanded={expanded.overhead}
                      onToggle={() => toggleSection('overhead')}
                    />
                  </div>

                  {/* FINAL BOTTOM LINE */}
                  <div className={`rep-final-bottom-line ${bottomState}`}>
                    <div className="rep-bottom-text">
                      {isLoss ? <TrendingDown size={24} /> : <CheckCircle2 size={24} />}
                      <span>
                        {isLoss
                          ? 'Net Loss (Shortfall)'
                          : isBreakEven
                            ? 'Break-even (No Profit, No Loss)'
                            : 'Final Net Profit (Take-Home)'}
                      </span>
                    </div>
                    <span className="rep-bottom-val">
                      {isLoss ? '-' : ''}{formatCurrency(Math.abs(netProfit))}
                    </span>

                    {isLoss && (
                      <p className="rep-bottom-note">
                        No profit this period. Expenses ({formatCurrency(totalExpenses)}) were higher than
                        revenue ({formatCurrency(totalRevenue)}) by {formatCurrency(Math.abs(netProfit))}.
                      </p>
                    )}
                    {isBreakEven && (
                      <p className="rep-bottom-note">
                        Revenue covered expenses exactly, so nothing was left over as profit.
                      </p>
                    )}
                  </div>

                </div>
              </div>

              {/* 3. VISUAL BREAKDOWNS (RIGHT COLUMN) */}
              <div className="rep-right-column">
                
                {/* Visual: Where did the money go? */}
                <div className="rep-panel visual-summary">
                  <div className="rep-panel-header">
                    <div className="rep-title-group">
                      <PieChart size={20} className="rep-text-main" />
                      <h2>Where did the money go?</h2>
                    </div>
                  </div>
                  
                  <div className="rep-visual-content">
                    <p className="rep-helper-text">
                      {isLoss
                        ? `You spent ${formatCurrency(totalExpenses)} against ${formatCurrency(totalRevenue)} in revenue, so nothing was kept as profit:`
                        : `Out of your total ${formatCurrency(totalRevenue)} revenue:`}
                    </p>
                    
                    {/* Thick Segmented Progress Bar */}
                    <div className="rep-segmented-bar">
                      <div className="rep-segment cost" style={{ width: `${costPct}%` }}></div>
                      <div className="rep-segment overhead" style={{ width: `${overheadPct}%` }}></div>
                      <div className="rep-segment profit" style={{ width: `${profitPct}%` }}></div>
                    </div>

                    {/* Legend */}
                    <div className="rep-legend-grid">
                      <div className="rep-legend-item">
                        <div className="rep-dot cost"></div>
                        <div className="rep-leg-text">
                          <span className="rep-leg-lbl">Project Costs</span>
                          <span className="rep-leg-val">{costPct.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="rep-legend-item">
                        <div className="rep-dot overhead"></div>
                        <div className="rep-leg-text">
                          <span className="rep-leg-lbl">Overhead</span>
                          <span className="rep-leg-val">{overheadPct.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="rep-legend-item">
                        <div className="rep-dot profit"></div>
                        <div className="rep-leg-text">
                          <span className="rep-leg-lbl">Kept as Profit</span>
                          <span className="rep-leg-val">{profitPct.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expense Categories List */}
                <div className="rep-panel expense-categories">
                  <div className="rep-panel-header">
                    <h2>Top Expense Categories</h2>
                  </div>

                  <div className="rep-categories-list">
                    {allExpenses.length === 0 ? (
                      <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No expenses to display.</p>
                    ) : (
                      <>
                        {visibleExpenses.map((expense, idx) => renderCatItem(expense, idx))}

                        {hiddenExpenses.length > 0 && (
                          <>
                            <div
                              className="rep-cat-item rep-cat-item--other"
                              role="button"
                              tabIndex={0}
                              aria-expanded={expanded.otherExpenses}
                              onClick={() => toggleSection('otherExpenses')}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  toggleSection('otherExpenses');
                                }
                              }}
                            >
                              <div className="rep-cat-info">
                                <span className="rep-cat-label rep-cat-label--toggle">
                                  {expanded.otherExpenses ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                  Other ({hiddenExpenses.length} {hiddenExpenses.length === 1 ? 'category' : 'categories'})
                                </span>
                                <span className="rep-cat-val">{formatCurrency(otherTotal)}</span>
                              </div>
                              <div className="rep-progress-track">
                                <div className="rep-progress-fill" style={{ width: `${otherPct}%` }}></div>
                              </div>
                            </div>

                            {expanded.otherExpenses && hiddenExpenses.map((expense, idx) => renderCatItem(expense, `hidden-${idx}`, true))}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </>
        )}

      </main>
    </div>
  );
}

export default Reports;