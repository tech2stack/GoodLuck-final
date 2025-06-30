// src/components/masters/CityManagement.jsx
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


const CityManagement = ({ showFlashMessage }) => {
    // State for managing list of cities
    const [cities, setCities] = useState([]);
    // State for managing list of zones for the dropdown
    const [zones, setZones] = useState([]);
    // State for form inputs (for creating new or editing existing city)
    const [formData, setFormData] = useState({
        name: '',
        zone: '', // Will store Zone ID
        status: 'active', // Default status
    });
    // State for loading indicators
    const [loading, setLoading] = useState(false);
    // State for managing local errors (e.g., form validation)
    const [localError, setLocalError] = useState(null);
    // State to track if we are in edit mode and which city is being edited
    const [editingCityId, setEditingCityId] = useState(null);

    // States for confirmation modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [cityToDeleteId, setCityToDeleteId] = useState(null);
    const [cityToDeleteName, setCityToDeleteName] = useState('');

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

    // --- Fetch Cities ---
    const fetchCities = useCallback(async (scrollToNew = false) => {
        setLoading(true);
        setLocalError(null);
        try {
            const response = await api.get('/cities'); // API endpoint to get all cities
            if (response.data.status === 'success') {
                setCities(response.data.data.cities);
                const totalPages = Math.ceil(response.data.data.cities.length / itemsPerPage);
                if (currentPage > totalPages && totalPages > 0) {
                    setCurrentPage(totalPages);
                } else if (totalPages === 0) {
                    setCurrentPage(1);
                }
                
                if (scrollToNew && tableBodyRef.current) {
                    setTimeout(() => {
                        const lastPageIndex = Math.ceil(response.data.data.cities.length / itemsPerPage);
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
                setLocalError(response.data.message || 'Failed to fetch cities.');
            }
        } catch (err) {
            console.error('Error fetching cities:', err);
            setLocalError(err.response?.data?.message || 'Failed to load cities due to network error.');
        } finally {
            setLoading(false);
        }
    }, [currentPage]);

    // --- Fetch Zones for Dropdown ---
    const fetchZonesForDropdown = useCallback(async () => {
        try {
            const response = await api.get('/zones'); // API endpoint to get all zones
            if (response.data.status === 'success') {
                setZones(response.data.data.zones);
                // If creating a new city and no zone is pre-selected, set the first one as default
                if (!editingCityId && response.data.data.zones.length > 0) {
                    setFormData(prev => ({ ...prev, zone: response.data.data.zones[0]._id }));
                }
            } else {
                console.error('Failed to fetch zones for dropdown:', response.data.message);
                showFlashMessage('Failed to load zones for dropdown.', 'error');
            }
        } catch (err) {
            console.error('Error fetching zones for dropdown:', err);
            showFlashMessage('Network error fetching zones for dropdown.', 'error');
        }
    }, [editingCityId, showFlashMessage]); // Include editingCityId in dependencies

    // Fetch cities and zones on component mount
    useEffect(() => {
        fetchCities();
        fetchZonesForDropdown();
    }, [fetchCities, fetchZonesForDropdown]);

    // Debugging useEffect for PDF libraries (similar to ClassManagement)
    useEffect(() => {
        console.log("PDF Libraries Check (CityManagement):");
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

        // Basic validation for zone selection
        if (!formData.zone) {
            setLocalError('Please select a Zone.');
            showFlashMessage('Please select a Zone.', 'error');
            setLoading(false);
            return;
        }

        try {
            let response;
            if (editingCityId) {
                // Update existing city
                response = await api.patch(`/cities/${editingCityId}`, formData);
                if (response.data.status === 'success') {
                    showFlashMessage('City updated successfully!', 'success');
                } else {
                    throw new Error(response.data.message || 'Failed to update city.');
                }
            } else {
                // Create new city
                response = await api.post('/cities', formData);
                if (response.data.status === 'success') {
                    showFlashMessage('City created successfully!', 'success');
                } else {
                    throw new Error(response.data.message || 'Failed to create city.');
                }
            }
            setFormData({ name: '', zone: zones.length > 0 ? zones[0]._id : '', status: 'active' }); // Reset zone to first available
            setEditingCityId(null);
            fetchCities(true); // Re-fetch and indicate to scroll
        } catch (err) {
            console.error('Error saving city:', err);
            const errorMessage = err.response?.data?.message || 'Failed to save city. Please check your input and ensure city name is unique.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Edit and Delete Operations ---
    const handleEdit = (cityItem) => {
        setFormData({ name: cityItem.name, zone: cityItem.zone._id, status: cityItem.status }); // Set zone ID for dropdown
        setEditingCityId(cityItem._id);
        setLocalError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const openConfirmModal = (cityItem) => {
        setCityToDeleteId(cityItem._id);
        setCityToDeleteName(cityItem.name);
        setShowConfirmModal(true);
    };

    const closeConfirmModal = () => {
        setShowConfirmModal(false);
        setCityToDeleteId(null);
        setCityToDeleteName('');
    };

    const confirmDelete = async () => {
        setLoading(true);
        setLocalError(null);
        closeConfirmModal();

        try {
            const response = await api.delete(`/cities/${cityToDeleteId}`);
            if (response.status === 204) {
                showFlashMessage('City deleted successfully!', 'success');
                fetchCities();
            } else {
                throw new Error(response.data?.message || 'Failed to delete city.');
            }
        } catch (err) {
            console.error('Error deleting city:', err);
            const errorMessage = err.response?.data?.message || 'Failed to delete city.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Search Filtering ---
    const filteredCities = cities.filter(cityItem =>
        cityItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cityItem.zone.name.toLowerCase().includes(searchTerm.toLowerCase()) // Search by zone name too
    );

    // --- Pagination Logic ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCities = filteredCities.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredCities.length / itemsPerPage);

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

        doc.text("City List", 14, 15);

        const tableColumn = ["S.No.", "City Name", "Zone", "Add Date", "Status"];
        const tableRows = [];

        filteredCities.forEach((cityItem, index) => {
            const cityData = [
                index + 1,
                cityItem.name,
                cityItem.zone ? cityItem.zone.name : 'N/A', // Display zone name
                formatDateWithTime(cityItem.createdAt),
                cityItem.status.charAt(0).toUpperCase() + cityItem.status.slice(1)
            ];
            tableRows.push(cityData);
        });

        doc.autoTable(tableColumn, tableRows, { startY: 20 });
        doc.save(`City_List_${new Date().toLocaleDateString()}.pdf`);
        showFlashMessage('City list downloaded as PDF!', 'success');
    };

    // --- UI Rendering ---
    return (
        <div className="city-management-container">
            <h2 className="section-title">City Management</h2>

            {localError && (
                <p className="error-message text-center">{localError}</p>
            )}

            {/* City Creation/Update Form */}
            <div className="form-container-card">
                <form onSubmit={handleSubmit} className="app-form">
                    <h3 className="form-title">{editingCityId ? 'Edit City' : 'Create New City'}</h3>
                    
                    <div className="form-group">
                        <label htmlFor="name">City Name:</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g., Indore, Bhopal"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="zone">Zone:</label>
                        <select
                            id="zone"
                            name="zone"
                            value={formData.zone}
                            onChange={handleChange}
                            required
                            disabled={loading || zones.length === 0}
                        >
                            {zones.length === 0 ? (
                                <option value="">Loading Zones...</option>
                            ) : (
                                <>
                                    <option value="">Select a Zone</option>
                                    {zones.map(zone => (
                                        <option key={zone._id} value={zone._id}>
                                            {zone.name}
                                        </option>
                                    ))}
                                </>
                            )}
                        </select>
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
                            {loading ? (editingCityId ? 'Updating...' : 'Creating...') : (editingCityId ? 'Update City' : 'Create City')}
                            <FaPlusCircle className="ml-2" />
                        </button>
                        {editingCityId && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                    setEditingCityId(null);
                                    setFormData({ name: '', zone: zones.length > 0 ? zones[0]._id : '', status: 'active' });
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

            {/* City List Table */}
            <div className="table-container">
                <h3 className="table-title">Existing Cities</h3>

                {/* Search and PDF Download Section */}
                <div className="table-controls">
                    <div className="search-input-group">
                        <input
                            type="text"
                            placeholder="Search by City or Zone Name..."
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

                {loading && cities.length === 0 ? (
                    <p className="loading-state">Loading cities...</p>
                ) : filteredCities.length === 0 ? (
                    <p className="no-data-message">No cities found matching your criteria. Start by creating one!</p>
                ) : (
                    <>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>S.No.</th>
                                    <th>City Name</th>
                                    <th>Zone</th>
                                    <th>Add Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody ref={tableBodyRef}>
                                {/* Removed all unnecessary whitespace between elements */}
                                {currentCities.map((cityItem, index) => (
                                    <tr key={cityItem._id}>
                                        <td>{(currentPage - 1) * itemsPerPage + index + 1}</td><td>{cityItem.name}</td><td>{cityItem.zone ? cityItem.zone.name : 'N/A'}</td><td>{formatDateWithTime(cityItem.createdAt)}</td><td><span className={`status-badge ${cityItem.status}`}>{cityItem.status.charAt(0).toUpperCase() + cityItem.status.slice(1)}</span></td><td className="actions-column"><button onClick={() => handleEdit(cityItem)} className="action-icon-button edit-button" title="Edit City"><FaEdit /></button><button onClick={() => openConfirmModal(cityItem)} className="action-icon-button delete-button" title="Delete City"><FaTrashAlt /></button></td>
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
                        <p>Are you sure you want to delete city: <strong>{cityToDeleteName}</strong>?</p>
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

export default CityManagement;
