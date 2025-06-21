// backend/routes/employeeRoutes.js
const express = require('express');
const employeeController = require('../controllers/employeeController'); // Assuming this exists
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .post(authMiddleware.protect, authMiddleware.restrictTo('super_admin', 'branch_admin'), employeeController.createEmployee)
    .get(authMiddleware.protect, authMiddleware.restrictTo('super_admin', 'branch_admin'), employeeController.getAllEmployees);

router.route('/:id') // Correct: ':id' defines a parameter named 'id'
    .get(authMiddleware.protect, authMiddleware.restrictTo('super_admin', 'branch_admin', 'employee'), employeeController.getEmployee)
    .patch(authMiddleware.protect, authMiddleware.restrictTo('super_admin', 'branch_admin'), employeeController.updateEmployee)
    .delete(authMiddleware.protect, authMiddleware.restrictTo('super_admin', 'branch_admin'), employeeController.deleteEmployee);

module.exports = router;