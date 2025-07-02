// backend/routes/summaryRoutes.js
const express = require('express');
const router = express.Router();

// Import all necessary models that are currently implemented
const Zone = require('../models/Zone');
const City = require('../models/City');
const Class = require('../models/Class');
const Publication = require('../models/Publication');
const Language = require('../models/Language');
const BookCatalog = require('../models/BookCatalog');
const StationeryItem = require('../models/StationeryItem');
const Customer = require('../models/Customer');
const Transport = require('../models/Transport'); // <--- NEW: Import Transport model

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

// Route to get the total count of Languages
router.get('/languages', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), catchAsync(async (req, res, next) => {
    const count = await getCount(Language);
    res.status(200).json({ success: true, data: { count }, message: 'Total Languages fetched successfully' });
}));

// Route to get the total count of BookCatalogs
router.get('/book-catalogs', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), catchAsync(async (req, res, next) => {
    const count = await getCount(BookCatalog);
    res.status(200).json({ success: true, data: { count }, message: 'Total Book Catalogs fetched successfully' });
}));

// Route to get the total count of StationeryItems
router.get('/stationery-items', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), catchAsync(async (req, res, next) => {
    const count = await getCount(StationeryItem);
    res.status(200).json({ success: true, data: { count }, message: 'Total Stationery Items fetched successfully' });
}));

// Route to get the total count of Customers
router.get('/customers', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), catchAsync(async (req, res, next) => {
    const count = await getCount(Customer);
    res.status(200).json({ success: true, data: { count }, message: 'Total Customers fetched successfully' });
}));

// <--- NEW: Route to get the total count of Transports
router.get('/transports', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), catchAsync(async (req, res, next) => {
    const count = await getCount(Transport);
    res.status(200).json({ success: true, data: { count }, message: 'Total Transports fetched successfully' });
}));

module.exports = router;
