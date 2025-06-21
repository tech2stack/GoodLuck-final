// backend/middleware/authorizeRoles.js

const AppError = require('../utils/appError'); // Assuming you have an AppError utility for custom errors

/**
 * Middleware to restrict access based on user roles.
 * @param {Array} roles - An array of roles that are allowed to access the route (e.g., ['super_admin', 'branch_admin'])
 */
const authorizeRoles = (roles) => {
    return (req, res, next) => {
        // req.user should be available from a preceding authentication middleware (e.g., authMiddleware)
        if (!req.user || !req.user.role) {
            return next(new AppError('You are not logged in or your role is undefined. Please log in to get access.', 401));
        }

        if (!roles.includes(req.user.role)) {
            return next(new AppError(`User role ${req.user.role} is not authorized to access this route.`, 403));
        }

        next(); // User has the required role, proceed to the next middleware/route handler
    };
};

module.exports = authorizeRoles;