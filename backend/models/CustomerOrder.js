// backend/models/CustomerOrder.js
const mongoose = require('mongoose');

const customerOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: Number,
    required: [true, 'Order number is required'],
    unique: true,
  },
  customer: {
    type: mongoose.Schema.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer is required'],
  },
  customerType: {
    type: String,
    enum: ['Dealer-Retail', 'Dealer-Supply', 'School-Retail', 'School-Supply', 'School-Both'],
    required: [true, 'Customer type is required'],
  },
  salesBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'Employee',
    required: [true, 'Sales representative is required'],
  },
  orderEntryBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'Employee',
    required: [true, 'Order entry person is required'],
  },
  publication: {
    type: mongoose.Schema.ObjectId,
    ref: 'Publication',
    required: [true, 'Publication is required'],
  },
  subtitle: {
    type: mongoose.Schema.ObjectId,
    default: null,
  },
  orderDate: {
    type: Date,
    required: [true, 'Order date is required'],
    default: Date.now,
  },
  orderBy: {
    type: String,
    enum: ['Online', 'Phone', 'In-Person'],
    required: [true, 'Order source is required'],
  },
  shippedTo: {
    type: String,
    trim: true,
    maxlength: [200, 'Shipped to address cannot exceed 200 characters'],
    default: null,
  },
  remark: {
    type: String,
    trim: true,
    maxlength: [500, 'Remark cannot exceed 500 characters'],
    default: null,
  },
  orderImage: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  orderItems: [{
    book: { type: mongoose.Schema.ObjectId, ref: 'BookCatalog', required: true },
    className: { type: String, default: null },
    quantity: { type: Number, required: true, min: [0, 'Quantity must be at least 1'] },
    price: { type: Number, required: true, min: [0, 'Price cannot be negative'] },
    discount: { type: Number, required: true, min: [0, 'Discount cannot be negative'], max: [100, 'Discount cannot exceed 100'], default: 0 },
    total: { type: Number, required: true, min: [0, 'Total cannot be negative'] }
  }],
  total: {
    type: Number,
    required: [true, 'Total is required'],
    min: [0, 'Total cannot be negative'],
  },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Pre-find middleware to populate referenced fields
customerOrderSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'customer',
    select: 'customerName customerType discount',
  })
    .populate({
      path: 'salesBy',
      select: 'name',
    })
    .populate({
      path: 'orderEntryBy',
      select: 'name',
    })
    .populate({
      path: 'publication',
      select: 'name subtitles',
    })
    .populate('orderItems.book');
  next();
});

module.exports = mongoose.model('CustomerOrder', customerOrderSchema);