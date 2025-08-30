// src/components/masters/CityManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api';
import { FaEdit, FaTrashAlt, FaPlusCircle, FaSearch, FaFilePdf, FaChevronLeft, FaChevronRight, FaSpinner, FaTimesCircle } from 'react-icons/fa';

import '../../styles/Form.css';
import '../../styles/Table.css';
import '../../styles/Modal.css';

import companyLogo from '../../assets/glbs-logo.jpg';
import { addHeaderAndSetStartY, addReportTitle, addTableToDoc } from '../../utils/pdfTheme';

const CityManagement = ({ showFlashMessage }) => {
    const [cities, setCities] = useState([]);
    const [zones, setZones] = useState([]);
    const [salesRepresentatives, setSalesRepresentatives] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        zone: '',
        status: 'active',
        assignedSalesRepresentative: '',
    });
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState(null);
    const [editingCityId, setEditingCityId] = useState(null);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [cityToDeleteId, setCityToDeleteId] = useState(null);
    const [cityToDeleteName, setCityToDeleteName] = useState('');

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

    // ✅ Fetch Cities with latest-first order
  const fetchCities = useCallback(async () => {
    setLoading(true);
    setLocalError(null);
    try {
        const response = await api.get('/cities', { params: { _: Date.now() } });
        if (response.data.status === 'success') {
            const sorted = response.data.data.cities.sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );
            setCities(sorted);
            const totalPages = Math.ceil(sorted.length / itemsPerPage);
            if (currentPage > totalPages && totalPages > 0) {
                setCurrentPage(totalPages);
            } else if (totalPages === 0) {
                setCurrentPage(1);
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
}, [currentPage, itemsPerPage]);


const fetchZonesForDropdown = useCallback(async () => {
    try {
        const response = await api.get('/zones', { params: { _: Date.now() } });
        if (response.data.status === 'success') {
            const activeZones = response.data.data.zones.filter(zone => zone.status === 'active');
            setZones(activeZones);
        }
    } catch (err) {
        console.error('Error fetching zones for dropdown:', err);
        setLocalError('Failed to load zones for dropdown.');
    }
}, []);

const fetchSalesRepresentatives = useCallback(async () => {
    try {
        const response = await api.get('/employees/sales-representatives', { params: { _: Date.now() } });
        if (response.data.status === 'success') {
            setSalesRepresentatives(response.data.data.employees);
        }
    } catch (err) {
        console.error('Error fetching sales representatives:', err);
        showFlashMessage('Failed to load sales representatives.', 'error');
    }
}, [showFlashMessage]);
    useEffect(() => {
        fetchCities();
    }, [fetchCities]);

    useEffect(() => {
        fetchZonesForDropdown();
        fetchSalesRepresentatives();
    }, [fetchZonesForDropdown, fetchSalesRepresentatives]);

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

    if (!formData.name.trim() || !formData.zone) {
        setLocalError('City name and zone are required.');
        showFlashMessage('City name and zone are required.', 'error');
        setLoading(false);
        return;
    }

    try {
        let response;
        if (editingCityId) {
            response = await api.patch(`/cities/${editingCityId}`, formData);
            if (response.data.status === 'success') {
                showFlashMessage('Updated successfully!', 'success');
                fetchCities();
            } else {
                throw new Error(response.data.message || 'Failed to update city.');
            }
        } else {
            response = await api.post('/cities', formData);
            if (response.data.status === 'success') {
                showFlashMessage('Created successfully!', 'success');
                setSearchTerm(''); // Clear search to show new item
                setCurrentPage(1); // Reset to page 1
                fetchCities(); // Re-fetch to update table
            } else {
                throw new Error(response.data.message || 'Failed to create city.');
            }
        }
        setFormData({
            name: '',
            zone: '',
            status: 'active',
            assignedSalesRepresentative: '',
        });
        setEditingCityId(null);
    } catch (err) {
        console.error('Error saving city:', err);
        const errorMessage = err.response?.data?.message || 'Failed to save city. Please check your input.';
        setLocalError(errorMessage);
        showFlashMessage(errorMessage, 'error');
    } finally {
        setLoading(false);
    }
};

    const handleEdit = (cityItem) => {
        setFormData({
            name: cityItem.name,
            zone: cityItem.zone?._id || '',
            status: cityItem.status,
            assignedSalesRepresentative: cityItem.assignedSalesRepresentative?._id || '',
        });
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

    const handleCancelEdit = () => {
        setFormData({ name: '', zone: '', status: 'active', assignedSalesRepresentative: '' });
        setEditingCityId(null);
        setLocalError(null);
    };

    const filteredCities = cities.filter(city =>
        city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (city.zone && city.zone.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (city.assignedSalesRepresentative && city.assignedSalesRepresentative.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCities = filteredCities.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredCities.length / itemsPerPage);

    const goToNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
    };
    const goToPrevPage = () => {
        if (currentPage > 1) setCurrentPage(prev => prev - 1);
    };

    const downloadPdf = () => {
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF !== 'function') {
            showFlashMessage('PDF generation failed.', 'error');
            return;
        }
        const doc = new window.jspdf.jsPDF();
        let startY = addHeaderAndSetStartY(doc, companyLogo, 25, 22);
        startY = addReportTitle(doc, startY, "Zone List Report");

        const tableColumn = ["S.No.", "City Name", "Zone", "Assigned Sales Rep", "Status"];
        const tableRows = filteredCities.map((cityItem, index) => [
            index + 1,
            cityItem.name,
            cityItem.zone ? cityItem.zone.name : 'N/A',
            cityItem.assignedSalesRepresentative ? cityItem.assignedSalesRepresentative.name : 'Not Assigned',
            cityItem.status.charAt(0).toUpperCase() + cityItem.status.slice(1)
        ]);

        addTableToDoc(doc, tableColumn, tableRows, startY);
        doc.save(`Zone_List_${new Date().toLocaleDateString('en-CA').replace(/\//g, '-')}.pdf`);
        showFlashMessage('Zone list downloaded as PDF!', 'success');
    };

    return (
        <div className="city-management-container">
            {/* <h2 className="main-section-title">City Management</h2> */}
            <h2 className="main-section-title">Zone Management</h2>

            {localError && (
                <p className="error-message text-center">{localError}</p>
            )}

            <div className="main-content-layout">
                <div className="form-container-card">
                    <form onSubmit={handleSubmit} className="app-form">
                        {/* <h3 className="form-title">{editingCityId ? 'Edit City' : 'Add City'}</h3> */}
                        <h3 className="form-title">{editingCityId ? 'Edit Assigned Zone' : 'Assign Zone'}</h3>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="assignedSalesRepresentative">Sales Representative:</label>
                                <select
                                    id="assignedSalesRepresentative"
                                    name="assignedSalesRepresentative"
                                    value={formData.assignedSalesRepresentative}
                                    onChange={handleChange}
                                    disabled={loading || salesRepresentatives.length === 0}
                                    className="form-select"
                                >
                                    <option value="">Select</option>
                                    {salesRepresentatives.length > 0 ? (
                                        salesRepresentatives.map(rep => (
                                            <option key={rep._id} value={rep._id}>{rep.name}</option>
                                        ))
                                    ) : (
                                        <option value="" disabled>No active Sales Reps found</option>
                                    )}
                                </select>
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
                                    className="form-select"
                                >
                                    <option value=""> Select</option>
                                    {zones.length > 0 ? (
                                        zones.map(zone => (
                                            <option key={zone._id} value={zone._id}>{zone.name}</option>
                                        ))
                                    ) : (
                                        <option value="" disabled>No active zones found</option>
                                    )}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="name">City Name:</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g., Bhopal"
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
                        </div>
                        

                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary" disabled={loading || zones.length === 0}>
                                {loading ? (editingCityId ? 'Updating...' : 'Adding...') : (editingCityId ? 'Update ' : 'Add')}
                                <FaPlusCircle className="icon ml-2" />
                            </button>
                            {editingCityId && (
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
                                placeholder="Search by City or Zone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                                disabled={loading}
                            />
                        </div>
                        <button onClick={downloadPdf} className="download-pdf-btn" disabled={loading || filteredCities.length === 0}>
                            <FaFilePdf className="icon" /> Download PDF
                        </button>
                    </div>

                    {loading && cities.length === 0 ? (
                        <p className="loading-state text-center">
                            <FaSpinner className="animate-spin mr-2" /> Loading cities...
                        </p>
                    ) : filteredCities.length === 0 ? (
                        <p className="no-data-message text-center">No cities found matching your criteria. Start by adding one!</p>
                    ) : (
                        <>
                            <table className="app-table">
                                <thead>
                                    <tr>
                                        <th>S.No.</th>
                                        <th>Sales Representative</th>
                                        <th>Zone</th>
                                        <th>City Name</th>
                                        <th>Status</th>
                                        <th>Add Date</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody ref={tableBodyRef}>
                                    {currentCities.map((cityItem, index) => (
                                        <tr key={cityItem._id}>
                                            <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                            <td>{cityItem.assignedSalesRepresentative?.name || 'N/A'}</td>
                                            <td>{cityItem.zone?.name || 'N/A'}</td>
                                            <td>{cityItem.name}</td>
                                            
                                            
                                            <td>
                                                <span className={`status-badge ${cityItem.status}`}>
                                                    {cityItem.status.charAt(0).toUpperCase() + cityItem.status.slice(1)}
                                                </span>
                                            </td>
                                            <td>{formatDateWithTime(cityItem.createdAt)}</td>
                                            <td className="actions-column">
                                                <button
                                                    onClick={() => handleEdit(cityItem)}
                                                    className="action-icon-button edit-button"
                                                    title="Edit City"
                                                    disabled={loading}
                                                >
                                                    <FaEdit className="icon" />
                                                </button>
                                                <button
                                                    onClick={() => openConfirmModal(cityItem)}
                                                    className="action-icon-button delete-button"
                                                    title="Delete City"
                                                    disabled={loading}
                                                >
                                                    {loading && cityToDeleteId === cityItem._id ? <FaSpinner className="icon animate-spin" /> : <FaTrashAlt className="icon" />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
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
                                Total Records: {filteredCities.length}
                            </div>
                        </>
                    )}
                </div>


            </div>

            {showConfirmModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to delete city: <strong>{cityToDeleteName}</strong>?</p>
                        <div className="modal-actions">
                            <button onClick={confirmDelete} className="btn btn-danger" disabled={loading}>
                                {loading && cityToDeleteId ? <FaSpinner className="icon animate-spin" /> : 'Delete'}
                            </button>
                            <button onClick={closeConfirmModal} className="btn btn-secondary" disabled={loading}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CityManagement;