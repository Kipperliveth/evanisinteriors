import React, { useState, useEffect, useRef } from "react";
import UserNav from "../App-components/UserNav";
import { txtdb, auth } from "../../firebase-config";
import { collection, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { PiNotePencilLight } from "react-icons/pi";
import { CiDeliveryTruck } from "react-icons/ci";
import { LuPackage } from "react-icons/lu";
import { TbTruckDelivery } from "react-icons/tb";
import {
  FiShoppingBag,
  FiFilter,
  FiChevronDown,
  FiChevronRight,
  FiCheck,
  FiX,
} from "react-icons/fi";

// Visual metadata matching UserNotifications
const STATUS_META = {
  pending: { label: "Order Confirmed", Icon: PiNotePencilLight },
  shipped: { label: "Shipped", Icon: LuPackage },
  ready: { label: "Ready for Delivery", Icon: TbTruckDelivery },
  delivered: { label: "Delivered", Icon: CiDeliveryTruck },
};

const VIEW_TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "In Progress" },
  { value: "completed", label: "Delivered" },
];

// Normalize Firestore status strings into our 4 keys
const normalizeStatus = (rawStatus) => {
  const s = String(rawStatus || "").toLowerCase().trim();
  if (s.includes("deliver") && !s.includes("ready")) return "delivered";
  if (s.includes("ready")) return "ready";
  if (s.includes("ship")) return "shipped";
  return "pending";
};

// Safely parse dates for display and sorting
const parseDate = (rawDate) => {
  if (!rawDate) return { formatted: "", rawMs: 0 };
  let dateObj;
  if (typeof rawDate.toDate === "function") {
    dateObj = rawDate.toDate();
  } else if (rawDate instanceof Date) {
    dateObj = rawDate;
  } else {
    dateObj = new Date(rawDate);
  }
  const isValid = !isNaN(dateObj.getTime());
  return {
    formatted: isValid
      ? dateObj.toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "",
    rawMs: isValid ? dateObj.getTime() : 0,
  };
};

// Format currency safely
const formatNaira = (val) => {
  const num = parseFloat(val);
  return isNaN(num) ? "0" : num.toLocaleString("en-US");
};

function Myorders() {
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [viewFilter, setViewFilter] = useState("all"); // all | active | completed
  const [statusFilter, setStatusFilter] = useState("all"); // all | pending | shipped | ready | delivered
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filterRef = useRef(null);

  useEffect(() => {
    document.title = "My Orders - Evanis Interiors";
    const unsubscribe = onAuthStateChanged(auth, (currentUserObj) => {
      setUser(currentUserObj);
      if (!currentUserObj) setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Real-time listener for user's orders
  useEffect(() => {
    if (!user?.uid) return;

    const ordersRef = collection(txtdb, `userNotifications/${user.uid}/deliveredOrders`);
    const unsubscribe = onSnapshot(
      ordersRef,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const statusKey = normalizeStatus(data.status || data.satus);
          const { formatted, rawMs } = parseDate(data.date || data.completionDate || data.createdAt);
          const items = Array.isArray(data.cartItems)
            ? data.cartItems
            : Array.isArray(data.cart)
            ? data.cart
            : [];

          return {
            id: docSnap.id,
            ...data,
            cartItems: items,
            statusKey,
            formattedDate: formatted,
            rawMs,
            isCompleted: statusKey === "delivered",
          };
        });

        // Sort newest to oldest
        list.sort((a, b) => b.rawMs - a.rawMs);
        setOrders(list);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching orders:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Close dropdown filter when clicking outside
  useEffect(() => {
    if (!isFilterOpen) return;
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFilterOpen]);

  // Escape key closes modal or dropdown
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key !== "Escape") return;
      setSelectedOrder(null);
      setIsFilterOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Lock body scroll when order modal is open
  useEffect(() => {
    document.body.style.overflow = selectedOrder ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [selectedOrder]);

  // --- FILTERING LOGIC ---
  const matchesStatus = (order, status) => status === "all" || order.statusKey === status;
  const matchesView = (order, view) =>
    view === "all" || (view === "active" ? !order.isCompleted : order.isCompleted);

  const viewCount = (view) =>
    orders.filter((o) => matchesStatus(o, statusFilter) && matchesView(o, view)).length;
  const statusCount = (status) =>
    orders.filter((o) => matchesStatus(o, status) && matchesView(o, viewFilter)).length;

  const visibleOrders = orders.filter(
    (o) => matchesStatus(o, statusFilter) && matchesView(o, viewFilter)
  );

  const activeOrders = visibleOrders.filter((o) => !o.isCompleted);
  const completedOrders = visibleOrders.filter((o) => o.isCompleted);
  const totalActive = orders.filter((o) => !o.isCompleted).length;

  const statusOptions = [
    ["all", "All Statuses"],
    ...Object.entries(STATUS_META).map(([key, meta]) => [key, meta.label]),
  ];

  const emptyText = {
    all: "You haven't placed any orders yet. Once you checkout, your orders will appear here.",
    active: "You have no active orders in transit right now.",
    completed: "Orders that have been delivered to you will show up here.",
  }[viewFilter];

  // Helper to build a clean one-line item summary
  const getOrderPreview = (order) => {
    const items = order.cartItems || [];
    if (items.length === 0) return "No items listed";
    const firstItem = items[0]?.txtVal || "Item";
    const remaining = items.length - 1;
    const itemSummary = remaining > 0 ? `${firstItem} + ${remaining} more` : firstItem;
    return `${itemSummary} · ₦${formatNaira(order.totalPrice)}`;
  };

  // --- RENDER ONE ORDER ROW ---
  const renderRow = (order) => {
    const { Icon, label } = STATUS_META[order.statusKey];
    const itemCount = order.cartItems?.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0) || order.cartItems?.length || 0;

    return (
      <button
        type="button"
        key={order.id}
        className={`order-row ${order.statusKey} ${order.isCompleted ? "completed" : "active"}`}
        onClick={() => setSelectedOrder(order)}
      >
        <span className="row-icon">
          <Icon />
        </span>

        <span className="row-main">
          <span className="row-top">
            <span className="row-status">{label}</span>
            <span className="row-date">
              {order.delivery ? `${order.delivery} ` : ""}
              {order.formattedDate}
            </span>
          </span>

          <span className="row-title">
            Order <span className="order-ref">#{order.orderRefId}</span>
            <span className="item-count-inline">
              ({itemCount} {itemCount === 1 ? "item" : "items"})
            </span>
          </span>

          <span className="row-preview">{getOrderPreview(order)}</span>
        </span>

        <span className="row-end">
          {!order.isCompleted && <span className="active-dot" aria-label="In progress" />}
          <FiChevronRight className="row-chevron" />
        </span>
      </button>
    );
  };

  const selectedMeta = selectedOrder ? STATUS_META[selectedOrder.statusKey] : null;

  return (
    <div className="user-orders-wrapper">
      <UserNav />

      <div className="myorders-page">
        <div className="orders-container page">
          
          {/* --- PAGE HEADER --- */}
          <div className="orders-header">
            <div>
              <h1>My Orders</h1>
              <p className="orders-subtitle">Track active shipments and view past order receipts.</p>
            </div>
            {totalActive > 0 && (
              <span className="active-count">
                <span className="dot" /> {totalActive} in progress
              </span>
            )}
          </div>

          {/* --- TABS + STATUS FILTER --- */}
          <div className="orders-controls">
            <div className="orders-tabs">
              {VIEW_TABS.map((tab) => (
                <button
                  key={tab.value}
                  className={viewFilter === tab.value ? "orders-tab active" : "orders-tab"}
                  onClick={() => setViewFilter(tab.value)}
                >
                  {tab.label}
                  <span className="count">{viewCount(tab.value)}</span>
                </button>
              ))}
            </div>

            <div className="orders-filter" ref={filterRef}>
              <button
                type="button"
                className={`orders-filter-btn ${statusFilter !== "all" ? "active" : ""} ${
                  isFilterOpen ? "open" : ""
                }`}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                aria-haspopup="listbox"
                aria-expanded={isFilterOpen}
              >
                <FiFilter />
                <span>{statusFilter === "all" ? "Status" : STATUS_META[statusFilter].label}</span>
                <FiChevronDown className="chevron" />
              </button>

              {isFilterOpen && (
                <div className="orders-filter-menu" role="listbox">
                  <div className="menu-title">Filter by status</div>
                  {statusOptions.map(([value, label]) => {
                    const isSelected = statusFilter === value;
                    const count = statusCount(value);
                    return (
                      <button
                        type="button"
                        key={value}
                        role="option"
                        aria-selected={isSelected}
                        className={`menu-item ${isSelected ? "selected" : ""} ${
                          count === 0 && !isSelected ? "empty" : ""
                        }`}
                        onClick={() => {
                          setStatusFilter(value);
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

          {/* --- ORDERS LIST --- */}
          {isLoading ? (
            <div className="orders-list" aria-busy="true">
              {[1, 2, 3, 4, 5].map((n) => (
                <div className="order-skeleton-row" key={n}>
                  <span className="order-skeleton icon" />
                  <div className="lines">
                    <span className="order-skeleton line-sm" />
                    <span className="order-skeleton line-lg" />
                    <span className="order-skeleton line-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : visibleOrders.length === 0 ? (
            <div className="empty-orders">
              <FiShoppingBag className="empty-icon" />
              <h3>No orders found</h3>
              <p>{emptyText}</p>
            </div>
          ) : viewFilter === "all" ? (
            <>
              {activeOrders.length > 0 && (
                <div className="orders-section">
                  <h2 className="orders-section-title">In Progress</h2>
                  <div className="orders-list">{activeOrders.map(renderRow)}</div>
                </div>
              )}
              {completedOrders.length > 0 && (
                <div className="orders-section">
                  <h2 className="orders-section-title">Delivered</h2>
                  <div className="orders-list">{completedOrders.map(renderRow)}</div>
                </div>
              )}
            </>
          ) : (
            <div className="orders-list">{visibleOrders.map(renderRow)}</div>
          )}

        </div>

        {/* --- ORDER RECEIPT MODAL --- */}
        {selectedOrder && (
          <div className="order-modal-overlay" onClick={() => setSelectedOrder(null)}>
            <div
              className={`order-modal ${selectedOrder.statusKey}`}
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="order-modal-header">
                <span className="modal-status">
                  <selectedMeta.Icon className="modal-icon" />
                  {selectedMeta.label}
                </span>
                <button
                  type="button"
                  className="modal-close"
                  onClick={() => setSelectedOrder(null)}
                  aria-label="Close"
                >
                  <FiX />
                </button>
              </div>

              {/* Modal Body */}
              <div className="order-modal-body">
                
                {/* Top Summary */}
                <div className="modal-top-meta">
                  <span className="modal-date">
                    {selectedOrder.delivery ? `${selectedOrder.delivery}: ` : "Updated: "}
                    <strong>{selectedOrder.formattedDate || "Pending"}</strong>
                  </span>
                  <h2>
                    Order <span className="order-ref">#{selectedOrder.orderRefId}</span>
                  </h2>
                  {selectedOrder.formattedDate15DaysFromNow &&
                    selectedOrder.formattedDate20DaysFromNow &&
                    !selectedOrder.isCompleted && (
                      <p className="delivery-window-note">
                        Estimated delivery between{" "}
                        <strong>{selectedOrder.formattedDate15DaysFromNow}</strong> and{" "}
                        <strong>{selectedOrder.formattedDate20DaysFromNow}</strong>.
                      </p>
                    )}
                </div>

                {/* Items List */}
                <div className="modal-section">
                  <h3 className="modal-section-title">
                    Items ({selectedOrder.cartItems?.length || 0})
                  </h3>
                  <div className="modal-items-list">
                    {selectedOrder.cartItems?.map((item, index) => (
                      <div className="modal-cart-item" key={index}>
                        <img
                          src={Array.isArray(item.imgUrl) ? item.imgUrl[0] : item.imgUrl}
                          alt={item.txtVal}
                        />
                        <div className="item-info">
                          <span className="item-name">{item.txtVal}</span>
                          <span className="item-variants">
                            {[item.color, item.size].filter(Boolean).join(" · ")}
                          </span>
                          <span className="item-qty">Qty: {item.quantity}</span>
                        </div>
                        <div className="item-price">₦{formatNaira(item.price)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery & Payment Split */}
                <div className="modal-split-details">
                  <div className="detail-col">
                    <h3 className="modal-section-title">Delivery Details</h3>
                    <p className="detail-line">
                      <strong>Address:</strong> {selectedOrder.address || selectedOrder.addresss || "N/A"}
                    </p>
                    <p className="detail-line">
                      <strong>Method:</strong>{" "}
                      {[selectedOrder.shippingOption, selectedOrder.state].filter(Boolean).join(" / ")}
                    </p>
                    {selectedOrder.callLine && (
                      <p className="detail-line">
                        <strong>Phone:</strong> {selectedOrder.callLine}
                      </p>
                    )}
                  </div>

                  <div className="detail-col">
                    <h3 className="modal-section-title">Payment Summary</h3>
                    <div className="summary-row">
                      <span>Items Subtotal</span>
                      <span>₦{formatNaira(selectedOrder.totalPrice)}</span>
                    </div>
                    <div className="summary-row total">
                      <span>Amount Paid</span>
                      <span>₦{formatNaira(selectedOrder.totalPrice)}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Myorders;