import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from "../../firebase-config";

const AdminRoute = ({ children }) => {
  const [user, loading, error] = useAuthState(auth);
  const allowedUid = "CqhQfMc1LZdNCUgixbXpYT0SGaG2";  // Define the allowed UID here

  if (loading || error || !user || user.uid !== allowedUid) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default AdminRoute;
