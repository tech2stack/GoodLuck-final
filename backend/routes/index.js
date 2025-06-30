// backend/routes/index.js
const express = require('express');
const authRoutes = require('./auth');
const branchRoutes = require('./branchRoutes');
const employeeRoutes = require('./employeeRoutes');
const branchAdminRoutes = require('./branchAdminRoutes');
const reportRoutes = require('./reportRoutes');
const stockManagerRoutes = require('./stockManagerRoutes');
const summaryRoutes = require('./summaryRoutes');
const classRoutes = require('./classRoutes'); // <<< CONFIRMED: Import the class routes
const zoneRoutes = require('./zoneRoutes'); // NEW: Import Zone routes
const cityRoutes = require('./cityRoutes'); // NEW: Import City routes
const publicationRoutes = require('./publicationRoutes'); // NEW: Import publication routes
const languageRoutes = require('./languageRoutes'); // NEW: Import language routes

const router = express.Router();

// Mount different route modules under their respective paths
router.use('/auth', authRoutes); // Authentication routes (login, register super admin, logout)
router.use('/branches', branchRoutes); // Branch management routes
router.use('/employees', employeeRoutes); // Employee management routes
router.use('/branch-admins', branchAdminRoutes); // Branch Admin management routes
router.use('/reports', reportRoutes); // Reporting routes
router.use('/stock-managers', stockManagerRoutes); // Stock Manager management routes
router.use('/summary', summaryRoutes); // Summary routes
router.use('/classes', classRoutes); // <<< CONFIRMED: Mount class routes under /api/v1/classes
router.use('/zones', zoneRoutes); 
router.use('/cities', cityRoutes); // NEW: City management routes
router.use('/publications', publicationRoutes); // NEW: Use publication routes
router.use('/languages', languageRoutes); // NEW: Use language routes

module.exports = router;
