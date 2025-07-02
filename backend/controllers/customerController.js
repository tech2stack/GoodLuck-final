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
    console.log('createCustomer: req.body:', req.body); // DEBUG: Log incoming body
    console.log('createCustomer: req.file:', req.file); // DEBUG: Log incoming file (for .single)

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
        // Store path relative to the 'uploads' directory, without any /api/v1/ prefix
        customerData.image = `/customer-logos/${req.file.filename}`; 
        console.log('createCustomer: Storing new image path in DB:', customerData.image); // DEBUG
    } else {
        // If no file is uploaded, use existing image URL from formData if present, otherwise default
        if (req.body.image && !req.body.image.startsWith('data:image/')) {
             customerData.image = req.body.image; 
             console.log('createCustomer: Retaining existing image path from body:', customerData.image); // DEBUG
        } else {
            customerData.image = 'https://placehold.co/200x200/cccccc/ffffff?text=No+Image'; // Default placeholder
            console.log('createCustomer: Setting default placeholder image path:', customerData.image); // DEBUG
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
    console.log('updateCustomer: req.body:', req.body); // DEBUG: Log incoming body
    console.log('updateCustomer: req.files:', req.files); // DEBUG: Log incoming files (for .any())

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
    console.log('updateCustomer: Existing customer image path from DB:', existingCustomer.image); // DEBUG

    // Check for new image upload from req.files (if using .any(), it's an array of all files)
    const newImageFile = req.files ? req.files.find(file => file.fieldname === 'image') : null;

    if (newImageFile) {
        console.log('updateCustomer: New image file detected:', newImageFile.filename); // DEBUG
        // New image uploaded: delete old image if it exists and is not a placeholder
        // Path stored in DB will now be /customer-logos/... so adjust unlink path
        if (existingCustomer.image && existingCustomer.image !== 'https://placehold.co/200x200/cccccc/ffffff?text=No+Image' && existingCustomer.image.startsWith('/customer-logos/')) { 
            const oldImagePath = path.join(__dirname, '..', 'uploads', existingCustomer.image); 
            console.log('updateCustomer: Attempting to delete old image at:', oldImagePath); // DEBUG
            fs.unlink(oldImagePath, (err) => {
                if (err) {
                    console.error('updateCustomer: Failed to delete old customer image:', err); // DEBUG: Log actual unlink error
                    // Don't block the request if old image deletion fails, just log it.
                } else {
                    console.log('updateCustomer: Old image deleted successfully:', oldImagePath); // DEBUG
                }
            });
        }
        customerData.image = `/customer-logos/${newImageFile.filename}`; 
        console.log('updateCustomer: Storing new image path in DB:', customerData.image); // DEBUG
    } else {
        console.log('updateCustomer: No new image file uploaded.'); // DEBUG
        // No new file uploaded. Handle existing image or clear it.
        // Check if the frontend explicitly sent an empty string for the 'image' field in req.body
        if (req.body.image === '') {
            console.log('updateCustomer: Frontend sent empty string for image (clearing image).'); // DEBUG
            if (existingCustomer.image && existingCustomer.image !== 'https://placehold.co/200x200/cccccc/ffffff?text=No+Image' && existingCustomer.image.startsWith('/customer-logos/')) { 
                const oldImagePath = path.join(__dirname, '..', 'uploads', existingCustomer.image); 
                console.log('updateCustomer: Attempting to delete old image at:', oldImagePath); // DEBUG
                fs.unlink(oldImagePath, (err) => {
                    if (err) {
                        console.error('updateCustomer: Failed to delete old customer image (on clear):', err); // DEBUG
                    } else {
                        console.log('updateCustomer: Old image deleted successfully (on clear):', oldImagePath); // DEBUG
                    }
                });
            }
            customerData.image = 'https://placehold.co/200x200/cccccc/ffffff?text=No+Image'; // Set to placeholder
        } else if (req.body.image) { // Frontend sent an existing image URL (not a new file)
            customerData.image = req.body.image;
            console.log('updateCustomer: Retaining existing image path from body:', customerData.image); // DEBUG
        } else { // No image data from frontend and no existing image specified
            customerData.image = 'https://placehold.co/200x200/cccccc/ffffff?text=No+Image'; // Default placeholder
            console.log('updateCustomer: Setting default placeholder (no image data from frontend).'); // DEBUG
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
    console.log('deleteCustomer: Customer found:', customer._id); // DEBUG

    // Delete the associated image file if it exists and is not a placeholder
    // Path stored in DB will now be /customer-logos/... so adjust unlink path
    if (customer.image && customer.image !== 'https://placehold.co/200x200/cccccc/ffffff?text=No+Image' && customer.image.startsWith('/customer-logos/')) { 
        const imagePath = path.join(__dirname, '..', 'uploads', customer.image); 
        console.log('deleteCustomer: Attempting to delete image at:', imagePath); // DEBUG
        fs.unlink(imagePath, (err) => {
            if (err) {
                console.error('deleteCustomer: Failed to delete customer image file:', err); // DEBUG
            } else {
                console.log('deleteCustomer: Customer image deleted successfully:', imagePath); // DEBUG
            }
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
