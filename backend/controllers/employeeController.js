// backend/controllers/employeeController.js
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Employee = require('../models/Employee');
const Branch = require('../models/Branch');
const City = require('../models/City');
const Post = require('../models/Post');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
            console.error(`Error initializing default post: ${post.name}`, err);
        }
    }
};

exports.createEmployee = catchAsync(async (req, res, next) => {
    // Passport photo और documentPDF को req.files से अलग करें
    const { passportPhoto, documentPDF } = req.files;

    // बाकी body डेटा को req.body से लें, जिसमें नए बैंक फ़ील्ड भी शामिल हैं
    const {
        name, mobileNumber, address, branchId, cityId, postId, adharNo, panCardNo,
        employeeCode, salary, bankName, accountNo, ifscCode // नए बैंक फ़ील्ड्स
    } = req.body;

    const newEmployeeData = {
        name, mobileNumber, address, branchId, cityId, postId, adharNo, panCardNo,
        employeeCode, salary, bankName, accountNo, ifscCode, // डेटा को नए फ़ील्ड्स में डालें
        passportPhoto: passportPhoto ? passportPhoto[0].path : undefined,
        documentPDF: documentPDF ? documentPDF[0].path : undefined,
    };

    const newEmployee = await Employee.create(newEmployeeData);

    res.status(201).json({
        status: 'success',
        data: { employee: newEmployee }
    });
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
    // req.files में फ़ाइलें हैं या नहीं, यह जाँचें और उन्हें req.body से अलग करें
    const { passportPhoto, documentPDF } = req.files || {};
    const { ...restOfBody } = req.body;

    // यदि फ़ाइलें अपलोड की गई हैं, तो उनके पथ को restOfBody में जोड़ें
    if (passportPhoto) {
        restOfBody.passportPhoto = passportPhoto[0].path;
    }
    if (documentPDF) {
        restOfBody.documentPDF = documentPDF[0].path;
    }

    // अब restOfBody के साथ सही ढंग से अपडेट करें, जिसमें नए बैंक फ़ील्ड भी शामिल हैं
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
        return next(new AppError('No employees found for the role: Store Manager', 404));
    }
    
    res.status(200).json({
        status: 'success',
        results: employees.length,
        data: {
            employees,
        },
    });
});

// Run this function once, perhaps on server start, to ensure default posts exist
initializeDefaultPosts().catch(err => console.error("Failed to initialize default posts:", err));
