// backend/routes/publicationRoutes.js
const express = require('express');
const publicationController = require('../controllers/publicationController');
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
    .patch(authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), publicationController.updatePublication)
    .delete(authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'), publicationController.deletePublication);

// NEW ROUTES FOR SUBTITLES
// Route to add a new subtitle to an existing publication
router.post(
    '/:id/subtitles',
    authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'),
    publicationController.addSubtitleToPublication
);

// Route to update a specific subtitle from a publication
router.patch(
    '/subtitles/:subtitleId',
    authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'),
    publicationController.updateSubtitleFromPublication
);

// Route to delete a specific subtitle from a publication
router.delete(
    '/subtitles/:subtitleId',
    authController.restrictTo('super_admin', 'branch_admin', 'stock_manager'),
    publicationController.deleteSubtitleFromPublication
);

module.exports = router;