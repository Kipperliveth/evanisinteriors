import React, { useState, useEffect } from "react";
import { doc, collection, setDoc, getDoc } from "firebase/firestore";
import { auth, txtdb } from "../../firebase-config";
import { ImSpinner8 } from "react-icons/im";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";
import { IoIosArrowBack } from "react-icons/io";
import logo from "../../stock/new-logo.svg";

import "aos/dist/aos.css";
import AOS from "aos";

function ProfileEdit() {
  const [showPopup, setShowPopup] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const [addressData, setAddressData] = useState({
    addressLine1: "",
    addressPhone: "",
    city: "",
    state: "",
  });

  useEffect(() => {
    AOS.init({ duration: 600, once: true });
  }, []);

  // Fetch existing data
  useEffect(() => {
    const fetchExistingData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(collection(txtdb, "users"), user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists() && snap.data().address) {
          setAddressData(snap.data().address);
        }
      }
    };
    fetchExistingData();
  }, []);

  const handleChange = (event) => {
    setAddressData({ ...addressData, [event.target.name]: event.target.value });
    setErrorMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoggedIn(true);
    setErrorMessage("");

    if (!addressData.addressLine1 || !addressData.addressPhone || !addressData.state || !addressData.city) {
      setErrorMessage("Please fill in all delivery details."); 
      setIsLoggedIn(false);
      return; 
    }

    try {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(collection(txtdb, "users"), user.uid);
        await setDoc(userRef, { address: addressData }, { merge: true });
        setShowPopup(true);
      } else {
        setErrorMessage("Session expired. Please log in again.");
      }
      setIsLoggedIn(false);
    } catch (error) {
      console.error("Error saving address:", error);
      setErrorMessage("Failed to update profile. Please try again.");
      setIsLoggedIn(false);
    }
  };

  const nextPage = () => {
    setIsLoggedIn(true);
    setTimeout(() => {
      setIsLoggedIn(false);
      navigate("/userProfile");
    }, 1000);
  };

  return (
    <div className="edit-profile-canvas">
      
      <div className="edit-inner-wrapper">
        
        {/* Top Navigation with Logo */}
        <header className="edit-top-bar">
          <div className="nav-left">
            <button className="back-btn" onClick={() => navigate("/userProfile")}>
              <IoIosArrowBack className="icon" /> Back
            </button>
          </div>
          
          <div className="logo-container">
            <img src={logo} alt="Evanis" className="brand-logo" />
          </div>

          <div className="nav-right">
            {/* Empty to balance the flex grid perfectly */}
          </div>
        </header>

        {/* Main Viewport */}
        <main className="edit-viewport">
          
          <div className="wizard-step" data-aos="fade-up">
            <div className="step-header">
              <h1>Edit Address</h1>
              <p>Update your delivery location for future bespoke orders.</p>
            </div>

            <form className="step-content form-grid" onSubmit={handleSubmit}>
              
              <div className="input-wrapper full-width">
                <label>Street Address</label>
                <input
                  type="text"
                  name="addressLine1"
                  placeholder="e.g., 123 Main Street"
                  value={addressData.addressLine1}
                  onChange={handleChange}
                />
              </div>

              <div className="input-wrapper full-width">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="addressPhone"
                  placeholder="e.g., 0800 000 0000"
                  value={addressData.addressPhone}
                  onChange={handleChange}
                />
              </div>

              <div className="input-wrapper">
                <label>State</label>
                <select name="state" value={addressData.state} onChange={handleChange}>
                  <option value="" disabled>Select State</option>
                  <option value="Abia">Abia</option>
                  <option value="Abuja">Abuja</option>
                  <option value="Lagos">Lagos</option>
                  <option value="Rivers">Rivers</option>
                  <option value="Ogun">Ogun</option>
                  <option value="Oyo">Oyo</option>
                  <option value="Kano">Kano</option>
                  <option value="Kaduna">Kaduna</option>
                </select>
              </div>

              <div className="input-wrapper">
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  placeholder="e.g., Metropolis"
                  value={addressData.city}
                  onChange={handleChange}
                />
              </div>
              
              {errorMessage && <p className="error-text full-width">{errorMessage}</p>}

              {/* Action Buttons */}
              <div className="action-row full-width">
                <button type="submit" className="primary-action-btn" disabled={isLoggedIn}>
                  {isLoggedIn ? <ImSpinner8 className="onboarding-spinner" /> : "Save Changes"}
                </button>
                <button type="button" className="secondary-action-btn" onClick={() => navigate("/userProfile")}>
                  Cancel
                </button>
              </div>

            </form>
          </div>

        </main>
      </div>

      {/* Success Overlay */}
      {showPopup && (
        <div className="success-overlay" data-aos="fade">
          <div className="popup-content">
            <FaCheckCircle className="success-icon" />
            <h2>Profile Updated</h2>
            <p>Your new delivery details have been securely saved.</p>
            <button className="primary-action-btn" onClick={nextPage}>
              {isLoggedIn ? <ImSpinner8 className="onboarding-spinner" /> : "Back to Profile"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default ProfileEdit;