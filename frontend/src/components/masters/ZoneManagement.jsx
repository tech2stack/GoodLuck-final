// src/components/masters/ZoneManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api';
import { FaEdit, FaTrashAlt, FaPlusCircle, FaSearch, FaFilePdf, FaChevronLeft, FaChevronRight, FaSpinner, FaTimesCircle } from 'react-icons/fa';

// Stylesheets
import '../../styles/Form.css';
import '../../styles/Table.css';
import '../../styles/Modal.css';

import companyLogo from '../../assets/glbs-logo.jpg';
import { addHeaderAndSetStartY, addReportTitle, addTableToDoc } from '../../utils/pdfTheme';

const ZoneManagement = ({ showFlashMessage }) => {
    const [zones, setZones] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        status: 'active',
    });
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState(null);
    const [editingZoneId, setEditingZoneId] = useState(null);
    // NEW: State to track the ID of the newly added zone for highlighting
    const [highlightedZoneId, setHighlightedZoneId] = useState(null);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [zoneToDeleteId, setZoneToDeleteId] = useState(null);
    const [zoneToDeleteName, setZoneToDeleteName] = useState('');

    const tableBodyRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

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
        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-US', options);
    };

    const fetchZones = useCallback(async () => {
        setLoading(true);
        setLocalError(null);
        try {
            const response = await api.get('/zones');
            if (response.data.status === 'success') {
                // ✅ Sort by latest createdAt first
                const sorted = response.data.data.zones.sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                );
                setZones(sorted);
                const totalPages = Math.ceil(sorted.length / itemsPerPage);
                if (currentPage > totalPages && totalPages > 0) {
                    setCurrentPage(totalPages);
                } else if (totalPages === 0) {
                    setCurrentPage(1);
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
    }, [currentPage, itemsPerPage]);

    useEffect(() => {
        fetchZones();
    }, [fetchZones]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setLocalError(null);

        if (!formData.name.trim()) {
            setLocalError('Zone name cannot be empty.');
            showFlashMessage('Zone name cannot be empty.', 'error');
            setLoading(false);
            return;
        }

        try {
            let response;
            if (editingZoneId) {
                // Update case
                response = await api.patch(`/zones/${editingZoneId}`, formData);
                if (response.data.status === 'success') {
                    showFlashMessage('Zone updated successfully!', 'success');
                } else {
                    throw new Error(response.data.message || 'Failed to update zone.');
                }
            } else {
                // Create case
                response = await api.post('/zones', formData);
                if (response.data.status === 'success') {
                    showFlashMessage('Zone created successfully!', 'success');
                    const newZone = response.data.data.zone;
                    setZones(prev => [newZone, ...prev]);
                    setHighlightedZoneId(newZone._id);
                    setCurrentPage(1); // Reset to page 1 to show the new entry
                } else {
                    throw new Error(response.data.message || 'Failed to create zone.');
                }
            }
            // NEW: Scroll to the top after submission for both create and update
            window.scrollTo({ top: 0, behavior: 'smooth' });

            setFormData({
                name: '',
                status: 'active',
            });
            setEditingZoneId(null);
            fetchZones();
        } catch (err) {
            console.error('Error saving zone:', err);
            const errorMessage = err.response?.data?.message || 'Failed to save zone. Please check your input and ensure zone name is unique.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (zoneItem) => {
        setFormData({
            name: zoneItem.name,
            status: zoneItem.status,
        });
        setEditingZoneId(zoneItem._id);
        setLocalError(null);
        // NEW: Clear highlight on edit
        setHighlightedZoneId(null);
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

    const handleCancelEdit = () => {
        setFormData({ name: '', status: 'active' });
        setEditingZoneId(null);
        setLocalError(null);
        // NEW: Clear highlight on cancel edit
        setHighlightedZoneId(null);
    };

    const filteredZones = zones.filter(zone =>
        zone.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentZones = filteredZones.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredZones.length / itemsPerPage);

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

    const downloadPdf = () => {
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF !== 'function') {
            showFlashMessage('PDF generation failed: Core libraries are not loaded. Please check your script links.', 'error');
            console.error("PDF generation failed: window.jspdf is not available. Ensure CDNs for jsPDF are correctly linked in your HTML file.");
            return;
        }

        const doc = new window.jspdf.jsPDF();

        let startY = addHeaderAndSetStartY(doc, companyLogo, 25, 22);
        startY = addReportTitle(doc, startY, "Zone List Report");

        const tableColumn = ["S.No.", "Zone Name", "Status"];
        const tableRows = filteredZones.map((zoneItem, index) => [
            index + 1,
            zoneItem.name,
            zoneItem.status.charAt(0).toUpperCase() + zoneItem.status.slice(1),
        ]);

        addTableToDoc(doc, tableColumn, tableRows, startY);

        doc.save(`Zone_List_${new Date().toLocaleDateString('en-CA').replace(/\//g, '-')}.pdf`);
        showFlashMessage('Zone list downloaded as PDF!', 'success');
    };

    return (
        <div className="zone-management-container">
            <h2 className="main-section-title">Zone Management</h2>

            {localError && (
                <p className="error-message text-center">{localError}</p>
            )}

            <div className="main-content-layout">
                <div className="form-container-card">
                    <form onSubmit={handleSubmit} className="app-form">
                        <h3 className="form-title">{editingZoneId ? 'Edit Zone' : 'Add Zone'}</h3>

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
                                {loading ? (editingZoneId ? 'Updating...' : 'Adding...') : (editingZoneId ? 'Update Zone' : 'Add Zone')}
                                <FaPlusCircle className="icon ml-2" />
                            </button>
                            {editingZoneId && (
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleCancelEdit}
                                    disabled={loading}
                                >
                                    <FaTimesCircle className="icon mr-2" /> Cancel Edit
                                </button>
                            )}
                        </div>
                    </form>
                </div>
                <div className="table-container">
                    <div className="table-controls">
                        <div className="search-input-group">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search by Zone Name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                                disabled={loading}
                            />
                        </div>
                        <button onClick={downloadPdf} className="download-pdf-btn" disabled={loading || filteredZones.length === 0}>
                            <FaFilePdf className="icon" /> Download PDF
                        </button>
                    </div>

                    {loading && zones.length === 0 ? (
                        <p className="loading-state text-center">
                            <FaSpinner className="animate-spin mr-2" /> Loading zones...
                        </p>
                    ) : (
                        <>
                            <table className="app-table">
                                <thead>
                                    <tr>
                                        <th>S.No.</th>
                                        <th>Zone Name</th>
                                        <th>Status</th>
                                        <th>Add Date</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody ref={tableBodyRef}>
                                    {filteredZones.length > 0 ? (
                                        currentZones.map((zoneItem, index) => (
                                            // NEW: Add highlight effect
                                            <tr key={zoneItem._id} className={zoneItem._id === highlightedZoneId ? 'animate-highlight' : ''}>
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
                                                        disabled={loading}
                                                    >
                                                        <FaEdit className="icon" />
                                                    </button>
                                                    <button
                                                        onClick={() => openConfirmModal(zoneItem)}
                                                        className="action-icon-button delete-button"
                                                        title="Delete Zone"
                                                        disabled={loading}
                                                    >
                                                        {loading && zoneToDeleteId === zoneItem._id ? <FaSpinner className="icon animate-spin" /> : <FaTrashAlt className="icon" />}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            {/* NEW: Show "No data" message but keep headers */}
                                            <td colSpan="5" className="no-data-message text-center">No zones found matching your criteria.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {totalPages > 1 && (
                                <div className="pagination-controls">
                                    <button onClick={goToPrevPage} disabled={currentPage === 1 || loading} className="btn-page">
                                        <FaChevronLeft className="icon" /> Previous
                                    </button>
                                    <span>Page {currentPage} of {totalPages}</span>
                                    <button onClick={goToNextPage} disabled={currentPage === totalPages || loading} className="btn-page">
                                        Next <FaChevronRight className="icon" />
                                    </button>
                                </div>
                            )}
                            <div className="total-records text-center mt-2">
                                Total Records: {filteredZones.length}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {showConfirmModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to delete zone: <strong>{zoneToDeleteName}</strong>?</p>
                        <div className="modal-actions">
                            <button onClick={confirmDelete} className="btn btn-danger" disabled={loading}>
                                {loading && zoneToDeleteId ? <FaSpinner className="icon animate-spin" /> : 'Delete'}
                            </button>
                            <button onClick={closeConfirmModal} className="btn btn-secondary" disabled={loading}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ZoneManagement;