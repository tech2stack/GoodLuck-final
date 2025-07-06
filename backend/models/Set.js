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
            price: { // Store the price at the time of adding to the set
                type: Number,
                required: [true, 'Book price is required'],
                min: [0, 'Price cannot be negative']
            },
            // FIX: Ensure 'active' is a valid enum value
            status: {
                type: String,
                enum: ['active', 'pending', 'clear'], // Added 'active' here
                default: 'active' // Default status when a book is added to a set
            },
            clearedDate: Date // Date when the book status was set to 'clear'
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
            price: { // Store the price at the time of adding to the set
                type: Number,
                required: [true, 'Stationery price is required'],
                min: [0, 'Price cannot be negative']
            },
            // FIX: Ensure 'active' is a valid enum value
            status: {
                type: String,
                enum: ['active', 'pending', 'clear'], // Added 'active' here
                default: 'active' // Default status when a stationery item is added to a set
            },
            clearedDate: Date // Date when the stationery item status was set to 'clear'
        }
    ],
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
