const express = require('express');
const bookCatalogController = require('../controllers/bookCatalogController');
const authController = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .post(authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), bookCatalogController.createBookCatalog)
  .get(authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), bookCatalogController.getAllBookCatalogs);

router
  .route('/:id')
  .get(authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), bookCatalogController.getBookCatalog)
  .patch(authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), bookCatalogController.updateBookCatalog)
  .delete(authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), bookCatalogController.deleteBookCatalog);

module.exports = router;
