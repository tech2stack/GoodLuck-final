// backend/models/Customer.js
const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
    customerName: { // Changed from 'name' back to 'customerName' as per original request
        type: String,
        required: [true, 'Customer name is required'],
        unique: true, // Customer names should be unique
        trim: true,
        maxlength: [100, 'Customer name cannot be more than 100 characters']
    },
    schoolCode: {
        type: String,
        trim: true,
        maxlength: [50, 'School code cannot be more than 50 characters']
    },
    branch: {
        type: mongoose.Schema.ObjectId,
        ref: 'Branch', // Reference to the Branch model
        required: [true, 'Branch is required']
    },
    city: {
        type: mongoose.Schema.ObjectId,
        ref: 'City', // Reference to the City model
        required: [true, 'City is required']
    },
    contactPerson: {
        type: String,
        trim: true,
        maxlength: [100, 'Contact person name cannot be more than 100 characters']
    },
    mobileNumber: {
        type: String,
        required: [true, 'Mobile number is required'],
        unique: true, // Mobile numbers should be unique
        trim: true,
        match: [/^\d{10}$/, 'Please fill a valid 10-digit mobile number']
    },
    email: {
        type: String,
        unique: true, // Email should be unique
        sparse: true, // Allows null values to not violate unique constraint
        lowercase: true,
        trim: true,
        match: [/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'Please fill a valid email address']
    },
    gstNumber: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        maxlength: [15, 'GST number cannot be more than 15 characters']
    },
    aadharNumber: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        match: [/^\d{12}$/, 'Please fill a valid 12-digit Aadhar number']
    },
    panNumber: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please fill a valid PAN number']
    },
    shopAddress: {
        type: String,
        trim: true
    },
    homeAddress: {
        type: String,
        trim: true
    },
    image: { // NEW FIELD: To store Base64 string or URL
        type: String,
        default: 'https://placehold.co/200x200/cccccc/ffffff?text=No+Image' // Default placeholder if no image is provided
    },
    // balance field removed as per user request
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries on common fields
CustomerSchema.index({ customerName: 1, branch: 1, city: 1 });
CustomerSchema.index({ mobileNumber: 1 });
CustomerSchema.index({ email: 1 });

module.exports = mongoose.model('Customer', CustomerSchema);
