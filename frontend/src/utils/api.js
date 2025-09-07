// src/api/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const apiCache = {};
const CACHE_EXPIRY_TIME = 600000; // 10 minutes

const api = axios.create({
    baseURL: `${API_BASE_URL}/api/v1`,
    withCredentials: true, // Ensure cookies are sent
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Remove token from localStorage; rely on cookies
api.interceptors.request.use(
    config => {
        // Do not set Authorization header; backend uses cookies
        if (process.env.NODE_ENV !== 'production') {
            console.log('Request sent:', config.url);
        }
        return config;
    },
    error => Promise.reject(error)
);

// Response Interceptor: Clear cache for mutating requests
api.interceptors.response.use(
    response => {
        const method = response.config.method;
        if (['post', 'patch', 'delete'].includes(method)) {
            api.clearCache('/classes');
            if (process.env.NODE_ENV !== 'production') {
                console.log(`Cache cleared for method: ${method}`);
            }
        }
        return response;
    },
    error => {
        if (error.response && error.response.status === 401) {
            if (process.env.NODE_ENV !== 'production') {
                console.warn('Unauthorized - possibly invalid/expired token');
            }
        }
        return Promise.reject(error);
    }
);

// Cache clear function
api.clearCache = (url) => {
    for (const key in apiCache) {
        const parsedKey = JSON.parse(key);
        if (parsedKey.url === url) {
            delete apiCache[key];
            if (process.env.NODE_ENV !== 'production') {
                console.log(`Cache cleared for URL: ${url}`);
            }
        }
    }
};

// Custom get with caching
const originalGet = api.get;
api.get = async (url, config = {}) => {
    const cacheKey = JSON.stringify({ url, params: config.params });
    const cachedEntry = apiCache[cacheKey];

    if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_EXPIRY_TIME)) {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`Cache hit for: ${url}`);
        }
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