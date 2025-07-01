// backend/routes/bookCatalogRoutes.js
const express = require('express');
const bookCatalogController = require('../controllers/bookCatalogController');
const authController = require('../middleware/authMiddleware');

const router = express.Router();

// All book catalog routes require authentication
router.use(authController.protect);

// Routes for creating and getting all book catalog entries
router
    .route('/')
    .post(authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), bookCatalogController.createBookCatalog)
    .get(authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), bookCatalogController.getAllBookCatalogs);

// Routes for getting, updating, and deleting a specific book catalog entry by ID
router
    .route('/:id')
    .get(authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), bookCatalogController.getBookCatalog)
    .patch(authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), bookCatalogController.updateBookCatalog)
    .delete(authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), bookCatalogController.deleteBookCatalog);

module.exports = router;
