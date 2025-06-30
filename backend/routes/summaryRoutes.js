// backend/routes/summaryRoutes.js
const express = require('express');
const router = express.Router();

// Import only the necessary models that are currently implemented
const Zone = require('../models/Zone');
const City = require('../models/City');
const Class = require('../models/Class');
const Publication = require('../models/Publication');
const Language = require('../models/Language'); // NEW: Import Language model

// Import utility and middleware (assuming these are correctly implemented)
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const authController = require('../middleware/authMiddleware');

// Helper function for summary routes to catch errors
const getCount = async (Model, filter = {}) => {
    return await Model.countDocuments(filter);
};

// Route to get the total count of Zones
router.get('/zones', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), catchAsync(async (req, res, next) => {
    const count = await getCount(Zone);
    res.status(200).json({ success: true, data: { count }, message: 'Total Zones fetched successfully' });
}));

// Route to get the total count of Cities
router.get('/cities', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), catchAsync(async (req, res, next) => {
    const count = await getCount(City);
    res.status(200).json({ success: true, data: { count }, message: 'Total Cities fetched successfully' });
}));

// Route to get the total count of Classes
router.get('/classes', authController.protect, authController.restrictTo('stock_manager', 'super_admin'), catchAsync(async (req, res, next) => {
    const count = await getCount(Class);
    res.status(200).json({ success: true, data: { count }, message: 'Total Classes fetched successfully' });
}));

// Route to get the total count of Publications
router.get('/publications', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), catchAsync(async (req, res, next) => {
    const count = await getCount(Publication);
    res.status(200).json({ success: true, data: { count }, message: 'Total Publications fetched successfully' });
}));

// NEW: Route to get the total count of Languages
router.get('/languages', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), catchAsync(async (req, res, next) => {
    const count = await getCount(Language);
    res.status(200).json({ success: true, data: { count }, message: 'Total Languages fetched successfully' });
}));


// --- Removed/Commented out routes for unimplemented models to prevent 404 errors ---
// (These remain commented out as per previous decision)

module.exports = router;
