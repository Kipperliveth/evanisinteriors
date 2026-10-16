import React, { useState, useEffect } from "react";
import { doc, collection, onSnapshot } from "firebase/firestore";
import { auth, txtdb } from "../../firebase-config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate, NavLink } from "react-router-dom";
import UserNav from "../App-components/UserNav";
import { ImSpinner8 } from "react-icons/im";
import {
  FiPackage,
  FiBell,
  FiShoppingBag,
  FiShield,
  FiMapPin,
  FiLogOut,
  FiChevronRight,
  FiEdit2,
} from "react-icons/fi";

const QUICK_LINKS = [
  {
    to: "/myorders",
    label: "Order History",
    preview: "Track active shipments and view past order receipts",
    Icon: FiPackage,
  },
  {
    to: "/notifications",
    label: "Notifications",
    preview: "Delivery alerts, dispatch updates, and order confirmations",
    Icon: FiBell,
  },
  {
    to: "/store",
    label: "Browse Catalog",
    preview: "Explore bespoke furniture collections and saved pieces",
    Icon: FiShoppingBag,
  },
  {
    to: "/editprofile",
    label: "Address & Security",
    preview: "Update your default delivery address, phone number, and credentials",
    Icon: FiShield,
  },
];

function UserProfile() {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(true);

  const [addressData, setAddressData] = useState(() => {
    try {
      const cached = localStorage.getItem("addressData");
      return cached
        ? JSON.parse(cached)
        : { addressLine1: "", addressPhone: "", state: "", city: "" };
    } catch {
      return { addressLine1: "", addressPhone: "", state: "", city: "" };
    }
  });

  useEffect(() => {
    document.title = "My Account - Evanis Interiors";

    let unsubDoc = null;

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);

      if (unsubDoc) {
        unsubDoc();
        unsubDoc = null;
      }

      if (currentUser?.uid) {
        const userRef = doc(collection(txtdb, "users"), currentUser.uid);
        unsubDoc = onSnapshot(
          userRef,
          (userSnap) => {
            if (userSnap.exists()) {
              const userData = userSnap.data();
              const nextAddress = userData.address || {
                addressLine1: "",
                addressPhone: "",
                state: "",
                city: "",
              };
              setAddressData(nextAddress);
              localStorage.setItem("addressData", JSON.stringify(nextAddress));
            }
            setLoading(false);
          },
          (error) => {
            console.error("Error fetching user profile:", error);
            setLoading(false);
          }
        );
      } else {
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
      localStorage.clear();
      setIsLoggingOut(false);
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      setIsLoggingOut(false);
    }
  };

  const hasAddress = Boolean(addressData?.addressLine1?.trim());
  const displayName = user?.displayName || "Evanis Client";
  const userInitial = (displayName.trim()[0] || user?.email?.[0] || "E").toUpperCase();

  return (
    <div className="user-profile-wrapper">
      <UserNav />

      <div className="profile-page">
        <div className="profile-container page">
          
          {/* --- PAGE HEADER --- */}
          <div className="profile-header">
            <div>
              <h1>My Account</h1>
              <p className="profile-subtitle">
                Manage your profile, delivery address, and communication preferences.
              </p>
            </div>

            <button
              type="button"
              className="logout-btn"
              onClick={logout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <ImSpinner8 className="spinner" />
              ) : (
                <>
                  <FiLogOut />
                  <span>Log Out</span>
                </>
              )}
            </button>
          </div>

          {/* --- IDENTITY BAR --- */}
          {loading ? (
            <div className="profile-identity-row" aria-busy="true">
              <span className="profile-skeleton avatar" />
              <div className="identity-lines">
                <span className="profile-skeleton line-md" />
                <span className="profile-skeleton line-sm" />
              </div>
            </div>
          ) : (
            <div className="profile-identity-row">
              <div className="avatar-monogram" aria-hidden="true">
                {userInitial}
              </div>
              <div className="identity-main">
                <span className="identity-label">Signed in as</span>
                <h2 className="identity-name">{displayName}</h2>
                {user?.email && <span className="identity-email">{user.email}</span>}
              </div>
              <NavLink to="/editprofile" className="identity-edit-btn">
                <FiEdit2 />
                <span>Edit Profile</span>
              </NavLink>
            </div>
          )}

          {/* --- SECTION 1: WORKSPACE NAVIGATION --- */}
          <div className="profile-section">
            <h2 className="profile-section-title">Account & Orders</h2>
            <div className="profile-list">
              {QUICK_LINKS.map(({ to, label, preview, Icon }) => (
                <NavLink to={to} key={to} className="profile-row">
                  <span className="row-icon">
                    <Icon />
                  </span>
                  <span className="row-main">
                    <span className="row-title">{label}</span>
                    <span className="row-preview">{preview}</span>
                  </span>
                  <span className="row-end">
                    <FiChevronRight className="row-chevron" />
                  </span>
                </NavLink>
              ))}
            </div>
          </div>

          {/* --- SECTION 2: ADDRESS BOOK --- */}
          <div className="profile-section">
            <div className="section-title-row">
              <h2 className="profile-section-title">Address Book</h2>
              <NavLink to="/editprofile" className="section-action-link">
                {hasAddress ? "Edit Address" : "Add Address"}
                <FiChevronRight />
              </NavLink>
            </div>

            {loading ? (
              <div className="address-grid">
                <div className="address-col">
                  <span className="profile-skeleton line-sm" />
                  <span className="profile-skeleton line-lg" />
                  <span className="profile-skeleton line-md" />
                </div>
                <div className="address-col">
                  <span className="profile-skeleton line-sm" />
                  <span className="profile-skeleton line-md" />
                </div>
              </div>
            ) : !hasAddress ? (
              <div className="empty-address">
                <FiMapPin className="empty-icon" />
                <div className="empty-text">
                  <h3>No shipping address on file</h3>
                  <p>
                    Add a default delivery address to speed up checkout for your bespoke furniture orders.
                  </p>
                </div>
                <NavLink to="/editprofile" className="add-address-btn">
                  Add Address
                </NavLink>
              </div>
            ) : (
              <div className="address-grid">
                <div className="address-col">
                  <span className="address-label">Default Shipping Address</span>
                  <p className="address-line primary">{addressData.addressLine1}</p>
                  <p className="address-line">
                    {[addressData.city, addressData.state].filter(Boolean).join(", ")}
                  </p>
                  <p className="address-line muted">
                    {addressData.addressPhone || "No phone number provided"}
                  </p>
                </div>

                <div className="address-col">
                  <span className="address-label">Default Billing Address</span>
                  <p className="address-line muted">Same as default shipping address</p>
                </div>
              </div>
            )}
          </div>

          {/* --- SECTION 3: COMMUNICATIONS --- */}
          <div className="profile-section">
            <h2 className="profile-section-title">Communications</h2>
            <div className="pref-row">
              <div className="pref-main">
                <span className="pref-title">The Evanis Newsletter</span>
                <p className="pref-desc">
                  Receive curated interior insights, order notifications, and early access to new collections.
                </p>
              </div>

              <label className="editorial-switch" aria-label="Toggle newsletter subscription">
                <input
                  type="checkbox"
                  checked={isSubscribed}
                  onChange={() => setIsSubscribed(!isSubscribed)}
                />
                <span className="slider" />
              </label>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default UserProfile;