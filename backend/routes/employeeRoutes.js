// backend/routes/employeeRoutes.js
const express = require('express');
const employeeController = require('../controllers/employeeController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const { promises: fs } = require('fs');

const router = express.Router();

const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Store all uploads in a single 'uploads' directory
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: multerStorage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

router.route('/')
    .post(
        authMiddleware.protect,
        authMiddleware.restrictTo('super_admin', 'branch_admin'),
        upload.fields([{ name: 'passportPhoto', maxCount: 1 }, { name: 'documentPDF', maxCount: 1 }]),
        employeeController.createEmployee
    )
    .get(authMiddleware.protect, authMiddleware.restrictTo('super_admin', 'branch_admin'), employeeController.getAllEmployees);

router.get(
    '/by-role/:role',
    authMiddleware.protect,
    authMiddleware.restrictTo('super_admin'),
    employeeController.getEmployeesByRole
);

router.route('/:id')
    .get(authMiddleware.protect, authMiddleware.restrictTo('super_admin', 'branch_admin'), employeeController.getEmployee)
    .patch(
        authMiddleware.protect,
        authMiddleware.restrictTo('super_admin', 'branch_admin'),
        upload.fields([{ name: 'passportPhoto', maxCount: 1 }, { name: 'documentPDF', maxCount: 1 }]),
        employeeController.updateEmployee
    )
    .delete(authMiddleware.protect, authMiddleware.restrictTo('super_admin', 'branch_admin'), employeeController.deleteEmployee);

module.exports = router;
