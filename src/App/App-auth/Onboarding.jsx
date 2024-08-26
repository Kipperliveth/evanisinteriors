import React, { useState, useEffect } from "react";
import { getAuth, updateProfile, onAuthStateChanged } from "firebase/auth";
import { IoIosCheckmarkCircle } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { ImSpinner8 } from "react-icons/im";

const auth = getAuth();

function Onboarding() {
  const [username, setUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleProfileUpdate = () => {
    setIsLoggedIn(true);

    if (!username) {
      setErrorMessage("Field cannot be empty");
      setIsLoggedIn(false);
      return;
    }

    if (username.length < 3) {
      setErrorMessage("Username must be at least 3 characters long");
      setIsLoggedIn(false);
      return;
    }

    updateProfile(auth.currentUser, {
      displayName: username,
    })
      .then(() => {
        // Profile updated successfully
        console.log("Profile updated!");
      setIsLoggedIn(false);
        navigate("/onboarding/address");
        // You can navigate to the next page or perform any other action here
      })
      .catch((error) => {
        // An error occurred
        console.error("Error updating profile:", error);
      setIsLoggedIn(false);
        
      });
  };

  //
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserData(user);
      } else {
        setUserData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="onboarding">
      <div className="upload-username">
        {/* <div className="progress">
          <div className="signUpPage">
            <span>
              <p>
                <IoIosCheckmarkCircle className="completed-icon" />
              </p>
              <h4>Email/Password</h4>
            </span>
          </div>
          <div className="userNamePage">
            <span>
              <p className="current-page">2</p>
              <h4>Username</h4>
            </span>
          </div>
          <div className="profilePicture">
            <span>
              <p>3</p>
              <h4>Display Photo</h4>
            </span>
          </div>
          <div className="addressPage">
            <span>
              <p>4</p>
              <h4>Shipping Address</h4>
            </span>
          </div>

          <div className="bar"></div>
        </div> */}

        <div className="upload-Username-container">
          <h2>What should we call you?</h2>

          <input
            type="text"
            name="username"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <button onClick={handleProfileUpdate}>
            {isLoggedIn ? (
              <ImSpinner8 className="onboarding-spinner" />
            ) : (
              "Save Username"
            )}
          </button>

          {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
        </div>
      </div>

      {/* <div>
        {userData && (
          <div>
            <h2>Welcome, {userData.displayName}!</h2>
            {userData.photoURL && <img src={userData.photoURL} alt="Profile" />}
          </div>
        )}
      </div> */}
    </div>
  );
}

export default Onboarding;
