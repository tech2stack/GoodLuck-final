// src/api/api.js

import axios from 'axios';

// Backend URL ko automatically use karein
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

// Client-side cache store
const apiCache = {};
// Cache ka samay (expiry time): 10 minutes
const CACHE_EXPIRY_TIME = 600000;

// Axios instance banayein
const api = axios.create({
    baseURL: `${API_BASE_URL}/api/v1`, 
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Authorization token attach karein
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

// 🔥 NEW & FIXED: Response Interceptor mein cache clear karne ka logic
api.interceptors.response.use(
    response => {
        // Agar request successful hai aur POST, PATCH ya DELETE method use hua hai
        const method = response.config.method;
        if (method === 'post' || method === 'patch' || method === 'delete') {
            // `classes` se related cache clear karein.
            // Dynamic URLs ke liye, humesha base path clear karein.
            api.clearCache('/classes'); 
        }
        return response;
    },
    error => {
        if (error.response && error.response.status === 401) {
            console.warn("Unauthorized — possibly invalid/expired token");
        }
        return Promise.reject(error);
    }
);

// Cache ko URL ke adhar par clear karein
api.clearCache = (url) => {
    for (const key in apiCache) {
        const parsedKey = JSON.parse(key);
        if (parsedKey.url === url) {
            delete apiCache[key];
            console.log(`Cache cleared for URL: ${url}`);
        }
    }
};

// Original get method ko ek variable mein store karein
const originalGet = api.get;

// Custom get() method, jismein caching logic hai
api.get = async (url, config = {}) => {
    const cacheKey = JSON.stringify({ url, params: config.params });
    const cachedEntry = apiCache[cacheKey];

    if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_EXPIRY_TIME)) {
        console.log(`Cache se data use kiya: ${url}`);
        return Promise.resolve({ data: cachedEntry.data });
    }

    try {
        const response = await originalGet(url, config);
        apiCache[cacheKey] = {
            data: response.data,
            timestamp: Date.now()
        };
        return response;
    } catch (error) {
        return Promise.reject(error);
    }
};

export default api;
