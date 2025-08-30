// backend/controllers/setController.js

const Set = require('../models/Set');
const SetQuantity = require('../models/SetQuantity');
const Customer = require('../models/Customer');
const Class = require('../models/Class');
const BookCatalog = require('../models/BookCatalog');
const StationeryItem = require('../models/StationeryItem');
const Publication = require('../models/Publication');
const Branch = require('../models/Branch');

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
            select: 'bookName subtitle commonPrice'
        })
        .populate({
            path: 'stationeryItems.item',
            select: 'itemName price'
        });
};

// 1. Create a new Set (Order Detail)
exports.createSet = catchAsync(async (req, res, next) => {
    const { customer, class: classId, books, stationeryItems, quantity = 0 } = req.body;

    // Basic validation: Customer and Class are mandatory
    if (!customer || !classId) {
        return next(new AppError('Customer and Class are required to create a set.', 400));
    }

    // Check if a set already exists for this unique combination (customer, class)
    const existingSet = await Set.findOne({ customer, class: classId });
    if (existingSet) {
        return next(new AppError('A set already exists for this customer and class. Please update the existing set instead.', 409));
    }

    // Check SetQuantity for pre-set quantity
    const setQuantity = await SetQuantity.findOne({ customer, class: classId });
    const finalQuantity = setQuantity ? setQuantity.quantity : quantity;

    // Create the new set
    const newSet = await Set.create({
        customer,
        class: classId,
        books: books || [],
        stationeryItems: stationeryItems || [],
        quantity: finalQuantity
    });

    // Update or create SetQuantity entry
    await SetQuantity.findOneAndUpdate(
        { customer, class: classId },
        { quantity: finalQuantity, updatedAt: Date.now() },
        { upsert: true, new: true, runValidators: true }
    );

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

// 3. Get all Sets (for frontend dropdown filtering)
exports.getAllSets = catchAsync(async (req, res, next) => {
    const sets = await Set.find().select('customer class quantity');
    res.status(200).json({
        status: 'success',
        results: sets.length,
        data: {
            sets
        }
    });
});

// 4. Update an existing Set
exports.updateSet = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { books, stationeryItems, customer, class: classId, quantity } = req.body;

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

    // Prepare update data
    const updateData = { books, stationeryItems, customer, class: classId };
    if (quantity !== undefined) {
        updateData.quantity = quantity;
    }

    // Update the set
    const updatedSet = await Set.findByIdAndUpdate(
        id,
        updateData,
        {
            new: true,
            runValidators: true,
            context: 'query'
        }
    );

    if (!updatedSet) {
        return next(new AppError('No set found with that ID.', 404));
    }

    // Update or create SetQuantity entry if quantity was provided
    if (quantity !== undefined) {
        await SetQuantity.findOneAndUpdate(
            { customer: updatedSet.customer, class: updatedSet.class },
            { quantity, updatedAt: Date.now() },
            { upsert: true, new: true, runValidators: true }
        );
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

// 5. Delete a Set
exports.deleteSet = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const deletedSet = await Set.findByIdAndDelete(id);

    if (!deletedSet) {
        return next(new AppError('No set found with that ID.', 404));
    }

    // Optionally, remove SetQuantity entry
    await SetQuantity.deleteOne({ customer: deletedSet.customer, class: deletedSet.class });

    res.status(204).json({
        status: 'success',
        data: null,
        message: 'Set deleted successfully!'
    });
});

// 6. Copy a Set to another Class/Customer
exports.copySet = catchAsync(async (req, res, next) => {
    const { sourceSetId, targetCustomerId, targetClassId, copyStationery } = req.body;

    console.log('DEBUG: copySet - Received Payload:', { sourceSetId, targetCustomerId, targetClassId, copyStationery });

    // Validate required fields for copying
    if (!sourceSetId || !targetCustomerId || !targetClassId) {
        console.log('DEBUG: copySet - Validation Failed: Missing required fields.');
        return next(new AppError('Source Set ID, Target Customer ID, and Target Class ID are required for copying.', 400));
    }

    const sourceSet = await Set.findById(sourceSetId).populate('books.book');
    if (!sourceSet) {
        console.log('DEBUG: copySet - Source set not found for ID:', sourceSetId);
        return next(new AppError('Source set not found.', 404));
    }
    console.log('DEBUG: copySet - Source Set Found:', sourceSet._id);

    // Map books from the source set to the new set, adjusting prices based on target class
    const newBooks = await Promise.all(sourceSet.books.map(async (bookItem) => {
        const bookCatalog = bookItem.book; // Already populated
        let newPrice;

        if (bookCatalog.bookType === 'common_price') {
            // Retain original price for common price books
            newPrice = bookItem.price;
        } else {
            // Check for class-specific price in pricesByClass
            const pricesByClass = Object.fromEntries(bookCatalog.pricesByClass || new Map());
            newPrice = pricesByClass[targetClassId] !== undefined ? pricesByClass[targetClassId] : undefined;
        }

        return {
            book: bookItem.book._id,
            quantity: bookItem.quantity,
            price: newPrice,
            status: 'pending'
        };
    }));
    console.log('DEBUG: copySet - New Books prepared:', newBooks);

    // Conditionally map stationery items based on 'copyStationery' flag
    const newStationeryItems = copyStationery ? sourceSet.stationeryItems.map(stationeryItem => ({
        item: stationeryItem.item,
        quantity: stationeryItem.quantity,
        price: stationeryItem.price,
        status: 'pending'
    })) : [];
    console.log('DEBUG: copySet - New Stationery Items prepared (copyStationery:', copyStationery, '):', newStationeryItems);

    // Check SetQuantity for pre-set quantity
    const setQuantity = await SetQuantity.findOne({ customer: targetCustomerId, class: targetClassId });
    const finalQuantity = setQuantity ? setQuantity.quantity : 0;

    // Create the copied set
    const copiedSet = await Set.create({
        customer: targetCustomerId,
        class: targetClassId,
        books: newBooks,
        stationeryItems: newStationeryItems,
        quantity: finalQuantity
    });
    console.log('DEBUG: copySet - Copied Set Created:', copiedSet._id);

    // Update or create SetQuantity entry
    await SetQuantity.findOneAndUpdate(
        { customer: targetCustomerId, class: targetClassId },
        { quantity: finalQuantity, updatedAt: Date.now() },
        { upsert: true, new: true, runValidators: true }
    );

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

// 7. Update the status of a specific item (book or stationery) within a Set
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

        await set.save();
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
        console.error('SERVER ERROR: Error updating set item status:', err);
        if (err.name === 'ValidationError') {
            return next(new AppError(err.message, 400));
        }
        next(err);
    }
});

// 8. Remove a specific item (book or stationery) from a Set
exports.removeItemFromSet = catchAsync(async (req, res, next) => {
    const { setId } = req.params;
    const { itemId, itemType } = req.body;

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
        set.books = set.books.filter(b => String(b.book) !== itemId);
        if (set.books.length < initialLength) {
            modified = true;
        }
    } else if (itemType === 'stationery') {
        const initialLength = set.stationeryItems.length;
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

// 9. Get all books for a specific customer and class for pending book management
exports.getBooksByCustomerAndClass = catchAsync(async (req, res, next) => {
    const { customerId, classId } = req.query;

    if (!customerId || !classId) {
        return next(new AppError('Customer ID and Class ID are required.', 400));
    }

    const set = await Set.findOne({ customer: customerId, class: classId })
        .populate({
    path: 'books.book',
    select: 'bookName subtitle commonPrice language',
    populate: { path: 'language', select: 'name' }
})
        .select('books');

    if (!set) {
        return res.status(200).json({
            status: 'success',
            data: {
                books: []
            },
            message: 'No set found for the selected customer and class.'
        });
    }

    // Default status to 'active' if not explicitly set
    const booksWithDefaultStatus = set.books.map(bookItem => ({
        ...bookItem.toObject(),
        book: bookItem.book ? bookItem.book.toObject() : null,
        status: bookItem.status || 'active'
    }));

    res.status(200).json({
        status: 'success',
        data: {
            books: booksWithDefaultStatus
        },
        message: 'Books fetched successfully for pending management.'
    });
});

// 10. Get all books for a specific customer (school) across all classes
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
        .populate({
            path: 'class',
            select: 'name'
        })
        .select('books class quantity');

    let allBooks = [];
    sets.forEach(set => {
        const classInfo = set.class ? { _id: set.class._id, name: set.class.name } : null;
        set.books.forEach(bookItem => {
            allBooks.push({
                ...bookItem.toObject(),
                book: bookItem.book ? bookItem.book.toObject() : null,
                status: bookItem.status || 'active',
                class: classInfo,
                setId: set._id
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

// 11. Get all set quantities for a customer
exports.getSetQuantitiesByCustomer = catchAsync(async (req, res, next) => {
    const { customerId } = req.params;

    if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
        return next(new AppError('Valid Customer ID is required.', 400));
    }

    const setQuantities = await SetQuantity.find({ customer: customerId })
        .populate({
            path: 'class',
            select: 'name'
        })
        .select('class quantity');

    const result = setQuantities.map(sq => ({
        classId: sq.class._id,
        className: sq.class.name,
        quantity: sq.quantity
    }));

    res.status(200).json({
        status: 'success',
        data: {
            setQuantities: result
        },
        message: 'Set quantities fetched successfully.'
    });
});

// 12. Bulk set quantities for a customer
exports.setQuantitiesByCustomer = catchAsync(async (req, res, next) => {
    const { customerId } = req.params;
    const { classQuantities } = req.body;

    if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
        return next(new AppError('Valid Customer ID is required.', 400));
    }

    if (!Array.isArray(classQuantities) || classQuantities.length === 0) {
        return next(new AppError('classQuantities must be a non-empty array.', 400));
    }

    // Validate each entry in classQuantities
    for (const cq of classQuantities) {
        if (!cq.classId || !mongoose.Types.ObjectId.isValid(cq.classId) || typeof cq.quantity !== 'number' || cq.quantity < 0) {
            return next(new AppError('Each classQuantity must have a valid classId and a non-negative quantity.', 400));
        }
    }

    // Perform bulk upsert
    const bulkOps = classQuantities.map(cq => ({
        updateOne: {
            filter: { customer: customerId, class: cq.classId },
            update: { quantity: cq.quantity, updatedAt: Date.now() },
            upsert: true
        }
    }));

    await SetQuantity.bulkWrite(bulkOps);

    // Sync quantities to existing Sets
    for (const cq of classQuantities) {
        await Set.findOneAndUpdate(
            { customer: customerId, class: cq.classId },
            { quantity: cq.quantity },
            { new: true, runValidators: true }
        );
    }

    res.status(200).json({
        status: 'success',
        message: 'Set quantities updated successfully.'
    });
});

// 13. Delete a specific set quantity by customerId and classId
exports.deleteSetQuantityByCustomerAndClass = catchAsync(async (req, res, next) => {
    const { customerId, classId } = req.params;

    // Validate customerId and classId
    if (!mongoose.Types.ObjectId.isValid(customerId) || !mongoose.Types.ObjectId.isValid(classId)) {
        console.log('DEBUG: Invalid customerId or classId:', { customerId, classId });
        return next(new AppError('Valid Customer ID and Class ID are required.', 400));
    }

    console.log('DEBUG: Deleting set quantity:', { customerId, classId });

    // Find and delete the set quantity
    const result = await SetQuantity.findOneAndDelete({ customer: customerId, class: classId });

    if (!result) {
        console.log('DEBUG: Set quantity not found for:', { customerId, classId });
        return res.status(404).json({
            status: 'error',
            message: 'Set quantity not found for the specified customer and class.'
        });
    }

    // Update the corresponding Set's quantity to 0
    await Set.findOneAndUpdate(
        { customer: customerId, class: classId },
        { quantity: 0 },
        { new: true, runValidators: true }
    );

    console.log('DEBUG: Set quantity deleted successfully:', result);
    res.status(204).json({
        status: 'success',
        data: null,
        message: 'Set quantity deleted successfully.'
    });
});

// --- Helper functions for dropdown data ---

// Get all customers (schools) for dropdown
exports.getAllCustomersForDropdown = catchAsync(async (req, res, next) => {
    const customers = await Customer.find({ 
        customerType: { $in: ['School-Retail', 'School-Both'] } 
    }).select('customerName schoolCode').sort('customerName');
    
    console.log("DEBUG: Customers fetched for dropdown. Count:", customers.length);
    console.log("DEBUG: Fetched customers data:", customers);

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


// Get all book catalogs for dropdown, optionally filtered by subtitle and class
exports.getAllBookCatalogsForDropdown = catchAsync(async (req, res, next) => {
    const { subtitleId, classId } = req.query;

    let filter = {};
    if (subtitleId) {
        filter.subtitle = subtitleId;
    }

    // Fetch book catalogs, including language field and populate language name
    const bookCatalogs = await BookCatalog.find(filter)
        .select('bookName subtitle commonPrice pricesByClass bookType language')
        .populate('subtitle', 'name')
        .populate('language', 'name')
        .sort('bookName'); // Sort all books by bookName initially

    // Group books into required (language: "N/A") and optional (others)
    const requiredBooks = [];
    const optionalBooks = [];

    bookCatalogs.forEach(catalog => {
        const catalogObj = catalog.toObject();
        
        // Handle class-specific pricing if classId is provided
        if (catalog.bookType === 'default' && classId) {
            const pricesByClass = Object.fromEntries(catalog.pricesByClass || new Map());
            catalogObj.classPrice = pricesByClass[classId] || 0;
        } else {
            catalogObj.classPrice = catalog.commonPrice || 0;
        }

        // Group based on language name
        const languageName = catalog.language ? catalog.language.name : null;
        if (languageName === 'N/A') {
            requiredBooks.push(catalogObj);
        } else {
            optionalBooks.push(catalogObj);
        }
    });

    // Sort both arrays by bookName for consistency
    requiredBooks.sort((a, b) => a.bookName.localeCompare(b.bookName));
    optionalBooks.sort((a, b) => a.bookName.localeCompare(b.bookName));

    res.status(200).json({
        status: 'success',
        data: {
            requiredBooks,
            optionalBooks
        }
    });
});

// Get all stationery items for dropdown
exports.getAllStationeryItemsForDropdown = catchAsync(async (req, res, next) => {
    const stationeryItems = await StationeryItem.find().select('itemName price category').sort('itemName');
    res.status(200).json({
        status: 'success',
        data: {
            stationeryItems
        }
    });
});

// Get all publication subtitles for dropdown
exports.getAllPublicationSubtitlesForDropdown = catchAsync(async (req, res, next) => {
    const subtitles = await Publication.aggregate([
        { $match: { subtitle: { $ne: null, $ne: '' } } },
        { $group: { _id: '$subtitle' } },
        { $project: { _id: 0, name: '$_id' } },
        { $sort: { name: 1 } }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            subtitles
        }
    });
});

// Get all branches for dropdown
exports.getAllBranchesForDropdown = catchAsync(async (req, res, next) => {
    const branches = await Branch.find().select('name location').sort('name');
    res.status(200).json({
        status: 'success',
        data: {
            branches
        }
    });
});

// Get customers by branch for dropdown
exports.getCustomersByBranch = catchAsync(async (req, res, next) => {
    const { branchId } = req.query;

    if (!branchId || !mongoose.Types.ObjectId.isValid(branchId)) {
        return next(new AppError('Valid Branch ID is required.', 400));
    }

    const customers = await Customer.find({ 
        branch: branchId,
        customerType: { $in: ['School-Retail', 'School-Both'] } 
    })
        .select('customerName schoolCode')
        .sort('customerName');

    res.status(200).json({
        status: 'success',
        data: {
            customers
        }
    });
});

module.exports = exports;