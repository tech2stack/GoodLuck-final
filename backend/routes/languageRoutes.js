// backend/routes/languageRoutes.js
const express = require('express');
const router = express.Router();
const Language = require('../models/Language'); // Import the Language model
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const authController = require('../middleware/authMiddleware');

// Middleware to check if a language exists
const checkLanguageExists = catchAsync(async (req, res, next) => {
    const languageItem = await Language.findById(req.params.id);
    if (!languageItem) {
        return next(new AppError('No language found with that ID', 404));
    }
    req.languageItem = languageItem; // Attach the language to the request for later use
    next();
});

// GET all Languages (Accessible by super_admin, branch_admin, stock_manager)
router.get('/', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), catchAsync(async (req, res, next) => {
    const languages = await Language.find(); // Find all languages
    res.status(200).json({
        status: 'success',
        results: languages.length,
        data: {
            languages // Send the found languages
        }
    });
}));

// GET a single Language by ID (Accessible by super_admin, branch_admin, stock_manager)
router.get('/:id', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), checkLanguageExists, (req, res, next) => {
    // req.languageItem is already set by checkLanguageExists middleware
    res.status(200).json({
        status: 'success',
        data: {
            language: req.languageItem
        }
    });
});

// CREATE a new Language (Accessible by super_admin, branch_admin, stock_manager)
router.post('/', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), catchAsync(async (req, res, next) => {
    const { name, status } = req.body; // Only name and status are expected
    if (!name) {
        return next(new AppError('Language name is required', 400));
    }

    const newLanguage = await Language.create({ name, status }); // Create with name and status
    res.status(201).json({
        status: 'success',
        data: {
            language: newLanguage
        }
    });
}));

// UPDATE a Language by ID (Accessible by super_admin, branch_admin, stock_manager)
router.patch('/:id', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), checkLanguageExists, catchAsync(async (req, res, next) => {
    // Allow only 'name' and 'status' to be updated via body, ignore other fields
    const allowedUpdates = { name: req.body.name, status: req.body.status };
    const filteredBody = Object.fromEntries(Object.entries(allowedUpdates).filter(([_, v]) => v != null));

    if (Object.keys(filteredBody).length === 0) {
        return next(new AppError('No valid fields provided for update. Only name and status can be updated.', 400));
    }

    const updatedLanguage = await Language.findByIdAndUpdate(req.params.id, filteredBody, {
        new: true, // Return the modified document rather than the original
        runValidators: true // Run schema validators on update
    });

    res.status(200).json({
        status: 'success',
        data: {
            language: updatedLanguage
        }
    });
}));

// DELETE a Language by ID (Accessible by super_admin, branch_admin, stock_manager)
router.delete('/:id', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), checkLanguageExists, catchAsync(async (req, res, next) => {
    await Language.findByIdAndDelete(req.params.id);
    res.status(204).json({ // 204 No Content for successful deletion
        status: 'success',
        data: null
    });
}));

module.exports = router;
