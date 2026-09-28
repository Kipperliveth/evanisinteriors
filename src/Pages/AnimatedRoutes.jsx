import { React, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

// Components
import Home from "./Home";
import Masterclass from "./Masterclass";
import About from "./About";
import Contact from "./Contact";
import Login from "../App/App-auth/Login";
import SignUp from "../App/App-auth/SignUp";
import ProtectedRoute from "../App/App-auth/AuthGuard";
import AdminRoute from "../App/App-auth/AdminGuard"
import MasterclassMain from "../App/App-pages/MasterclassMain";

// IMPORTANT: We only import Store now, Shop is deleted
import Store from "../App/App-pages/Store"; 
import Cart from "../App/App-pages/Cart";

import UserDashboard from "../App/App-pages/UserDashboard";
import UserProfile from "../App/App-pages/UserProfile";
import UserNotifications from '../App/App-pages/UserNotifications';
import AdminHome from "../Admin/AdminPages/AdminHome";
import AdminNotifications from "../Admin/AdminPages/AdminNotifications";
import Post from "../Admin/AdminPages/Post";
import Uploads from "../Admin/AdminPages/Uploads";
import Onboarding from "../App/App-auth/Onboarding";
import Address from "../App/App-auth/Address";
import ProfilePicture from "../App/App-auth/ProfilePicture";
import Orders from "../Admin/AdminPages/Orders";
import Editaddress from "../App/App-auth/Editaddress";
import Myorders from "../App/App-pages/Myorders";
import PasswordReset from "../App/App-auth/PasswordReset";
import GetHelp from "../App/App-pages/GetHelp";
import ProfileEdit from "../App/App-auth/ProfileEdit";
import Adminlog from "../Admin/AdminPages/Adminlog";
import NotFound from "./NotFound";
import Enroll from "./Enroll";
import Dashboard from "../Admin/InvoiceTracker/pages/Dashboard";
import Clients from "../Admin/InvoiceTracker/pages/Clients";
import Accounting from "../Admin/InvoiceTracker/pages/Accounting";
import Reminders from "../Admin/InvoiceTracker/pages/Reminders";
import Invoice from "../Admin/InvoiceTracker/pages/Invoice";
import AccountingDashboard from "../Admin/Accounting/pages/AccountingDashboard";
import Client from "../Admin/Accounting/pages/Client";
import Estimates from "../Admin/Accounting/pages/Estimates";
import Projects from "../Admin/Accounting/pages/Projects";
import Purchases from "../Admin/Accounting/pages/Purchases";
import Reports from "../Admin/Accounting/pages/Reports";
import Transactions from "../Admin/Accounting/pages/Transactions";
import Vendors from "../Admin/Accounting/pages/Vendors";

function AnimatedRoutes() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  
  return (
    <AnimatePresence>
      <Routes location={location} key={location.pathname}>
        
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset" element={<PasswordReset />}/>
        <Route path="/signup" element={<SignUp />} />
        
        <Route path="/masterclass" element={<Masterclass />} />
        <Route path="/masterclass/enroll" element={<Enroll />} />

        {/* --- UNIFIED STORE ROUTE (No ProtectedRoute wrapper) --- */}
        <Route path="/store" element={<Store />} />
        <Route path="/store/:productId" element={<Store />} />

        {/* --- PUBLIC CART ROUTE (Guests need to be able to see their cart to hit checkout) --- */}
        <Route path="/cart" element={<Cart />} />

        {/* PROTECTED ROUTES (Requires Login) */}
        <Route path="/userProfile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><UserNotifications /></ProtectedRoute> }/>
        <Route path='/onboarding' element={<ProtectedRoute><Onboarding /></ProtectedRoute> }/>
        <Route path="/onboarding/address" element={<ProtectedRoute><Address /></ProtectedRoute>}/>
        <Route path='/editAddress' element={<ProtectedRoute><Editaddress /></ProtectedRoute>} />
        <Route path='/profilePic'  element={<ProtectedRoute><ProfilePicture /></ProtectedRoute>}/>
        <Route path='/editprofile' element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>}/>
        <Route path="/userDashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        <Route path="/myorders" element={<ProtectedRoute><Myorders /></ProtectedRoute>} />
        <Route path='/gethelp' element={<ProtectedRoute><GetHelp /></ProtectedRoute>}/>
        <Route path="/userMasterclass" element={<ProtectedRoute><MasterclassMain /></ProtectedRoute>} />

        {/* ADMIN ROUTES */}
        <Route path="/adminHome" element={<AdminRoute><AdminHome /></AdminRoute>} />
        <Route path="/adminNotifications" element={<AdminRoute><AdminNotifications /></AdminRoute>} />
        <Route path="/post" element={<AdminRoute><Post /></AdminRoute>} />
        <Route path='/orders' element={<AdminRoute><Orders /></AdminRoute>} />
        <Route path='/adminlog' element={<AdminRoute><Adminlog /></AdminRoute>} />
        <Route path='/uploads' element={<Uploads />}/>
        <Route path="/expensedash" element={<Dashboard />}/>
        {/* <Route path="/clients" element={<Clients />}/> */}
        <Route path="/accounting" element={<Accounting />}/>
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/invoices" element={<Invoice />}/>

        {/* accounting */}
        <Route path="/financetracking" element={<AccountingDashboard />}/>
        <Route path="/clients" element={<Client />}/>
        <Route path="/estimates" element={<Estimates />}/>
        <Route path="/projects" element={<Projects />}/>
        <Route path="/purchases" element={<Purchases />}/>
        <Route path="/reports" element={<Reports />}/>
        <Route path="/transactions" element={<Transactions />}/>
        <Route path="/vendors" element={<Vendors />}/>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

export default AnimatedRoutes;