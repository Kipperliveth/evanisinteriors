import React, { useState, useEffect, useRef } from "react";
import UserNav from "../App-components/UserNav";
import { collection, deleteDoc, doc, onSnapshot, getDocs, writeBatch } from "firebase/firestore";
import { txtdb, auth } from "../../firebase-config";
import { onAuthStateChanged } from "firebase/auth";
import { PiNotePencilLight } from "react-icons/pi";
import { CiDeliveryTruck } from "react-icons/ci";
import { LuPackage } from "react-icons/lu";
import { TbTruckDelivery } from "react-icons/tb";
import { FiBellOff, FiFilter, FiChevronDown, FiChevronRight, FiCheck, FiX } from "react-icons/fi";

// How each kind of notification looks
const TYPE_META = {
  confirmed: { label: "Order Confirmed", Icon: PiNotePencilLight },
  shipped: { label: "Shipped", Icon: LuPackage },
  delivery: { label: "Out for Delivery", Icon: TbTruckDelivery },
  delivered: { label: "Delivered", Icon: CiDeliveryTruck },
};

// Where each kind lives in Firestore: unread collection -> read collection
const SOURCES = [
  { type: "confirmed", unread: "inbox", read: "read" },
  { type: "shipped", unread: "pendingPickupNotification", read: "ReadPickupNotification" },
  { type: "delivery", unread: "pendingDeliveryNotification", read: "ReadDeliveryNotification" },
  { type: "delivered", unread: "deliverynotifications", read: "deliveredread" },
];

const VIEW_TABS = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "older", label: "Older" },
];

// Helper to safely parse dates for display and sorting
const parseTimestamp = (rawTimestamp) => {
  if (!rawTimestamp) return { formatted: "", rawMs: 0 };
  let dateObj;
  if (typeof rawTimestamp.toDate === "function") {
    dateObj = rawTimestamp.toDate();
  } else if (rawTimestamp instanceof Date) {
    dateObj = rawTimestamp;
  } else {
    dateObj = new Date(rawTimestamp);
  }
  const isValid = !isNaN(dateObj.getTime());
  return {
    formatted: isValid
      ? dateObj.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
      : String(rawTimestamp),
    rawMs: isValid ? dateObj.getTime() : 0,
  };
};

// Title, one-line preview and full body for each notification
const getContent = (item) => {
  const ref = <span className="order-ref">#{item.orderRefId}</span>;

  switch (item.notifType) {
    case "delivered":
      return {
        title: <>Your order {ref} has been delivered</>,
        preview: `Delivered on ${item.timestamp}`,
        body: (
          <p>
            Delivered on <strong>{item.timestamp}</strong>. Use the live chat feature to reach us if you have any
            questions about your order. Thank you for shopping with Evanis Interiors!
          </p>
        ),
      };
    case "delivery":
      return {
        title: <>Your order {ref} is ready for delivery</>,
        preview: "Our dispatch team will contact you shortly.",
        body: <p>Our dispatch team will contact you shortly to coordinate the drop-off.</p>,
      };
    case "shipped":
      return {
        title: <>Your order {ref} has been shipped</>,
        preview: "Your items are in transit.",
        body: <p>Your items are in transit. We will notify you as soon as your order is out for local delivery.</p>,
      };
    default: {
      const hasEstimate = item.state && item.formattedDate15DaysFromNow;
      return {
        title: <>Your order {ref} has been confirmed</>,
        preview: hasEstimate
          ? `Estimated delivery to ${item.state}: ${item.formattedDate15DaysFromNow} to ${item.formattedDate20DaysFromNow}`
          : "Tap to see the details.",
        body: (
          <>
            {hasEstimate && (
              <p>
                Estimated delivery to <strong>{item.state}</strong> is between{" "}
                <strong>{item.formattedDate15DaysFromNow}</strong> and{" "}
                <strong>{item.formattedDate20DaysFromNow}</strong>.
              </p>
            )}
            <p className="note-box">
              Please note that delivery fees are handled separately. Use the live chat feature or contact us via
              email to inquire about shipping rates and order tracking.
            </p>
          </>
        ),
      };
    }
  }
};

function UserNotifications() {
  // { "confirmed:unread": [...], "confirmed:read": [...], ... }
  const [lists, setLists] = useState({});
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [viewFilter, setViewFilter] = useState("all"); // all | new | older
  const [typeFilter, setTypeFilter] = useState("all"); // all | confirmed | shipped | delivery | delivered
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selected, setSelected] = useState(null); // the notification that is open

  const filterRef = useRef(null);
  const seenSources = useRef(new Set());
  const markingIds = useRef(new Set());

  useEffect(() => {
    document.title = "Notifications - Evanis Interiors";
    const unsubscribe = onAuthStateChanged(auth, (currentUserObj) => {
      setUser(currentUserObj);
      if (!currentUserObj) setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Clear notification badge counter once when user loads the page
  useEffect(() => {
    if (!user?.uid) return;
    const deleteAllNotifications = async () => {
      const notificationCollectionRef = collection(txtdb, `userNotifications/${user.uid}/notificationCount`);
      try {
        const querySnapshot = await getDocs(notificationCollectionRef);
        querySnapshot.forEach((docSnap) => {
          deleteDoc(docSnap.ref);
        });
      } catch (error) {
        console.error("Error clearing notification count:", error);
      }
    };
    deleteAllNotifications();
  }, [user?.uid]);

  // Listen to all 8 collections (4 types x unread/read)
  useEffect(() => {
    if (!user?.uid) return;

    seenSources.current = new Set();
    const totalSources = SOURCES.length * 2;
    const unsubscribers = [];

    const markLoaded = (key) => {
      seenSources.current.add(key);
      if (seenSources.current.size === totalSources) setIsLoading(false);
    };

    SOURCES.forEach(({ type, unread, read }) => {
      [[unread, false], [read, true]].forEach(([collectionName, isRead]) => {
        const key = `${type}:${isRead ? "read" : "unread"}`;
        const unsubscribe = onSnapshot(
          collection(txtdb, `userNotifications/${user.uid}/${collectionName}`),
          (snapshot) => {
            const list = snapshot.docs.map((docSnap) => {
              const raw = docSnap.data();
              const { formatted, rawMs } = parseTimestamp(raw.timestamp);
              return { id: docSnap.id, ...raw, raw, timestamp: formatted, rawMs, notifType: type, isRead };
            });
            setLists((prev) => ({ ...prev, [key]: list }));
            markLoaded(key);
          },
          (error) => {
            console.error(`Error loading ${collectionName}:`, error);
            markLoaded(key);
          }
        );
        unsubscribers.push(unsubscribe);
      });
    });

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [user?.uid]);

  // Close the type menu when clicking elsewhere
  useEffect(() => {
    if (!isFilterOpen) return;
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setIsFilterOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFilterOpen]);

  // Escape closes whatever is open, and the page doesn't scroll behind an open message
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key !== "Escape") return;
      setSelected(null);
      setIsFilterOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = selected ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [selected]);

  // Move a notification from its unread collection to its read collection (same document id)
  const markAsRead = async (item) => {
    if (!user?.uid || item.isRead || markingIds.current.has(item.id)) return;
    const source = SOURCES.find((s) => s.type === item.notifType);
    if (!source) return;

    markingIds.current.add(item.id);
    try {
      const batch = writeBatch(txtdb);
      batch.set(doc(txtdb, `userNotifications/${user.uid}/${source.read}`, item.id), item.raw);
      batch.delete(doc(txtdb, `userNotifications/${user.uid}/${source.unread}`, item.id));
      await batch.commit();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    } finally {
      markingIds.current.delete(item.id);
    }
  };

  // Opening a message marks it as read; it then drops into "Older" behind the open message
  const openNotification = (item) => {
    setSelected(item);
    markAsRead(item);
  };

  // --- FILTERING ---
  const allItems = Object.values(lists).flat();

  const matchesType = (item, type) => type === "all" || item.notifType === type;
  const matchesView = (item, view) => view === "all" || (view === "new" ? !item.isRead : item.isRead);

  const viewCount = (view) => allItems.filter((i) => matchesType(i, typeFilter) && matchesView(i, view)).length;
  const typeCount = (type) => allItems.filter((i) => matchesType(i, type) && matchesView(i, viewFilter)).length;

  const visible = allItems
    .filter((i) => matchesType(i, typeFilter) && matchesView(i, viewFilter))
    .sort((a, b) => b.rawMs - a.rawMs);

  const newItems = visible.filter((i) => !i.isRead);
  const olderItems = visible.filter((i) => i.isRead);
  const totalNew = allItems.filter((i) => !i.isRead).length;

  const typeOptions = [["all", "All Types"], ...Object.entries(TYPE_META).map(([key, meta]) => [key, meta.label])];

  const emptyText = {
    all: "You're all caught up! Order updates and delivery alerts will appear here.",
    new: "You have no new notifications.",
    older: "Notifications you've opened will show up here.",
  }[viewFilter];

  // --- ONE ROW ---
  const renderRow = (item) => {
    const { Icon, label } = TYPE_META[item.notifType];
    const { title, preview } = getContent(item);

    return (
      <button
        type="button"
        key={`${item.notifType}-${item.id}`}
        className={`notif-row ${item.notifType} ${item.isRead ? "read" : "unread"}`}
        onClick={() => openNotification(item)}
      >
        <span className="row-icon"><Icon /></span>

        <span className="row-main">
          <span className="row-top">
            <span className="row-status">{label}</span>
            <span className="row-date">{item.timestamp}</span>
          </span>
          <span className="row-title">{title}</span>
          <span className="row-preview">{preview}</span>
        </span>

        <span className="row-end">
          {!item.isRead && <span className="unread-dot" aria-label="New" />}
          <FiChevronRight className="row-chevron" />
        </span>
      </button>
    );
  };

  const selectedMeta = selected ? TYPE_META[selected.notifType] : null;
  const selectedContent = selected ? getContent(selected) : null;

  return (
    <div className="user-notifications-wrapper">
      <UserNav />

      <div className="notification-page">
        <div className="notification-container page">

          {/* --- PAGE HEADER --- */}
          <div className="notif-header">
            <div>
              <h1>Notifications</h1>
              <p className="notif-subtitle">Real-time updates on your orders and deliveries.</p>
            </div>
            {totalNew > 0 && (
              <span className="new-count"><span className="dot" /> {totalNew} new</span>
            )}
          </div>

          {/* --- TABS + TYPE FILTER --- */}
          <div className="notif-controls">
            <div className="notif-tabs">
              {VIEW_TABS.map((tab) => (
                <button
                  key={tab.value}
                  className={viewFilter === tab.value ? "notif-tab active" : "notif-tab"}
                  onClick={() => setViewFilter(tab.value)}
                >
                  {tab.label}
                  <span className="count">{viewCount(tab.value)}</span>
                </button>
              ))}
            </div>

            <div className="notif-filter" ref={filterRef}>
              <button
                type="button"
                className={`notif-filter-btn ${typeFilter !== "all" ? "active" : ""} ${isFilterOpen ? "open" : ""}`}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                aria-haspopup="listbox"
                aria-expanded={isFilterOpen}
              >
                <FiFilter />
                <span>{typeFilter === "all" ? "Type" : TYPE_META[typeFilter].label}</span>
                <FiChevronDown className="chevron" />
              </button>

              {isFilterOpen && (
                <div className="notif-filter-menu" role="listbox">
                  <div className="menu-title">Filter by type</div>
                  {typeOptions.map(([value, label]) => {
                    const isSelected = typeFilter === value;
                    const count = typeCount(value);
                    return (
                      <button
                        type="button"
                        key={value}
                        role="option"
                        aria-selected={isSelected}
                        className={`menu-item ${isSelected ? "selected" : ""} ${count === 0 && !isSelected ? "empty" : ""}`}
                        onClick={() => {
                          setTypeFilter(value);
                          setIsFilterOpen(false);
                        }}
                      >
                        <span className="menu-label">
                          <FiCheck className="menu-check" />
                          {label}
                        </span>
                        <span className="menu-count">{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* --- LIST --- */}
          {isLoading ? (
            <div className="notif-list" aria-busy="true">
              {[1, 2, 3, 4, 5].map((n) => (
                <div className="notif-skeleton-row" key={n}>
                  <span className="notif-skeleton icon" />
                  <div className="lines">
                    <span className="notif-skeleton line-sm" />
                    <span className="notif-skeleton line-lg" />
                    <span className="notif-skeleton line-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="empty-notifications">
              <FiBellOff className="empty-icon" />
              <h3>No notifications here</h3>
              <p>{emptyText}</p>
            </div>
          ) : viewFilter === "all" ? (
            <>
              {newItems.length > 0 && (
                <div className="notif-section">
                  <h2 className="notif-section-title">New</h2>
                  <div className="notif-list">{newItems.map(renderRow)}</div>
                </div>
              )}
              {olderItems.length > 0 && (
                <div className="notif-section">
                  <h2 className="notif-section-title">Older</h2>
                  <div className="notif-list">{olderItems.map(renderRow)}</div>
                </div>
              )}
            </>
          ) : (
            <div className="notif-list">{visible.map(renderRow)}</div>
          )}

        </div>

        {/* --- OPEN MESSAGE --- */}
        {selected && (
          <div className="notif-modal-overlay" onClick={() => setSelected(null)}>
            <div
              className={`notif-modal ${selected.notifType}`}
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="notif-modal-header">
                <span className="modal-status">
                  <selectedMeta.Icon className="modal-icon" />
                  {selectedMeta.label}
                </span>
                <button type="button" className="modal-close" onClick={() => setSelected(null)} aria-label="Close">
                  <FiX />
                </button>
              </div>

              <div className="notif-modal-body">
                <span className="modal-date">{selected.timestamp}</span>
                <h2>{selectedContent.title}</h2>
                {selectedContent.body}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserNotifications;