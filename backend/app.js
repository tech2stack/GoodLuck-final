// backend/app.js

const express = require('express');
const morgan = require('morgan'); // For logging HTTP requests
const rateLimit = require('express-rate-limit'); // To limit repeated requests to public APIs
const helmet = require('helmet'); // For setting security-related HTTP headers
const mongoSanitize = require('express-mongo-sanitize'); // To prevent MongoDB Operator Injection
const xss = require('xss-clean'); // To sanitize user input from XSS attacks
const hpp = require('hpp'); // To prevent HTTP Parameter Pollution
const cookieParser = require('cookie-parser'); // To parse cookies
const cors = require('cors'); // For Cross-Origin Resource Sharing
const path = require('path'); // Node.js path module for directory manipulation
const dotenv = require('dotenv'); // To load environment variables from .env file

// Load environment variables from .env file.
// This should be at the very top of your app.js to ensure env vars are available.
dotenv.config({ path: './.env' });

const AppError = require('./utils/appError'); // Custom error class
const globalErrorHandler = require('./controllers/errorController'); // Global error handling middleware
const mainRouter = require('./routes/index'); // Your main API router (where all routes are combined)
const db = require('./config/db'); // Assuming this file connects to your MongoDB database

const app = express();

// --- CORS Configuration ---
// Dynamically set allowed origins based on the environment (development or production).
let allowedOrigins = [];
if (process.env.NODE_ENV === 'production') {
    // In production, only allow the specified production frontend URL
    if (process.env.FRONTEND_PROD_URL) {
        allowedOrigins.push(process.env.FRONTEND_PROD_URL);
    }
} else { // Development or other non-production environments
    // In development, allow the specified development frontend URL and common localhost ports
    if (process.env.FRONTEND_DEV_URL) {
        allowedOrigins.push(process.env.FRONTEND_DEV_URL);
    }
    // Also allow common localhost ports for frontend development servers
    allowedOrigins.push('http://localhost:3000'); // Common React dev server default
    allowedOrigins.push('http://localhost:5173');
    allowedOrigins.push('https://goodluckstore.tech2stack.com/');// Common Vite dev server default
    // If your backend itself needs to make requests to itself (e.g., for testing),
    // you might include its own localhost URL, but typically not needed for frontend CORS.
    // allowedOrigins.push(`http://localhost:${process.env.PORT || 5000}`); 
}

// Log allowed origins for debugging purposes
console.log(`CORS: NODE_ENV is ${process.env.NODE_ENV}. Allowing origins: ${allowedOrigins.join(', ')}`);

// Configure CORS middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (e.g., from Postman, curl, or mobile apps)
        if (!origin) return callback(null, true);
        // Check if the request origin is in our list of allowed origins
        if (allowedOrigins.includes(origin)) {
            callback(null, true); // Origin is allowed
        } else {
            // Origin is not allowed, log a warning and return an error
            console.warn(`CORS Error: Origin ${origin} not allowed. Allowed: ${allowedOrigins.join(', ')}`);
            callback(new Error(`Not allowed by CORS: ${origin}`));
        }
    },
    credentials: true, // Allow cookies to be sent with cross-origin requests
}));

// Middleware to log the incoming request origin for debugging
app.use((req, res, next) => {
    console.log('🔍 Request Origin:', req.headers.origin || 'No Origin Header');
    next();
});

// --- Security Middleware ---
// Set security HTTP headers
app.use(helmet());

// Development logging (only in development environment)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Limit requests from same API (e.g., 1000 requests per hour per IP)
const limiter = rateLimit({
    max: 1000, // Max requests
    windowMs: 60 * 60 * 1000, // Per 1 hour
    message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter); // Apply rate limiting to all API routes

// Body parsers: reading data from body into req.body
app.use(express.json({ limit: '50mb' })); // For parsing application/json
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // For parsing application/x-www-form-urlencoded
app.use(cookieParser()); // For parsing cookies

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS attacks
app.use(xss());

// Prevent parameter pollution (e.g., ?sort=price&sort=name)
app.use(hpp());

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res, path, stat) => {
        // Set Cross-Origin-Resource-Policy header for static assets
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }
}));

// --- API Routes ---
// Mount your main router under the /api/v1 path
app.use('/api/v1', mainRouter);

// Basic route for the root URL to confirm API is running
app.get('/', (req, res) => {
    res.status(200).json({ status: 'success', message: '✅ GoodLuck API is running.' });
});

// Handle favicon requests (optional, prevents unnecessary 404s)
app.get('/favicon.ico', (req, res) => res.status(204).end());

// A simple endpoint to test CORS if needed
app.get('/cors-check', (req, res) => {
    // The CORS middleware handles the Access-Control-Allow-Origin header
    res.status(200).json({ msg: 'CORS check passed for this endpoint.' });
});

// --- Error Handling ---
// Handle all unhandled routes (404 Not Found)
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

module.exports = app;
