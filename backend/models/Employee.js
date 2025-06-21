// backend/models/Employee.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const employeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please enter your email'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please enter a valid email address'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please enter your password'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false // Do not return password in queries
    },
    role: {
        type: String,
        // --- FIX: Expanded enum to include all expected employee roles ---
        enum: ['employee', 'cashier', 'manager', 'sales'],
        // --- END FIX ---
        default: 'employee' // You can set a sensible default
    },
    // --- FIX: Changed branch_id to branchId for consistency with frontend and controller payload ---
    branchId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Branch',
        required: [true, 'Please select the branch to which this employee belongs']
    },
    // --- END FIX ---
    status: { // Added status field if not already present
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

// Hash password before saving
employeeSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare entered password with hashed password
// --- FIX: Renamed matchPassword to correctPassword for consistency ---
employeeSchema.methods.correctPassword = async function (enteredPassword, userPassword) {
    return await bcrypt.compare(enteredPassword, userPassword);
};
// --- END FIX ---

// Method to generate JWT token
employeeSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
        // --- FIX: Corrected env var name for expiresIn ---
        expiresIn: process.env.JWT_EXPIRES_IN // Should be JWT_EXPIRES_IN, not JWT_EXPIRE
        // --- END FIX ---
    });
};

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;