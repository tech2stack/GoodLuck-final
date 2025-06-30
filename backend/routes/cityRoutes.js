// backend/routes/cityRoutes.js
const express = require('express');
const router = express.Router();
const City = require('../models/City'); // Import the City model
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const authController = require('../middleware/authMiddleware');

// Middleware to check if a city exists
const checkCityExists = catchAsync(async (req, res, next) => {
    // When finding by ID, also populate the zone to ensure its name is available
    const cityItem = await City.findById(req.params.id);
    if (!cityItem) {
        return next(new AppError('No city found with that ID', 404));
    }
    req.cityItem = cityItem; // Attach the city to the request for later use
    next();
});

// GET all Cities (Accessible by super_admin, branch_admin, stock_manager)
router.get('/', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), catchAsync(async (req, res, next) => {
    // The pre-find hook in the City model will automatically populate the 'zone' field
    const cities = await City.find();
    res.status(200).json({
        status: 'success',
        results: cities.length,
        data: {
            cities
        }
    });
}));

// GET a single City by ID (Accessible by super_admin, branch_admin, stock_manager)
router.get('/:id', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), checkCityExists, (req, res, next) => {
    // req.cityItem is already set by checkCityExists middleware and populated by pre-find hook
    res.status(200).json({
        status: 'success',
        data: {
            city: req.cityItem
        }
    });
});

// CREATE a new City (Accessible by super_admin, branch_admin, stock_manager)
router.post('/', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), catchAsync(async (req, res, next) => {
    const { name, zone, status } = req.body; // Expecting name, zone (ID), and status
    if (!name || !zone) {
        return next(new AppError('City name and Zone are required', 400));
    }

    const newCity = await City.create({ name, zone, status });
    // After creation, re-fetch or populate the newCity to include zone name in response
    const populatedCity = await City.findById(newCity._id); // Re-fetch to apply populate hook
    res.status(201).json({
        status: 'success',
        data: {
            city: populatedCity
        }
    });
}));

// UPDATE a City by ID (Accessible by super_admin, branch_admin, stock_manager)
router.patch('/:id', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), checkCityExists, catchAsync(async (req, res, next) => {
    // Allow only 'name', 'zone', and 'status' to be updated
    const allowedUpdates = { name: req.body.name, zone: req.body.zone, status: req.body.status };
    const filteredBody = Object.fromEntries(Object.entries(allowedUpdates).filter(([_, v]) => v != null));

    if (Object.keys(filteredBody).length === 0) {
        return next(new AppError('No valid fields provided for update. Only name, zone, and status can be updated.', 400));
    }

    const updatedCity = await City.findByIdAndUpdate(req.params.id, filteredBody, {
        new: true,
        runValidators: true
    });

    // Populate the zone field after update to send back the name
    const populatedUpdatedCity = await City.findById(updatedCity._id);
    res.status(200).json({
        status: 'success',
        data: {
            city: populatedUpdatedCity
        }
    });
}));

// DELETE a City by ID (Accessible by super_admin, branch_admin, stock_manager)
router.delete('/:id', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), checkCityExists, catchAsync(async (req, res, next) => {
    await City.findByIdAndDelete(req.params.id);
    res.status(204).json({
        status: 'success',
        data: null
    });
}));

module.exports = router;
