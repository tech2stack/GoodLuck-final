// backend/routes/reportRoutes.js

const express = require('express');
const {
    getOverallReport,
    downloadOverallReport,
    getBranchOverviewReport,
    downloadBranchOverviewReport,
    getBranchDetailsReport,    // NEW: For specific branch details
    downloadBranchDetailsReport // NEW: For specific branch details download
} = require('../controllers/reportController');

// Assuming you have middleware for authentication and authorization
// const { protect, authorize } = require('../middleware/auth'); // Example middleware

const router = express.Router();

// Apply authentication/authorization middleware as needed
// router.use(protect); // All routes below this require authentication
// router.use(authorize('superAdmin')); // Example: All routes below this require superAdmin role

// Overall Business Report Routes
router.route('/overall').get(getOverallReport);
router.route('/overall/download').get(downloadOverallReport); // PDF download

// Branch Overview Report (Table of all branches) Routes
router.route('/branch-overview').get(getBranchOverviewReport);
router.route('/branch-overview/download').get(downloadBranchOverviewReport); // CSV download

// NEW: Specific Branch Details Report Routes
router.route('/branch-details/:id').get(getBranchDetailsReport);
router.route('/branch-details/:id/download').get(downloadBranchDetailsReport); // CSV download

module.exports = router;