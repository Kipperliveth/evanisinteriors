import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from "../../firebase-config";
import { PuffLoader } from "react-spinners";

const AdminRoute = ({ children }) => {
  const [user, loading, error] = useAuthState(auth);
  const allowedUid = "4Xmiw1Y1h3Ud2rMWLSt7iMzy0vt2";  // Define the allowed UID here

  if (loading) {
    // You can return a loading spinner or placeholder here
    return <div className="spinner-container">
          <PuffLoader color=" #888" size={25} />
    </div>;
  }

  if (error || !user || user.uid !== allowedUid) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default AdminRoute;
