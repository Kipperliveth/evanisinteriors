import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from "../../firebase-config";
import { PuffLoader } from "react-spinners";

// UIDs that are allowed to access admin pages
const allowedUids = [
  "4Xmiw1Y1h3Ud2rMWLSt7iMzy0vt2",
  "CqhQfMc1LZdNCUgixbXpYT0SGaG2",
];

const AdminRoute = ({ children }) => {
  const [user, loading, error] = useAuthState(auth);

  if (loading) {
    // You can return a loading spinner or placeholder here
    return <div className="spinner-container">
          <PuffLoader color=" #888" size={25} />
    </div>;
  }

  if (error || !user || !allowedUids.includes(user.uid)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default AdminRoute;