import React, { useState, useEffect } from "react";
import UserNav from "../App-components/UserNav";
import { MdOutlineShoppingCart } from "react-icons/md";
import { BsArrowRight } from "react-icons/bs";
import { NavLink, useNavigate } from "react-router-dom";
import { txtdb } from "../../firebase-config";
import { auth } from "../../firebase-config";
import {
  collection, addDoc,
  getDocs, doc, deleteDoc,
  onSnapshot, query, where, setDoc, getDoc, updateDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { CiTrash } from "react-icons/ci";
import { FaPlus } from "react-icons/fa6";
import { FiMinus } from "react-icons/fi";
import emailjs from 'emailjs-com';
import { MdKeyboardArrowLeft } from "react-icons/md";

emailjs.init("55KFb3ovp5zp-SlMq");

function Cart() {
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true); 
  const [errorMessage, setErrorMessage] = useState(''); 
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [fetchedProducts, setFetchedProducts] = useState([]);
  const [allCatalogData, setAllCatalogData] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [recommendedItems, setRecommendedItems] = useState([]);

  const [currentUser, setCurrentUser] = useState(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setCurrentUser(usr);
      setUser(usr || {});
    });
    return () => unsubscribe();
  }, []);

  // Fetch the entire catalog for Recommendations
  const getCatalogData = async () => {
    const valRef = collection(txtdb, "txtData");
    const dataDb = await getDocs(valRef);
    const allData = dataDb.docs.map((val) => ({ ...val.data(), id: val.id }));
    setAllCatalogData(allData);
  };

  // HYBRID CART: Fetch from Firebase OR LocalStorage
  useEffect(() => {
    setIsLoading(true);
    getCatalogData();

    if (currentUser) {
      // User is logged in: Listen to Firebase Cart
      const cartRef = collection(txtdb, `users/${currentUser.uid}/products`);
      const unsubscribe = onSnapshot(cartRef, (snapshot) => {
        const products = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id, cartDocId: doc.id }));
        setFetchedProducts(products);
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Guest: Read from LocalStorage
      const checkLocalCart = () => {
        const guestCart = JSON.parse(localStorage.getItem("evanis_guest_cart")) || [];
        setFetchedProducts(guestCart);
        setIsLoading(false);
      };
      
      checkLocalCart();
      // Listen for cross-tab updates
      window.addEventListener('storage', checkLocalCart);
      
      return () => {
        window.removeEventListener('storage', checkLocalCart);
      };
    }
  }, [currentUser]);

  // Load Recently Viewed from Local Storage
  useEffect(() => {
    const storedRecent = localStorage.getItem('evanis_recently_viewed');
    if (storedRecent) {
      setRecentlyViewed(JSON.parse(storedRecent));
    }
  }, []);

  // Generate Recommendations based on Cart Items
  useEffect(() => {
    if (allCatalogData.length > 0) {
      let recommendations = [];
      if (fetchedProducts.length > 0) {
        const targetCategory = fetchedProducts[0].category;
        recommendations = allCatalogData
          .filter(item => item.category === targetCategory && !fetchedProducts.some(cartItem => cartItem.productnumber === item.id))
          .slice(0, 8); 
      } else {
        recommendations = [...allCatalogData].sort(() => 0.5 - Math.random()).slice(0, 8);
      }
      setRecommendedItems(recommendations);
    }
  }, [allCatalogData, fetchedProducts]);


  // HYBRID DELETE
  const handleDeleteProduct = async (productId) => {
    if (currentUser) {
      // Firebase Delete
      const userId = currentUser.uid;
      const productRef = collection(txtdb, `users/${userId}/products`);
      const querySnapshot = await getDocs(query(productRef, where("productId", "==", productId)));
      try {
        querySnapshot.forEach((doc) => { deleteDoc(doc.ref); });
      } catch (error) { console.error("Error deleting product:", error); }
    } else {
      // LocalStorage Delete
      let guestCart = JSON.parse(localStorage.getItem("evanis_guest_cart")) || [];
      guestCart = guestCart.filter(item => item.productId !== productId && item.productnumber !== productId);
      localStorage.setItem("evanis_guest_cart", JSON.stringify(guestCart));
      setFetchedProducts([...guestCart]); // Force re-render
      // Fire a storage event so Navbar updates instantly
      window.dispatchEvent(new Event('storage'));
    }
  };


  // HYBRID QUANTITY INCREASE
  const handleIncreaseQuantity = async (productId) => {
    if (currentUser) {
      try {
        const productQuery = query(collection(txtdb, `users/${currentUser.uid}/products`), where("productId", "==", productId));
        const querySnapshot = await getDocs(productQuery);
        if (!querySnapshot.empty) {
          const docSnapshot = querySnapshot.docs[0];
          const productData = docSnapshot.data();
          const newQuantity = (productData.quantity || 0) + 1;
          await updateDoc(docSnapshot.ref, { quantity: newQuantity });
        }
      } catch (error) { console.error("Error increasing quantity:", error); }
    } else {
      let guestCart = JSON.parse(localStorage.getItem("evanis_guest_cart")) || [];
      const index = guestCart.findIndex(item => item.productId === productId || item.productnumber === productId);
      if (index >= 0) {
        guestCart[index].quantity = (guestCart[index].quantity || 0) + 1;
        localStorage.setItem("evanis_guest_cart", JSON.stringify(guestCart));
        setFetchedProducts([...guestCart]);
        window.dispatchEvent(new Event('storage'));
      }
    }
  };

  // HYBRID QUANTITY DECREASE
  const handleDecreaseQuantity = async (productId) => {
    if (currentUser) {
      try {
        const productQuery = query(collection(txtdb, `users/${currentUser.uid}/products`), where("productId", "==", productId));
        const querySnapshot = await getDocs(productQuery);
        if (!querySnapshot.empty) {
          const docSnapshot = querySnapshot.docs[0];
          const productData = docSnapshot.data();
          const currentQuantity = productData.quantity || 0;
          if (currentQuantity > 1) {
            await updateDoc(docSnapshot.ref, { quantity: currentQuantity - 1 });
          }
        }
      } catch (error) { console.error("Error decreasing quantity:", error); }
    } else {
      let guestCart = JSON.parse(localStorage.getItem("evanis_guest_cart")) || [];
      const index = guestCart.findIndex(item => item.productId === productId || item.productnumber === productId);
      if (index >= 0 && guestCart[index].quantity > 1) {
        guestCart[index].quantity -= 1;
        localStorage.setItem("evanis_guest_cart", JSON.stringify(guestCart));
        setFetchedProducts([...guestCart]);
        window.dispatchEvent(new Event('storage'));
      }
    }
  };


  const getTotalPrice = () => {
    return fetchedProducts.reduce((total, product) => {
      if (product.isInStock) {
        return total + parseFloat(product.price) * product.quantity;
      }
      return total; 
    }, 0).toLocaleString("en-US");
  };
  
  const totalItems = fetchedProducts.reduce((count, product) => {
    return product.isInStock ? count + product.quantity : count; 
  }, 0);
  
  const getTotalPriceNumeric = parseFloat(getTotalPrice().replace(/[^\d.-]/g, ''));
  const formattedTotalPriceWithShipping = getTotalPriceNumeric.toLocaleString('en-US', { style: 'currency', currency: 'NGN' });

  useEffect(() => {
    document.title ="Cart Evanis-Interiors";
  }, []); 

  const [addressData, setAddressData] = useState({
    addressLine1: "",
    addressPhone: "",
    state: "",
    city: ""
  });
 
  // Fetch Address Only if Logged In
  useEffect(() => {
    const fetchAddressData = async () => {
      if (currentUser) {
        const userRef = doc(collection(txtdb, "users"), currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setAddressData(userData.address || { addressLine1: "", addressPhone: "", state: "", city: "" });
        }
      }
      setLoading(false);
    };
    fetchAddressData();
  }, [currentUser]);

  useEffect(() => {
    const cachedAddressData = localStorage.getItem("addressData");
    if (cachedAddressData && currentUser) {
      setAddressData(JSON.parse(cachedAddressData));
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!loading && currentUser) {
      localStorage.setItem("addressData", JSON.stringify(addressData));
    }
  }, [addressData, loading, currentUser]);


  const [showPopup, setShowPopup] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [orderID, setOrderID] = useState(""); 

  const deletecart = async () => {
    try {
      const userId = currentUser.uid;
      const productRef = collection(txtdb, `users/${userId}/products`);
      const querySnapshot = await getDocs(productRef);

      const deletePromises = querySnapshot.docs.map((document) => 
        deleteDoc(doc(txtdb, `users/${userId}/products`, document.id))
      );

      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Error deleting cart items:", error);
    }
  };


  const check = () => {
    // 1. Guest Check Block
    if (!currentUser) {
      setErrorMessage('Please log in or create an account to place an order.');
      setTimeout(() => { setErrorMessage(''); }, 5000);
      setTimeout(() => { navigate('/login'); }, 2000);
      return;
    }

    // 2. Normal Address Block
    if (!addressData.addressLine1) {
      setErrorMessage('Please add a Delivery Address in your profile so we can calculate your fee.');
      setTimeout(() => { setErrorMessage(''); }, 5000);
      return;
    }
    if (!addressData.addressPhone) {
      setErrorMessage('Please add a Phone Number in your profile so we can contact you regarding delivery.');
      setTimeout(() => { setErrorMessage(''); }, 5000);
      return;
    }
    handleCheckout();
  };


  const handleCheckout = async () => {
    setShowPopup(true);

    try {
      const userId = currentUser.uid;
      const userEmail = currentUser.email;
      const userName = currentUser.displayName || "Evanis Client";
      const currentDate = new Date();
      const timestamp = currentDate.toISOString();
      const formattedDate = currentDate.toISOString().split('T')[0];

      // 1. Save order to Firebase
      const orderRef = await addDoc(collection(txtdb, "orders"), {
        userId: userId,
        cartItems: fetchedProducts, 
        totalPrice: getTotalPriceNumeric, 
        address: addressData.addressLine1,
        callLine: addressData.addressPhone || "",
        city: addressData.city || "",
        state: addressData.state || "",
        userEmail: userEmail,
        username: userName,
        status: "Pending Delivery Quote",
        createdAt: currentDate, 
      });
    
      // 2. Clear the cart
      await deletecart();

      // 3. EmailJS
      let emailContent = ``;
      fetchedProducts.forEach((product) => {
        emailContent += `\n    - ${product.txtVal} (x ${product.quantity})`;
      });
      
      emailjs.send("service_r60nfme", "template_max8cdd", {
        to_email: userEmail,
        userEmail: userEmail,
        message: emailContent,
        orderRefId: orderRef.id,
        to_name: userName,
        from_name: "Evanis Interiors",
        city: addressData.city || "N/A",
        state: addressData.state || "N/A",
        totalPrice: getTotalPriceNumeric,
        timestamp: formattedDate,
        estimatedDelivery: "To be confirmed via WhatsApp",
      }).catch((err) => console.log("Email Error:", err));

      // 4. Notifications
      try {
        addDoc(collection(txtdb, `userNotifications/${userId}/inbox`), {
          orderRefId: orderRef.id,
          state: addressData.state || "",
          timestamp: timestamp,
          message: "Your order is pending a delivery quote."
        });
        
        addDoc(collection(txtdb, `userNotifications/${userId}/notificationCount`), {
          orderRefId: orderRef.id,
          timestamp: timestamp
        });
        
        addDoc(collection(txtdb, 'notifications'), {
          orderRefId: orderRef.id,
          timestamp: timestamp,
          userEmail: userEmail,
          username: userName,
        });

        const orderData = {
          status: "Pending Delivery Quote",
          date: timestamp,
          orderRefId: orderRef.id,
          state: addressData.state || "",
          cartItems: fetchedProducts, 
          totalPrice: getTotalPriceNumeric, 
          address: addressData.addressLine1,
          callLine: addressData.addressPhone || "",
          delivery: 'Requested on'
        };

        const neworder = collection(txtdb, `userNotifications/${userId}/deliveredOrders`);
        const docRef = await addDoc(neworder, orderData);
        await updateDoc(doc(txtdb, `userNotifications/${userId}/deliveredOrders/${docRef.id}`), {
          docRef: docRef.id,
        });

      } catch (error) {
        console.error("Error adding notification:", error);
      }

      // 5. WhatsApp Handoff
      let waMessage = `Hello Evanis Interiors! I would like to place an order.%0A%0A`;
      waMessage += `*Order ID:* ${orderRef.id}%0A`;
      waMessage += `*Customer Name:* ${userName}%0A`;
      waMessage += `*Phone Number:* ${addressData.addressPhone}%0A`;
      waMessage += `*Delivery Address:* ${addressData.addressLine1}${addressData.city ? `, ${addressData.city}` : ''}${addressData.state ? `, ${addressData.state}` : ''}%0A%0A`;
      waMessage += `*Items:*%0A`;
      
      fetchedProducts.forEach((product) => {
        const itemPrice = parseFloat(product.price).toLocaleString("en-US");
        waMessage += `- ${product.quantity}x ${product.txtVal} (N${itemPrice})%0A`;
      });
      
      waMessage += `%0A*Subtotal:* ${getTotalPrice()} NGN%0A%0A`;
      waMessage += `Please let me know the delivery fee to my location so I can complete my payment.`;

      const businessWhatsAppNumber = "2348147176851"; 
      const whatsappURL = `https://wa.me/${businessWhatsAppNumber}?text=${waMessage}`;
      
      setShowPopup(false);
      setCompleted(true);
      setOrderID(orderRef.id);

      window.open(whatsappURL, '_blank');

    } catch (error) {
      console.error("Error creating order:", error);
      setShowPopup(false);
    }
  };

  return (
    <div>
      {currentUser && <UserNav />}
      
      <div className="cart-page">
        <div className="cart-container page">
          <h1 className="page-title">
            My Cart {totalItems > 0 && <span className="item-count">({totalItems})</span>}
          </h1>

          {isLoading ? (
            <div className="loading-message">
              {[...Array(6)].map((_, i) => (
                <div className="loading-card" key={i}>
                  <div className="loading-img"></div>
                  <div className="loading-text"></div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              {fetchedProducts.length === 0 ? (
                <div className="empty-cart">
                  <div className="empty-cart-icon-wrapper">
                    <MdOutlineShoppingCart className="cart-icon" />
                  </div>
                  <h2>Your cart is empty</h2>
                  <p>
                    Looks like you haven't added anything to your cart yet. 
                    Explore our collection of premium, bespoke furniture to find your perfect fit.
                  </p>
                  <NavLink to="/store" className="start-shopping-btn">
                    Start Shopping <BsArrowRight className="btn-icon" />
                  </NavLink>
                </div>
              ) : (
                <div className="cart">
                  
                  {/* Left Column: Cart Items */}
                  <div className="cart-items-wrapper">
                    <div className="cart-items-header desktop-only">
                      <span className="left-text">Product</span>
                      <span className="center-text">Quantity</span>
                      <span className="center-text">Total</span>
                      <span className="center-text">Action</span>
                    </div>

                    <div className="cart-items-list">
                      {(() => {
                        const inStockProducts = fetchedProducts.filter(product => product.isInStock);
                        const outOfStockProducts = fetchedProducts.filter(product => !product.isInStock);
                        const combinedProducts = [...inStockProducts, ...outOfStockProducts];

                        return combinedProducts.map((product, index) => (
                          <div key={index} className="cart-item">
                            
                            <div className="item-details" onClick={() => navigate(`/store/${product.productnumber || product.id}`)} style={{cursor: 'pointer'}}>
                              <img src={product.imgUrl} alt={product.txtVal} />
                              <div className="item-meta">
                                <h4>{product.txtVal} {!product.isInStock && <span className="out-of-stock">(Out of Stock)</span>}</h4>
                                <div className="meta-sub">
                                  {product.color && <span>Colour: {product.color}</span>}
                                  {product.color && product.size && <span className="divider">|</span>}
                                  {product.size && <span>Size: {product.size}</span>}
                                </div>
                              </div>
                            </div>

                            <div className="item-actions-wrapper">
                              <div className="item-quantity center-elem">
                                {product.isInStock ? (
                                  <div className="quantity-pill">
                                    <button onClick={() => handleDecreaseQuantity(product.productId || product.productnumber)}><FiMinus /></button>
                                    <span>{product.quantity}</span>
                                    <button onClick={() => handleIncreaseQuantity(product.productId || product.productnumber)}><FaPlus /></button>
                                  </div>
                                ) : (
                                  <div className="quantity-pill disabled">
                                    <span>-</span>
                                  </div>
                                )}
                              </div>

                              <div className="item-price center-elem">
                                {product.isInStock ? (
                                  <p className="price-text">
                                    &#8358; {(parseFloat(product.price) * product.quantity).toLocaleString("en-US")}
                                  </p>
                                ) : (
                                  <p className="price-text na">N/A</p>
                                )}
                              </div>

                              <div className="item-action center-elem">
                                <button className="icon-delete-btn" onClick={() => handleDeleteProduct(product.productId || product.productnumber)}>
                                  <CiTrash className="delete-icon" />
                                </button>
                              </div>
                            </div>

                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Right Column: Order Summary */}
                  {getTotalPriceNumeric > 0 && (
                    <div className="order-summary-card">
                      <h3>Order Summary</h3>
                      
                      <div className="summary-row">
                        <span>Sub Total</span>
                        <span className="bold">{getTotalPrice()} NGN</span>
                      </div>
                      <div className="summary-row">
                        <span>Items (+QTY)</span>
                        <span className="bold">{totalItems}</span>
                      </div>

                      <hr className="summary-divider" />

                      {/* Subtle Aesthetic Customer Details */}
                      <div className="summary-section">
                        <div className="section-header">
                          <h6>Customer Details</h6>
                          <NavLink to='/userprofile' className="action-link">
                            {currentUser ? 'Edit' : 'Login to edit'}
                          </NavLink>
                        </div>
                        
                        <div className="info-box detailed-info">
                          <div className="detail-row-group">
                            <div className="detail-row">
                              <span className="label">Name</span>
                              <span className="value">{currentUser?.displayName || "Guest Customer"}</span>
                            </div>
                            <div className="detail-row">
                              <span className="label">Phone</span>
                              <span className="value">
                                {currentUser ? (
                                  addressData.addressPhone || <span style={{color:"#e74c3c"}}>Not provided</span>
                                ) : (
                                  <span style={{color:"#888"}}>Login required</span>
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="detail-row">
                            <span className="label">Delivery Address</span>
                            <span className="value">
                              {currentUser ? (
                                addressData.addressLine1 ? (
                                  <>
                                    {addressData.addressLine1}<br />
                                    {addressData.city ? `${addressData.city}, ` : ''}{addressData.state}
                                  </>
                                ) : (
                                  <span style={{color:"#e74c3c"}}>No address provided</span>
                                )
                              ) : (
                                <span style={{color:"#888"}}>Login required to view address</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="summary-section">
                        <div className="section-header">
                          <h6>Delivery Timeline</h6>
                        </div>
                        <div className="notice-box">
                          <p>
                            Delivery fees vary by location and are calculated manually. 
                            Submit your order to speak with our team on WhatsApp, confirm your delivery timeline, and complete payment.
                          </p>
                        </div>
                        {errorMessage && <p className="error-text">{errorMessage}</p>}
                      </div>

                      <hr className="summary-divider desktop-only-checkout" />

                      <div className="summary-row total-row desktop-only-checkout">
                        <span>Total</span>
                        <span className="total-price">{formattedTotalPriceWithShipping}</span>
                      </div>
                      <p className="shipping-note desktop-only-checkout">Shipping fee will be added on WhatsApp</p>

                      <button className="btn-checkout desktop-only-checkout" onClick={check}>
                        {currentUser ? "Order via WhatsApp" : "Login to Checkout"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* --- BOTTOM DISCOVERY SECTIONS --- */}
              <div className="cart-discovery-wrapper">
                {recommendedItems.length > 0 && (
                  <div className="recently-viewed-section">
                    <h3 className="section-title">Recommended For You</h3>
                    <div className="recently-viewed-track">
                      {recommendedItems.map(product => (
                        <div className="recent-card" key={`rec-${product.id}`} onClick={() => navigate(`/store/${product.id}`)}>
                          <div className="recent-img-box">
                            <img src={Array.isArray(product.imgUrl) ? product.imgUrl[0] : product.imgUrl} alt={product.txtVal} />
                          </div>
                          <div className="recent-info">
                            <p className="recent-name">{product.txtVal}</p>
                            <p className="recent-price">&#8358;&nbsp;{parseFloat(product.price).toLocaleString('en-US')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {recentlyViewed.length > 0 && (
                  <div className="recently-viewed-section">
                    <h3 className="section-title">Recently Viewed</h3>
                    <div className="recently-viewed-track">
                      {recentlyViewed.slice(0,8).map(product => (
                        <div className="recent-card" key={`recent-${product.id}`} onClick={() => navigate(`/store/${product.id}`)}>
                          <div className="recent-img-box">
                            <img src={Array.isArray(product.imgUrl) ? product.imgUrl[0] : product.imgUrl} alt={product.txtVal} />
                          </div>
                          <div className="recent-info">
                            <p className="recent-name">{product.txtVal}</p>
                            <p className="recent-price">&#8358;&nbsp;{parseFloat(product.price).toLocaleString('en-US')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* --- MOBILE STICKY BOTTOM CHECKOUT BAR --- */}
        {getTotalPriceNumeric > 0 && !isLoading && fetchedProducts.length > 0 && (
          <div className="mobile-sticky-checkout">
            <div className="sticky-total">
              <span>Total</span>
              <h4>{formattedTotalPriceWithShipping}</h4>
            </div>
            <button className="btn-checkout sticky-btn" onClick={check}>
              {currentUser ? "Order via WhatsApp" : "Login to Checkout"}
            </button>
          </div>
        )}

        {/* Modals & Popups */}
        {showPopup && (
          <div className="popup">
            <div className="spinner">
              <div></div><div></div><div></div><div></div><div></div>
              <div></div><div></div><div></div><div></div><div></div>
            </div>
          </div>
        )}

        {completed && (
          <div className='checkout-popup'>
            <div className='close-btn'>
              <MdKeyboardArrowLeft className='icon'/> 
              <NavLink to='/store' className='button'>Home</NavLink> 
            </div>
            <div className='checkout-container'>
              <div className="checkbox-wrapper">
                <input defaultChecked={true} type="checkbox" readOnly />
                <svg viewBox="0 0 35.6 35.6">
                  <circle className="background" cx="17.8" cy="17.8" r="17.8"></circle>
                  <circle className="stroke" cx="17.8" cy="17.8" r="14.37"></circle>
                  <polyline className="check" points="11.78 18.12 15.55 22.23 25.17 12.87"></polyline>
                </svg>
              </div>
              <h2>Order Request Sent!</h2>
              <p>Thank you for choosing Evanis Interiors! <br /> Please return to the WhatsApp chat to complete your transaction with our team.</p>
              <p>Order ID: <span>{orderID}</span></p>
              <div className='buttons'>
                <NavLink to='/store'>Continue Shopping</NavLink>
                <NavLink to='/myorders'>View Order Details</NavLink>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;