// backend/models/Employee.js
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const employeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name'],
        trim: true
    },
    // Replaced 'email' with 'mobileNumber'
    mobileNumber: {
        type: String,
        required: [true, 'Please enter your mobile number'],
        unique: true, // Mobile numbers should be unique
        trim: true,
        // You might want to add a regex for mobile number validation here
        // Example: match: [/^\d{10}$/, 'Please enter a valid 10-digit mobile number']
    },
    // Added 'address' field
    address: {
        type: String,
        required: [true, 'Please enter the employee\'s address'],
        trim: true
    },
    branchId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Branch',
        required: [true, 'Please select the branch to which this employee belongs']
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
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

employeeSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;