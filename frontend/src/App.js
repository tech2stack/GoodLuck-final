// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollTop';
import ScrollTopButton from "./components/ScrollTopButton";
import Preloader from './components/Preloader';
import ErrorBoundary from './components/ErrorBoundary';
import FlashMessage from './components/FlashMessage'; // Corrected import path

import Home from './pages/Home';
import About from './pages/About';
import Career from './pages/Career';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Forgot from './pages/Forgot';

import SuperAdminDashboard from './pages/SuperAdminDashboard';
import BranchAdminDashboard from './pages/BranchAdminDashboard';
import StockManagerDashboard from './pages/StockManagerDashboard';

// Reports components (assuming these paths are correct in your project)
import OverallReportsComponent from './components/reports/OverallReportsComponent';
import BranchOverviewReport from './components/reports/BranchOverviewReport';

// A PrivateRoute component to protect routes based on user role
const PrivateRoute = ({ children, allowedRoles }) => {
    const { isLoggedIn, userData, loading } = useAuth();

    // Show a detailed loading message while authentication status is being determined
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <p className="text-xl text-gray-700">Loading user authentication status...</p>
            </div>
        );
    }

    // If not logged in, redirect to the login page
    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    // If logged in but role is not allowed, redirect to an unauthorized page or home
    if (allowedRoles && (!userData || !allowedRoles.includes(userData.role))) {
        console.warn(`User with role "${userData?.role}" attempted to access restricted route. Allowed roles: ${allowedRoles.join(', ')}`);
        return <Navigate to="/unauthorized" replace />;
    }

    // If authenticated and authorized, render the children components
    return children;
};

// Component to handle redirection based on user role after successful login
const RoleBasedRedirect = () => {
    const { isLoggedIn, userData, loading } = useAuth();

    // Show a loading message while user data is being fetched/determined
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <p className="text-xl text-gray-700">Determining user role for redirection...</p>
            </div>
        );
    }

    // If not logged in, redirect to the login page
    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    // Redirect based on the user's role
    switch (userData?.role) {
        case 'super_admin':
            return <Navigate to="/superadmin-dashboard" replace />;
        case 'branch_admin':
            return <Navigate to="/branch-admin-dashboard" replace />;
        case 'employee':
            return <Navigate to="/login" replace />; // Default if employee dashboard is not ready
        case 'stock_manager':
            return <Navigate to="/stock-manager-dashboard" replace />;
        default:
            // Fallback for unknown roles or if role is missing
            console.warn("Unknown user role detected. Redirecting to login.");
            return <Navigate to="/login" replace />;
    }
};

function App() {
    const [isLoading, setIsLoading] = useState(true); // Preloader loading state
    const [isOnline, setIsOnline] = useState(navigator.onLine); // Network online/offline status

    // State for managing global flash messages (e.g., from network errors or success notifications)
    const [flashMessage, setFlashMessage] = useState(null);
    const [flashMessageType, setFlashMessageType] = useState(''); // 'success', 'error', 'info'
    const [flashMessageAnimationClass, setFlashMessageAnimationClass] = useState(''); // For CSS animations

    // Callback to display a flash message
    const showFlashMessage = useCallback((message, type = 'info') => {
        // Clear any existing timeouts to prevent multiple messages overlapping
        clearTimeout(window.flashMessageTimeout);
        clearTimeout(window.flashMessageHideTimeout);

        setFlashMessage(message);
        setFlashMessageType(type);
        setFlashMessageAnimationClass('show'); // Trigger show animation

        // Set timeout to start hiding the message
        window.flashMessageTimeout = setTimeout(() => {
            setFlashMessageAnimationClass('hide'); // Trigger hide animation
            // After hide animation, clear the message completely from state
            window.flashMessageHideTimeout = setTimeout(() => {
                setFlashMessage(null);
                setFlashMessageType('');
                setFlashMessageAnimationClass('');
            }, 500); // Duration of the hide animation (should match CSS transition)
        }, 2000); // Message visible for 2 seconds before hiding starts
    }, []); // Dependencies for useCallback: none, as it doesn't depend on changing props/state

    // Effect for initial loading (preloader) and network status monitoring
    useEffect(() => {
        // Simulate loading time for preloader
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1500);

        // Event listeners for online/offline status
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Cleanup function for useEffect
        return () => {
            clearTimeout(timer);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []); // Empty dependency array means this runs once on mount

    // Render preloader if the app is still loading or offline
    if (isLoading || !isOnline) {
        return <Preloader />;
    }

    return (
        <ErrorBoundary>
            <Router>
                {/* AuthProvider wraps the entire application to provide authentication context */}
                <AuthProvider>
                    <ScrollToTop /> {/* Component to scroll to top on route change */}
                    <Header />      {/* Global Header component */}

                    {/* Global FlashMessage component to display notifications */}
                    {/* Key added to force re-render when message changes, helping ensure animations. */}
                    <FlashMessage
                        key={flashMessage ? 'message-active' : 'no-message'} // Forces re-mount when message changes or clears
                        message={flashMessage}
                        type={flashMessageType}
                        // onClose prop is not needed here as App.js manages dismissal via timeouts
                        className={flashMessageAnimationClass}
                    />

                    <div className="main-content">
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/" element={<Home />} />
                            <Route path="/about" element={<About />} />
                            <Route path="/career" element={<Career />} />
                            <Route path="/contact" element={<Contact />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/forgot" element={<Forgot />} />
                            <Route path="/unauthorized" element={<div className="text-center p-4 text-red-600 font-semibold">You are not authorized to view this page.</div>} />

                            {/* Dashboard Routes protected by PrivateRoute */}
                            <Route
                                path="/superadmin-dashboard"
                                element={
                                    <PrivateRoute allowedRoles={['super_admin']}>
                                        <SuperAdminDashboard showFlashMessage={showFlashMessage} /> {/* Pass showFlashMessage */}
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
                            <Route
                                path="/stock-manager-dashboard"
                                element={
                                    <PrivateRoute allowedRoles={['stock_manager']}>
                                        {/* Pass the showFlashMessage function down to StockManagerDashboard */}
                                        <StockManagerDashboard showFlashMessage={showFlashMessage} />
                                    </PrivateRoute>
                                }
                            />

                            {/* Reports Routes - showFlashMessage prop is passed */}
                            <Route path="/reports/overall" element={<OverallReportsComponent showFlashMessage={showFlashMessage} />} />
                            <Route path="/reports/branch-overview" element={<BranchOverviewReport showFlashMessage={showFlashMessage} />} />

                            {/* Default fallback route: Redirects users based on their role after login */}
                            <Route path="*" element={<RoleBasedRedirect />} />
                        </Routes>
                    </div>
                    <ScrollTopButton /> {/* Button to scroll to top */}
                    <Footer />      {/* Global Footer component */}
                </AuthProvider>
            </Router>
        </ErrorBoundary>
    );
}

export default App;
