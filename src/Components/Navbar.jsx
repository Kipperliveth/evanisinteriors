import React, { useState } from "react";
import logo from "../stock/logomain.png";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { AiOutlineShoppingCart } from "react-icons/ai";
import { IoIosNotificationsOutline } from "react-icons/io";
import { RiMenu4Fill } from "react-icons/ri";
import { MdCancel } from "react-icons/md";

function Navbar() {
  const [isVisible, SetIsVisible] = useState(false);

  const toggleVisibilty = () => {
    SetIsVisible(!isVisible);
  };

  const navigate = useNavigate();

  const login = () => {
    navigate('/login'); // Replace '/target-page' with your target route
  };

  const location = useLocation();

  const hiddenPaths = [
    "/marketplace",
    "/store",
    "/address",
    "/userMasterclass",
    "/userDashboard",
    "/adminHome",
    "/adminNotifications",
    "/post", "/orders",
    "/cart",
    "/userProfile",
    '/notifications',
    "/uploads",
    "/onboarding",
    '/profilePic',
    '/editAddress',
    '/myorders',
    '/gethelp', '/editprofile', '/adminlog',
  ];

  const allPaths = [
    "/", "/marketplace", "/store", "/address", "/userMasterclass", "/userDashboard",
    "/adminHome", "/adminNotifications", "/post", "/orders", "/cart", "/userProfile",
    "/notifications", "/uploads", "/onboarding", "/profilePic", "/editAddress",
    "/myorders", "/gethelp", "/editprofile", "/adminlog", '/login', '/signup', '/masterclass', '/about', '/contact','/reset', '/shop', '/shop/*'
  ];

  const shouldHideComponent =
  hiddenPaths.includes(location.pathname) ||
  (!allPaths.includes(location.pathname) && !location.pathname.startsWith("/shop/"));


  return (
    <div style={{ display: shouldHideComponent ? "none" : "block" }}>
      <div className="navigation ">
        <nav className=" navbar">
          <NavLink to="/" className="logo-container">
            <img src={logo} alt="evanis-interior-logo" />
            <p className="logo">
              <span>EVANIS</span> INTERIORS
            </p>
          </NavLink>

          <ul className="page-links">
            <li>
              <NavLink
                className={({ isActive }) =>
                  isActive ? "active-link" : "link"
                }
                to="/shop"
              >
                Shop
              </NavLink>
            </li>
            <li>
              <NavLink
                className={({ isActive }) =>
                  isActive ? "active-link" : "link"
                }
                to="/masterclass"
              >
                {" "}
                Masterclass
              </NavLink>
            </li>
            <li>
              <NavLink
                className={({ isActive }) =>
                  isActive ? "active-link" : "link"
                }
                to="/about"
              >
                {" "}
                About
              </NavLink>
            </li>
            <li>
              <NavLink
                className={({ isActive }) =>
                  isActive ? "active-link" : "link"
                }
                to="/contact"
              >
                {" "}
                Contact
              </NavLink>
            </li>
          </ul>

          <div className="app">
            <div className='notif-bars'>

            <IoIosNotificationsOutline className="app-icon desktop-view notifs" />
            <div className="notif-bar bar1 desktop-view">
              <NavLink to="/login">Login</NavLink> to see notifications
            </div>
            <AiOutlineShoppingCart className="app-icon desktop-view cart" />
            <div className="notif-bar bar2 desktop-view">
              <NavLink to="/login">Login</NavLink> to see cart
            </div>
            
          </div>

            <NavLink to="/login" className="login-btn">
              Login
            </NavLink>

            <RiMenu4Fill
              className="app-icon mobile-view menu"
              onClick={toggleVisibilty}
            />
          </div>
        </nav>

        <div
          className={` mobile-menu-container ${isVisible ? "is-visible" : ""} `}
        >
          <div className="mobile-menu">
            <div className="menu-content">
              <MdCancel onClick={toggleVisibilty} className="cancel-btn" />

              <span>
                <IoIosNotificationsOutline  onClick={login} className="span-icon" />
                <AiOutlineShoppingCart  onClick={login} className="span-icon" />
              </span>

              <div className="mobilepage-links">
                <li>
                  <NavLink to="/shop" onClick={toggleVisibilty}>
                    Shop
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/masterclass" onClick={toggleVisibilty}>
                    Masterclass
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/about" onClick={toggleVisibilty}>
                    About
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/contact" onClick={toggleVisibilty}>
                    Contact
                  </NavLink>
                </li>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
