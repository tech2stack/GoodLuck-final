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
        cb(null, 'uploads/');
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
    .get(
        authMiddleware.protect,
        authMiddleware.restrictTo('super_admin', 'branch_admin', 'stock_manager'),  // Added 'stock_manager'
        employeeController.getAllEmployees
    );

router.get(
    '/by-role/:role',
    authMiddleware.protect,
    authMiddleware.restrictTo('super_admin'),
    employeeController.getEmployeesByRole
);

router.get(
    '/sales-representatives',
    authMiddleware.protect,
    authMiddleware.restrictTo('super_admin', 'branch_admin', 'stock_manager'),
    employeeController.getSalesRepresentatives
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

    router.get(
    '/for-orders',
    authMiddleware.protect,
    authMiddleware.restrictTo('super_admin', 'branch_admin', 'stock_manager'),
    employeeController.getAllEmployeesForOrders
);

module.exports = router;