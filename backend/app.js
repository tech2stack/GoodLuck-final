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

// ✅ Allowed frontend domains
const allowedOrigins = [
    'https://goodluckstore.tech2stack.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'https://thorough-recreation-production-635b.up.railway.app',
    'https://goodluckstore.up.railway.app'
];

// ✅ Global CORS middleware for APIs
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
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
    max: 1000,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// ✅ Parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ✅ Sanitization
app.use(mongoSanitize());
app.use(xss());

// ✅ Prevent parameter pollution
app.use(hpp());

// ✅ Custom CORS handling for static file uploads (images)
app.use('/api/v1/uploads/branch-logos', (req, res, next) => {
    const requestOrigin = req.headers.origin;
    if (allowedOrigins.includes(requestOrigin)) {
        res.setHeader('Access-Control-Allow-Origin', requestOrigin);
        res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Max-Age', '86400');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204); // Respond to preflight
    }

    next();
});

// ✅ Static files
app.use('/api/v1/uploads/branch-logos', express.static(path.join(__dirname, 'uploads', 'branch-logos')));

// ✅ Main API routes
app.use('/api/v1', mainRouter);

// ✅ Test route
app.get('/', (req, res) => {
    res.status(200).json({ status: 'success', message: '✅ GoodLuck API is running.' });
});

// ✅ Favicon
app.get('/favicon.ico', (req, res) => res.status(204).end());

// ✅ Temporary CORS check endpoint (optional, can be deleted later)
app.get('/cors-check', (req, res) => {
    const origin = req.headers.origin;
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.status(200).json({ msg: 'CORS check passed.' });
});

// ✅ Handle unknown routes
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// ✅ Global error handler
app.use(globalErrorHandler);

module.exports = app;
