import React, { useState, useEffect } from "react";
import UserNav from "../App-components/UserNav";
import { MdOutlineShoppingCart } from "react-icons/md";
import { NavLink } from "react-router-dom";
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
  const [cartItems, setCartItems] = useState([]);
  const [user, setUser] = useState({})
  const [loading, setLoading] = useState(true); // New loading state
  const [errorMessage, setErrorMessage] = useState(''); // State for error message

  //skeleton loading
  const [isLoading, setIsLoading] = useState(true);

  
  const [fetchedProducts, setFetchedProducts] = useState([]);
  
  
  const currentUser = auth.currentUser;


  const fetchProducts = async () => {
    setIsLoading(true);
  
    if (currentUser) {
      const userId = currentUser.uid;
      const productRef = collection(txtdb, `users/${userId}/products`);
      try {
        const querySnapshot = await getDocs(productRef);
        const products = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return { ...data, id: doc.id };
        });
        setFetchedProducts(products);
        // Update product quantities in the local state
        const quantities = {};
        products.forEach((product) => {
          quantities[product.id] = product.quantity || 1;
        });
        setProductQuantities(quantities);
        console.log("Products fetched:", products);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false); // Set loading state to false after fetching
        setIsLoading(false);
      }
    }
  };
  

  // Inside the fetchProducts function
useEffect(() => {
  if (currentUser) {
    fetchProducts();

  const unsubscribe = onSnapshot(collection(txtdb, `users/${currentUser.uid}/products`), (snapshot) => {
    const updatedProducts = [];
    snapshot.forEach((doc) => {
      updatedProducts.push({ id: doc.id, ...doc.data() });
    });
    setFetchedProducts(updatedProducts);
  });

  return () => unsubscribe();
}
}, [currentUser]);



//
const handleDeleteProduct = async (productId) => {
  const userId = currentUser.uid;
  const productRef = collection(txtdb, `users/${userId}/products`);
  const querySnapshot = await getDocs(query(productRef, where("productId", "==", productId)));

  try {
    querySnapshot.forEach((doc) => {
      deleteDoc(doc.ref); // Delete the document from the database
    });
    const updatedProducts = fetchedProducts.filter(product => product.productId !== productId);
    setFetchedProducts(updatedProducts); // Update the state without the deleted product
  } catch (error) {
    console.error("Error deleting product:", error);
  }
};

  // Calculate total price of products in the cart
  const getTotalPrice = () => {
    return fetchedProducts.reduce((total, product) => {
      if (product.isInStock) {
        return total + parseFloat(product.price) * product.quantity;
      }
      return total; // Ignore out-of-stock items
    }, 0).toLocaleString("en-US");
  };
  
  const totalItems = fetchedProducts.reduce((count, product) => {
    return product.isInStock ? count + product.quantity : count; // Only count in-stock items
  }, 0);
  
//


const getTotalPriceNumeric = parseFloat(getTotalPrice().replace(/[^\d.-]/g, ''));

const totalPriceWithShipping = getTotalPriceNumeric;

const formattedTotalPriceWithShipping = totalPriceWithShipping.toLocaleString('en-US', { style: 'currency', currency: 'NGN' });



useEffect(() => {
  document.title ="Cart Evanis-Interiors"
    fetchProducts();
    // getTotalPrice();
}, [currentUser]); // Fetch products whenever currentUser changes


useEffect(() => {
  onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
  });
}, [auth]);


useEffect(() => {
  setIsLoading(true);
  fetchProducts().then(() => {
    setIsLoading(false); 
  });
}, []);

//
// Define state to track the quantity of each product in the cart
const [productQuantities, setProductQuantities] = useState({});

useEffect(() =>{
setProductQuantities(productQuantities)
}, [])

// Inside the handleIncreaseQuantity function
const handleIncreaseQuantity = async (productId) => {
  try {
    const userId = currentUser.uid;
    const productQuery = query(collection(txtdb, `users/${userId}/products`), where("productId", "==", productId));
    const querySnapshot = await getDocs(productQuery);

    if (!querySnapshot.empty) {
      // If a document with the matching product ID is found, update its quantity
      const docSnapshot = querySnapshot.docs[0];
      const productData = docSnapshot.data();
      const newQuantity = (productData.quantity || 0) + 1;
      await setDoc(docSnapshot.ref, { ...productData, quantity: newQuantity });

      // Update the local state
      setProductQuantities((prevQuantities) => ({
        ...prevQuantities,
        [productId]: newQuantity,
      }));
    } else {
      console.error("Product not found in the cart.");
    }
  } catch (error) {
    console.error("Error increasing quantity:", error);
  }
};


// Inside the handleDecreaseQuantity function
const handleDecreaseQuantity = async (productId) => {
  try {
    const userId = currentUser.uid;
    const productRef = collection(txtdb, `users/${userId}/products`);
    const querySnapshot = await getDocs(query(productRef, where("productId", "==", productId)));

    if (!querySnapshot.empty) {
      // If a document with the matching product ID is found, update its quantity
      const docSnapshot = querySnapshot.docs[0];
      const productData = docSnapshot.data();
      const currentQuantity = productData.quantity || 0;

      // Prevent quantity from going below 1
      if (currentQuantity > 1) {
        const newQuantity = currentQuantity - 1;
        await setDoc(docSnapshot.ref, { ...productData, quantity: newQuantity });

        // Update the local state
        setProductQuantities((prevQuantities) => ({
          ...prevQuantities,
          [productId]: newQuantity,
        }));
      }
    } else {
      console.error("Product not found in the cart.");
    }
  } catch (error) {
    console.error("Error decreasing quantity:", error);
  }
};

// Inside the Cart component
// const totalItems = fetchedProducts.reduce((total, product) => total + product.quantity, 0);

//address
 const [addressData, setAddressData] = useState({
    addressLine1: "",
  });
 
   useEffect(() => {

    const fetchAddressData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userId = user.uid;
        const userRef = doc(collection(txtdb, "users"), userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setAddressData(userData.address);
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

// Get the current date
const currentDate = new Date();

// Calculate the date 15 days from now
const date15DaysFromNow = new Date(currentDate);
date15DaysFromNow.setDate(currentDate.getDate() + 15);

// Calculate the date 20 days from now
const date20DaysFromNow = new Date(currentDate);
date20DaysFromNow.setDate(currentDate.getDate() + 20);

// Format the dates as "day month"
const options = { day: 'numeric', month: 'short' };
const formattedDate15DaysFromNow = date15DaysFromNow.toLocaleDateString('en-US', options);
const formattedDate20DaysFromNow = date20DaysFromNow.toLocaleDateString('en-US', options);

//shipping state
const [selectedShipping, setSelectedShipping] = useState('');

const handleShippingChange = (e) => {
  setSelectedShipping(e.target.value);

};

useEffect(() => {
  console.log(selectedShipping);
}, [selectedShipping]);

// pop up spinner
const [showPopup, setShowPopup] = useState(false);

//completed
const [completed, setCompleted] = useState(false)
const [orderID, setOrderID] = useState(""); // New state variable for Order ID


//delete cart
// Function to delete all documents in the user's cart
const deletecart = async () => {
  try {
    const userId = currentUser.uid;

    // Get a reference to the user's cart collection
    const productRef = collection(txtdb, `users/${userId}/products`);
    // Fetch all documents in the user's cart collection
    const querySnapshot = await getDocs(productRef);

    // Create an array of delete promises for each document in the collection
    const deletePromises = querySnapshot.docs.map((document) => 
      deleteDoc(doc(txtdb, `users/${userId}/products`, document.id))
    );

    // Wait for all delete promises to resolve
    await Promise.all(deletePromises);
    console.log("All items in the cart have been deleted successfully.");
  } catch (error) {
    console.error("Error deleting cart items:", error);
  }
};



// order email
const userEmail = auth.currentUser?.email;
const userName = user.displayName;

//checkout logic
//checkout logic
const [notCompleted, setNotCompleted] = useState(false)

console.log(window.PaystackPop,userEmail,  "pasystack" );
const amount = getTotalPriceNumeric; // Total amount including shipping

const check = () => {
  if (!selectedShipping) {
    setErrorMessage('Please choose a shipping option');
    setTimeout(() => {
      setErrorMessage('');
    }, 5000);
    return;
  }
  
  if (selectedShipping === "DOOR DELIVERY" && !addressData.addressLine1) {
    setErrorMessage('Please add a Delivery Address');
    setTimeout(() => {
      setErrorMessage('');
    }, 5000);
    return;
  }
  
  if (selectedShipping === "PICKUP" && !addressData.addressPhone) {
    setErrorMessage('Add a number for pick up');
    setNotCompleted(true);
    setTimeout(() => {
      setErrorMessage('');
    }, 5000);
    return;
  }
  handlePaystackPayment()
};

const [transactionReference, setTransactionReference] = useState('')


const handlePaystackPayment = async () => {
  const paystackPublicKey = "pk_live_ebd855719072a4c2ac87beac3780b30f955d54c6";
 

  const handler = window.PaystackPop.setup({
    key: paystackPublicKey,
    email: userEmail, 
    amount: amount * 100, 
    currency: 'NGN', 
    callback: function(response) {
      setTransactionReference(response.reference);
      handleCheckout();
    },
    onClose: function() {
      setTransactionReference('Payment was not completed');
      console.warn('Payment was not completed')
    }
  });

  handler.openIframe();
};

const handleCheckout = async () => {
  
if (!selectedShipping) {
  setErrorMessage('Please choose a shipping option');
  return;
}
if (!addressData.addressLine1) {
  setErrorMessage('Please add a Delivery Address');
  setTimeout(() => {
    setErrorMessage('');
  }, 5000);
  return;
}
setShowPopup(true);

  try {
    // Get the current user's ID
    const userId = currentUser.uid;

    // Create a new order document in the "orders" collection
    const orderRef = await addDoc(collection(txtdb, "orders"), {
      userId: userId, // Store the user's ID in the order document
      cartItems: fetchedProducts, // Store the contents of the user's cart
      totalPrice: getTotalPriceNumeric, // Store the total price of the order
      shippingOption: selectedShipping, // Store the selected shipping option
      address: addressData.addressLine1,
      callLine: addressData.addressPhone,
      city: addressData.city,
      state: addressData.state,
      userEmail: userEmail,
      username: userName,
      reference: transactionReference,
      formattedDate15DaysFromNow: formattedDate15DaysFromNow,
      formattedDate20DaysFromNow: formattedDate20DaysFromNow,
      createdAt: new Date(), // Store the current date and time as the creation date
    });
  

   // Get the email content
   let emailContent = `
   `;
   // Loop through fetchedProducts array to include product name and quantity
   fetchedProducts.forEach((product, index) => {
   emailContent += `\n    - ${product.txtVal} (x ${product.quantity})`;
   });
   ;

              
   const date = new Date();
    const formattedDate = date.toISOString().split('T')[0];
    const timestamp = formattedDate;
          //  await sendEmailNotification(userEmail, orderRef.id);
          emailjs.send("service_r60nfme", "template_max8cdd", {
        to_email: userEmail,
        userEmail: userEmail,
        message: emailContent,
        orderRefId: orderRef.id,
        to_name: userName,
        from_name: "Evanis Interiors",
        city: addressData.city,
        state: addressData.state,
        totalPrice: getTotalPriceNumeric,
        timestamp: timestamp,
        estimatedDelivery: `${formattedDate15DaysFromNow} and ${formattedDate20DaysFromNow}`,
        // other variables you want to include in your email template
      })
      .then((response) => {
        console.log('Email sent successfully:', response);
        setOrderID(orderRef.id)
        //user app notifications

        try {
          const timestamp = new Date().toISOString();
          addDoc(collection(txtdb, `userNotifications/${userId}/inbox`), {
            orderRefId: orderRef.id,
            state: addressData.state,
            formattedDate15DaysFromNow: formattedDate15DaysFromNow,
            formattedDate20DaysFromNow: formattedDate20DaysFromNow,
            timestamp: timestamp
          });
          // notification count
          addDoc(collection(txtdb, `userNotifications/${userId}/notificationCount`), {
            orderRefId: orderRef.id,
            timestamp: timestamp
          });
          // addDoc(collection(txtdb, `userNotifications/${userId}/myorders`), {
          //   orderRefId: orderRef.id,
          //   state: addressData.state,
          //   cartItems: fetchedProducts, // Store the contents of the user's cart
          //   totalPrice: getTotalPriceNumeric, // Store the total price of the order
          //   shippingOption: selectedShipping, // Store the selected shipping option
          //   formattedDate15DaysFromNow: formattedDate15DaysFromNow,
          //   formattedDate20DaysFromNow: formattedDate20DaysFromNow,
          //   timestamp: timestamp,
          //   satus: "pending delivery"
          // });
          addDoc(collection(txtdb, 'notifications'), {
            orderRefId: orderRef.id,
            timestamp: timestamp,
            userEmail: userEmail,
            username: userName,
          });



          const orderData = {
            status: "Order Confirmed",
            date: timestamp,
              orderRefId: orderRef.id,
            state: addressData.state,
            cartItems: fetchedProducts, // Store the contents of the user's cart
            totalPrice: getTotalPriceNumeric, // Store the total price of the order
            shippingOption: selectedShipping, // Store the selected shipping option
            formattedDate15DaysFromNow: formattedDate15DaysFromNow,
            formattedDate20DaysFromNow: formattedDate20DaysFromNow,
            address: addressData.addressLine1,
            callLine: addressData.addressPhone,
            delivery: 'Ordered on'
          };
          const neworder = collection(txtdb, `userNotifications/${userId}/deliveredOrders`)
          addDoc(neworder, orderData)
        .then((docRef) => {
          const documentId = docRef.id; // Access the automatically generated ID
          console.log('Document successfully added with ID:', documentId);
          // You can now use the documentId for further operations
          updateDoc(doc(txtdb, `userNotifications/${userId}/deliveredOrders/${documentId}`), {
          docRef: docRef.id,
        }).then(() => {
          deletecart();
         })
        })
      

          console.log("Notification added");
        } catch (error) {
          console.error("Error adding notification:", error);
        }
      setShowPopup(false);
      setCompleted(true);


      })
      .catch((error) => {
        console.error('Email send error:', error);
        setShowPopup(false);

      });
          console.log("Order created with ID: ", orderRef.id);
        } catch (error) {
          console.error("Error creating order:", error);
          setShowPopup(false);

        }
      };





  return (
    <div>
      <UserNav />
      <div className="cart-page ">
        <div className="cart-container page">
          <h1>My Cart</h1>


         
          { isLoading ? (
            <div className="loading-message">
            <div className="loading-card">
              <div className="loading-img"></div>
              <div className="loading-text"></div>
            </div>
   
            <div className="loading-card">
              <div className="loading-img"></div>
              <div className="loading-text"></div>
             
            </div>
   
            <div className="loading-card">
              <div className="loading-img"></div>
              <div className="loading-text"></div>
            </div>
   
            <div className="loading-card">
              <div className="loading-img"></div>
              <div className="loading-text"></div>
            </div>
   
            <div className="loading-card">
              <div className="loading-img"></div>
              <div className="loading-text"></div>
            </div>
   
            <div className="loading-card">
              <div className="loading-img"></div>
              <div className="loading-text"></div>
            </div>
          </div>
          ) : (

        <div>
                { fetchedProducts.length === 0 ?(
                  <div className="empty-cart">
            <MdOutlineShoppingCart className="cart-icon" />
            <h3>Your cart is empty</h3>
            <p>
              Explore our wide selection of products and find the perfect fit
              for you.
            </p>
            <NavLink to="/store">Start Shopping</NavLink>
          </div>
                ) : (
                  <div className='cart'>

        <div className="cart-container main-container">
          {(() => {
            // Separate products into in-stock and out-of-stock
            const inStockProducts = fetchedProducts.filter(product => product.isInStock);
            const outOfStockProducts = fetchedProducts.filter(product => !product.isInStock);

            // Combine the two arrays, in-stock first, out-of-stock last
            const combinedProducts = [...inStockProducts, ...outOfStockProducts];

            return combinedProducts.map((product, index) => (
              <div key={index} className="cart-item">
                <div className="product-info">
                  <div className="info">
                    <img src={product.imgUrl} alt={product.txtVal} />
                    <div className="name-desc">
                      <h3>
                        {product.txtVal} {product.isInStock ? '' : '(Out of Stock)'}
                      </h3>
                      {product.color && <p><span>Color:</span> {product.color}</p>}
                      {product.size && <p><span>Size:</span> {product.size}</p>}
                      {product.isInStock && (
                        <p className="mobile">
                          &#8358;&nbsp;
                          {(parseFloat(product.price) * product.quantity).toLocaleString("en-US")}
                        </p>
                      )}
                    </div>
                  </div>
                  {product.isInStock && (
                    <div className="price desktop">
                      <p>
                        &#8358;&nbsp;
                        {(parseFloat(product.price) * product.quantity).toLocaleString("en-US")}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="cart-control">
                  {product.isInStock ? (
                    // Render controls for in-stock products
                    <>
                      <button className="delete-btn" onClick={() => handleDeleteProduct(product.productId)}>
                        <CiTrash className="delete-icon" /> <p>Remove</p>
                      </button>
                      <div className="quantity-counter">
                        <button onClick={() => handleDecreaseQuantity(product.productId)}><FiMinus className="count-icon" /></button>
                        <p>{product.quantity}</p>
                        <button onClick={() => handleIncreaseQuantity(product.productId)}><FaPlus className="count-icon" /></button>
                      </div>
                    </>
                  ) : (
                    // Render remove button for out-of-stock products
                    <button className="delete-btn" onClick={() => handleDeleteProduct(product.productId)}>
                      <CiTrash className="delete-icon" /> <p>Remove</p>
                    </button>
                  )}
                </div>
              </div>
            ));
          })()}
        </div>


                {getTotalPriceNumeric > 0 && (

                <div className="cart-summary" >
                <h3>Order summary</h3>
                <p>Subtotal: <span>{getTotalPrice()}</span></p>
                <p>Items (+QTY): <span>{totalItems}</span></p>

                <div className="address">
                  <h6>DELIVERY ADDRESS  
                    {addressData.addressLine1 ? (
                      <NavLink to='/editAddress'>EDIT</NavLink>
                    ) : (
                      <NavLink to='/editAddress'>ADD</NavLink>
                    )}
                  </h6>
                  <p>{addressData.addressLine1}</p>
                </div>

                <div className="delivery">
                  <h6>DELIVERY DETAILS</h6>
                  <div className="estimate">
                    <p>Delivery between <span>{formattedDate15DaysFromNow}</span> and <span>{formattedDate20DaysFromNow}</span></p>
                  </div>

                  <div className="shipping-state">
                    <div className="state">
                      <input
                        type="radio"
                        id="lagos"
                        name="shipping"
                        value="LAGOS"
                        checked={selectedShipping === 'LAGOS'}
                        onChange={handleShippingChange}
                      />
                      <label htmlFor="lagos">LAGOS</label>
                    </div>

                    <div className="state">
                      <input
                        type="radio"
                        id="others"
                        name="shipping"
                        value="OTHERS"
                        checked={selectedShipping === 'OTHERS'}
                        onChange={handleShippingChange}
                      />
                      <label htmlFor="others">Other states({addressData.state})</label>
                    </div>

                    {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
                  </div>
                </div>

                <div className="total">
                  <p>Total <span>{formattedTotalPriceWithShipping}</span></p>
                  <li>Shipping not included</li>
                </div>

                <button className='checkout' onClick={check}>Checkout</button>
                 </div>

                  )}



                </div>
                )}
                

                
        </div>
        )}
         
          
        </div>

            {showPopup && (
        <div className="popup">

          <div className="spinner">
            <div></div>   
            <div></div>    
            <div></div>    
            <div></div>    
            <div></div>    
            <div></div>    
            <div></div>    
            <div></div>    
            <div></div>    
            <div></div>    
          </div>


        </div>
      )}

      {completed && (
        <div className='checkout-popup'>

            <div className='close-btn'><MdKeyboardArrowLeft className='icon'/> <NavLink to='/store' className='button'>Home</NavLink> </div>

          <div className='checkout-container'>

          <div className="checkbox-wrapper">
          <input defaultChecked={false} type="checkbox" />
          <svg viewBox="0 0 35.6 35.6">
            <circle className="background" cx="17.8" cy="17.8" r="17.8"></circle>
            <circle className="stroke" cx="17.8" cy="17.8" r="14.37"></circle>
            <polyline className="check" points="11.78 18.12 15.55 22.23 25.17 12.87"></polyline>
          </svg>
                </div>

        <h2>Order Confirmed</h2>


        <p>Thank you for shopping on Evanis interiors! <br /> We will contact you soon to confirm the delivery fees.</p>
        <p>Order ID: <span>{orderID}</span></p>

       <div className='buttons'>
            <NavLink to= '/store'>Continue Shopping</NavLink>
            <NavLink to='/myorders'> Order Details</NavLink>
        </div>

          </div>
          </div>
      )}

      
      {notCompleted && (
        <div className='addNumber'>


          <div className='checkout-container'>

        <p>Please Add a number as a way to reach you when your order is ready for Delivery</p>

       <div className='buttons'>
            <button onClick={() => setNotCompleted(false)} className="a">Cancel</button>
            <NavLink onClick={() => setNotCompleted(false)} to='/addNumber' className="a again">Add Number</NavLink>
        </div>

          </div>
          </div>
      )}  


      </div>
    </div>
  );
}

export default Cart;
