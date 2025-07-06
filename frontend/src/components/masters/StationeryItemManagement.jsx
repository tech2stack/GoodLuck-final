// src/components/masters/StationeryItemManagement.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '../../utils/api'; // API utility for backend calls
import { FaEdit, FaTrashAlt, FaPlusCircle, FaSearch, FaFilePdf, FaChevronLeft, FaChevronRight, FaSpinner, FaTimesCircle } from 'react-icons/fa'; // Icons for UI

// Stylesheets (assuming these are already present and styled for consistency)
import '../../styles/Form.css';
import '../../styles/Table.css';
import '../../styles/Modal.css';

// NOTE: jsPDF and jspdf-autotable are expected to be loaded globally via CDN in public/index.html
// If you are using npm, you'd do: npm install jspdf jspdf-autotable
// Then import them here:
// import { jsPDF } from 'jspdf';
// import 'jspdf-autotable';


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
        // Changed formData.name to formData.itemName
        if (!formData.itemName || formData.price === '' || formData.price === null || isNaN(formData.price)) {
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

    // --- Search Filtering ---
    const filteredItems = useMemo(() => {
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        return stationeryItems.filter(item => {
            // Safely access properties and convert to string before toLowerCase()
            // Changed item.name to item.itemName
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

    // const paginate = (pageNumber) => setCurrentPage(pageNumber); // This function is not used directly in buttons, but good to keep

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

        doc.text("Stationery Item List", 14, 15);

        // Define table columns explicitly. This is what should appear in the header.
        const tableColumn = ["S.No.", "Item Name", "Price (Rs.)", "Add Date", "Status"];
        const tableRows = [];

        filteredItems.forEach((item, index) => {
            // Ensure item.price is a valid number before formatting
            const formattedPrice = typeof item.price === 'number' && !isNaN(item.price)
                                   ? `Rs. ${item.price.toFixed(2)}` 
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

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 20,
            theme: 'grid',
            styles: {
                font: 'helvetica',
                fontSize: 9,
                cellPadding: 2,
                overflow: 'linebreak',
                halign: 'left',
                valign: 'middle'
            },
            headStyles: {
                fillColor: [230, 230, 230],
                textColor: [0, 0, 0],
                fontStyle: 'bold'
            },
            didDrawPage: function (data) {
                let str = "Page " + doc.internal.getNumberOfPages();
                doc.setFontSize(8);
                doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });
        
        doc.save(`Stationery_Item_List_${new Date().toLocaleDateString()}.pdf`);
        showFlashMessage('Stationery Item list downloaded as PDF!', 'success');
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

            {/* Stationery Item Creation/Update Form */}
            <div className="form-container-card">
                <form onSubmit={handleSubmit} className="app-form">
                    <h3 className="form-title">{editingItemId ? 'Edit Stationery Item' : 'Add New Stationery Item'}</h3>
                    
                    <div className="form-group">
                        <label htmlFor="itemName">Item's Name:</label> {/* Changed htmlFor to itemName */}
                        <input
                            type="text"
                            id="itemName" // Changed id to itemName
                            name="itemName" // Changed name to itemName
                            value={formData.itemName} // Changed formData.name to formData.itemName
                            onChange={handleChange}
                            placeholder="e.g., Pencil, Notebook, School Bag"
                            required
                            disabled={loading}
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="price">Price (₹):</label>
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
                                onClick={() => {
                                    setEditingItemId(null);
                                    setFormData({ itemName: '', price: '', status: 'active' }); // Changed name to itemName
                                    setLocalError(null);
                                }}
                                disabled={loading}
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Stationery Item List Table */}
            <div className="table-container">
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
                    <>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>S.No.</th>
                                    <th>Item Name</th> {/* Changed from Name to Item Name */}
                                    <th>Price</th>
                                    <th>Add Date</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody ref={tableBodyRef}>
                                {currentItems.map((item, index) => (
                                    // Removed potential whitespace causing hydration error
                                    <tr key={item._id}>
                                        <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                        <td>{item.itemName}</td> {/* Changed item.name to item.itemName */}
                                        <td>
                                            {typeof item.price === 'number' && !isNaN(item.price)
                                                ? `₹ ${item.price.toFixed(2)}`
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
                    </>
                )}
            </div>

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
