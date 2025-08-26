// backend/models/Set.js

const mongoose = require('mongoose');

const setSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.ObjectId,
        ref: 'Customer',
        required: [true, 'A set must belong to a customer']
    },
    class: {
        type: mongoose.Schema.ObjectId,
        ref: 'Class',
        required: [true, 'A set must be associated with a class']
    },
    books: [
        {
            book: {
                type: mongoose.Schema.ObjectId,
                ref: 'BookCatalog',
                required: [true, 'Book ID is required']
            },
            quantity: {
                type: Number,
                required: [true, 'Book quantity is required'],
                min: [1, 'Quantity must be at least 1']
            },
            price: {
                type: Number,
                required: [true, 'Book price is required'],
                min: [0, 'Price cannot be negative']
            },
            status: {
                type: String,
                enum: ['active', 'pending', 'clear'],
                default: 'active'
            },
            clearedDate: Date
        }
    ],
    stationeryItems: [
        {
            item: {
                type: mongoose.Schema.ObjectId,
                ref: 'StationeryItem',
                required: [true, 'Stationery item ID is required']
            },
            quantity: {
                type: Number,
                required: [true, 'Stationery quantity is required'],
                min: [1, 'Quantity must be at least 1']
            },
            price: {
                type: Number,
                required: [true, 'Stationery price is required'],
                min: [0, 'Price cannot be negative']
            },
            status: {
                type: String,
                enum: ['active', 'pending', 'clear'],
                default: 'active'
            },
            clearedDate: Date
        }
    ],
    quantity: {
        type: Number,
        required: [true, 'Set quantity is required'],
        min: [0, 'Quantity cannot be negative'],
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: Date,
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexing for faster queries
setSchema.index({ customer: 1, class: 1 }, { unique: true });

// Middleware to update `updatedAt` field on save
setSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Set = mongoose.model('Set', setSchema);

module.exports = Set;