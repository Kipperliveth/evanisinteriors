import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import logo from "../../stock/new-logo.svg"; 
import { IoIosNotificationsOutline } from "react-icons/io";
import { AiOutlineShoppingCart } from "react-icons/ai";
import { CiUser } from "react-icons/ci";
import { BsBox2 } from "react-icons/bs";
import { LiaUserEditSolid } from "react-icons/lia";
import { RiMenu4Fill, RiCloseFill } from "react-icons/ri";
import { auth, txtdb } from "../../firebase-config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, getDocs } from "firebase/firestore";

function UserNav() {
  const [user, setUser] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const profileDropdownRef = useRef(null); 

  // UI States
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);

  // Data States
  const [cartItemCount, setCartItemCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const currentUser = auth.currentUser;

  // ==========================================
  // CLICK OUTSIDE LOGIC
  // ==========================================
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowUserInfo(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ==========================================
  // SCROLL & MENU LOGIC 
  // ==========================================
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [isMobileMenuOpen]);

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMenu = () => setIsMobileMenuOpen(false);
  const toggleUserInfo = () => setShowUserInfo(!showUserInfo);

  // ==========================================
  // AUTH & ROUTING LOGIC
  // ==========================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    if (auth.currentUser) {
      await signOut(auth);
      localStorage.clear();
      navigate("/login");
    } else {
      localStorage.clear();
      navigate("/login");
    }
  };

  const handleActionClick = (path) => {
    closeMenu();
    setShowUserInfo(false);
    navigate(path);
  };

  // ==========================================
  // FIREBASE CART LOGIC (WITH QUANTITIES)
  // ==========================================
  const fetchProducts = async () => {
    if (currentUser) {
      const userId = currentUser.uid;
      const productRef = collection(txtdb, `users/${userId}/products`);
      try {
        const querySnapshot = await getDocs(productRef);
        const totalItems = querySnapshot.docs.reduce((sum, doc) => {
          const data = doc.data();
          return data.isInStock ? sum + (data.quantity || 1) : sum;
        }, 0);
        setCartItemCount(totalItems);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchProducts();
      const unsubscribe = onSnapshot(collection(txtdb, `users/${currentUser.uid}/products`), (snapshot) => {
        const totalItems = snapshot.docs.reduce((sum, doc) => {
          const data = doc.data();
          return data.isInStock ? sum + (data.quantity || 1) : sum;
        }, 0);
        setCartItemCount(totalItems);
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  // ==========================================
  // FIREBASE NOTIFICATION LOGIC
  // ==========================================
  useEffect(() => {
    if (!user) return;
    const userId = user.uid;
    const q = query(
      collection(txtdb, `userNotifications/${userId}/notificationCount`),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = snapshot.docs.map((doc) => {
        let timestamp = doc.data().timestamp instanceof Date ? doc.data().timestamp : new Date(doc.data().timestamp);
        return {
          id: doc.id,
          ...doc.data(),
          timestamp: timestamp.toLocaleString([], { day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }),
        };
      });

      if (newNotifications.length > notifications.length) {
        const unreadNotifications = newNotifications.filter((notification) => !notification.read);
        setUnreadCount(unreadNotifications.length);
      }
      setNotifications(newNotifications);
    });
    return () => unsubscribe();
  }, [user, location, notifications]);

  const hiddenPaths = ["/login", "/signup"];
  if (hiddenPaths.includes(location.pathname) || location.pathname.startsWith("/admin")) {
    return null;
  }

  const navbarClass = `minimalist-header default-mode ${isScrolled ? "scrolled" : ""}`;

  return (
    <header className={navbarClass}>
      <div className="nav-container">
        
        {/* Left: Brand Identity */}
        <div className="nav-left">
          <NavLink to="/store" className="brand-logo" onClick={closeMenu}>
            <img src={logo} alt="Evanis Interiors" />
          </NavLink>
        </div>

        {/* Center: Desktop Links */}
        <nav className="nav-center desktop-only">
          <NavLink to="/store" className={({ isActive }) => (isActive ? "active nav-link" : "nav-link")}>
            <span className="link-text">Collection</span>
          </NavLink>
          
          <NavLink to="/gethelp" className={({ isActive }) => (isActive ? "active nav-link" : "nav-link")}>
             <span className="link-text">Support</span>
          </NavLink>
        </nav>

        {/* Right: Actions & Profile */}
        <div className="nav-right">
          
          {/* Desktop Actions */}
          <div className="desktop-actions desktop-only">
            
            <div className="icon-wrapper" onClick={() => handleActionClick("/notifications")}>
              <IoIosNotificationsOutline className="action-icon" title="Notifications" />
              {unreadCount > 0 && <span className="action-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </div>

            <div className="icon-wrapper" onClick={() => handleActionClick("/cart")}>
              <AiOutlineShoppingCart className="action-icon" title="Cart" />
              {cartItemCount > 0 && <span className="action-badge">{cartItemCount > 99 ? '99+' : cartItemCount}</span>}
            </div>

            {/* Profile Dropdown Toggle & Menu Wrapper */}
            <div className="profile-wrapper" ref={profileDropdownRef}>
              <div className="icon-wrapper user-icon-toggle" onClick={toggleUserInfo}>
                <CiUser className="action-icon" title="Profile" />
              </div>

              {/* Profile Dropdown Menu */}
              <div className={`profile-dropdown-menu ${showUserInfo ? "active" : ""}`}>
                <div className="dropdown-header">
                  <p>My Account</p>
                </div>
                <div className="popover-group">
                  <NavLink to="/userProfile" onClick={() => setShowUserInfo(false)} className="popover-link">
                    <LiaUserEditSolid className="popover-icon" />
                    <span>View Profile</span>
                  </NavLink>
                  <NavLink to="/myorders" onClick={() => setShowUserInfo(false)} className="popover-link">
                    <BsBox2 className="popover-icon" />
                    <span>My Orders</span>
                  </NavLink>
                </div>
                <div className="popover-divider"></div>
                <div className="popover-group">
                  <div onClick={logout} className="popover-link logout-link">
                    <span>Log Out</span>
                  </div>
                </div>
              </div>
            </div>
            
          </div>

          {/* Mobile Actions */}
          <div className="mobile-header-actions mobile-only">
            
            <div className="mobile-icon-btn" onClick={() => handleActionClick("/notifications")}>
              <IoIosNotificationsOutline />
              {unreadCount > 0 && <span className="action-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </div>

            <div className="mobile-icon-btn" onClick={() => handleActionClick("/cart")}>
              <AiOutlineShoppingCart />
              {cartItemCount > 0 && <span className="action-badge">{cartItemCount > 99 ? '99+' : cartItemCount}</span>}
            </div>

            <div className="mobile-toggle" onClick={toggleMenu}>
              {isMobileMenuOpen ? <RiCloseFill /> : <RiMenu4Fill />}
            </div>

          </div>

        </div>
      </div>

      {/* Mobile Popover Overlay */}
      {isMobileMenuOpen && <div className="mobile-popover-overlay" onClick={closeMenu}></div>}

      {/* Mobile Popover Menu */}
      <div className={`mobile-popover-menu ${isMobileMenuOpen ? "active" : ""}`}>
        <div className="popover-group">
          <NavLink to="/store" onClick={closeMenu} className="popover-link">
            <span>Collection</span>
          </NavLink>
          <NavLink to="/gethelp" onClick={closeMenu} className="popover-link">
            <span>Support</span>
          </NavLink>
        </div>

        <div className="popover-divider"></div>

        <div className="popover-group">
          <NavLink to="/userProfile" onClick={closeMenu} className="popover-link">
            <LiaUserEditSolid className="popover-icon" />
            <span>Profile Details</span>
          </NavLink>
          <NavLink to="/myorders" onClick={closeMenu} className="popover-link">
            <BsBox2 className="popover-icon" />
            <span>Order History</span>
          </NavLink>
        </div>
        
        <div className="popover-divider"></div>

        <div className="popover-group">
          <div onClick={logout} className="popover-link logout-link">
            <span>Log Out</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default UserNav;