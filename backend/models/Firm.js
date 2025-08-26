// backend/models/Firm.js
const mongoose = require('mongoose');

const firmSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Firm name is required'],
        trim: true,
        unique: true,
        maxlength: [100, 'Firm name cannot exceed 100 characters']
    },
    logo: {
        type: String,
        default: null
    },
    address: {
        type: String,
        trim: true,
        maxlength: [200, 'Address cannot exceed 200 characters'],
        default: null
    },
    remark: {
        type: String,
        trim: true,
        default: null
    },
    gstin: {
        type: String,
        trim: true,
        uppercase: true,
        validate: {
            validator: function(v) {
                return (v === null || v === '') || (v.length === 15 && /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v));
            },
            message: props => `${props.value} is not a valid GSTIN!`
        },
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Firm = mongoose.model('Firm', firmSchema);

module.exports = Firm;