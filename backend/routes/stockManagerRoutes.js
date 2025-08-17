// backend/routes/stockManagerRoutes.js
const express = require('express');
const router = express.Router(); 
const StockManager = require('../models/StockManager');
const bcrypt = require('bcryptjs'); 
const authController = require('../middleware/authMiddleware');

// Get all Stock Managers (Super Admin only)
router.get(
    '/',
    authController.protect, 
    authController.restrictTo('super_admin'),
    async (req, res) => {
        try {
            const stockManagers = await StockManager.find().select('-password');
            res.status(200).json({ success: true, data: stockManagers, message: "Stock Managers fetched successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

// Create a new Stock Manager (Super Admin only)
router.post(
    '/',
    authController.protect,
    authController.restrictTo('super_admin'),
    async (req, res) => {
        try {
            const { name, email, phone, password, address } = req.body;

            // Basic validation
            if (!name || !email || !phone || !password || !address) {
                return res.status(400).json({ success: false, message: 'All fields are required.' });
            }

            // This check for email/phone is redundant if your database has unique constraints on them.
            // The database will throw an error if a duplicate exists anyway.
            const existingManager = await StockManager.findOne({ $or: [{ email }, { phone }] });
            if (existingManager) {
                return res.status(400).json({ success: false, message: 'Email or Phone already exists.' });
            }

            const stockManager = new StockManager({ name, email, phone, password, address });
            await stockManager.save();
            res.status(201).json({ success: true, data: stockManager.toObject({ getters: true, virtuals: false }), message: "Stock Manager created successfully" });
        } catch (error) {
             // Handle unique constraint errors for any field, including the hidden `employeeId`
            if (error.code === 11000) { // MongoDB duplicate key error
                const field = Object.keys(error.keyValue)[0];
                return res.status(400).json({ success: false, message: `${field} '${error.keyValue[field]}' is already in use.` });
            }
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

// Get a single Stock Manager by ID (Super Admin only)
router.get(
    '/:id',
    authController.protect,
    authController.restrictTo('super_admin'),
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
    authController.protect, 
    authController.restrictTo('super_admin'),
    async (req, res) => {
        try {
            const { name, email, phone, password, address } = req.body;
            const updates = { name, email, phone, address };

            if (password) {
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
            if (error.code === 11000) { 
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
    authController.protect,
    authController.restrictTo('super_admin'),
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