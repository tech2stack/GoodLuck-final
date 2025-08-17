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
        trim: true,
    },
    address: {
        type: String,
        trim: true
    },
    branchId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Branch',
        required: [true, 'Please provide the branch ID']
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
        trim: true
    },
    panCardNo: {
        type: String,
        trim: true
    },
    employeeCode: {
        type: String,
        trim: true
    },
    salary: {
        type: Number,
    },
    bankName: {
        type: String,
        trim: true
    },
    accountNo: {
        type: String,
        trim: true
    },
    ifscCode: {
        type: String,
        trim: true
    },
    passportPhoto: {
        type: String,
        trim: true
    },
    documentPDF: {
        type: String,
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

// Create partial unique indexes to allow multiple documents with null or missing values
// but enforce uniqueness for non-null values.

// Unique index for mobileNumber
employeeSchema.index(
    { mobileNumber: 1 },
    {
        unique: true,
        partialFilterExpression: { mobileNumber: { $type: "string" } }
    }
);

// Unique index for adharNo
employeeSchema.index(
    { adharNo: 1 },
    {
        unique: true,
        partialFilterExpression: { adharNo: { $type: "string" } }
    }
);

// Unique index for panCardNo
employeeSchema.index(
    { panCardNo: 1 },
    {
        unique: true,
        partialFilterExpression: { panCardNo: { $type: "string" } }
    }
);

// Unique index for employeeCode
employeeSchema.index(
    { employeeCode: 1 },
    {
        unique: true,
        partialFilterExpression: { employeeCode: { $type: "string" } }
    }
);

// Pre-find middleware to populate fields
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