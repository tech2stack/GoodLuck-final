const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Branch = require('../models/Branch');
const BranchAdmin = require('../models/BranchAdmin'); // <-- NEW: Import BranchAdmin model
const multer = require('multer');
const path = require('path');

// --- Multer Setup for Image Uploads ---
const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
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

exports.uploadBranchLogo = upload.single('logoImage');

// --- Branch Controller Functions ---
exports.createBranch = catchAsync(async (req, res, next) => {
    const { name, location, shopOwnerName, shopGstId, address, mobileNumber, status } = req.body;
    const logoImage = req.file ? `/uploads/branch-logos/${req.file.filename}` : 'no-photo.jpg';

    if (!name || !location || !shopOwnerName || !address) {
        return next(new AppError('Please provide the branch name, location, owner name, and address.', 400));
    }

    const existingBranchName = await Branch.findOne({ name });
    if (existingBranchName) {
        return next(new AppError('A branch with this name already exists.', 409));
    }

    if (shopGstId) {
        const existingGstId = await Branch.findOne({ shopGstId });
        if (existingGstId) {
            return next(new AppError('A branch with this GST ID already exists.', 409));
        }
    }

    if (mobileNumber) {
        const existingMobileNumber = await Branch.findOne({ mobileNumber });
        if (existingMobileNumber) {
            return next(new AppError('A branch with this mobile number already exists.', 409));
        }
    }

    const newBranch = await Branch.create({
        name,
        location,
        shopOwnerName,
        shopGstId: shopGstId || undefined,
        address,
        mobileNumber: mobileNumber || undefined,
        logoImage,
        createdBy: req.user._id,
        status: status || 'active'
    });

    res.status(201).json({
        success: true,
        message: 'Branch created successfully!',
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
        return next(new AppError('No branch found with that ID.', 404));
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
            new: true,
            runValidators: true
        }
    );

    if (!branch) {
        return next(new AppError('No branch found with that ID to update.', 404));
    }

    res.status(200).json({
        success: true,
        message: 'Branch updated successfully!',
        data: branch
    });
});

exports.deleteBranch = catchAsync(async (req, res, next) => {
    const branchId = req.params.id;

    // --- NEW LOGIC: Check for associated Branch Admins ---
    const associatedAdmins = await BranchAdmin.find({ branchId: branchId });

    if (associatedAdmins.length > 0) {
        return next(new AppError(
            'Cannot delete this branch. Please unassign or delete all associated branch administrators first.',
            400 // Bad Request
        ));
    }
    // --- END NEW LOGIC ---

    const branch = await Branch.findByIdAndDelete(branchId); // Use branchId directly

    if (!branch) {
        return next(new AppError('No branch found with that ID to delete.', 404));
    }

    res.status(204).json({
        success: true,
        data: null
    });
});
