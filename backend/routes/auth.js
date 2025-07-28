// backend/routes/auth.js
const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware'); // <<< ZAROORI: authMiddleware import karein

const router = express.Router();

router.post('/login', authController.login);
router.post('/register-super-admin', authController.registerSuperAdmin);

// <<< YEH LINE ADD KAREIN >>>
// Naya /me endpoint: Logged-in user ki details fetch karne ke liye
router.get('/me', authMiddleware.protect, authController.getMe); 

router.route('/logout')
  .get(authController.logout)
  .post(authController.logout);


module.exports = router;
