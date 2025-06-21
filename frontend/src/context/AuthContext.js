// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../utils/api'; // Axios instance to make API calls

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true); // Initial loading state for auth context

    // Effect to initialize authentication state from localStorage on component mount
    useEffect(() => {
        console.log('AuthContext useEffect: Initialization started.');
        try {
            const storedUserData = localStorage.getItem('user_data');
            const storedToken = localStorage.getItem('jwtToken'); // Try to load the token from localStorage

            if (storedUserData && storedToken) {
                const parsedUserData = JSON.parse(storedUserData);
                // Basic validation for parsed user data
                if (parsedUserData && parsedUserData._id && parsedUserData.role) {
                    setUserData(parsedUserData);
                    setIsLoggedIn(true);
                    console.log('AuthContext: Loaded user data from localStorage (raw):', storedUserData);
                    console.log('AuthContext: Loaded user data from localStorage (parsed):', parsedUserData);
                } else {
                    console.log('AuthContext: Invalid user data or missing role/ID in localStorage. Clearing it.');
                    localStorage.clear(); // Clear potentially corrupted data
                    setIsLoggedIn(false);
                    setUserData(null);
                }
            } else {
                console.log('AuthContext: No user data or token found in localStorage.');
                setIsLoggedIn(false);
                setUserData(null);
            }
        } catch (error) {
            console.error('AuthContext: Error parsing stored data from localStorage:', error);
            localStorage.clear(); // Clear potentially corrupted data
            setIsLoggedIn(false);
            setUserData(null);
        } finally {
            setLoading(false);
            console.log('AuthContext: Initialization complete. Loading set to false.');
        }
    }, []); // Empty dependency array means this runs only once on mount

    // Function to handle user login, wrapped in useCallback
    const login = useCallback(async (loginId, password) => {
        try {
            console.log('AuthContext: Attempting login for LoginID:', loginId);
            const payload = { identifier: loginId, password };
            console.log('AuthContext: Login payload being sent:', payload);

            const response = await api.post('/auth/login', payload);
            console.log('AuthContext: Login API response (response.data):', response.data);

            const { token, data: { user } } = response.data; // Backend sends token and user under 'data' object

            if (!user || !user._id || !user.role) { // More robust user object validation
                console.error('AuthContext: API response has invalid or incomplete user object! Login failed.');
                localStorage.clear();
                setIsLoggedIn(false);
                setUserData(null);
                throw new Error('Invalid user data received from backend.');
            }

            if (!token) {
                console.error('AuthContext: No token found in API response! Login failed.');
                localStorage.clear();
                setIsLoggedIn(false);
                setUserData(null);
                throw new Error('Authentication token not received from backend.');
            }

            // Store token and user data in localStorage
            localStorage.setItem('jwtToken', token); // Use 'jwtToken' as per your code
            localStorage.setItem('user_data', JSON.stringify(user)); // Use 'user_data' as per your code

            setUserData(user);
            setIsLoggedIn(true);
            console.log('Login successful. Token and user data stored.');
            return user; // <<< IMPORTANT: Return the user object here

        } catch (error) {
            console.error('Login failed:', error.response?.data?.message || error.message || 'Unknown login error');
            localStorage.clear(); // Clear all auth data on login failure
            setIsLoggedIn(false);
            setUserData(null);
            // Rethrow the error so the calling component (Login.jsx) can handle it
            throw error;
        }
    }, []); // Dependencies for useCallback: empty if api is stable, or [api] if it changes

    // Function to handle user logout
    const logout = useCallback(async () => {
        console.log('AuthContext: User is logging out.');
        try {
            await api.post('/auth/logout'); // Call backend logout endpoint to clear server-side cookies
            localStorage.clear(); // Clear all authentication related data from frontend
            setIsLoggedIn(false);
            setUserData(null);
            console.log('AuthContext: Logout successful.');
        } catch (error) {
            console.error('AuthContext: Error during logout:', error.response?.data?.message || error.message);
            // Even if backend logout fails, clear frontend state for user experience
            localStorage.clear();
            setIsLoggedIn(false);
            setUserData(null);
        }
    }, []); // Dependencies for useCallback: [api]

    // Provide the auth state and functions to children components
    const authContextValue = {
        isLoggedIn,
        userData,
        loading, // AuthContext's loading state
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {/* Show children only when authentication check is complete */}
            {!loading ? children : <div className="min-h-screen flex items-center justify-center"><p className="text-xl font-semibold text-gray-700">Authentication loading...</p></div>}
        </AuthContext.Provider>
    );
};

// Custom hook to easily consume the AuthContext
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};