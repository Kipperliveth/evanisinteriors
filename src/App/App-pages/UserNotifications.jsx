import React, { useState, useEffect } from "react";
import UserNav from "../App-components/UserNav";
import { collection, query, orderBy, deleteDoc, addDoc,doc, onSnapshot } from "firebase/firestore";
import { txtdb } from "../../firebase-config";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase-config";
import { PiNotePencilLight } from "react-icons/pi";
import { CiDeliveryTruck } from "react-icons/ci";
import { LuPackage } from "react-icons/lu";
import { TbTruckDelivery } from "react-icons/tb";


function UserNotifications() {
  const [notifications, setNotifications] = useState([]);
  const currentUser = auth.currentUser;
  const [user, setUser] = useState({})
  const [isLoading, setIsLoading] = useState(true);
  const [readNotifications, setReadNotifications] = useState([]);
  // pop up spinner
const [showPopup, setShowPopup] = useState(false);


  
  useEffect(() => {
    document.title = "Notifications - Evanis Interiors";

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
  
    return () => unsubscribe();
  }, []); // Run only once when the component mounts
  
  useEffect(() => {
    if (!user) return; // Return early if user is null
  
    const userId = user.uid;
    const q = query(
      collection(txtdb, `userNotifications/${userId}/inbox`),
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
            month: "short",
            year: "numeric",
          }),
        };
      });
      // Count the number of unread notifications
      // const unreadNotifications = newNotifications.filter((notification) => !notification.read);
      // setUnreadCount(unreadNotifications.length);
      setNotifications(newNotifications);
      setIsLoading(false);


    });
  
    return () => unsubscribe();
  }, [user]); // Run whenever the user object changes
 
  //read notifs

  useEffect(() => {
    if (!user) return; // Return early if user is null
  
    const userId = user.uid;
    const q = query(
      collection(txtdb, `userNotifications/${userId}/read`),
      orderBy("timestamp", "desc")
    );
  
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newwNotifications = snapshot.docs.map((doc) => {
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
            month: "short",
            year: "numeric",
          }),
        };
      });
      // Count the number of unread notifications
      setReadNotifications(newwNotifications);
      setIsLoading(false);


    });
  
    return () => unsubscribe();
  }, [user]);

  //delete function
  const handleDeleteNotification = async (notificationId) => {
    try {
      const userId = currentUser.uid;
      await deleteDoc(doc(collection(txtdb, `userNotifications/${userId}/inbox`), notificationId));
      // console.log("Notification deleted");
    } catch (error) {
      // console.error("Error deleting notification:", error);
    }
  };
  

  const handleMarkNotificationAsRead = async (notification) => {
setShowPopup(true);

    try {
      const userId = currentUser.uid;
      const readNotificationData = {
          orderRefId: notification.orderRefId,
      state: notification.state,
      formattedDate15DaysFromNow: notification.formattedDate15DaysFromNow,
      formattedDate20DaysFromNow: notification.formattedDate20DaysFromNow,
      timestamp: notification.timestamp
      };
  
      // Only add state and formattedDate fields if they are defined in the notification
      if (notification.state) {
        readNotificationData.state = notification.state;
      }
      if (notification.formattedDate15DaysFromNow) {
        readNotificationData.formattedDate15DaysFromNow = notification.formattedDate15DaysFromNow;
      }
      if (notification.formattedDate20DaysFromNow) {
        readNotificationData.formattedDate20DaysFromNow = notification.formattedDate20DaysFromNow;
      }
  
      await addDoc(collection(txtdb, `userNotifications/${userId}/read`), readNotificationData);
      // console.log("Notification marked as read and moved to read notifications");
      await handleDeleteNotification(notification.id);
      setShowPopup(false);
      
    } catch (error) {
      // console.error("Error marking notification as read:", error);
      setShowPopup(false);

    }
  };

  //delivered notifs

 const [deliveredNotifications, setDeliveredNotifications] = useState([])

  useEffect(() => {
    if (!user) return; // Return early if user is null
  
    const userId = user.uid;
    const q = query(
      collection(txtdb, `userNotifications/${userId}/deliverynotifications`),
      orderBy("timestamp", "desc")
    );
  
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newDeliveredNotifications = snapshot.docs.map((doc) => {
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
            month: "short",
            year: "numeric",
            // hour: "2-digit",
            // minute: "2-digit",
          }),
        };
      });
 
      setDeliveredNotifications(newDeliveredNotifications);
      setIsLoading(false);


    });
  
    return () => unsubscribe();
  }, [user]); // Run whenever the user object changes

  const handleDeleteDeliveredNotification = async (deliveredId) => {
    try {
      const userId = currentUser.uid;
      await deleteDoc(doc(collection(txtdb, `userNotifications/${userId}/deliverynotifications`), deliveredId));
      // console.log("Notification deleted");
    } catch (error) {
      // console.error("Error deleting notification:", error);
    }
  };
  

  const handleMarkDeliveredNotificationAsRead = async (delivered) => {
    setShowPopup(true);
    
        try {
          const userId = currentUser.uid;
          const readDeliveredNotificationData = {
              orderRefId: delivered.orderRefId,
          timestamp: delivered.timestamp
          };
      
          await addDoc(collection(txtdb, `userNotifications/${userId}/deliveredread`), readDeliveredNotificationData);
          // console.log("Notification marked as read and moved to read notifications");
          await handleDeleteDeliveredNotification(delivered.id);
          setShowPopup(false);
          
        } catch (error) {
          // console.error("Error marking notification as read:", error);
          setShowPopup(false);
    
        }
      };

// read delivered notifs

const [readDeliveredNotifications, setReadDeliveredNotifications] = useState([]);


useEffect(() => {
  if (!user) return; // Return early if user is null

  const userId = user.uid;
  const q = query(
    collection(txtdb, `userNotifications/${userId}/deliveredread`),
    orderBy("timestamp", "desc")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const readDelivNotifications = snapshot.docs.map((doc) => {
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
          month: "long",
          year: "numeric",
        }),
      };
    });
    // Count the number of unread notifications
    setReadDeliveredNotifications(readDelivNotifications);
    setIsLoading(false);


  });

  return () => unsubscribe();
}, [user]);

//pickup notification

const [readyForPickup, setReadyForPickup] = useState([])

useEffect(() => {
  if (!user) return; // Return early if user is null

  const userId = user.uid;
  const q = query(
    collection(txtdb, `userNotifications/${userId}/pendingPickupNotification`),
    orderBy("timestamp", "desc")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const readDelivNotifications = snapshot.docs.map((doc) => {
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
          month: "long",
          year: "numeric",
        }),
      };
    });
    // Count the number of unread notifications
    setReadyForPickup(readDelivNotifications);
    // console.log(readyForPickup, 'ready')
    setIsLoading(false);
  });

  return () => unsubscribe();
}, [user]);

//read pickup notification

const handleDeleteReadyForPickupNotification = async (forPickupId) => {
  try {
    const userId = currentUser.uid;
    await deleteDoc(doc(collection(txtdb, `userNotifications/${userId}/pendingPickupNotification`), forPickupId));
    // console.log("Notification deleted");
  } catch (error) {
    // console.error("Error deleting notification:", error);
  }
};

const handleMarkPickupNotificationAsRead = async (forPickup) => {
  setShowPopup(true);
  
      try {
        const userId = currentUser.uid;
        const readDeliveredNotificationData = {
            orderRefId: forPickup.orderRefId,
        timestamp: forPickup.timestamp
        };
    
        await addDoc(collection(txtdb, `userNotifications/${userId}/ReadPickupNotification`), readDeliveredNotificationData);
        // console.log("Notification marked as read and moved to read notifications");
        await handleDeleteReadyForPickupNotification(forPickup.id);
        setShowPopup(false);
        
      } catch (error) {
        // console.error("Error marking notification as read:", error);
        setShowPopup(false);
      }
    };

//delivery notification

const [readyForDelivery, setReadyForDelivery] = useState([])

useEffect(() => {
  if (!user) return; // Return early if user is null

  const userId = user.uid;
  const q = query(
    collection(txtdb, `userNotifications/${userId}/pendingDeliveryNotification`),
    orderBy("timestamp", "desc")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const readDelivNotifications = snapshot.docs.map((doc) => {
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
          month: "long",
          year: "numeric",
        }),
      };
    });
    // Count the number of unread notifications
    setReadyForDelivery(readDelivNotifications);
    setIsLoading(false);
  });

  return () => unsubscribe();
}, [user]);

const handleDeleteReadyForDeliveryNotification = async (forDeliveryId) => {
  try {
    const userId = currentUser.uid;
    await deleteDoc(doc(collection(txtdb, `userNotifications/${userId}/pendingDeliveryNotification`), forDeliveryId));
    // console.log("Notification deleted");
  } catch (error) {
    // console.error("Error deleting notification:", error);
  }
};

const handleMarkDeliveryNotificationAsRead = async (forDelivery) => {
  setShowPopup(true);
  
      try {
        const userId = currentUser.uid;
        const readDeliveredNotificationData = {
            orderRefId: forDelivery.orderRefId,
        timestamp: forDelivery.timestamp
        };
    
        await addDoc(collection(txtdb, `userNotifications/${userId}/ReadDeliveryNotification`), readDeliveredNotificationData);
        // console.log("Notification marked as read and moved to read notifications");
        await handleDeleteReadyForDeliveryNotification(forDelivery.id);
        setShowPopup(false);
        
      } catch (error) {
        // console.error("Error marking notification as read:", error);
        setShowPopup(false);
      }
    };

//read pickup notifications
    const [readPickupNotification, setReadPickupNotification] = useState([])

    useEffect(() => {
      if (!user) return; // Return early if user is null
    
      const userId = user.uid;
      const q = query(
        collection(txtdb, `userNotifications/${userId}/ReadPickupNotification`),
        orderBy("timestamp", "desc")
      );
    
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const readDelivNotifications = snapshot.docs.map((doc) => {
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
              month: "long",
              year: "numeric",
            }),
          };
        });
        // Count the number of unread notifications
        setReadPickupNotification(readDelivNotifications);
        setIsLoading(false);
    
    
      });
    
      return () => unsubscribe();
    }, [user]);

//read delivery notifications
    const [readDeliveryNotification, setreadDeliveryNotification] = useState([])    

    useEffect(() => {
      if (!user) return; // Return early if user is null
    
      const userId = user.uid;
      const q = query(
        collection(txtdb, `userNotifications/${userId}/ReadDeliveryNotification`),
        orderBy("timestamp", "desc")
      );
    
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const readDelivNotifications = snapshot.docs.map((doc) => {
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
              month: "long",
              year: "numeric",
            }),
          };
        });
        // Count the number of unread notifications
        setreadDeliveryNotification(readDelivNotifications);
        setIsLoading(false);
    
    
      });
    
      return () => unsubscribe();
    }, [user]);

  return (
    <div>

      <UserNav />

      <div  className="notification-page">

        <div className="notification-container page">

        <h1>Notifications</h1>

        {(notifications.length > 0 || deliveredNotifications.length > 0 || readyForDelivery.length> 0 || readyForPickup.length > 0 )? (
          <p className="recent"><span></span>New<span></span></p>
        ) : ('')}

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
          <div className="new-notifications">

        <div className="delivered notifications">
            
            {deliveredNotifications.map((delivered) => (

                <div className="container notification" key={delivered.id}>
                        <div className="left"> <CiDeliveryTruck className="icon"/></div>

            <div className="right">
                <h4>Your order with ID: {delivered.orderRefId} has been Delivered </h4>
                <p style={{ fontWeight: '500' }}>on {delivered.timestamp} </p>
                <p>Use the live chat feature to reach us if you have any queries about this order</p>
                <h5>Thank You!</h5>
                <span>

                <p className="date">{delivered.timestamp}</p> <button onClick={() => handleMarkDeliveredNotificationAsRead(delivered)}>Mark as Read</button>
                
                </span>
            </div>
            
                </div>

            ))}
          </div>

          <div className="delivery notifications"> 
            {readyForDelivery.map((forDelivery) => (

              <div className="notification" key={forDelivery.id}>

                <div className="left"> <TbTruckDelivery  className="icon"/></div>

                <div className="right">
                    <h4>Your order with ID: {forDelivery.orderRefId} is out for Delivery </h4>
                    <p>We will contact you soon for the drop-off.</p>
                    <span>

                    <p className="date">{forDelivery.timestamp}</p> <button onClick={() => handleMarkDeliveryNotificationAsRead(forDelivery)}>Mark as Read</button>
                    
                    </span>
                </div>

              </div>
              
            ))}
            </div>

           <div className="pickup notifications"> 
            {readyForPickup.map((forPickup) => (

              <div className="notification" key={forPickup.id}>

                <div className="left"> <LuPackage  className="icon"/></div>

                <div className="right">
                    <h4>Your order with ID: {forPickup.orderRefId} is ready for Pickup </h4>
                    <p>We will contact you soon for the drop-off.</p>
                    <span>

                    <p className="date">{forPickup.timestamp}</p> <button onClick={() => handleMarkPickupNotificationAsRead(forPickup)}>Mark as Read</button>
                    
                    </span>
                </div>

              </div>
              
            ))}
            </div>
        
            <div className="notifications">
            {notifications.map((notification) => (

              <div className="notification" key={notification.id}>

                <div className="left"> <PiNotePencilLight className="icon"/></div>

                <div className="right">
                    <h4>Your order with ID: {notification.orderRefId} has been confirmed </h4>
                    <p>Expected delivery for this item to {notification.state} is between {notification.formattedDate15DaysFromNow} and {notification.formattedDate20DaysFromNow}</p>
                    <p>Please note that delivery fees are paid for seperately</p>
                    <p>Use the live chat feature to inquire shipping fees</p>
                    <h5>To track your order please contact Evanis Interiors via Email</h5>
                    <span>

                    <p className="date">{notification.timestamp}</p> <button onClick={() => handleMarkNotificationAsRead(notification)}>Mark as Read</button>
                    
                    </span>
                </div>

              </div>
              
            ))}
            </div>

          

            </div>
        )}

        </div>

        {(readNotifications.length > 0 || readDeliveredNotifications.length > 0 || readPickupNotification.length > 0 || readDeliveryNotification.length > 0 ) ? (
          <p className="recent older"><span></span>Older<span></span></p>

        ) : ('')}

        <div className="read">
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
            <div className="readnotificationa">

              <div className="delivered notifications">
            
              {readDeliveredNotifications.map((readdelivered) => (

                  <div className="container notification" key={readdelivered.id}>
                          <div className="left"> <CiDeliveryTruck className="icon"/></div>

              <div className="right">
                  <h4>Your order with ID: {readdelivered.orderRefId} has been Delivered </h4>
                  <p style={{ fontWeight: '500' }}>on {readdelivered.timestamp} </p>
                  <p>Use the live chat feature to reach us if you have any queries about this order</p>
                  <h5>Thank You!</h5>
                  <span>

                  <p className="date">{readdelivered.timestamp}</p> <button>Read</button>
                  
                  </span>
              </div>
              
                  </div>

              ))}
            </div>

            <div className="delivery notifications"> 
            {readDeliveryNotification.map((ReadforDelivery) => (

              <div className="notification" key={ReadforDelivery.id}>

                <div className="left"> <TbTruckDelivery  className="icon"/></div>

                <div className="right">
                    <h4>Your order with ID: {ReadforDelivery.orderRefId} is out for Delivery </h4>
                    <p>We will contact you soon for the drop-off.</p>
                    <span>

                    <p className="date">{ReadforDelivery.timestamp}</p> <button>Read</button>
                    
                    </span>
                </div>

              </div>
              
            ))}
            </div>

            <div className="pickup notifications"> 
            {readPickupNotification.map((ReadforPickup) => (

              <div className="notification" key={ReadforPickup.id}>

                <div className="left"> <LuPackage  className="icon"/></div>

                <div className="right">
                    <h4>Your order with ID: {ReadforPickup.orderRefId} is ready for Pickup </h4>
                    <p>We will contact you soon for the drop-off.</p>
                    <span>

                    <p className="date">{ReadforPickup.timestamp}</p> <button>Read</button>
                    
                    </span>
                </div>

              </div>
              
            ))}
            </div>

            <div className="notifications">
            {readNotifications.map((readNotification) => (

              <div className="notification" key={readNotification.id}>

                <div className="left"> <PiNotePencilLight className="icon"/></div>

                <div className="right">
                <h4>Your order with ID: {readNotification.orderRefId} has been confirmed </h4>
                    <p>Expected delivery for this item to {readNotification.state} is between {readNotification.formattedDate15DaysFromNow} and {readNotification.formattedDate20DaysFromNow}</p>
                    <p>Please note that delivery fees are paid for seperately</p>
                    <p>Use the live chat feature to inquire shipping fees</p>
                    <h5>To track your order please contact Evanis Interiors via Email</h5>
                    <span>

                    <p className="date">{readNotification.timestamp}</p> <button>Read</button>
                    
                    </span>
                </div>

              </div>
              
            ))}
            </div>

            </div>
        )}

        </div>

        {notifications.length === 0 && readNotifications.length === 0 && readyForPickup.length === 0 && readDeliveredNotifications.length === 0 && readyForDelivery.length === 0 && deliveredNotifications.length === 0 && readPickupNotification.length === 0 && readDeliveryNotification.length === 0 &&(
          <p className="no-notifications">Your notifications will show here</p>
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
      </div>
      
    </div>
  );
}

export default UserNotifications;
