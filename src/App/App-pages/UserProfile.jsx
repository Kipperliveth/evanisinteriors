import React, { useState, useEffect } from "react";
import { doc, collection, getDoc } from "firebase/firestore";
import { auth, txtdb } from "../../firebase-config";
import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import UserNav from "../App-components/UserNav";
import { NavLink } from "react-router-dom";
import { MdOutlineModeEdit } from "react-icons/md";
import { ImSpinner8 } from "react-icons/im";
import { RiAccountPinCircleLine } from "react-icons/ri";


function UserProfile() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);


  const [user, setUser] = useState({});

  const [addressData, setAddressData] = useState({
    addressLine1: "",
  });

  const [loading, setLoading] = useState(true);

  // setPersistence(auth, browserSessionPersistence)
  //   .then(() => {
  //     // Session persistence successfully enabled
  //   })
  //   .catch((error) => {
  //     console.error("Error enabling session persistence:", error);
  //   });

  const logout = async () => {
    setIsLoggedIn(true);
  
    if (auth.currentUser) {
      await signOut(auth);
      localStorage.clear();
      navigate("/login");
      setIsLoggedIn(false);
    } else {
      localStorage.clear();
      navigate("/login");
      setIsLoggedIn(false);
    }
  };
  

  useEffect(() => {
    document.title = "My Profile-Evanis enteriors";

    const fetchAddressData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userId = user.uid;
        const userRef = doc(collection(txtdb, "users"), userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setAddressData(userData.address);
          setLoading(false);
        } else {
          console.log("No address data found for the current user.");
        }
      } else {
        console.log("No authenticated user found.");
      }
      setLoading(false);
    };

    fetchAddressData();
  }, []);

  useEffect(() => {
    const cachedAddressData = localStorage.getItem("addressData");
    if (cachedAddressData) {
      setAddressData(JSON.parse(cachedAddressData));
      setLoading(false);
    } else {
      const fetchAddressData = async () => {
        // Fetch address data from Firestore as before
      };
      fetchAddressData();
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem("addressData", JSON.stringify(addressData));
    }
  }, [addressData, loading]);

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
  }, [auth]);
 
  return (
    <div className="">
      <UserNav />

      <div className="appContainer">
        <div className="info">
          <div className="profilePic-info">
            {/* <img src={user?.photoURL} alt="displayPicture" /> */}
            <RiAccountPinCircleLine className="img"/>

            <div className="user-details-info">
              <p className="user-email">{user && user.email}</p>
              <p className="username-info"> {user && user.displayName}</p>
            </div>
          </div>

          <div className="address-info-header">
            <NavLink className='edit' to='/editprofile'>{addressData.addressLine1.length === 0 ? "Add" : "Edit"}  Shipping Information <MdOutlineModeEdit /></NavLink>
          </div>

          <div className="address-info">
            {loading ? ( // Render loading indicator while data is being fetched
              <p>Loading...</p>
            ) : addressData.addressLine1.length === 0 ?( 
              <p className="no-address">Please add a shipping address for deliveries</p>
            ) : (
              <>
              <span>
                <h3>Address:</h3>
                <p className="address">{addressData.addressLine1}</p>
              </span>

              <span>
                <h3>Your Number:</h3>
                <p > {addressData.addressPhone}</p>
              </span>

              <span>
                <h3>State:</h3>
                <p> {addressData.state}</p>
              </span>

              <span>
                <h3>City:</h3>
                <p> {addressData.city}</p>
              </span>
            </>
            )}
          </div>

          <button onClick={logout}>
          {isLoggedIn ? (
                  <ImSpinner8 className="login-spinner" />
                ) : (
                  "Log Out"
                )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
