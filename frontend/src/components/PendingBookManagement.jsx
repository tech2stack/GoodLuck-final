// src/components/PendingBookManagement.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api';
import { toast } from 'sonner';
import { FaSearch, FaSpinner, FaTimesCircle, FaSync } from 'react-icons/fa';

import '../styles/Form.css';
import '../styles/Table.css';
import '../styles/PendingBookManagement.css'; 

export default function PendingBookManagement({ showFlashMessage }) {
    // --- State for Dropdown Data ---
    const [branches, setBranches] = useState([]); // All branches
    const [filteredCustomers, setFilteredCustomers] = useState([]); // Customers filtered by selected branch

    // --- State for Filters ---
    const [selectedBranch, setSelectedBranch] = useState(''); // Selected Branch ID
    const [selectedSchoolCustomer, setSelectedSchoolCustomer] = useState(''); // Selected School Customer ID

    // --- State for Books Data ---
    const [books, setBooks] = useState([]); // Array of books from the selected set

    // --- State for Loading and Error ---
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState(null);

    // --- State for Pagination ---
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // --- Fetch Initial Dropdown Data (Branches) ---
    const fetchBranches = useCallback(async () => {
        setLoading(true);
        try {
            const branchesRes = await api.get('/sets/dropdowns/branches'); // Fetch branches
            // Use 'name' and 'location' as per your provided branch data structure
            const validBranches = (branchesRes.data.data.branches || []).filter(b => b && b._id && String(b.name || '').trim() !== ''); 
            setBranches(validBranches);
        } catch (err) {
            console.error('Error fetching branches:', err);
            showFlashMessage(err.response?.data?.message || 'Network error fetching branches.', 'error');
            setLocalError('Failed to load branches.');
        } finally {
            setLoading(false);
        }
    }, [showFlashMessage]);

    // --- Fetch Customers based on Selected Branch ---
    const fetchCustomersByBranch = useCallback(async (branchId) => {
        if (!branchId) {
            setFilteredCustomers([]); // Clear customers if no branch is selected
            setSelectedSchoolCustomer(''); // Clear selected school
            setBooks([]); // Clear books
            return;
        }
        setLoading(true);
        setLocalError(null);
        try {
            const response = await api.get(`/sets/dropdowns/customers-by-branch?branchId=${branchId}`);
            if (response.data.status === 'success') {
                const validCustomers = (response.data.data.customers || []).filter(c => c && c._id && String(c.customerName || '').trim() !== '');
                setFilteredCustomers(validCustomers);
                setSelectedSchoolCustomer(''); // Reset selected school when branch changes
                setBooks([]); // Clear books
            } else {
                setFilteredCustomers([]);
                setSelectedSchoolCustomer('');
                setBooks([]);
                showFlashMessage(response.data.message || 'No customers found for this branch.', 'info');
            }
        } catch (err) {
            console.error('Error fetching customers by branch:', err);
            const errorMessage = err.response?.data?.message || 'Failed to fetch customers for selected branch.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
            setFilteredCustomers([]);
            setSelectedSchoolCustomer('');
            setBooks([]);
        } finally {
            setLoading(false);
        }
    }, [showFlashMessage]);

    // --- Fetch Books for Selected School Customer (across all classes) ---
    const fetchBooks = useCallback(async () => {
        if (!selectedSchoolCustomer) {
            setBooks([]);
            showFlashMessage('Please select a School Name to view books.', 'warning');
            return;
        }

        setLoading(true);
        setLocalError(null);
        try {
            const queryParams = new URLSearchParams({
                customerId: selectedSchoolCustomer, 
            });

            const booksResponse = await api.get(`/sets/books-by-school?${queryParams.toString()}`);
            
            if (booksResponse.data.status === 'success') {
                const fetchedBooks = (booksResponse.data.data.books || []).map(item => ({
                    ...item,
                    status: item.status || 'active' // Default to 'active'
                }));
                // Group books by book_id to show unique books, listing associated classes
                const groupedBooks = {};
                fetchedBooks.forEach(bookItem => {
                    const bookId = bookItem.book._id;
                    if (!groupedBooks[bookId]) {
                        groupedBooks[bookId] = {
                            ...bookItem,
                            classes: [bookItem.class?.name].filter(Boolean), // Start with current class name
                            setIds: [bookItem.setId] // Keep track of set IDs for status updates
                        };
                    } else {
                        // Add class if not already present
                        if (bookItem.class?.name && !groupedBooks[bookId].classes.includes(bookItem.class.name)) {
                            groupedBooks[bookId].classes.push(bookItem.class.name);
                        }
                        // Add setId if not already present
                        if (bookItem.setId && !groupedBooks[bookId].setIds.includes(bookItem.setId)) {
                            groupedBooks[bookId].setIds.push(bookItem.setId);
                        }
                    }
                });
                // Convert back to array for rendering
                setBooks(Object.values(groupedBooks));
                showFlashMessage('Books loaded successfully!', 'success');
            } else {
                setBooks([]);
                showFlashMessage('No books found for the selected school.', 'info');
            }
        } catch (err) {
            console.error('Error fetching books:', err);
            const errorMessage = err.response?.data?.message || 'Failed to fetch books due to network error.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
            setBooks([]);
        } finally {
            setLoading(false);
        }
    }, [selectedSchoolCustomer, showFlashMessage]);

    // --- Handle Status Change for a Book (3-state toggle: Active -> Pending -> Clear -> Active) ---
    const handleStatusChange = useCallback(async (bookId, currentStatus, setIds) => {
        if (!setIds || setIds.length === 0) { 
            showFlashMessage('Error: Cannot update book status. Set ID not found for this book.', 'error');
            return;
        }

        let newStatus;
        if (currentStatus === 'active') {
            newStatus = 'pending';
        } else if (currentStatus === 'pending') {
            newStatus = 'clear';
        } else if (currentStatus === 'clear') {
            newStatus = 'active';
        } else {
            newStatus = 'active'; // Fallback for undefined/unknown status
        }

        setLoading(true);
        setLocalError(null);

        try {
            // Iterate over all relevant setIds for this book and update status
            const updatePromises = setIds.map(setId => 
                api.patch(`/sets/${setId}/item-status`, { 
                    itemId: bookId,
                    itemType: 'book', 
                    status: newStatus
                })
            );
            
            await Promise.all(updatePromises); // Wait for all updates to complete

            // Update local state after successful API calls
            setBooks(prevBooks =>
                prevBooks.map(bookItem =>
                    bookItem.book._id === bookId // Match by bookId (since we grouped them)
                        ? { ...bookItem, status: newStatus }
                        : bookItem
                )
            );
            showFlashMessage(`Book status updated to "${newStatus.toUpperCase()}"!`, 'success');
        } catch (err) {
            console.error('Error updating book status:', err);
            const errorMessage = err.response?.data?.message || 'Failed to update book status due to network error.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    }, [showFlashMessage]);


    // --- Effects ---
    useEffect(() => {
        fetchBranches(); // Fetch branches on initial mount
    }, [fetchBranches]);

    // Effect to fetch customers when branch changes
    useEffect(() => {
        if (selectedBranch) { // Only fetch if a branch is selected
            fetchCustomersByBranch(selectedBranch);
        } else {
            setFilteredCustomers([]); // Clear customers if no branch is selected
            setSelectedSchoolCustomer(''); // Clear selected school
            setBooks([]); // Clear books
        }
    }, [selectedBranch, fetchCustomersByBranch]);


    // --- Pagination Logic ---
    const totalRecords = books.length;
    const totalPages = Math.ceil(totalRecords / itemsPerPage);

    const paginatedBooks = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return books.slice(startIndex, endIndex);
    }, [books, currentPage, itemsPerPage]);

    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1); // Reset to first page when items per page changes
    };

    const getStringValue = (field) => field ? String(field).trim() : 'N/A';


    return (
        <div className="pending-book-management-container">
            {localError && (
                <p className="error-message">
                    <FaTimesCircle className="error-icon" /> {localError}
                </p>
            )}

            <div className="filters-section section-container">
                <h2 className="section-header">Filter Books</h2>
                <div className="form-grid-2-cols"> 
                    <div className="form-group">
                        <label htmlFor="branch-select" className="form-label">Branch:</label>
                        <select
                            id="branch-select"
                            value={selectedBranch}
                            onChange={(e) => {
                                setSelectedBranch(e.target.value);
                                setSelectedSchoolCustomer(''); // Clear selected school when branch changes
                                setBooks([]); // Clear books
                            }}
                            disabled={loading}
                            className="form-select"
                        >
                            <option value="">-- Select Branch --</option>
                            {(branches || []).map(branch => (
                                <option key={branch._id} value={branch._id}>
                                    {branch.name} {branch.location ? `(${branch.location})` : ''} {/* Use branch.name and branch.location */}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="school-customer-select" className="form-label">School Name:</label>
                        <select
                            id="school-customer-select"
                            value={selectedSchoolCustomer}
                            onChange={(e) => {
                                setSelectedSchoolCustomer(e.target.value);
                                setBooks([]); // Clear books
                            }}
                            disabled={loading || !selectedBranch} // Disable until a branch is selected
                            className="form-select"
                        >
                            <option value="">-- Select School --</option>
                            {(filteredCustomers || []).map(customer => ( // Use filteredCustomers here
                                <option key={customer._id} value={customer._id}>
                                    {customer.customerName} {customer.schoolCode ? `(${customer.schoolCode})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <button
                    onClick={fetchBooks}
                    disabled={loading || !selectedSchoolCustomer} 
                    className="btn-primary mt-4"
                >
                    {loading ? <FaSpinner className="btn-icon-mr animate-spin" /> : <FaSearch className="btn-icon-mr" />} Show Books
                </button>
            </div>

            <div className="books-display-section section-container">
                <h2 className="section-header">Book List for Selected School (All Classes)</h2>
                {loading && books.length === 0 && (
                    <p className="loading-message"><FaSpinner className="animate-spin mr-2" /> Loading books...</p>
                )}
                {!loading && books.length === 0 && selectedSchoolCustomer && (
                    <p className="no-data-message">No books found for this school.</p>
                )}
                {books.length > 0 && (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>S.No.</th>
                                    <th>Sub Title</th>
                                    <th>Book Name</th>
                                    <th>Classes</th> {/* Changed to Classes (plural) */}
                                    <th>Status</th>
                                    <th className="table-cell-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedBooks.map((bookItem, index) => (
                                    <tr key={bookItem.book._id}> {/* Key based on unique book ID */}
                                        <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                        <td>{getStringValue(bookItem.book?.subtitle?.name || bookItem.book?.subtitle)}</td>
                                        <td>{getStringValue(bookItem.book?.bookName)}</td>
                                        <td>{bookItem.classes.length > 0 ? bookItem.classes.join(', ') : 'N/A'}</td> {/* Display all classes */}
                                        <td className={`status-cell status-${bookItem.status}`}>
                                            {bookItem.status.toUpperCase()}
                                        </td>
                                        <td className="table-cell-center">
                                            <button
                                                onClick={() => handleStatusChange(bookItem.book._id, bookItem.status, bookItem.setIds)} 
                                                className={`btn-status-action btn-status-${bookItem.status}`}
                                                title={`Change to ${bookItem.status === 'active' ? 'Pending' : bookItem.status === 'pending' ? 'Clear' : 'Active'}`}
                                                disabled={loading}
                                            >
                                                <FaSync className="status-action-icon" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination Controls */}
                        <div className="pagination-controls">
                            <div className="items-per-page">
                                <label htmlFor="items-per-page">Page Size:</label>
                                <select id="items-per-page" value={itemsPerPage} onChange={handleItemsPerPageChange} disabled={loading}>
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                            <div className="page-buttons">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1 || loading}
                                >
                                    Previous
                                </button>
                                <span>Page {currentPage} of {totalPages}</span>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages || loading}
                                >
                                    Next
                                </button>
                            </div>
                            <div className="total-records">
                                Total Records: {totalRecords}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
