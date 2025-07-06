// backend/routes/setRoutes.js

const express = require('express');
const setController = require('../controllers/setController');
const authController = require('../middleware/authMiddleware'); 

const router = express.Router();

console.log('DEBUG: Set Routes module loaded and defining routes...');

router.use(authController.protect);

// Route to create a new set
router.post('/', setController.createSet);

// Route to get a specific set by filters (customer, class)
router.get('/', setController.getSetByFilters);

// Route to get all sets (for frontend dropdown filtering)
router.get('/all', setController.getAllSets);

router
    .route('/:id')
    .patch(setController.updateSet)
    .delete(setController.deleteSet);

router.post('/copy', setController.copySet);

router.patch('/:setId/item-status', setController.updateSetItemStatus);

router.patch('/:setId/removeItem', setController.removeItemFromSet);

// Route for fetching books for pending management (by customer and class - existing)
router.get('/books-by-customer-class', setController.getBooksByCustomerAndClass);

// Route for fetching all books for a specific school (customer) across all classes
router.get('/books-by-school', setController.getBooksBySchool);


// --- Routes for dropdown data ---
router.get('/dropdowns/customers', (req, res, next) => {
    console.log('DEBUG: Hit /sets/dropdowns/customers route');
    setController.getAllCustomersForDropdown(req, res, next);
});

router.get('/dropdowns/classes', (req, res, next) => {
    console.log('DEBUG: Hit /sets/dropdowns/classes route');
    setController.getAllClassesForDropdown(req, res, next);
});

router.get('/dropdowns/book-catalogs', (req, res, next) => {
    console.log('DEBUG: Hit /sets/dropdowns/book-catalogs route');
    setController.getAllBookCatalogsForDropdown(req, res, next);
});

router.get('/dropdowns/stationery-items', (req, res, next) => {
    console.log('DEBUG: Hit /sets/dropdowns/stationery-items route');
    setController.getAllStationeryItemsForDropdown(req, res, next);
});

router.get('/dropdowns/subtitles', (req, res, next) => {
    console.log('DEBUG: Hit /sets/dropdowns/subtitles route');
    setController.getAllPublicationSubtitlesForDropdown(req, res, next);
});

// Route for fetching all branches for dropdown
router.get('/dropdowns/branches', (req, res, next) => { 
    console.log('DEBUG: Hit /sets/dropdowns/branches route');
    setController.getAllBranchesForDropdown(req, res, next);
});

// NEW: Route to get customers by branch for dropdown
router.get('/dropdowns/customers-by-branch', setController.getCustomersByBranch);


module.exports = router;
