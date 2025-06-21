import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import About from './pages/About';
import Career from './pages/Career';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Forgot from './pages/Forgot';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollTop';
import ScrollTopButton from "./components/ScrollTopButton";
import Preloader from './components/Preloader';
import ErrorBoundary from './components/ErrorBoundary';
import FlashMessage from './components/FlashMessage';
import { AuthProvider } from './context/AuthContext';

import Preloader from './components/Preloader';

import Header from './components/Header';
import Home from './pages/Home';
import About from './pages/About';
import Career from './pages/Career';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Forgot from './pages/Forgot';
import Footer from './components/Footer';

import ScrollToTop from './components/ScrollTop';
import ScrollTopButton from "./components/ScrollTopButton";

import ErrorBoundary from './components/ErrorBoundary';
import FlashMessage from './components/FlashMessage'; // Make sure this path is correct

import SuperAdminDashboard from './pages/SuperAdminDashboard';
import BranchAdminDashboard from './pages/BranchAdminDashboard';
// import EmployeeDashboard from './pages/EmployeeDashboard'; // REMOVED: If this file doesn't exist
import StockManagerDashboard from './pages/StockManagerDashboard';

import OverallReportsComponent from './components/reports/OverallReportsComponent';
import BranchOverviewReport from './components/reports/BranchOverviewReport';

// A PrivateRoute component to protect routes based on role
const PrivateRoute = ({ children, allowedRoles }) => {
    const { isLoggedIn, userData, loading } = useAuth();

    if (loading) {
        return <div>Loading authentication...</div>; // Or a spinner
    }

    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && (!userData || !allowedRoles.includes(userData.role))) {
        // Optionally redirect to a "not authorized" page or home
        return <Navigate to="/unauthorized" replace />; // Or '/'
    }

    return children;
};

// Component to handle redirection based on user role after login
const RoleBasedRedirect = () => {
    const { isLoggedIn, userData, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>; // Show a loader while authentication state is determined
    }

    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    switch (userData?.role) {
        case 'super_admin':
            return <Navigate to="/superadmin-dashboard" replace />;
        case 'branch_admin':
            return <Navigate to="/branch-admin-dashboard" replace />;
        // case 'employee': // REMOVED: If EmployeeDashboard is not present
        //     return <Navigate to="/employee-dashboard" replace />;
        case 'stock_manager':
            return <Navigate to="/stock-manager-dashboard" replace />;
        default:
            return <Navigate to="/login" replace />;
    }
};
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
                            <Route path="/unauthorized" element={<div>You are not authorized to view this page.</div>} /> {/* Added unauthorized route */}

                            {/* Dashboard Routes protected by PrivateRoute */}
                            <Route
                                path="/superadmin-dashboard"
                                element={
                                    <PrivateRoute allowedRoles={['super_admin']}>
                                        <SuperAdminDashboard />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/branch-admin-dashboard"
                                element={
                                    <PrivateRoute allowedRoles={['branch_admin']}>
                                        <BranchAdminDashboard />
                                    </PrivateRoute>
                                }
                            />
                            {/* REMOVED: EmployeeDashboard route if file is missing */}
                            {/* <Route
                                path="/employee-dashboard"
                                element={
                                    <PrivateRoute allowedRoles={['employee']}>
                                        <EmployeeDashboard />
                                    </PrivateRoute>
                                }
                            /> */}
                            <Route
                                path="/stock-manager-dashboard"
                                element={
                                    <PrivateRoute allowedRoles={['stock_manager']}>
                                        <StockManagerDashboard />
                                    </PrivateRoute>
                                }
                            />
              <Route path="/superadmin-dashboard" element={<SuperAdminDashboard />} />
              <Route path="/branch-admin-dashboard" element={<BranchAdminDashboard />} />
              <Route path="/employee-dashboard" element={<EmployeeDashboard />} />

                            {/* Reports Routes - Passing showFlashMessage to ensure it's available */}
                            <Route path="/reports/overall" element={<OverallReportsComponent showFlashMessage={showFlashMessage} />} />
                            <Route path="/reports/branch-overview" element={<BranchOverviewReport showFlashMessage={showFlashMessage} />} />

                            {/* Default redirect based on role, or to login */}
                            <Route path="*" element={<RoleBasedRedirect />} />
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
