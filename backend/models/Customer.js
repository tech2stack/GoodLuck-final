const mongoose = require('mongoose');
   const validator = require('validator');

   const customerSchema = new mongoose.Schema({
       firm: {
           type: mongoose.Schema.ObjectId,
           ref: 'Firm',
           required: [true, 'Firm is required']
       },
       customerName: {
           type: String,
           required: [true, 'Customer name is required'],
           trim: true,
           maxlength: [100, 'Customer name cannot exceed 100 characters'],
           unique: true
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
           ref: 'Branch'
       },
       city: {
           type: mongoose.Schema.ObjectId,
           ref: 'City',
           required: [true, 'City is required']
       },
       salesBy: {
           type: mongoose.Schema.ObjectId,
           ref: 'Employee',
           default: null
       },
       discount: {
           type: Number,
           default: 0,
           min: [0, 'Discount cannot be less than 0'],
           max: [100, 'Discount cannot exceed 100']
       },
       returnTime: {
           type: String,
           trim: true,
           maxlength: [100, 'Return time cannot exceed 100 characters'],
           default: null
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
           default: null,
           set: v => v === '' ? null : v
       },
       mobileNumber: {
           type: String,
           trim: true,
           validate: {
               validator: function(v) {
                   return (v === null || v === '') || (v.length >= 10 && v.length <= 15);
               },
               message: props => `${props.value} is not a valid mobile number! It must be between 10 and 15 digits.`
           },
           default: null,
           set: v => v === '' ? null : v
       },
       email: {
           type: String,
           trim: true,
           lowercase: true,
           validate: {
               validator: function(v) {
                   return v === null || v === '' || validator.isEmail(v);
               },
               message: props => `${props.value} is not a valid email address!`
           },
           default: null,
           set: v => v === '' ? null : v
       },
       gstNumber: {
           type: String,
           trim: true,
           maxlength: [15, 'GST number cannot exceed 15 characters'],
           default: null,
           set: v => v === '' ? null : v
       },
       aadharNumber: {
           type: String,
           trim: true,
           validate: {
               validator: function(v) {
                   return (v === null || v === '') || (v.length === 12 && /^\d{12}$/.test(v));
               },
               message: props => `${props.value} is not a valid Aadhar number! It must be 12 digits long.`
           },
           default: null,
           set: v => v === '' ? null : v
       },
       panNumber: {
           type: String,
           trim: true,
           uppercase: true,
           validate: {
               validator: function(v) {
                   return (v === null || v === '') || (v.length === 10 && /[A-Z]{5}[0-9]{4}[A-Z]{1}/.test(v));
               },
               message: props => `${props.value} is not a valid PAN number!`
           },
           default: null,
           set: v => v === '' ? null : v
       },
       customerShopName: {
           type: String,
           trim: true,
           default: null,
           set: v => v === '' ? null : v
       },
       age: {
           type: Number,
           default: null
       },
       so: {
           type: String,
           trim: true,
           default: null,
           set: v => v === '' ? null : v
       },
       customerCity: {
           type: String,
           trim: true,
           default: null,
           set: v => v === '' ? null : v
       },
       distt: {
           type: String,
           trim: true,
           default: null,
           set: v => v === '' ? null : v
       },
       state: {
           type: String,
           trim: true,
           default: null,
           set: v => v === '' ? null : v
       },
       pinCode: {
           type: String,
           trim: true,
           default: null,
           set: v => v === '' ? null : v
       },
       shopRegNo: {
           type: String,
           trim: true,
           default: null,
           set: v => v === '' ? null : v
       },
       fixedTradeDiscount: {
           type: Number,
           default: null
       },
       remark: {
           type: String,
           trim: true,
           default: null,
           set: v => v === '' ? null : v
       },
       goodsDeliveredTransportationPay: {
           type: String,
           trim: true,
           default: null,
           set: v => v === '' ? null : v
       },
       goodsReturnTransportationPay: {
           type: String,
           trim: true,
           default: null,
           set: v => v === '' ? null : v
       },
       finalSalesReturnMonth: {
           type: String,
           trim: true,
           default: null,
           set: v => v === '' ? null : v
       },
       finalPaymentInAccountMonth: {
           type: String,
           trim: true,
           default: null,
           set: v => v === '' ? null : v
       },
       paymentConcernPersonName: {
           type: String,
           trim: true,
           default: null,
           set: v => v === '' ? null : v
       },
       closedDate: {
           type: Date,
           default: null
       },
       chequeNo: {
           type: String,
           trim: true,
           default: null,
           set: v => v === '' ? null : v
       },
       chequeOfBankName: {
           type: String,
           trim: true,
           default: null,
           set: v => v === '' ? null : v
       },
       shopAddress: {
           type: String,
           trim: true,
           maxlength: [200, 'Shop address cannot exceed 200 characters'],
           default: null,
           set: v => v === '' ? null : v
       },
       homeAddress: {
           type: String,
           trim: true,
           maxlength: [200, 'Home address cannot exceed 200 characters'],
           default: null,
           set: v => v === '' ? null : v
       },
       status: {
           type: String,
           enum: ['active', 'inactive'],
           default: 'active'
       },
       chequeImage: {
           type: String,
           default: null
       },
       passportImage: {
           type: String,
           default: null
       },
       otherAttachment: {
           type: String,
           default: null
       },
       createdAt: {
           type: Date,
           default: Date.now
       }
   }, {
       toJSON: { virtuals: true },
       toObject: { virtuals: true }
   });

   // Define indexes (only for unique fields)
   customerSchema.index({ customerName: 1 }, { unique: true });

   // Pre-find middleware to populate referenced fields
   customerSchema.pre(/^find/, function(next) {
       this.populate({
           path: 'firm',
           select: 'name'
       })
       .populate({
           path: 'branch',
           select: 'name'
       })
       .populate({
           path: 'city',
           select: 'name'
       })
       .populate({
           path: 'salesBy',
           select: 'name'
       });
       next();
   });

   const Customer = mongoose.model('Customer', customerSchema);

   module.exports = Customer;