// backend/controllers/pendingBookController.js

const PendingBook = require('../models/PendingBook');
const Customer = require('../models/Customer');
const Branch = require('../models/Branch');
const BookCatalog = require('../models/BookCatalog');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');
const mongoose = require('mongoose');

// Helper function to populate common fields for PendingBook (still useful for single fetches)
const populatePendingBookQuery = (query) => {
    return query
        .populate({
            path: 'customer',
            select: 'customerName schoolCode'
        })
        .populate({
            path: 'book',
            select: 'bookName subtitle'
        })
        .populate({
            path: 'branch',
            select: 'name'
        });
};

// 1. Create a new Pending Book entry (or update if it exists)
exports.createOrUpdatePendingBook = catchAsync(async (req, res, next) => {
    const { customerId, bookId, branchId, status } = req.body;

    if (!customerId || !bookId || !status || !['pending', 'clear'].includes(status)) {
        return next(new AppError('Customer ID, Book ID, and a valid status ("pending" or "clear") are required.', 400));
    }

    const query = { customer: customerId, book: bookId };
    if (branchId) {
        query.branch = branchId;
    }

    const updateData = { status };
    let setOnInsertData = {};

    if (status === 'clear') {
        updateData.clearedDate = Date.now();
        updateData.pendingDate = null;
        setOnInsertData.clearedDate = Date.now();
        setOnInsertData.pendingDate = null;
    } else if (status === 'pending') {
        updateData.pendingDate = Date.now();
        updateData.clearedDate = null;
        setOnInsertData.pendingDate = Date.now();
        setOnInsertData.clearedDate = null;
    }

    setOnInsertData.status = status;
    setOnInsertData.customer = customerId;
    setOnInsertData.book = bookId;
    if (branchId) {
        setOnInsertData.branch = branchId;
    }


    const pendingBook = await PendingBook.findOneAndUpdate(
        query,
        { $set: updateData, $setOnInsert: setOnInsertData },
        {
            new: true,
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true
        }
    );

    const populatedPendingBook = await populatePendingBookQuery(PendingBook.findById(pendingBook._id));

    res.status(200).json({
        status: 'success',
        data: {
            pendingBook: populatedPendingBook
        },
        message: `Book status updated to "${status}" successfully!`
    });
});


// 2. Get Books for a Customer/Branch with their Pending Status
exports.getBooksWithPendingStatus = catchAsync(async (req, res, next) => {
    const { customer: customerId, branch: branchId, search } = req.query;

    if (!customerId) {
        return next(new AppError('Customer ID is required to fetch books with pending status.', 400));
    }

    const pipeline = [];

    // Stage 1: Lookup PendingBook entries (LEFT JOIN)
    pipeline.push({
        $lookup: {
            from: 'pendingbooks',
            let: { bookId: '$_id' },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [
                                { $eq: ['$book', '$$bookId'] },
                                { $eq: ['$customer', new mongoose.Types.ObjectId(customerId)] }
                            ]
                        }
                    }
                },
                ...(branchId ? [{ $match: { branch: new mongoose.Types.ObjectId(branchId) } }] : []),
                {
                    $project: {
                        status: 1,
                        pendingDate: 1,
                        clearedDate: 1,
                        _id: 1
                    }
                }
            ],
            as: 'pendingStatus'
        }
    });

    // Stage 3: Unwind the pendingStatus array.
    pipeline.push({
        $unwind: {
            path: '$pendingStatus',
            preserveNullAndEmptyArrays: true
        }
    });

    // Stage 4: Project the final output fields
    pipeline.push({
        $project: {
            _id: '$_id',
            bookName: '$bookName',
            subtitle: '$subtitle',

            pendingBookId: { $ifNull: ['$pendingStatus._id', null] },
            status: { $ifNull: ['$pendingStatus.status', 'clear'] }, // FIX: Changed default status to 'clear'
            pendingDate: { $ifNull: ['$pendingStatus.pendingDate', null] },
            clearedDate: { $ifNull: ['$pendingStatus.clearedDate', null] }
        }
    });

    // Stage 5: Apply search filter (on BookCatalog fields)
    if (search) {
        pipeline.push({
            $match: {
                $or: [
                    { bookName: { $regex: search, $options: 'i' } },
                    { subtitle: { $regex: search, $options: 'i' } }
                ]
            }
        });
    }

    // Stage 6: Count total documents before pagination (for total count)
    const countPipeline = [...pipeline];
    countPipeline.push({ $count: 'totalCount' });

    const totalCountResult = await BookCatalog.aggregate(countPipeline);
    const totalCount = totalCountResult.length > 0 ? totalCountResult[0].totalCount : 0;

    // Stage 7: Sorting
    pipeline.push({ $sort: { bookName: 1 } });

    // Stage 8: Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Execute the aggregation pipeline
    const booksWithStatus = await BookCatalog.aggregate(pipeline);

    res.status(200).json({
        status: 'success',
        results: booksWithStatus.length,
        data: {
            books: booksWithStatus
        },
        totalCount
    });
});

// 3. Delete a Pending Book entry by ID (if needed, though status update is preferred)
exports.deletePendingBook = catchAsync(async (req, res, next) => {
    const pendingBook = await PendingBook.findByIdAndDelete(req.params.id);

    if (!pendingBook) {
        return next(new AppError('No pending book entry found with that ID', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null,
        message: 'Pending book entry deleted successfully!'
    });
});

// Helper to get all Customers (for dropdown)
exports.getAllCustomersForDropdown = catchAsync(async (req, res, next) => {
    const customers = await Customer.find().select('customerName schoolCode').sort('customerName');
    res.status(200).json({
        status: 'success',
        data: {
            customers
        }
    });
});

// Helper to get all Branches (for dropdown)
exports.getAllBranchesForDropdown = catchAsync(async (req, res, next) => {
    const branches = await Branch.find().select('name').sort('name');
    res.status(200).json({
        status: 'success',
        data: {
            branches
        }
    });
});