import React, { useState } from "react";
import { doc, collection, setDoc } from "firebase/firestore";
import { auth, txtdb } from "../../firebase-config";
import { ImSpinner8 } from "react-icons/im";
import { useNavigate, NavLink } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";

function Address() {
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

  const handleChange = (event) => {
    setAddressData({ ...addressData, [event.target.name]: event.target.value });
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
        setErrorMessage("No authenticated user found.");
      }
      setIsLoggedIn(false);
    } catch (error) {
      console.error("Error saving address:", error);
      setErrorMessage("Failed to save address. Please try again.");
      setIsLoggedIn(false);
    }
  };

  const nextPage = () => {
    setIsLoggedIn(true);
    setTimeout(() => {
      setIsLoggedIn(false);
      navigate("/store");
    }, 1000);
  };

  return (
    <div className="auth-editorial-wrapper">
      <div className="auth-card">
        
        <div className="auth-header">
          <h2>Shipping Details</h2>
          <p>Where should we deliver your bespoke pieces?</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              name="addressLine1"
              placeholder="Street Address (e.g. 12 Off Sars Road)"
              value={addressData.addressLine1}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <input
              type="tel"
              name="addressPhone"
              placeholder="Contact Phone Number"
              value={addressData.addressPhone}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <div className="input-group">
              <select name="state" value={addressData.state} onChange={handleChange}>
                <option value="" disabled>Select State</option>
                <option value="Abuja">Abuja</option>
                <option value="Lagos">Lagos</option>
                <option value="Rivers">Rivers</option>
                <option value="Ogun">Ogun</option>
                <option value="Oyo">Oyo</option>
                <option value="Kano">Kano</option>
                <option value="Kaduna">Kaduna</option>
              </select>
            </div>
            <div className="input-group">
              <input
                type="text"
                name="city"
                placeholder="City"
                value={addressData.city}
                onChange={handleChange}
              />
            </div>
          </div>

          {errorMessage && <p className="error-message">{errorMessage}</p>}

          <div className="action-row">
            <button type="submit" className="btn-solid">
              {isLoggedIn ? <ImSpinner8 className="onboarding-spinner" /> : "Save Address"}
            </button>
            <NavLink to="/store" className="btn-outline">Skip for now</NavLink>
          </div>
        </form>
      </div>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <FaCheckCircle className="completed-icon" />
            <p>Your delivery preferences have been securely saved.</p>
            <button className="btn-solid" onClick={nextPage}>
              {isLoggedIn ? <ImSpinner8 className="onboarding-spinner" /> : "Explore Collection"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Address;