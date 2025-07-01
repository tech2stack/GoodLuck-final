// backend/server.js (or app.js, index.js)

const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv'); // Make sure dotenv is here to load .env

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const mainRouter = require('./routes/index'); // Your main router
// Import the db module. The centralDbConnection is established when this module is loaded.
const db = require('./config/db'); 

// Load environment variables
dotenv.config({ path: './.env' }); // Specify path if .env is not in root

// No explicit connectDB() call needed here, as the centralDbConnection
// is initiated directly when the db.js module is required.
// The connection status will be logged from db.js itself.

const app = express();

// ✅ Allowed frontend domains (ensure these are correct for your setup)
const allowedOrigins = [
    'https://goodluckstore.tech2stack.com',
    'http://localhost:3000',
    'http://localhost:5173'
];

// ✅ Global CORS middleware for APIs
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

// ✅ Optional logging for origin
app.use((req, res, next) => {
    console.log('🔍 Origin:', req.headers.origin);
    next();
});

// ✅ Security headers
app.use(helmet());

// ✅ Logging for development
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// ✅ Rate limiting
const limiter = rateLimit({
    max: 1000, // Max requests per windowMs
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter); // Apply to all API routes

// ✅ Parsing - INCREASED PAYLOAD LIMIT TO 50MB
app.use(express.json({ limit: '50mb' })); // Body parser for JSON
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Body parser for URL-encoded data
app.use(cookieParser()); // Cookie parser

// ✅ Data Sanitization against NoSQL query injection
app.use(mongoSanitize());
// ✅ Data Sanitization against XSS attacks
app.use(xss());

// ✅ Prevent parameter pollution
app.use(hpp());

// ✅ Custom CORS handling for static file uploads (images) - Adjust paths as needed
app.use('/api/v1/uploads/branch-logos', (req, res, next) => {
    const requestOrigin = req.headers.origin;
    if (allowedOrigins.includes(requestOrigin)) {
        res.setHeader('Access-Control-Allow-Origin', requestOrigin);
        res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); // Needed for some browsers
    }

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204); // Respond to preflight requests
    }

    next();
});

// ✅ Serve static files (e.g., uploaded images) - Adjust paths as needed
app.use('/api/v1/uploads/branch-logos', express.static(path.join(__dirname, 'uploads', 'branch-logos')));

// ✅ Main API routes
app.use('/api/v1', mainRouter); // All your specific routes are mounted here

// ✅ Test route
app.get('/', (req, res) => {
    res.status(200).json({ status: 'success', message: '✅ GoodLuck API is running.' });
});

// ✅ Favicon route
app.get('/favicon.ico', (req, res) => res.status(204).end());

// ✅ Temporary CORS check endpoint (optional, can be deleted later)
app.get('/cors-check', (req, res) => {
    const origin = req.headers.origin;
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.status(200).json({ msg: 'CORS check passed.' });
});

// ✅ Handle unknown routes (404)
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// ✅ Global error handler
app.use(globalErrorHandler);

// Export the app for server.js (if server.js is a separate file that imports app)
module.exports = app;

// If this file is your direct server entry point, then also add:
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });
