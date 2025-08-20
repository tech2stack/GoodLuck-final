// backend/controllers/customerController.js
const Customer = require('../models/Customer');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const path = require('path');
const fs = require('fs');

// CHANGES: populateCustomerQuery function mein 'salesBy' field ko populate kiya gaya hai.
const populateCustomerQuery = (query) => {
    return query
        .populate({
            path: 'branch',
            select: 'name'
        })
        .populate({
            path: 'city',
            select: 'name'
        })
        .populate({
            path: 'salesBy',
            select: 'name'
        });
};

// Create a new Customer
exports.createCustomer = catchAsync(async (req, res, next) => {
    const {
        customerName, schoolCode, branch, city, contactPerson, mobileNumber,
        email, gstNumber, aadharNumber, panNumber, shopAddress, homeAddress, status,
        salesBy, customerType, discount, returnTime,
        bankName, accountNumber, ifscCode, openingBalance, balanceType
    } = req.body;

    if (customerType && customerType.startsWith('School')) {
        if (!branch) {
             return next(new AppError('For School customers, Branch is required.', 400));
        }
        if (!schoolCode) {
            return next(new AppError('For School customers, School Code is required.', 400));
        }
    }

    const { chequeImage, passportImage, otherAttachment } = req.files;

    const newCustomer = await Customer.create({
        customerName, schoolCode, branch, city, contactPerson, mobileNumber,
        email, gstNumber, aadharNumber, panNumber, shopAddress, homeAddress, status,
        salesBy, customerType, discount, returnTime,
        bankName, accountNumber, ifscCode, openingBalance, balanceType,
        chequeImage: chequeImage ? chequeImage[0].filename : null,
        passportImage: passportImage ? passportImage[0].filename : null,
        otherAttachment: otherAttachment ? otherAttachment[0].filename : null,
    });

    res.status(201).json({
        status: 'success',
        data: {
            customer: newCustomer
        }
    });
});

// Get all Customers with filters, sorting, and pagination
exports.getAllCustomers = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(
        populateCustomerQuery(Customer.find()),
        req.query
    )
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const customers = await features.query;
    const totalCount = await Customer.countDocuments(features.filterQuery);

    res.status(200).json({
        status: 'success',
        totalRecords: totalCount,
        results: customers.length,
        data: {
            customers
        }
    });
});

// Get a single Customer by ID
exports.getCustomer = catchAsync(async (req, res, next) => {
    const customer = await populateCustomerQuery(Customer.findById(req.params.id));

    if (!customer) {
        return next(new AppError('No customer found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            customer
        }
    });
});

// Update a Customer by ID
exports.updateCustomer = catchAsync(async (req, res, next) => {
    const updateData = { ...req.body };
    const { chequeImage, passportImage, otherAttachment } = req.files;

    if (chequeImage) {
        updateData.chequeImage = chequeImage[0].filename;
    }
    if (passportImage) {
        updateData.passportImage = passportImage[0].filename;
    }
    if (otherAttachment) {
        updateData.otherAttachment = otherAttachment[0].filename;
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true
    });

    if (!updatedCustomer) {
        return next(new AppError('No customer found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            customer: updatedCustomer
        }
    });
});

// Delete a Customer by ID
exports.deleteCustomer = catchAsync(async (req, res, next) => {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
        return next(new AppError('No customer found with that ID', 404));
    }

    const imagePathsToDelete = [];
    if (customer.chequeImage) {
        imagePathsToDelete.push(path.join(__dirname, '..', 'uploads', customer.chequeImage));
    }
    if (customer.passportImage) {
        imagePathsToDelete.push(path.join(__dirname, '..', 'uploads', customer.passportImage));
    }
    if (customer.otherAttachment) {
        imagePathsToDelete.push(path.join(__dirname, '..', 'uploads', customer.otherAttachment));
    }
    
    imagePathsToDelete.forEach(imagePath => {
        fs.unlink(imagePath, (err) => {
            if (err) {
                console.error(`Failed to delete customer image file at ${imagePath}:`, err);
            } else {
                console.log(`Successfully deleted file at ${imagePath}`);
            }
        });
    });

    await Customer.findByIdAndDelete(req.params.id);

    res.status(204).json({
        status: 'success',
        data: null
    });
});