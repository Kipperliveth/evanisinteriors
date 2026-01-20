import React, { useState, useEffect } from 'react'
import logo from "../../../stock/logonew-removebg-preview.png"
import { NavLink } from 'react-router-dom'
import { MdOutlineDashboard } from "react-icons/md";
import { TbFileInvoice } from "react-icons/tb";
import { MdOutlineAccountBalance } from "react-icons/md";
import { GiSandsOfTime } from "react-icons/gi";
import { HiOutlineUsers } from "react-icons/hi2";
import { FiMenu, FiX } from "react-icons/fi";
import { useLocation } from 'react-router-dom';

function Navigation() {

      const [isOpen, setIsOpen] = useState(false);

     useEffect(() => {
  const body = document.body;

  if (isOpen) {
    const scrollY = window.scrollY;
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.overflow = "hidden";
  } else {
    const scrollY = body.style.top;
    body.style.position = "";
    body.style.top = "";
    body.style.overflow = "";
    window.scrollTo(0, parseInt(scrollY || "0") * -1);
  }
}, [isOpen]);

//route
 const location = useLocation();

  const routeTitles = {
    "/expensedash": "Dashboard",
    "/clients": "Clients",
    "/invoices": "Invoices",
    "/accounting": "Accounting",
    "/reminders": "Reminders"
  };

  const currentTitle = routeTitles[location.pathname] || "Dashboard";


  return (
    <div className='invoice-navigation'>

    <div className="desktop-nav">

        <div className="logo">
            <img src={logo} alt="evanis-logo" />
        </div>

        <div className="pages">
            <NavLink to="/expensedash"><MdOutlineDashboard className='icon'/> Dashboard</NavLink>
            <NavLink to="/clients"><HiOutlineUsers className='icon'/> Clients</NavLink>
            <NavLink to="/invoices"><TbFileInvoice className='icon'/> Invoice</NavLink>
            <NavLink to="/accounting"><MdOutlineAccountBalance className='icon'/> Accounting</NavLink>
            <NavLink to="/reminders"><GiSandsOfTime className='icon'/> Reminders</NavLink>
        </div>

        <div className="account">
            <button>Logout</button>
        </div>

    </div>

       <div className="mobile-nav" onClick={() => setIsOpen(!isOpen)}>

            {isOpen ? <FiX className='menu-btn' /> : <FiMenu className='menu-btn'/>}

        <img src={logo} alt="evanis-logo" />
        
       <h3>{currentTitle}</h3>


      </div>

         <div className={`mobile-navigation ${isOpen ? "show" : "hidden"}`} onClick={() => setIsOpen(false)}>

              <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>

    
        <div className="pages">
            <NavLink to="/expensedash"><MdOutlineDashboard className='icon'/> Dashboard</NavLink>
            <NavLink to="/clients"><HiOutlineUsers className='icon'/> Clients</NavLink>
            <NavLink to="/invoices"><TbFileInvoice className='icon'/> Invoice</NavLink>
            <NavLink to="/accounting"><MdOutlineAccountBalance className='icon'/> Accounting</NavLink>
            <NavLink to="/reminders"><GiSandsOfTime className='icon'/> Reminders</NavLink>
        <div className="account">
            <button>Logout</button>
        </div>
        </div>


            </div>
      
      </div>


    </div>
  )
}

export default Navigation
