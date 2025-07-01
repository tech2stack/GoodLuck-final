// backend/controllers/stationeryItemController.js
const StationeryItem = require('../models/StationeryItem');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');

// Create a new Stationery Item
exports.createStationeryItem = catchAsync(async (req, res, next) => {
    const { name, price, status } = req.body;

    if (!name || price === undefined || price === null) {
        return next(new AppError('Item name and price are required', 400));
    }

    const newStationeryItem = await StationeryItem.create({ name, price, status });

    res.status(201).json({
        status: 'success',
        data: {
            stationeryItem: newStationeryItem
        },
        message: 'Stationery Item created successfully!'
    });
});

// Get all Stationery Items (with filtering, sorting, pagination)
exports.getAllStationeryItems = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(StationeryItem.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const stationeryItems = await features.query;

    const totalCount = await StationeryItem.countDocuments(features.filterQuery);

    res.status(200).json({
        status: 'success',
        results: stationeryItems.length,
        data: {
            stationeryItems
        },
        totalCount
    });
});

// Get a single Stationery Item by ID
exports.getStationeryItem = catchAsync(async (req, res, next) => {
    const stationeryItem = await StationeryItem.findById(req.params.id);

    if (!stationeryItem) {
        return next(new AppError('No stationery item found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            stationeryItem
        }
    });
});

// Update a Stationery Item by ID
exports.updateStationeryItem = catchAsync(async (req, res, next) => {
    const { name, price, status } = req.body;
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (price !== undefined) updateFields.price = price;
    if (status !== undefined) updateFields.status = status;

    if (Object.keys(updateFields).length === 0) {
        return next(new AppError('No valid fields provided for update. Only name, price, and status can be updated.', 400));
    }

    const updatedStationeryItem = await StationeryItem.findByIdAndUpdate(req.params.id, updateFields, {
        new: true,
        runValidators: true
    });

    if (!updatedStationeryItem) {
        return next(new AppError('No stationery item found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            stationeryItem: updatedStationeryItem
        },
        message: 'Stationery Item updated successfully!'
    });
});

// Delete a Stationery Item by ID
exports.deleteStationeryItem = catchAsync(async (req, res, next) => {
    const stationeryItem = await StationeryItem.findByIdAndDelete(req.params.id);

    if (!stationeryItem) {
        return next(new AppError('No stationery item found with that ID', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null,
        message: 'Stationery Item deleted successfully!'
    });
});
