// backend/controllers/employeeController.js
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Employee = require('../models/Employee');
const Branch = require('../models/Branch'); // Needed if creating/updating employees with branchId

exports.createEmployee = catchAsync(async (req, res, next) => {
    // Ensure req.body contains all necessary fields.
    // The model's pre-save hook will hash the password.
    const { name, email, password, role, branchId, phoneNumber, address } = req.body;

    if (!name || !email || !password || !branchId || !role) {
        return next(new AppError('Please provide name, email, password, role, and branch ID.', 400));
    }

    // Validate the provided branchId
    const branchExists = await Branch.findById(branchId);
    if (!branchExists) {
        return next(new AppError('Provided branch ID does not exist for employee.', 404));
    }

    // Check for existing employee with the same email
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
        return next(new AppError('Employee with this email already exists.', 409));
    }

    // Create the employee. Mongoose schema validation will handle 'role' enum checks.
    const newEmployee = await Employee.create(req.body);
    res.status(201).json({ status: 'success', data: { employee: newEmployee } });
});

exports.getAllEmployees = catchAsync(async (req, res, next) => {
    // Admins only see employees from their branch, SuperAdmin sees all
    let filter = {};
    if (req.user.role === 'branch_admin' && req.user.branchId) {
        // Ensure filter field matches the model's field name (now 'branchId')
        filter.branchId = req.user.branchId;
    }
    const employees = await Employee.find(filter).populate({
        path: 'branchId', // --- FIX: Changed path to 'branchId' from 'branch_id' ---
        select: 'name location'
    });
    res.status(200).json({ status: 'success', results: employees.length, data: employees });
});

exports.getEmployee = catchAsync(async (req, res, next) => {
    const employee = await Employee.findById(req.params.id).populate({
        path: 'branchId', // --- FIX: Changed path to 'branchId' from 'branch_id' ---
        select: 'name location'
    });
    if (!employee) return next(new AppError('No employee found with that ID.', 404));
    // Add logic here: if employee is trying to view self, or super admin/branch admin for relevant branch
    res.status(200).json({ status: 'success', data: { employee } });
});

exports.updateEmployee = catchAsync(async (req, res, next) => {
    const { branchId, password, ...restOfBody } = req.body; // Destructure password to prevent direct update via this route

    // If branchId is being updated, validate it
    if (branchId) {
        const branchExists = await Branch.findById(branchId);
        if (!branchExists) {
            return next(new AppError('Provided branch ID does not exist for update.', 404));
        }
    }

    // Prevent password from being updated via this generic update route
    // Passwords should be updated via a dedicated 'change password' route
    if (password) {
        return next(new AppError('Password cannot be updated via this route. Please use the /updateMyPassword route.', 400));
    }

    // --- FIX: Use restOfBody to prevent unauthorized password updates ---
    const updatedEmployee = await Employee.findByIdAndUpdate(req.params.id, restOfBody, { new: true, runValidators: true });
    // --- END FIX ---

    if (!updatedEmployee) return next(new AppError('No employee found with that ID to update.', 404));
    res.status(200).json({ status: 'success', data: { employee: updatedEmployee } });
});

exports.deleteEmployee = catchAsync(async (req, res, next) => {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return next(new AppError('No employee found with that ID to delete.', 404));
    res.status(204).json({ status: 'success', data: null });
});