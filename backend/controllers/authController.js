const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Assuming you use bcryptjs for password hashing
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const SuperAdmin = require('../models/SuperAdmin');
const BranchAdmin = require('../models/BranchAdmin');
const Employee = require('../models/Employee');

// Helper function to sign the JWT token
const signToken = id => {
    // These console logs are good for debugging, keep them for now if needed,
    // otherwise, you can remove them after confirming the fix.
    console.log('DEBUG: JWT_EXPIRES_IN value:', process.env.JWT_EXPIRES_IN);
    console.log('DEBUG: Type of JWT_EXPIRES_IN:', typeof process.env.JWT_EXPIRES_IN);

    // Ensure JWT_EXPIRES_IN is provided. If not, use a default (e.g., '90d' for 90 days)
    const expiresIn = process.env.JWT_EXPIRES_IN || '90d'; 

    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: expiresIn
    });
};

// Helper function to create JWT and send it in a cookie
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    // --- FIX START: Robust cookie expiration calculation ---
    // Ensure JWT_COOKIE_EXPIRES_IN is parsed as an integer.
    // Use a fallback (e.g., 90 days) if the environment variable is missing or invalid.
    const cookieExpiresInDays = parseInt(process.env.JWT_COOKIE_EXPIRES_IN, 10);
    const validCookieExpiresInDays = isNaN(cookieExpiresInDays) ? 90 : cookieExpiresInDays; // Default to 90 if invalid

    // Calculate cookie expiration date
    const cookieExpirationDate = new Date(
        Date.now() + validCookieExpiresInDays * 24 * 60 * 60 * 1000
    );

    const cookieOptions = {
        expires: cookieExpirationDate,
        httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
        secure: process.env.NODE_ENV === 'production', // Send cookie only over HTTPS in production
        sameSite: 'Lax' // Recommended for CSRF protection and modern browser compatibility
    };
    // --- FIX END ---

    res.cookie('jwt', token, cookieOptions);

    // Remove password from output before sending response
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

exports.login = catchAsync(async (req, res, next) => {
    const { identifier, password } = req.body; // Use 'identifier' to cover username/email

    if (!identifier || !password) {
        return next(new AppError('Please provide email/username and password!', 400));
    }

    // Check if user exists and password is correct across different roles
    let user = await SuperAdmin.findOne({ $or: [{ username: identifier }, { email: identifier }] }).select('+password');
    if (!user) {
        user = await BranchAdmin.findOne({ email: identifier }).select('+password');
    }
    if (!user) {
        user = await Employee.findOne({ email: identifier }).select('+password');
    }

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect credentials (email/username or password)', 401));
    }

    createSendToken(user, 200, res);
});

exports.registerSuperAdmin = catchAsync(async (req, res, next) => {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
        return next(new AppError('Please provide name, username, email, and password.', 400));
    }

    const existingSuperAdmin = await SuperAdmin.findOne({ $or: [{ username }, { email }] });
    if (existingSuperAdmin) {
        return next(new AppError('A Super Admin with this username or email already exists.', 409));
    }

    const newSuperAdmin = await SuperAdmin.create({
        name,
        username,
        email,
        password,
        role: 'super_admin',
        status: 'active'
    });

    createSendToken(newSuperAdmin, 201, res);
});

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000), // Expires in 10 seconds to clear immediately
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax'
    });
    res.status(200).json({ status: 'success' });
};