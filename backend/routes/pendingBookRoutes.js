// backend/routes/pendingBookRoutes.js

const express = require('express');
const pendingBookController = require('../controllers/pendingBookController'); // Import the pending book controller
const authController = require('../middleware/authMiddleware'); // Assuming you have an authController for protecting routes

const router = express.Router();

// Protect all pending book routes (uncomment if you have authentication)
// router.use(authController.protect);
// router.use(authController.restrictTo('super_admin', 'branch_admin', 'stock_manager')); // Example roles

// Route to get all books with their pending status for a specific customer/branch
// This is now the primary GET route for the table data
router.get('/', pendingBookController.getBooksWithPendingStatus);

// Route to create or update a pending book entry's status
router.patch('/status', pendingBookController.createOrUpdatePendingBook); // <--- NEW ROUTE: For updating status

// Route for deleting a pending book entry by ID (if needed)
// Note: This is for deleting the PendingBook entry itself, not changing status.
router.delete('/:id', pendingBookController.deletePendingBook);


// Routes for dropdown data (Customers and Branches)
router.get('/dropdowns/customers', pendingBookController.getAllCustomersForDropdown);
router.get('/dropdowns/branches', pendingBookController.getAllBranchesForDropdown);


module.exports = router;
