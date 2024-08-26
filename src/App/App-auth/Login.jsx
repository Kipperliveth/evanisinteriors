import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged
} from "firebase/auth";
import React, { useState, useEffect} from "react";
import { FcGoogle } from "react-icons/fc";
import { NavLink } from "react-router-dom";
import { auth, txtdb } from "../../firebase-config";
import { useNavigate } from "react-router-dom";
import { PiHandWavingFill } from "react-icons/pi";
import { ImSpinner8 } from "react-icons/im";
import { PuffLoader } from "react-spinners";
import { doc, collection, getDoc } from "firebase/firestore";
 

function Login() {
  //error state
  const [errorMessage, setErrorMessage] = useState("");
  //
  const navigate = useNavigate();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState(null);

  const allowedUid = "CqhQfMc1LZdNCUgixbXpYT0SGaG2";
  const login = async (event) => {
    event.preventDefault();
    setIsLoggedIn(true);
   
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        loginEmail,
        loginPassword
      );
      const user = userCredential.user;
      setIsLoggedIn(false);

        if (user.uid === allowedUid) {
        console.log("Admin access!");
        setError(false);
        navigate('/adminHome')
      } else {
        console.log("customer access!");
        navigate("/userDashboard");
        }
        

    } catch (error) {
      console.log(error.message);
      setIsLoggedIn(false);
      setError(error.message);
    }
  };

 

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // You can add any additional logic here if needed after successful sign-in
    } catch (error) {
      if (error.code === 'auth/cancelled-popup-request') {
        console.log("Popup request was cancelled");
      } else {
        console.error("Error signing in with Google: ", error.message);
      }
      // Optionally, you can set an error message state to display an error message to the user
      setErrorMessage("An error occurred while signing in with Google. Please try again.");
    }
  };



useEffect(() => {
  const fetchAddressData = async (user) => {
    const userId = user.uid;
    const userRef = doc(collection(txtdb, "users"), userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (userData.address && userId === allowedUid) {
        navigate('/adminHome'); // Redirect to admin home if address exists and user is admin
      } else if (userData.address) {
        navigate('/userDashboard'); // Redirect to user dashboard if address exists
      } else {
        navigate('/onboarding/address'); // Redirect to onboarding if address doesn't exist
      }
    } else {
      console.log("No address data found for the current user.");
      navigate('/onboarding/address');
    }
  };

  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      await fetchAddressData(user);
    } else {
      console.log("No authenticated user found.");
    }
  });

  return () => unsubscribe(); // Clean up the subscription
}, [navigate, allowedUid]); 

  //loader
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = "Login-Evanis interiors";

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="login-page">
      {isLoading ? (
        <div className="spinner-container">
          <PuffLoader color=" #888" size={25} />
        </div>
      ) : (
        <div className="login-page-container">
          <div className="login-left">
            <h1>
              Welcome Back! <PiHandWavingFill className="wave-icon" />
            </h1>
            <p>Enter login details to proceed to dashboard</p>
            <button className="google-login" onClick={signInWithGoogle}>
              <FcGoogle className="google-icon" /> <h3>Log in with Google</h3>
            </button>

            <div className="or">
              <span></span>
              <h4>or</h4>
              <span></span>
            </div>

            <form className="login-form">
              <div className="emailnpassword">
                <h2>Email</h2>
                <input
                  className="email-input"
                  type="email"
                  placeholder="mail@placeholder.com"
                  onChange={(event) => {
                    setLoginEmail(event.target.value);
                  }}
                  required
                />
              </div>
              <div className="emailnpassword">
                <h2>Password</h2>
                <input
                  type="password"
                  placeholder="your password"
                  onChange={(event) => {
                    setLoginPassword(event.target.value);
                  }}
                  required
                />
              </div>

              <div className="forgot-pass">
                <NavLink to='/reset'>Forgot password?</NavLink>
              </div>

              <button onClick={login} className="login-btn">
                {isLoggedIn ? (
                  <ImSpinner8 className="login-spinner" />
                ) : (
                  "Sign In"
                )}
              </button>

              {error && (
                <p className="passcheck">{`invalid email or password`}</p>
              )}

              {errorMessage && <p style={{ color: "red", fontWeight: 500}}>{errorMessage}</p>}

              <p className="sign-up-link">
                Don't have an account? <NavLink to="/signup">Sign Up</NavLink>
              </p>
            </form>
          </div>

          <div className="login-right"></div>
        </div>
      )}
    </div>
  );
}

export default Login;
