// backend/models/Customer.js
const mongoose = require('mongoose');
const validator = require('validator');

const customerSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: [true, 'Customer name is required'],
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
    branch: {
        type: mongoose.Schema.ObjectId,
        ref: 'Branch',
    },
    city: {
        type: mongoose.Schema.ObjectId,
        ref: 'City',
        required: [true, 'City is required']
    },
   
    salesBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'Employee',
        default: null,
    },
   
    discount: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be less than 0'],
        max: [100, 'Discount cannot exceed 100'],
    },
    returnTime: {
        type: String,
        trim: true,
        maxlength: [100, 'Return time cannot exceed 100 characters'],
        default: null,
    },
    bankName: {
        type: String,
        trim: true,
        maxlength: [100, 'Bank name cannot exceed 100 characters'],
        default: null
    },
    accountNumber: {
        type: String,
        trim: true,
        maxlength: [50, 'Account number cannot exceed 50 characters'],
        default: null
    },
    ifscCode: {
        type: String,
        trim: true,
        maxlength: [20, 'IFSC code cannot exceed 20 characters'],
        default: null
    },
    openingBalance: {
        type: Number,
        default: 0
    },
    balanceType: {
        type: String,
        enum: ['Dr.', 'Cr.'],
        default: 'Dr.'
    },
    customerType: {
        type: String,
        required: [true, 'Customer type is required'],
        enum: [
            'Dealer-Retail',
            'Dealer-Supply',
            'School-Retail',
            'School-Supply',
            'School-Both'
            
        ],
        trim: true
    },
    contactPerson: {
        type: String,
        trim: true,
        maxlength: [100, 'Contact person name cannot exceed 100 characters'],
        default: null
    },
    mobileNumber: {
        type: String,
        // required: [true, 'Mobile number is required'],
        unique: true,
        trim: true,
        validate: {
            validator: function(v) {
                // Allow up to 15 characters to match the frontend,
                // and a check for null or empty string
                return (v === null || v === '') || (v.length >= 10 && v.length <= 15);
            },
            message: props => `${props.value} is not a valid mobile number! It must be between 10 and 15 digits.`
        },
        default: null
    },
    email: {
        type: String,
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                return v === null || v === '' || validator.isEmail(v);
            },
            message: 'Please provide a valid email'
        },
        default: null
    },
    gstNumber: {
        type: String,
        trim: true,
        unique: true,
        maxlength: [15, 'GST number cannot exceed 15 characters'],
        default: null
    },
    aadharNumber: {
        type: String,
        trim: true,
        unique: true,
        maxlength: [16, 'Aadhar number cannot exceed 16 characters'],
        validate: {
            // Updated validation to allow up to 16 digits
            validator: function(v) {
                return (v === null || v === '') || /^\d{12,16}$/.test(v);
            },
            message: props => `${props.value} is not a valid aadhar number! It must be between 12 and 16 characters.`
        },
        default: null
    },
    panNumber: {
        type: String,
        trim: true,
        unique: true,
        maxlength: [10, 'PAN number cannot exceed 10 characters'],
        validate: {
            // Simplified PAN validation
            validator: function(v) {
                return (v === null || v === '') || /^[A-Z]{5}\d{4}[A-Z]{1}$/.test(v);
            },
            message: props => `${props.value} is not a valid PAN number! It must be 10 characters if specified`
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
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    chequeImage: {
        type: String,
        default: null,
    },
    passportImage: {
        type: String,
        default: null,
    },
    otherAttachment: {
        type: String,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// REMOVED: The unique index on customerName and customerType because it can cause issues on updates.
// customerSchema.index({ customerName: 1, customerType: 1 }, { unique: true });

// Existing unique indexes with sparse: true for optional fields
customerSchema.index({ mobileNumber: 1 }, { unique: true, sparse: true });
customerSchema.index({ email: 1 }, { unique: true, sparse: true });
customerSchema.index({ gstNumber: 1 }, { unique: true, sparse: true });
customerSchema.index({ aadharNumber: 1 }, { unique: true, sparse: true });
customerSchema.index({ panNumber: 1 }, { unique: true, sparse: true });

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
