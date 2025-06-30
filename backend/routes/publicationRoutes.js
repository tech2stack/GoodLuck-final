// backend/routes/publicationRoutes.js
const express = require('express');
const publicationController = require('../controllers/publicationController');
const publicationSubtitleController = require('../controllers/publicationSubtitleController');
const authController = require('../middleware/authMiddleware');

const router = express.Router();

// All publication routes require authentication
router.use(authController.protect);

// Routes for creating and getting all publications
router
    .route('/')
    .post(authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), publicationController.createPublication)
    .get(authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), publicationController.getAllPublications);

// Routes for getting, updating, and deleting a specific publication by ID
router
    .route('/:id')
    .get(authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), publicationController.getPublication)
    // NEW: Added 'stock_manager' to update and delete permissions
    .patch(authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), publicationController.updatePublication)
    .delete(authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), publicationController.deletePublication);

// Nested route for subtitles under a specific publication
router.route('/:publicationId/subtitles')
    .get(authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), publicationSubtitleController.getSubtitlesByPublication)
    .post(authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), publicationSubtitleController.createPublicationSubtitle);

// Routes for managing a specific subtitle by its own ID
router.route('/subtitles/:id')
    .get(authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), publicationSubtitleController.getPublicationSubtitle)
    .patch(authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), publicationSubtitleController.updatePublicationSubtitle)
    .delete(authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), publicationSubtitleController.deletePublicationSubtitle);


module.exports = router;
