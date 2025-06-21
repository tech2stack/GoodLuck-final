//Main
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollTop';
import ScrollTopButton from "./components/ScrollTopButton";
import Preloader from './components/Preloader';
import ErrorBoundary from './components/ErrorBoundary';
import FlashMessage from './components/FlashMessage'; // Make sure this path is correct

import Login from './pages/Login';
import Forgot from './pages/Forgot';
import Home from './pages/Home';
import About from './pages/About';
import Career from './pages/Career';
import Contact from './pages/Contact';

import SuperAdminDashboard from './pages/SuperAdminDashboard';
import BranchAdminDashboard from './pages/BranchAdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';

import OverallReportsComponent from './components/reports/OverallReportsComponent';
import BranchOverviewReport from './components/reports/BranchOverviewReport';
// import BranchDetailsReport from './components/reports/BranchDetailsReport';
// import ReportsHub from './pages/ReportsHub';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [flashMessage, setFlashMessage] = useState(null);
  const [flashMessageType, setFlashMessageType] = useState('');
  const [flashMessageAnimationClass, setFlashMessageAnimationClass] = useState('');

  const showFlashMessage = useCallback((message, type = 'info') => {
      clearTimeout(window.flashMessageTimeout);
      clearTimeout(window.flashMessageHideTimeout);

      setFlashMessage(message);
      setFlashMessageType(type);
      setFlashMessageAnimationClass('show');

      window.flashMessageTimeout = setTimeout(() => {
          setFlashMessageAnimationClass('hide');
          window.flashMessageHideTimeout = setTimeout(() => {
              setFlashMessage(null);
              setFlashMessageType('');
              setFlashMessageAnimationClass('');
          }, 500);
      }, 2000);
  }, []);

  const clearFlashMessage = useCallback(() => {
      clearTimeout(window.flashMessageTimeout);
      clearTimeout(window.flashMessageHideTimeout);
      setFlashMessageAnimationClass('hide');
      setTimeout(() => {
          setFlashMessage(null);
          setFlashMessageType('');
          setFlashMessageAnimationClass('');
      }, 500);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isLoading || !isOnline) {
    return <Preloader />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ScrollToTop />
          <Header />
          <FlashMessage
            message={flashMessage}
            type={flashMessageType}
            onClose={clearFlashMessage}
            className={flashMessageAnimationClass}
          />
          <div className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/career" element={<Career />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot" element={<Forgot />} />

              <Route path="/superadmin-dashboard" element={<SuperAdminDashboard />} />
              <Route path="/branch-admin-dashboard" element={<BranchAdminDashboard />} />
              <Route path="/dashboard" element={<EmployeeDashboard />} />

              {/* Reports Routes - Passing showFlashMessage to ensure it's available */}
              {/* <Route path="/reports-hub" element={<ReportsHub showFlashMessage={showFlashMessage} />} /> */}
              <Route path="/reports/overall" element={<OverallReportsComponent showFlashMessage={showFlashMessage} />} />
              <Route path="/reports/branch-overview" element={<BranchOverviewReport showFlashMessage={showFlashMessage} />} />
              {/* <Route path="/reports/branch-details/:id" element={<BranchDetailsReport showFlashMessage={showFlashMessage} />} /> */}

            </Routes>
          </div>
          <ScrollTopButton />
          <Footer />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
