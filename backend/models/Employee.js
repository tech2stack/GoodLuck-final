// backend/models/Employee.js
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const employeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name'],
        trim: true
    },
    mobileNumber: {
        type: String,
        required: false, // <-- `required` ko false kiya gaya hai
        unique: false,
        trim: true,
    },
    address: {
        type: String,
        required: false,
        trim: true
    },
    branchId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Branch',
        required: [true, 'Please provide the branch ID'] // <-- `required` ko true kiya gaya hai
    },
    cityId: {
        type: mongoose.Schema.ObjectId,
        ref: 'City',
        required: [true, 'Please provide the city ID'],
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    postId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Post',
        required: [true, 'Please provide the employees job post ID']
    },
    adharNo: {
        type: String,
        required: false,
        unique: true,
        sparse: true,
        trim: true
    },
    panCardNo: {
        type: String,
        required: false,
        trim: true
    },
    employeeCode: {
        type: String,
        required: false,
        unique: false,
        trim: true
    },
    salary: {
        type: Number,
        required: false,
    },
    bankName: {
        type: String,
        required: false,
        trim: true
    },
    accountNo: {
        type: String,
        required: false,
        trim: true
    },
    ifscCode: {
        type: String,
        required: false,
        trim: true
    },
    passportPhoto: {
        type: String,
        required: false,
        trim: true
    },
    documentPDF: {
        type: String,
        required: false,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

employeeSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'postId',
        select: 'name'
    })
    .populate({
        path: 'cityId',
        select: 'name'
    })
    .populate({
        path: 'branchId',
        select: 'name location'
    });
    next();
});

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;