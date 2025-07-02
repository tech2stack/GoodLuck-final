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
        updateData.pendingDate = null; // Clear pendingDate if status is 'clear'
        setOnInsertData.clearedDate = Date.now(); // Set clearedDate on insert if default is 'clear'
        setOnInsertData.pendingDate = null; // Ensure pendingDate is null on insert if default is 'clear'
    } else if (status === 'pending') {
        updateData.pendingDate = Date.now(); // Set pendingDate when status changes to 'pending'
        updateData.clearedDate = null; // Clear cleared date if status reverts to 'pending'
        setOnInsertData.pendingDate = Date.now(); // Set pendingDate on insert if default is 'pending'
        setOnInsertData.clearedDate = null; // Ensure clearedDate is null on insert if default is 'pending'
    }
    
    // Ensure status is also set on insert
    setOnInsertData.status = status;
    setOnInsertData.customer = customerId;
    setOnInsertData.book = bookId;
    if (branchId) {
        setOnInsertData.branch = branchId;
    }


    const pendingBook = await PendingBook.findOneAndUpdate(
        query,
        { $set: updateData, $setOnInsert: setOnInsertData }, // Use $setOnInsert for new document specific fields
        {
            new: true,
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true // Ensure defaults from schema are applied on upsert
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

    // Stage 1: Initial match on BookCatalog (if needed, e.g., by class, publication, etc.)
    // For now, we'll fetch all books and then join.

    // Stage 2: Lookup PendingBook entries (LEFT JOIN)
    pipeline.push({
        $lookup: {
            from: 'pendingbooks', // The name of the collection in MongoDB (usually lowercase, plural)
            let: { bookId: '$_id' }, // Variable to use in the pipeline below
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [
                                { $eq: ['$book', '$$bookId'] }, // Match book ID
                                { $eq: ['$customer', new mongoose.Types.ObjectId(customerId)] } // Match customer ID
                            ]
                        }
                    }
                },
                // If branchId is provided, add an additional match here
                ...(branchId ? [{ $match: { branch: new mongoose.Types.ObjectId(branchId) } }] : []),
                {
                    $project: {
                        status: 1,
                        pendingDate: 1,
                        clearedDate: 1,
                        _id: 1 // Include _id of PendingBook entry
                    }
                }
            ],
            as: 'pendingStatus' // Array of matching pending book entries (will be 0 or 1 element)
        }
    });

    // Stage 3: Unwind the pendingStatus array.
    // use preserveNullAndEmptyArrays: true to keep books that don't have a pending status
    pipeline.push({
        $unwind: {
            path: '$pendingStatus',
            preserveNullAndEmptyArrays: true
        }
    });

    // Stage 4: Project the final output fields
    pipeline.push({
        $project: {
            _id: '$_id', // BookCatalog's _id
            bookName: '$bookName', // <--- FIX: Directly project BookCatalog's bookName
            subtitle: '$subtitle', // <--- FIX: Directly project BookCatalog's subtitle
            
            pendingBookId: { $ifNull: ['$pendingStatus._id', null] }, // The _id of the PendingBook entry (or null if not found)
            status: { $ifNull: ['$pendingStatus.status', 'not_set'] }, // Default to 'not_set' if no pending status
            pendingDate: { $ifNull: ['$pendingStatus.pendingDate', null] }, // Default to null if no pending status
            clearedDate: { $ifNull: ['$pendingStatus.clearedDate', null] } // Default to null if no pending status
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
    const countPipeline = [...pipeline]; // Copy the pipeline up to this point
    countPipeline.push({ $count: 'totalCount' });

    const totalCountResult = await BookCatalog.aggregate(countPipeline);
    const totalCount = totalCountResult.length > 0 ? totalCountResult[0].totalCount : 0;

    // Stage 7: Sorting
    pipeline.push({ $sort: { bookName: 1 } }); // Sort by book name by default

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
