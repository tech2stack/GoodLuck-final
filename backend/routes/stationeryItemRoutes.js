// backend/routes/stationeryItemRoutes.js
const express = require('express');
const stationeryItemController = require('../controllers/stationeryItemController');
const authController = require('../middleware/authMiddleware');

const router = express.Router();

// All stationery item routes require authentication
router.use(authController.protect);

// Routes for creating and getting all stationery items
router
    .route('/')
    .post(authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), stationeryItemController.createStationeryItem)
    .get(authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), stationeryItemController.getAllStationeryItems);

// Routes for getting, updating, and deleting a specific stationery item by ID
router
    .route('/:id')
    .get(authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), stationeryItemController.getStationeryItem)
    .patch(authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), stationeryItemController.updateStationeryItem)
    .delete(authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), stationeryItemController.deleteStationeryItem);

module.exports = router;
