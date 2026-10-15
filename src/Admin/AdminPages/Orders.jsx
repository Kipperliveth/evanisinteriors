import React, { useState, useEffect } from "react";
import AdminDashboard from "../AdminComponents/AdminDashboard";
import { txtdb } from "../../firebase-config";
import { collection, onSnapshot, getDocs, doc, setDoc, deleteDoc, addDoc, updateDoc } from "firebase/firestore";
import { MdCancel } from "react-icons/md";
import { FaCheckDouble, FaTruck, FaCheck } from "react-icons/fa";
import { CiSearch } from "react-icons/ci";
import emailjs from 'emailjs-com';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // --- PAGINATION STATE ---
  const [tablePage, setTablePage] = useState(1);
  const ORDERS_PER_PAGE = 15;

  // Helper to safely extract milliseconds for sorting newest to oldest
  const getTimeInMs = (dateVal) => {
    if (!dateVal) return 0;
    if (typeof dateVal.toDate === "function") return dateVal.toDate().getTime();
    const parsed = new Date(dateVal).getTime();
    return isNaN(parsed) ? 0 : parsed;
  };

  // New orders (Sorted newest to oldest by createdAt)
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(txtdb, "orders"),
      (snapshot) => {
        const ordersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        ordersList.sort((a, b) => getTimeInMs(b.createdAt) - getTimeInMs(a.createdAt));
        setOrders(ordersList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching orders:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Completed orders (Sorted newest to oldest by completionDate / createdAt)
  const [completedOrders, setCompletedOrders] = useState([]);
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(txtdb, "completed"), (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      ordersList.sort((a, b) => getTimeInMs(b.completionDate || b.createdAt) - getTimeInMs(a.completionDate || a.createdAt));
      setCompletedOrders(ordersList);
    });
    return () => unsubscribe(); 
  }, []);

  // Orders for pickup / Shipped (Sorted newest to oldest)
  const [readyForPickup, setReadyForPickup] = useState([]);
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(txtdb, "pendingPickup"), (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      ordersList.sort((a, b) => getTimeInMs(b.completionDate || b.createdAt) - getTimeInMs(a.completionDate || a.createdAt));
      setReadyForPickup(ordersList);
    });
    return () => unsubscribe(); 
  }, []);

  // Orders for deliveries / Pending Delivery (Sorted newest to oldest)
  const [readyForDelivery, setReadyForDelivery] = useState([]);
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(txtdb, "pendingDelivery"), (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      ordersList.sort((a, b) => getTimeInMs(b.completionDate || b.createdAt) - getTimeInMs(a.completionDate || a.createdAt));
      setReadyForDelivery(ordersList);
    });
    return () => unsubscribe(); 
  }, []);

  // Search States
  const [searchInput, setSearchInput] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  
  const [filterCompleted, setFilterCompleted] = useState([]);
  const [completedInput, setCompletedInput] = useState('');

  const [filterPendingPickup, setFilterPendingPickup] = useState([]);
  const [pendingPickupInput, setPendingPickupInput] = useState('');

  const [filterPendingDelivery, setFilterPendingDelivery] = useState([]);
  const [pendingDeliveryInput, setPendingDeliveryInput] = useState('');

  const [currentPage, setCurrentPage] = useState('first');

  const formatDate = (date) => {
    if (!date) return "";
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Search Logic (Maintains the newest-to-oldest order)
  useEffect(() => {
    const filtered = orders.filter(order => {
      const dateObj = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      const formattedDate = formatDate(dateObj);
      return order.id.toLowerCase().includes(searchInput.toLowerCase()) || 
             formattedDate.toLowerCase().includes(searchInput.toLowerCase());
    });
    setFilteredOrders(filtered);
  }, [searchInput, orders]);

  useEffect(() => {
    const filtered = completedOrders.filter(order => {
      const formattedDate = order.completionDate ? formatDate(new Date(order.completionDate)) : "";
      return order.id.toLowerCase().includes(completedInput.toLowerCase()) || 
             formattedDate.toLowerCase().includes(completedInput.toLowerCase());
    });
    setFilterCompleted(filtered);
  }, [completedInput, completedOrders]);

  useEffect(() => {
    const filtered = readyForPickup.filter(order => {
      const formattedDate = order.completionDate ? formatDate(new Date(order.completionDate)) : "";
      return order.id.toLowerCase().includes(pendingPickupInput.toLowerCase()) || 
             formattedDate.toLowerCase().includes(pendingPickupInput.toLowerCase());
    });
    setFilterPendingPickup(filtered);
  }, [pendingPickupInput, readyForPickup]);

  useEffect(() => {
    const filtered = readyForDelivery.filter(order => {
      const formattedDate = order.completionDate ? formatDate(new Date(order.completionDate)) : "";
      return order.id.toLowerCase().includes(pendingDeliveryInput.toLowerCase()) || 
             formattedDate.toLowerCase().includes(pendingDeliveryInput.toLowerCase());
    });
    setFilterPendingDelivery(filtered);
  }, [pendingDeliveryInput, readyForDelivery]);


  // Modal State
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

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [isModalOpen]);


  // Logic: Mark as Completed
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
        
        const orderData = collection(txtdb, `userNotifications/${userID}/deliveredOrders`);
        const orderDatadb = await getDocs(orderData);
        const orderDataArray = orderDatadb.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const selectedOrderId = selectedOrder.id;

        let foundDoc = null;
        for (let docItem of orderDataArray) {
            if (docItem.orderRefId === selectedOrderId) {
                foundDoc = docItem;
                break;
            }
        }

        if (!foundDoc) {
            console.log("No document found containing the matching order ID.");
            setIsLoggedIn(false);
            return;
        }

        const documentId = foundDoc.docRef;
        
        await deleteDoc(doc(txtdb, "pendingDelivery", selectedOrder.id)).then(() => {
          updateDoc(doc(txtdb, `userNotifications/${userID}/deliveredOrders/${documentId}`), {
            status: "Delivered",
            date: completedOrderData.completionDate,
            delivery: 'Delivered on'
          });
        }).finally(() => {
          addDoc(collection(txtdb, `userNotifications/${userID}/deliverynotifications`), {
            orderRefId: selectedOrderId,
            timestamp: completedOrderData.completionDate,
            userEmail: selectedOrder.userEmail,
            username: selectedOrder.username
          }).then(() => {
            emailjs.init("55KFb3ovp5zp-SlMq");

            let emailContent = ``;
            selectedOrder.cartItems.forEach((product) => {
              emailContent += `\n    - ${product.txtVal} (x${product.quantity})`;
            });

            const date = new Date();
            const formattedDate = date.toISOString().split('T')[0];
            const timestamp = formattedDate;
            
            emailjs.send("service_r60nfme", "template_todl238", {
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
            });

            addDoc(collection(txtdb, `userNotifications/${userID}/notificationCount`), {
              timestamp: timestamp
            });
          });
        });

        closeModal();
        setIsLoggedIn(false);
      } catch (error) {
        console.error("Error adding document: ", error);
        setIsLoggedIn(false);
      }
    }
  };

  // Logic: Mark as Ready to Deliver
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
        
        const orderData = collection(txtdb, `userNotifications/${userID}/deliveredOrders`);
        const orderDatadb = await getDocs(orderData);
        const orderDataArray = orderDatadb.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const selectedOrderId = selectedOrder.id;

        let foundDoc = null;
        for (let docItem of orderDataArray) {
            if (docItem.orderRefId === selectedOrderId) {
                foundDoc = docItem;
                break;
            }
        }

        if (!foundDoc) {
            console.log("No document found containing the matching order ID.");
            setIsLoggedIn(false);
            return;
        }

        const documentId = foundDoc.docRef;
        
        await deleteDoc(doc(txtdb, "pendingPickup", selectedOrder.id)).then(() => {
          updateDoc(doc(txtdb, `userNotifications/${userID}/deliveredOrders/${documentId}`), {
            status: "Ready for Delivery",
            date: completedOrderData.completionDate,
            delivery: 'Ready on'
          });
        }).finally(() => {
          addDoc(collection(txtdb, `userNotifications/${userID}/pendingDeliveryNotification`), {
            orderRefId: selectedOrderId,
            timestamp: completedOrderData.completionDate,
            userEmail: selectedOrder.userEmail,
            username: selectedOrder.username
          }).then(() => {
            emailjs.init("A7nlh5ZfZyzFdJHXR");

            let emailContent = ``;
            selectedOrder.cartItems.forEach((product) => {
              emailContent += `\n    - ${product.txtVal} (x${product.quantity})`;
            });

            const date = new Date();
            const formattedDate = date.toISOString().split('T')[0];
            const timestamp = formattedDate;
            
            emailjs.send("service_u30tu6h", "template_ztlhtio", {
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
              from_name: "Evanis Interiors",
              date: completedOrderData.completionDate,
            });

            addDoc(collection(txtdb, `userNotifications/${userID}/notificationCount`), {
              timestamp: timestamp
            });
          });
        });

        closeModal();
        setIsLoggedIn(false);
      } catch (error) {
        console.error("Error adding document: ", error);
        setIsLoggedIn(false);
      }
    }
  };

  // Logic: Mark as Shipped
  const markAsShipped = async () => {
    setIsLoggedIn(true);
    const userID = selectedOrder.userId;

    if (selectedOrder) {
      const completedOrderData = {
        ...selectedOrder,
        completionDate: new Date().toISOString()
      };

      try {
        await setDoc(doc(txtdb, "pendingPickup", selectedOrder.id), completedOrderData);
        
        const orderData = collection(txtdb, `userNotifications/${userID}/deliveredOrders`);
        const orderDatadb = await getDocs(orderData);
        const orderDataArray = orderDatadb.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const selectedOrderId = selectedOrder.id;

        let foundDoc = null;
        for (let docItem of orderDataArray) {
            if (docItem.orderRefId === selectedOrderId) {
                foundDoc = docItem;
                break;
            }
        }

        if (!foundDoc) {
            console.log("No document found containing the matching order ID.");
            setIsLoggedIn(false);
            return;
        }

        const documentId = foundDoc.docRef;
        
        await deleteDoc(doc(txtdb, "orders", selectedOrder.id)).then(() => {
          updateDoc(doc(txtdb, `userNotifications/${userID}/deliveredOrders/${documentId}`), {
            status: "Shipped",
            date: completedOrderData.completionDate,
            delivery: 'Shipped on'
          });
        }).finally(() => {
          addDoc(collection(txtdb, `userNotifications/${userID}/pendingPickupNotification`), {
            orderRefId: selectedOrderId,
            timestamp: completedOrderData.completionDate,
            userEmail: selectedOrder.userEmail,
            username: selectedOrder.username
          }).then(() => {
            emailjs.init("A7nlh5ZfZyzFdJHXR");

            let emailContent = ``;
            selectedOrder.cartItems.forEach((product) => {
              emailContent += `\n    - ${product.txtVal} (x ${product.quantity})`;
            });

            const date = new Date();
            const formattedDate = date.toISOString().split('T')[0];
            const timestamp = formattedDate;
            
            emailjs.send("service_u30tu6h", "template_5i66qbc", {
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
              from_name: "Evanis Interiors",
              date: completedOrderData.completionDate,
            });
            
            addDoc(collection(txtdb, `userNotifications/${userID}/notificationCount`), {
              timestamp: timestamp
            });
          });
        });

        closeModal();
        setIsLoggedIn(false);
      } catch (error) {
        console.error("Error adding document: ", error);
        setIsLoggedIn(false);
      }
    }
  };

  // Helper to render current input based on tab
  const getCurrentInput = () => {
    switch (currentPage) {
      case 'first': return searchInput;
      case 'fourth': return pendingPickupInput;
      case 'third': return pendingDeliveryInput;
      case 'second': return completedInput;
      default: return searchInput;
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setTablePage(1); // Reset pagination to page 1 on search
    switch (currentPage) {
      case 'first': setSearchInput(val); break;
      case 'fourth': setPendingPickupInput(val); break;
      case 'third': setPendingDeliveryInput(val); break;
      case 'second': setCompletedInput(val); break;
      default: setSearchInput(val);
    }
  };

  const handleTabSwitch = (tabName) => {
    setCurrentPage(tabName);
    setTablePage(1); // Reset pagination to page 1 on tab switch
  };

  const getCurrentData = () => {
    switch (currentPage) {
      case 'first': return { data: filteredOrders, label: "New Orders", emptyMsg: "No pending orders" };
      case 'fourth': return { data: filterPendingPickup, label: "Shipped Orders", emptyMsg: "No shipped orders" };
      case 'third': return { data: filterPendingDelivery, label: "Pending Delivery", emptyMsg: "No pending deliveries" };
      case 'second': return { data: filterCompleted, label: "Completed Orders", emptyMsg: "Completed orders will show here" };
      default: return { data: filteredOrders, label: "Orders", emptyMsg: "No orders found" };
    }
  };

  const activeTabDetails = getCurrentData();

  // --- PAGINATION SLICING ---
  const totalPages = Math.ceil(activeTabDetails.data.length / ORDERS_PER_PAGE);
  const paginatedOrders = activeTabDetails.data.slice(
    (tablePage - 1) * ORDERS_PER_PAGE,
    tablePage * ORDERS_PER_PAGE
  );

  // If deleting/moving an order leaves the current page empty, step back a page
  useEffect(() => {
    if (tablePage > totalPages && totalPages > 0) {
      setTablePage(totalPages);
    }
  }, [activeTabDetails.data.length, totalPages, tablePage]);

  useEffect(() => {
    if (!isModalOpen) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [tablePage, isModalOpen]);

  return (
    <div className="admin-layout-wrapper">
      <AdminDashboard />

      <div className="admin-page-content adminOrders">

        <div className="page-header">
          <div>
            <h1 className="page-title">Orders Management</h1>
            <p className="page-subtitle">Track, update, and manage customer orders across all stages.</p>
          </div>
        </div>

        {/* --- PREMIUM NAVIGATION CONTROLS --- */}
        <div className="inventory-controls">
          <div className="admin-search-bar">
            <CiSearch className="icon" />
            <input
              type="text"
              placeholder="Search by Order ID or Date..."
              value={getCurrentInput()}
              onChange={handleInputChange}
            />
          </div>

          <div className="admin-category-tabs">
            <button className={currentPage === 'first' ? 'tab active' : 'tab'} onClick={() => handleTabSwitch('first')}>
              New Orders {orders.length > 0 && <span className="badge">{orders.length}</span>}
            </button>
            <button className={currentPage === 'fourth' ? 'tab active' : 'tab'} onClick={() => handleTabSwitch('fourth')}>Shipped</button>
            <button className={currentPage === 'third' ? 'tab active' : 'tab'} onClick={() => handleTabSwitch('third')}>Pending Delivery</button>
            <button className={currentPage === 'second' ? 'tab active' : 'tab'} onClick={() => handleTabSwitch('second')}>Completed</button>
          </div>
        </div>


        {/* --- ORDER TABLE --- */}
        {loading ? (
          <div className="table-skeleton">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="skel-row"></div>)}
          </div>
        ) : (
          <>
            <div className="premium-data-table">
              <div className="table-header">
                <div className="col id-col">Order ID</div>
                <div className="col user-col">Customer</div>
                <div className="col price-col">Total</div>
                <div className="col date-col">Date</div>
                <div className="col action-col">Action</div>
              </div>

              {paginatedOrders.length === 0 ? (
                <div className="empty-state">{activeTabDetails.emptyMsg}</div>
              ) : (
                paginatedOrders.map(order => (
                  <div className="table-row" key={order.id} onClick={() => openModal(order)}>
                    <div className="col id-col">#{order.id.substring(0, 8)}...</div>
                    <div className="col user-col">{order.username}</div>
                    <div className="col price-col">₦{parseFloat(order.totalPrice).toLocaleString('en-US')}</div>
                    <div className="col date-col">
                      {currentPage === 'first' 
                        ? formatDate(order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt)) 
                        : (order.completionDate ? formatDate(new Date(order.completionDate)) : "N/A")}
                    </div>
                    <div className="col action-col">
                      <button className="view-btn">View</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* --- PAGINATION CONTROLS --- */}
            {totalPages > 1 && (
              <div className="pagination-wrapper">
                <button 
                  className="page-nav-btn" 
                  onClick={() => setTablePage(prev => Math.max(prev - 1, 1))}
                  disabled={tablePage === 1}
                >
                  Prev
                </button>
                
                <div className="page-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      className={`page-num-btn ${tablePage === pageNum ? "active" : ""}`}
                      onClick={() => setTablePage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button 
                  className="page-nav-btn" 
                  onClick={() => setTablePage(prev => Math.min(prev + 1, totalPages))}
                  disabled={tablePage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

      </div>

      {/* --- REDESIGNED ORDER MODAL --- */}
      {isModalOpen && selectedOrder && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="order-modal-content" onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header">
              <div className="header-text">
                <h2>Order Details</h2>
                <p>ID: #{selectedOrder.id}</p>
              </div>
              <MdCancel className="close-icon" onClick={closeModal} />
            </div>

            <div className="modal-body">
              
              <div className="status-banner">
                <div className="status-info">
                  <span className="label">Order Placed</span>
                  <span className="value">
                    {formatDate(selectedOrder.createdAt?.toDate ? selectedOrder.createdAt.toDate() : new Date(selectedOrder.createdAt))}
                  </span>
                </div>
                <div className="status-info">
                  <span className="label">Timeline</span>
                  <span className="value highlight">
                    <FaTruck className="inline-icon"/> {selectedOrder.formattedDate15DaysFromNow} - {selectedOrder.formattedDate20DaysFromNow}
                  </span>
                </div>
              </div>

              <div className="order-split-layout">
                {/* LEFT: CART ITEMS */}
                <div className="cart-section">
                  <h3 className="section-title">Items Ordered</h3>
                  <div className="cart-list">
                    {selectedOrder.cartItems.map((item, index) => (
                      <div className="cart-item" key={index}>
                        <img src={Array.isArray(item.imgUrl) ? item.imgUrl[0] : item.imgUrl} alt={item.txtVal} />
                        <div className="item-details">
                          <p className="item-name">{item.txtVal}</p>
                          <p className="item-meta">Color: {item.color} | Size: {item.size}</p>
                          <p className="item-meta">Qty: {item.quantity}</p>
                        </div>
                        <div className="item-price">
                          ₦{parseFloat(item.price).toLocaleString('en-US')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RIGHT: CUSTOMER & DELIVERY */}
                <div className="details-section">
                  <div className="detail-block">
                    <h3 className="section-title">Customer Profile</h3>
                    <p><strong>Name:</strong> {selectedOrder.username}</p>
                    <p><strong>Email:</strong> {selectedOrder.userEmail}</p>
                    <p><strong>Phone:</strong> {selectedOrder.callLine}</p>
                  </div>

                  <div className="detail-block">
                    <h3 className="section-title">Delivery Info</h3>
                    <p><strong>Method:</strong> {selectedOrder.shippingOption}</p>
                    <p><strong>Address:</strong> {selectedOrder.address}</p>
                    <p><strong>Location:</strong> {selectedOrder.city}, {selectedOrder.state}</p>
                  </div>

                  <div className="detail-block total-block">
                    <div className="price-row">
                      <span>Subtotal:</span>
                      <span>₦{parseFloat(selectedOrder.totalPrice).toLocaleString('en-US')}</span>
                    </div>
                    <div className="price-row">
                      <span>Delivery Fee:</span>
                      <span>₦{parseFloat(selectedOrder.deliveryFee || 0).toLocaleString('en-US')}</span>
                    </div>
                    <div className="price-row grand-total">
                      <span>Total Paid:</span>
                      <span>₦{parseFloat(Number(selectedOrder.totalPrice) + Number(selectedOrder.deliveryFee || 0)).toLocaleString('en-US')}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className="form-actions">
              <button className="cancel-btn" onClick={closeModal} disabled={isLoggedIn}>Close</button>
              
              {/* Dynamic Action Button based on Tab */}
              {currentPage === 'first' && (
                <button className="primary-btn action" onClick={markAsShipped} disabled={isLoggedIn}>
                  {isLoggedIn ? "Processing..." : "Mark as Shipped"} <FaCheck className="icon"/>
                </button>
              )}
              {currentPage === 'fourth' && (
                <button className="primary-btn action" onClick={markAsReadyToDeliver} disabled={isLoggedIn}>
                  {isLoggedIn ? "Processing..." : "Ready to Deliver"} <FaCheck className="icon"/>
                </button>
              )}
              {currentPage === 'third' && (
                <button className="primary-btn action" onClick={markAsCompleted} disabled={isLoggedIn}>
                  {isLoggedIn ? "Processing..." : "Mark as Delivered"} <FaCheckDouble className="icon"/>
                </button>
              )}
              {currentPage === 'second' && (
                <button className="primary-btn success" disabled>
                  Completed <FaCheckDouble className="icon"/>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Orders;