// backend/controllers/branchAdminController.js
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const BranchAdmin = require('../models/BranchAdmin'); // Direct import
const Branch = require('../models/Branch');          // Direct import

exports.createBranchAdmin = catchAsync(async (req, res, next) => {
    const { name, email, password, branchId } = req.body;

    if (!name || !email || !password || !branchId) {
        return next(new AppError('Please provide name, email, password, and branch ID.', 400));
    }

    const branchExists = await Branch.findById(branchId);
    if (!branchExists) {
        return next(new AppError('Provided branch ID does not exist.', 404));
    }

    const existingAdminByEmail = await BranchAdmin.findOne({ email });
    if (existingAdminByEmail) {
        return next(new AppError('This email is already registered to another branch admin.', 409));
    }

    const newAdmin = await BranchAdmin.create({ name, email, password, branchId, role: 'branch_admin' });

    res.status(201).json({
        status: 'success',
        data: {
            admin: newAdmin
        }
    });
});

exports.getAllBranchAdmins = catchAsync(async (req, res, next) => {
    const admins = await BranchAdmin.find().populate({
        path: 'branchId',
        select: 'name location'
    });
    res.status(200).json({
        status: 'success',
        results: admins.length,
        data: admins
    });
});

exports.getBranchAdmin = catchAsync(async (req, res, next) => {
    const admin = await BranchAdmin.findById(req.params.id).populate({
        path: 'branchId',
        select: 'name location'
    });
    if (!admin) return next(new AppError('No admin found with this ID.', 404));
    res.status(200).json({ status: 'success', data: { admin } });
});

exports.updateBranchAdmin = catchAsync(async (req, res, next) => {
    const { branchId } = req.body;

    if (branchId) {
        const branchExists = await Branch.findById(branchId);
        if (!branchExists) {
            return next(new AppError('Provided branch ID does not exist for update.', 404));
        }
    }

    const updatedAdmin = await BranchAdmin.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    if (!updatedAdmin) return next(new AppError('No admin found with this ID to update.', 404));
    res.status(200).json({ status: 'success', data: { admin: updatedAdmin } });
});

exports.deleteBranchAdmin = catchAsync(async (req, res, next) => {
    const admin = await BranchAdmin.findByIdAndDelete(req.params.id);
    if (!admin) return next(new AppError('No admin found with this ID to delete.', 404));
    res.status(204).json({ status: 'success', data: null });
});