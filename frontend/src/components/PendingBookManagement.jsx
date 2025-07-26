// src/components/PendingBookManagement.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api';
import { toast } from 'sonner';
import { FaSearch, FaSpinner, FaTimesCircle, FaSync, FaChevronLeft, FaChevronRight, FaFilePdf } from 'react-icons/fa'; // Added FaFilePdf

import '../styles/Form.css';
import '../styles/Table.css';
import '../styles/PendingBookManagement.css'; 
import companyLogo from '../assets/glbs-logo.jpg'; // Import company logo

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

    // --- Helper function for date formatting ---
    const formatDateWithTime = (dateString) => {
        if (!dateString) return 'N/A';
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true // For AM/PM format
        };
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-US', options);
    };

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

        const selectedCustomerName = filteredCustomers.find(c => c._id === selectedSchoolCustomer)?.customerName || 'Unknown School';
        const selectedBranchName = branches.find(b => b._id === selectedBranch)?.name || 'Unknown Branch';

        // Define company details for PDF header
        const companyName = "GOOD LUCK BOOK STORE";
        const companyAddress = "Shop NO. 2, Shriji Tower, Ashoka Garden, Bhopal";
        const companyMobile = "Mobile Number: 7024136476";
        const companyGST = "GST NO: 23EAVPP3772F1Z8";

        const addHeaderAndSetStartY = (docInstance, reportTitle, img, imgWidth, imgHeight, formatDateFunc) => { // Added formatDateFunc
            const HEADER_TOP_MARGIN = 10;
            const LOGO_LEFT_MARGIN = 14;
            const TEXT_OFFSET_FROM_LOGO = 5;
            const COMPANY_NAME_FONT_SIZE = 12;
            const COMPANY_DETAIL_FONT_SIZE = 9;
            const LINE_HEIGHT_NAME_TO_DETAIL = 7; // Space from company name to first detail
            const LINE_HEIGHT_DETAILS = 5; // Space between detail lines
            const REPORT_TITLE_FONT_SIZE = 18;
            const PADDING_AFTER_HEADER_BLOCK = 10; // Space after company info block
            const PADDING_AFTER_REPORT_TITLE = 10; // Space after report title line

            let currentY = HEADER_TOP_MARGIN;
            let companyTextStartX = LOGO_LEFT_MARGIN;
            let companyTextY = currentY; // Initial Y for company text block

            // Add the logo at the top-left
            if (img && imgWidth > 0 && imgHeight > 0) { // Only add if image object is provided (i.e., loaded successfully)
                docInstance.addImage(img, 'JPEG', LOGO_LEFT_MARGIN, currentY, imgWidth, imgHeight); 
                companyTextStartX = LOGO_LEFT_MARGIN + imgWidth + TEXT_OFFSET_FROM_LOGO;
                companyTextY = currentY + (imgHeight / 2) - (COMPANY_NAME_FONT_SIZE / 2); // Vertically align company name with logo center
                if (companyTextY < currentY) companyTextY = currentY; // Ensure it doesn't go above margin
            }
            
            // Add generation date/time to the top right
            docInstance.setFontSize(10);
            docInstance.setFont('helvetica', 'normal');
            docInstance.setTextColor(100, 100, 100); // Gray color for date text
            docInstance.text(`Date: ${formatDateFunc(new Date())}`, docInstance.internal.pageSize.width - LOGO_LEFT_MARGIN, currentY + 10, { align: 'right' });

            // Add company name and details
            docInstance.setFontSize(COMPANY_NAME_FONT_SIZE);
            docInstance.setFont('helvetica', 'bold');
            docInstance.setTextColor(30, 30, 30);
            docInstance.text(companyName, companyTextStartX, companyTextY); // Company Name
            
            docInstance.setFontSize(COMPANY_DETAIL_FONT_SIZE);
            docInstance.setFont('helvetica', 'normal');
            docInstance.setTextColor(50, 50, 50);
            companyTextY += LINE_HEIGHT_NAME_TO_DETAIL; 
            docInstance.text(companyAddress, companyTextStartX, companyTextY); // Address
            companyTextY += LINE_HEIGHT_DETAILS; 
            docInstance.text(companyMobile, companyTextStartX, companyTextY); // Mobile
            companyTextY += LINE_HEIGHT_DETAILS; 
            docInstance.text(companyGST, companyTextStartX, companyTextY); // GST No.

            // Calculate max Y used by the header content (either logo bottom or last company text line bottom)
            const maxHeaderYUsed = Math.max(
                (img ? (currentY + imgHeight) : currentY), // Max Y of logo
                companyTextY // Max Y of company text block
            ); 

            // Add a professional report title (centered, below company info)
            docInstance.setFontSize(REPORT_TITLE_FONT_SIZE);
            docInstance.setFont('helvetica', 'bold');
            docInstance.setTextColor(30, 30, 30); // Dark gray for title
            const reportTitleY = maxHeaderYUsed + PADDING_AFTER_HEADER_BLOCK; 
            docInstance.text(reportTitle, docInstance.internal.pageSize.width / 2, reportTitleY, { align: 'center' }); 

            // Add a line separator below the main title
            docInstance.setLineWidth(0.5);
            docInstance.line(LOGO_LEFT_MARGIN, reportTitleY + (PADDING_AFTER_REPORT_TITLE / 2), docInstance.internal.pageSize.width - LOGO_LEFT_MARGIN, reportTitleY + (PADDING_AFTER_REPORT_TITLE / 2)); 

            return reportTitleY + PADDING_AFTER_REPORT_TITLE; // Return Y position for table start
        };

        const addTableToDoc = (docInstance, columns, rows, startY) => {
            docInstance.autoTable({
                head: [columns],
                body: rows,
                startY: startY, 
                theme: 'plain', 
                styles: {
                    font: 'helvetica',
                    fontSize: 9,
                    cellPadding: 3,
                    textColor: [51, 51, 51], 
                    valign: 'middle',
                    halign: 'left'
                },
                headStyles: {
                    fillColor: [240, 240, 240], 
                    textColor: [51, 51, 51], 
                    fontStyle: 'bold',
                    halign: 'center', 
                    valign: 'middle', 
                    lineWidth: 0.1, 
                    lineColor: [200, 200, 200] 
                },
                bodyStyles: {
                    lineWidth: 0.1, 
                    lineColor: [200, 200, 200] 
                },
                columnStyles: {
                    0: { cellWidth: 15, halign: 'center' }, // S.No.
                    4: { halign: 'center' } // Status
                },
                margin: { top: 10, right: 14, bottom: 10, left: 14 },
                didDrawPage: function (data) {
                    let str = "Page " + docInstance.internal.getNumberOfPages();
                    docInstance.setFontSize(8);
                    docInstance.text(str, data.settings.margin.left, docInstance.internal.pageSize.height - 10);
                }
            });
            return docInstance.autoTable.previous.finalY + 10; // Return Y position after table + some margin
        };

        // Prepare table data
        const tableColumn = ["S.No.", "Sub Title", "Book Name", "Classes", "Status"];
        const tableRows = [];

        books.forEach((bookItem, index) => {
            tableRows.push([
                index + 1,
                getStringValue(bookItem.book?.subtitle?.name || bookItem.book?.subtitle),
                getStringValue(bookItem.book?.bookName),
                bookItem.classes.length > 0 ? bookItem.classes.join(', ') : 'N/A',
                getStringValue(bookItem.status).toUpperCase()
            ]);
        });

        // Generate PDF content
        const generatePdfContent = (docInstance, img, imgWidth, imgHeight) => {
            const reportTitle = `Pending Books Report for ${selectedCustomerName} (${selectedBranchName})`; // Include selected branch and school
            let currentY = addHeaderAndSetStartY(docInstance, reportTitle, img, imgWidth, imgHeight, formatDateWithTime); // Pass formatDateWithTime
            
            if (books.length === 0) {
                docInstance.setFontSize(12);
                docInstance.setTextColor(80, 80, 80);
                docInstance.text("No pending books found for the selected school.", docInstance.internal.pageSize.width / 2, currentY + 20, { align: 'center' });
            } else {
                addTableToDoc(docInstance, tableColumn, tableRows, currentY);
            }

            const filename = `Pending_Books_Report_${selectedCustomerName.replace(/\s/g, '_')}_${selectedBranchName.replace(/\s/g, '_')}.pdf`;
            docInstance.save(filename);
            showFlashMessage('Pending Books Report downloaded as PDF!', 'success');
        };

        // Handle Logo Loading Asynchronously and then generate content
        const img = new Image();
        img.crossOrigin = 'Anonymous'; // Important for CORS if using a different domain
        img.onload = () => {
            const imgWidth = 40; 
            const imgHeight = (img.height * imgWidth) / img.width; 
            generatePdfContent(doc, img, imgWidth, imgHeight);
        };

        img.onerror = () => {
            console.warn("Logo image could not be loaded. Generating PDF without logo.");
            generatePdfContent(doc, null, 0, 0); // Pass null for img to indicate no logo
        };

        img.src = companyLogo; 
    };


    return (
        <div className="pending-book-management-container">
            <h2 className="section-title">Pending Book Management</h2> {/* Added main title */}
            {localError && (
                <p className="error-message">
                    <FaTimesCircle className="error-icon" /> {localError}
                </p>
            )}

            <div className="main-content-layout"> {/* New wrapper for two-column layout */}
                {/* Filters Section - FIRST CHILD */}
                <div className="filters-section section-container form-container-card"> {/* Added form-container-card for styling */}
                    <h3 className="section-header form-title">Filter Books</h3> {/* Changed to h3 and form-title for consistency */}
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
                    <div className="form-actions"> {/* Use form-actions for button consistency */}
                        <button
                            onClick={fetchBooks}
                            disabled={loading || !selectedSchoolCustomer} 
                            className="btn btn-primary"
                        >
                            {loading ? <FaSpinner className="btn-icon-mr animate-spin" /> : <FaSearch className="btn-icon-mr" />} Show Books
                        </button>
                    </div>
                </div>

                {/* Books Display Section - SECOND CHILD */}
                <div className="books-display-section section-container table-section"> {/* Added table-section for styling */}
                    <div className="flex justify-between items-center mb-4 border-b pb-2 border-gray-200">
                        <h3 className="section-header table-title">Book List (All Classes)</h3> {/* Changed to h3 and table-title for consistency */}
                        <button 
                            onClick={downloadPdf} 
                            className="btn btn-info download-pdf-btn flex-shrink-0 ml-auto" // Added flex-shrink-0 and ml-auto
                            disabled={loading || books.length === 0 || !selectedSchoolCustomer}
                        >
                            <FaFilePdf className="mr-2" /> Download PDF
                        </button>
                    </div>
                    
                    {loading && books.length === 0 && (
                        <p className="loading-state"><FaSpinner className="animate-spin mr-2" /> Loading books...</p>
                    )}
                    {!loading && books.length === 0 && selectedSchoolCustomer && (
                        <p className="no-data-message">No books found for this school.</p>
                    )}
                    {books.length > 0 && (
                        <div className="table-container"> {/* This div is for table overflow, not layout */}
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
                                            <td className="actions-column"> {/* Changed to actions-column for consistency */}
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
                                        className="btn btn-page"
                                    >
                                        <FaChevronLeft /> Previous
                                    </button>
                                    <span>Page {currentPage} of {totalPages}</span>
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages || loading}
                                        className="btn btn-page"
                                    >
                                        Next <FaChevronRight />
                                    </button>
                                </div>
                                <div className="total-records">
                                    Total Records: {totalRecords}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div> {/* End of main-content-layout */}
        </div>
    );
}
