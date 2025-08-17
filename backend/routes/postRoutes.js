// backend/routes/postRoutes.js
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');

router.route('/')
    .get(postController.getAllPosts)
    .post(authMiddleware.protect, authMiddleware.restrictTo('super_admin'), postController.createPost);

router.route('/:id')
    .patch(authMiddleware.protect, authMiddleware.restrictTo('super_admin'), postController.updatePost)
    .delete(authMiddleware.protect, authMiddleware.restrictTo('super_admin'), postController.deletePost);

module.exports = router;