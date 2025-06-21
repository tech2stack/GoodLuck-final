// backend/routes/stockManagerRoutes.js
const express = require('express');
const router = express.Router(); // Corrected: Use express.Router()
const StockManager = require('../models/StockManager');
const bcrypt = require('bcryptjs'); // Make sure bcryptjs is required for password hashing in update route

// --- IMPORTANT CHANGE HERE ---
// Import your combined authentication and authorization middleware from authMiddleware.js
const authController = require('../middleware/authMiddleware'); // This file contains both protect and restrictTo functions


// Get all Stock Managers (Super Admin only)
router.get(
    '/',
    authController.protect, // Use the protect function for authentication
    authController.restrictTo('super_admin'), // Use the restrictTo function for authorization
    async (req, res) => {
        try {
            const stockManagers = await StockManager.find().select('-password'); // Exclude password
            res.status(200).json({ success: true, data: stockManagers, message: "Stock Managers fetched successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

// Create a new Stock Manager (Super Admin only)
router.post(
    '/',
    authController.protect, // Use the protect function for authentication
    authController.restrictTo('super_admin'), // Use the restrictTo function for authorization
    async (req, res) => {
        try {
            const { name, email, phone, password, address } = req.body;

            // Basic validation
            if (!name || !email || !phone || !password || !address) {
                return res.status(400).json({ success: false, message: 'All fields are required.' });
            }

            const existingManager = await StockManager.findOne({ $or: [{ email }, { phone }] });
            if (existingManager) {
                return res.status(400).json({ success: false, message: 'Email or Phone already exists.' });
            }

            const stockManager = new StockManager({ name, email, phone, password, address });
            await stockManager.save();
            res.status(201).json({ success: true, data: stockManager.toObject({ getters: true, virtuals: false }), message: "Stock Manager created successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

// Get a single Stock Manager by ID (Super Admin only)
router.get(
    '/:id',
    authController.protect, // Use the protect function for authentication
    authController.restrictTo('super_admin'), // Use the restrictTo function for authorization
    async (req, res) => {
        try {
            const stockManager = await StockManager.findById(req.params.id).select('-password');
            if (!stockManager) {
                return res.status(404).json({ success: false, message: 'Stock Manager not found' });
            }
            res.status(200).json({ success: true, data: stockManager, message: "Stock Manager fetched successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

// Update a Stock Manager by ID (Super Admin only)
router.put(
    '/:id',
    authController.protect, // Use the protect function for authentication
    authController.restrictTo('super_admin'), // Use the restrictTo function for authorization
    async (req, res) => {
        try {
            const { name, email, phone, password, address } = req.body;
            const updates = { name, email, phone, address };

            if (password) {
                // Ensure bcrypt is available for hashing
                const salt = await bcrypt.genSalt(10);
                updates.password = await bcrypt.hash(password, salt);
            }

            const updatedStockManager = await StockManager.findByIdAndUpdate(
                req.params.id,
                updates,
                { new: true, runValidators: true }
            ).select('-password');

            if (!updatedStockManager) {
                return res.status(404).json({ success: false, message: 'Stock Manager not found' });
            }
            res.status(200).json({ success: true, data: updatedStockManager, message: "Stock Manager updated successfully" });
        } catch (error) {
            // Handle unique constraint errors for email/phone
            if (error.code === 11000) { // MongoDB duplicate key error
                const field = Object.keys(error.keyValue)[0];
                return res.status(400).json({ success: false, message: `${field} '${error.keyValue[field]}' is already in use.` });
            }
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

// Delete a Stock Manager by ID (Super Admin only)
router.delete(
    '/:id',
    authController.protect, // Use the protect function for authentication
    authController.restrictTo('super_admin'), // Use the restrictTo function for authorization
    async (req, res) => {
        try {
            const deletedStockManager = await StockManager.findByIdAndDelete(req.params.id);
            if (!deletedStockManager) {
                return res.status(404).json({ success: false, message: 'Stock Manager not found' });
            }
            res.status(200).json({ success: true, message: 'Stock Manager deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

module.exports = router;