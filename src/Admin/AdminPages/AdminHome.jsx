import React, { useState, useEffect } from "react";
import AdminDashboard from "../AdminComponents/AdminDashboard";
import { txtdb } from "../../firebase-config";
import { collection, onSnapshot } from "firebase/firestore";
import { NavLink } from "react-router-dom";
import { 
  FiTrendingUp, 
  FiShoppingBag, 
  FiBox, 
  FiBell, 
  FiExternalLink, 
  FiPlus, 
  FiArrowRight, 
  FiAlertCircle,
  FiCheckCircle,
  FiTruck,
  FiClock
} from "react-icons/fi";
// import "./AdminHome.scss"; // Or remove if you import all SCSS in a single global file

function AdminHome() {
  const [newOrders, setNewOrders] = useState([]);
  const [shippedOrders, setShippedOrders] = useState([]);
  const [pendingDelivery, setPendingDelivery] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to safely sort newest first
  const getTimeInMs = (dateVal) => {
    if (!dateVal) return 0;
    if (typeof dateVal.toDate === "function") return dateVal.toDate().getTime();
    const parsed = new Date(dateVal).getTime();
    return isNaN(parsed) ? 0 : parsed;
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return "N/A";
    const date = typeof dateVal.toDate === "function" ? dateVal.toDate() : new Date(dateVal);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  useEffect(() => {
    document.title = "Dashboard - Evanis Interiors Admin";

    const unsubOrders = onSnapshot(collection(txtdb, "orders"), (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => getTimeInMs(b.createdAt) - getTimeInMs(a.createdAt));
      setNewOrders(list);
    });

    const unsubShipped = onSnapshot(collection(txtdb, "pendingPickup"), (snap) => {
      setShippedOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubDelivery = onSnapshot(collection(txtdb, "pendingDelivery"), (snap) => {
      setPendingDelivery(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubCompleted = onSnapshot(collection(txtdb, "completed"), (snap) => {
      setCompletedOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubProducts = onSnapshot(collection(txtdb, "txtData"), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    });

    const unsubNotifs = onSnapshot(collection(txtdb, "notifications"), (snap) => {
      setUnreadNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubOrders();
      unsubShipped();
      unsubDelivery();
      unsubCompleted();
      unsubProducts();
      unsubNotifs();
    };
  }, []);

  // --- CALCULATE METRICS ---
  const allOrders = [...newOrders, ...shippedOrders, ...pendingDelivery, ...completedOrders];
  
  const totalRevenue = allOrders.reduce((sum, order) => {
    const itemTotal = Number(order.totalPrice) || 0;
    return sum + itemTotal;
  }, 0);

  const activeOrdersCount = newOrders.length + shippedOrders.length + pendingDelivery.length;
  const inStockProducts = products.filter(p => p.isInStock !== false);
  const outOfStockProducts = products.filter(p => p.isInStock === false);

  return (
    <div className="admin-layout-wrapper">
      <AdminDashboard />

      <div className="admin-page-content adminOverview">
        
        {/* --- TOP HEADER & QUICK ACTIONS --- */}
        <div className="overview-header">
          <div>
            <h1 className="page-title">Dashboard Overview</h1>
            <p className="page-subtitle">Real-time summary of store performance, orders, and inventory.</p>
          </div>

          <div className="header-actions">
            <NavLink to="/post" className="quick-btn primary">
              <FiPlus className="icon" /> Upload Product
            </NavLink>
            <a 
              href="https://www.evanisinteriors.com/financetracking" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="quick-btn secondary"
            >
              Accounting App <FiExternalLink className="icon" />
            </a>
          </div>
        </div>

        {/* --- FINANCE TRACKING PORTAL BANNER --- */}
        <div className="finance-portal-banner">
          <div className="banner-left">
            <span className="banner-tag">Financial Suite</span>
            <h2>Evanis Interiors Accounting & Ledger</h2>
            <p>Track project expenses, generate client invoices, and monitor cash flow in your dedicated finance workspace.</p>
          </div>
          <div className="banner-right">
            <a 
              href="https://www.evanisinteriors.com/financetracking" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="launch-finance-btn"
            >
              Open Finance Tracker <FiExternalLink className="icon" />
            </a>
          </div>
        </div>

        {/* --- 4-CARD KPI GRID --- */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-top">
              <span className="kpi-label">Gross Order Volume</span>
              <div className="kpi-icon-box"><FiTrendingUp /></div>
            </div>
            <h3 className="kpi-value">₦{totalRevenue.toLocaleString("en-US")}</h3>
            <p className="kpi-subtext">Across {allOrders.length} total lifetime orders</p>
          </div>

          <NavLink to="/orders" className="kpi-card clickable">
            <div className="kpi-top">
              <span className="kpi-label">Active Orders</span>
              <div className="kpi-icon-box"><FiShoppingBag /></div>
            </div>
            <h3 className="kpi-value">{activeOrdersCount}</h3>
            <p className="kpi-subtext">
              <span className="highlight-green">{newOrders.length} new</span> awaiting shipment
            </p>
          </NavLink>

          <NavLink to="/uploads" className="kpi-card clickable">
            <div className="kpi-top">
              <span className="kpi-label">Catalog Inventory</span>
              <div className="kpi-icon-box"><FiBox /></div>
            </div>
            <h3 className="kpi-value">{products.length}</h3>
            <p className="kpi-subtext">
              {inStockProducts.length} in stock · <span className={outOfStockProducts.length > 0 ? "highlight-red" : ""}>{outOfStockProducts.length} out of stock</span>
            </p>
          </NavLink>

          <NavLink to="/notifications" className="kpi-card clickable">
            <div className="kpi-top">
              <span className="kpi-label">Unread Alerts</span>
              <div className="kpi-icon-box"><FiBell /></div>
            </div>
            <h3 className="kpi-value">{unreadNotifications.length}</h3>
            <p className="kpi-subtext">Delivery quote requests & system alerts</p>
          </NavLink>
        </div>

        {/* --- ORDER FULFILLMENT PIPELINE --- */}
        <div className="pipeline-section">
          <div className="section-head">
            <h3>Order Fulfillment Pipeline</h3>
            <NavLink to="/orders" className="text-link">Manage All Orders <FiArrowRight /></NavLink>
          </div>

          <div className="pipeline-grid">
            <NavLink to="/orders" className="pipeline-step">
              <div className="step-icon new"><FiClock /></div>
              <div className="step-info">
                <span className="step-count">{newOrders.length}</span>
                <span className="step-label">New Orders</span>
              </div>
            </NavLink>

            <NavLink to="/orders" className="pipeline-step">
              <div className="step-icon shipped"><FiTruck /></div>
              <div className="step-info">
                <span className="step-count">{shippedOrders.length}</span>
                <span className="step-label">Shipped</span>
              </div>
            </NavLink>

            <NavLink to="/orders" className="pipeline-step">
              <div className="step-icon pending"><FiShoppingBag /></div>
              <div className="step-info">
                <span className="step-count">{pendingDelivery.length}</span>
                <span className="step-label">Pending Delivery</span>
              </div>
            </NavLink>

            <NavLink to="/orders" className="pipeline-step">
              <div className="step-icon completed"><FiCheckCircle /></div>
              <div className="step-info">
                <span className="step-count">{completedOrders.length}</span>
                <span className="step-label">Completed</span>
              </div>
            </NavLink>
          </div>
        </div>

        {/* --- BOTTOM SPLIT: RECENT ORDERS & STOCK ALERTS --- */}
        <div className="overview-split-grid">
          
          {/* LEFT: RECENT NEW ORDERS */}
          <div className="overview-panel">
            <div className="panel-header">
              <h3>Recent Incoming Orders</h3>
              <NavLink to="/orders" className="text-link">View All</NavLink>
            </div>

            {isLoading ? (
              <div className="panel-skeleton">
                {[1, 2, 3, 4].map(i => <div key={i} className="skel-line"></div>)}
              </div>
            ) : newOrders.length === 0 ? (
              <div className="panel-empty">
                <p>No pending new orders right now.</p>
              </div>
            ) : (
              <div className="mini-list">
                {newOrders.slice(0, 5).map((order) => (
                  <NavLink to="/orders" className="mini-row" key={order.id}>
                    <div className="row-left">
                      <span className="order-id">#{order.id.substring(0, 8)}</span>
                      <span className="customer-name">{order.username || order.userEmail}</span>
                    </div>
                    <div className="row-right">
                      <span className="order-amount">₦{parseFloat(order.totalPrice || 0).toLocaleString("en-US")}</span>
                      <span className="order-date">{formatDate(order.createdAt)}</span>
                    </div>
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: INVENTORY STOCK ALERTS */}
          <div className="overview-panel">
            <div className="panel-header">
              <h3>Out of Stock Alerts</h3>
              <NavLink to="/uploads" className="text-link">Manage Catalog</NavLink>
            </div>

            {isLoading ? (
              <div className="panel-skeleton">
                {[1, 2, 3].map(i => <div key={i} className="skel-line"></div>)}
              </div>
            ) : outOfStockProducts.length === 0 ? (
              <div className="panel-empty success">
                <FiCheckCircle className="empty-icon" />
                <p>All {products.length} catalog products are currently in stock.</p>
              </div>
            ) : (
              <div className="mini-list">
                {outOfStockProducts.slice(0, 5).map((item) => (
                  <NavLink to="/uploads" className="mini-row product-row" key={item.id}>
                    <div className="row-left with-img">
                      <img 
                        src={Array.isArray(item.imgUrl) ? item.imgUrl[0] : item.imgUrl} 
                        alt={item.txtVal} 
                      />
                      <div>
                        <span className="product-title">{item.txtVal}</span>
                        <span className="product-cat">{item.category}</span>
                      </div>
                    </div>
                    <div className="row-right">
                      <span className="stock-pill"><FiAlertCircle /> Out of Stock</span>
                    </div>
                  </NavLink>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

export default AdminHome;