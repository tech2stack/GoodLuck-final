// routes/branchRoutes.js
const express = require('express');
const branchController = require('../controllers/branchController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .post(authMiddleware.protect, authMiddleware.restrictTo('super_admin'), branchController.uploadBranchLogo, branchController.createBranch)
    .get(authMiddleware.protect, authMiddleware.restrictTo('super_admin', 'branch_admin', 'employee'), branchController.getAllBranches);

router.route('/:id')
    .get(authMiddleware.protect, authMiddleware.restrictTo('super_admin', 'branch_admin', 'employee'), branchController.getBranch)
    // UNCOMMENT and include branchController.uploadBranchLogo here:
    .patch(authMiddleware.protect, authMiddleware.restrictTo('super_admin'), branchController.uploadBranchLogo, branchController.updateBranch)
    .delete(authMiddleware.protect, authMiddleware.restrictTo('super_admin'), branchController.deleteBranch);

module.exports = router;