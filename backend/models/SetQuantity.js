// backend/models/SetQuantity.js

const mongoose = require('mongoose');

const setQuantitySchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.ObjectId,
        ref: 'Customer',
        required: [true, 'A set quantity must belong to a customer'],
    },
    class: {
        type: mongoose.Schema.ObjectId,
        ref: 'Class',
        required: [true, 'A set quantity must be associated with a class'],
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [0, 'Quantity cannot be negative'],
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
    },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Unique index to ensure one quantity per customer-class combination
setQuantitySchema.index({ customer: 1, class: 1 }, { unique: true });

// Middleware to update `updatedAt` field on save
setQuantitySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const SetQuantity = mongoose.model('SetQuantity', setQuantitySchema);

module.exports = SetQuantity;