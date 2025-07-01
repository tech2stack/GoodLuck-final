// backend/controllers/customerController.js
const Customer = require('../models/Customer');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const path = require('path');
const fs = require('fs'); // For file system operations

// Helper function to apply common population
const populateCustomerQuery = (query) => {
    return query
        .populate({
            path: 'branch',
            select: 'name' // Select only the name field from the Branch
        })
        .populate({
            path: 'city',
            select: 'name' // Select only the name field from the City
        });
};

// Create a new Customer
exports.createCustomer = catchAsync(async (req, res, next) => {
    console.log('req.body (createCustomer):', req.body); // DEBUG: Log incoming body
    console.log('req.file (createCustomer):', req.file); // DEBUG: Log incoming file (for .single)

    const {
        customerName, schoolCode, branch, city, contactPerson, mobileNumber,
        email, gstNumber, aadharNumber, panNumber, shopAddress, homeAddress, status
    } = req.body;

    // Basic validation for required fields
    if (!customerName || !branch || !city || !mobileNumber) {
        return next(new AppError('Customer Name, Branch, City, and Mobile Number are required.', 400));
    }

    let customerData = {
        customerName, schoolCode, branch, city, contactPerson, mobileNumber,
        email, gstNumber, aadharNumber, panNumber, shopAddress, homeAddress, status
    };

    if (req.file) { // For .single() upload
        customerData.image = `/api/v1/uploads/customer-logos/${req.file.filename}`;
    } else {
        // If no file is uploaded, use existing image URL from formData if present, otherwise default
        if (req.body.image && !req.body.image.startsWith('data:image/')) {
             customerData.image = req.body.image; // Use existing URL if sent from frontend
        } else {
            customerData.image = 'https://placehold.co/200x200/cccccc/ffffff?text=No+Image'; // Default placeholder
        }
    }

    // Ensure empty strings for optional fields are converted to null for database if needed
    for (const key of ['schoolCode', 'contactPerson', 'email', 'gstNumber', 'aadharNumber', 'panNumber', 'shopAddress', 'homeAddress']) {
        if (customerData[key] === '') {
            customerData[key] = null;
        }
    }

    const newCustomer = await Customer.create(customerData);

    // Populate branch and city after creation to return full object
    const populatedCustomer = await populateCustomerQuery(Customer.findById(newCustomer._id));

    res.status(201).json({
        status: 'success',
        data: {
            customer: populatedCustomer
        },
        message: 'Customer created successfully!'
    });
});

// Get all Customers (with filtering, sorting, pagination, and population)
exports.getAllCustomers = catchAsync(async (req, res, next) => {
    // Build query with population for branch and city
    const features = new APIFeatures(
        populateCustomerQuery(Customer.find()), // Apply population to the initial find query
        req.query
    )
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const customers = await features.query;

    // To get total count for pagination metadata
    const totalCount = await Customer.countDocuments(features.filterQuery);

    res.status(200).json({
        status: 'success',
        results: customers.length,
        data: {
            customers
        },
        totalCount
    });
});

// Get a single Customer by ID
exports.getCustomer = catchAsync(async (req, res, next) => {
    // Populate branch and city when getting a single customer
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
    console.log('req.body (updateCustomer):', req.body); // DEBUG: Log incoming body
    console.log('req.files (updateCustomer):', req.files); // DEBUG: Log incoming files (for .fields)

    const {
        customerName, schoolCode, branch, city, contactPerson, mobileNumber,
        email, gstNumber, aadharNumber, panNumber, shopAddress, homeAddress, status
    } = req.body;

    // Basic validation for required fields
    if (!customerName || !branch || !city || !mobileNumber) {
        return next(new AppError('Customer Name, Branch, City, and Mobile Number are required.', 400));
    }

    let customerData = {
        customerName, schoolCode, branch, city, contactPerson, mobileNumber,
        email, gstNumber, aadharNumber, panNumber, shopAddress, homeAddress, status
    };

    // Find the existing customer to check for old image if a new one is uploaded
    const existingCustomer = await Customer.findById(req.params.id);
    if (!existingCustomer) {
        return next(new AppError('No customer found with that ID', 404));
    }

    // Check for new image upload from req.files.image (if using .fields())
    if (req.files && req.files.image && req.files.image.length > 0) {
        const newImageFile = req.files.image[0];
        // New image uploaded: delete old image if it exists and is not a placeholder
        if (existingCustomer.image && existingCustomer.image !== 'https://placehold.co/200x200/cccccc/ffffff?text=No+Image') {
            const oldImagePath = path.join(__dirname, '..', existingCustomer.image);
            fs.unlink(oldImagePath, (err) => {
                if (err) console.error('Failed to delete old customer image:', err);
            });
        }
        customerData.image = `/api/v1/uploads/customer-logos/${newImageFile.filename}`;
    } else {
        // No new file uploaded. Handle existing image or clear it.
        if (req.body.image === '') { // Frontend explicitly sent an empty string for image
            if (existingCustomer.image && existingCustomer.image !== 'https://placehold.co/200x200/cccccc/ffffff?text=No+Image') {
                const oldImagePath = path.join(__dirname, '..', existingCustomer.image);
                fs.unlink(oldImagePath, (err) => {
                    if (err) console.error('Failed to delete old customer image:', err);
                });
            }
            customerData.image = 'https://placehold.co/200x200/cccccc/ffffff?text=No+Image'; // Set to placeholder
        } else if (req.body.image) { // Frontend sent an existing image URL (not a new file)
            customerData.image = req.body.image;
        } else { // No image data from frontend and no existing image specified
            customerData.image = 'https://placehold.co/200x200/cccccc/ffffff?text=No+Image'; // Default placeholder
        }
    }

    // Ensure empty strings for optional fields are converted to null for database if needed
    for (const key of ['schoolCode', 'contactPerson', 'email', 'gstNumber', 'aadharNumber', 'panNumber', 'shopAddress', 'homeAddress']) {
        if (customerData[key] === '') {
            customerData[key] = null;
        }
    }

    const customer = await Customer.findByIdAndUpdate(req.params.id, customerData, {
        new: true, // Return the updated document
        runValidators: true // Run schema validators on update
    });

    if (!customer) {
        return next(new AppError('No customer found with that ID', 404));
    }

    // Populate branch and city after update to return full object
    const populatedCustomer = await populateCustomerQuery(Customer.findById(customer._id));

    res.status(200).json({
        status: 'success',
        data: {
            customer: populatedCustomer
        },
        message: 'Customer updated successfully!'
    });
});

// Delete a Customer by ID
exports.deleteCustomer = catchAsync(async (req, res, next) => {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
        return next(new AppError('No customer found with that ID', 404));
    }

    // Delete the associated image file if it exists and is not a placeholder
    if (customer.image && customer.image !== 'https://placehold.co/200x200/cccccc/ffffff?text=No+Image' && customer.image.startsWith('/api/v1/uploads/customer-logos/')) {
        const imageFileName = path.basename(customer.image);
        const imagePath = path.join(__dirname, '../uploads/customer-logos', imageFileName);
        fs.unlink(imagePath, (err) => {
            if (err) console.error('Failed to delete customer image file:', err);
        });
    }

    await Customer.findByIdAndDelete(req.params.id);

    // 204 No Content for successful deletion
    res.status(204).json({
        status: 'success',
        data: null,
        message: 'Customer deleted successfully!'
    });
});
