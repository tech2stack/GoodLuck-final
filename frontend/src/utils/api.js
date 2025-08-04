// src/api/api.js

import axios from 'axios';

// ✅ Automatically use local or deployed backend URL
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

// Yahan par hum cache store karenge. Yeh object data ko store karega.
const apiCache = {};
// Aap yahan cache ka samay (expiry time) set kar sakte hain. 60000ms = 1 minute.
const CACHE_EXPIRY_TIME = 600000;

// Create an Axios instance
const api = axios.create({
    baseURL: `${API_BASE_URL}/api/v1`, 
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 🔐 Request Interceptor: Attach JWT if available
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('jwtToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

// ❗ Response Interceptor: Handle common errors
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            console.warn("Unauthorized — possibly invalid/expired token");
            // Optionally: logout user or redirect
            // localStorage.removeItem('jwtToken');
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Ab hum yahan ek custom get() method banayenge jismein caching logic hogi
const originalGet = api.get; // Original get method ko save kar lete hain

api.get = async (url, config = {}) => {
    // Cache mein entry ko check karein
    const cacheKey = JSON.stringify({ url, params: config.params });
    const cachedEntry = apiCache[cacheKey];

    // Agar data cache mein maujood hai aur expire nahi hua hai
    if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_EXPIRY_TIME)) {
        console.log(`Cache se data use kiya: ${url}`);
        return Promise.resolve({ data: cachedEntry.data });
    }

    // Agar data cache mein nahi hai ya expire ho gaya hai, toh network call karein
    try {
        const response = await originalGet(url, config);

        // Naye data ko cache mein store karein aur timestamp record karein
        apiCache[cacheKey] = {
            data: response.data,
            timestamp: Date.now()
        };

        return response;
    } catch (error) {
        // Error ko handle karein
        return Promise.reject(error);
    }
};


export default api;
