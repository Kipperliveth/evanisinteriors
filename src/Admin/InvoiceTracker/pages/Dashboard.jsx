import React, { useEffect, useState, useMemo } from 'react';
import Navigation from '../components/Navigation';
import { AiOutlineFileAdd } from "react-icons/ai";
import { FaEdit } from "react-icons/fa";
import { MdFormatListBulletedAdd } from "react-icons/md";
import { NavLink } from 'react-router-dom';
import { FiArrowUpRight, FiArrowDownLeft } from "react-icons/fi";
import { CiSearch } from "react-icons/ci";
// Firebase Imports
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { txtdb } from "../../../firebase-config";

function Dashboard() {
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]); // New state for expenses
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = "Dashboard";

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch Invoices
        const invSnap = await getDocs(query(collection(txtdb, "invoices"), orderBy("created", "desc")));
        const invoiceList = invSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          dateObj: doc.data().created?.toDate() || new Date(),
          date: doc.data().created?.toDate().toLocaleDateString() || "N/A",
        }));
        setInvoices(invoiceList);

        // 2. Fetch Expenses (Added for History)
        const expSnap = await getDocs(query(collection(txtdb, "expenses"), orderBy("createdAt", "desc"), limit(10)));
        const expenseList = expSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          dateObj: doc.data().createdAt?.toDate() || new Date(doc.data().date),
        }));
        setExpenses(expenseList);

        // 3. Fetch Clients
        const clientSnap = await getDocs(query(collection(txtdb, "clients"), limit(4))); 
        setContacts(clientSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          image: doc.data().image || `https://api.dicebear.com/9.x/adventurer/svg?seed=${doc.data().name.replace(" ", "")}`
        })));

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- Live Transaction History Logic ---
  const liveTransactions = useMemo(() => {
    const income = invoices.map(inv => ({
      name: inv.client,
      note: "Furniture Sale",
      amount: `+₦${(inv.paid || 0).toLocaleString()}`,
      type: "income",
      date: inv.dateObj
    }));

    const outgo = expenses.map(exp => ({
      name: exp.category,
      note: exp.note,
      amount: `-₦${(exp.amount || 0).toLocaleString()}`,
      type: "expense",
      date: exp.dateObj
    }));

    // Merge, Sort by Date, and take only the top 4
    return [...income, ...outgo]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 4);
  }, [invoices, expenses]);

  // (Keeping your existing totals and status badge logic here...)
  const totals = useMemo(() => {
    /* ... your existing totals calculation ... */
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    let totalInvoiceValue = 0; let totalPaidValue = 0; let totalOutstandingValue = 0;
    let totalCount = 0; let paidCount = 0; let pendingCount = 0;

    invoices.forEach(inv => {
      totalInvoiceValue += Number(inv.amount) || 0;
      totalPaidValue += Number(inv.paid) || 0;
      totalOutstandingValue += Number(inv.outstanding) || 0;
      if (inv.dateObj?.getMonth() === currentMonth && inv.dateObj?.getFullYear() === currentYear) {
        totalCount++;
        if (inv.status === "Paid") paidCount++;
        else pendingCount++;
      }
    });

    return { totalInvoiceValue, totalPaidValue, totalOutstandingValue, totalCount, paidCount, pendingCount };
  }, [invoices]);

const getStatusBadge = (status, dateObj) => {
  let label = status;

  let className = status
    .toLowerCase()
    .replace(/\s+/g, '-')   // replace spaces with dash
    .replace(/_/g, '-');    // replace underscores if any

  if (status !== 'Paid' && dateObj) {
    const today = new Date();
    const due = new Date(dateObj);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      label = `Overdue by ${Math.abs(diffDays)}d`;
      className = 'overdue';
    } else if (diffDays <= 7) {
      label = `Due in ${diffDays}d`;
      className = 'due';
    }
  }

  return <span className={`badge ${className}`}>{label}</span>;
};

  return (
    <div className='layout'>
      <Navigation />
      <div className="dashboard">
        {/* ... Header and Search ... */}
        <div className="dashboard-header">
            <p>Dashboard</p>
            <div className="search">
                <CiSearch className='icon'/>
                <input type="search" placeholder='Inv. Numbers, Client, Status, Date'/>
            </div>
        </div>

        <div className="dashboard-container">
          <div className="left">
            {/* Totals Section */}
            <div className="totals">
                <div className="invoice-box total">
                    <p className='head'>Total Invoice Value</p>
                    <h1>₦{totals.totalInvoiceValue.toLocaleString()}</h1>
                    <p className='from'>{totals.totalCount} invoices this month</p>
                </div>
                <div className="invoice-box paid">
                    <p className='head'>Paid</p>
                    <h1>₦{totals.totalPaidValue.toLocaleString()}</h1>
                    <p className='from'>{totals.paidCount} fully paid this month</p>
                </div>
                <div className="invoice-box pending">
                    <p className='head'>Pending (Outstanding)</p>
                    <h1>₦{totals.totalOutstandingValue.toLocaleString()}</h1>
                    <p className='from'>{totals.pendingCount} unpaid/partial this month</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="actions">
                <NavLink to="/invoices" className="action create">
                    <AiOutlineFileAdd className='icon'/><p>Create invoice</p>
                </NavLink>
                <span></span>
                <NavLink to="/invoices" className="action edit">
                    <FaEdit className='icon'/><p>Edit Invoice</p>
                </NavLink>
                <span></span>
                <NavLink to="/accounting" className="action add">
                    <MdFormatListBulletedAdd className='icon'/><p>Add Transaction</p>
                </NavLink>
            </div>

            {/* Recent Invoices Table */}
            <div className="all-invoices">
              <div className="invoice-head-container">
                <h4>Recent Invoices</h4>
                <NavLink to="/invoices">View all</NavLink>
              </div>
              <div className="invoice-table">
                {/* ... (Your existing table header and row mapping) ... */}
                {invoices.slice(0, 5).map((item, index) => (
                    <div className="invoice-row" key={index}>
                        <p className="number">#{item.id.substring(0, 6).toUpperCase()}</p>
                        <p className="customer">{item.client}</p>
                        <p className="status">{getStatusBadge(item.status, item.dateObj)}</p>
                        <p className="amount">₦{item.amount.toLocaleString()}</p>
                        <p className="date">{item.date}</p>
                    </div>
                ))}
              </div>
            </div>
          </div>

          <div className="right">
            {/* Clients Card */}
            <div className="contacts-card">
              <div className="contacts-head">
                <h4>Clients</h4>
                <NavLink to="/clients">View all</NavLink>
              </div>
              <div className="contacts-list">
                {contacts.map((contact, index) => (
                  <div className="contact-item" key={index}>
                    <img src={contact.image} alt="" />
                    <div className="contact-info">
                      <h3>{contact.name}</h3>
                      <p>{contact.contact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* LIVE Transaction History Component */}
            <div className="transaction-card">
              <div className="transaction-header">
                <h4>Transaction History</h4>
                <NavLink to="/accounting">View all</NavLink>
              </div>
              <div className="transaction-list">
                {isLoading ? (
                  <p className="loading-text">Loading...</p>
                ) : liveTransactions.length > 0 ? (
                  liveTransactions.map((item, index) => (
                    <div className="transaction-item" key={index}>
                      <div className={`icon-circle ${item.type}`}>
                        {item.type === "income" ? <FiArrowDownLeft className="icon" /> : <FiArrowUpRight className="icon" />}
                      </div>
                      <div className="transaction-info">
                        <h3>{item.name}</h3>
                        <p>{item.note}</p>
                      </div>
                      <div className={`amount ${item.type}`}>
                        {item.amount}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-small">No transactions found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;