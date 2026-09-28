import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { FaInstagram, FaWhatsapp, FaPinterestP } from "react-icons/fa";
import { MdMailOutline, MdLocationOn } from "react-icons/md";
import logo from "../stock/new-logo.svg"; 

function Footer() {
  const location = useLocation();

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hiddenPaths = ["/adminHome", "/post", "/uploads", "/orders", "/adminNotifications"];
  const allPaths = [
    "/", "/marketplace", "/store", "/address", "/userDashboard",
    "/adminHome", "/adminNotifications", "/post", "/orders", "/cart", "/userProfile",
    "/notifications", "/uploads", "/profilePic", "/editAddress",
    "/myorders", "/gethelp", "/editprofile", "/adminlog", "/login", "/signup", 
    "/about", "/contact", "/reset", "/shop", "/designs", "/services"
  ];

  const shouldHideComponent =
    hiddenPaths.includes(location.pathname) || 
    (!allPaths.includes(location.pathname) && !location.pathname.startsWith("/shop/"));

  if (shouldHideComponent) return null;

  return (
    <footer className="modern-footer">
      <div className="footer-container">
        
        {/* Top Section: 4-Column Grid */}
        <div className="footer-grid">
          
          {/* Column 1: Brand & Bio */}
          <div className="footer-brand-col">
            <NavLink to="/" onClick={handleScrollToTop} className="logo-container">
              <img src={logo} alt="Evanis Interiors Logo" />
            </NavLink>
            <p className="brand-bio">
              Transforming spaces into timeless environments. We create bespoke furniture and execute full-scale interior architecture tailored to your lifestyle.
            </p>
            <div className="location-tag">
              <MdLocationOn className="loc-icon" />
              <span>38 Emmanuel Bus Stop, Akute/Ajuwon Road, Lagos</span>
            </div>
            <div className="socials">
              <a href="https://www.instagram.com/evanis_homes?igsh=bGljMXdoZDR6MWtt" target="_blank" rel="noreferrer" aria-label="Instagram">
                <FaInstagram className="footer-icon" />
              </a>
              <a href="#" aria-label="Pinterest">
                <FaPinterestP className="footer-icon" />
              </a>
              <a href="#" aria-label="WhatsApp">
                <FaWhatsapp className="footer-icon" />
              </a>
              <a href="#" aria-label="Email">
                <MdMailOutline className="footer-icon" />
              </a>
            </div>
          </div>

          {/* Column 2: Services */}
          <div className="footer-link-col">
            <h4>Services</h4>
            <ul>
              <li><NavLink to="/services" onClick={handleScrollToTop}>Full Interior Architecture</NavLink></li>
              <li><NavLink to="/services" onClick={handleScrollToTop}>Spatial Planning & Styling</NavLink></li>
              <li><NavLink to="/services" onClick={handleScrollToTop}>Custom Furniture Builds</NavLink></li>
              <li><NavLink to="/services" onClick={handleScrollToTop}>Renovations & Remodeling</NavLink></li>
              <li><NavLink to="/contact" onClick={handleScrollToTop}>Design Consultations</NavLink></li>
            </ul>
          </div>

          {/* Column 3: Furniture Shop */}
          <div className="footer-link-col">
            <h4>Collection</h4>
            <ul>
              <li><NavLink to="/shop/sofas-seating" onClick={handleScrollToTop}>Sofas & Lounges</NavLink></li>
              <li><NavLink to="/shop/tables-desks" onClick={handleScrollToTop}>Dining & Accent Tables</NavLink></li>
              <li><NavLink to="/shop/storage" onClick={handleScrollToTop}>Credenzas & Shelving</NavLink></li>
              <li><NavLink to="/shop/beds" onClick={handleScrollToTop}>Beds & Headboards</NavLink></li>
              <li><NavLink to="/shop/decor" onClick={handleScrollToTop}>Lighting & Objects</NavLink></li>
            </ul>
          </div>

          {/* Column 4: Company & Support */}
          <div className="footer-link-col">
            <h4>Support</h4>
            <ul>
              <li><NavLink to="/about" onClick={handleScrollToTop}>Our Studio</NavLink></li>
              <li><NavLink to="/contact" onClick={handleScrollToTop}>Request a Quote</NavLink></li>
              <li><NavLink to="/faqs" onClick={handleScrollToTop}>FAQs</NavLink></li>
              <li><NavLink to="/shipping" onClick={handleScrollToTop}>Delivery & Logistics</NavLink></li>
              <li><NavLink to="/contact" onClick={handleScrollToTop}>Contact</NavLink></li>
            </ul>
          </div>

        </div>

        {/* Bottom Section: Copyright & Legal */}
        <div className="footer-bottom">
          <p className="copyright">
            &copy; {new Date().getFullYear()} evanis interiors. All rights reserved.
          </p>
          <div className="legal-links">
            <NavLink to="/terms" onClick={handleScrollToTop}>Terms of Service</NavLink>
            <NavLink to="/privacy" onClick={handleScrollToTop}>Privacy Policy</NavLink>
          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;