import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
// UPDATED: Using the new logo
import logo from "../../stock/new-logo.svg"; 
import { MdOutlineDashboard, MdClose } from "react-icons/md";
import { IoIosNotificationsOutline } from "react-icons/io";
import { IoCloudUploadOutline } from "react-icons/io5";
import { IoMdCloudOutline } from "react-icons/io";
import { AiOutlineMenu } from "react-icons/ai";
import { CiDeliveryTruck } from "react-icons/ci";

import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { auth, txtdb } from "../../firebase-config";

const linkClass = ({ isActive }) => (isActive ? "nav-item active" : "nav-item");

function AdminDashboard() {
  const [user, setUser] = useState({});
  const [ordersCount, setOrdersCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false); 

  const toggleMenu = () => setIsOpen(!isOpen); 
  const closeMenu = () => setIsOpen(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  // Close the mobile menu with the Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === "Escape") setIsOpen(false); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Pending Orders Count
  useEffect(() => {
    const ordersCollection = collection(txtdb, "orders");
    const unsubscribe = onSnapshot(ordersCollection, (snapshot) => {
      setOrdersCount(snapshot.docs.length);
    }, (error) => {
      console.error("Error fetching orders:", error);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Admin Notifications Count
  useEffect(() => {
    const notificationsCollection = collection(txtdb, "notifications");
    const unsubscribe = onSnapshot(notificationsCollection, (snapshot) => {
      setNotificationsCount(snapshot.docs.length);
    }, (error) => {
      console.error("Error fetching notifications:", error);
    });
    return () => unsubscribe();
  }, []);

  // One shared layout for desktop and mobile so both always look the same.
  // `onNavigate` is only passed on mobile (closes the drawer after a tap).
  const renderNav = (onNavigate) => (
    <>
      <div className="sidebar-header">
        <NavLink to="/adminHome" className="logo-container" onClick={onNavigate}>
          <img src={logo} alt="Evanis Interiors" />
        </NavLink>
        {onNavigate && (
          <button type="button" className="sidebar-close" onClick={onNavigate} aria-label="Close menu">
            <MdClose />
          </button>
        )}
      </div>

      <nav className="sidebar-scroll-area">
        <div className="sidebar-nav-group">
          <h4 className="group-title">Overview</h4>

          <NavLink to="/adminHome" onClick={onNavigate} className={linkClass}>
            <MdOutlineDashboard className="nav-icon" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/adminNotifications" onClick={onNavigate} className={linkClass}>
            <IoIosNotificationsOutline className="nav-icon" />
            <span>Notifications</span>
            {notificationsCount > 0 && <span className="badge">{notificationsCount}</span>}
          </NavLink>
        </div>

        <div className="sidebar-nav-group">
          <h4 className="group-title">Shop Management</h4>

          <NavLink to="/post" onClick={onNavigate} className={linkClass}>
            <IoCloudUploadOutline className="nav-icon" />
            <span>Post Product</span>
          </NavLink>

          <NavLink to="/orders" onClick={onNavigate} className={linkClass}>
            <CiDeliveryTruck className="nav-icon" />
            <span>Orders</span>
            {ordersCount > 0 && <span className="badge highlight">{ordersCount}</span>}
          </NavLink>

          <NavLink to="/uploads" onClick={onNavigate} className={linkClass}>
            <IoMdCloudOutline className="nav-icon" />
            <span>Uploads</span>
          </NavLink>
        </div>
      </nav>

      <div className="sidebar-footer">
        <NavLink
          to="/adminlog"
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? "admin-profile active" : "admin-profile")}
        >
          <img
            src={user?.photoURL || "https://ui-avatars.com/api/?name=Admin&background=1a1a1a&color=fff"}
            alt="Admin Profile"
          />
          <div className="profile-info">
            <p className="name">{user?.displayName || "Admin"}</p>
            <p className="role">Administrator</p>
          </div>
        </NavLink>
      </div>
    </>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="admin-sidebar desktop-only">
        {renderNav()}
      </aside>

      {/* MOBILE: same sidebar, slides in from the left */}
      <div className="mobile-admin-wrapper mobile-only">
        <button
          type="button"
          className={`mobile-toggle-btn ${isOpen ? "hidden" : ""}`}
          onClick={toggleMenu}
          aria-label="Open menu"
        >
          <AiOutlineMenu className="toggle-icon" />
        </button>

        <div className={`mobile-overlay ${isOpen ? "active" : ""}`} onClick={closeMenu}></div>

        <aside className={`admin-sidebar mobile-menu-panel ${isOpen ? "active" : ""}`} aria-hidden={!isOpen}>
          {renderNav(closeMenu)}
        </aside>
      </div>
    </>
  );
}

export default AdminDashboard;