import axios from 'axios';

// ✅ Automatically use local or deployed backend URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create an Axios instance
const api = axios.create({
    baseURL: `${API_BASE_URL}/api/v1`, // base URL from .env
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

export default api;
