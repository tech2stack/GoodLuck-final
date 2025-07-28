// backend/routes/index.js
const express = require('express');
const authRoutes = require('./auth');
const branchRoutes = require('./branchRoutes');
const employeeRoutes = require('./employeeRoutes');
const branchAdminRoutes = require('./branchAdminRoutes');
const reportRoutes = require('./reportRoutes');
const stockManagerRoutes = require('./stockManagerRoutes');
const summaryRoutes = require('./summaryRoutes');
const classRoutes = require('./classRoutes');
const zoneRoutes = require('./zoneRoutes');
const cityRoutes = require('./cityRoutes');
const publicationRoutes = require('./publicationRoutes');
const languageRoutes = require('./languageRoutes');
const bookCatalogRoutes = require('./bookCatalogRoutes');
const stationeryItemRoutes = require('./stationeryItemRoutes');
const customerRoutes = require('./customerRoutes');
const transportRouter = require('./transportRoutes');
const pendingBookRouter = require('./pendingBookRoutes');
const setRouter = require('./setRoutes'); 
const dashboardRoutes = require('./dashboardRoutes'); // <<< ZAROORI: Dashboard routes import karein


const router = express.Router();

// Mount different route modules under their respective paths
router.use('/auth', authRoutes);
router.use('/branches', branchRoutes);
router.use('/employees', employeeRoutes);
router.use('/branch-admins', branchAdminRoutes);
router.use('/reports', reportRoutes);
router.use('/stock-managers', stockManagerRoutes);
router.use('/summary', summaryRoutes);
router.use('/classes', classRoutes);
router.use('/zones', zoneRoutes);
router.use('/cities', cityRoutes);
router.use('/publications', publicationRoutes);
router.use('/languages', languageRoutes);
router.use('/book-catalogs', bookCatalogRoutes);
router.use('/stationery-items', stationeryItemRoutes);
router.use('/customers', customerRoutes);
router.use('/transports', transportRouter);
router.use('/pending-books', pendingBookRouter);
router.use('/sets', setRouter); 
router.use('/dashboard', dashboardRoutes); // <<< ZAROORI: Dashboard routes mount karein


module.exports = router;
