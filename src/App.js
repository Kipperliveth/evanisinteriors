import Navbar from "./Components/Navbar";
import "./Styles/Main.scss";
import "./App/App-styles/AllStyles.scss";
import "./Admin/AdminStyles/AdminstylesMain.scss";
import { BrowserRouter as Router } from "react-router-dom"; 
import AnimatedRoutes from "./Pages/AnimatedRoutes";
import Footer from "./Components/Footer";
import TawkToChat from "./App/App-components/TawkToChat";
import { useLocation } from "react-router-dom";


function Layout() {
  const location = useLocation();

  // Add routes where TawkToChat should be hidden
  const hideChatRoutes = ["/expensedash", "/clients", "/invoices", "/accounting", "/reminders"];

  const shouldHideChat = hideChatRoutes.includes(location.pathname);

  return (
    <>
      <Navbar />
      <AnimatedRoutes />
      {!shouldHideChat && <TawkToChat />}
      <Footer />
    </>
  );
}

function App() {

  return (
    <div className="App">
      
      <Router>

      <Navbar />

    <Layout />  

      <Footer />

      </Router>

    </div>
  );
}

export default App;
