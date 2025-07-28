// backend/controllers/dashboardController.js
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Sale = require('../models/Sale'); 
const Set = require('../models/Set');   
const Customer = require('../models/Customer'); // ZAROORI: Customer model import karein
const mongoose = require('mongoose'); 

exports.getDashboardMetrics = catchAsync(async (req, res, next) => {
    const { branchId } = req.query; 

    if (!branchId) {
        return next(new AppError('Branch ID is required for dashboard metrics', 400));
    }

    if (!mongoose.Types.ObjectId.isValid(branchId)) {
        return next(new AppError('Invalid Branch ID provided', 400));
    }

    const branchObjectId = new mongoose.Types.ObjectId(branchId);

    // --- Metrics calculate karein ---
    // 1. Total number of sets sold (Branch-specific via Customer)
    const branchCustomers = await Customer.find({ branch: branchObjectId }).select('_id');
    const customerIds = branchCustomers.map(customer => customer._id);

    const totalSetsSold = await Set.countDocuments({ customer: { $in: customerIds } });

    // 2. Total Value of sets sold (Branch-specific via Customer)
    const totalValueSetsSoldResult = await Set.aggregate([
        { $match: { customer: { $in: customerIds } } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]);
    const totalValueSetsSold = totalValueSetsSoldResult.length > 0 ? totalValueSetsSoldResult[0].total : 0;

    // 3. Total amount received by Cash and UPI (Branch-specific)
    const sales = await Sale.find({ branch: branchObjectId });
    let totalAmountCash = 0;
    let totalAmountUpi = 0;

    sales.forEach(sale => {
        if (sale.paymentMethod === 'cash') {
            totalAmountCash += sale.totalAmount;
        } else if (sale.paymentMethod === 'upi') {
            totalAmountUpi += sale.totalAmount;
        }
    });

    // 4. Next Bill No. 
    const lastSale = await Sale.findOne({ branch: branchObjectId }).sort({ billNo: -1 });
    const nextBillNo = lastSale && !isNaN(parseInt(lastSale.billNo)) ? parseInt(lastSale.billNo) + 1 : 1001; 

    res.status(200).json({
        status: 'success',
        data: {
            totalSetsSold: totalSetsSold,
            totalValueSetsSold: totalValueSetsSold,
            totalAmountCash: totalAmountCash,
            totalAmountUpi: totalAmountUpi,
            nextBillNo: nextBillNo
        }
    });
});
