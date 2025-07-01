// src/components/masters/StationeryItemManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api'; // API utility for backend calls
import { FaEdit, FaTrashAlt, FaPlusCircle, FaSearch, FaFilePdf, FaChevronLeft, FaChevronRight } from 'react-icons/fa'; // Icons for UI

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
        name: '',
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
    const [itemToDeleteName, setItemToDeleteName] = useState(''); // Corrected initialization

    // Ref for scrolling to the new item in the table (if needed)
    const tableBodyRef = useRef(null);

    // States for Search
    const [searchTerm, setSearchTerm] = useState('');

    // States for Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Show 10 entries per page


    // --- Helper function for date formatting ---
    const formatDateWithTime = (dateString) => {
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
    }, [currentPage, itemsPerPage]);

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
        if (!formData.name || formData.price === '' || formData.price === null || isNaN(formData.price)) {
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
                name: formData.name,
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
            setFormData({ name: '', price: '', status: 'active' });
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
        setFormData({ name: item.name, price: item.price, status: item.status });
        setEditingItemId(item._id);
        setLocalError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to form
    };

    const openConfirmModal = (item) => {
        setItemToDeleteId(item._id);
        setItemToDeleteName(item.name);
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
        closeConfirmModal();

        try {
            const response = await api.delete(`/stationery-items/${itemToDeleteId}`);
            if (response.status === 204) {
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
    const filteredItems = stationeryItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- Pagination Logic ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
        // Changed "Price (₹)" to "Price (Rs.)" for better compatibility
        const tableColumn = ["S.No.", "Item Name", "Price (Rs.)", "Add Date", "Status"];
        const tableRows = [];

        filteredItems.forEach((item, index) => {
            // Ensure item.price is a valid number before formatting
            const formattedPrice = typeof item.price === 'number' && !isNaN(item.price)
                                   ? `Rs. ${item.price.toFixed(2)}` // Changed ₹ to Rs.
                                   : 'N/A'; // Display 'N/A' if price is not a valid number

            // Explicitly convert all data points to string and trim any leading/trailing whitespace
            // This helps prevent unexpected characters or newlines from appearing in PDF cells.
            const itemData = [
                String((currentPage - 1) * itemsPerPage + index + 1), // S.No.
                String(item.name || '').trim(), // Item Name
                formattedPrice, // Formatted Price
                formatDateWithTime(item.createdAt), // Add Date
                String(item.status || '').trim().charAt(0).toUpperCase() + String(item.status || '').trim().slice(1) // Status
            ];
            tableRows.push(itemData);
        });

        // Debugging: Log the exact columns and rows being passed to autoTable
        console.log("PDF Table Columns for autoTable:", tableColumn);
        console.log("PDF Table Rows for autoTable (first 5 rows):", tableRows.slice(0, 5));
        console.log("If 'Price (1)' appears in the PDF header despite 'Price (Rs.)' in console, clear browser cache (Ctrl+Shift+R or Cmd+Shift+R) and restart frontend server.");


        doc.autoTable(tableColumn, tableRows, { startY: 20 });
        doc.save(`Stationery_Item_List_${new Date().toLocaleDateString()}.pdf`);
        showFlashMessage('Stationery Item list downloaded as PDF!', 'success');
    };

    // --- UI Rendering ---
    return (
        <div className="stationery-item-management-container">
            <h2 className="section-title">Stationery Item Management</h2>

            {localError && (
                <p className="error-message text-center">{localError}</p>
            )}

            {/* Stationery Item Creation/Update Form */}
            <div className="form-container-card">
                <form onSubmit={handleSubmit} className="app-form">
                    <h3 className="form-title">{editingItemId ? 'Edit Stationery Item' : 'Add New Stationery Item'}</h3>
                    
                    <div className="form-group">
                        <label htmlFor="name">Item's Name:</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g., Pencil, Notebook, School Bag"
                            required
                            disabled={loading}
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
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? (editingItemId ? 'Updating...' : 'Adding...') : (editingItemId ? 'Update Item' : 'Add Item')}
                            <FaPlusCircle className="ml-2" />
                        </button>
                        {editingItemId && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                    setEditingItemId(null);
                                    setFormData({ name: '', price: '', status: 'active' });
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
                <h3 className="table-title">Stationery Items Management</h3>

                {/* Search and PDF Download Section */}
                <div className="table-controls">
                    <div className="search-input-group">
                        <input
                            type="text"
                            placeholder="Search by Item Name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        <FaSearch className="search-icon" />
                    </div>
                    <button onClick={downloadPdf} className="btn btn-info download-pdf-btn">
                        <FaFilePdf className="mr-2" /> Download PDF
                    </button>
                </div>

                {loading && stationeryItems.length === 0 ? (
                    <p className="loading-state">Loading stationery items...</p>
                ) : filteredItems.length === 0 ? (
                    <p className="no-data-message">No stationery items found matching your criteria. Start by adding one!</p>
                ) : (
                    <>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>S.No.</th>
                                    <th>Name</th>
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
                                        <td>{item.name}</td>
                                        <td>
                                            {typeof item.price === 'number' && !isNaN(item.price)
                                                ? `₹ ${item.price.toFixed(2)}`
                                                : 'N/A'
                                            }
                                        </td> {/* Display price formatted */}
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
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => openConfirmModal(item)}
                                                className="action-icon-button delete-button"
                                                title="Delete Stationery Item"
                                            >
                                                <FaTrashAlt />
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
                                    <FaChevronLeft /> Previous
                                </button>
                                <span>Page {currentPage} of {totalPages}</span>
                                <button onClick={goToNextPage} disabled={currentPage === totalPages || loading} className="btn btn-page">
                                    Next <FaChevronRight />
                                </button>
                            </div>
                        )}
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
                            <button onClick={confirmDelete} className="btn btn-danger" disabled={loading}>Delete</button>
                            <button onClick={closeConfirmModal} className="btn btn-secondary" disabled={loading}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StationeryItemManagement;
