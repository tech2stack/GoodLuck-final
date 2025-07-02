// backend/models/Customer.js

const mongoose = require('mongoose');
const validator = require('validator'); // For email and mobile validation

const customerSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: [true, 'Customer name is required'], // Customer name is required
        unique: true, // Customer name must be unique
        trim: true,
        maxlength: [100, 'Customer name cannot exceed 100 characters']
    },
    schoolCode: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: [20, 'School code cannot exceed 20 characters'],
        default: null // Default to null for optional fields
    },
    branch: {
        type: mongoose.Schema.ObjectId,
        ref: 'Branch', // Reference to the Branch model
        required: [true, 'Branch is required'] // Branch is required
    },
    city: {
        type: mongoose.Schema.ObjectId,
        ref: 'City', // Reference to the City model
        required: [true, 'City is required'] // City is required
    },
    contactPerson: {
        type: String,
        trim: true,
        maxlength: [100, 'Contact person name cannot exceed 100 characters'],
        default: null
    },
    mobileNumber: {
        type: String,
        trim: true,
        // Custom validator for mobile number: only validates if a value is provided
        validate: {
            validator: function(val) {
                // If value is null or empty, consider it valid (optional field)
                return val === null || val === '' || (validator.isMobilePhone(val, 'en-IN') && val.length === 10);
            },
            message: 'Please provide a valid 10-digit Indian mobile number if specified'
        },
        default: null
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        // Custom validator for email: only validates if a value is provided
        validate: {
            validator: function(val) {
                // If value is null or empty, consider it valid (optional field)
                return val === null || val === '' || validator.isEmail(val);
            },
            message: 'Please provide a valid email if specified'
        },
        default: null
    },
    gstNumber: {
        type: String,
        trim: true,
        uppercase: true,
        // Custom validator for GST number: only validates if a value is provided
        validate: {
            validator: function(val) {
                // If value is null or empty, consider it valid (optional field)
                return val === null || val === '' || (val.length === 15); // GST number must be 15 characters
            },
            message: 'GST number must be 15 characters if specified'
        },
        default: null
    },
    aadharNumber: {
        type: String,
        trim: true,
        // Custom validator for Aadhar number: only validates if a value is provided
        validate: {
            validator: function(val) {
                // If value is null or empty, consider it valid (optional field)
                return val === null || val === '' || (val.length === 12); // Aadhar number must be 12 digits
            },
            message: 'Aadhar number must be 12 digits if specified'
        },
        default: null
    },
    panNumber: {
        type: String,
        trim: true,
        uppercase: true,
        // Custom validator for PAN number: only validates if a value is provided
        validate: {
            validator: function(val) {
                // If value is null or empty, consider it valid (optional field)
                return val === null || val === '' || (val.length === 10); // PAN number must be 10 characters
            },
            message: 'PAN number must be 10 characters if specified'
        },
        default: null
    },
    shopAddress: {
        type: String,
        trim: true,
        maxlength: [200, 'Shop address cannot exceed 200 characters'],
        default: null
    },
    homeAddress: {
        type: String,
        trim: true,
        maxlength: [200, 'Home address cannot exceed 200 characters'],
        default: null
    },
    image: {
        type: String,
        default: 'https://placehold.co/200x200/cccccc/ffffff?text=No+Image'
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexing for faster queries.
// Only customerName is unique. Other fields can have duplicates or be null.
customerSchema.index({ customerName: 1 }, { unique: true }); // Unique index for customerName
customerSchema.index({ mobileNumber: 1 }); // Index for mobileNumber (not unique)
customerSchema.index({ email: 1 });       // Index for email (not unique)
customerSchema.index({ gstNumber: 1 });   // Index for gstNumber (not unique)
customerSchema.index({ aadharNumber: 1 });// Index for aadharNumber (not unique)
customerSchema.index({ panNumber: 1 });   // Index for panNumber (not unique)


const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
