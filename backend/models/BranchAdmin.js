const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Assuming you use bcrypt for password hashing

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
        // Add email validation if needed
    },
    password: {
        type: String,
        required: [true, 'Please enter password'],
        minlength: 8,
        select: false // Do not return password in queries by default
    },
    role: {
        type: String,
        enum: ['branch_admin'], // Explicitly define role
        default: 'branch_admin'
    },
    branchId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Branch', // Reference to the Branch model
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

// Password hashing middleware (pre-save hook)
branchAdminSchema.pre('save', async function(next) {
    // Only run this function if password was actually modified
    if (!this.isModified('password')) return next();

    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);

    // Delete passwordConfirm field (if you have one)
    // this.passwordConfirm = undefined;
    next();
});

// Instance method to compare passwords
branchAdminSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

const BranchAdmin = mongoose.model('BranchAdmin', branchAdminSchema);

module.exports = BranchAdmin;