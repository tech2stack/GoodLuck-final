// backend/routes/customerRoutes.js
const express = require('express');
const customerController = require('../controllers/customerController');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // For file system operations

const router = express.Router();

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
const customerLogosDir = path.join(uploadsDir, 'customer-logos');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
if (!fs.existsSync(customerLogosDir)) {
    fs.mkdirSync(customerLogosDir);
}

// Multer storage configuration for customer logos
const customerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, customerLogosDir); // Save files to 'uploads/customer-logos'
    },
    filename: (req, file, cb) => {
        // Create a unique filename: fieldname-timestamp.ext
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// Multer upload middleware
const uploadCustomerLogo = multer({
    storage: customerStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
    fileFilter: (req, file, cb) => {
        // Allow only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed for customer logos!'), false);
        }
    }
});

// Customer Routes
router
    .route('/')
    .get(customerController.getAllCustomers)
    // Use uploadCustomerLogo middleware for image upload
    .post(uploadCustomerLogo.single('image'), customerController.createCustomer);

router
    .route('/:id')
    .get(customerController.getCustomer)
    // For PATCH, use .fields to ensure all text fields are also parsed into req.body.
    // Multer will parse text fields into req.body and files into req.files (or req.file for single).
    // We explicitly define the 'image' field for the file.
    .patch(uploadCustomerLogo.fields([{ name: 'image', maxCount: 1 }]), customerController.updateCustomer)
    .delete(customerController.deleteCustomer);

module.exports = router;
