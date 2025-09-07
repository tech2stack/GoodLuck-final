// backend/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); 
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const SuperAdmin = require('../models/SuperAdmin');
const BranchAdmin = require('../models/BranchAdmin');
const Employee = require('../models/Employee');
const StockManager = require('../models/StockManager'); 
const Branch = require('../models/Branch'); // Branch model ko import karein
const mongoose = require('mongoose'); // <<< ZAROORI: mongoose ko import karein ObjectId.isValid ke liye

// Helper function to sign the JWT token
const signToken = id => {
    if (process.env.NODE_ENV !== 'production') {
        console.log('DEBUG: JWT_EXPIRES_IN value:', process.env.JWT_EXPIRES_IN);
        console.log('DEBUG: Type of JWT_EXPIRES_IN:', typeof process.env.JWT_EXPIRES_IN);
    }

    const expiresIn = process.env.JWT_EXPIRES_IN || '90d'; 

    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: expiresIn
    });
};

// Helper function to create JWT and send it in a cookie
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    const cookieExpiresInDays = parseInt(process.env.JWT_COOKIE_EXPIRES_IN, 10);
    const validCookieExpiresInDays = isNaN(cookieExpiresInDays) ? 90 : cookieExpiresInDays; 

    const cookieExpirationDate = new Date(
        Date.now() + validCookieExpiresInDays * 24 * 60 * 60 * 1000
    );

    const cookieOptions = {
        expires: cookieExpirationDate,
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax'  // Changed to 'None' for cross-origin in production
    };

    res.cookie('jwt', token, cookieOptions);

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
    const { identifier, password } = req.body; 

    if (!identifier || !password) {
        return next(new AppError('Please provide email/username and password!', 400));
    }

    let user = await SuperAdmin.findOne({ $or: [{ username: identifier }, { email: identifier }] }).select('+password');
    if (!user) {
        user = await BranchAdmin.findOne({ email: identifier }).select('+password');
    }
    if (!user) {
        user = await Employee.findOne({ email: identifier }).select('+password');
    }
    if (!user) { 
        user = await StockManager.findOne({ email: identifier }).select('+password');
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
        expires: new Date(Date.now() + 10 * 1000), 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax'  // Consistent with login
    });
    res.status(200).json({ status: 'success' });
};

// <<< Naya: getMe function yahan se shuru hota hai >>>
exports.getMe = catchAsync(async (req, res, next) => {
    if (!req.user || !req.user.id) {
        return next(new AppError('User not logged in or token invalid', 401));
    }

    const user = req.user; 
    
    let branchName = 'N/A'; 

    if (process.env.NODE_ENV !== 'production') {
        console.log('DEBUG: Logged in user:', user.name, 'Role:', user.role, 'Branch ID from user:', user.branchId); 
    }

    if (user.role === 'branch_admin' && user.branchId) {
        if (!mongoose.Types.ObjectId.isValid(user.branchId)) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('ERROR: Invalid branchId format:', user.branchId);
            }
            branchName = 'Invalid Branch ID';
        } else {
            const branch = await Branch.findById(user.branchId);
            if (process.env.NODE_ENV !== 'production') {
                console.log('DEBUG: Branch found by ID:', branch ? branch.name : 'Not Found'); 
            }
            if (branch) {
                branchName = branch.name;
            } else {
                if (process.env.NODE_ENV !== 'production') {
                    console.warn(`Branch details not found in DB for ID: ${user.branchId}`);
                }
                branchName = 'Unknown Branch';
            }
        }
    } else if (user.role === 'super_admin') {
        branchName = 'Head Office'; 
    }

    res.status(200).json({
        status: 'success',
        data: {
            user: {
                _id: user._id,
                name: user.name, 
                email: user.email,
                role: user.role,
                branchId: user.branchId || null, 
                branchName: branchName 
            }
        }
    });
});
// <<< Naya: getMe function yahan khatam hota hai >>>