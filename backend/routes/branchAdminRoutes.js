// backend/routes/branchAdminRoutes.js
const express = require('express');
const branchAdminController = require('../controllers/branchAdminController');
const authMiddleware = require('../middleware/authMiddleware'); // Renamed from authController for clarity as it's middleware

const router = express.Router();

// Apply protection and restriction to all routes below this line
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('super_admin')); // Only Super Admin can manage Branch Admins

// Routes for base /api/v1/branch-admins
router.route('/')
    .post(branchAdminController.createBranchAdmin) // This handles the POST to /api/v1/branch-admins
    .get(branchAdminController.getAllBranchAdmins);

// Routes for /api/v1/branch-admins/:id
router.route('/:id')
    .get(branchAdminController.getBranchAdmin)
    .patch(branchAdminController.updateBranchAdmin)
    .delete(branchAdminController.deleteBranchAdmin);

module.exports = router;