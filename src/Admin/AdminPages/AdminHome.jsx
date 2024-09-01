import React, { useEffect } from "react";
import AdminDashboard from "../AdminComponents/AdminDashboard";

function AdminHome() {
  useEffect(()=> {
    document.title = "Admin-Evanis interiors";
  })
  return (
    <div className="adminHome">
      <AdminDashboard />

      <h2 className="admin-current-page mobile-content">Admin Dashboard</h2>

      <div className="adminHome-content adminContent">
      <h2 className="admin-current-page desktop-content"> Admin Dashboard</h2>

        {/* <h3>Welcome Back Admin</h3> */}
      </div>
    </div>
  );
}

export default AdminHome;
