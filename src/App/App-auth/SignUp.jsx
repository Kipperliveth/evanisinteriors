import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, AuthErrorCodes, onAuthStateChanged } from "firebase/auth";
import { doc, collection, getDoc, addDoc, updateDoc } from "firebase/firestore";
import { auth, txtdb } from "../../firebase-config";
import { ImSpinner8 } from "react-icons/im";
import { IoIosArrowBack } from "react-icons/io";
import { BsEye, BsEyeSlash } from "react-icons/bs";
import { FcGoogle } from "react-icons/fc";

function SignUp() {
  const navigate = useNavigate();
  const allowedUid = "CqhQfMc1LZdNCUgixbXpYT0SGaG2";

  // Form State
  const [registerEmail, setRegisterEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
    document.title = "Create Account - Evanis Interiors";
    let isMounted = true;

    const checkUserRoute = async (user) => {
      try {
        const userId = user.uid;

        // Perform cart migration immediately if a guest just signed up
        await migrateGuestCart(userId);

        if (userId === allowedUid) {
          navigate('/adminHome');
          return;
        }

        const userRef = doc(collection(txtdb, "users"), userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists() && userSnap.data().address) {
          navigate('/store'); // Existing customers go straight to store
        } else {
          navigate('/onboarding'); // First-time users go to onboarding
        }
      } catch (err) {
        console.error("Routing error:", err);
        if (isMounted) setIsLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await checkUserRoute(user); 
      } else {
        if (isMounted) setIsLoading(false); 
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

  const handlePasswordChange = (event) => setPassword(event.target.value);
  const handleConfirmPasswordChange = (event) => setConfirmPassword(event.target.value);

  // Email/Password Sign Up
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoggedIn(true);
    setError("");

    if (!password || !confirmPassword || !registerEmail) {
      setIsLoggedIn(false);
      setError("Please fill in all fields.");
      return;
    } 
    if (password !== confirmPassword) {
      setIsLoggedIn(false);
      setError("Passwords do not match.");
      return;
    } 
    if (password.length < 6) {
      setIsLoggedIn(false);
      setError("Password should be at least 6 characters long.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, registerEmail, confirmPassword);
      const user = userCredential.user;
      console.log(user);
      // onAuthStateChanged will handle the cart migration and routing automatically
    } catch (error) {
      setIsLoggedIn(false);
      if (error.code === AuthErrorCodes.EMAIL_EXISTS) {
        setError("This email is already in use.");
      } else if (error.code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else {
        setError("An error occurred. Please try again.");
      }
      console.log(error.message);
    }
  };

  // Google Sign Up / Log In
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError("");
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      console.log(result.user);
      // onAuthStateChanged will handle the cart migration and routing automatically
    } catch (error) {
      setIsGoogleLoading(false); // Only toggle false if it failed
      setError("Google authentication failed. Please try again.");
      console.error(error.message);
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
      
      {/* LEFT SIDE: Lifestyle Image */}
      <div className="auth-image-side">
        <div className="image-overlay">
          <h2>Design your sanctuary.</h2>
          <p>Join Evanis to curate bespoke furniture and manage your interior projects.</p>
        </div>
      </div>

      {/* RIGHT SIDE: Form */}
      <div className="auth-form-side">
        <div className="auth-form-container">
          
          <button className="back-link" onClick={() => navigate("/")}>
            <IoIosArrowBack /> Back to Store
          </button>

          <div className="auth-header">
            <h1>Create an Account</h1>
            <p>Enter your details to get started.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={handlePasswordChange}
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

            <div className="input-group">
              <label>Confirm Password</label>
              <div className="password-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  required
                />
                <button 
                  type="button" 
                  className="toggle-visibility" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? <BsEyeSlash /> : <BsEye />}
                </button>
              </div>
            </div>

            {error && <p className="error-msg">{error}</p>}

            <button type="submit" className="primary-auth-btn" disabled={isLoggedIn || isGoogleLoading}>
              {isLoggedIn ? <ImSpinner8 className="spinner-icon" /> : "Create Account"}
            </button>
          </form>

          {/* OR DIVIDER */}
          <div className="auth-divider">
            <span>or</span>
          </div>

          {/* GOOGLE AUTH BUTTON */}
          <button className="google-auth-btn" onClick={handleGoogleSignIn} disabled={isGoogleLoading || isLoggedIn}>
            {isGoogleLoading ? <ImSpinner8 className="spinner-icon dark" /> : (
              <>
                <FcGoogle className="google-icon" /> Continue with Google
              </>
            )}
          </button>

          <p className="auth-footer-link">
            Already have an account? <NavLink to="/login">Log in</NavLink>
          </p>

        </div>
      </div>

    </div>
  );
}

export default SignUp;