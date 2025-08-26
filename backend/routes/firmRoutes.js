// backend/routes/firmRoutes.js
const express = require('express');
const firmController = require('../controllers/firmController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const uploadsDir = path.join(__dirname, '../uploads');
const firmLogosDir = path.join(uploadsDir, 'firm-logos');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
if (!fs.existsSync(firmLogosDir)) {
    fs.mkdirSync(firmLogosDir);
}

const firmStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, firmLogosDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extname = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${extname}`);
    }
});

const uploadFirmLogo = multer({
    storage: firmStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed for logo!'), false);
        }
    }
});

router
    .route('/')
    .get(firmController.getAllFirms)
    .post(uploadFirmLogo.single('logo'), firmController.createFirm);

router
    .route('/:id')
    .get(firmController.getFirm)
    .patch(uploadFirmLogo.single('logo'), firmController.updateFirm)
    .delete(firmController.deleteFirm);

module.exports = router;