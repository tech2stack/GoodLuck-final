// src/components/masters/PendingBookManagement.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api'; // Your configured Axios instance
// Replaced lucide-react with react-icons/fa for consistency and to resolve module not found error
import { FaSearch, FaFilePdf, FaChevronLeft, FaChevronRight, FaCheckCircle, FaHourglassHalf, FaSpinner, FaTimesCircle } from 'react-icons/fa'; // Icons for UI

// Import your existing CSS files for consistency
import '../../styles/Form.css';
import '../../styles/Table.css';
import '../../styles/Modal.css';

// Ensure jsPDF and jspdf-autotable are loaded globally via CDN in public/index.html
// If using npm, remember to install them: npm install jspdf jspdf-autotable

const PendingBookManagement = ({ showFlashMessage }) => {
    // State for managing list of books (which will now include their pending status)
    const [books, setBooks] = useState([]);
    // States for dropdown data
    const [branches, setBranches] = useState([]);
    const [customers, setCustomers] = useState([]);

    // Filter states
    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalBooksCount, setTotalBooksCount] = useState(0);

    // Loading and error states
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState(null);

    // Ref for table scrolling (if needed) - kept for potential future use, though not directly used in this version
    const tableBodyRef = useRef(null);

    // --- Helper function for date formatting ---
    const formatDateWithTime = (dateString) => {
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-US', options);
    };

    // --- Helper function to safely get string value or 'N/A' ---
    const getStringValue = (field) => field ? String(field).trim() : 'N/A';

    // --- Fetch Dropdown Data (Branches and Customers) ---
    const fetchDropdownData = useCallback(async () => {
        setLoading(true);
        try {
            const [branchesRes, customersRes] = await Promise.all([
                api.get('/pending-books/dropdowns/branches'),
                api.get('/pending-books/dropdowns/customers')
            ]);

            if (branchesRes.data.status === 'success' && Array.isArray(branchesRes.data.data.branches)) {
                setBranches(branchesRes.data.data.branches);
            } else {
                showFlashMessage(branchesRes.data.message || 'Failed to load branches for dropdown.', 'error');
            }

            if (customersRes.data.status === 'success' && Array.isArray(customersRes.data.data.customers)) {
                setCustomers(customersRes.data.data.customers);
            } else {
                showFlashMessage(customersRes.data.message || 'Failed to load customers for dropdown.', 'error');
            }
        } catch (err) {
            console.error('Error fetching dropdown data:', err);
            showFlashMessage(err.response?.data?.message || 'Network error fetching dropdown data.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showFlashMessage]);

    // --- Fetch Books based on filters and pagination ---
    const fetchBooksWithStatus = useCallback(async () => {
        if (!selectedCustomer) {
            setBooks([]);
            setTotalBooksCount(0);
            return;
        }

        setLoading(true);
        setLocalError(null);
        try {
            const queryParams = new URLSearchParams();
            if (selectedBranch) {
                queryParams.append('branch', selectedBranch);
            }
            if (selectedCustomer) {
                queryParams.append('customer', selectedCustomer);
            }
            if (searchTerm) {
                queryParams.append('search', searchTerm);
            }
            queryParams.append('page', currentPage);
            queryParams.append('limit', itemsPerPage);

            const response = await api.get(`/pending-books?${queryParams.toString()}`);
            console.log('API Response for books with status:', response.data);

            if (response.data.status === 'success' && Array.isArray(response.data.data.books)) {
                setBooks(response.data.data.books);
                setTotalBooksCount(response.data.totalCount || 0);
            } else {
                setLocalError(response.data.message || 'Failed to fetch books due to unexpected response structure.');
            }
        } catch (err) {
            console.error('Error fetching books with status:', err);
            setLocalError(err.response?.data?.message || 'Failed to load books due to network error.');
        } finally {
            setLoading(false);
        }
    }, [selectedBranch, selectedCustomer, searchTerm, currentPage, itemsPerPage, showFlashMessage]);

    // Effects to fetch data on component mount and filter changes
    useEffect(() => {
        fetchDropdownData();
    }, [fetchDropdownData]);

    useEffect(() => {
        fetchBooksWithStatus();
    }, [fetchBooksWithStatus]);

    // --- Handle Status Change (Clear/Pending) ---
    const handleToggleStatus = async (bookId, currentStatus) => {
        if (!selectedCustomer || !selectedBranch) {
            showFlashMessage('Please select both a Branch and a Customer first.', 'error');
            return;
        }

        setLoading(true);
        setLocalError(null);
        const newStatus = currentStatus === 'pending' ? 'clear' : 'pending';

        try {
            const response = await api.patch(`/pending-books/status`, {
                customerId: selectedCustomer,
                bookId: bookId,
                branchId: selectedBranch,
                status: newStatus
            });

            if (response.data.status === 'success') {
                showFlashMessage(`Book status updated to "${newStatus}" successfully!`, 'success');
                // Optimistically update the local state
                setBooks(prevBooks =>
                    prevBooks.map(book =>
                        book._id === bookId ? { ...book, status: newStatus } : book
                    )
                );
            } else {
                throw new Error(response.data.message || 'Failed to update book status.');
            }
        } catch (err) {
            console.error('Error updating book status:', err);
            const errorMessage = err.response?.data?.message || 'Failed to update book status.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- PDF Download Functionality ---
    const downloadPdf = () => {
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF !== 'function') {
            showFlashMessage('PDF generation libraries not fully loaded or accessible. Check console for details.', 'error');
            console.error("PDF generation failed: window.jspdf or window.jspdf.jsPDF is not available/callable. Ensure CDNs are correctly linked in public/index.html");
            return;
        }

        const doc = new window.jspdf.jsPDF('landscape');
        
        if (typeof doc.autoTable !== 'function') {
            showFlashMessage('PDF Table plugin (jspdf-autotable) not loaded or accessible. Check console for details.', 'error');
            console.error("PDF generation failed: doc.autoTable is not a function. Ensure jspdf.plugin.autotable.min.js is correctly linked and loaded AFTER jspdf.umd.min.js.");
            return;
        }

        doc.text("Pending Book List", 14, 15);

        const tableColumn = [
            "S.No.", "Branch", "Customer (School)", "Sub Title", "Book Name", "Status", "Pending Date", "Cleared Date"
        ];
        const tableRows = [];

        books.forEach((book, index) => {
            const rowData = [
                String(index + 1),
                selectedBranch ? getStringValue(branches.find(b => b._id === selectedBranch)?.name) : 'N/A',
                selectedCustomer ? `${getStringValue(customers.find(c => c._id === selectedCustomer)?.customerName)} ${customers.find(c => c._id === selectedCustomer)?.schoolCode ? `(${getStringValue(customers.find(c => c._id === selectedCustomer)?.schoolCode)})` : ''}`.trim() : 'N/A',
                getStringValue(book.subtitle),
                getStringValue(book.bookName),
                getStringValue(book.status) === 'not_set' ? 'Not Set' : getStringValue(book.status).charAt(0).toUpperCase() + getStringValue(book.status).slice(1),
                book.pendingDate ? formatDateWithTime(book.pendingDate) : 'N/A',
                book.clearedDate ? formatDateWithTime(book.clearedDate) : 'N/A'
            ];
            tableRows.push(rowData);
        });

        doc.autoTable(tableColumn, tableRows, { startY: 20 });
        doc.save(`Pending_Book_List_${new Date().toLocaleDateString()}.pdf`);
        showFlashMessage('Pending book list downloaded as PDF!', 'success');
    };

    const totalPages = Math.ceil(totalBooksCount / itemsPerPage);

    // --- UI Rendering ---
    return (
        <div className="pending-book-management-container">
            <h2 className="section-title">Pending Book Management</h2>

            {localError && (
                <p className="error-message text-center">{localError}</p>
            )}

            {/* Filter and Search Section */}
            <div className="filter-search-controls form-container-card">
                <div className="form-group">
                    <label htmlFor="branchFilter">Filter by Branch:</label>
                    <select
                        id="branchFilter"
                        value={selectedBranch}
                        onChange={(e) => { setSelectedBranch(e.target.value); setCurrentPage(1); }}
                        disabled={loading || branches.length === 0}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    >
                        <option value="">-- Select a Branch --</option>
                        {branches.map(branch => (
                            <option key={branch._id} value={branch._id}>{branch.name}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="customerFilter">Filter by Customer (School):</label>
                    <select
                        id="customerFilter"
                        value={selectedCustomer}
                        onChange={(e) => { setSelectedCustomer(e.target.value); setCurrentPage(1); }}
                        disabled={loading || customers.length === 0}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    >
                        <option value="">-- Select a Customer --</option>
                        {customers.map(customer => (
                            <option key={customer._id} value={customer._id}>
                                {customer.customerName} {customer.schoolCode ? `(${customer.schoolCode})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="search-input-group relative"> {/* Added relative for icon positioning */}
                    <input
                        type="text"
                        placeholder="Search by Book Name or Subtitle..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input w-full pl-10 pr-10 p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    />
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1 rounded-full"
                        >
                            <FaTimesCircle size={18} /> {/* Changed to FaTimesCircle */}
                        </button>
                    )}
                </div>

                <button onClick={downloadPdf} className="btn btn-info download-pdf-btn">
                    <FaFilePdf className="mr-2" /> Download PDF
                </button>
            </div>

            {/* Book List Table */}
            <div className="table-container">
                <h3 className="table-title">Book List with Pending Status</h3>

                {loading && books.length === 0 ? (
                    <p className="loading-state flex justify-center items-center text-lg text-gray-600">
                        <FaSpinner className="animate-spin mr-3 text-blue-500" size={24} /> Loading books...
                    </p>
                ) : !selectedCustomer ? (
                    <p className="no-data-message text-center text-gray-500 text-lg py-10">Please select a customer to view books.</p>
                ) : books.length === 0 ? (
                    <p className="no-data-message text-center text-gray-500 text-lg py-10">No books found for the selected customer/branch or matching your search.</p>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>S.No.</th>
                                        <th>Book Name</th>
                                        <th>Sub Title</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody ref={tableBodyRef}>
                                    {books.map((book, index) => (
                                        <tr key={book._id}>
                                            <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                            <td>{getStringValue(book.bookName)}</td>
                                            <td>{getStringValue(book.subtitle)}</td>
                                            <td>
                                                <span className={`status-badge ${getStringValue(book.status).toLowerCase()}`}>
                                                    {getStringValue(book.status) === 'not_set' ? 'Not Set' : getStringValue(book.status).charAt(0).toUpperCase() + getStringValue(book.status).slice(1)}
                                                </span>
                                            </td>
                                            <td className="actions-column">
                                                {book.status === 'pending' ? (
                                                    <button
                                                        onClick={() => handleToggleStatus(book._id, book.status)}
                                                        className="action-icon-button success-button"
                                                        title="Mark as Cleared"
                                                        disabled={loading}
                                                    >
                                                        <FaCheckCircle /> Clear
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleToggleStatus(book._id, book.status)}
                                                        className="action-icon-button info-button"
                                                        title="Mark as Pending"
                                                        disabled={loading}
                                                    >
                                                        <FaHourglassHalf /> Pending
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {selectedCustomer && totalBooksCount > 0 && (
                            <div className="pagination-controls">
                                <button onClick={() => setCurrentPage(prev => prev - 1)} disabled={currentPage === 1 || loading} className="btn btn-page">
                                    <FaChevronLeft /> Previous
                                </button>
                                <span>Page {currentPage} of {Math.ceil(totalBooksCount / itemsPerPage)}</span>
                                <button onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage === Math.ceil(totalBooksCount / itemsPerPage) || loading} className="btn btn-page">
                                    Next <FaChevronRight />
                                </button>
                                <div className="page-size-dropdown">
                                    <label htmlFor="pageSize">Page Size:</label>
                                    <select
                                        id="pageSize"
                                        value={itemsPerPage}
                                        onChange={(e) => {
                                            setItemsPerPage(Number(e.target.value));
                                            setCurrentPage(1); // Reset to first page on size change
                                        }}
                                        disabled={loading}
                                    >
                                        <option value="10">10</option>
                                        <option value="25">25</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                    </select>
                                </div>
                                <span className="total-records">Total Records: {totalBooksCount}</span>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default PendingBookManagement;
