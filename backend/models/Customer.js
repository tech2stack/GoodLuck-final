// backend/models/Customer.js (Ensure this file has the 'branch' field added)
const mongoose = require('mongoose');
const validator = require('validator');

const customerSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: [true, 'Customer name is required'],
        unique: true,
        trim: true,
        maxlength: [100, 'Customer name cannot exceed 100 characters']
    },
    schoolCode: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: [20, 'School code cannot exceed 20 characters'],
        default: null
    },
    branch: { // THIS FIELD IS CRUCIAL FOR THE CASCADING DROPDOWN
        type: mongoose.Schema.ObjectId,
        ref: 'Branch',
        required: [true, 'Branch is required']
    },
    city: {
        type: mongoose.Schema.ObjectId,
        ref: 'City',
        required: [true, 'City is required']
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
        validate: {
            validator: function(val) {
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
        validate: {
            validator: function(val) {
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
        validate: {
            validator: function(val) {
                return val === null || val === '' || (val.length === 15);
            },
            message: 'GST number must be 15 characters if specified'
        },
        default: null
    },
    aadharNumber: {
        type: String,
        trim: true,
        validate: {
            validator: function(val) {
                return val === null || val === '' || (val.length === 12);
            },
            message: 'Aadhar number must be 12 digits if specified'
        },
        default: null
    },
    panNumber: {
        type: String,
        trim: true,
        uppercase: true,
        validate: {
            validator: function(val) {
                return val === null || val === '' || (val.length === 10);
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

customerSchema.index({ customerName: 1 }, { unique: true });
customerSchema.index({ mobileNumber: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ gstNumber: 1 });
customerSchema.index({ aadharNumber: 1 });
customerSchema.index({ panNumber: 1 });


const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;