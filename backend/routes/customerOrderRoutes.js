const express = require('express');
const router = express.Router();
const customerOrderController = require('../controllers/customerOrderController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/types', authMiddleware.protect, customerOrderController.getCustomerTypes);
router.get('/customers/:type', authMiddleware.protect, customerOrderController.getCustomersByType);
router.get('/sales-representatives', authMiddleware.protect, customerOrderController.getSalesRepresentatives);
router.get('/publications', authMiddleware.protect, customerOrderController.getPublications);
router.get('/publications/:publicationId/subtitles', authMiddleware.protect, customerOrderController.getSubtitlesByPublication);
router.get('/publications/:publicationId/subtitles/:subtitleId/books', authMiddleware.protect, customerOrderController.getBooksByPublicationAndSubtitle);
router.post('/', authMiddleware.protect, customerOrderController.createCustomerOrder);
router.get('/', authMiddleware.protect, customerOrderController.getAllCustomerOrders);
router.get(
  '/employees',
  authMiddleware.protect,
  authMiddleware.restrictTo('super_admin', 'branch_admin', 'stock_manager'),
  customerOrderController.getAllEmployees
);

module.exports = router;