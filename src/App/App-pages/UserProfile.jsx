import React, { useState, useEffect } from "react";
import { doc, collection, getDoc } from "firebase/firestore";
import { auth, txtdb } from "../../firebase-config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate, NavLink } from "react-router-dom";
import UserNav from "../App-components/UserNav";
import { ImSpinner8 } from "react-icons/im";
import { RiAccountPinCircleLine } from "react-icons/ri";
import { BsArrowRight, BsBox2, BsHeart, BsShieldLock } from "react-icons/bs";

import "aos/dist/aos.css";
import AOS from "aos";

function UserProfile() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [isSubscribed, setIsSubscribed] = useState(true);

  const [addressData, setAddressData] = useState({
    addressLine1: "",
    addressPhone: "",
    state: "",
    city: ""
  });

  // ==========================================
  // AOS FIX FOR REACT ROUTER NAVIGATION
  // ==========================================
  useEffect(() => {
    AOS.init({ delay: 100, once: true });
    AOS.refresh(); // This forces AOS to scan the DOM again when navigating from other pages
  }, []);

  // ==========================================
  // AUTH & LOGOUT LOGIC
  // ==========================================
  const logout = async () => {
    setIsLoggedIn(true);
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
      localStorage.clear();
      setIsLoggedIn(false);
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      setIsLoggedIn(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });
    return () => unsubscribe();
  }, []);

  // ==========================================
  // FETCH ADDRESS LOGIC
  // ==========================================
  useEffect(() => {
    document.title = "My Account - Evanis Interiors";

    const fetchAddressData = async () => {
      const currentUserObj = auth.currentUser;
      if (currentUserObj) {
        const userId = currentUserObj.uid;
        const userRef = doc(collection(txtdb, "users"), userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setAddressData(userData.address || { addressLine1: "" });
        } else {
          console.log("No address data found for the current user.");
        }
      } else {
        console.log("No authenticated user found.");
      }
      
      setTimeout(() => {
        setLoading(false);
        AOS.refresh(); // Refresh one more time after loading state changes
      }, 500); 
    };

    fetchAddressData();
  }, []);

  useEffect(() => {
    const cachedAddressData = localStorage.getItem("addressData");
    if (cachedAddressData) {
      setAddressData(JSON.parse(cachedAddressData));
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem("addressData", JSON.stringify(addressData));
    }
  }, [addressData, loading]);

  return (
    <div className="profile-editorial-wrapper">
      <UserNav />

      <div className="profile-container">
        
        {/* Header Section */}
        <div className="profile-header" data-aos="fade" data-aos-duration="800">
          <h1>My Account</h1>
          <p>Manage your profile, track orders, and update delivery preferences.</p>
        </div>

        <div className="profile-bento-grid">
          
          {/* =========================================
              LEFT COLUMN: DASHBOARD HUB
              ========================================= */}
          <div className="left-column" data-aos="fade" data-aos-duration="1000" data-aos-delay="100">
            <div className="bento-card user-card">
              
              {loading ? (
                <div className="card-top skeleton-mode">
                  <div className="skeleton-avatar"></div>
                  <div className="skeleton-text title"></div>
                  <div className="skeleton-text sub"></div>
                </div>
              ) : (
                <div className="card-top">
                  <div className="avatar-wrapper">
                    <RiAccountPinCircleLine className="avatar-icon" />
                  </div>
                  <div className="user-text">
                    <h2>{user?.displayName || "Evanis Client"}</h2>
                    <p>{user?.email}</p>
                  </div>
                </div>
              )}

              {/* Dashboard Navigation Menu */}
              <div className="dashboard-menu">
                <NavLink to="/myorders" className="dash-link">
                  <BsBox2 className="icon" /> Order History
                </NavLink>
                <NavLink to="/store" className="dash-link">
                  <BsHeart className="icon" /> Saved Items
                </NavLink>
                <NavLink to="/editprofile" className="dash-link">
                  <BsShieldLock className="icon" /> Account Security
                </NavLink>
              </div>

              <div className="card-bottom">
                <button className="logout-btn" onClick={logout}>
                  {isLoggedIn ? <ImSpinner8 className="login-spinner" /> : "Log Out"}
                </button>
              </div>
            </div>
          </div>

          {/* =========================================
              RIGHT COLUMN: ACCOUNT DETAILS
              ========================================= */}
          <div className="right-column">
            
            {/* 1. Address Book Card */}
            <div className="bento-card address-card" data-aos="fade" data-aos-duration="1000" data-aos-delay="200">
              <div className="address-header">
                <h3>Address Book</h3>
                <NavLink className="edit-link" to="/editprofile">
                  {addressData.addressLine1?.length === 0 ? "Add Address" : "Edit Addresses"} <BsArrowRight className="icon" />
                </NavLink>
              </div>

              <div className="address-content">
                {loading ? (
                  <div className="address-split-grid skeleton-mode">
                    <div className="address-block">
                      <div className="skeleton-text label"></div>
                      <div className="skeleton-text line"></div>
                      <div className="skeleton-text line short"></div>
                      <div className="skeleton-text line"></div>
                    </div>
                    <div className="address-block">
                      <div className="skeleton-text label"></div>
                      <div className="skeleton-text line short"></div>
                    </div>
                  </div>
                ) : addressData.addressLine1?.length === 0 ? (
                  <div className="empty-state">
                    <p>No shipping address on file.</p>
                    <span>Please add an address to ensure seamless delivery for your bespoke furniture.</span>
                  </div>
                ) : (
                  <div className="address-split-grid">
                    
                    {/* Shipping Address */}
                    <div className="address-block">
                      <p className="block-title">Default Shipping Address</p>
                      <div className="info-group">
                        <p className="value">{addressData.addressLine1}</p>
                        <p className="value">{addressData.city}, {addressData.state}</p>
                        <p className="value">{addressData.addressPhone || "—"}</p>
                      </div>
                    </div>

                    {/* Billing Address */}
                    <div className="address-block">
                      <p className="block-title">Default Billing Address</p>
                      <div className="info-group">
                        <p className="value light-text">Same as shipping address</p>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div>

            {/* 2. Communication Preferences Card */}
            <div className="bento-card pref-card" data-aos="fade" data-aos-duration="1000" data-aos-delay="300">
              <div className="pref-header">
                <h3>Communications</h3>
              </div>
              <div className="pref-content">
                <div className="pref-row">
                  <div className="pref-text">
                    <h4>The Evanis Newsletter</h4>
                    <p>Receive exclusive insights, updates, and early access to bespoke furniture releases.</p>
                  </div>
                  <div className="pref-toggle">
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={isSubscribed} 
                        onChange={() => setIsSubscribed(!isSubscribed)} 
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

export default UserProfile;