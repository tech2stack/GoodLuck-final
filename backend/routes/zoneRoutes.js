// backend/routes/zoneRoutes.js
const express = require('express');
const router = express.Router();
const Zone = require('../models/Zone'); // Import the Zone model
const AppError = require('../utils/appError'); // Assuming you have this utility
const catchAsync = require('../utils/catchAsync'); // Assuming you have this utility
const authController = require('../middleware/authMiddleware'); // Your authMiddleware for protect and restrictTo

// Middleware to check if a zone exists
const checkZoneExists = catchAsync(async (req, res, next) => {
    const zoneItem = await Zone.findById(req.params.id);
    if (!zoneItem) {
        return next(new AppError('No zone found with that ID', 404));
    }
    req.zoneItem = zoneItem; // Attach the zone to the request for later use
    next();
});

// GET all Zones (Accessible by super_admin, branch_admin, stock_manager)
router.get('/', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), catchAsync(async (req, res, next) => {
    const zones = await Zone.find(); // Find all zones
    res.status(200).json({
        status: 'success',
        results: zones.length,
        data: {
            zones // Send the found zones
        }
    });
}));

// GET a single Zone by ID (Accessible by super_admin, branch_admin, stock_manager)
router.get('/:id', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), checkZoneExists, (req, res, next) => {
    // req.zoneItem is already set by checkZoneExists middleware
    res.status(200).json({
        status: 'success',
        data: {
            zone: req.zoneItem
        }
    });
});

// CREATE a new Zone (Accessible by super_admin, branch_admin, stock_manager)
router.post('/', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), catchAsync(async (req, res, next) => {
    const { name, status } = req.body; // Only name and status are expected
    if (!name) {
        return next(new AppError('Zone name is required', 400));
    }

    const newZone = await Zone.create({ name, status }); // Create with name and status
    res.status(201).json({
        status: 'success',
        data: {
            zone: newZone
        }
    });
}));

// UPDATE a Zone by ID (Accessible by super_admin, branch_admin, stock_manager)
router.patch('/:id', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), checkZoneExists, catchAsync(async (req, res, next) => {
    // Allow only 'name' and 'status' to be updated via body, ignore other fields
    const allowedUpdates = { name: req.body.name, status: req.body.status };
    const filteredBody = Object.fromEntries(Object.entries(allowedUpdates).filter(([_, v]) => v != null));

    if (Object.keys(filteredBody).length === 0) {
        return next(new AppError('No valid fields provided for update. Only name and status can be updated.', 400));
    }

    const updatedZone = await Zone.findByIdAndUpdate(req.params.id, filteredBody, {
        new: true, // Return the modified document rather than the original
        runValidators: true // Run schema validators on update
    });

    res.status(200).json({
        status: 'success',
        data: {
            zone: updatedZone
        }
    });
}));

// DELETE a Zone by ID (Accessible by super_admin, branch_admin, stock_manager)
router.delete('/:id', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), checkZoneExists, catchAsync(async (req, res, next) => {
    await Zone.findByIdAndDelete(req.params.id);
    res.status(204).json({ // 204 No Content for successful deletion
        status: 'success',
        data: null
    });
}));

module.exports = router;
