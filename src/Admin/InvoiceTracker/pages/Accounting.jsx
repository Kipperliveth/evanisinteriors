import React, { useState, useEffect, useMemo } from 'react';
import Navigation from '../components/Navigation';
import { CiSearch } from "react-icons/ci";
import { IoAdd, IoCloseOutline } from "react-icons/io5";
import { FiArrowUpRight, FiArrowDownLeft } from "react-icons/fi";
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { txtdb } from "../../../firebase-config";

function Accounting() {
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: "Materials",
    amount: "",
    note: "",
    invoiceId: "",
    date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    try {
      const invSnap = await getDocs(collection(txtdb, "invoices"));
      const expSnap = await getDocs(query(collection(txtdb, "expenses"), orderBy("createdAt", "desc")));
      
      setInvoices(invSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setExpenses(expSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) { console.error("Error fetching:", err); }
  };

  useEffect(() => { fetchData(); }, []);

  // --- Financial Logic ---
  const stats = useMemo(() => {
    const totalRevenue = invoices.reduce((sum, inv) => sum + (Number(inv.paid) || 0), 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    return { totalRevenue, totalExpenses, profit: totalRevenue - totalExpenses };
  }, [invoices, expenses]);

  // Sort Categories by Spend (Highest to Lowest)
  const sortedCategories = useMemo(() => {
    const totals = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount);
      return acc;
    }, {});
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  // Group Expenses by Invoice
  const invoiceExpenses = useMemo(() => {
    const grouped = expenses.filter(e => e.invoiceId).reduce((acc, exp) => {
      acc[exp.invoiceId] = (acc[exp.invoiceId] || 0) + Number(exp.amount);
      return acc;
    }, {});
    return Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  // Transaction History (Newest to Oldest)
// Transaction History (Strictly Newest to Oldest)
  const transactions = useMemo(() => {
    // 1. Process Invoices (Income)
    const income = invoices.map(inv => {
      // Ensure we get a valid JS Date from Firestore Timestamp
      const date = inv.created?.toDate ? inv.created.toDate() : new Date();
      return {
        name: inv.client || "Unknown Client",
        type: 'income',
        category: 'Furniture Sale',
        amount: inv.paid || 0,
        date: date, // Keep as Date object for sorting
        ref: inv.id ? inv.id.substring(0, 6).toUpperCase() : 'INV'
      };
    });

    // 2. Process Expenses (Outgo)
    const outgo = expenses.map(exp => {
      // Handle various date formats (Timestamp or String)
      const date = exp.createdAt?.toDate ? exp.createdAt.toDate() : new Date(exp.date);
      return {
        name: exp.category,
        type: 'expense',
        category: exp.note,
        amount: exp.amount,
        date: date, // Keep as Date object for sorting
        ref: exp.invoiceId ? `Inv: ${exp.invoiceId.substring(0, 5)}` : 'General'
      };
    });

    // 3. Merge and Sort
    return [...income, ...outgo]
      .sort((a, b) => b.date.getTime() - a.date.getTime()) // Use getTime() for precise numeric comparison
      .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [invoices, expenses, searchTerm]);

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    await addDoc(collection(txtdb, "expenses"), {
      ...expenseForm,
      amount: Number(expenseForm.amount),
      createdAt: Timestamp.now()
    });
    setShowExpenseModal(false);
    fetchData();
  };

  return (
    <div className='layout'>
      <Navigation />
      <div className="accounting">
        <div className="accounting-header">
          <div className="title-area">
            <h1 className='desktop'>Accounting</h1>
          </div>
          <div className="header-actions">
            <div className="search">
              <CiSearch className='icon'/>
              <input type="search" placeholder='Search...' onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <button className="add-exp-btn" onClick={() => setShowExpenseModal(true)}>
              <IoAdd /> Add Expense
            </button>
          </div>
        </div>

        <div className="accounting-container">
          {/* Top Stat Cards */}
          <div className="stats-grid">
            <div className="stat-card green">
              <p>Total Revenue</p>
              <h2>₦{stats.totalRevenue.toLocaleString()}</h2>
            </div>
            <div className="stat-card blue">
              <p>Total Expenses</p>
              <h2>₦{stats.totalExpenses.toLocaleString()}</h2>
            </div>
            <div className="stat-card yellow">
              <p>Net Profit</p>
              <h2>₦{stats.profit.toLocaleString()}</h2>
            </div>
          </div>

          <div className="main-content-split">
            {/* Transaction History Column */}
            <div className="transaction-section">
              <div className="sec-head">
                <h3>Transaction History</h3>
                <span>Latest Activity</span>
              </div>
              <div className="trans-list">
                {transactions.map((t, i) => (
                  <div className="trans-item" key={i}>
                    <div className={`icon-box ${t.type}`}>
                      {t.type === 'income' ? <FiArrowDownLeft /> : <FiArrowUpRight />}
                    </div>
                    <div className="details">
                      <h4>{t.name}</h4>
                      <p>{t.category} • #{t.ref}</p>
                    </div>
                    <div className={`amount ${t.type}`}>
                      {t.type === 'income' ? '+' : '-'}₦{Number(t.amount).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar Columns */}
            <div className="analytics-sidebar">
               {/* Invoice Specific Tracker */}
               <div className="side-card">
                  <h4>Expenses per Invoice</h4>
                  <div className="mini-list">
                    {invoiceExpenses.length > 0 ? invoiceExpenses.slice(0, 5).map(([id, amt]) => (
                      <div className="mini-item" key={id}>
                        <span>Invoice #{id.substring(0, 6)}</span>
                        <span className="val">₦{amt.toLocaleString()}</span>
                      </div>
                    )) : <p className="empty">No linked expenses yet</p>}
                  </div>
               </div>
               
               {/* Sorted Categories */}
               <div className="side-card">
                  <h4>Highest Spend Areas</h4>
                  <div className="breakdown-list">
                    {sortedCategories.map(([cat, val]) => (
                      <div className="progress-item" key={cat}>
                        <div className="prog-labels">
                          <span>{cat}</span>
                          <b>₦{val.toLocaleString()}</b>
                        </div>
                        <div className="bar">
                          <div className="fill" style={{ width: `${(val / stats.totalExpenses) * 100}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Modal remains same as previous code... */}
      {showExpenseModal && (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>New Expense</h2>
            <IoCloseOutline onClick={() => setShowExpenseModal(false)} />
          </div>
       <form onSubmit={handleExpenseSubmit}>
  <label>Category</label>
  <select
    value={expenseForm.category}
    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
  >
    <option>Materials</option>
    <option>Transportation</option>
    <option>Workforce Lunch</option>
    <option>Ads & Ads</option>
    <option>Misc</option>
  </select>

  <label>Amount (₦)</label>
  <input
    type="number"
    required
    placeholder="0.00"
    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
  />

  <label>Link to Invoice (Optional)</label>
  <input
    type="text"
    list="invoice-suggestions"
    placeholder="Start typing Client Name or ID..."
    value={expenseForm.invoiceId}
    onChange={(e) => setExpenseForm({ ...expenseForm, invoiceId: e.target.value })}
    autoComplete="off" // Prevents browser history from confusing the datalist
  />

  <datalist id="invoice-suggestions">
    {invoices.map((inv) => {
      // Create the short 6-char ID
      const shortId = inv.id.substring(0, 6).toUpperCase();
      return (
        <option key={inv.id} value={shortId}>
          {inv.client} — ₦{Number(inv.amount || 0).toLocaleString()}
        </option>
      );
    })}
  </datalist>

  <button type="submit" className="submit-btn">Save Expense</button>
</form>
        </div>
      </div>
    )}
      </div>
    </div>
  );
}

export default Accounting;