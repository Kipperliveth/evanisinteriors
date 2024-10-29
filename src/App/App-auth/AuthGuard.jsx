import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from "../../firebase-config";
import { PuffLoader } from "react-spinners";

const ProtectedRoute = ({ children }) => {
  const [user, loading, error] = useAuthState(auth);
  const admin = "CqhQfMc1LZdNCUgixbXpYT0SGaG2"; // Define the allowed UID here

  if (loading) {
    return (
      <div className="spinner-container">
        <PuffLoader color="#888" size={25} />
      </div>
    );
  }

  // Redirect if there's an error or no user is authenticated
  if (error || !user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect admins to the admin page
  if (user && user.uid === admin) {
    return <Navigate to="/adminHome" />;
  }

  // Render the protected children if the user is authenticated
  return children;
};

export default ProtectedRoute;
