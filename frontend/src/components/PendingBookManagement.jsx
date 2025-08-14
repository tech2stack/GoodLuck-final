// src/components/PendingBookManagement.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api';
import { toast } from 'sonner';
import { FaSearch, FaSpinner, FaTimesCircle, FaSync, FaChevronLeft, FaChevronRight, FaFilePdf } from 'react-icons/fa';
import html2canvas from 'html2canvas'; // Import html2canvas for image generation

import '../styles/Form.css';
import '../styles/Table.css';
import '../styles/PendingBookManagement.css';
import companyLogo from '../assets/glbs-logo.jpg';

export default function PendingBookManagement({ showFlashMessage }) {
    // --- State for Dropdown Data ---
    const [branches, setBranches] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);

    // --- State for Filters ---
    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedSchoolCustomer, setSelectedSchoolCustomer] = useState('');

    // --- State for Books Data ---
    const [books, setBooks] = useState([]);

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
            hour12: true
        };
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-US', options);
    };

    // --- Fetch Initial Dropdown Data (Branches) ---
    const fetchBranches = useCallback(async () => {
        setLoading(true);
        try {
            const branchesRes = await api.get('/sets/dropdowns/branches');
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
            setFilteredCustomers([]);
            setSelectedSchoolCustomer('');
            setBooks([]);
            return;
        }
        setLoading(true);
        setLocalError(null);
        try {
            const response = await api.get(`/sets/dropdowns/customers-by-branch?branchId=${branchId}`);
            if (response.data.status === 'success') {
                const validCustomers = (response.data.data.customers || []).filter(c => c && c._id && String(c.customerName || '').trim() !== '');
                setFilteredCustomers(validCustomers);
                setSelectedSchoolCustomer('');
                setBooks([]);
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
                    status: item.status || 'active'
                }));
                const groupedBooks = {};
                fetchedBooks.forEach(bookItem => {
                    if (bookItem && bookItem.book) { // Add null check here
                        const bookId = bookItem.book._id;
                        if (!groupedBooks[bookId]) {
                            groupedBooks[bookId] = {
                                ...bookItem,
                                classes: [bookItem.class?.name].filter(Boolean),
                                setIds: [bookItem.setId]
                            };
                        } else {
                            if (bookItem.class?.name && !groupedBooks[bookId].classes.includes(bookItem.class.name)) {
                                groupedBooks[bookId].classes.push(bookItem.class.name);
                            }
                            if (bookItem.setId && !groupedBooks[bookId].setIds.includes(bookItem.setId)) {
                                groupedBooks[bookId].setIds.push(bookItem.setId);
                            }
                        }
                    }
                });
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
            newStatus = 'active';
        }

        setLoading(true);
        setLocalError(null);

        try {
            const updatePromises = setIds.map(setId =>
                api.patch(`/sets/${setId}/item-status`, {
                    itemId: bookId,
                    itemType: 'book',
                    status: newStatus
                })
            );

            await Promise.all(updatePromises);

            setBooks(prevBooks =>
                prevBooks.map(bookItem =>
                    bookItem.book._id === bookId
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
        fetchBranches();
    }, [fetchBranches]);

    useEffect(() => {
        if (selectedBranch) {
            fetchCustomersByBranch(selectedBranch);
        } else {
            setFilteredCustomers([]);
            setSelectedSchoolCustomer('');
            setBooks([]);
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
        setCurrentPage(1);
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

        const companyName = "GOOD LUCK BOOK STORE";
        const companyAddress = "Shop NO. 2, Shriji Tower, Ashoka Garden, Bhopal";
        const companyMobile = "Mobile Number: 7024136476";
        const companyGST = "GST NO: 23EAVPP3772F1Z8";

        const addHeaderAndSetStartY = (docInstance, reportTitle, img, imgWidth, imgHeight, formatDateFunc) => {
            const HEADER_TOP_MARGIN = 10;
            const LOGO_LEFT_MARGIN = 14;
            const TEXT_OFFSET_FROM_LOGO = 5;
            const COMPANY_NAME_FONT_SIZE = 12;
            const COMPANY_DETAIL_FONT_SIZE = 9;
            const LINE_HEIGHT_NAME_TO_DETAIL = 7;
            const LINE_HEIGHT_DETAILS = 5;
            const REPORT_TITLE_FONT_SIZE = 18;
            const PADDING_AFTER_HEADER_BLOCK = 10;
            const PADDING_AFTER_REPORT_TITLE = 10;

            let currentY = HEADER_TOP_MARGIN;
            let companyTextStartX = LOGO_LEFT_MARGIN;
            let companyTextY = currentY;

            if (img && imgWidth > 0 && imgHeight > 0) {
                docInstance.addImage(img, 'JPEG', LOGO_LEFT_MARGIN, currentY, imgWidth, imgHeight);
                companyTextStartX = LOGO_LEFT_MARGIN + imgWidth + TEXT_OFFSET_FROM_LOGO;
                companyTextY = currentY + (imgHeight / 2) - (COMPANY_NAME_FONT_SIZE / 2);
                if (companyTextY < currentY) companyTextY = currentY;
            }

            docInstance.setFontSize(10);
            docInstance.setFont('helvetica', 'normal');
            docInstance.setTextColor(100, 100, 100);
            docInstance.text(`Date: ${formatDateFunc(new Date())}`, docInstance.internal.pageSize.width - LOGO_LEFT_MARGIN, currentY + 10, { align: 'right' });

            docInstance.setFontSize(COMPANY_NAME_FONT_SIZE);
            docInstance.setFont('helvetica', 'bold');
            docInstance.setTextColor(30, 30, 30);
            docInstance.text(companyName, companyTextStartX, companyTextY);

            docInstance.setFontSize(COMPANY_DETAIL_FONT_SIZE);
            docInstance.setFont('helvetica', 'normal');
            docInstance.setTextColor(50, 50, 50);
            companyTextY += LINE_HEIGHT_NAME_TO_DETAIL;
            docInstance.text(companyAddress, companyTextStartX, companyTextY);
            companyTextY += LINE_HEIGHT_DETAILS;
            docInstance.text(companyMobile, companyTextStartX, companyTextY);
            companyTextY += LINE_HEIGHT_DETAILS;
            docInstance.text(companyGST, companyTextStartX, companyTextY);

            const maxHeaderYUsed = Math.max(
                (img ? (currentY + imgHeight) : currentY),
                companyTextY
            );

            docInstance.setFontSize(REPORT_TITLE_FONT_SIZE);
            docInstance.setFont('helvetica', 'bold');
            docInstance.setTextColor(30, 30, 30);
            const reportTitleY = maxHeaderYUsed + PADDING_AFTER_HEADER_BLOCK;
            docInstance.text(reportTitle, docInstance.internal.pageSize.width / 2, reportTitleY, { align: 'center' });

            docInstance.setLineWidth(0.5);
            docInstance.line(LOGO_LEFT_MARGIN, reportTitleY + (PADDING_AFTER_REPORT_TITLE / 2), docInstance.internal.pageSize.width - LOGO_LEFT_MARGIN, reportTitleY + (PADDING_AFTER_REPORT_TITLE / 2));

            return reportTitleY + PADDING_AFTER_REPORT_TITLE;
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
                    0: { cellWidth: 15, halign: 'center' },
                    4: { halign: 'center' }
                },
                margin: { top: 10, right: 14, bottom: 10, left: 14 },
                didDrawPage: function (data) {
                    let str = "Page " + docInstance.internal.getNumberOfPages();
                    docInstance.setFontSize(8);
                    docInstance.text(str, data.settings.margin.left, docInstance.internal.pageSize.height - 10);
                }
            });
            return docInstance.autoTable.previous.finalY + 10;
        };

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

        // Refactored to ensure PDF generation logic runs regardless of logo load status
        const generatePdfContent = (docInstance, img, imgWidth, imgHeight) => {
            const reportTitle = `Pending Books Report for ${selectedCustomerName} (${selectedBranchName})`;
            let currentY = addHeaderAndSetStartY(docInstance, reportTitle, img, imgWidth, imgHeight, formatDateWithTime);

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

        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const imgWidth = 25;
            const imgHeight = (img.height * imgWidth) / img.width;
            generatePdfContent(doc, img, imgWidth, imgHeight); // Call generation logic here
        };
        img.onerror = () => {
            console.warn("Logo image could not be loaded. Generating PDF without logo.");
            generatePdfContent(doc, null, 0, 0); // Call generation logic here, with no logo
        };
        img.src = companyLogo;
    };


    return (
        <div className="pending-book-management-container">
            <h2 className="main-section-title">Pending Book Management</h2>
            {localError && (
                <p className="error-message">
                    <FaTimesCircle className="error-icon" /> {localError}
                </p>
            )}

            <div className="main-content-layout">
                <div className="filters-section section-container form-container-card">
                    <h3 className="section-header form-title">Filter Books</h3>
                    <div className="form-group">
                        <label htmlFor="branch-select" className="form-label">Branch:</label>
                        <select
                            id="branch-select"
                            value={selectedBranch}
                            onChange={(e) => {
                                setSelectedBranch(e.target.value);
                                setSelectedSchoolCustomer('');
                                setBooks([]);
                            }}
                            disabled={loading}
                            className="form-select"
                        >
                            <option value="">-- Select Branch --</option>
                            {(branches || []).map(branch => (
                                <option key={branch._id} value={branch._id}>
                                    {branch.name} {branch.location ? `(${branch.location})` : ''}
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
                                setBooks([]);
                            }}
                            disabled={loading || !selectedBranch}
                            className="form-select"
                        >
                            <option value="">-- Select School --</option>
                            {(filteredCustomers || []).map(customer => (
                                <option key={customer._id} value={customer._id}>
                                    {customer.customerName} {customer.schoolCode ? `(${customer.schoolCode})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-actions">
                        <button
                            onClick={fetchBooks}
                            disabled={loading || !selectedSchoolCustomer}
                            className="btn btn-primary"
                        >
                            {loading ? <FaSpinner className="btn-icon-mr animate-spin" /> : <FaSearch className="btn-icon-mr" />} Show Books
                        </button>
                    </div>
                </div>

                <div className="books-display-section section-container table-section">
                    <div className="flex justify-between items-center mb-4 border-b pb-2 border-gray-200">
                        <h3 className="section-header">Book List (All Classes)</h3>
                        <button
                            onClick={downloadPdf}
                            className="btn btn-info download-pdf-btn flex-shrink-0 ml-auto"
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
                        <div className="table-container">
                            <table className="app-table">
                                <thead>
                                    <tr>
                                        <th>S.No.</th>
                                        <th>Sub Title</th>
                                        <th>Book Name</th>
                                        <th>Classes</th>
                                        <th>Status</th>
                                        <th className="table-cell-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedBooks.map((bookItem, index) => (
                                        <tr key={bookItem.book._id}>
                                            <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                            <td>{getStringValue(bookItem.book?.subtitle?.name || bookItem.book?.subtitle)}</td>
                                            <td>{getStringValue(bookItem.book?.bookName)}</td>
                                            <td>{bookItem.classes.length > 0 ? bookItem.classes.join(', ') : 'N/A'}</td>
                                            <td className={`status-cell status-${bookItem.status}`}>
                                                {bookItem.status.toUpperCase()}
                                            </td>
                                            <td className="actions-column">
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
            </div>
        </div>
    );
}