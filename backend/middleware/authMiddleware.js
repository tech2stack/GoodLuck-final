// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Directly import all user models for checking roles
const SuperAdmin = require('../models/SuperAdmin');
const BranchAdmin = require('../models/BranchAdmin');
const Employee = require('../models/Employee');
const StockManager = require('../models/StockManager'); // <<< ADDED: Import StockManager model

exports.protect = catchAsync(async (req, res, next) => {
    let token;
    // Get token from header (Bearer token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) { // Check for token in cookies
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // Verify token
    let decoded;
    try {
        decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('JWT verification failed:', err.message);
        }
        return next(new AppError('Invalid or expired token. Please log in again.', 401));
    }

    // Check if user still exists across all possible user types
    let currentUser;
    currentUser = await SuperAdmin.findById(decoded.id);
    if (!currentUser) {
        currentUser = await BranchAdmin.findById(decoded.id);
    }
    if (!currentUser) {
        currentUser = await Employee.findById(decoded.id);
    }
    if (!currentUser) { // <<< ADDED: Check for StockManager
        currentUser = await StockManager.findById(decoded.id);
    }

    if (!currentUser) {
        return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // Optional: Check if user changed password after the token was issued
    // if (currentUser.passwordChangedAt) {
    //     const changedTimestamp = parseInt(currentUser.passwordChangedAt.getTime() / 1000, 10);
    //     if (decoded.iat < changedTimestamp) {
    //         return next(new AppError('User recently changed password! Please log in again.', 401));
    //     }
    // }

    // Grant access to protected route
    req.user = currentUser;
    res.locals.user = currentUser; // Useful if using template engines for server-side rendering
    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles is an array like ['super_admin', 'branch_admin']
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action.', 403));
        }
        next();
    };
};