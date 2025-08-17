// backend/models/BranchAdmin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const branchAdminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please enter email'],
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, 'Please enter password'],
        minlength: 8,
        select: false 
    },
    employeeId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Employee',
        required: [true, 'Employee ID is required'],
        unique: true
    },
    role: {
        type: String,
        enum: ['branch_admin'],
        default: 'branch_admin'
    },
    branchId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Branch',
        required: [true, 'Branch ID is required']
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
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
}, {
    timestamps: true
});

branchAdminSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

branchAdminSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

const BranchAdmin = mongoose.model('BranchAdmin', branchAdminSchema);
module.exports = BranchAdmin;