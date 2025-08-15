// backend/controllers/setController.js

const Set = require('../models/Set');
const Customer = require('../models/Customer');
const Class = require('../models/Class');
const BookCatalog = require('../models/BookCatalog');
const StationeryItem = require('../models/StationeryItem');
const PublicationSubtitle = require('../models/PublicationSubtitle');
const Branch = require('../models/Branch'); // Import Branch model

const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const mongoose = require('mongoose');

// Helper function to populate related fields in Set queries
const populateSetQuery = (query) => {
    return query
        .populate({
            path: 'customer',
            select: 'customerName schoolCode'
        })
        .populate({
            path: 'class',
            select: 'name'
        })
        .populate({
            path: 'books.book',
            select: 'bookName subtitle commonPrice' // Include commonPrice here
        })
        .populate({
            path: 'stationeryItems.item',
            select: 'itemName price'
        });
};

// 1. Create a new Set (Order Detail)
exports.createSet = catchAsync(async (req, res, next) => {
    const { customer, class: classId, books, stationeryItems } = req.body;

    // Basic validation: Customer and Class are mandatory
    if (!customer || !classId) {
        return next(new AppError('Customer and Class are required to create a set.', 400));
    }

    // Check if a set already exists for this unique combination (customer, class)
    const existingSet = await Set.findOne({ customer, class: classId });
    if (existingSet) {
        return next(new AppError('A set already exists for this customer and class. Please update the existing set instead.', 409));
    }

    // Create the new set
    const newSet = await Set.create({
        customer,
        class: classId,
        books: books || [],
        stationeryItems: stationeryItems || []
    });

    // Populate the newly created set for the response
    const populatedSet = await populateSetQuery(Set.findById(newSet._id));

    res.status(201).json({
        status: 'success',
        data: {
            set: populatedSet
        },
        message: 'Set created successfully!'
    });
});

// 2. Get a specific Set by Customer, Class
exports.getSetByFilters = catchAsync(async (req, res, next) => {
    const { customerId, classId } = req.query;

    // Basic validation: Customer ID and Class ID are mandatory for filtering
    if (!customerId || !classId) {
        return next(new AppError('Customer ID and Class ID are required to fetch a set.', 400));
    }

    const filter = {
        customer: customerId,
        class: classId
    };

    // Find the set and populate its references
    const set = await populateSetQuery(Set.findOne(filter));

    if (!set) {
        // If no set is found, return a success status with null data and an informative message
        return res.status(200).json({
            status: 'success',
            data: {
                set: null
            },
            message: 'No existing set found for the provided criteria. You can create a new one.'
        });
    }

    res.status(200).json({
        status: 'success',
        data: {
            set
        },
        message: 'Set fetched successfully!'
    });
});

// NEW: Get all Sets (for frontend dropdown filtering)
exports.getAllSets = catchAsync(async (req, res, next) => {
    const sets = await Set.find().select('customer class'); // Only need customer and class IDs
    res.status(200).json({
        status: 'success',
        results: sets.length,
        data: {
            sets
        }
    });
});


// 3. Update an existing Set
exports.updateSet = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { books, stationeryItems, customer, class: classId } = req.body;

    const currentSet = await Set.findById(id);
    if (!currentSet) {
        return next(new AppError('No set found with that ID.', 404));
    }

    // If customer or class are being updated, check for conflicts with other sets
    if (
        (customer && String(customer) !== String(currentSet.customer)) ||
        (classId && String(classId) !== String(currentSet.class))
    ) {
        const conflictQuery = {
            customer: customer || currentSet.customer,
            class: classId || currentSet.class,
            _id: { $ne: id }
        };
        const conflictingSet = await Set.findOne(conflictQuery);
        if (conflictingSet) {
            return next(new AppError('A set with these Customer and Class already exists. Cannot update to this combination.', 409));
        }
    }

    // Update the set
    const updatedSet = await Set.findByIdAndUpdate(
        id,
        { books, stationeryItems, customer, class: classId },
        {
            new: true,
            runValidators: true,
            context: 'query'
        }
    );

    if (!updatedSet) {
        return next(new AppError('No set found with that ID.', 404));
    }

    // Populate the updated set for the response
    const populatedSet = await populateSetQuery(Set.findById(updatedSet._id));

    res.status(200).json({
        status: 'success',
        data: {
            set: populatedSet
        },
        message: 'Set updated successfully!'
    });
});

// 4. Delete a Set
exports.deleteSet = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const deletedSet = await Set.findByIdAndDelete(id);

    if (!deletedSet) {
        return next(new AppError('No set found with that ID.', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null,
        message: 'Set deleted successfully!'
    });
});

// 5. Copy a Set to another Class/Customer
exports.copySet = catchAsync(async (req, res, next) => {
    const { sourceSetId, targetCustomerId, targetClassId, copyStationery } = req.body;

    console.log('DEBUG: copySet - Received Payload:', { sourceSetId, targetCustomerId, targetClassId, copyStationery });

    // Validate required fields for copying
    if (!sourceSetId || !targetCustomerId || !targetClassId) {
        console.log('DEBUG: copySet - Validation Failed: Missing required fields.');
        return next(new AppError('Source Set ID, Target Customer ID, and Target Class ID are required for copying.', 400));
    }

    const sourceSet = await Set.findById(sourceSetId);
    if (!sourceSet) {
        console.log('DEBUG: copySet - Source set not found for ID:', sourceSetId);
        return next(new AppError('Source set not found.', 404));
    }
    console.log('DEBUG: copySet - Source Set Found:', sourceSet._id);


    // Map books from the source set to the new set, resetting status to 'pending'
    const newBooks = sourceSet.books.map(bookItem => ({
        book: bookItem.book,
        quantity: bookItem.quantity,
        price: bookItem.price, // Ensure price is copied from the source set's stored price
        status: 'pending'
    }));
    console.log('DEBUG: copySet - New Books prepared:', newBooks);


    // Conditionally map stationery items based on 'copyStationery' flag
    const newStationeryItems = copyStationery ? sourceSet.stationeryItems.map(stationeryItem => ({
        item: stationeryItem.item,
        quantity: stationeryItem.quantity,
        price: stationeryItem.price, // Ensure price is copied from the source set's stored price
        status: 'pending'
    })) : [];
    console.log('DEBUG: copySet - New Stationery Items prepared (copyStationery:', copyStationery, '):', newStationeryItems);


    // Create the copied set
    const copiedSet = await Set.create({
        customer: targetCustomerId,
        class: targetClassId,
        books: newBooks,
        stationeryItems: newStationeryItems
    });
    console.log('DEBUG: copySet - Copied Set Created:', copiedSet._id);


    // Populate the newly copied set for the response
    const populatedCopiedSet = await populateSetQuery(Set.findById(copiedSet._id));
    console.log('DEBUG: copySet - Copied Set Populated.');


    res.status(201).json({
        status: 'success',
        data: {
            set: populatedCopiedSet
        },
        message: 'Set copied successfully!'
    });
    console.log('DEBUG: copySet - Response Sent.');

});


// 6. Update the status of a specific item (book or stationery) within a Set
exports.updateSetItemStatus = catchAsync(async (req, res, next) => {
    const { setId } = req.params;
    const { itemId, itemType, status } = req.body; 

    console.log('DEBUG: updateSetItemStatus called');
    console.log('DEBUG: setId:', setId);
    console.log('DEBUG: Request Body:', { itemId, itemType, status });

    // Validate inputs - now includes 'active'
    if (!itemId || !itemType || !status || !['active', 'pending', 'clear'].includes(status)) {
        console.log('DEBUG: Validation failed for inputs.');
        return next(new AppError('Item ID, item type ("book" or "stationery"), and a valid status ("active", "pending", or "clear") are required.', 400));
    }

    try {
        const set = await Set.findById(setId);
        console.log('DEBUG: Set found:', set ? set._id : 'null');

        if (!set) {
            console.log('DEBUG: Set not found for ID:', setId);
            return next(new AppError('Set not found.', 404));
        }

        let updated = false;
        if (itemType === 'book') {
            const bookIndex = set.books.findIndex(b => String(b.book) === itemId);
            console.log('DEBUG: Book Index:', bookIndex);
            if (bookIndex !== -1) {
                set.books[bookIndex].status = status;
                if (status === 'clear') {
                    set.books[bookIndex].clearedDate = Date.now();
                } else {
                    set.books[bookIndex].clearedDate = undefined; 
                }
                updated = true;
            }
        } else if (itemType === 'stationery') {
            const stationeryIndex = set.stationeryItems.findIndex(s => String(s.item) === itemId);
            console.log('DEBUG: Stationery Index:', stationeryIndex);
            if (stationeryIndex !== -1) {
                set.stationeryItems[stationeryIndex].status = status;
                if (status === 'clear') {
                    set.stationeryItems[stationeryIndex].clearedDate = Date.now();
                } else {
                    set.stationeryItems[stationeryIndex].clearedDate = undefined; 
                }
                updated = true;
            }
        }

        if (!updated) {
            console.log('DEBUG: Item not found in set.books or set.stationeryItems.');
            return next(new AppError(`Item with ID ${itemId} not found in the set's ${itemType} list.`, 404));
        }

        await set.save(); // <-- यह लाइन अक्सर एरर देती है अगर स्कीमा या डेटा में कोई समस्या हो
        console.log('DEBUG: Set saved successfully.');

        const populatedSet = await populateSetQuery(Set.findById(set._id));
        console.log('DEBUG: Set populated for response.');

        res.status(200).json({
            status: 'success',
            data: {
                set: populatedSet
            },
            message: `Status of ${itemType} item updated successfully to "${status}"!`
        });
    } catch (err) {
        console.error('SERVER ERROR: Error updating set item status:', err); // <-- यह तुम्हें असली एरर दिखाएगा
        // If it's a Mongoose validation error, you might want to send a 400
        if (err.name === 'ValidationError') {
            return next(new AppError(err.message, 400));
        }
        next(err); // Pass the error to your global error handler
    }
});
// NEW: Remove a specific item (book or stationery) from a Set
exports.removeItemFromSet = catchAsync(async (req, res, next) => {
    const { setId } = req.params;
    const { itemId, itemType } = req.body; // itemId is the _id of the book/stationery reference

    if (!itemId || !itemType || !['book', 'stationery'].includes(itemType)) {
        return next(new AppError('Item ID and valid Item Type ("book" or "stationery") are required.', 400));
    }

    const set = await Set.findById(setId);
    if (!set) {
        return next(new AppError('Set not found.', 404));
    }

    let modified = false;
    if (itemType === 'book') {
        const initialLength = set.books.length;
        // Filter out the book by its 'book' field (which stores the BookCatalog _id)
        set.books = set.books.filter(b => String(b.book) !== itemId);
        if (set.books.length < initialLength) {
            modified = true;
        }
    } else if (itemType === 'stationery') {
        const initialLength = set.stationeryItems.length;
        // Filter out the stationery item by its 'item' field (which stores the StationeryItem _id)
        set.stationeryItems = set.stationeryItems.filter(s => String(s.item) !== itemId);
        if (set.stationeryItems.length < initialLength) {
            modified = true;
        }
    }

    if (!modified) {
        return next(new AppError(`Item with ID ${itemId} not found in the set's ${itemType} list.`, 404));
    }

    await set.save();

    const populatedSet = await populateSetQuery(Set.findById(set._id));

    res.status(200).json({
        status: 'success',
        data: {
            set: populatedSet
        },
        message: `${itemType} item removed from set successfully!`
    });
});

// Get all books for a specific customer and class for pending book management
exports.getBooksByCustomerAndClass = catchAsync(async (req, res, next) => {
    const { customerId, classId } = req.query;

    if (!customerId || !classId) {
        return next(new AppError('Customer ID and Class ID are required.', 400));
    }

    const set = await Set.findOne({ customer: customerId, class: classId })
        .populate({
            path: 'books.book',
            select: 'bookName subtitle commonPrice'
        })
        .select('books'); // Only select the books array

    if (!set) {
        return res.status(200).json({
            status: 'success',
            data: {
                books: [] // Return an empty array if no set found
            },
            message: 'No set found for the selected customer and class.'
        });
    }

    // Default status to 'active' if not explicitly set
    const booksWithDefaultStatus = set.books.map(bookItem => ({
        ...bookItem.toObject(), // Convert Mongoose document to plain object
        book: bookItem.book ? bookItem.book.toObject() : null, // Convert populated book to plain object
        status: bookItem.status || 'active' // Default to 'active'
    }));


    res.status(200).json({
        status: 'success',
        data: {
            books: booksWithDefaultStatus
        },
        message: 'Books fetched successfully for pending management.'
    });
});

// NEW: Get all books for a specific customer (school) across all classes
exports.getBooksBySchool = catchAsync(async (req, res, next) => {
    const { customerId } = req.query;

    if (!customerId) {
        return next(new AppError('Customer ID is required to fetch books by school.', 400));
    }

    // Find all sets for the given customer
    const sets = await Set.find({ customer: customerId })
        .populate({
            path: 'books.book',
            select: 'bookName subtitle commonPrice'
        })
        .populate({ // Populate the class for each set
            path: 'class',
            select: 'name'
        })
        .select('books class'); // Select books and class to identify where they came from

    let allBooks = [];
    sets.forEach(set => {
        // For each set, map its books and include the class name and setId for context
        const classInfo = set.class ? { _id: set.class._id, name: set.class.name } : null; // Get class info
        set.books.forEach(bookItem => {
            allBooks.push({
                ...bookItem.toObject(),
                book: bookItem.book ? bookItem.book.toObject() : null,
                status: bookItem.status || 'active', // Default to 'active'
                class: classInfo, // Add class context to each book
                setId: set._id // Include the setId for status updates
            });
        });
    });

    res.status(200).json({
        status: 'success',
        data: {
            books: allBooks
        },
        message: 'Books fetched successfully for the selected school across all classes.'
    });
});


// --- Helper functions for dropdown data ---

// Get all customers (schools) for dropdown
exports.getAllCustomersForDropdown = catchAsync(async (req, res, next) => {
    const customers = await Customer.find().select('customerName schoolCode').sort('customerName');
    res.status(200).json({
        status: 'success',
        data: {
            customers
        }
    });
});

// Get all classes for dropdown
exports.getAllClassesForDropdown = catchAsync(async (req, res, next) => {
    const classes = await Class.find().select('name').sort('name');
    res.status(200).json({
        status: 'success',
        data: {
            classes
        }
    });
});

// Get all book catalogs for dropdown, optionally filtered by subtitle
exports.getAllBookCatalogsForDropdown = catchAsync(async (req, res, next) => {
    const { subtitleId } = req.query;

    let filter = {};
    if (subtitleId) {
        filter.subtitle = subtitleId;
    }

    // CHANGED: Select 'commonPrice' instead of 'price' for book catalogs
    const bookCatalogs = await BookCatalog.find(filter).select('bookName subtitle commonPrice').populate('subtitle', 'name').sort('bookName');
    res.status(200).json({
        status: 'success',
        data: {
            bookCatalogs
        }
    });
});

// Get all stationery items for dropdown
exports.getAllStationeryItemsForDropdown = catchAsync(async (req, res, next) => {
    // ADDED 'price' to select for stationery items dropdown
    const stationeryItems = await StationeryItem.find().select('itemName price').sort('itemName');
    res.status(200).json({
        status: 'success',
        data: {
            stationeryItems
        }
    });
});

// Get all publication subtitles for dropdown
exports.getAllPublicationSubtitlesForDropdown = catchAsync(async (req, res, next) => {
    const subtitles = await PublicationSubtitle.find().select('name').sort('name');
    res.status(200).json({
        status: 'success',
        data: {
            subtitles
        }
    });
});

// NEW: Get all branches for dropdown (using the Branch model)
exports.getAllBranchesForDropdown = catchAsync(async (req, res, next) => {
    // Assuming Branch model has 'name' and 'location' as per your provided branch data
    const branches = await Branch.find().select('name location').sort('name'); 
    res.status(200).json({
        status: 'success',
        data: {
            branches
        }
    });
});

// NEW: Get customers by branch for dropdown (This is the new function you need)
exports.getCustomersByBranch = catchAsync(async (req, res, next) => {
    const { branchId } = req.query;

    if (!branchId || !mongoose.Types.ObjectId.isValid(branchId)) {
        return next(new AppError('Valid Branch ID is required.', 400));
    }

    const customers = await Customer.find({ branch: branchId })
        .select('customerName schoolCode')
        .sort('customerName');

    res.status(200).json({
        status: 'success',
        data: {
            customers
        }
    });
});