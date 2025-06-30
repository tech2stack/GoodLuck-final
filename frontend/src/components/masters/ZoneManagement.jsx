// src/components/masters/ZoneManagement.jsx
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


const ZoneManagement = ({ showFlashMessage }) => {
    // State for managing list of zones
    const [zones, setZones] = useState([]);
    // State for form inputs (for creating new or editing existing zone)
    const [formData, setFormData] = useState({
        name: '',
        status: 'active', // Default status
    });
    // State for loading indicators
    const [loading, setLoading] = useState(false);
    // State for managing local errors (e.g., form validation)
    const [localError, setLocalError] = useState(null);
    // State to track if we are in edit mode and which zone is being edited
    const [editingZoneId, setEditingZoneId] = useState(null);

    // States for confirmation modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [zoneToDeleteId, setZoneToDeleteId] = useState(null);
    const [zoneToDeleteName, setZoneToDeleteName] = useState('');

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

    // --- Fetch Zones ---
    const fetchZones = useCallback(async (scrollToNew = false) => {
        setLoading(true);
        setLocalError(null);
        try {
            const response = await api.get('/zones'); // API endpoint to get all zones
            if (response.data.status === 'success') {
                setZones(response.data.data.zones);
                const totalPages = Math.ceil(response.data.data.zones.length / itemsPerPage);
                if (currentPage > totalPages && totalPages > 0) {
                    setCurrentPage(totalPages);
                } else if (totalPages === 0) {
                    setCurrentPage(1);
                }
                
                if (scrollToNew && tableBodyRef.current) {
                    setTimeout(() => {
                        const lastPageIndex = Math.ceil(response.data.data.zones.length / itemsPerPage);
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
                setLocalError(response.data.message || 'Failed to fetch zones.');
            }
        } catch (err) {
            console.error('Error fetching zones:', err);
            setLocalError(err.response?.data?.message || 'Failed to load zones due to network error.');
        } finally {
            setLoading(false);
        }
    }, [currentPage]);

    // Fetch zones on component mount
    useEffect(() => {
        fetchZones();
    }, [fetchZones]);

    // Debugging useEffect for PDF libraries (similar to ClassManagement)
    useEffect(() => {
        console.log("PDF Libraries Check (ZoneManagement):");
        console.log("window.jspdf (global object):", typeof window.jspdf);
        console.log("window.jspdf.jsPDF (constructor):", typeof window.jspdf?.jsPDF);
    }, []);


    // --- Form Handling ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setLocalError(null);

        try {
            let response;
            if (editingZoneId) {
                // Update existing zone
                response = await api.patch(`/zones/${editingZoneId}`, formData);
                if (response.data.status === 'success') {
                    showFlashMessage('Zone updated successfully!', 'success');
                } else {
                    throw new Error(response.data.message || 'Failed to update zone.');
                }
            } else {
                // Create new zone
                response = await api.post('/zones', formData);
                if (response.data.status === 'success') {
                    showFlashMessage('Zone created successfully!', 'success');
                } else {
                    throw new Error(response.data.message || 'Failed to create zone.');
                }
            }
            setFormData({ name: '', status: 'active' });
            setEditingZoneId(null);
            fetchZones(true); // Re-fetch and indicate to scroll
        } catch (err) {
            console.error('Error saving zone:', err);
            const errorMessage = err.response?.data?.message || 'Failed to save zone. Please check your input and ensure zone name is unique.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Edit and Delete Operations ---
    const handleEdit = (zoneItem) => {
        setFormData({ name: zoneItem.name, status: zoneItem.status });
        setEditingZoneId(zoneItem._id);
        setLocalError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const openConfirmModal = (zoneItem) => {
        setZoneToDeleteId(zoneItem._id);
        setZoneToDeleteName(zoneItem.name);
        setShowConfirmModal(true);
    };

    const closeConfirmModal = () => {
        setShowConfirmModal(false);
        setZoneToDeleteId(null);
        setZoneToDeleteName('');
    };

    const confirmDelete = async () => {
        setLoading(true);
        setLocalError(null);
        closeConfirmModal();

        try {
            const response = await api.delete(`/zones/${zoneToDeleteId}`);
            if (response.status === 204) {
                showFlashMessage('Zone deleted successfully!', 'success');
                fetchZones();
            } else {
                throw new Error(response.data?.message || 'Failed to delete zone.');
            }
        } catch (err) {
            console.error('Error deleting zone:', err);
            const errorMessage = err.response?.data?.message || 'Failed to delete zone.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Search Filtering ---
    const filteredZones = zones.filter(zoneItem =>
        zoneItem.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- Pagination Logic ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentZones = filteredZones.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredZones.length / itemsPerPage);

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

        const doc = new window.jspdf.jsPDF();
        
        if (typeof doc.autoTable !== 'function') {
            showFlashMessage('PDF Table plugin (jspdf-autotable) not loaded or accessible. Check console for details.', 'error');
            console.error("PDF generation failed: doc.autoTable is not a function. Ensure jspdf.plugin.autotable.min.js is correctly linked and loaded AFTER jspdf.umd.min.js.");
            return;
        }

        doc.text("Zone List", 14, 15);

        const tableColumn = ["S.No.", "Zone Name", "Status", "Add Date"];
        const tableRows = [];

        filteredZones.forEach((zoneItem, index) => {
            const zoneData = [
                index + 1,
                zoneItem.name,
                zoneItem.status.charAt(0).toUpperCase() + zoneItem.status.slice(1),
                formatDateWithTime(zoneItem.createdAt)
            ];
            tableRows.push(zoneData);
        });

        doc.autoTable(tableColumn, tableRows, { startY: 20 });
        doc.save(`Zone_List_${new Date().toLocaleDateString()}.pdf`);
        showFlashMessage('Zone list downloaded as PDF!', 'success');
    };

    // --- UI Rendering ---
    return (
        <div className="zone-management-container">
            <h2 className="section-title">Zone Management</h2>

            {localError && (
                <p className="error-message text-center">{localError}</p>
            )}

            {/* Zone Creation/Update Form */}
            <div className="form-container-card">
                <form onSubmit={handleSubmit} className="app-form">
                    <h3 className="form-title">{editingZoneId ? 'Edit Zone' : 'Create New Zone'}</h3>
                    
                    <div className="form-group">
                        <label htmlFor="name">Zone Name:</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g., North Zone, South Zone"
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
                            {loading ? (editingZoneId ? 'Updating...' : 'Creating...') : (editingZoneId ? 'Update Zone' : 'Create Zone')}
                            <FaPlusCircle className="ml-2" />
                        </button>
                        {editingZoneId && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                    setEditingZoneId(null);
                                    setFormData({ name: '', status: 'active' });
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

            {/* Zone List Table */}
            <div className="table-container">
                <h3 className="table-title">Existing Zones</h3>

                {/* Search and PDF Download Section */}
                <div className="table-controls">
                    <div className="search-input-group">
                        <input
                            type="text"
                            placeholder="Search by Zone Name..."
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

                {loading && zones.length === 0 ? (
                    <p className="loading-state">Loading zones...</p>
                ) : filteredZones.length === 0 ? (
                    <p className="no-data-message">No zones found matching your criteria. Start by creating one!</p>
                ) : (
                    <>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>S.No.</th>
                                    <th>Zone Name</th>
                                    <th>Status</th>
                                    <th>Add Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody ref={tableBodyRef}>
                                {currentZones.map((zoneItem, index) => (
                                    <tr key={zoneItem._id}>
                                        <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                        <td>{zoneItem.name}</td>
                                        <td>
                                            <span className={`status-badge ${zoneItem.status}`}>
                                                {zoneItem.status.charAt(0).toUpperCase() + zoneItem.status.slice(1)}
                                            </span>
                                        </td>
                                        <td>{formatDateWithTime(zoneItem.createdAt)}</td>
                                        <td className="actions-column">
                                            <button
                                                onClick={() => handleEdit(zoneItem)}
                                                className="action-icon-button edit-button"
                                                title="Edit Zone"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => openConfirmModal(zoneItem)}
                                                className="action-icon-button delete-button"
                                                title="Delete Zone"
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
                                <button onClick={goToPrevPage} disabled={currentPage === 1} className="btn btn-page">
                                    <FaChevronLeft /> Previous
                                </button>
                                <span>Page {currentPage} of {totalPages}</span>
                                <button onClick={goToNextPage} disabled={currentPage === totalPages} className="btn btn-page">
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
                        <p>Are you sure you want to delete zone: <strong>{zoneToDeleteName}</strong>?</p>
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

export default ZoneManagement;
