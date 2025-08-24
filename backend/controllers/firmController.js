const Firm = require('../models/Firm');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Create a new Firm
exports.createFirm = catchAsync(async (req, res, next) => {
    const { name } = req.body;

    if (!name) {
        return next(new AppError('Firm name is required.', 400));
    }

    try {
        const newFirm = await Firm.create({ name });
        res.status(201).json({
            status: 'success',
            data: {
                firm: newFirm
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return next(new AppError(`Duplicate firm name: ${name}. Please use a unique name.`, 400));
        }
        return next(new AppError(error.message || 'Failed to create firm.', 400));
    }
});

// Get all Firms
exports.getAllFirms = catchAsync(async (req, res, next) => {
    const firms = await Firm.find().sort('name');

    res.status(200).json({
        status: 'success',
        results: firms.length,
        data: {
            firms
        }
    });
});

// Get a single Firm by ID
exports.getFirm = catchAsync(async (req, res, next) => {
    const firm = await Firm.findById(req.params.id);

    if (!firm) {
        return next(new AppError('No firm found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            firm
        }
    });
});

// Update a Firm by ID
exports.updateFirm = catchAsync(async (req, res, next) => {
    const { name } = req.body;

    if (!name) {
        return next(new AppError('Firm name is required.', 400));
    }

    try {
        const updatedFirm = await Firm.findByIdAndUpdate(
            req.params.id,
            { name },
            { new: true, runValidators: true }
        );

        if (!updatedFirm) {
            return next(new AppError('No firm found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                firm: updatedFirm
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return next(new AppError(`Duplicate firm name: ${name}. Please use a unique name.`, 400));
        }
        return next(new AppError(error.message || 'Failed to update firm.', 400));
    }
});

// Delete a Firm by ID
exports.deleteFirm = catchAsync(async (req, res, next) => {
    // Check if the firm is associated with any customers
    const customerCount = await Customer.countDocuments({ firm: req.params.id });
    if (customerCount > 0) {
        return next(new AppError('Cannot delete firm because it is associated with customers.', 400));
    }

    const firm = await Firm.findByIdAndDelete(req.params.id);

    if (!firm) {
        return next(new AppError('No firm found with that ID', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});