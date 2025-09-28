import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, logout, unreadNotificationsCount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          CeylonCompass
        </Link>
        
        <button className="menu-toggle" onClick={toggleMenu}>
          <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>
        
        <div className={`nav-content ${menuOpen ? 'open' : ''}`}>
          <div className="nav-center">
            <div className="nav-links">
              <Link to="/" className={`nav-link ${isActive('/')}`} onClick={() => setMenuOpen(false)}>
                Home
              </Link>
              <Link to="/restaurants" className={`nav-link ${isActive('/restaurants')}`} onClick={() => setMenuOpen(false)}>
                Restaurants
              </Link>
              <Link to="/events" className={`nav-link ${isActive('/events')}`} onClick={() => setMenuOpen(false)}>
                Events
              </Link>
              <Link to="/accommodations" className={`nav-link ${isActive('/accommodations')}`} onClick={() => setMenuOpen(false)}>
                Accommodations
              </Link>
              <Link to="/about" className={`nav-link ${isActive('/about')}`} onClick={() => setMenuOpen(false)}>
                About
              </Link>
              <Link to="/contact" className={`nav-link ${isActive('/contact')}`} onClick={() => setMenuOpen(false)}>
                Contact&nbsp;Us
              </Link>
            </div>
          </div>
          
          <div className="nav-right">
            {/* Location Display - Only shown when user is logged in */}
            {user && user.city && user.country && (
              <div className="location-display">
                <i className="fas fa-map-marker-alt"></i>
                <span>{`${user.city}, ${user.country}`}</span>
              </div>
            )}
            
            {/* User Menu */}
            {user ? (
              <div className="user-menu">
                {/* Only show Profile link for non-admin users */}
                {user.role !== 'admin' && (
                  <Link to="/profile" className={`nav-link ${isActive('/profile')}`} onClick={() => setMenuOpen(false)}>
                    <div className="profile-link-container">
                      Profile
                      {unreadNotificationsCount > 0 && (
                        <span className="notification-badge">{unreadNotificationsCount}</span>
                      )}
                    </div>
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin" className={`nav-link ${isActive('/admin')}`} onClick={() => setMenuOpen(false)}>
                    Admin
                  </Link>
                )}
                <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="logout-button">
                  Logout
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="login-button" onClick={() => setMenuOpen(false)}>
                  Login
                </Link>
                <Link to="/register" className="register-button" onClick={() => setMenuOpen(false)}>
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
