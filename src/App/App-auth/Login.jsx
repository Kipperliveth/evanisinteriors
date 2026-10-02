import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import { doc, collection, getDoc, addDoc, updateDoc } from "firebase/firestore";
import { auth, txtdb } from "../../firebase-config";
import { NavLink, useNavigate } from "react-router-dom";
import UserNav from "../App-components/UserNav"; 
import { FcGoogle } from "react-icons/fc";
import { PiHandWavingFill } from "react-icons/pi";
import { ImSpinner8 } from "react-icons/im";
import { BsEye, BsEyeSlash } from "react-icons/bs";

function Login() {
  const navigate = useNavigate();
  const allowedUid = "CqhQfMc1LZdNCUgixbXpYT0SGaG2";

  // Form & UI State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Status State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // MIGRATION HELPER FUNCTION
  const migrateGuestCart = async (userId) => {
    const guestCart = JSON.parse(localStorage.getItem("evanis_guest_cart"));
    
    if (guestCart && guestCart.length > 0) {
      try {
        const productRef = collection(txtdb, `users/${userId}/products`);
        
        for (const item of guestCart) {
          const docRef = await addDoc(productRef, {
            imgUrl: item.imgUrl,
            txtVal: item.txtVal,
            desc: item.desc,
            category: item.category,
            price: item.price,
            quantity: item.quantity,
            color: item.color || null,
            size: item.size || null,
            productnumber: item.productnumber,
            isInStock: true
          });
          
          await updateDoc(doc(txtdb, `users/${userId}/products/${docRef.id}`), {
            productId: docRef.id,
          });
        }

        // Clear local storage after successful migration
        localStorage.removeItem("evanis_guest_cart");
      } catch (error) {
        console.error("Error migrating cart:", error);
      }
    }
  };

  // Check Auth State & Route Accordingly
  useEffect(() => {
    document.title = "Login - Evanis Interiors";
    let isMounted = true;

    const checkUserRoute = async (user) => {
      try {
        const userId = user.uid;

        // Perform cart migration immediately upon login
        await migrateGuestCart(userId);

        if (userId === allowedUid) {
          navigate('/admin', { replace: true });
          return;
        }

        const userRef = doc(collection(txtdb, "users"), userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists() && userSnap.data().address) {
          navigate('/store', { replace: true }); // Existing customers go straight to store
        } else {
          navigate('/onboarding', { replace: true }); // First-time users go to onboarding
        }
      } catch (err) {
        console.error("Routing error:", err);
        if (isMounted) setIsLoading(false); // Drop loader if there's an error
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await checkUserRoute(user); 
        // Note: We don't set isLoading(false) here because we are navigating away.
        // This prevents the login form from flashing before the redirect happens.
      } else {
        console.log("No authenticated user found.");
        if (isMounted) setIsLoading(false); // Not logged in? Show the login form immediately.
      }
    });

    // Fallback: If network is very slow, force the loader to disappear after 2 seconds
    const fallbackTimer = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 2000);

    return () => {
      isMounted = false;
      unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, [navigate, allowedUid]); 

  // Standard Email Login
  const login = async (event) => {
    event.preventDefault();
    setIsLoggedIn(true);
    setError(null);
    setErrorMessage("");
   
    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      const user = userCredential.user;
      
      if (user.uid === allowedUid) {
        navigate('/admin', { replace: true });
      } else {
        // onAuthStateChanged will handle cart migration and routing to /store or /onboarding
      }
    } catch (error) {
      console.log(error.message);
      setError("Invalid email or password.");
      setIsLoggedIn(false);
    }
  };

  // Google Login
  const signInWithGoogle = async () => {
    setIsGoogleLoading(true);
    setErrorMessage("");
    const provider = new GoogleAuthProvider();
    
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle cart migration and routing automatically
    } catch (error) {
      if (error.code === 'auth/cancelled-popup-request') {
        console.log("Popup request was cancelled");
      } else {
        console.error("Error signing in with Google: ", error.message);
        setErrorMessage("An error occurred while signing in with Google. Please try again.");
      }
      setIsGoogleLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="auth-loader-screen">
        <div className="aesthetic-loader"></div>
      </div>
    );
  }

  return (
    <div className="auth-split-wrapper">
      
      <UserNav />

      {/* LEFT SIDE: Form */}
      <div className="auth-form-side">
        <div className="auth-form-container login-spacing">

          <div className="auth-header">
            <h1>Welcome Back! <PiHandWavingFill style={{ color: "#FED246", fontSize: "1.8rem", marginLeft: "5px" }} /></h1>
            <p>Enter login details to proceed to your account.</p>
          </div>

          <form className="auth-form" onSubmit={login}>
            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="mail@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  className="toggle-visibility" 
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? <BsEyeSlash /> : <BsEye />}
                </button>
              </div>
            </div>

            <NavLink to="/reset" className="forgot-pass-link">Forgot password?</NavLink>

            {error && <p className="error-msg">{error}</p>}
            {errorMessage && <p className="error-msg">{errorMessage}</p>}

            <button type="submit" className="primary-auth-btn" disabled={isLoggedIn || isGoogleLoading}>
              {isLoggedIn ? <ImSpinner8 className="spinner-icon" /> : "Sign In"}
            </button>
          </form>

          {/* OR DIVIDER */}
          <div className="auth-divider">
            <span>or</span>
          </div>

          {/* GOOGLE AUTH BUTTON */}
          <button className="google-auth-btn" onClick={signInWithGoogle} disabled={isGoogleLoading || isLoggedIn}>
            {isGoogleLoading ? <ImSpinner8 className="spinner-icon dark" /> : (
              <>
                <FcGoogle className="google-icon" /> Log in with Google
              </>
            )}
          </button>

          <p className="auth-footer-link">
            Don't have an account? <NavLink to="/signup">Sign Up</NavLink>
          </p>

        </div>
      </div>

      {/* RIGHT SIDE: Lifestyle Image */}
      <div className="auth-image-side login-bg">
        <div className="image-overlay">
          <h2>Welcome Back.</h2>
          <p>Sign in to track your bespoke orders and manage your interior projects.</p>
        </div>
      </div>

    </div>
  );
}

export default Login;