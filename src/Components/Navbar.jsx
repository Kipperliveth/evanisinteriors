import React, { useState, useEffect } from "react";
import logo from "../stock/new-logo.svg";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import {
  AiOutlineInfoCircle,
  AiOutlineHome,
  AiOutlineSend,
} from "react-icons/ai";
import { MdOutlineChair, MdOutlinePhone } from "react-icons/md";
import { LuUserCircle2 } from "react-icons/lu";
import { FiHeart, FiShoppingBag, FiMenu, FiX } from "react-icons/fi";

import { auth, txtdb } from "../firebase-config";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Track auth state inside Navbar
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  const isTransparentPage = ["/about", "/contact"].includes(location.pathname);

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
    return () => {
      document.body.style.overflow = "auto";
    };
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
      setIsAuthChecking(false);

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
          const totalItems = guestCart.reduce(
            (sum, item) => (item.isInStock ? sum + (item.quantity || 1) : sum),
            0
          );
          setCartCount(totalItems);
        };

        checkLocalCart();
        window.addEventListener("storage", checkLocalCart);
        const intervalId = setInterval(checkLocalCart, 1000);

        return () => {
          window.removeEventListener("storage", checkLocalCart);
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

  const hiddenPaths = [
    "/marketplace", "/userDashboard", "/adminHome",
    "/adminNotifications", "/post", "/orders",
    "/userProfile", "/notifications", "/uploads", "/onboarding",
    "/profilePic", "/editAddress", "/myorders", "/editprofile", "/adminlog",
    "/accounting", "/expenses", "/expensedash", "/clients", "/invoices",
    "/reminders", "/financetracking", "/client", "/estimates", "/projects",
    "/purchases", "/reports", "/transactions", "/vendors",
  ];

  if (hiddenPaths.includes(location.pathname) || location.pathname.startsWith("/admin")) {
    return null;
  }

  // DYNAMIC NAV SWAP: Hide Public Navbar on Store/Cart/Saved/GetHelp when logged in
  const isSharedStoreRoute = ["/store", "/cart", "/saved", "/gethelp"].includes(location.pathname);
  if (isSharedStoreRoute && (isAuthChecking || currentUser)) {
    return null;
  }

  const userTargetRoute = currentUser ? "/userProfile" : "/login";

  const navbarClass = `minimalist-header ${
    isScrolled ? "scrolled default-mode" : isTransparentPage ? "transparent-mode" : "default-mode"
  }`;

  return (
    <header className={navbarClass}>
      <div className="nav-container">
        
        {/* Left: Brand Identity */}
        <div className="nav-left">
          <NavLink
            to="/"
            className="brand-logo"
            onClick={() => {
              closeMenu();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <img src={logo} alt="Evanis Interiors" />
          </NavLink>
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="nav-center desktop-only">
          <NavLink
            to="/about"
            className={({ isActive }) =>
              isActive && location.hash !== "#faqs" ? "active nav-link" : "nav-link"
            }
          >
            <span className="link-text">The Studio</span>
          </NavLink>
          <NavLink
            to="/store"
            className={({ isActive }) => (isActive ? "active nav-link" : "nav-link")}
          >
            <span className="link-text">Furnitures</span>
          </NavLink>
          <Link to="/#faqs" onClick={handleFaqClick} className="nav-link">
            <span className="link-text">FAQs</span>
          </Link>
          <NavLink
            to="/contact"
            className={({ isActive }) => (isActive ? "active nav-link" : "nav-link")}
          >
            <span className="link-text">Contact Us</span>
          </NavLink>
        </nav>

        {/* Right: Actions */}
        <div className="nav-right">
          
          {/* Desktop Actions: User Circle -> Heart (/saved) -> Bag (/cart) -> Request Quote */}
          <div className="desktop-actions desktop-only">
            <div className="icon-wrapper" onClick={() => handleActionClick(userTargetRoute)}>
              <LuUserCircle2 className="action-icon" title="User Account" />
            </div>

            <div className="icon-wrapper" onClick={() => handleActionClick("/saved")}>
              <FiHeart className="action-icon" title="Saved Products" />
            </div>

            <div className="icon-wrapper cart-wrapper" onClick={() => handleActionClick("/cart")}>
              <FiShoppingBag className="action-icon" title="Bag" />
              {cartCount > 0 && (
                <span className="cart-badge">{cartCount > 99 ? "99+" : cartCount}</span>
              )}
            </div>

            <button className="solid-btn" onClick={() => handleActionClick("/contact")}>
              Request Quote
            </button>
          </div>

          {/* Mobile Actions: User Circle -> Heart (/saved) -> Bag (/cart) -> Thin Menu */}
          <div className="mobile-header-actions mobile-only">
            <div
              className="mobile-icon-btn"
              onClick={() => handleActionClick(userTargetRoute)}
              aria-label="Account"
            >
              <LuUserCircle2 />
            </div>

            <div
              className="mobile-icon-btn"
              onClick={() => handleActionClick("/saved")}
              aria-label="Saved Products"
            >
              <FiHeart />
            </div>

            <div
              className="mobile-icon-btn cart-wrapper"
              onClick={() => handleActionClick("/cart")}
              aria-label="Shopping Bag"
            >
              <FiShoppingBag />
              {cartCount > 0 && (
                <span className="cart-badge">{cartCount > 99 ? "99+" : cartCount}</span>
              )}
            </div>

            <div className="mobile-toggle" onClick={toggleMenu} aria-label="Menu">
              {isMobileMenuOpen ? <FiX /> : <FiMenu />}
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Popover Overlay */}
      {isMobileMenuOpen && <div className="mobile-popover-overlay" onClick={closeMenu}></div>}

      {/* Mobile Popover Menu */}
      <div className={`mobile-popover-menu ${isMobileMenuOpen ? "active" : ""}`}>
        <div className="popover-group">
          <NavLink to="/about" onClick={closeMenu} className="popover-link">
            <AiOutlineHome className="popover-icon" />
            <span>The Studio</span>
          </NavLink>
          <NavLink to="/store" onClick={closeMenu} className="popover-link">
            <MdOutlineChair className="popover-icon" />
            <span>Furnitures</span>
          </NavLink>
          <NavLink to="/saved" onClick={closeMenu} className="popover-link">
            <FiHeart className="popover-icon" />
            <span>Saved Products</span>
          </NavLink>
          <Link to="/#faqs" onClick={handleFaqClick} className="popover-link">
            <AiOutlineInfoCircle className="popover-icon" />
            <span>FAQs</span>
          </Link>
          <NavLink to="/contact" onClick={closeMenu} className="popover-link">
            <MdOutlinePhone className="popover-icon" />
            <span>Contact Us</span>
          </NavLink>
        </div>
        <div className="popover-divider"></div>
        <div className="popover-group">
          <div onClick={() => handleActionClick("/contact")} className="popover-link">
            <AiOutlineSend className="popover-icon" />
            <span>Request Quote</span>
          </div>
        </div>
        <div className="popover-divider"></div>
        <div className="popover-group">
          <div onClick={() => handleActionClick(userTargetRoute)} className="popover-link">
            <LuUserCircle2 className="popover-icon" />
            <span>{currentUser ? "My Profile" : "Profile / Log in"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;