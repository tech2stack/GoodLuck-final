// backend/models/PendingBook.js

const mongoose = require('mongoose');
const validator = require('validator'); // Assuming validator is used elsewhere or will be for mobile if re-added

const pendingBookSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.ObjectId,
        ref: 'Customer', // Reference to the Customer model (which represents schools)
        required: [true, 'Customer (school) is required for a pending book entry.']
    },
    book: {
        type: mongoose.Schema.ObjectId,
        ref: 'BookCatalog', // Reference to the BookCatalog model
        required: [true, 'Book is required for a pending book entry.']
    },
    status: {
        type: String,
        enum: ['pending', 'clear'],
        default: 'clear', // <--- FIX: Changed default status to 'clear'
        required: [true, 'Status is required for a pending book entry.']
    },
    branch: {
        type: mongoose.Schema.ObjectId,
        ref: 'Branch',
        default: null
    },
    pendingDate: {
        type: Date,
        default: null // <--- Changed default to null, set only when status is 'pending'
    },
    clearedDate: {
        type: Date,
        default: null // Set only when status is 'clear'
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt timestamps automatically
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

pendingBookSchema.index({ customer: 1, book: 1, branch: 1 }, { unique: true }); // Added branch to compound unique index for better granularity

const PendingBook = mongoose.model('PendingBook', pendingBookSchema);

module.exports = PendingBook;
