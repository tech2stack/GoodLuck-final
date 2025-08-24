const mongoose = require('mongoose');

const firmSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Firm name is required'],
        trim: true,
        unique: true,
        maxlength: [100, 'Firm name cannot exceed 100 characters']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Firm = mongoose.model('Firm', firmSchema);

module.exports = Firm;