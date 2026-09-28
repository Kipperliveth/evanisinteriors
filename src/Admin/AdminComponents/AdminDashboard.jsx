import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
// UPDATED: Using the new logo
import logo from "../../stock/new-logo.svg"; 
import { MdOutlineDashboard, MdOutlineSchedule, MdCancel } from "react-icons/md";
import { IoIosNotificationsOutline } from "react-icons/io";
import { IoCloudUploadOutline } from "react-icons/io5";
import { IoMdCloudOutline } from "react-icons/io";
import { LiaChalkboardTeacherSolid } from "react-icons/lia";
import { AiOutlineMenu } from "react-icons/ai";
import { CiDeliveryTruck } from "react-icons/ci";

import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { auth, txtdb } from "../../firebase-config";

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

  return (
    <>
      {/* =========================================
          DESKTOP SIDEBAR 
          ========================================= */}
      <div className="admin-sidebar desktop-only">
        
        <div className="sidebar-header">
          <NavLink to="/adminHome" className="logo-container">
            {/* Removed the hardcoded text since the new SVG includes it */}
            <img src={logo} alt="Evanis Interiors" />
          </NavLink>
        </div>

        <div className="sidebar-scroll-area">
          <div className="sidebar-nav-group">
            <NavLink to="/adminHome" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <MdOutlineDashboard className="nav-icon" /> 
              <span>Dashboard</span>
            </NavLink>
            
            <NavLink to="/adminNotifications" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <IoIosNotificationsOutline className="nav-icon" /> 
              <span>Notifications</span>
              {notificationsCount > 0 && <div className="badge">{notificationsCount}</div>}
            </NavLink>
          </div>

          <div className="sidebar-nav-group">
            <h4 className="group-title">Shop Management</h4>
            
            <NavLink to="/post" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <IoCloudUploadOutline className="nav-icon" /> 
              <span>Post Product</span>
            </NavLink>
            
            <NavLink to="/orders" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <CiDeliveryTruck className="nav-icon" /> 
              <span>Orders</span>
              {ordersCount > 0 && <div className="badge highlight">{ordersCount}</div>}
            </NavLink>
            
            <NavLink to="/uploads" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <IoMdCloudOutline className="nav-icon" /> 
              <span>Uploads</span>
            </NavLink>
          </div>

          <div className="sidebar-nav-group">
            <h4 className="group-title">Masterclass</h4>
            
            <div className="nav-item disabled">
              <LiaChalkboardTeacherSolid className="nav-icon" /> 
              <span>Start a Class</span>
            </div>
            
            <div className="nav-item disabled">
              <MdOutlineSchedule className="nav-icon" />
              <span>Schedules</span>
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <NavLink to="/adminlog" className={({isActive}) => isActive ? "admin-profile active" : "admin-profile"}>
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

      </div>

      {/* =========================================
          MOBILE FLOATING MENU 
          ========================================= */}
      <div className="mobile-admin-wrapper mobile-only">
        
        {/* Floating Menu Toggle Button */}
        <div className={`mobile-toggle-btn ${isOpen ? "open" : ""}`} onClick={toggleMenu}>
          {isOpen ? <MdCancel className="toggle-icon" /> : <AiOutlineMenu className="toggle-icon" />}
        </div>

        {/* Overlay Background */}
        <div className={`mobile-overlay ${isOpen ? "active" : ""}`} onClick={closeMenu}></div>

        {/* Slide-out Menu Panel */}
        <div className={`mobile-menu-panel ${isOpen ? "active" : ""}`}>
          
          <div className="mobile-header">
            <img src={logo} alt="Evanis" className="mobile-logo"/>
          </div>

          <div className="mobile-scroll-area">
            <NavLink to="/adminHome" onClick={closeMenu} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <MdOutlineDashboard className="nav-icon" /> <span>Dashboard</span>
            </NavLink>
            
            <NavLink to="/adminNotifications" onClick={closeMenu} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <IoIosNotificationsOutline className="nav-icon" /> <span>Notifications</span>
              {notificationsCount > 0 && <div className="badge">{notificationsCount}</div>}
            </NavLink>

            <div className="mobile-divider"></div>

            <NavLink to="/post" onClick={closeMenu} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <IoCloudUploadOutline className="nav-icon" /> <span>Post Product</span>
            </NavLink>
            
            <NavLink to="/orders" onClick={closeMenu} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <CiDeliveryTruck className="nav-icon" /> <span>Orders</span>
              {ordersCount > 0 && <div className="badge highlight">{ordersCount}</div>}
            </NavLink>
            
            <NavLink to="/uploads" onClick={closeMenu} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <IoMdCloudOutline className="nav-icon" /> <span>Uploads</span>
            </NavLink>

            <div className="mobile-divider"></div>

            <NavLink to="/adminlog" onClick={closeMenu} className="mobile-profile-card">
              <img src={user?.photoURL || "https://ui-avatars.com/api/?name=Admin&background=1a1a1a&color=fff"} alt="Admin" />
              <div className="profile-info">
                <p className="name">{user?.displayName || "Admin"}</p>
                <p className="role">Administrator</p>
              </div>
            </NavLink>
          </div>

        </div>

      </div>
    </>
  );
}

export default AdminDashboard;