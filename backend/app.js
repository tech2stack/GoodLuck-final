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

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const mainRouter = require('./routes/index');

const app = express();

// ✅ CORS Policy - Ensure all frontend origins are listed here
app.use(cors({
    origin: ['https://goodluckstore.tech2stack.com', 'http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
}));

// ✅ Optional: Log incoming origin for debugging
app.use((req, res, next) => {
    console.log('🔍 Origin:', req.headers.origin);
    next();
});

// ✅ Security HTTP headers (Helmet should be before custom header settings if you intend to override)
app.use(helmet());

// ✅ Development logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// ✅ Rate limiting
const limiter = rateLimit({
    max: 1000,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// ✅ Body parsing and cookie parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ✅ Data sanitization
app.use(mongoSanitize());
app.use(xss());

// ✅ Prevent HTTP parameter pollution
app.use(hpp());

// --- UPDATED: Explicit CORS and CORP headers for static files ---
// This middleware runs *before* express.static for the specific path,
// ensuring CORS and CORP headers are set on the response for static assets.
app.use('/api/v1/uploads/branch-logos', (req, res, next) => {
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        const allowedOrigins = ['https://goodluckstore.tech2stack.com', 'http://localhost:3000', 'http://localhost:5173'];
        const requestOrigin = req.headers.origin;

        if (allowedOrigins.includes(requestOrigin)) {
            res.setHeader('Access-Control-Allow-Origin', requestOrigin);
            res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Max-Age', '86400');
        }
        return res.sendStatus(204);
    }

    // Set CORS headers for actual GET requests to the image
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    // NEW: Relax Cross-Origin-Resource-Policy for this specific static route
    // 'cross-origin' allows loading by any origin, which is necessary when served from a different port/domain
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
});

// --- Static file serving for uploaded images ---
app.use('/api/v1/uploads/branch-logos', express.static(path.join(__dirname, 'uploads', 'branch-logos')));


// ✅ Main API routes
app.use('/api/v1', mainRouter);

// ✅ Default root route for testing
app.get('/', (req, res) => {
    res.status(200).json({ status: 'success', message: '✅ GoodLuck API is running.' });
});

// ✅ Handle favicon
app.get('/favicon.ico', (req, res) => res.status(204).end());

// ✅ Catch-all for unknown routes
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// ✅ Global error handler
app.use(globalErrorHandler);

module.exports = app;