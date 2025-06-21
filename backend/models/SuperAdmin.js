const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator'); // Add if you use it for email validation

const superAdminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A Super Admin must have a name']
    },
    username: {
        type: String,
        required: [true, 'A Super Admin must have a username'],
        unique: true,
        trim: true,
        lowercase: true // Ensure username is unique regardless of case
    },
    email: {
        type: String,
        required: [true, 'A Super Admin must have an email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'A password is required'],
        minlength: 8,
        select: false // Do not return password by default
    },
    role: {
        type: String,
        enum: ['super_admin'],
        default: 'super_admin'
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
    passwordChangedAt: Date,
});

superAdminSchema.pre('save', async function(next) {
    // Only run this function if password was actually modified
    if (!this.isModified('password')) return next();

    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

superAdminSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

const SuperAdmin = mongoose.model('SuperAdmin', superAdminSchema);

module.exports = SuperAdmin;