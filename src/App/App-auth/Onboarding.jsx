import React, { useState, useEffect } from "react";
import { getAuth, updateProfile, onAuthStateChanged } from "firebase/auth";
import { doc, collection, setDoc } from "firebase/firestore";
import { auth, txtdb } from "../../firebase-config";
import { useNavigate } from "react-router-dom";
import { ImSpinner8 } from "react-icons/im";
import { FaCheckCircle } from "react-icons/fa";
import { IoIosArrowBack } from "react-icons/io";

import "aos/dist/aos.css";
import AOS from "aos";

function Onboarding() {
  const navigate = useNavigate();
  
  // Interactive Wizard State
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Combined Form State
  const [formData, setFormData] = useState({
    username: "",
    addressLine1: "",
    addressPhone: "",
    state: "",
    city: ""
  });

  useEffect(() => {
    AOS.init({ duration: 600, once: true });
  }, []);

  // Handle Input Changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage(""); 
  };

  // Step 1: Validate Name and Move to Address
  const handleNextStep = () => {
    if (!formData.username.trim()) {
      setErrorMessage("Please enter a name so we know what to call you.");
      return;
    }
    if (formData.username.length < 3) {
      setErrorMessage("Username must be at least 3 characters long.");
      return;
    }
    setErrorMessage("");
    setStep(2);
    AOS.refresh(); 
  };

  // Step 2: Final Submit
  const handleFinalSubmit = async () => {
    if (!formData.addressLine1 || !formData.addressPhone || !formData.state || !formData.city) {
      setErrorMessage("Please fill in all delivery details.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user found.");

      await updateProfile(user, { displayName: formData.username });

      const userRef = doc(collection(txtdb, "users"), user.uid);
      await setDoc(userRef, { 
        address: {
          addressLine1: formData.addressLine1,
          addressPhone: formData.addressPhone,
          state: formData.state,
          city: formData.city
        }
      }, { merge: true });

      setShowSuccess(true);
      setTimeout(() => {
        navigate("/store");
      }, 2000);

    } catch (error) {
      console.error("Onboarding Error:", error);
      setErrorMessage("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    navigate("/store");
  };

  return (
    <div className="app-onboarding-canvas">
      
      {/* Wrapper to keep everything perfectly aligned */}
      <div className="onboarding-inner-wrapper">
        
        {/* Top Navigation & Progress Bar */}
        <header className="onboarding-top-bar">
          <div className="nav-left">
            {step === 2 && (
              <button className="back-btn" onClick={() => setStep(1)}>
                <IoIosArrowBack className="icon" /> Back
              </button>
            )}
          </div>
          
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: step === 1 ? "50%" : "100%" }}
              ></div>
            </div>
          </div>

          <div className="nav-right">
            <button className="skip-btn" onClick={handleSkip}>Skip</button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="onboarding-viewport">
          
          {/* STEP 1: USERNAME */}
          {step === 1 && (
            <div className="wizard-step" data-aos="fade-up">
              <div className="step-header">
                <h1>What should we call you?</h1>
                <p>Let's personalize your Evanis experience.</p>
              </div>
              
              <div className="step-content">
                <input
                  className="giant-input"
                  type="text"
                  name="username"
                  placeholder="e.g., John Doe"
                  value={formData.username}
                  onChange={handleChange}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleNextStep()}
                />
                {errorMessage && <p className="error-text">{errorMessage}</p>}
              </div>
            </div>
          )}

          {/* STEP 2: ADDRESS */}
          {step === 2 && (
            <div className="wizard-step" data-aos="fade-left">
              <div className="step-header">
                <h1>Where to deliver?</h1>
                <p>Nice to meet you, <span className="highlight-name">{formData.username}</span>. Where should we send your bespoke pieces?</p>
              </div>

              <div className="step-content form-grid">
                <div className="input-wrapper full-width">
                  <label>Street Address</label>
                  <input
                    type="text"
                    name="addressLine1"
                    placeholder="e.g., 123 Main Street"
                    value={formData.addressLine1}
                    onChange={handleChange}
                  />
                </div>

                <div className="input-wrapper full-width">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="addressPhone"
                    placeholder="e.g., 0800 000 0000"
                    value={formData.addressPhone}
                    onChange={handleChange}
                  />
                </div>

                <div className="input-wrapper">
                  <label>State</label>
                  <select name="state" value={formData.state} onChange={handleChange}>
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
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>
                
                {errorMessage && <p className="error-text full-width">{errorMessage}</p>}
              </div>
            </div>
          )}

        </main>

        {/* Action Bar (Now in flow, not fixed) */}
        <footer className="onboarding-bottom-action">
          {step === 1 ? (
            <button className="primary-action-btn" onClick={handleNextStep}>
              Continue
            </button>
          ) : (
            <button className="primary-action-btn" onClick={handleFinalSubmit} disabled={isSubmitting}>
              {isSubmitting ? <ImSpinner8 className="onboarding-spinner" /> : "Complete Setup"}
            </button>
          )}
        </footer>

      </div>

      {/* Success Overlay */}
      {showSuccess && (
        <div className="success-overlay" data-aos="fade">
          <FaCheckCircle className="success-icon" />
          <h2>You're all set!</h2>
          <p>Redirecting to the collection...</p>
        </div>
      )}

    </div>
  );
}

export default Onboarding;