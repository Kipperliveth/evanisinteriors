import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import logo from "../../stock/logomain.png";
import { IoIosNotificationsOutline } from "react-icons/io";
import { AiOutlineShoppingCart } from "react-icons/ai";
import { CiUser } from "react-icons/ci";
import { auth } from "../../firebase-config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { BsBox2 } from "react-icons/bs";
import { LiaUserEditSolid } from "react-icons/lia";
import { RiMenu4Fill } from "react-icons/ri";
import { MdCancel } from "react-icons/md";
import {
  getFirestore,
  collection, query, orderBy,
  getDocs,
  onSnapshot
} from "firebase/firestore";
import { txtdb } from "../../firebase-config";
import { useLocation } from "react-router-dom";

function UserNav() {
  const [user, setUser] = useState({});

  const navigate = useNavigate();
  const location = useLocation();

  const [isVisible, SetIsVisible] = useState(false);

  const toggleVisibilty = () => {
    SetIsVisible(!isVisible);
  };

  const logout = async () => {
    if (auth.currentUser) {
      await signOut(auth);
      localStorage.clear();
      navigate("/login");
    } else {
      // Handle the scenario where the user is not logged in
      // For example, you might display an error message or redirect the user to the login page
      localStorage.clear();
      console.log("User is not logged in");
      navigate("/login");
    }
  };

  //bar display
  const [showUserInfo, setShowUserInfo] = useState(false);

  const toggleUserInfo = () => {
    setShowUserInfo(!showUserInfo);
  };
//
  const cartLink = () => {
    navigate("/cart");
  };
  const notifLink = () => {
    navigate('/notifications')
  }
  //
  //cart lenghth
  const [cartItemCount, setCartItemCount] = useState(0); // State variable for cart item count
  const [fetchedProducts, setFetchedProducts] = useState([]);


  const currentUser = auth.currentUser;

  const fetchProducts = async () => {
    console.log("Fetching products...");

    if (currentUser) {
      const userId = currentUser.uid;
      const productRef = collection(txtdb, `users/${userId}/products`); // User-specific cart collection

      try {
        const querySnapshot = await getDocs(productRef);
        const products = querySnapshot.docs.map((doc) => doc.data());
        setFetchedProducts(products);
        console.log("Products fetched:", products);
        // Calculate total cart item count
        const totalCount = products.length; 
        setCartItemCount(totalCount);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        // setLoading(false); // Set loading state to false after fetching
        // setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchProducts();
  
      // Listen for changes to the cart collection in real-time
      const unsubscribe = onSnapshot(collection(txtdb, `users/${currentUser.uid}/products`), (snapshot) => {
        const updatedProducts = snapshot.docs.map((doc) => doc.data());
        const totalCount = updatedProducts.length;
        setCartItemCount(totalCount);
      });
  
      return () => unsubscribe(); // Cleanup function to unsubscribe from the snapshot listener
    }
  }, [currentUser]); // Fetch products whenever currentUser changes



  //
  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
  }, [auth]);

  // user notification count
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []); // Run only once when the component mounts

  useEffect(() => {
    if (!user) return; // Return early if user is null

    const userId = user.uid;
    const q = query(
      collection(txtdb, `userNotifications/${userId}/notificationCount`),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = snapshot.docs.map((doc) => {
        let timestamp;
        if (doc.data().timestamp instanceof Date) {
          timestamp = doc.data().timestamp;
        } else {
          timestamp = new Date(doc.data().timestamp);
        }
        return {
          id: doc.id,
          ...doc.data(),
          timestamp: timestamp.toLocaleString([], {
            day: "numeric",
            month: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      });

   // Check if a new document has been added
   if (newNotifications.length > notifications.length) {
    // Calculate the count of unread notifications
    const unreadNotifications = newNotifications.filter((notification) => !notification.read);
    setUnreadCount(unreadNotifications.length);
  }

      // Update notifications
      setNotifications(newNotifications);
    });

    return () => unsubscribe();
  }, [user, location, notifications]); // Run whenever the user object or notifications change

  

  return (
    <div className="userNavbar">
      <div className="userNav-container">
        <NavLink to="/userDashboard" className="logo-container">
          <img src={logo} alt="evanis-interior-logo" />
          <p className="logo">
            <span>EVANIS</span> INTERIORS
          </p>
        </NavLink>

        <div className="userNavLinks desktop-content">
          <li>
            <NavLink
              className={({ isActive }) => (isActive ? "active-link" : "link")}
              to="/store"
            >
              Shop
            </NavLink>
          </li>

          <li>
            <NavLink
              className={({ isActive }) => (isActive ? "active-link" : "link")}
              to="/userMasterclass"
            >
              Masterclass
            </NavLink>
          </li>

          <li>
            <NavLink
              className={({ isActive }) => (isActive ? "active-link" : "link")}
              to="/gethelp"
            >
              Get Help
            </NavLink>
          </li>
        </div>

        <div className="userControls desktop-content">
       
          <div className="cart-cont" onClick={notifLink}>
            <div className="cart-container">

            {unreadCount > 0 && (
           <div className="cart-total">{unreadCount}</div>
           )}
          <IoIosNotificationsOutline
            className="app-icon desktop-view cart"
            onClick={cartLink}
          />
            </div>

          </div>

          <div className="cart-cont" onClick={cartLink}>
            <div className="cart-container">

            {cartItemCount > 0 && (
              <div className="cart-total">{cartItemCount}</div>
            )}
          <AiOutlineShoppingCart
            className="app-icon desktop-view cart"
            onClick={cartLink}
          />
            </div>

          </div>
          <CiUser className="app-icon user"
            onClick={toggleUserInfo} />

          {showUserInfo && (
            <div className="currentUserInfo">
              <div className="currentUserInfo-content">
                <NavLink to='/userProfile'>
                  <LiaUserEditSolid className="icon" />
                  <p>View Profile</p>
                </NavLink>
                <NavLink className="icon" to='/myorders'>
                  <BsBox2 /> <p>My Orders</p>
                </NavLink>
                <button onClick={logout}>Log out</button>
              </div>
            </div>
          )}
        </div>

        <div className="cart-cont mobile-view mobile-menu-btn">

          {(unreadCount > 0 || cartItemCount > 0) && (
            <div  onClick={toggleVisibilty} className="mobile-view cartNote cart-total">{unreadCount+cartItemCount} </div>
          )}

          <RiMenu4Fill
            className="app-icon mobile-view menu menu-icon"
            onClick={toggleVisibilty}
            />

          </div>


      </div>

      <div
        className={` mobile-menu-container ${isVisible ? "is-visible" : ""} `}
      >
        <div className="mobile-menu">
          <div className="menu-content">
            <MdCancel onClick={toggleVisibilty} className="cancel-btn" />

            <span>
              <div className="cart-cont" onClick={notifLink}>
            <div className="cart-container">

            {unreadCount > 0 && (
                <div className="cart-total">{unreadCount}</div>
              )}
          <IoIosNotificationsOutline
            className="app-icon desktop-view cart"
            onClick={cartLink}
          />
            </div>

          </div>

          <div className="cart-cont" onClick={cartLink}>
            <div className="cart-container">

            {cartItemCount > 0 && (
            <div className="cart-total">{cartItemCount}</div>
          )}
          <AiOutlineShoppingCart
            className="app-icon desktop-view cart"
            onClick={cartLink}
          />
            </div>

          </div>
            </span>

            <div className="mobilepage-links">
              <li>
                <NavLink to="/store" onClick={toggleVisibilty}>
                  Shop
                </NavLink>
              </li>
              <li>
                <NavLink to="/masterclass" onClick={toggleVisibilty}>
                  Masterclass
                </NavLink>
              </li>
              <li>
                <NavLink to="/userProfile" onClick={toggleVisibilty}>
                  View profile
                </NavLink>
              </li>
              <li>
                <NavLink to="/myorders" onClick={toggleVisibilty}>
                  My Orders
                </NavLink>
              </li>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserNav;
