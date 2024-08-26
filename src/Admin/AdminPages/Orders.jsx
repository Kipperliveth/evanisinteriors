import React, {useState, useEffect} from "react";
import AdminDashboard from "../AdminComponents/AdminDashboard";
import { txtdb } from "../../firebase-config";
import { collection, onSnapshot, getDocs, doc, setDoc, deleteDoc, addDoc, updateDoc } from "firebase/firestore";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import { FaCheckDouble } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import { MdOutlineKeyboardArrowLeft } from "react-icons/md";
import { FaTruck } from "react-icons/fa";
import { FaCheck } from "react-icons/fa";
import { ImSpinner8 } from "react-icons/im";
import emailjs from 'emailjs-com';

// emailjs.init("I9WFMLdV0i4NoNHmd");


function Orders() {

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  //new orders
  const fetchOrders = async () => {
    try {
      const ordersCollection = collection(txtdb, "orders");
      const ordersSnapshot = await getDocs(ordersCollection);
      const ordersList = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setOrders(ordersList);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(orders);
  }, [orders]);

    //completed orders
    const [completedOrders, setCompletedOrders] = useState([]);

    useEffect(() => {
      const unsubscribe = onSnapshot(collection(txtdb, "completed"), (snapshot) => {
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCompletedOrders(orders);
      });
  
      return () => unsubscribe(); // Cleanup subscription on unmount
    }, []);

        //orders for pickup
        const [readyForPickup, setReadyForPickup] = useState([]);

        useEffect(() => {
          const unsubscribe = onSnapshot(collection(txtdb, "pendingPickup"), (snapshot) => {
            const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setReadyForPickup(orders);
          });
      
          return () => unsubscribe(); // Cleanup subscription on unmount
        }, []);

            //orders for deliveries
            const [readyForDelivery, setReadyForDelivery] = useState([]);

            useEffect(() => {
              const unsubscribe = onSnapshot(collection(txtdb, "pendingDelivery"), (snapshot) => {
                const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setReadyForDelivery(orders);
              });
          
              return () => unsubscribe(); // Cleanup subscription on unmount
            }, []);

  //search
  const [searchInput, setSearchInput] = useState('');
  const [filteredOrders, setFilteredOrders] = useState(orders);


  const handleSearch = () => {
    const filtered = currentPage ? 
      orders.filter(order => {
        const formattedDate = formatDate(order.createdAt.toDate());
        return order.id.includes(searchInput) || formattedDate.includes(searchInput);
      }) :
      completedOrders.filter(order => {
        const formattedDate = formatDate(new Date(order.completionDate));
        return order.id.includes(searchInput) || formattedDate.includes(searchInput);
      });
    setFilteredOrders(filtered);
  };

  useEffect(() => {
    handleSearch(); // Run search on initial mount to populate filteredOrders
  },[searchInput, orders] );
  
  const [filterCompleted, setFilterCompleted] = useState(completedOrders);
  const [completedInput, setCompletedInput] = useState('')

  const completedOrdersSearch = () => {
    const filtered = currentPage ? 
    completedOrders.filter(completedOrder => {
      const formattedDate = formatDate(completedOrder.createdAt.toDate());
      return completedOrder.id.includes(completedInput) || formattedDate.includes(completedInput);
    }) :
    completedOrders.filter(order => {
      const formattedDate = formatDate(new Date(order.completionDate));
      return order.id.includes(completedInput) || formattedDate.includes(completedInput);
    });
    setFilterCompleted(filtered);
  }

  useEffect(() => {
    completedOrdersSearch();
  }, [completedInput, completedOrders]);

  //pendingPickup search

  const [filterPendingPickup, setFilterPendingPickup] = useState(readyForPickup);
  const [pendingPickupInput, setPendingPickupInput] = useState('')

  const pendingPickupSearch = () => {
    const filtered = currentPage ? 
    readyForPickup.filter(pendingPickup => {
      const formattedDate = formatDate(pendingPickup.createdAt.toDate());
      return pendingPickup.id.includes(pendingPickupInput) || formattedDate.includes(pendingPickupInput);
    }) :
    completedOrders.filter(order => {
      const formattedDate = formatDate(new Date(order.completionDate));
      return order.id.includes(pendingPickupInput) || formattedDate.includes(pendingPickupInput);
    });
    setFilterPendingPickup(filtered);
  }

  useEffect(() => {
    pendingPickupSearch();
  }, [pendingPickupInput, readyForPickup]);

  //pending delivery search
  const [filterPendingDelivery, setFilterPendingDelivery] = useState(readyForDelivery);
  const [pendingDeliveryInput, setPendingDeliveryInput] = useState('')

  const pendingDeliverySearch = () => {
    const filtered = currentPage ? 
    readyForDelivery.filter(pendingDelivery => {
      const formattedDate = formatDate(pendingDelivery.createdAt.toDate());
      return pendingDelivery.id.includes(pendingDeliveryInput) || formattedDate.includes(pendingDeliveryInput);
    }) :
    completedOrders.filter(order => {
      const formattedDate = formatDate(new Date(order.completionDate));
      return order.id.includes(pendingDeliveryInput) || formattedDate.includes(pendingDeliveryInput);
    });
    setFilterPendingDelivery(filtered);
  }

  useEffect(() => {
    pendingDeliverySearch();
  }, [pendingDeliveryInput, readyForDelivery]);

  //modal

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const openModal = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setIsModalOpen(false);
  };

  const formatDate = (date) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  //completed?
  const [currentPage, setCurrentPage] = useState('first');

  const markAsCompleted = async () => {
    setIsLoggedIn(true);
    const userID = selectedOrder.userId;

    if (selectedOrder) {
      const completedOrderData = {
        ...selectedOrder,
        completionDate: new Date().toISOString()
      };

      try {
        await setDoc(doc(txtdb, "completed", selectedOrder.id), completedOrderData);
              // Delete the order from the "orders" collection
      // await deleteDoc(doc(txtdb, "orders", selectedOrder.id));
      // addDoc(collection(txtdb, `userNotifications/${userID}/deliveredOrders`), {
      //   orderRefId: selectedOrder.id,
      //   satus: "pending",
      //   cart: completedOrderData.cartItems,
      //   state: completedOrderData.state,
      //   totalPrice: completedOrderData.totalPrice,
      //   completionDate: completedOrderData.completionDate,
      //   addresss: completedOrderData.address
      // });
      //
      const orderData = collection(txtdb, `userNotifications/${userID}/deliveredOrders`);
      const orderDatadb = await getDocs(orderData);
      const orderDataArray = orderDatadb.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log("orderdata", orderDataArray[0].docRef);
      
      const selectedOrderId = selectedOrder.id;
      console.log(selectedOrderId)

// Loop through the orderDataArray and find the document with matching orderRefId
      let foundDoc = null;
      for (let doc of orderDataArray) {
          if (doc.orderRefId === selectedOrderId) {
              foundDoc = doc;
              break;
          }
      }

      if (foundDoc) {
          console.log("Document containing matching order data:", foundDoc);
      } else {
          console.log("No document found containing the matching order ID.");
          setIsLoggedIn(false);

      }

      const documentId = foundDoc.docRef;
      console.log('documnet ref', documentId)
            //
            await deleteDoc(doc(txtdb, "orders", selectedOrder.id)).then(() =>{
        updateDoc(doc(txtdb, `userNotifications/${userID}/deliveredOrders/${documentId}`),{
          status: "Delivered",
          date: completedOrderData.completionDate,
          delivery: 'Delivered on'
        })
      }).finally(() => {
        addDoc(collection(txtdb, `userNotifications/${userID}/deliverynotifications`), {
          orderRefId: selectedOrderId,
          timestamp:completedOrderData.completionDate,
          userEmail: selectedOrder.userEmail,
          username: selectedOrder.username
        }).then(() => {

          let emailContent = `
          `;
          // Loop through fetchedProducts array to include product name and quantity
          selectedOrder.cartItems.forEach((product, index) => {
          emailContent += `\n    - ${product.txtVal} (x ${product.quantity})`;
          });
          ;

          
          const date = new Date();
          const formattedDate = date.toISOString().split('T')[0];
          const timestamp = formattedDate;
          // emailjs.send("service_1i849ri", "template_mwys2kw", {
          //   to_email: selectedOrder.userEmail,
          //   userEmail: selectedOrder.userEmail,
          //   message: emailContent,
          //   orderRefId: selectedOrderId,
          //   city: selectedOrder.city,
          //   state: selectedOrder.state,
          //   totalPrice: selectedOrder.totalPrice,
          //   deliveryFee: selectedOrder.deliveryFee,
          //   username: selectedOrder.username,
          //   timestamp: timestamp,
          //   from_name: "Evanis Interiors"
          //   // other variables you want to include in your email template
          // })

        })
      })    
      
            //
            closeModal();
            setIsLoggedIn(false);

              console.log("Order marked as completed and added to Firebase.");
            } catch (error) {
              console.error("Error adding document: ", error);
              setIsLoggedIn(false);

            }
          }
        };


        //mark as ready for delivery
        const markAsReadyToDeliver = async () => {
          setIsLoggedIn(true);
          const userID = selectedOrder.userId;
      
          if (selectedOrder) {
            const completedOrderData = {
              ...selectedOrder,
              completionDate: new Date().toISOString()
            };
      
            try {
              await setDoc(doc(txtdb, "pendingDelivery", selectedOrder.id), completedOrderData);
                    // Delete the order from the "orders" collection
            // await deleteDoc(doc(txtdb, "orders", selectedOrder.id));
            // addDoc(collection(txtdb, `userNotifications/${userID}/deliveredOrders`), {
            //   orderRefId: selectedOrder.id,
            //   satus: "pending",
            //   cart: completedOrderData.cartItems,
            //   state: completedOrderData.state,
            //   totalPrice: completedOrderData.totalPrice,
            //   completionDate: completedOrderData.completionDate,
            //   addresss: completedOrderData.address
            // });
            //
            const orderData = collection(txtdb, `userNotifications/${userID}/deliveredOrders`);
            const orderDatadb = await getDocs(orderData);
            const orderDataArray = orderDatadb.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log("orderdata", orderDataArray[0].docRef);
            
            const selectedOrderId = selectedOrder.id;
            console.log(selectedOrderId)
      
      // Loop through the orderDataArray and find the document with matching orderRefId
            let foundDoc = null;
            for (let doc of orderDataArray) {
                if (doc.orderRefId === selectedOrderId) {
                    foundDoc = doc;
                    break;
                }
            }
      
            if (foundDoc) {
                console.log("Document containing matching order data:", foundDoc);
            } else {
                console.log("No document found containing the matching order ID.");
                setIsLoggedIn(false);
      
            }
      
            const documentId = foundDoc.docRef;
            console.log('documnet ref', documentId)
                  //
                  await deleteDoc(doc(txtdb, "orders", selectedOrder.id)).then(() =>{
              updateDoc(doc(txtdb, `userNotifications/${userID}/deliveredOrders/${documentId}`),{
                status: "Ready for Delivery",
                date: completedOrderData.completionDate,
                delivery: 'Ready on'
              })
            }).finally(() => {
              addDoc(collection(txtdb, `userNotifications/${userID}/pendingDeliveryNotification`), {
                orderRefId: selectedOrderId,
                timestamp:completedOrderData.completionDate,
                userEmail: selectedOrder.userEmail,
                username: selectedOrder.username
              })
              .then(() => {
      
                let emailContent = `
                `;
                // Loop through fetchedProducts array to include product name and quantity
                selectedOrder.cartItems.forEach((product, index) => {
                emailContent += `\n    - ${product.txtVal} (x ${product.quantity})`;
                });
                ;
      
                
                const date = new Date();
                const formattedDate = date.toISOString().split('T')[0];
                const timestamp = formattedDate;
                emailjs.send("service_", "template_", {
                  to_email: selectedOrder.userEmail,
                  userEmail: selectedOrder.userEmail,
                  message: emailContent,
                  orderRefId: selectedOrderId,
                  city: selectedOrder.city,
                  state: selectedOrder.state,
                  totalPrice: selectedOrder.totalPrice,
                  deliveryFee: selectedOrder.deliveryFee,
                  username: selectedOrder.username,
                  timestamp: timestamp,
                  from_name: "Evanis Interiors"
                  // other variables you want to include in your email template
                })
      
              })
            })    
            
                  //
                  closeModal();
                  setIsLoggedIn(false);
      
                    console.log("Order marked as completed and added to Firebase.");
                  } catch (error) {
                    console.error("Error adding document: ", error);
                    setIsLoggedIn(false);
      
                  }
                }
              };

                //mark as ready for delivery
        const markAsReadyForPickup = async () => {
          setIsLoggedIn(true);
          const userID = selectedOrder.userId;
      
          if (selectedOrder) {
            const completedOrderData = {
              ...selectedOrder,
              completionDate: new Date().toISOString()
            };
      
            try {
              await setDoc(doc(txtdb, "pendingPickup", selectedOrder.id), completedOrderData);
                    // Delete the order from the "orders" collection
            // await deleteDoc(doc(txtdb, "orders", selectedOrder.id));
            // addDoc(collection(txtdb, `userNotifications/${userID}/deliveredOrders`), {
            //   orderRefId: selectedOrder.id,
            //   satus: "pending",
            //   cart: completedOrderData.cartItems,
            //   state: completedOrderData.state,
            //   totalPrice: completedOrderData.totalPrice,
            //   completionDate: completedOrderData.completionDate,
            //   addresss: completedOrderData.address
            // });
            //
            const orderData = collection(txtdb, `userNotifications/${userID}/deliveredOrders`);
            const orderDatadb = await getDocs(orderData);
            const orderDataArray = orderDatadb.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log("orderdata", orderDataArray[0].docRef);
            
            const selectedOrderId = selectedOrder.id;
            console.log(selectedOrderId)
      
      // Loop through the orderDataArray and find the document with matching orderRefId
            let foundDoc = null;
            for (let doc of orderDataArray) {
                if (doc.orderRefId === selectedOrderId) {
                    foundDoc = doc;
                    break;
                }
            }
      
            if (foundDoc) {
                console.log("Document containing matching order data:", foundDoc);
            } else {
                console.log("No document found containing the matching order ID.");
                setIsLoggedIn(false);
      
            }
      
            const documentId = foundDoc.docRef;
            console.log('documnet ref', documentId)
                  //
                  await deleteDoc(doc(txtdb, "orders", selectedOrder.id)).then(() =>{
              updateDoc(doc(txtdb, `userNotifications/${userID}/deliveredOrders/${documentId}`),{
                status: "Ready for Pick up",
                date: completedOrderData.completionDate,
                delivery: 'Ready on'
              })
            }).finally(() => {
              addDoc(collection(txtdb, `userNotifications/${userID}/pendingPickupNotification`), {
                orderRefId: selectedOrderId,
                timestamp:completedOrderData.completionDate,
                userEmail: selectedOrder.userEmail,
                username: selectedOrder.username
              })
              .then(() => {
      
                let emailContent = `
                `;
                // Loop through fetchedProducts array to include product name and quantity
                selectedOrder.cartItems.forEach((product, index) => {
                emailContent += `\n    - ${product.txtVal} (x ${product.quantity})`;
                });
                ;
      
                
                const date = new Date();
                const formattedDate = date.toISOString().split('T')[0];
                const timestamp = formattedDate;
                emailjs.send("service_", "template_", {
                  to_email: selectedOrder.userEmail,
                  userEmail: selectedOrder.userEmail,
                  message: emailContent,
                  orderRefId: selectedOrderId,
                  city: selectedOrder.city,
                  state: selectedOrder.state,
                  totalPrice: selectedOrder.totalPrice,
                  deliveryFee: selectedOrder.deliveryFee,
                  username: selectedOrder.username,
                  timestamp: timestamp,
                  from_name: "Evanis Interiors"
                  // other variables you want to include in your email template
                })
      
              })
            })    
            
                  //
                  closeModal();
                  setIsLoggedIn(false);
      
                    console.log("Order marked as completed and added to Firebase.");
                  } catch (error) {
                    console.error("Error adding document: ", error);
                    setIsLoggedIn(false);
      
                  }
                }
              };

  //delivery or pickup
  const markAsPending = () => {
    if (selectedOrder.shippingOption === 'DOOR DELIVERY') {
      markAsReadyToDeliver();
      console.log("DELIVERY");
    } else {
      markAsReadyForPickup();
      console.log("pickup");
    }
  };
  

  return (
    <div className="adminHome">
      <AdminDashboard />

      <h2 className="admin-current-page mobile-content">Orders</h2>
      
      <div className="adminNotifications adminContent">

      <h2 className="admin-current-page desktop-content">Orders</h2>

     

         <div className='completed'>
      <button className={currentPage === 'first' ? 'active' : ''} onClick={() => setCurrentPage('first')}>New Orders <span>{orders.length}</span></button>
      <button className={currentPage === 'third' ? 'active' : ''} onClick={() => setCurrentPage('third')}>Pending Delivery</button>
      <button className={currentPage === 'fourth' ? 'active' : ''} onClick={() => setCurrentPage('fourth')}>Pending Pick-up</button>
      <button className={currentPage === 'second' ? 'active' : ''} onClick={() => setCurrentPage('second')}>Completed Orders</button>
    </div>


      {currentPage === 'first' && (
     <div className="first">

      <div className="search-bar" >
        <input 
          type="text" 
          placeholder="Search by Order ID" 
          value={searchInput} 
          onChange={(e) => setSearchInput(e.target.value)} 
        />
        <button onClick={handleSearch}><FaSearch className="icon"/>Search</button>
      </div>


     {loading ? (
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
       <div className="orderList">
         <div className="order head">
           <div>Order ID</div>
           <div>Username</div>
           <div className="desktop">Total</div>
           <div className="date">Date Ordered</div>
         </div>
         {filteredOrders.map(order => (
           <div className="order" key={order.id} onClick={() => openModal(order)} style={{ cursor: "pointer" }}>
             <p className="orderID">{order.id}</p>
             <p>{order.username}</p>
             <p className="desktop">{parseFloat(order.totalPrice).toLocaleString('en-US')}</p>
             <p>{formatDate(order.createdAt.toDate())}</p>

           </div>
         ))}

         {orders.length === 0 ? (
         <p className="no-notifications">No pending orders</p> 
           ) : null}
       </div>
     )}


     <div className={`product-modal ${isModalOpen ? "open" : ""}`}>
     {selectedOrder && (
       <div className="modal-container">

         <div className="modal-details">
         <button onClick={closeModal} className="back"><MdOutlineKeyboardArrowLeft /> Orders</button>

         <div className="head">

           <div className="route"><p>Dashboard</p><MdOutlineKeyboardArrowRight className="icon"/><p>Orders</p><MdOutlineKeyboardArrowRight className="icon"/><p className='id'>ID {selectedOrder.id}</p></div>

           <div className="header">
             <span>
             <h1>Order ID: {selectedOrder.id}</h1>
               <button onClick={markAsPending} > {isLoggedIn ? (
               <ImSpinner8 className="login-spinner" />
             ) : (
               "Mark as Ready"
             )} <FaCheck className="icon"/></button>
             </span>

             <div className="dates">
               <div className="p first">Order Date: <h4>{formatDate(selectedOrder.createdAt.toDate())}</h4></div>
               <div className="p second"><FaTruck className="icon"/> Estimated delivery between: {selectedOrder.formattedDate15DaysFromNow} - {selectedOrder.formattedDate20DaysFromNow} </div>
             </div>
           </div>
         </div>

         <div className="cart-details">
         
           {selectedOrder.cartItems.map((item, index) => (
             <div className='cart' key={index}>

               <div className="left">
                 <span><img src={item.imgUrl} alt='description'/></span>

                 <span>
               <p className="name">{item.txtVal}</p>
               <p>{item.color}</p>
               <p>{item.size}</p>
               </span>
               

               </div>

               <div className="right">
               <p className="price">&#8358;{parseFloat(item.price).toLocaleString('en-US')}</p>
               <p>Qty: {item.quantity}</p>
               </div>

             </div>
           ))}
         
         </div>

           <div className="bottom">


           <div className="left">
             <h2>Customer Profile</h2>
            <p>Email: <span>{selectedOrder.userEmail}</span> </p>
            <p>Username: <span>{selectedOrder.username}</span> </p>
            <p className="elip">User ID: <span>{selectedOrder.userId}</span> </p>

           </div>

           <div className="right">
         <h2>Delivery</h2>
         <h3>Address</h3>
         <p> {selectedOrder.address}</p>
         <p> {selectedOrder.shippingOption}/{selectedOrder.state}</p>
          <p>{selectedOrder.callLine}</p>

           <span>
          <h3>Items Price: </h3>
         <p>&#8358;{parseFloat(selectedOrder.totalPrice).toLocaleString('en-US')}</p>
           </span>

         <span>
          <h3>Amount Paid: </h3>
         <p>&#8358;{parseFloat(selectedOrder.totalPrice).toLocaleString('en-US')}</p>
         </span>


           </div>
           </div>

       

         </div>

       </div>
     )}
     </div>
     </div>
    )}
    
      {currentPage === 'second' && (
        <div className="second">

      <div className="search-bar" >
        <input 
          type="text" 
          placeholder="Search by Order ID" 
          value={completedInput} 
          onChange={(e) => setCompletedInput(e.target.value)} 
        />
        <button onClick={completedOrdersSearch}><FaSearch className="icon"/>Search</button>
      </div>

        {loading ? (
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
          <div className="orderList">
            <div className="order head">
              <div>Order ID</div>
              <div>Username</div>
              <div className="desktop">Total</div>
              <div className="date">Delivered On</div>
            </div>
            {filterCompleted.map(order => (
              <div className="order" key={order.id} onClick={() => openModal(order)} style={{ cursor: "pointer" }}>
                <p className="orderID">{order.id}</p>
                <p>{order.username}</p>
                <p className="desktop">{parseFloat(order.totalPrice).toLocaleString('en-US')}</p>
                <p>{order.completionDate ? formatDate(new Date(order.completionDate)) : ""}
  </p>
              </div>
            ))}
  
            {completedOrders.length === 0 ? (
              <p className="no-notifications">Completed orders will show here</p> 
                ) : null}
          </div>
        )}
  
  
        <div className={`product-modal ${isModalOpen ? "open" : ""}`}>
        {selectedOrder && (
          <div className="modal-container">
  
            <div className="modal-details">
            <button onClick={closeModal} className="back"><MdOutlineKeyboardArrowLeft /> Orders</button>
  
            <div className="head">
  
              <div className="route"><p>Dashboard</p><MdOutlineKeyboardArrowRight className="icon"/><p>Orders</p><MdOutlineKeyboardArrowRight className="icon"/><p className='id'>ID {selectedOrder.id}</p></div>
  
              <div className="header">
                <span>
                <h1>Order ID: {selectedOrder.id}</h1>
                  <button>Completed<FaCheckDouble className="icon"/></button>
                </span>
  
                <div className="dates">
                  <div className="p first">Order Date: <h4>{formatDate(selectedOrder.createdAt.toDate())}</h4></div>
                  <div className="p second"><FaTruck className="icon"/> Delivered on: {selectedOrder.completionDate ? formatDate(new Date(selectedOrder.completionDate)) : ""}
    </div>
                </div>
              </div>
            </div>
  
            <div className="cart-details">
            
              {selectedOrder.cartItems.map((item, index) => (
                <div className='cart' key={index}>
  
                  <div className="left">
                    <span><img src={item.imgUrl} alt='description'/></span>
  
                    <span>
                  <p className="name">{item.txtVal}</p>
                  <p>{item.color}</p>
                  <p>{item.size}</p>
                  </span>
                  
  
                  </div>
  
                  <div className="right">
                  <p className="price">&#8358;{parseFloat(item.price).toLocaleString('en-US')}</p>
                  <p>Qty: {item.quantity}</p>
                  </div>
  
                </div>
              ))}
            
            </div>
  
              <div className="bottom">
  
  
              <div className="left">
                <h2>Customer Profile</h2>
                <p>Email: <span>{selectedOrder.userEmail}</span> </p>
                <p>Username: <span>{selectedOrder.username}</span> </p>
                <p className="elip">User ID: <span>{selectedOrder.userId}</span> </p>
  
              </div>
  
              <div className="right">
            <h2>Delivery</h2>
            <h3>Address</h3>
            <p> {selectedOrder.address}</p>
            <p> {selectedOrder.shippingOption}/{selectedOrder.state}</p>
              <p>{selectedOrder.callLine}</p>
            
              <span>
                <h3>Items Price: </h3>
              <p>&#8358;{parseFloat(selectedOrder.totalPrice).toLocaleString('en-US')}</p>
                </span>
  
                <span>
                <h3>Delivery Fee:</h3>
              <p>&#8358;{parseFloat(selectedOrder.deliveryFee).toLocaleString('en-US')}</p>
              </span>
  
              <span>
                <h3>Total: </h3>
              <p>&#8358;{parseFloat(selectedOrder.totalPrice + selectedOrder.deliveryFee).toLocaleString('en-US')}</p>
              </span>
              </div>
              </div>
  
          
  
            </div>
  
          </div>
        )}
        </div>
        </div>
      )}
    
    {currentPage === 'third' && (
       <div className="third">

       <div className="search-bar" >
         <input 
           type="text" 
           placeholder="Search by Order ID" 
           value={pendingDeliveryInput} 
           onChange={(e) => setPendingDeliveryInput(e.target.value)} 
         />
         <button onClick={pendingDeliverySearch}><FaSearch className="icon"/>Search</button>
       </div>
 
 
      {loading ? (
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
        <div className="orderList">
          <div className="order head">
            <div>Order ID</div>
            <div>Username</div>
            <div className="desktop">Total</div>
            <div className="date">Date Ready</div>
          </div>
          {filterPendingDelivery.map(order => (
            <div className="order" key={order.id} onClick={() => openModal(order)} style={{ cursor: "pointer" }}>
              <p className="orderID">{order.id}</p>
              <p className='username'>{order.username}</p>
              <p className="desktop">{parseFloat(order.totalPrice).toLocaleString('en-US')}</p>
              <p>{order.completionDate ? formatDate(new Date(order.completionDate)) : ""}</p>
 
            </div>
          ))}
 
          {readyForDelivery.length === 0 ? (
          <p className="no-notifications">No pending Deliveries</p> 
            ) : null}
        </div>
      )}
 
 
      <div className={`product-modal ${isModalOpen ? "open" : ""}`}>
      {selectedOrder && (
        <div className="modal-container">
 
          <div className="modal-details">
          <button onClick={closeModal} className="back"><MdOutlineKeyboardArrowLeft /> Orders</button>
 
          <div className="head">
 
            <div className="route"><p>Dashboard</p><MdOutlineKeyboardArrowRight className="icon"/><p>Orders</p><MdOutlineKeyboardArrowRight className="icon"/><p className='id'>ID {selectedOrder.id}</p></div>
 
            <div className="header">
              <span>
              <h1>Order ID: {selectedOrder.id}</h1>
                <button onClick={markAsCompleted} > {isLoggedIn ? (
                <ImSpinner8 className="login-spinner" />
              ) : (
                "Mark as Delivered"
              )} <FaCheck className="icon"/></button>
              </span>
 
              <div className="dates">
                <div className="p first">Ready On: <h4>{selectedOrder.completionDate ? formatDate(new Date(selectedOrder.completionDate)) : ""}</h4></div>
                <div className="p second"><FaTruck className="icon"/> Estimated Delivery between: {selectedOrder.formattedDate15DaysFromNow} - {selectedOrder.formattedDate20DaysFromNow} </div>
              </div>
            </div>
          </div>
 
          <div className="cart-details">
          
            {selectedOrder.cartItems.map((item, index) => (
              <div className='cart' key={index}>
 
                <div className="left">
                  <span><img src={item.imgUrl} alt='description'/></span>
 
                  <span>
                <p className="name">{item.txtVal}</p>
                <p>{item.color}</p>
                <p>{item.size}</p>
                </span>
                
 
                </div>
 
                <div className="right">
                <p className="price">&#8358;{parseFloat(item.price).toLocaleString('en-US')}</p>
                <p>Qty: {item.quantity}</p>
                </div>
 
              </div>
            ))}
          
          </div>
 
            <div className="bottom">
 
 
            <div className="left">
              <h2>Customer Profile</h2>
             <p>Email: <span>{selectedOrder.userEmail}</span> </p>
             <p>Username: <span>{selectedOrder.username}</span> </p>
             <p className="elip">User ID: <span>{selectedOrder.userId}</span> </p>
 
            </div>
 
            <div className="right">
          <h2>Delivery</h2>
          <h3>Address</h3>
          <p> {selectedOrder.address}</p>
          <p> {selectedOrder.shippingOption}/{selectedOrder.state}</p>
           <p>{selectedOrder.callLine}</p>
 
            <span>
           <h3>Items Price: </h3>
          <p>&#8358;{parseFloat(selectedOrder.totalPrice).toLocaleString('en-US')}</p>
            </span>
 
            <span>
           <h3>Delivery Fee:</h3>
          <p>&#8358;{parseFloat(selectedOrder.deliveryFee).toLocaleString('en-US')}</p>
          </span>
 
          <span>
           <h3>Total: </h3>
          <p>&#8358;{parseFloat(selectedOrder.totalPrice + selectedOrder.deliveryFee).toLocaleString('en-US')}</p>
          </span>
 
 
            </div>
            </div>
 
        
 
          </div>
 
        </div>
      )}
      </div>
      </div>
    )}
    
    {currentPage === 'fourth' && (
       <div className="fourth">

       <div className="search-bar" >
         <input 
           type="text" 
           placeholder="Search by Order ID" 
           value={pendingPickupInput} 
           onChange={(e) => setPendingPickupInput(e.target.value)} 
         />
         <button onClick={pendingPickupSearch}><FaSearch className="icon"/>Search</button>
       </div>
 
 
      {loading ? (
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
        <div className="orderList">
          <div className="order head">
            <div>Order ID</div>
            <div>Username</div>
            <div className="desktop">Total</div>
            <div className="date">Date Ready</div>
          </div>
          {filterPendingPickup.map(order => (
            <div className="order" key={order.id} onClick={() => openModal(order)} style={{ cursor: "pointer" }}>
              <p className="orderID">{order.id}</p>
              <p className='username'>{order.username}</p>
              <p className="desktop">{parseFloat(order.totalPrice).toLocaleString('en-US')}</p>
              <p>{order.completionDate ? formatDate(new Date(order.completionDate)) : ""}</p>
 
            </div>
          ))}
 
          {readyForPickup.length === 0 ? (
          <p className="no-notifications">No pending Pickups</p> 
            ) : null}
        </div>
      )}
 
 
      <div className={`product-modal ${isModalOpen ? "open" : ""}`}>
      {selectedOrder && (
        <div className="modal-container">
 
          <div className="modal-details">
          <button onClick={closeModal} className="back"><MdOutlineKeyboardArrowLeft /> Orders</button>
 
          <div className="head">
 
            <div className="route"><p>Dashboard</p><MdOutlineKeyboardArrowRight className="icon"/><p>Orders</p><MdOutlineKeyboardArrowRight className="icon"/><p className='id'>ID {selectedOrder.id}</p></div>
 
            <div className="header">
              <span>
              <h1>Order ID: {selectedOrder.id}</h1>
                <button onClick={markAsCompleted} > {isLoggedIn ? (
                <ImSpinner8 className="login-spinner" />
              ) : (
                "Mark as Picked Up"
              )} <FaCheck className="icon"/></button>
              </span>
 
              <div className="dates">
                <div className="p first">Ready On: <h4>{selectedOrder.completionDate ? formatDate(new Date(selectedOrder.completionDate)) : ""}</h4></div>
                <div className="p second"><FaTruck className="icon"/> Estimated Delivery between: {selectedOrder.formattedDate15DaysFromNow} - {selectedOrder.formattedDate20DaysFromNow} </div>
              </div>
            </div>
          </div>
 
          <div className="cart-details">
          
            {selectedOrder.cartItems.map((item, index) => (
              <div className='cart' key={index}>
 
                <div className="left">
                  <span><img src={item.imgUrl} alt='description'/></span>
 
                  <span>
                <p className="name">{item.txtVal}</p>
                <p>{item.color}</p>
                <p>{item.size}</p>
                </span>
                
 
                </div>
 
                <div className="right">
                <p className="price">&#8358;{parseFloat(item.price).toLocaleString('en-US')}</p>
                <p>Qty: {item.quantity}</p>
                </div>
 
              </div>
            ))}
          
          </div>
 
            <div className="bottom">
 
 
            <div className="left">
              <h2>Customer Profile</h2>
             <p>Email: <span>{selectedOrder.userEmail}</span> </p>
             <p>Username: <span>{selectedOrder.username}</span> </p>
             <p className="elip">User ID: <span>{selectedOrder.userId}</span> </p>
 
            </div>
 
            <div className="right">
          <h2>Delivery</h2>
          <h3>Address</h3>
          <p> {selectedOrder.address}</p>
          <p> {selectedOrder.shippingOption}/{selectedOrder.state}</p>
           <p>{selectedOrder.callLine}</p>
 
            <span>
           <h3>Items Price: </h3>
          <p>&#8358;{parseFloat(selectedOrder.totalPrice).toLocaleString('en-US')}</p>
            </span>
 
            <span>
           <h3>Delivery Fee:</h3>
          <p>&#8358;{parseFloat(selectedOrder.deliveryFee).toLocaleString('en-US')}</p>
          </span>
 
          <span>
           <h3>Total: </h3>
          <p>&#8358;{parseFloat(selectedOrder.totalPrice + selectedOrder.deliveryFee).toLocaleString('en-US')}</p>
          </span>
 
 
            </div>
            </div>
 
        
 
          </div>
 
        </div>
      )}
      </div>
      </div>
    )}
      
       
      </div>

 


    </div>
  );
}


export default Orders;
