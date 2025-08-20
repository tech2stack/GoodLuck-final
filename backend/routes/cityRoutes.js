// backend/routes/cityRoutes.js
const express = require('express');
const router = express.Router();
const City = require('../models/City');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const authController = require('../middleware/authMiddleware');

const checkCityExists = catchAsync(async (req, res, next) => {
    const cityItem = await City.findById(req.params.id);
    if (!cityItem) {
        return next(new AppError('No city found with that ID', 404));
    }
    req.cityItem = cityItem;
    next();
});

router.get('/', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), catchAsync(async (req, res, next) => {
    const cities = await City.find();
    res.status(200).json({
        status: 'success',
        results: cities.length,
        data: {
            cities
        }
    });
}));

router.post('/', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), catchAsync(async (req, res, next) => {
    const newCity = await City.create(req.body);
    res.status(201).json({
        status: 'success',
        data: {
            city: newCity
        }
    });
}));

// Yahaan pe "assignedSalesRepresentative" field ko update kiya gaya hai
router.patch('/:id', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), checkCityExists, catchAsync(async (req, res, next) => {
    const allowedUpdates = { 
        name: req.body.name, 
        zone: req.body.zone, 
        status: req.body.status, 
        assignedSalesRepresentative: req.body.assignedSalesRepresentative // Naya field yahaan add karein
    };
    const filteredBody = Object.fromEntries(Object.entries(allowedUpdates).filter(([_, v]) => v != null));

    if (Object.keys(filteredBody).length === 0) {
        return next(new AppError('No valid fields provided for update. Only name, zone, status, and assigned sales representative can be updated.', 400));
    }

    const updatedCity = await City.findByIdAndUpdate(req.params.id, filteredBody, {
        new: true,
        runValidators: true
    });

    const populatedUpdatedCity = await City.findById(updatedCity._id);
    res.status(200).json({
        status: 'success',
        data: {
            city: populatedUpdatedCity
        }
    });
}));

router.delete('/:id', authController.protect, authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), checkCityExists, catchAsync(async (req, res, next) => {
    await City.findByIdAndDelete(req.params.id);
    res.status(204).json({
        status: 'success',
        data: null
    });
}));

module.exports = router;