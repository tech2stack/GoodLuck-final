// backend/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware'); 

router.get('/metrics', authMiddleware.protect, dashboardController.getDashboardMetrics);

module.exports = router;
