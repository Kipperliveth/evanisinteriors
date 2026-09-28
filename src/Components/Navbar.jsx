import React, { useState, useEffect } from "react";
import logo from "../stock/new-logo.svg"; 
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  AiOutlineShoppingCart, 
  AiOutlineUser,
  AiOutlineInfoCircle,
  AiOutlineHome,
  AiOutlineSend
} from "react-icons/ai";
import { MdOutlineChair, MdOutlinePhone } from "react-icons/md"; 
import { RiMenu4Fill, RiCloseFill } from "react-icons/ri";

import { auth, txtdb } from "../firebase-config";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0); 
  
  // NEW: Track auth state inside Navbar
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  const isTransparentPage = ["/about", "/contact", ].includes(location.pathname);

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

  useEffect(() => {
    if (location.pathname === "/" && location.hash === "#faqs") {
      const scrollTimer = setTimeout(() => {
        const faqSection = document.getElementById("faqs");
        if (faqSection) faqSection.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return () => clearTimeout(scrollTimer);
    }
  }, [location]);

  // Handle Hybrid Cart Count & Auth Status
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthChecking(false); // Auth check complete

      if (user) {
        const cartRef = collection(txtdb, `users/${user.uid}/products`);
        const unsubscribeSnapshot = onSnapshot(cartRef, (snapshot) => {
          const totalItems = snapshot.docs.reduce((sum, doc) => {
            const data = doc.data();
            return data.isInStock ? sum + (data.quantity || 1) : sum;
          }, 0);
          setCartCount(totalItems);
        });
        return () => unsubscribeSnapshot();
      } else {
        const checkLocalCart = () => {
          const guestCart = JSON.parse(localStorage.getItem("evanis_guest_cart")) || [];
          const totalItems = guestCart.reduce((sum, item) => item.isInStock ? sum + (item.quantity || 1) : sum, 0);
          setCartCount(totalItems);
        };
        
        checkLocalCart(); 
        window.addEventListener('storage', checkLocalCart);
        const intervalId = setInterval(checkLocalCart, 1000); 

        return () => {
          window.removeEventListener('storage', checkLocalCart);
          clearInterval(intervalId);
        };
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMenu = () => setIsMobileMenuOpen(false);

  const handleActionClick = (path) => {
    closeMenu();
    navigate(path);
  };

  const handleFaqClick = (e) => {
    closeMenu();
    if (location.pathname === "/") {
      e.preventDefault(); 
      const faqSection = document.getElementById("faqs");
      if (faqSection) faqSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  // 1. REMOVED "/store" and "/cart" from this list
  const hiddenPaths = [
    "/marketplace", "/userDashboard", "/adminHome",
    "/adminNotifications", "/post", "/orders", 
    "/userProfile", "/notifications", "/uploads", "/onboarding",
    "/profilePic", "/editAddress", "/myorders", "/editprofile", "/adminlog", "/accounting", "/expenses", "/expensedash", "/clients", "/invoices", "/reminders", "/financetracking", "/client", "/estimates", "/projects",
    "/purchases", "/reports", "/transactions", "/vendors"
  ];

  if (hiddenPaths.includes(location.pathname) || location.pathname.startsWith("/admin")) {
    return null;
  }

  // 2. DYNAMIC NAV SWAP: Hide Navbar on Store/Cart ONLY if logged in or still checking
  const isStoreOrCart = ["/store", "/cart"].includes(location.pathname);
  if (isStoreOrCart && (isAuthChecking || currentUser)) {
    return null; // Prevents both navbars from showing at the same time
  }

  const navbarClass = `minimalist-header ${isScrolled ? "scrolled default-mode" : (isTransparentPage ? "transparent-mode" : "default-mode")}`;

  return (
    <header className={navbarClass}>
      <div className="nav-container">
        
        <div className="nav-left">
          <NavLink to="/" className="brand-logo" onClick={() => { closeMenu(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
            <img src={logo} alt="Evanis Interiors" />
          </NavLink>
        </div>

        <nav className="nav-center desktop-only">
          <NavLink to="/about" className={({ isActive }) => (isActive && location.hash !== "#faqs" ? "active nav-link" : "nav-link")}>
            <span className="link-text">The Studio</span>
          </NavLink>
          <NavLink to="/store" className={({ isActive }) => (isActive ? "active nav-link" : "nav-link")}>
             <span className="link-text">Furnitures</span>
          </NavLink>
          <Link to="/#faqs" onClick={handleFaqClick} className="nav-link">
             <span className="link-text">FAQs</span>
          </Link>
          <NavLink to="/contact" className={({ isActive }) => (isActive ? "active nav-link" : "nav-link")}>
             <span className="link-text">Contact Us</span>
          </NavLink>
        </nav>

        <div className="nav-right">
          <div className="desktop-actions desktop-only">
            <div className="icon-wrapper" onClick={() => handleActionClick("/login")}>
                <AiOutlineUser className="action-icon" title="User Account" />
            </div>
            
            <div className="icon-wrapper cart-wrapper" onClick={() => handleActionClick("/cart")}>
                <AiOutlineShoppingCart className="action-icon" title="Cart" />
                {cartCount > 0 && <span className="cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>}
            </div>

            <button className="solid-btn" onClick={() => handleActionClick("/contact")}>
              Request Quote
            </button>
          </div>

          <div className="mobile-header-actions mobile-only">
            <div className="mobile-cart-btn cart-wrapper" onClick={() => handleActionClick("/cart")}>
              <AiOutlineShoppingCart />
              {cartCount > 0 && <span className="cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>}
            </div>
            <div className="mobile-toggle" onClick={toggleMenu}>
              {isMobileMenuOpen ? <RiCloseFill /> : <RiMenu4Fill />}
            </div>
          </div>
        </div>

      </div>

      {isMobileMenuOpen && <div className="mobile-popover-overlay" onClick={closeMenu}></div>}

      <div className={`mobile-popover-menu ${isMobileMenuOpen ? "active" : ""}`}>
        <div className="popover-group">
          <NavLink to="/about" onClick={closeMenu} className="popover-link"><AiOutlineHome className="popover-icon" /><span>The Studio</span></NavLink>
          <NavLink to="/store" onClick={closeMenu} className="popover-link"><MdOutlineChair className="popover-icon" /><span>Furnitures</span></NavLink>
          <Link to="/#faqs" onClick={handleFaqClick} className="popover-link"><AiOutlineInfoCircle className="popover-icon" /><span>FAQs</span></Link>
          <NavLink to="/contact" onClick={closeMenu} className="popover-link"><MdOutlinePhone className="popover-icon" /><span>Contact Us</span></NavLink>
        </div>
        <div className="popover-divider"></div>
        <div className="popover-group">
          <div onClick={() => handleActionClick("/contact")} className="popover-link"><AiOutlineSend className="popover-icon" /><span>Request Quote</span></div>
        </div>
        <div className="popover-divider"></div>
        <div className="popover-group">
          <div onClick={() => handleActionClick("/login")} className="popover-link"><AiOutlineUser className="popover-icon" /><span>Profile / Log in</span></div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;