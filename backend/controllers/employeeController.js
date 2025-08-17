// backend/controllers/employeeController.js
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Employee = require('../models/Employee');
const Branch = require('../models/Branch');
const City = require('../models/City');
const Post = require('../models/Post');
const mongoose = require('mongoose');

// A function to initialize default posts
const initializeDefaultPosts = async () => {
    const defaultPosts = [
        { name: 'Sales Representative', isDeletable: false },
        { name: 'Store Manager', isDeletable: false },
        { name: 'Stock Manager', isDeletable: false },
        { name: 'Area Manager', isDeletable: false },
        { name: 'Human Resource (HR)', isDeletable: false },
        { name: 'Technical Manager', isDeletable: false },
        { name: 'Driver', isDeletable: false },
        { name: 'Sweeper', isDeletable: false },
        { name: 'Helper', isDeletable: false },
        { name: 'Assistant', isDeletable: false },
        { name: 'Transport Manager', isDeletable: false },
        { name: 'Receptionist', isDeletable: false }
    ];

    for (const post of defaultPosts) {
        try {
            await Post.findOneAndUpdate({ name: post.name }, post, { upsert: true, new: true, runValidators: true });
        } catch (err) {
            console.error(`Error initializing post: ${post.name}`, err);
        }
    }
};

initializeDefaultPosts();

exports.createEmployee = catchAsync(async (req, res, next) => {
    // Collect all fields from request body, and files from req.files
    const { name, mobileNumber, address, branchId, postId, cityId, adharNo, panCardNo, employeeCode, salary, bankDetail, status } = req.body;
    const passportPhotoPath = req.files && req.files['passportPhoto'] ? req.files['passportPhoto'][0].path : undefined;
    const documentPDFPath = req.files && req.files['documentPDF'] ? req.files['documentPDF'][0].path : undefined;

    // Validate based on your provided schema and requirements
    if (!name || !postId || !cityId) {
        return next(new AppError('Please provide employee name, post, and city.', 400));
    }
    
    // Check if provided IDs are valid MongoDB ObjectIds
    if (postId && !mongoose.Types.ObjectId.isValid(postId)) {
        return next(new AppError('Provided post ID is not a valid MongoDB ObjectId.', 400));
    }
    if (cityId && !mongoose.Types.ObjectId.isValid(cityId)) {
        return next(new AppError('Provided city ID is not a valid MongoDB ObjectId.', 400));
    }
    if (branchId && !mongoose.Types.ObjectId.isValid(branchId)) {
        return next(new AppError('Provided branch ID is not a valid MongoDB ObjectId.', 400));
    }

    // Find the post to check if it's a 'Store Manager'
    const post = await Post.findById(postId);
    if (!post) {
        return next(new AppError('Provided post ID does not exist.', 404));
    }
    
    // A branch must be assigned to a Store Manager.
    if (post.name === 'Store Manager' && !branchId) {
        return next(new AppError('A branch must be assigned to a Store Manager.', 400));
    }

    if (branchId) {
        const branchExists = await Branch.findById(branchId);
        if (!branchExists) {
            return next(new AppError('Provided branch ID does not exist.', 404));
        }
    }

    const cityExists = await City.findById(cityId);
    if (!cityExists) {
        return next(new AppError('Provided city ID does not exist.', 404));
    }

    const newEmployee = await Employee.create({
        name,
        mobileNumber,
        address,
        branchId,
        postId,
        cityId,
        adharNo,
        panCardNo,
        employeeCode,
        salary,
        bankDetail,
        passportPhoto: passportPhotoPath,
        documentPDF: documentPDFPath,
        status,
    });

    res.status(201).json({ status: 'success', data: { employee: newEmployee } });
});

exports.getAllEmployees = catchAsync(async (req, res, next) => {
    const employees = await Employee.find();
    res.status(200).json({ status: 'success', results: employees.length, data: { employees } });
});

exports.getEmployee = catchAsync(async (req, res, next) => {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return next(new AppError('No employee found with that ID.', 404));
    res.status(200).json({ status: 'success', data: { employee } });
});

exports.updateEmployee = catchAsync(async (req, res, next) => {
    const { branchId, postId, cityId, ...restOfBody } = req.body;

    // Check if provided IDs are valid MongoDB ObjectIds
    if (branchId && !mongoose.Types.ObjectId.isValid(branchId)) {
        return next(new AppError('Provided branch ID is not a valid MongoDB ObjectId.', 400));
    }
    if (postId && !mongoose.Types.ObjectId.isValid(postId)) {
        return next(new AppError('Provided post ID is not a valid MongoDB ObjectId.', 400));
    }
    if (cityId && !mongoose.Types.ObjectId.isValid(cityId)) {
        return next(new AppError('Provided city ID is not a valid MongoDB ObjectId.', 400));
    }

    if (branchId) {
        const branchExists = await Branch.findById(branchId);
        if (!branchExists) {
            return next(new AppError('Provided branch ID does not exist.', 404));
        }
        restOfBody.branchId = branchId;
    }

    if (postId) {
        const postExists = await Post.findById(postId);
        if (!postExists) {
            return next(new AppError('Provided post ID does not exist.', 404));
        }
        restOfBody.postId = postId;
    }

    if (cityId) {
        const cityExists = await City.findById(cityId);
        if (!cityExists) {
            return next(new AppError('Provided city ID does not exist.', 404));
        }
        restOfBody.cityId = cityId;
    }

    if (req.files) {
        if (req.files['passportPhoto'] && req.files['passportPhoto'].length > 0) {
            restOfBody.passportPhoto = req.files['passportPhoto'][0].path;
        }
        if (req.files['documentPDF'] && req.files['documentPDF'].length > 0) {
            restOfBody.documentPDF = req.files['documentPDF'][0].path;
        }
    }

    // Now correctly update with restOfBody
    const updatedEmployee = await Employee.findByIdAndUpdate(req.params.id, restOfBody, { new: true, runValidators: true });

    if (!updatedEmployee) return next(new AppError('No employee found with that ID to update.', 404));
    res.status(200).json({ status: 'success', data: { employee: updatedEmployee } });
});

exports.deleteEmployee = catchAsync(async (req, res, next) => {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return next(new AppError('No employee found with that ID to delete.', 404));
    res.status(204).json({ status: 'success', data: null });
});

exports.getEmployeesByRole = catchAsync(async (req, res, next) => {
    const post = await Post.findOne({ name: 'Store Manager' });
    if (!post) {
        return next(new AppError('The "Store Manager" post does not exist.', 404));
    }
    const employees = await Employee.find({ postId: post._id }).select('name mobileNumber');
    
    if (!employees || employees.length === 0) {
        return next(new AppError('No employees found with the role of Store Manager.', 404));
    }
    res.status(200).json({ status: 'success', results: employees.length, data: { employees } });
});