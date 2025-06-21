const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Employee = require('../models/Employee');
const Branch = require('../models/Branch');

exports.createEmployee = catchAsync(async (req, res, next) => {
    // Replaced 'email' with 'mobileNumber', added 'address'
    const { name, mobileNumber, address, branchId, phoneNumber, status } = req.body;

    // Updated validation check for required fields
    if (!name || !mobileNumber || !address || !branchId) {
        return next(new AppError('Please provide name, mobile number, address, and branch ID.', 400));
    }

    // Validate the provided branchId
    const branchExists = await Branch.findById(branchId);
    if (!branchExists) {
        return next(new AppError('Provided branch ID does not exist for employee.', 404));
    }

    // Check for existing employee with the same mobile number
    const existingEmployee = await Employee.findOne({ mobileNumber }); // Changed from email
    if (existingEmployee) {
        return next(new AppError('Employee with this mobile number already exists.', 409));
    }

    // Create the employee with the new fields
    const newEmployee = await Employee.create({
        name,
        mobileNumber, // New field
        address,      // New field
        branchId,
        phoneNumber: phoneNumber || mobileNumber, // Assuming phoneNumber might be the same as mobileNumber, or separate
        status: status || 'active'
    });
    res.status(201).json({ status: 'success', data: { employee: newEmployee } });
});

exports.getAllEmployees = catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.user.role === 'branch_admin' && req.user.branchId) {
        filter.branchId = req.user.branchId;
    }
    const employees = await Employee.find(filter).populate({
        path: 'branchId',
        select: 'name location'
    });
    res.status(200).json({ status: 'success', results: employees.length, data: employees });
});

exports.getEmployee = catchAsync(async (req, res, next) => {
    const employee = await Employee.findById(req.params.id).populate({
        path: 'branchId',
        select: 'name location'
    });
    if (!employee) return next(new AppError('No employee found with that ID.', 404));
    res.status(200).json({ status: 'success', data: { employee } });
});

exports.updateEmployee = catchAsync(async (req, res, next) => {
    // Destructure to include new fields, ensure others are removed if still present in req.body
    const { branchId, password, role, email, ...restOfBody } = req.body; // Added email to filter out if sent

    // If branchId is being updated, validate it
    if (branchId) {
        const branchExists = await Branch.findById(branchId);
        if (!branchExists) {
            return next(new AppError('Provided branch ID does not exist for update.', 404));
        }
    }

    // The 'restOfBody' now correctly contains 'name', 'mobileNumber', 'address', 'phoneNumber', 'status'
    const updateFields = { ...restOfBody };
    if (branchId) { // Only add branchId if it was provided for update
        updateFields.branchId = branchId;
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(req.params.id, updateFields, { new: true, runValidators: true });

    if (!updatedEmployee) return next(new AppError('No employee found with that ID to update.', 404));
    res.status(200).json({ status: 'success', data: { employee: updatedEmployee } });
});

exports.deleteEmployee = catchAsync(async (req, res, next) => {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return next(new AppError('No employee found with that ID to delete.', 404));
    res.status(204).json({ status: 'success', data: null });
});