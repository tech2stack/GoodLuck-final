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
        required: false,
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
        required: false
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
        unique: true, // <-- `unique` ko `true` rakhiye, isse har adhar number unique rahega
        sparse: true, // <-- **Yahaan par `sparse: true` jodiye.** Isse null values ko ignore kiya jayega
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

// Add a pre-find hook to automatically populate the 'post', 'branchId', and 'cityId' fields
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