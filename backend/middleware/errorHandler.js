// middleware/errorHandler.js
const AppError = require('../utils/appError'); // Ensure the path to appError.js is correct

const errorHandler = (err, req, res, next) => {
    let error = { ...err };

    error.message = err.message;

    // Log full stack trace for debugging
    console.error(err.stack);

    // Handle Mongoose CastError (invalid ObjectId)
    if (err.name === 'CastError') {
        const message = `Resource not found with id of ${err.value}`;
        error = new AppError(message, 404);
    }

    // Handle Mongoose duplicate key error (E11000)
    if (err.code === 11000) {
        const message = `Duplicate field value entered: ${Object.keys(err.keyValue)} already exists.`;
        error = new AppError(message, 400);
    }

    // Handle Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join('. ');
        error = new AppError(message, 400);
    }

    // Send response to client
    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error'
    });
};

module.exports = errorHandler;
