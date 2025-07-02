// src/components/masters/TransportManagement.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api'; // Assuming this is your configured axios instance
import { FaEdit, FaTrashAlt, FaPlusCircle, FaSearch, FaFilePdf, FaChevronLeft, FaChevronRight } from 'react-icons/fa'; // Icons

// Import your existing CSS files for consistency
import '../../styles/Form.css';
import '../../styles/Table.css';
import '../../styles/Modal.css';

// Ensure jsPDF and jspdf-autotable are loaded globally via CDN in public/index.html
// If using npm, remember to install them: npm install jspdf jspdf-autotable

const TransportManagement = ({ showFlashMessage }) => {
    // Base URL for backend, used for PDF export if needed
    const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

    // State for managing list of transports
    const [transports, setTransports] = useState([]);
    // State for form inputs
    const [formData, setFormData] = useState({
        transportName: '',
        person: '',
        mobile: '',
        address: '',
        status: 'active', // Default status
    });
    // State for loading indicators
    const [loading, setLoading] = useState(false);
    // State for managing local errors (e.g., form validation)
    const [localError, setLocalError] = useState(null);
    // State to track if we are in edit mode and which transport is being edited
    const [editingTransportId, setEditingTransportId] = useState(null);

    // States for confirmation modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [transportToDeleteId, setTransportToDeleteId] = useState(null);
    const [transportToDeleteName, setTransportToDeleteName] = useState('');

    // Ref for scrolling to the new item in the table (if needed)
    const tableBodyRef = useRef(null);

    // States for Search
    const [searchTerm, setSearchTerm] = useState('');

    // States for Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10); // Default items per page
    const [totalTransportsCount, setTotalTransportsCount] = useState(0); // Total count from API

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

    // --- Helper function to safely get string value or 'N/A' ---
    const getStringValue = (field) => field ? String(field).trim() : 'N/A';

    // --- Fetch Transports ---
    const fetchTransports = useCallback(async (scrollToNew = false) => {
        setLoading(true);
        setLocalError(null);
        try {
            const queryParams = new URLSearchParams();
            if (searchTerm) {
                queryParams.append('search', searchTerm); // Assuming backend handles a 'search' parameter
            }
            // Add pagination parameters for backend API
            queryParams.append('page', currentPage);
            queryParams.append('limit', itemsPerPage);

            const response = await api.get(`/transports?${queryParams.toString()}`);
            console.log('API Response for transports:', response.data);

            if (response.data.status === 'success' && Array.isArray(response.data.data.transports)) {
                setTransports(response.data.data.transports);
                setTotalTransportsCount(response.data.totalCount || 0); // Update total count from API
                console.log('Transports fetched and set to state:', response.data.data.transports);

                // Adjust current page if it's out of bounds after a filter/delete
                const totalPagesCalculated = Math.ceil((response.data.totalCount || 0) / itemsPerPage);
                if (currentPage > totalPagesCalculated && totalPagesCalculated > 0) {
                    setCurrentPage(totalPagesCalculated);
                } else if (response.data.totalCount === 0) {
                    setCurrentPage(1);
                }

                if (scrollToNew && tableBodyRef.current) {
                    // Scroll to the last item if a new one was added and it's on the current page
                    setTimeout(() => {
                        if (tableBodyRef.current.lastElementChild) {
                            tableBodyRef.current.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
                        } else {
                            tableBodyRef.current.scrollTop = tableBodyRef.current.scrollHeight;
                        }
                    }, 50);
                }
            } else {
                setLocalError(response.data.message || 'Failed to fetch transports due to unexpected response structure.');
            }
        } catch (err) {
            console.error('Error fetching transports:', err);
            setLocalError(err.response?.data?.message || 'Failed to load transports due to network error.');
        } finally {
            setLoading(false);
        }
    }, [searchTerm, currentPage, itemsPerPage]); // Dependencies for useCallback

    // Effect to fetch transports on component mount and when dependencies change
    useEffect(() => {
        fetchTransports();
    }, [fetchTransports]);

    // --- Form Handling ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setLocalError(null);

        // Basic validation for required fields
        if (!formData.transportName || !formData.person || !formData.mobile || !formData.address) {
            setLocalError('Please fill in all required fields: Transport Name, Person, Mobile, Address.');
            showFlashMessage('Please fill in all required fields.', 'error');
            setLoading(false);
            return;
        }

        try {
            let response;
            if (editingTransportId) {
                // Update existing transport
                response = await api.patch(`/transports/${editingTransportId}`, formData);
                if (response.data.status === 'success') {
                    showFlashMessage('Transport updated successfully!', 'success');
                } else {
                    throw new Error(response.data.message || 'Failed to update transport.');
                }
            } else {
                // Create new transport
                response = await api.post('/transports', formData);
                if (response.data.status === 'success') {
                    showFlashMessage('Transport created successfully!', 'success');
                } else {
                    throw new Error(response.data.message || 'Failed to create transport.');
                }
            }
            console.log('Transport saved successfully. Response:', response.data);

            // Reset form and re-fetch transports
            setFormData({
                transportName: '',
                person: '',
                mobile: '',
                address: '',
                status: 'active',
            });
            setEditingTransportId(null);
            fetchTransports(true); // Re-fetch and indicate to scroll
        } catch (err) {
            console.error('Error saving transport:', err);
            const errorMessage = err.response?.data?.message || 'Failed to save transport. Please check your input and ensure unique fields (Transport Name, Mobile) are not duplicated.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Edit and Delete Operations ---
    const handleEdit = (transportItem) => {
        setFormData({
            transportName: transportItem.transportName || '',
            person: transportItem.person || '',
            mobile: transportItem.mobile || '',
            address: transportItem.address || '',
            status: transportItem.status || 'active',
        });
        setEditingTransportId(transportItem._id);
        setLocalError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to form
    };

    const openConfirmModal = (transportItem) => {
        setTransportToDeleteId(transportItem._id);
        setTransportToDeleteName(transportItem.transportName);
        setShowConfirmModal(true);
    };

    const closeConfirmModal = () => {
        setShowConfirmModal(false);
        setTransportToDeleteId(null);
        setTransportToDeleteName('');
    };

    const confirmDelete = async () => {
        setLoading(true);
        setLocalError(null);
        closeConfirmModal();

        try {
            const response = await api.delete(`/transports/${transportToDeleteId}`);
            if (response.status === 204) {
                showFlashMessage('Transport deleted successfully!', 'success');
                fetchTransports(); // Re-fetch transports after deletion
            } else {
                throw new Error(response.data?.message || 'Failed to delete transport.');
            }
        } catch (err) {
            console.error('Error deleting transport:', err);
            const errorMessage = err.response?.data?.message || 'Failed to delete transport.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Pagination Logic ---
    const totalPages = Math.ceil(totalTransportsCount / itemsPerPage);

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

        const doc = new window.jspdf.jsPDF('landscape');
        
        if (typeof doc.autoTable !== 'function') {
            showFlashMessage('PDF Table plugin (jspdf-autotable) not loaded or accessible. Check console for details.', 'error');
            console.error("PDF generation failed: doc.autoTable is not a function. Ensure jspdf.plugin.autotable.min.js is correctly linked and loaded AFTER jspdf.umd.min.js.");
            return;
        }

        doc.text("Transport List", 14, 15);

        const tableColumn = [
            "S.No.", "Transport Name", "Person", "Mobile", "Address", "Add Date", "Status"
        ];
        const tableRows = [];

        transports.forEach((transport, index) => {
            const transportData = [
                String(index + 1),
                getStringValue(transport.transportName),
                getStringValue(transport.person),
                getStringValue(transport.mobile),
                getStringValue(transport.address),
                formatDateWithTime(transport.createdAt),
                getStringValue(transport.status).charAt(0).toUpperCase() + getStringValue(transport.status).slice(1)
            ];
            tableRows.push(transportData);
        });

        doc.autoTable(tableColumn, tableRows, { startY: 20 });
        doc.save(`Transport_List_${new Date().toLocaleDateString()}.pdf`);
        showFlashMessage('Transport list downloaded as PDF!', 'success');
    };

    // --- UI Rendering ---
    return (
        <div className="transport-management-container">
            <h2 className="section-title">Transport Management</h2>

            {localError && (
                <p className="error-message text-center">{localError}</p>
            )}

            {/* Transport Creation/Update Form */}
            <div className="form-container-card">
                <form onSubmit={handleSubmit} className="app-form">
                    <h3 className="form-title">{editingTransportId ? 'Edit Transport' : 'Add New Transport'}</h3>
                    
                    <div className="form-group">
                        <label htmlFor="transportName">Transport Name:</label>
                        <input
                            type="text"
                            id="transportName"
                            name="transportName"
                            value={formData.transportName}
                            onChange={handleChange}
                            placeholder="e.g., ABC Transports"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="person">Person:</label>
                        <input
                            type="text"
                            id="person"
                            name="person"
                            value={formData.person}
                            onChange={handleChange}
                            placeholder="e.g., John Doe"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="mobile">Mobile:</label>
                        <input
                            type="text"
                            id="mobile"
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleChange}
                            placeholder="e.g., 9876543210"
                            required
                            disabled={loading}
                            maxLength="10"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="address">Address:</label>
                        <textarea
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Full address of the transport"
                            rows="3"
                            required
                            disabled={loading}
                        ></textarea>
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
                            {loading ? (editingTransportId ? 'Updating...' : 'Adding...') : (editingTransportId ? 'Update Transport' : 'Add Transport')}
                            <FaPlusCircle className="ml-2" />
                        </button>
                        {editingTransportId && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                    setEditingTransportId(null);
                                    setFormData({
                                        transportName: '', person: '', mobile: '', address: '', status: 'active'
                                    });
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

            {/* Transport List Table */}
            <div className="table-container">
                <h3 className="table-title">Existing Transports</h3>

                {/* Search and PDF Download Section */}
                <div className="table-controls">
                    <div className="search-input-group">
                        <input
                            type="text"
                            placeholder="Search by Name, Mobile, Address..."
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

                {loading && transports.length === 0 ? (
                    <p className="loading-state">Loading transports...</p>
                ) : transports.length === 0 ? (
                    <p className="no-data-message">No transports found matching your criteria. Start by adding one!</p>
                ) : (
                    <>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>S.No.</th>
                                    <th>Transport Name</th>
                                    <th>Person</th>
                                    <th>Mobile</th>
                                    <th>Address</th>
                                    <th>Add Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody ref={tableBodyRef}>
                                {transports.map((transport, index) => (
                                    <tr key={transport._id}>
                                        <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                        <td>{getStringValue(transport.transportName)}</td>
                                        <td>{getStringValue(transport.person)}</td>
                                        <td>{getStringValue(transport.mobile)}</td>
                                        <td>{getStringValue(transport.address)}</td>
                                        <td>{formatDateWithTime(transport.createdAt)}</td>
                                        <td>
                                            <span className={`status-badge ${getStringValue(transport.status).toLowerCase()}`}>
                                                {getStringValue(transport.status).charAt(0).toUpperCase() + getStringValue(transport.status).slice(1)}
                                            </span>
                                        </td>
                                        <td className="actions-column">
                                            <button
                                                onClick={() => handleEdit(transport)}
                                                className="action-icon-button edit-button"
                                                title="Edit Transport"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => openConfirmModal(transport)}
                                                className="action-icon-button delete-button"
                                                title="Delete Transport"
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
                                {/* Page Size Dropdown */}
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
                                <span className="total-records">Total Records: {totalTransportsCount}</span>
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
                        <p>Are you sure you want to delete transport: <strong>{transportToDeleteName}</strong>?</p>
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

export default TransportManagement;
