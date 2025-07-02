// backend/controllers/transportController.js

const Transport = require('../models/Transport'); // Import the Transport model
const APIFeatures = require('../utils/apiFeatures'); // Utility for filtering, sorting, pagination
const AppError = require('../utils/appError'); // Custom error class
const catchAsync = require('../utils/catchAsync'); // Utility to catch async errors

// 1. Create a new Transport
exports.createTransport = catchAsync(async (req, res, next) => {
    // Log the request body for debugging purposes
    console.log('createTransport: req.body:', req.body);

    // Create a new transport document in the database
    const newTransport = await Transport.create(req.body);

    // Send a success response with the newly created transport data
    res.status(201).json({
        status: 'success',
        data: {
            transport: newTransport
        },
        message: 'Transport created successfully!'
    });
});

// 2. Get all Transports (with filtering, sorting, pagination)
exports.getAllTransports = catchAsync(async (req, res, next) => {
    // Build a query using the APIFeatures utility
    // This allows for advanced filtering, sorting, and pagination based on query parameters
    const features = new APIFeatures(Transport.find(), req.query)
        .filter()    // Apply filtering based on query parameters (e.g., ?status=active)
        .sort()      // Apply sorting (e.g., ?sort=-createdAt)
        .limitFields() // Limit fields returned (e.g., ?fields=transportName,mobile)
        .paginate(); // Apply pagination (e.g., ?page=2&limit=10)

    // Execute the query to get the transports
    const transports = await features.query;

    // Get the total count of documents matching the filter criteria (before pagination)
    // This is useful for frontend pagination controls
    const totalCount = await Transport.countDocuments(features.filterQuery);

    // Send a success response with the fetched transports and total count
    res.status(200).json({
        status: 'success',
        results: transports.length, // Number of results in the current page
        data: {
            transports // The array of transport documents
        },
        totalCount // Total number of documents matching the filter
    });
});

// 3. Get a single Transport by ID
exports.getTransport = catchAsync(async (req, res, next) => {
    // Find a transport document by its ID
    const transport = await Transport.findById(req.params.id);

    // If no transport is found with the given ID, send a 404 error
    if (!transport) {
        return next(new AppError('No transport found with that ID', 404));
    }

    // Send a success response with the fetched transport data
    res.status(200).json({
        status: 'success',
        data: {
            transport
        }
    });
});

// 4. Update a Transport by ID
exports.updateTransport = catchAsync(async (req, res, next) => {
    // Log the request body for debugging purposes
    console.log('updateTransport: req.body:', req.body);

    // Find and update a transport document by its ID
    // { new: true } returns the modified document rather than the original
    // { runValidators: true } runs schema validators on the update operation
    const transport = await Transport.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    // If no transport is found with the given ID, send a 404 error
    if (!transport) {
        return next(new AppError('No transport found with that ID', 404));
    }

    // Send a success response with the updated transport data
    res.status(200).json({
        status: 'success',
        data: {
            transport
        },
        message: 'Transport updated successfully!'
    });
});

// 5. Delete a Transport by ID
exports.deleteTransport = catchAsync(async (req, res, next) => {
    // Find and delete a transport document by its ID
    const transport = await Transport.findByIdAndDelete(req.params.id);

    // If no transport is found with the given ID, send a 404 error
    if (!transport) {
        return next(new AppError('No transport found with that ID', 404));
    }

    // Send a 204 No Content response for successful deletion
    res.status(204).json({
        status: 'success',
        data: null, // No data returned for a 204 response
        message: 'Transport deleted successfully!'
    });
});
