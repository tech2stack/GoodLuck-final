class AppError extends Error {
    constructor(message, statusCode) {
        super(message); // Call parent constructor with message

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // Mark as operational error (known error)

        Error.captureStackTrace(this, this.constructor); // Capture stack trace
    }
}

module.exports = AppError;