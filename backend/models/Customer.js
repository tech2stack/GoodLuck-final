// backend/models/Customer.js
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
    branch: {
        type: mongoose.Schema.ObjectId,
        ref: 'Branch',
        // 'required' validation removed from here and moved to the controller
        // where it can be conditionally applied.
    },
    city: {
        type: mongoose.Schema.ObjectId,
        ref: 'City',
        required: [true, 'City is required']
    },
    zone: {
        type: String,
        trim: true,
        maxlength: [50, 'Zone cannot exceed 50 characters'],
        default: null,
    },
    salesBy: {
        type: String,
        trim: true,
        maxlength: [100, 'Sales By cannot exceed 100 characters'],
        default: null,
    },
    dealer: {
        type: String,
        trim: true,
        maxlength: [100, 'Dealer cannot exceed 100 characters'],
        default: null,
    },
    // Updated enum to include all four customer type combinations
    customerType: {
        type: String,
        trim: true,
        enum: ['Dealer-Retail', 'Dealer-Supply', 'School-Retail', 'School-Supply'],
        required: [true, 'Customer type is required'],
        default: 'School-Retail'
    },
    contactPerson: {
        type: String,
        trim: true,
        maxlength: [100, 'Contact person name cannot exceed 100 characters'],
        default: null,
    },
    mobileNumber: {
        type: String,
        required: [true, 'Mobile number is required'],
        trim: true,
        validate: {
            validator: (val) => validator.isMobilePhone(val, 'en-IN'),
            message: 'Please provide a valid Indian mobile number.'
        },
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email'],
        default: null,
    },
    gstNumber: {
        type: String,
        trim: true,
        uppercase: true,
        validate: {
            validator: function (val) {
                return val === null || val === '' || /^([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1})$/.test(val);
            },
            message: 'Please provide a valid GSTIN.'
        },
        default: null,
    },
    discount: {
        type: Number,
        min: [0, 'Discount must be a positive number'],
        default: 0,
    },
    returnTime: {
        type: String,
        trim: true,
        maxlength: [50, 'Return time cannot exceed 50 characters'],
        default: null,
    },
    bankName: {
        type: String,
        trim: true,
        default: null,
    },
    accountNumber: {
        type: String,
        trim: true,
        default: null,
    },
    ifscCode: {
        type: String,
        trim: true,
        default: null,
    },
    openingBalance: {
        type: Number,
        default: 0,
    },
    balanceType: {
        type: String,
        enum: ['Dr.', 'Cr.'],
        default: 'Dr.',
    },
    chequeImage: {
        type: String,
        default: null,
    },
    passportImage: {
        type: String,
        default: null,
    },
    // New field for other attachments
    otherAttachment: {
        type: String,
        default: null,
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

customerSchema.index({ customerName: 1, customerType: 1 }, { unique: true });
customerSchema.index({ mobileNumber: 1 }, { unique: true, sparse: true });
customerSchema.index({ email: 1 }, { unique: true, sparse: true });
customerSchema.index({ gstNumber: 1 }, { unique: true, sparse: true });
customerSchema.index({ aadharNumber: 1 }, { unique: true, sparse: true });
customerSchema.index({ panNumber: 1 }, { unique: true, sparse: true });

customerSchema.virtual('branchDetail', {
    ref: 'Branch',
    localField: 'branch',
    foreignField: '_id',
    justOne: true
});

customerSchema.virtual('cityDetail', {
    ref: 'City',
    localField: 'city',
    foreignField: '_id',
    justOne: true
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;