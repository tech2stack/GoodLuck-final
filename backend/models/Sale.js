// backend/models/Sale.js
const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
    billNo: {
        type: String,
        required: [true, 'Bill number is required'],
        unique: true,
        trim: true
    },
    branch: {
        type: mongoose.Schema.ObjectId,
        ref: 'Branch',
        required: [true, 'Sale must belong to a branch']
    },
    totalAmount: {
        type: Number,
        required: [true, 'Total amount is required']
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'upi', 'card', 'other'], // Payment methods ko adjust karein
        required: [true, 'Payment method is required']
    },
    items: [ // Bechi gayi items ka description
        {
            itemType: {
                type: String,
                enum: ['book', 'stationery', 'set'],
                required: true
            },
            itemId: {
                type: mongoose.Schema.ObjectId,
                required: true,
                refPath: 'items.itemType' // Dynamic reference
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            price: { // Per unit price
                type: Number,
                required: true,
                min: 0
            },
            totalPrice: Number // quantity * price
        }
    ],
    customer: { // Agar aap customers ko track karte hain
        type: mongoose.Schema.ObjectId,
        ref: 'Customer'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Pre-save hook to calculate totalPrice for each item
saleSchema.pre('save', function(next) {
    this.items.forEach(item => {
        item.totalPrice = item.quantity * item.price;
    });
    next();
});

const Sale = mongoose.model('Sale', saleSchema);
module.exports = Sale;
