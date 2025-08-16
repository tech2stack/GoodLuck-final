// backend/routes/customerRoutes.js
const express = require('express');
const customerController = require('../controllers/customerController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const uploadsDir = path.join(__dirname, '../uploads');
const customerLogosDir = path.join(uploadsDir, 'customer-logos');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
if (!fs.existsSync(customerLogosDir)) {
    fs.mkdirSync(customerLogosDir);
}

const customerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, customerLogosDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extname = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${extname}`);
    }
});

const uploadCustomerImages = multer({
    storage: customerStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

router
    .route('/')
    .get(customerController.getAllCustomers)
    // Use .fields() to handle multiple image fields
    .post(uploadCustomerImages.fields([
        { name: 'chequeImage', maxCount: 1 }, 
        { name: 'passportImage', maxCount: 1 },
        { name: 'otherAttachment', maxCount: 1 } // New attachment field
    ]), customerController.createCustomer);

router
    .route('/:id')
    // Corrected function name from getCustomerById to getCustomer
    .get(customerController.getCustomer)
    .patch(uploadCustomerImages.fields([
        { name: 'chequeImage', maxCount: 1 }, 
        { name: 'passportImage', maxCount: 1 },
        { name: 'otherAttachment', maxCount: 1 } // New attachment field
    ]), customerController.updateCustomer)
    .delete(customerController.deleteCustomer);

module.exports = router;