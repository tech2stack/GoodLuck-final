// backend/controllers/customerController.js
const Customer = require('../models/Customer');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const path = require('path');
const fs = require('fs');

const populateCustomerQuery = (query) => {
    return query
        .populate({
            path: 'branch',
            select: 'name'
        })
        .populate({
            path: 'city',
            select: 'name'
        });
};

// Create a new Customer
exports.createCustomer = catchAsync(async (req, res, next) => {
    const {
        customerName, schoolCode, branch, city, contactPerson, mobileNumber,
        email, gstNumber, aadharNumber, panNumber, shopAddress, homeAddress, status,
        zone, salesBy, dealer, customerType, discount, returnTime,
        bankName, accountNumber, ifscCode, openingBalance, balanceType
    } = req.body;

    // Conditional validation for 'School-Retail' customers
    if (customerType === 'School-Retail') {
        if (!branch) {
             return next(new AppError('For School-Retail customers, Branch is required.', 400));
        }
        if (!schoolCode) {
             return next(new AppError('For School-Retail customers, School Code is required.', 400));
        }
    }

    // Prepare image paths from uploaded files
    const chequeImagePath = req.files?.chequeImage?.[0]?.filename ? `/customer-logos/${req.files.chequeImage[0].filename}` : undefined;
    const passportImagePath = req.files?.passportImage?.[0]?.filename ? `/customer-logos/${req.files.passportImage[0].filename}` : undefined;
    const otherAttachmentPath = req.files?.otherAttachment?.[0]?.filename ? `/customer-logos/${req.files.otherAttachment[0].filename}` : undefined;

    const newCustomer = await Customer.create({
        customerName,
        schoolCode,
        branch: branch || null, // Ensure branch is saved as null if not provided
        city,
        contactPerson,
        mobileNumber,
        email,
        gstNumber,
        aadharNumber,
        panNumber,
        shopAddress,
        homeAddress,
        status,
        zone,
        salesBy,
        dealer,
        customerType,
        discount,
        returnTime,
        bankName,
        accountNumber,
        ifscCode,
        openingBalance,
        balanceType,
        chequeImage: chequeImagePath,
        passportImage: passportImagePath,
        otherAttachment: otherAttachmentPath // New field
    });

    res.status(201).json({
        status: 'success',
        data: {
            customer: newCustomer
        }
    });
});

// Update a Customer by ID
exports.updateCustomer = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const {
        customerName, schoolCode, branch, city, contactPerson, mobileNumber,
        email, gstNumber, aadharNumber, panNumber, shopAddress, homeAddress, status,
        zone, salesBy, dealer, customerType, discount, returnTime,
        bankName, accountNumber, ifscCode, openingBalance, balanceType
    } = req.body;

    // Conditional validation for 'School-Retail' customers
    if (customerType === 'School-Retail') {
        if (!branch) {
             return next(new AppError('For School-Retail customers, Branch is required.', 400));
        }
        if (!schoolCode) {
             return next(new AppError('For School-Retail customers, School Code is required.', 400));
        }
    }

    const updatedData = { ...req.body };

    // Handle image file uploads
    if (req.files?.chequeImage && req.files.chequeImage.length > 0) {
        updatedData.chequeImage = `/customer-logos/${req.files.chequeImage[0].filename}`;
    }
    if (req.files?.passportImage && req.files.passportImage.length > 0) {
        updatedData.passportImage = `/customer-logos/${req.files.passportImage[0].filename}`;
    }
    if (req.files?.otherAttachment && req.files.otherAttachment.length > 0) {
        updatedData.otherAttachment = `/customer-logos/${req.files.otherAttachment[0].filename}`;
    }

    const customer = await Customer.findByIdAndUpdate(id, updatedData, {
        new: true,
        runValidators: true
    });

    if (!customer) {
        return next(new AppError('No customer found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: { customer }
    });
});

// Get all Customers
exports.getAllCustomers = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(Customer.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const customers = await populateCustomerQuery(features.query);
    const totalCount = await Customer.countDocuments(features.filter().query);

    res.status(200).json({
        status: 'success',
        totalRecords: totalCount,
        results: customers.length,
        data: { customers }
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
        data: { customer }
    });
});

// Delete a Customer by ID
exports.deleteCustomer = catchAsync(async (req, res, next) => {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
        return next(new AppError('No customer found with that ID', 404));
    }

    // Delete the associated image files if they exist
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
    
    // Asynchronously delete all files
    imagePathsToDelete.forEach(imagePath => {
        fs.unlink(imagePath, (err) => {
            if (err) {
                console.error(`Failed to delete customer image file at ${imagePath}:`, err);
            } else {
                console.log(`Customer image deleted successfully at ${imagePath}`);
            }
        });
    });

    await Customer.findByIdAndDelete(req.params.id);

    res.status(204).json({
        status: 'success',
        data: null
    });
});