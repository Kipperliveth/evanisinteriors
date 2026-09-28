import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { 
  Menu, X, LayoutDashboard, Users, FileSignature, 
  FolderKanban, ShoppingCart, BarChart3, ReceiptText, HardHat, LogOut 
} from 'lucide-react';
import './Navigation.scss';
import logo from '../../../stock/new-logo.svg';

function Navigation() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Close the confirmation popup with the Escape key
  useEffect(() => {
    if (!isLogoutConfirmOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoggingOut) setIsLogoutConfirmOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLogoutConfirmOpen, isLoggingOut]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut(getAuth());
    } catch (error) {
      console.error("Error signing out: ", error);
    } finally {
      setIsLoggingOut(false);
      setIsLogoutConfirmOpen(false);
      navigate('/admin', { replace: true });
    }
  };

  const navGroups = [
    {
      title: 'Overview',
      items: [
        { name: 'Dashboard', path: '/financetracking', icon: LayoutDashboard },
        { name: 'Projects', path: '/projects', icon: FolderKanban },
      ]
    },
    {
      title: 'Finance & Accounting',
      items: [
        { name: 'Transactions', path: '/transactions', icon: ReceiptText },
        { name: 'Estimates', path: '/estimates', icon: FileSignature },
        { name: 'Purchases', path: '/purchases', icon: ShoppingCart },
        { name: 'Reports', path: '/reports', icon: BarChart3 },
      ]
    },
    {
      title: 'Directory',
      items: [
        { name: 'Clients', path: '/clients', icon: Users },
        { name: 'Workers', path: '/vendors', icon: HardHat },
      ]
    }
  ];

  const renderNavContent = () => (
    <div className="nav-content">
      {navGroups.map((group, index) => (
        <div key={index} className="nav-group">
          <h3 className="nav-group-header">{group.title}</h3>
          <div className="nav-group-items">
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={18} className="nav-icon" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  // Reusable footer block so we can place it differently for mobile vs desktop
  const renderFooter = (className) => (
    <div className={`sidebar-footer ${className}`}>
      <div className="user-avatar">AD</div>
      <div className="user-info">
        <p className="user-name">Admin</p>
        <p className="user-role">Evanis Interiors</p>
      </div>
      <button
        type="button"
        className="logout-btn"
        onClick={() => setIsLogoutConfirmOpen(true)}
        aria-label="Log out"
        title="Log out"
      >
        <LogOut size={18} />
      </button>
    </div>
  );

  return (
    <>
      {/* MOBILE TOP BAR */}
      <div className="mobile-topbar">
        <div className="logo-area">
          <img src={logo} alt="Evanis Interiors" className="brand-logo" />
        </div>
        <button className="menu-toggle" onClick={() => setIsMobileOpen(!isMobileOpen)}>
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* MOBILE OVERLAY */}
      <div 
        className={`mobile-overlay ${isMobileOpen ? 'open' : ''}`} 
        onClick={() => setIsMobileOpen(false)}
      />

      {/* SIDEBAR */}
      <nav className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        
        {/* Desktop Header */}
        <div className="sidebar-header desktop-only">
          <img src={logo} alt="Evanis Interiors" className="brand-logo" />
        </div>

        <div className="sidebar-body">
          {/* Navigation Links */}
          {renderNavContent()}

          {/* This footer ONLY shows on Mobile, right under the links */}
          {renderFooter('mobile-footer')}
        </div>

        {/* This footer ONLY shows on Desktop, pinned to the absolute bottom */}
        {renderFooter('desktop-footer')}
        
      </nav>

      {/* LOGOUT CONFIRMATION POPUP (kept outside <nav> so it centers on the screen) */}
      {isLogoutConfirmOpen && (
        <div
          className="logout-overlay"
          onClick={() => { if (!isLoggingOut) setIsLogoutConfirmOpen(false); }}
        >
          <div
            className="logout-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="logout-modal-icon">
              <LogOut size={20} />
            </div>
            <h2 id="logout-title">Log out?</h2>
            <p>Are you sure you want to log out of your workspace?</p>

            <div className="logout-modal-actions">
              <button
                type="button"
                className="logout-cancel"
                onClick={() => setIsLogoutConfirmOpen(false)}
                disabled={isLoggingOut}
                autoFocus
              >
                Cancel
              </button>
              <button
                type="button"
                className="logout-confirm"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'Logging out...' : 'Log out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navigation;