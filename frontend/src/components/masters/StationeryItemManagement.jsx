// src/components/masters/StationeryItemManagement.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '../../utils/api'; // API utility for backend calls
import { FaEdit, FaTrashAlt, FaPlusCircle, FaSearch, FaFilePdf, FaChevronLeft, FaChevronRight, FaSpinner, FaTimesCircle } from 'react-icons/fa'; // Icons for UI

// Stylesheets (assuming these are already present and styled for consistency)
import '../../styles/Form.css';
import '../../styles/Table.css';
import '../../styles/Modal.css';
// import '../../styles/StationeryItemManagement.css'; // New import for specific styles - UNCOMMENTED///////////////////////
// import '../../styles/CommonLayout.css'; // If you have common layout styles, ensure this is imported too.

// NOTE: jsPDF and jspdf-autotable are expected to be loaded globally via CDN in public/index.html
// If you are using npm, you'd do: npm install jspdf jspdf-autotable
// Then import them here:
// import { jsPDF } from 'jspdf';
// import 'jspdf-autotable';

// Import the logo image directly (assuming it exists at this path for PDF)
import companyLogo from '../../assets/glbs-logo.jpg';


const StationeryItemManagement = ({ showFlashMessage }) => {
    // State for managing list of stationery items
    const [stationeryItems, setStationeryItems] = useState([]);
    // State for form inputs (for creating new or editing existing stationery item)
    const [formData, setFormData] = useState({
        itemName: '', // Changed from 'name' to 'itemName' to match backend expectation
        price: '', // Use empty string for number input to allow clearing
        status: 'active', // Default status
    });
    // State for loading indicators
    const [loading, setLoading] = useState(false);
    // State for managing local errors (e.g., form validation)
    const [localError, setLocalError] = useState(null);
    // State to track if we are in edit mode and which stationery item is being edited
    const [editingItemId, setEditingItemId] = useState(null);

    // States for confirmation modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [itemToDeleteId, setItemToDeleteId] = useState(null);
    const [itemToDeleteName, setItemToDeleteName] = useState('');

    // Ref for scrolling to the new item in the table (if needed)
    const tableBodyRef = useRef(null);

    // States for Search
    const [searchTerm, setSearchTerm] = useState('');

    // States for Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Show 10 entries per page


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

    // --- Fetch Stationery Items ---
    const fetchStationeryItems = useCallback(async (scrollToNew = false) => {
        setLoading(true);
        setLocalError(null);
        try {
            const response = await api.get('/stationery-items'); // API endpoint to get all stationery items
            if (response.data.status === 'success') {
                setStationeryItems(response.data.data.stationeryItems);
                
                const totalPagesCalculated = Math.ceil(response.data.data.stationeryItems.length / itemsPerPage);
                if (currentPage > totalPagesCalculated && totalPagesCalculated > 0) {
                    setCurrentPage(totalPagesCalculated);
                } else if (response.data.data.stationeryItems.length === 0) {
                    setCurrentPage(1);
                }
                
                if (scrollToNew && tableBodyRef.current) {
                    setTimeout(() => {
                        const lastPageIndex = Math.ceil(response.data.data.stationeryItems.length / itemsPerPage);
                        if (currentPage !== lastPageIndex) {
                           setCurrentPage(lastPageIndex);
                           setTimeout(() => {
                               if (tableBodyRef.current.lastElementChild) {
                                   tableBodyRef.current.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
                               } else {
                                   tableBodyRef.current.scrollTop = tableBodyRef.current.scrollHeight;
                               }
                           }, 50);
                        } else {
                            if (tableBodyRef.current.lastElementChild) {
                                tableBodyRef.current.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
                            } else {
                                tableBodyRef.current.scrollTop = tableBodyRef.current.scrollHeight;
                            }
                        }
                    }, 100);
                }
            } else {
                setLocalError(response.data.message || 'Failed to fetch stationery items.');
            }
        } catch (err) {
            console.error('Error fetching stationery items:', err);
            setLocalError(err.response?.data?.message || 'Failed to load stationery items due to network error.');
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, showFlashMessage]);

    // Fetch stationery items on component mount
    useEffect(() => {
        fetchStationeryItems();
    }, [fetchStationeryItems]);

    // Debugging useEffect for PDF libraries
    useEffect(() => {
        console.log("PDF Libraries Check (StationeryItemManagement):");
        console.log("window.jspdf (global object):", typeof window.jspdf);
        console.log("window.jspdf.jsPDF (constructor):", typeof window.jspdf?.jsPDF);
    }, []);


    // --- Form Handling ---
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        if (type === 'number') {
            const numericValue = parseFloat(value);
            setFormData(prev => ({
                ...prev,
                [name]: isNaN(numericValue) ? '' : numericValue // Store as number, or empty string if invalid
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setLocalError(null);

        // Basic validation
        if (!formData.itemName.trim() || formData.price === '' || formData.price === null || isNaN(formData.price)) {
            setLocalError('Please fill in all required fields (Item Name, Price). Price must be a valid number.');
            showFlashMessage('Please fill in all required fields.', 'error');
            setLoading(false);
            return;
        }
        if (formData.price < 0) {
            setLocalError('Price cannot be negative.');
            showFlashMessage('Price cannot be negative.', 'error');
            setLoading(false);
            return;
        }

        try {
            let response;
            const dataToSend = {
                itemName: formData.itemName, // Changed from formData.name to formData.itemName
                price: parseFloat(formData.price), // Ensure price is sent as a number
                status: formData.status
            };

            if (editingItemId) {
                // Update existing stationery item
                response = await api.patch(`/stationery-items/${editingItemId}`, dataToSend);
                if (response.data.status === 'success') {
                    showFlashMessage('Stationery Item updated successfully!', 'success');
                } else {
                    throw new Error(response.data.message || 'Failed to update stationery item.');
                }
            } else {
                // Create new stationery item
                response = await api.post('/stationery-items', dataToSend);
                if (response.data.status === 'success') {
                    showFlashMessage('Stationery Item created successfully!', 'success');
                } else {
                    throw new Error(response.data.message || 'Failed to create stationery item.');
                }
            }
            // Reset form and re-fetch stationery items
            setFormData({ itemName: '', price: '', status: 'active' }); // Changed name to itemName
            setEditingItemId(null);
            fetchStationeryItems(true); // Re-fetch and indicate to scroll
        } catch (err) {
            console.error('Error saving stationery item:', err);
            const errorMessage = err.response?.data?.message || 'Failed to save stationery item. Please check your input and ensure item name is unique.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Edit and Delete Operations ---
    const handleEdit = (item) => {
        setFormData({ itemName: item.itemName, price: item.price, status: item.status }); // Changed name to itemName
        setEditingItemId(item._id);
        setLocalError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to form
    };

    const openConfirmModal = (item) => {
        setItemToDeleteId(item._id);
        setItemToDeleteName(item.itemName); // Changed item.name to item.itemName
        setShowConfirmModal(true);
    };

    const closeConfirmModal = () => {
        setShowConfirmModal(false);
        setItemToDeleteId(null);
        setItemToDeleteName('');
    };

    const confirmDelete = async () => {
        setLoading(true);
        setLocalError(null);
        closeConfirmModal(); // Close modal immediately

        try {
            const response = await api.delete(`/stationery-items/${itemToDeleteId}`);
            if (response.status === 204) { // 204 No Content is common for successful DELETE
                showFlashMessage('Stationery Item deleted successfully!', 'success');
                fetchStationeryItems();
            } else {
                throw new Error(response.data?.message || 'Failed to delete stationery item.');
            }
        } catch (err) {
            console.error('Error deleting stationery item:', err);
            const errorMessage = err.response?.data?.message || 'Failed to delete stationery item.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setFormData({ itemName: '', price: '', status: 'active' });
        setEditingItemId(null);
        setLocalError(null);
    };

    // --- Search Filtering ---
    const filteredItems = useMemo(() => {
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        return stationeryItems.filter(item => {
            // Safely access properties and convert to string before toLowerCase()
            const itemName = item.itemName ? String(item.itemName).toLowerCase() : ''; 
            const price = item.price !== undefined && item.price !== null ? String(item.price).toLowerCase() : '';
            const status = item.status ? String(item.status).toLowerCase() : '';

            return (
                itemName.includes(lowercasedSearchTerm) ||
                price.includes(lowercasedSearchTerm) ||
                status.includes(lowercasedSearchTerm)
            );
        });
    }, [stationeryItems, searchTerm]);

    // --- Pagination Logic ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const goToPrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
    };

    // --- PDF Download Functionality ---
    const downloadPdf = () => {
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF !== 'function') {
            showFlashMessage('PDF generation libraries not fully loaded or accessible. Check console for details.', 'error');
            console.error("PDF generation failed: window.jspdf or window.jspdf.jsPDF is not available/callable. Ensure CDNs are correctly linked in public/index.html");
            return;
        }

        const doc = new window.jspdf.jsPDF('portrait'); // 'portrait' is default, can be 'landscape'
        
        if (typeof doc.autoTable !== 'function') {
            showFlashMessage('PDF Table plugin (jspdf-autotable) not loaded or accessible. Check console for details.', 'error');
            console.error("PDF generation failed: doc.autoTable is not a function. Ensure jspdf.plugin.autotable.min.js is correctly linked and loaded AFTER jspdf.umd.min.js.");
            return;
        }

        // Define company details for PDF header
        const companyName = "GOOD LUCK BOOK STORE";
        const companyAddress = "Shop NO. 2, Shriji Tower, Ashoka Garden, Bhopal";
        const companyMobile = "Mobile Number: 7024136476";
        const companyGST = "GST NO: 23EAVPP3772F1Z8";
        const companyLogoUrl = companyLogo; // Use the imported logo directly
        
        // Function to generate the main report content (title, line, table, save)
        // This function now accepts the dynamic startYPositionForTable as an argument
        const generateReportBody = (startYPositionForTable) => {
            // Add a professional report title (centered, below company info)
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 30); // Dark gray for title
            // Adjust Y position for the report title to be below company info
            doc.text("Stationery Item List Report", doc.internal.pageSize.width / 2, startYPositionForTable + 10, { align: 'center' }); 

            // Add a line separator below the main title
            doc.setLineWidth(0.5);
            doc.line(14, startYPositionForTable + 15, doc.internal.pageSize.width - 14, startYPositionForTable + 15); // Line spanning almost full width

            // Update startYPositionForTable for autoTable
            const tableStartY = startYPositionForTable + 20;


            // Define table columns explicitly. This is what should appear in the header.
            const tableColumn = ["S.No.", "Item Name", "Price (Rs.)"];
            const tableRows = [];

            filteredItems.forEach((item, index) => {
                // Ensure item.price is a valid number before formatting
                const formattedPrice = typeof item.price === 'number' && !isNaN(item.price)
                                        ? `Rs ${item.price.toFixed(2)}` 
                                        : 'N/A'; 

                // Explicitly convert all data points to string and trim any leading/trailing whitespace
                const itemData = [
                    String(index + 1), // S.No. (relative to filtered list, not current page)
                    String(item.itemName || '').trim(), // Changed item.name to item.itemName
                    formattedPrice, // Formatted Price
                    formatDateWithTime(item.createdAt), // Add Date
                    String(item.status || '').trim().charAt(0).toUpperCase() + String(item.status || '').trim().slice(1) // Status
                ];
                tableRows.push(itemData);
            });

            // Add the table to the document with professional styling
            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: tableStartY, // Use our dynamic start position
                theme: 'plain', // Changed to 'plain' for a cleaner look like the reference PDF
                styles: {
                    font: 'helvetica',
                    fontSize: 10,
                    cellPadding: 3,
                    textColor: [51, 51, 51], // Default text color for body
                    valign: 'middle',
                    halign: 'left'
                },
                headStyles: {
                    fillColor: [240, 240, 240], // Light gray header
                    textColor: [51, 51, 51], // Dark text for header
                    fontStyle: 'bold',
                    halign: 'center', // Center align header text
                    valign: 'middle', // Vertically align header text
                    lineWidth: 0.1, // Add a thin border to header cells
                    lineColor: [200, 200, 200] // Light gray border
                },
                bodyStyles: {
                    lineWidth: 0.1, // Add a thin border to body cells
                    lineColor: [200, 200, 200] // Light gray border
                },
                columnStyles: {
                    0: { cellWidth: 15, halign: 'center' }, 1: { cellWidth: 'auto', halign: 'left' },
                    2: { cellWidth: 'auto', halign: 'right' }, // Right align price column
                    3: { halign: 'center' }, 4: { halign: 'center' }
                },
                margin: { top: 10, right: 14, bottom: 10, left: 14 },
                didDrawPage: function (data) {
                    // Add footer on each page
                    doc.setFontSize(10);
                    doc.setTextColor(100); // Gray color for footer text
                    const pageCount = doc.internal.getNumberOfPages();
                    doc.text(`Page ${data.pageNumber} of ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
                }
            });
            doc.save(`Stationery_Item_List_${new Date().toLocaleDateString('en-CA').replace(/\//g, '-')}.pdf`);
            showFlashMessage('Stationery Item list downloaded as PDF!', 'success');
        };

        // 5. **Handle Logo Loading Asynchronously:**
        const img = new Image();
        img.crossOrigin = 'Anonymous'; // Important for CORS if using a different domain
        img.onload = () => {
            const logoX = 14; // Left margin for logo
            const logoY = 10; // Top margin for logo
            const imgWidth = 25; // Changed: Reduced logo width
            const imgHeight = (img.height * imgWidth) / img.width; // Maintain aspect ratio

            
            // Add the logo at the top-left
            doc.addImage(img, 'JPEG', logoX, logoY, imgWidth, imgHeight); 
            
            // Add company name and details next to logo
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 30);
            doc.text(companyName, logoX + imgWidth + 5, logoY + 5); // Company Name
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(50, 50, 50);
            doc.text(companyAddress, logoX + imgWidth + 5, logoY + 12); // Address
            doc.text(companyMobile, logoX + imgWidth + 5, logoY + 17); // Mobile
            doc.text(companyGST, logoX + imgWidth + 5, logoY + 22); // GST No.

            // Calculate startYPositionForTable based on logo and company info block
            const calculatedStartY = Math.max(logoY + imgHeight + 10, logoY + 22 + 10); // Ensure enough space
            generateReportBody(calculatedStartY); // Pass the calculated Y position
        };

        img.onerror = () => {
            console.warn("Logo image could not be loaded. Generating PDF without logo.");
            // If logo fails, add only company info block
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 30);
            doc.text(companyName, 14, 20); // Company Name
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(50, 50, 50);
            doc.text(companyAddress, 14, 27); // Address
            doc.text(companyMobile, 14, 32); // Mobile
            doc.text(companyGST, 14, 37); // GST No.
            
            const calculatedStartY = 45; // Adjust startY since no logo
            generateReportBody(calculatedStartY); // Pass the calculated Y position
        };

        img.src = companyLogoUrl; // This will now use the imported image data

        // Add generation date/time to the top right (this part can run immediately)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100); // Gray color for date text
        doc.text(`Date: ${formatDateWithTime(new Date())}`, doc.internal.pageSize.width - 14, 20, { align: 'right' });
    };

    // --- UI Rendering ---
    return (
        <div className="stationery-item-management-container">
            <h2 className="section-title">Stationery Item Management</h2>

            {localError && (
                <p className="error-message text-center">
                    <FaTimesCircle className="error-icon" /> {localError}
                </p>
            )}

            {/* Main content layout for two columns */}
            <div className="main-content-layout">
                {/* Stationery Item List Table */}
                {/* This is the first child, so it will appear on the left with flex-direction: row */}
                <div className="table-container"> {/* RENAMED from table-section to table-container */}
                    <h3 className="table-title">Existing Stationery Items</h3>

                    {/* Search and PDF Download Section */}
                    <div className="table-controls">
                        <div className="search-input-group">
                            <input
                                type="text"
                                placeholder="Search by Item Name..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1); // Reset to first page on search
                                }}
                                className="search-input"
                                disabled={loading}
                            />
                            <FaSearch className="search-icon" />
                        </div>
                        <button onClick={downloadPdf} className="btn btn-info download-pdf-btn" disabled={loading || filteredItems.length === 0}>
                            <FaFilePdf className="btn-icon-mr" /> Download PDF
                        </button>
                    </div>

                    {loading && stationeryItems.length === 0 ? (
                        <p className="loading-state text-center">
                            <FaSpinner className="animate-spin mr-2" /> Loading stationery items...
                        </p>
                    ) : filteredItems.length === 0 ? (
                        <p className="no-data-message text-center">No stationery items found matching your criteria. Start by adding one!</p>
                    ) : (
                        <div className="table-scroll-wrapper"> {/* RENAMED from table-container to table-scroll-wrapper */}
                            <table className="app-table"> {/* RENAMED from data-table to app-table */}
                                <thead>
                                    <tr>
                                        <th>S.No.</th>
                                        <th>Item Name</th>
                                        <th>Price</th>
                                        <th>Add Date</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody ref={tableBodyRef}>
                                    {currentItems.map((item, index) => (
                                        <tr key={item._id}>
                                            <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                            <td>{item.itemName}</td>
                                            <td>
                                                {typeof item.price === 'number' && !isNaN(item.price)
                                                    ? `Rs ${item.price.toFixed(2)}`
                                                    : 'N/A'
                                                }
                                            </td>
                                            <td>{formatDateWithTime(item.createdAt)}</td>
                                            <td>
                                                <span className={`status-badge ${item.status}`}>
                                                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="actions-column">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="action-icon-button edit-button"
                                                    title="Edit Stationery Item"
                                                    disabled={loading}
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => openConfirmModal(item)}
                                                    className="action-icon-button delete-button"
                                                    title="Delete Stationery Item"
                                                    disabled={loading}
                                                >
                                                    {loading && itemToDeleteId === item._id ? <FaSpinner className="animate-spin" /> : <FaTrashAlt />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="pagination-controls">
                                    <button onClick={goToPrevPage} disabled={currentPage === 1 || loading} className="btn btn-page">
                                        <FaChevronLeft className="btn-icon-mr" /> Previous
                                    </button>
                                    <span>Page {currentPage} of {totalPages}</span>
                                    <button onClick={goToNextPage} disabled={currentPage === totalPages || loading} className="btn btn-page">
                                        Next <FaChevronRight className="btn-icon-ml" />
                                    </button>
                                </div>
                            )}
                            <div className="total-records text-center mt-2">
                                Total Records: {filteredItems.length}
                            </div>
                        </div>
                    )}
                </div>

                {/* Stationery Item Creation/Update Form */}
                {/* This is the second child, so it will appear on the right with flex-direction: row */}
                <div className="form-container-card">
                    <form onSubmit={handleSubmit} className="app-form">
                        <h3 className="form-title">{editingItemId ? 'Edit Stationery Item' : 'Add New Stationery Item'}</h3>
                        
                        <div className="form-group">
                            <label htmlFor="itemName">Item's Name:</label>
                            <input
                                type="text"
                                id="itemName"
                                name="itemName"
                                value={formData.itemName}
                                onChange={handleChange}
                                placeholder="e.g., Pencil, Notebook, School Bag"
                                required
                                disabled={loading}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="price">Price (Rs):</label>
                            <input
                                type="number"
                                id="price"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="e.g., 10.00, 500.00"
                                min="0"
                                step="0.01" // Allow decimal values for price
                                required
                                disabled={loading}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="status">Status:</label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                disabled={loading}
                                className="form-select"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? <FaSpinner className="btn-icon-mr animate-spin" /> : (editingItemId ? 'Update Item' : 'Add Item')}
                            </button>
                            {editingItemId && (
                                <button
                                    type="button"
                                    className="btn btn-secondary ml-2"
                                    onClick={handleCancelEdit}
                                    disabled={loading}
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div> {/* End of main-content-layout */}

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to delete stationery item: <strong>{itemToDeleteName}</strong>?</p>
                        <div className="modal-actions">
                            <button onClick={confirmDelete} className="btn btn-danger" disabled={loading}>
                                {loading ? <FaSpinner className="btn-icon-mr animate-spin" /> : 'Delete'}
                            </button>
                            <button onClick={closeConfirmModal} className="btn btn-secondary" disabled={loading}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StationeryItemManagement;