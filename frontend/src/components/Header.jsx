import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import '../styles/Header.css';
import logoImage from '../assets/logo.jpg';
import LazyImage from './LazyImage';

import { FaHome, FaUserAlt, FaSignInAlt, FaSignOutAlt, FaTachometerAlt } from 'react-icons/fa';
import { MdContactMail, MdWork } from 'react-icons/md';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const navigate = useNavigate();
  const { isLoggedIn, userData, logout } = useAuth();

  const profileDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const toggleMobileMenu = useCallback(() => setIsMobileMenuOpen(prev => !prev), []);
  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);
  const toggleProfileDropdown = useCallback(() => setIsProfileDropdownOpen(prev => !prev), []);
  const closeProfileDropdown = useCallback(() => setIsProfileDropdownOpen(false), []);

  const handleLogout = useCallback(() => {
  logout();
  closeMobileMenu();
  closeProfileDropdown();
  navigate('/', {
    state: {
      fromLogout: true,
      message: 'You have been successfully logged out!'
    }
  });
}, [logout, closeMobileMenu, closeProfileDropdown, navigate]);

//tmc 
  const handleDashboard = useCallback(() => {
    closeProfileDropdown();
    closeMobileMenu();
    if (userData?.role === 'super_admin') {
      navigate('/superadmin-dashboard');
    } else if (userData?.role === 'branch_admin') {
      navigate('/branch-admin-dashboard');
    } else {
      navigate('/dashboard');
    }
  }, [userData, closeProfileDropdown, closeMobileMenu, navigate]);

  const getUserDisplayName = useCallback(() => {
    return userData?.name || userData?.username || 'User';
  }, [userData]);

  useEffect(() => {
    function handleClickOutsideProfileDropdown(event) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        closeProfileDropdown();
      }
    }
    document.addEventListener('mousedown', handleClickOutsideProfileDropdown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideProfileDropdown);
    };
  }, [closeProfileDropdown]);

  useEffect(() => {
    function handleClickOutsideMobileMenu(event) {
      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        !event.target.closest('.hamburger-icon')
      ) {
        closeMobileMenu();
      }
    }
    document.addEventListener('mousedown', handleClickOutsideMobileMenu);
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideMobileMenu);
    };
  }, [isMobileMenuOpen, closeMobileMenu]);

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/" className="header-logo-link" onClick={closeMobileMenu}>
          <LazyImage src={logoImage} alt="Goodluck Book Store Logo" className="header-logo" />
          <h1 className="site-title"><b>Good Luck Book Store</b></h1>
        </Link>
      </div>

      <div className={`nav-links-container ${isMobileMenuOpen ? 'open' : ''}`} ref={mobileMenuRef} id="main-navigation">
        <nav className="main-nav">
          <Link to="/" onClick={closeMobileMenu}><FaHome /> Home</Link>
          <Link to="/about" onClick={closeMobileMenu}><FaUserAlt /> About</Link>
          <Link to="/career" onClick={closeMobileMenu}><MdWork /> Career</Link>
          <Link to="/contact" onClick={closeMobileMenu}><MdContactMail /> Contact</Link>

          {isLoggedIn ? (
            <>
              <div className="profile-section desktop-only" ref={profileDropdownRef}>
                <button
                  type="button"
                  className={`profile-icon-container ${isProfileDropdownOpen ? 'open' : ''}`}
                  onClick={toggleProfileDropdown}
                  aria-haspopup="true"
                  aria-expanded={isProfileDropdownOpen}
                  aria-label="User profile menu"
                >
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(getUserDisplayName())}&background=4CAF50&color=fff&rounded=true&size=32`}
                    alt="Profile"
                    className="profile-avatar"
                  />  ▼
                  <span className="profile-arrow"></span>
                </button>
                {isProfileDropdownOpen && (
                  <div className="profile-dropdown">
                    <span className="dropdown-item welcome-message">
                      <b>{getUserDisplayName()}</b>
                    </span>
                    <button onClick={handleDashboard} className="dropdown-item">
                      <FaTachometerAlt /> Dashboard
                    </button>
                    <button onClick={handleLogout} className="dropdown-item">
                      <FaSignOutAlt /> Logout
                    </button>
                  </div>
                )}
              </div>

              <div className="mobile-only profile-mobile-actions">
                <span className="mobile-user-label">👤 {getUserDisplayName()}</span>
                <button onClick={handleDashboard} className="mobile-nav-button">
                  <FaTachometerAlt /> Dashboard
                </button>
                <button onClick={handleLogout} className="mobile-nav-button">
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            </>
          ) : (
            <Link to="/login" onClick={closeMobileMenu}>
              <FaSignInAlt /> Login
            </Link>
          )}
        </nav>
      </div>

      <button
        className={`hamburger-icon ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={toggleMobileMenu}
        aria-label="Toggle navigation menu"
        aria-expanded={isMobileMenuOpen}
        aria-controls="main-navigation"
      >
        <div className="hamburger-lines">
          <span className="line top"></span>
          <span className="line middle"></span>
          <span className="line bottom"></span>
        </div>
      </button>
    </header>
  );
};

export default Header;
