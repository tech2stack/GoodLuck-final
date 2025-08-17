// backend/models/StockManager.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); 

const StockManagerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/.+@.+\..+/, 'Please fill a valid email address'],
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false 
    },
    address: {
        type: String,
        required: true,
        trim: true,
    },
    role: {
        type: String,
        default: 'stock_manager',
        enum: ['stock_manager'], 
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

StockManagerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

StockManagerSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

module.exports = mongoose.model('StockManager', StockManagerSchema);