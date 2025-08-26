// backend/controllers/stationeryItemController.js
const StationeryItem = require('../models/StationeryItem');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// 1. Create a new Stationery Item
exports.createStationeryItem = catchAsync(async (req, res, next) => {
    // NEW: Include all fields in destructuring
    const { itemName, category, price, marginPercentage, customerDiscountPercentage, companyDiscountPercentage, status } = req.body;

    // Basic validation
    // NEW: Validate all new fields
    if (!itemName || !category || price === undefined || price === null || price < 0 || marginPercentage === undefined || marginPercentage === null || marginPercentage < 0 || marginPercentage > 100 || customerDiscountPercentage === undefined || customerDiscountPercentage === null || customerDiscountPercentage < 0 || companyDiscountPercentage === undefined || companyDiscountPercentage === null || companyDiscountPercentage < 0) {
        return next(new AppError('Item Name, Category, a non-negative Price, a valid Margin Percentage (0-100), a non-negative Customer Discount, and a non-negative Company Discount are required.', 400));
    }

    // Check for duplicate item name
    const existingItem = await StationeryItem.findOne({ itemName });
    if (existingItem) {
        return next(new AppError('A stationery item with this name already exists.', 409));
    }

    // NEW: Include all fields in the creation
    const newItem = await StationeryItem.create({ itemName, category, price, marginPercentage, customerDiscountPercentage, companyDiscountPercentage, status });

    res.status(201).json({
        status: 'success',
        data: {
            stationeryItem: newItem
        },
        message: 'Stationery Item created successfully!'
    });
});

// 2. Get all Stationery Items
exports.getAllStationeryItems = catchAsync(async (req, res, next) => {
    const stationeryItems = await StationeryItem.find();

    res.status(200).json({
        status: 'success',
        results: stationeryItems.length,
        data: {
            stationeryItems
        },
    });
});

// 3. Get a single Stationery Item
exports.getStationeryItem = catchAsync(async (req, res, next) => {
    const item = await StationeryItem.findById(req.params.id);

    if (!item) {
        return next(new AppError('No stationery item found with that ID.', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            stationeryItem: item
        },
    });
});

// 4. Update a Stationery Item
exports.updateStationeryItem = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    // NEW: Include all fields in destructuring
    const { itemName, category, price, marginPercentage, customerDiscountPercentage, companyDiscountPercentage, status } = req.body;

    const currentItem = await StationeryItem.findById(id);
    if (!currentItem) {
        return next(new AppError('No stationery item found with that ID.', 404));
    }

    // Check if itemName is being changed
    if (itemName && itemName !== currentItem.itemName) {
        const existingItem = await StationeryItem.findOne({ itemName, _id: { $ne: id } }); // Exclude the current item being updated
        if (existingItem) {
            return next(new AppError('A stationery item with this name already exists.', 409));
        }
    }

    // Basic validation for update
    // NEW: Validate all new fields
    if ((price !== undefined && (price === null || price < 0)) || (marginPercentage !== undefined && (marginPercentage === null || marginPercentage < 0 || marginPercentage > 100)) || (customerDiscountPercentage !== undefined && (customerDiscountPercentage === null || customerDiscountPercentage < 0)) || (companyDiscountPercentage !== undefined && (companyDiscountPercentage === null || companyDiscountPercentage < 0))) {
        return next(new AppError('Price must be a non-negative number, Margin Percentage must be between 0 and 100, and Customer/Company Discounts must be non-negative.', 400));
    }

    // NEW: Include all fields in the update
    const updatedItem = await StationeryItem.findByIdAndUpdate(id, { itemName, category, price, marginPercentage, customerDiscountPercentage, companyDiscountPercentage, status }, {
        new: true,
        runValidators: true,
        context: 'query'
    });

    if (!updatedItem) {
        return next(new AppError('No stationery item found with that ID.', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            stationeryItem: updatedItem
        },
        message: 'Stationery Item updated successfully!'
    });
});

// 5. Delete a Stationery Item
exports.deleteStationeryItem = catchAsync(async (req, res, next) => {
    const item = await StationeryItem.findByIdAndDelete(req.params.id);

    if (!item) {
        return next(new AppError('No stationery item found with that ID.', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null,
        message: 'Stationery Item deleted successfully!'
    });
});