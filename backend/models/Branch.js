// models/Branch.js
const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter branch name'], // कृपया शाखा का नाम दर्ज करें
        unique: true,
        trim: true
    },
    location: {
        type: String,
        required: [true, 'Please enter branch location'], // कृपया शाखा का स्थान दर्ज करें
        trim: true
    },
    // New fields added
    shopOwnerName: {
        type: String,
        required: [true, 'Please enter shop owner name'], // कृपया दुकान मालिक का नाम दर्ज करें
        trim: true
    },
    shopGstId: {
        type: String,
        required: [false, ''], // Changed to NOT required
        unique: false, // Changed to NOT unique, as it's optional
        trim: true,
        uppercase: true // Convert to uppercase for consistency
    },
    address: {
        type: String,
        required: [true, 'Please enter full address'],
        trim: true
    },
    mobileNumber: {
        type: String,
        required: [false, ''], // Changed to NOT required
        trim: true,
        match: [/^\d{10}$/, 'Please enter a valid 10-digit mobile number'], // कृपया एक वैध 10-अंकों का मोबाइल नंबर दर्ज करें
        unique: false // Changed to NOT unique, as it's optional
    },
    logoImage: {
        type: String, // Store URL/path to the image AFTER upload
        default: 'no-photo.jpg' // Default image if none provided
    },
    // End of New fields

    // Add the createdBy field to the schema
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'SuperAdmin', // This should reference your SuperAdmin model name
        required: [true, 'Information of the admin creating the branch is required'] // शाखा बनाने वाले एडमिन की जानकारी आवश्यक है
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
}, {
    timestamps: true // This will automatically manage createdAt and updatedAt
});

// Middleware to update `updatedAt` on save (if not handled by `timestamps: true` implicitly on update operations)
branchSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Branch = mongoose.model('Branch', branchSchema);

module.exports = Branch;