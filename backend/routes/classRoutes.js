// backend/routes/classRoutes.js
const express = require('express');
const router = express.Router();
const Class = require('../models/Class'); // Import the Class model
const AppError = require('../utils/appError'); // Assuming you have this utility
const catchAsync = require('../utils/catchAsync'); // Assuming you have this utility
const authController = require('../middleware/authMiddleware'); // Your authMiddleware for protect and restrictTo

// Middleware to check if a class exists
const checkClassExists = catchAsync(async (req, res, next) => {
    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
        return next(new AppError('No class found with that ID', 404));
    }
    req.classItem = classItem; // Attach the class to the request for later use
    next();
});

// GET all Classes (Accessible by super_admin, branch_admin, stock_manager)
router.get('/', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), catchAsync(async (req, res, next) => {
    const classes = await Class.find(); // Find all classes
    res.status(200).json({
        status: 'success',
        results: classes.length,
        data: {
            classes // Send the found classes
        }
    });
}));

// GET a single Class by ID (Accessible by super_admin, branch_admin, stock_manager)
router.get('/:id', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), checkClassExists, (req, res, next) => {
    // req.classItem is already set by checkClassExists middleware
    res.status(200).json({
        status: 'success',
        data: {
            class: req.classItem
        }
    });
});

// CREATE a new Class (Accessible by super_admin, branch_admin, stock_manager)
router.post('/', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), catchAsync(async (req, res, next) => {
    const { name, status } = req.body; // Only name and status are expected now
    if (!name) {
        return next(new AppError('Class name is required', 400));
    }

    const newClass = await Class.create({ name, status }); // Create with name and status
    res.status(201).json({
        status: 'success',
        data: {
            class: newClass
        }
    });
}));

// UPDATE a Class by ID (Accessible by super_admin, branch_admin, stock_manager)
router.patch('/:id', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), checkClassExists, catchAsync(async (req, res, next) => {
    // Allow only 'name' and 'status' to be updated via body, ignore other fields
    const allowedUpdates = { name: req.body.name, status: req.body.status };
    const filteredBody = Object.fromEntries(Object.entries(allowedUpdates).filter(([_, v]) => v != null));

    if (Object.keys(filteredBody).length === 0) {
        return next(new AppError('No valid fields provided for update. Only name and status can be updated.', 400));
    }

    const updatedClass = await Class.findByIdAndUpdate(req.params.id, filteredBody, {
        new: true, // Return the modified document rather than the original
        runValidators: true // Run schema validators on update
    });

    res.status(200).json({
        status: 'success',
        data: {
            class: updatedClass
        }
    });
}));

// DELETE a Class by ID (Accessible by super_admin, branch_admin, stock_manager)
router.delete('/:id', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), checkClassExists, catchAsync(async (req, res, next) => {
    await Class.findByIdAndDelete(req.params.id);
    res.status(204).json({ // 204 No Content for successful deletion
        status: 'success',
        data: null
    });
}));

module.exports = router;
