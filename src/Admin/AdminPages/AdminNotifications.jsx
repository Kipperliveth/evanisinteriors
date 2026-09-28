import React, { useState, useEffect } from "react";
import AdminDashboard from "../AdminComponents/AdminDashboard";
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc } from "firebase/firestore";
import { txtdb } from "../../firebase-config";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase-config";
import { PiNotePencilLight } from "react-icons/pi";
import { BsCircleFill } from "react-icons/bs";

function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [readNotifications, setReadNotifications] = useState([]);

  useEffect(() => {
    document.title = "Notifications - Admin";
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Unread Notifications
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(txtdb, "notifications"),
      orderBy("timestamp", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = snapshot.docs.map((doc) => {
        let timestamp = doc.data().timestamp instanceof Date ? doc.data().timestamp : new Date(doc.data().timestamp);
        return {
          id: doc.id,
          ...doc.data(),
          timestamp: timestamp.toLocaleString([], {
            day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
          }),
        };
      });
      setNotifications(newNotifications);
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch Read Notifications
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(txtdb, `ReadAdminNotifications`),
      orderBy("timestamp", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newwNotifications = snapshot.docs.map((doc) => {
        let timestamp = doc.data().timestamp instanceof Date ? doc.data().timestamp : new Date(doc.data().timestamp);
        return {
          id: doc.id,
          ...doc.data(),
          timestamp: timestamp.toLocaleString([], {
            day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
          }),
        };
      });
      setReadNotifications(newwNotifications);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // ==========================================
  // BACKGROUND AUTO-MARKER
  // ==========================================
  useEffect(() => {
    // If there are no unread notifications, do nothing
    if (notifications.length === 0) return;

    // Set a 3.5 second delay so the admin can actually see what is "New" before it moves
    const timer = setTimeout(() => {
      notifications.forEach(async (notification) => {
        try {
          const readNotificationData = {
            orderRefId: notification.orderRefId,
            username: notification.username,
            userEmail: notification.userEmail,
            timestamp: notification.timestamp
          };

          if (notification.state) readNotificationData.state = notification.state;
          if (notification.formattedDate15DaysFromNow) readNotificationData.formattedDate15DaysFromNow = notification.formattedDate15DaysFromNow;
          if (notification.formattedDate20DaysFromNow) readNotificationData.formattedDate20DaysFromNow = notification.formattedDate20DaysFromNow;

          // Copy to Read database
          await addDoc(collection(txtdb, `ReadAdminNotifications`), readNotificationData);
          // Delete from Unread database
          await deleteDoc(doc(collection(txtdb, `notifications`), notification.id));
        } catch (error) {
          console.error("Error auto-marking notification:", error);
        }
      });
    }, 3500);

    // Cleanup timer if the component unmounts or data shifts mid-timer
    return () => clearTimeout(timer);
  }, [notifications]);

  return (
    <div className="admin-layout-wrapper">
      <AdminDashboard />

      <div className="admin-page-content">
        
        <div className="page-header">
          <div>
            <h1 className="page-title">Notifications</h1>
            <p className="page-subtitle">You have {notifications.length} unread alerts.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="notifications-skeleton">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="notif-skeleton-card"></div>
            ))}
          </div>
        ) : (
          <div className="notifications-list">

            {/* UNREAD NOTIFICATIONS */}
            {notifications.length > 0 && (
              <>
                <h3 className="section-divider">New</h3>
                {notifications.map((notification) => (
                  <div key={notification.id} className="notification-card unread">
                    <div className="notif-left">
                      <BsCircleFill className="unread-dot" />
                      <div className="notif-details">
                        <h4>New Order Request <span>#{notification.orderRefId?.slice(0, 8)}</span></h4>
                        <p>
                          <span className="customer-name">{notification.username || notification.userEmail}</span> has requested a delivery quote. Please review and contact the customer.
                        </p>
                        <span className="timestamp">{notification.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* READ NOTIFICATIONS */}
            {readNotifications.length > 0 && (
              <>
                <h3 className="section-divider">Older</h3>
                {readNotifications.map((readNotification) => (
                  <div key={readNotification.id} className="notification-card read">
                    <div className="notif-left">
                      <PiNotePencilLight className="read-icon" />
                      <div className="notif-details">
                        <h4>Order Request Processed <span>#{readNotification.orderRefId?.slice(0, 8)}</span></h4>
                        <p>
                          Quote request from <span className="customer-name">{readNotification.username || readNotification.userEmail}</span>.
                        </p>
                        <span className="timestamp">{readNotification.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {notifications.length === 0 && readNotifications.length === 0 && (
              <div className="empty-state">
                <p>You're all caught up! No new notifications.</p>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

export default AdminNotifications;