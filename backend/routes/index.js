// backend/routes/index.js
const express = require('express');
const authRoutes = require('./auth');
const branchRoutes = require('./branchRoutes');
const employeeRoutes = require('./employeeRoutes');
const branchAdminRoutes = require('./branchAdminRoutes');
const reportRoutes = require('./reportRoutes');

// NEW: Import your stock manager routes
const stockManagerRoutes = require('./stockManagerRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/branches', branchRoutes);
router.use('/employees', employeeRoutes);
router.use('/branch-admins', branchAdminRoutes);
router.use('/reports', reportRoutes);

// NEW: Mount your stock manager routes
router.use('/stock-managers', stockManagerRoutes); // This makes /api/v1/stock-managers available

module.exports = router;