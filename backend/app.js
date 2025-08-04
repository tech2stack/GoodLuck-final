// backend/app.js

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
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const mainRouter = require('./routes/index');
const db = require('./config/db');

const app = express();

// --- CORS Configuration ---
let allowedOrigins = [];

if (process.env.NODE_ENV === 'production') {
    if (process.env.FRONTEND_PROD_URL) {
        allowedOrigins.push(process.env.FRONTEND_PROD_URL);
    }
} else {
    if (process.env.FRONTEND_DEV_URL) {
        allowedOrigins.push(process.env.FRONTEND_DEV_URL);
    }

    // Common development and preview URLs
    allowedOrigins.push('http://localhost:3000'); // React
    allowedOrigins.push('http://localhost:5173'); // Vite
    allowedOrigins.push('https://goodluckstore.tech2stack.com'); // ✅ No trailing slash
}

console.log("✅ Allowed Origins:", allowedOrigins);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        console.warn(`CORS Error: Origin ${origin} not allowed. Allowed: ${allowedOrigins.join(', ')}`);
        callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true
}));

// Log incoming request origins
app.use((req, res, next) => {
    console.log('🔍 Request Origin:', req.headers.origin || 'No Origin Header');
    next();
});

// --- Security Middleware ---
app.use(helmet());

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

const limiter = rateLimit({
    max: 1000,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res) => {
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }
}));

// --- API Routes ---
app.use('/api/v1', mainRouter);

app.get('/', (req, res) => {
    res.status(200).json({ status: 'success', message: '✅ GoodLuck API is running.' });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/cors-check', (req, res) => {
    res.status(200).json({ msg: 'CORS check passed for this endpoint.' });
});

// --- Error Handling ---
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
