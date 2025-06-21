// controllers/branchController.js
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Branch = require('../models/Branch');
const multer = require('multer'); // Import multer
const path = require('path'); // Import path module for directory joining

// --- Multer Setup for Image Uploads ---
const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Assuming branchController.js is in 'controllers' folder and 'uploads' is in project root.
        // This makes the path relative to the project root.
        cb(null, path.join(__dirname, '..', 'uploads', 'branch-logos'));
    },
    filename: (req, file, cb) => {
        const ext = file.mimetype.split('/')[1];
        cb(null, `branch-${Date.now()}.${ext}`);
    }
});

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image! Please upload only images.', 400), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB file size limit
});

// Middleware for a single logo image upload
// 'logoImage' here must match the 'name' attribute of your file input field in the frontend form
exports.uploadBranchLogo = upload.single('logoImage');

// --- Branch Controller Functions ---
exports.createBranch = catchAsync(async (req, res, next) => {
    // Destructure all fields from req.body (parsed by Multer after file upload)
    const { name, location, shopOwnerName, shopGstId, address, mobileNumber, status } = req.body;

    // The path to the uploaded file will be available in req.file.filename after Multer processes it
    const logoImage = req.file ? `/uploads/branch-logos/${req.file.filename}` : 'no-photo.jpg';

    // Validation for REQUIRED fields only
    if (!name || !location || !shopOwnerName || !address) {
        // Please provide the branch name, location, owner name, and address.
        return next(new AppError('Please provide the branch name, location, owner name, and address.', 400));
    }

    // Check for existing branch name (still unique and required)
    const existingBranchName = await Branch.findOne({ name });
    if (existingBranchName) {
        return next(new AppError('A branch with this name already exists.', 409)); // इस नाम की शाखा पहले से मौजूद है।
    }

    // Optional uniqueness checks if the fields are provided
    if (shopGstId) {
        const existingGstId = await Branch.findOne({ shopGstId });
        if (existingGstId) {
            return next(new AppError('A branch with this GST ID already exists.', 409)); // इस GST ID वाली शाखा पहले से मौजूद है।
        }
    }

    if (mobileNumber) {
        const existingMobileNumber = await Branch.findOne({ mobileNumber });
        if (existingMobileNumber) {
            return next(new AppError('A branch with this mobile number already exists.', 409)); // इस मोबाइल नंबर वाली शाखा पहले से मौजूद है।
        }
    }

    const newBranch = await Branch.create({
        name,
        location,
        shopOwnerName,
        shopGstId: shopGstId || undefined, // Set to undefined if not provided, so Mongoose doesn't save empty string for optional fields
        address,
        mobileNumber: mobileNumber || undefined, // Set to undefined if not provided
        logoImage, // Use the path from multer
        createdBy: req.user._id, // This requires req.user to be set by auth middleware
        status: status || 'active'
    });

    res.status(201).json({
        success: true,
        message: 'Branch created successfully!', // शाखा सफलतापूर्वक बनाई गई!
        data: newBranch
    });
});

exports.getAllBranches = catchAsync(async (req, res, next) => {
    const branches = await Branch.find().populate({
        path: 'createdBy',
        select: 'name username'
    });

    res.status(200).json({
        success: true,
        count: branches.length,
        data: branches
    });
});

exports.getBranch = catchAsync(async (req, res, next) => {
    const branch = await Branch.findById(req.params.id).populate({
        path: 'createdBy',
        select: 'name username'
    });

    if (!branch) {
        return next(new AppError('No branch found with that ID.', 404)); // इस ID के साथ कोई शाखा नहीं मिली।
    }

    res.status(200).json({
        success: true,
        data: branch
    });
});

exports.updateBranch = catchAsync(async (req, res, next) => {
    const allowedFields = {
        name: req.body.name,
        location: req.body.location,
        shopOwnerName: req.body.shopOwnerName,
        shopGstId: req.body.shopGstId,
        address: req.body.address,
        mobileNumber: req.body.mobileNumber,
        status: req.body.status,
        updatedAt: Date.now()
    };

    // If a new logo file is uploaded during an update, override the logoImage field
    if (req.file) {
        allowedFields.logoImage = `/uploads/branch-logos/${req.file.filename}`;
    }

    Object.keys(allowedFields).forEach(key => {
        if (allowedFields[key] === undefined || allowedFields[key] === '') {
            delete allowedFields[key];
        }
    });

    const branch = await Branch.findByIdAndUpdate(
        req.params.id,
        allowedFields,
        {
            new: true, // Return the modified document rather than the original
            runValidators: true // Run schema validators on update
        }
    );

    if (!branch) {
        return next(new AppError('No branch found with that ID to update.', 404)); // अपडेट करने के लिए इस ID के साथ कोई शाखा नहीं मिली।
    }

    res.status(200).json({
        success: true,
        message: 'Branch updated successfully!', // शाखा सफलतापूर्वक अपडेट की गई!
        data: branch
    });
});

exports.deleteBranch = catchAsync(async (req, res, next) => {
    const branch = await Branch.findByIdAndDelete(req.params.id);

    if (!branch) {
        return next(new AppError('No branch found with that ID to delete.', 404)); // डिलीट करने के लिए इस ID के साथ कोई शाखा नहीं मिली।
    }
    res.status(204).json({
        success: true,
        data: null
    });
});