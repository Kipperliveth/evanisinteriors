import React, { useState, useEffect } from "react";
import AdminDashboard from "../AdminComponents/AdminDashboard";
import { ImSpinner8 } from "react-icons/im";
import { auth } from "../../firebase-config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function Adminlog() {
  const navigate = useNavigate();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState(null);

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="adminHome">
      <AdminDashboard />

      <div className="adminHome-content adminContent adminlog">
        <div className="logout-minimal">
          <span className="eyebrow">Admin Session</span>
          <h3>Sign out of your account</h3>
          <p className="subtitle">
            Currently signed in as{" "}
            <span className="email">{user?.email || "Administrator"}</span>
          </p>

          <div className="actions">
            <button
              className="btn-primary"
              onClick={logout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <ImSpinner8 className="login-spinner" />
              ) : (
                "Sign Out"
              )}
            </button>

            <button
              className="btn-secondary"
              onClick={() => navigate(-1)}
              disabled={isLoggingOut}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Adminlog;