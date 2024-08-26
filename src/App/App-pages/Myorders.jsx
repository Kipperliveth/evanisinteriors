import UserNav from '../App-components/UserNav'
import { txtdb } from "../../firebase-config";
import { collection, onSnapshot, query,orderBy, getDocs } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { auth } from '../../firebase-config';
import { onAuthStateChanged } from "firebase/auth";
import { MdOutlineKeyboardArrowLeft } from "react-icons/md";
import { FaTruck } from "react-icons/fa";
import { FaCheck } from "react-icons/fa";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";


function Myorders() {
  const [user, setUser] = useState({})
  const [isLoading, setIsLoading] = useState(true);
  const currentUser = auth.currentUser;
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
 


  useEffect(() => {
    document.title = "My orders Evanis Interiors";

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
  
    return () => unsubscribe();
  }, []); // Run only once when the component mounts


  useEffect(() => {
    if (!user) return; // Return early if user is null
  
    const userId = user.uid;
  
    // Fetch delivered orders
    const fetchDeliveredOrders = async () => {
      try {
        const deliveredOrdersRef = collection(txtdb, `userNotifications/${userId}/deliveredOrders`);
        const deliveredOrdersSnapshot = await getDocs(deliveredOrdersRef);
        let deliveredOrdersData = deliveredOrdersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
               // Sort delivered orders by date (new to old)
               deliveredOrdersData = deliveredOrdersData.sort((a, b) => new Date(b.date) - new Date(a.date));

        setDeliveredOrders(deliveredOrdersData);
      } catch (error) {
        console.error("Error fetching delivered orders:", error);
      }
    };
  
    // Fetch read notifications (existing logic)
    const q = query(collection(txtdb, `userNotifications/${userId}/read`), orderBy("timestamp", "desc"));
  
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const readNotifications = snapshot.docs.map((doc) => {
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
      setNotifications(readNotifications);
      setIsLoading(false);
    });
  
    fetchDeliveredOrders(); // Call the fetch function here
  
    return () => unsubscribe();
  }, [user]);

  //
    //modal

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const openModal = (notification) => {
    setSelectedOrder(notification);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setIsModalOpen(false);
  };

  //
   const formatDate = (date) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };
  //
  
  

  return (
    <div>

      <UserNav />

        <div className="myorders-page">

            <div className="orders-container page">
                <h1>My orders</h1>

                <div>
        {isLoading ? (
          <div className="loading-message">
            <div className="loading-card">
              <div className="loading-img"></div>
              <div className="loading-text"></div>
              <div className="loading-text-III"></div>
              <div className="loading-text-II"></div>
            </div>

            <div className="loading-card">
              <div className="loading-img"></div>
              <div className="loading-text"></div>
              <div className="loading-text-III"></div>
              <div className="loading-text-II"></div>
            </div>

            <div className="loading-card">
              <div className="loading-img"></div>
              <div className="loading-text"></div>
              <div className="loading-text-III"></div>
              <div className="loading-text-II"></div>
            </div>

            <div className="loading-card">
              <div className="loading-img"></div>
              <div className="loading-text"></div>
              <div className="loading-text-III"></div>
              <div className="loading-text-II"></div>
            </div>

            <div className="loading-card">
              <div className="loading-img"></div>
              <div className="loading-text"></div>
              <div className="loading-text-III"></div>
              <div className="loading-text-II"></div>
            </div>

            <div className="loading-card">
              <div className="loading-img"></div>
              <div className="loading-text"></div>
              <div className="loading-text-III"></div>
              <div className="loading-text-II"></div>
            </div>
          </div>
        ) : (

            <div className="orders">
            {deliveredOrders.map((notification) => (

              <div className="order" key={notification.id} onClick={() => openModal(notification)} style={{ cursor: "pointer" }}>

                <div className="top">
                    <h4>{notification.orderRefId}</h4>
                    <p>Items ({notification.cartItems.length})</p>
                </div>

                <div className="bottom">
                    <div className="status">
                        <p>Order Status</p>
                        <h5>{notification.status}</h5>
                    </div>

                    <div className="date">
                        <p>{notification.delivery}</p>
                        <h5>{notification.date ? formatDate(new Date(notification.date)) : ""}</h5>
                    </div>
                    
                </div>


              </div>
              
            ))}

            {deliveredOrders.length === 0 ? (
              <p className='empty'>Your orders will show here</p>
            ): null}

        <div className={`product-modal ${isModalOpen ? "open" : ""}`}>

                {selectedOrder && (
                    <div className="modal-container">
                        
                            <div className="modal-details">
                <button onClick={closeModal} className="back"><MdOutlineKeyboardArrowLeft />My orders</button>

                <div className="head">
      
              <div className="route"><p>Dashboard</p><MdOutlineKeyboardArrowRight className="icon"/><p>My orders</p><MdOutlineKeyboardArrowRight className="icon"/><p className='id'>ID {selectedOrder.orderRefId}</p></div>

              <div className="header">
                <div className='refId'>
                <p>Order ID: {selectedOrder.orderRefId}</p>
                  <button>{selectedOrder.status}</button>
                </div>

                <div className="dates">
                  <div className="p first">{selectedOrder.delivery}: <h4>{selectedOrder.date ? formatDate(new Date(selectedOrder.date)) : ""}</h4></div>
                 
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
                          <h2>Payment</h2>

                          <span>
                          <h5>Items total: </h5><p>&#8358;{parseFloat(selectedOrder.totalPrice).toLocaleString('en-US')}</p>
                          </span>

                          <span>
                          <h5>Amount Paid: </h5>
                      <p>&#8358;{parseFloat(selectedOrder.totalPrice).toLocaleString('en-US')}</p>
                          </span>

                        </div>

                        <div className="right">
                      <h2>Delivery</h2>
                      <h3>Address</h3>
                      <p> {selectedOrder.address}</p>
                      <p> {selectedOrder.shippingOption}/{selectedOrder.state}</p>
                      <p>{selectedOrder.callLine}</p>

                      <div className="p second"><FaTruck className="icon"/> Estimated delivery between: {selectedOrder.formattedDate15DaysFromNow} - {selectedOrder.formattedDate20DaysFromNow} </div>
                     
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

        </div>

    </div>
  )
}

export default Myorders