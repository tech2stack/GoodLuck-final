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
import FlashMessage from './components/FlashMessage'; 
import { Toaster, toast } from 'sonner'; // Sonner import karein

import Home from './pages/Home';
import About from './pages/About';
import Career from './pages/Career';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Forgot from './pages/Forgot';

import SuperAdminDashboard from './pages/SuperAdminDashboard';
import BranchAdminDashboard from './pages/BranchAdminDashboard';
import StockManagerDashboard from './pages/StockManagerDashboard';
import CounterSale from './pages/CounterSale/CounterSale'; // <<< Naya: CounterSale component import karein

// Reports components (assuming these paths are correct in your project)
import OverallReportsComponent from './components/reports/OverallReportsComponent';
import BranchOverviewReport from './components/reports/BranchOverviewReport';

// CORRECTED Imports for ALL Master Components (based on your provided file list)
// These components are assumed to be in 'src/components/masters/'
import BookCatalogManagement from './components/masters/BookCatalogManagement';
import CityManagement from './components/masters/CityManagement';             
import ClassManagement from './components/masters/ClassManagement';           
import CreateSetManagement from './components/masters/CreateSetManagement';   
import CustomerManagement from './components/masters/CustomerManagement';     
import LanguageManagement from './components/masters/LanguageManagement';     
import PublicationManagement from './components/masters/PublicationManagement'; 
import StationeryItemManagement from './components/masters/StationeryItemManagement'; 
import TransportManagement from './components/masters/TransportManagement';   
import ZoneManagement from './components/masters/ZoneManagement';             

// SubtitleManagement import is REMOVED for now as it was not found in your provided file list.
// Please provide the correct filename/path for your Subtitle component.

import PendingBookManagement from './components/PendingBookManagement'; // Confirmed path


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
            <div className="flex justify-center items- D:\GoodLuck-Main\frontend\src\components\masters\SubtitleManagement.jsxcenter h-screen bg-gray-100">
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

    // Sonner toast ke liye showFlashMessage function
    const showFlashMessage = useCallback((message, type = 'info') => {
        if (type === 'success') {
            toast.success(message);
        } else if (type === 'error') {
            toast.error(message);
        } else if (type === 'info') {
            toast.info(message);
        } else if (type === 'warning') {
            toast.warning(message);
        } else {
            toast(message);
        }
    }, []);

    // Effect for initial loading (preloader) and network status monitoring
    useEffect(() => {
        // Simulate loading time for preloader
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 10);

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
                    <Header />      {/* Global Header component */}

                    {/* Global FlashMessage component to display notifications */}
                    {/* Key added to force re-render when message changes, helping ensure animations. */}
                    {/* FlashMessage component ko hata kar Sonner Toaster ka use karein */}
                    <Toaster position="top-right" richColors />

                    <div className="main-content">
                        {/* Sidebar is likely a separate component rendered globally or within the main layout */}
                        {/* <Sidebar /> */} 
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
                                        {/* showFlashMessage prop pass karein */}
                                        <BranchAdminDashboard showFlashMessage={showFlashMessage} />
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

                            {/* <<< Naya: CounterSale Route Add karein >>> */}
                            <Route
                                path="/counter-sale"
                                element={
                                    <PrivateRoute allowedRoles={['branch_admin']}>
                                        {/* showFlashMessage prop pass karein */}
                                        <CounterSale showFlashMessage={showFlashMessage} />
                                    </PrivateRoute>
                                }
                            />

                            {/* Masters Routes - All paths and component names corrected based on your provided list */}
                            <Route path="/customer-management" element={<PrivateRoute allowedRoles={['super_admin', 'stock_manager']}><CustomerManagement showFlashMessage={showFlashMessage} /></PrivateRoute>} />
                            <Route path="/class-management" element={<PrivateRoute allowedRoles={['super_admin', 'stock_manager']}><ClassManagement showFlashMessage={showFlashMessage} /></PrivateRoute>} />
                            <Route path="/book-catalog-management" element={<PrivateRoute allowedRoles={['super_admin', 'stock_manager']}><BookCatalogManagement showFlashMessage={showFlashMessage} /></PrivateRoute>} />
                            <Route path="/publication-management" element={<PrivateRoute allowedRoles={['super_admin', 'stock_manager']}><PublicationManagement showFlashMessage={showFlashMessage} /></PrivateRoute>} />
                            {/* SubtitleManagement route is REMOVED for now. Add it back once the correct filename is confirmed. */}
                            <Route path="/stationery-item-management" element={<PrivateRoute allowedRoles={['super_admin', 'stock_manager']}><StationeryItemManagement showFlashMessage={showFlashMessage} /></PrivateRoute>} />
                            <Route path="/create-set" element={<PrivateRoute allowedRoles={['super_admin', 'stock_manager']}><CreateSetManagement showFlashMessage={showFlashMessage} /></PrivateRoute>} />
                            
                            {/* New Master Routes based on your provided list */}
                            <Route path="/city-management" element={<PrivateRoute allowedRoles={['super_admin', 'stock_manager']}><CityManagement showFlashMessage={showFlashMessage} /></PrivateRoute>} />
                            <Route path="/language-management" element={<PrivateRoute allowedRoles={['super_admin', 'stock_manager']}><LanguageManagement showFlashMessage={showFlashMessage} /></PrivateRoute>} />
                            <Route path="/transport-management" element={<PrivateRoute allowedRoles={['super_admin', 'stock_manager']}><TransportManagement showFlashMessage={showFlashMessage} /></PrivateRoute>} />
                            <Route path="/zone-management" element={<PrivateRoute allowedRoles={['super_admin', 'stock_manager']}><ZoneManagement showFlashMessage={showFlashMessage} /></PrivateRoute>} />


                            {/* Reports Routes - showFlashMessage prop is passed */}
                            <Route path="/reports/overall" element={<PrivateRoute allowedRoles={['super_admin', 'branch_admin', 'stock_manager']}><OverallReportsComponent showFlashMessage={showFlashMessage} /></PrivateRoute>} />
                            <Route path="/reports/branch-overview" element={<PrivateRoute allowedRoles={['super_admin', 'branch_admin', 'stock_manager']}><BranchOverviewReport showFlashMessage={showFlashMessage} /></PrivateRoute>} />

                            {/* NEW Route for Pending Book Management */}
                            <Route path="/pending-books" element={<PrivateRoute allowedRoles={['super_admin', 'stock_manager']}><PendingBookManagement showFlashMessage={showFlashMessage} /></PrivateRoute>} />

                            {/* Default fallback route: Redirects users based on their role after login */}
                            <Route path="*" element={<RoleBasedRedirect />} />
                        </Routes>
                    </div>
                    <ScrollTopButton /> {/* Button to scroll to top */}
                    <Footer />      {/* Global Footer component */}
                </AuthProvider>
            </Router>
        </ErrorBoundary>
    );
}

export default App;
