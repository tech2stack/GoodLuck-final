// backend/controllers/branchAdminController.js
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const BranchAdmin = require('../models/BranchAdmin');
const Employee = require('../models/Employee');
const Post = require('../models/Post'); // Import the Post model

exports.createBranchAdmin = catchAsync(async (req, res, next) => {
    const { employeeId, email, password } = req.body;

    if (!employeeId || !email || !password) {
        return next(new AppError('Please provide employee ID, email, and password.', 400));
    }
    
    const employee = await Employee.findById(employeeId);
    if (!employee) {
        return next(new AppError('No employee found with the provided ID.', 404));
    }

    const existingAdminByEmployee = await BranchAdmin.findOne({ employeeId });
    if (existingAdminByEmployee) {
        return next(new AppError('This employee is already a branch admin.', 409));
    }

    const existingAdminByEmail = await BranchAdmin.findOne({ email });
    if (existingAdminByEmail) {
        return next(new AppError('This email is already registered to another branch admin.', 409));
    }

    const newAdmin = await BranchAdmin.create({ 
        name: employee.name, 
        email,
        password, 
        branchId: employee.branchId, // Get branchId from the employee
        employeeId: employee._id, 
        role: 'branch_admin'
    });

    res.status(201).json({ status: 'success', data: { admin: newAdmin } });
});

// NEW: Controller function to get employees by post (role)
exports.getEmployeesByPost = catchAsync(async (req, res, next) => {
    const { roleName } = req.params;

    // Find the Post ID for the given role name
    const post = await Post.findOne({ name: roleName });
    if (!post) {
        return next(new AppError(`No post found with the name '${roleName}'.`, 404));
    }

    // Find all employees with that post ID who are not already a branch admin
    const employees = await Employee.find({ postId: post._id });
    
    // Find all employees who are already branch admins
    const existingAdmins = await BranchAdmin.find({}).select('employeeId');
    const existingAdminEmployeeIds = existingAdmins.map(admin => admin.employeeId.toString());

    // Filter out employees who are already branch admins
    const eligibleEmployees = employees.filter(employee => !existingAdminEmployeeIds.includes(employee._id.toString()));

    res.status(200).json({ status: 'success', results: eligibleEmployees.length, data: { employees: eligibleEmployees } });
});


exports.getAllBranchAdmins = catchAsync(async (req, res, next) => {
    const admins = await BranchAdmin.find().populate([
        { path: 'branchId', select: 'name location' },
        { path: 'employeeId', select: 'name mobileNumber' }
    ]);
    res.status(200).json({ status: 'success', results: admins.length, data: admins });
});

exports.getBranchAdmin = catchAsync(async (req, res, next) => {
    const admin = await BranchAdmin.findById(req.params.id).populate([
        { path: 'branchId', select: 'name location' },
        { path: 'employeeId', select: 'name mobileNumber' }
    ]);
    if (!admin) return next(new AppError('No admin found with this ID.', 404));
    res.status(200).json({ status: 'success', data: { admin } });
});

exports.updateBranchAdmin = catchAsync(async (req, res, next) => {
    const { email, password, status } = req.body;
    
    const updateFields = {};
    if (email) updateFields.email = email;
    if (password) updateFields.password = password;
    if (status) updateFields.status = status;

    const updatedAdmin = await BranchAdmin.findByIdAndUpdate(req.params.id, updateFields, { new: true, runValidators: true });
    if (!updatedAdmin) return next(new AppError('No admin found with this ID to update.', 404));
    res.status(200).json({ status: 'success', data: { admin: updatedAdmin } });
});

exports.deleteBranchAdmin = catchAsync(async (req, res, next) => {
    const admin = await BranchAdmin.findByIdAndDelete(req.params.id);
    if (!admin) return next(new AppError('No admin found with this ID to delete.', 404));
    res.status(204).json({ status: 'success', data: null });
});