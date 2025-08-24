const Customer = require('../models/Customer');
   const APIFeatures = require('../utils/apiFeatures');
   const AppError = require('../utils/appError');
   const catchAsync = require('../utils/catchAsync');
   const path = require('path');
   const fs = require('fs');

   // Populate customer query with related fields
   const populateCustomerQuery = (query) => {
       return query
           .populate({
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
   };

   // Create a new Customer
   exports.createCustomer = catchAsync(async (req, res, next) => {
       const {
           firm, customerName, schoolCode, branch, city, contactPerson, mobileNumber,
           email, gstNumber, aadharNumber, panNumber, shopAddress, homeAddress, status,
           salesBy, customerType, discount, returnTime, bankName, accountNumber, ifscCode,
           openingBalance, balanceType, customerShopName, age, so, customerCity, distt,
           state, pinCode, shopRegNo, fixedTradeDiscount, remark,
           goodsDeliveredTransportationPay, goodsReturnTransportationPay,
           finalSalesReturnMonth, finalPaymentInAccountMonth, paymentConcernPersonName,
           closedDate, chequeNo, chequeOfBankName
       } = req.body;

       // Validation for required fields
       if (!firm) {
           return next(new AppError('Firm is required.', 400));
       }
       if (!customerName) {
           return next(new AppError('Customer name is required.', 400));
       }
       if (!city) {
           return next(new AppError('City is required.', 400));
       }
       if (!customerType) {
           return next(new AppError('Customer type is required.', 400));
       }
       if (customerType.startsWith('School')) {
           if (!branch) {
               return next(new AppError('For School customers, Branch is required.', 400));
           }
           if (!schoolCode) {
               return next(new AppError('For School customers, School Code is required.', 400));
           }
       }

       // Get file names from req.files
       const { chequeImage, passportImage, otherAttachment } = req.files || {};

       // Prepare customer data, converting empty strings to null for optional fields
       const customerData = {
           firm: firm || null,
           customerName: customerName || null,
           schoolCode: schoolCode || null,
           branch: branch || null,
           city: city || null,
           contactPerson: contactPerson || null,
           mobileNumber: mobileNumber || null,
           email: email || null,
           gstNumber: gstNumber || null,
           aadharNumber: aadharNumber || null,
           panNumber: panNumber || null,
           shopAddress: shopAddress || null,
           homeAddress: homeAddress || null,
           status: status || 'active',
           salesBy: salesBy || null,
           customerType: customerType || null,
           discount: discount ? parseFloat(discount) : 0,
           returnTime: returnTime || null,
           bankName: bankName || null,
           accountNumber: accountNumber || null,
           ifscCode: ifscCode || null,
           openingBalance: openingBalance ? parseFloat(openingBalance) : 0,
           balanceType: balanceType || 'Dr.',
           customerShopName: customerShopName || null,
           age: age ? parseInt(age) : null,
           so: so || null,
           customerCity: customerCity || null,
           distt: distt || null,
           state: state || null,
           pinCode: pinCode || null,
           shopRegNo: shopRegNo || null,
           fixedTradeDiscount: fixedTradeDiscount ? parseFloat(fixedTradeDiscount) : null,
           remark: remark || null,
           goodsDeliveredTransportationPay: goodsDeliveredTransportationPay || null,
           goodsReturnTransportationPay: goodsReturnTransportationPay || null,
           finalSalesReturnMonth: finalSalesReturnMonth || null,
           finalPaymentInAccountMonth: finalPaymentInAccountMonth || null,
           paymentConcernPersonName: paymentConcernPersonName || null,
           closedDate: closedDate || null,
           chequeNo: chequeNo || null,
           chequeOfBankName: chequeOfBankName || null,
           chequeImage: chequeImage ? chequeImage[0].filename : null,
           passportImage: passportImage ? passportImage[0].filename : null,
           otherAttachment: otherAttachment ? otherAttachment[0].filename : null
       };

       try {
           const newCustomer = await Customer.create(customerData);
           res.status(201).json({
               status: 'success',
               data: {
                   customer: newCustomer
               }
           });
       } catch (error) {
           if (error.code === 11000) {
               const field = Object.keys(error.keyPattern)[0];
               return next(new AppError(`Duplicate ${field}: ${error.keyValue[field]}. Please use a unique value.`, 400));
           }
           return next(new AppError(error.message || 'Failed to create customer.', 400));
       }
   });

   // Get all Customers with filters, sorting, and pagination
   exports.getAllCustomers = catchAsync(async (req, res, next) => {
       const features = new APIFeatures(
           populateCustomerQuery(Customer.find()),
           req.query
       )
           .filter()
           .sort()
           .limitFields()
           .paginate();

       const customers = await features.query;

       const totalCount = await Customer.countDocuments(features.query.getFilter());

       res.status(200).json({
           status: 'success',
           results: customers.length,
           data: {
               customers,
               totalCount
           }
       });
   });

   // Get a single Customer by ID
   exports.getCustomer = catchAsync(async (req, res, next) => {
       const customer = await populateCustomerQuery(Customer.findById(req.params.id));

       if (!customer) {
           return next(new AppError('No customer found with that ID', 404));
       }

       res.status(200).json({
           status: 'success',
           data: {
               customer
           }
       });
   });

   // Update a Customer by ID
   exports.updateCustomer = catchAsync(async (req, res, next) => {
       const customerId = req.params.id;
       const {
           firm, customerName, schoolCode, branch, city, contactPerson, mobileNumber,
           email, gstNumber, aadharNumber, panNumber, shopAddress, homeAddress, status,
           salesBy, customerType, discount, returnTime, bankName, accountNumber, ifscCode,
           openingBalance, balanceType, customerShopName, age, so, customerCity, distt,
           state, pinCode, shopRegNo, fixedTradeDiscount, remark,
           goodsDeliveredTransportationPay, goodsReturnTransportationPay,
           finalSalesReturnMonth, finalPaymentInAccountMonth, paymentConcernPersonName,
           closedDate, chequeNo, chequeOfBankName
       } = req.body;

       // Validation for required fields
       if (!firm) {
           return next(new AppError('Firm is required.', 400));
       }
       if (!customerName) {
           return next(new AppError('Customer name is required.', 400));
       }
       if (!city) {
           return next(new AppError('City is required.', 400));
       }
       if (!customerType) {
           return next(new AppError('Customer type is required.', 400));
       }
       if (customerType.startsWith('School')) {
           if (!branch) {
               return next(new AppError('For School customers, Branch is required.', 400));
           }
           if (!schoolCode) {
               return next(new AppError('For School customers, School Code is required.', 400));
           }
       }

       // Prepare update data, converting empty strings to null for optional fields
       const updateData = {
           firm: firm || null,
           customerName: customerName || null,
           schoolCode: schoolCode || null,
           branch: branch || null,
           city: city || null,
           contactPerson: contactPerson || null,
           mobileNumber: mobileNumber || null,
           email: email || null,
           gstNumber: gstNumber || null,
           aadharNumber: aadharNumber || null,
           panNumber: panNumber || null,
           shopAddress: shopAddress || null,
           homeAddress: homeAddress || null,
           status: status || 'active',
           salesBy: salesBy || null,
           customerType: customerType || null,
           discount: discount ? parseFloat(discount) : 0,
           returnTime: returnTime || null,
           bankName: bankName || null,
           accountNumber: accountNumber || null,
           ifscCode: ifscCode || null,
           openingBalance: openingBalance ? parseFloat(openingBalance) : 0,
           balanceType: balanceType || 'Dr.',
           customerShopName: customerShopName || null,
           age: age ? parseInt(age) : null,
           so: so || null,
           customerCity: customerCity || null,
           distt: distt || null,
           state: state || null,
           pinCode: pinCode || null,
           shopRegNo: shopRegNo || null,
           fixedTradeDiscount: fixedTradeDiscount ? parseFloat(fixedTradeDiscount) : null,
           remark: remark || null,
           goodsDeliveredTransportationPay: goodsDeliveredTransportationPay || null,
           goodsReturnTransportationPay: goodsReturnTransportationPay || null,
           finalSalesReturnMonth: finalSalesReturnMonth || null,
           finalPaymentInAccountMonth: finalPaymentInAccountMonth || null,
           paymentConcernPersonName: paymentConcernPersonName || null,
           closedDate: closedDate || null,
           chequeNo: chequeNo || null,
           chequeOfBankName: chequeOfBankName || null
       };

       const { chequeImage, passportImage, otherAttachment } = req.files || {};
       let oldCustomer;

       // Fetch the customer to check for existing images and prepare for deletion
       oldCustomer = await Customer.findById(customerId);
       if (!oldCustomer) {
           return next(new AppError('No customer found with that ID', 404));
       }

       // Check and delete old files if new ones are uploaded
       const deleteOldFile = (oldPath, newFile) => {
           if (oldPath && newFile) {
               const fullPath = path.join(__dirname, '..', 'Uploads', 'customer-logos', oldPath);
               fs.unlink(fullPath, (err) => {
                   if (err) {
                       console.error(`Failed to delete old file: ${fullPath}`, err);
                   }
               });
           }
       };

       if (chequeImage) {
           deleteOldFile(oldCustomer.chequeImage, chequeImage);
           updateData.chequeImage = chequeImage[0].filename;
       }
       if (passportImage) {
           deleteOldFile(oldCustomer.passportImage, passportImage);
           updateData.passportImage = passportImage[0].filename;
       }
       if (otherAttachment) {
           deleteOldFile(oldCustomer.otherAttachment, otherAttachment);
           updateData.otherAttachment = otherAttachment[0].filename;
       }

       try {
           const updatedCustomer = await Customer.findByIdAndUpdate(customerId, updateData, {
               new: true,
               runValidators: true
           });

           if (!updatedCustomer) {
               return next(new AppError('No customer found with that ID', 404));
           }

           res.status(200).json({
               status: 'success',
               data: {
                   customer: updatedCustomer
               }
           });
       } catch (error) {
           if (error.code === 11000) {
               const field = Object.keys(error.keyPattern)[0];
               return next(new AppError(`Duplicate ${field}: ${error.keyValue[field]}. Please use a unique value.`, 400));
           }
           return next(new AppError(error.message || 'Failed to update customer.', 400));
       }
   });

   // Delete a Customer by ID
   exports.deleteCustomer = catchAsync(async (req, res, next) => {
       const customer = await Customer.findById(req.params.id);

       if (!customer) {
           return next(new AppError('No customer found with that ID', 404));
       }

       const imagePathsToDelete = [];
       if (customer.chequeImage) {
           imagePathsToDelete.push(path.join(__dirname, '..', 'Uploads', 'customer-logos', customer.chequeImage));
       }
       if (customer.passportImage) {
           imagePathsToDelete.push(path.join(__dirname, '..', 'Uploads', 'customer-logos', customer.passportImage));
       }
       if (customer.otherAttachment) {
           imagePathsToDelete.push(path.join(__dirname, '..', 'Uploads', 'customer-logos', customer.otherAttachment));
       }

       imagePathsToDelete.forEach(imagePath => {
           fs.unlink(imagePath, (err) => {
               if (err) {
                   console.error(`Failed to delete customer image file at ${imagePath}:`, err);
               } else {
                   console.log(`Successfully deleted customer image file: ${imagePath}`);
               }
           });
       });

       await Customer.findByIdAndDelete(req.params.id);

       res.status(204).json({
           status: 'success',
           data: null
       });
   });