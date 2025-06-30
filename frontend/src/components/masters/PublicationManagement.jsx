// src/components/masters/PublicationManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api'; // API utility for backend calls
import { FaEdit, FaTrashAlt, FaPlusCircle, FaSearch, FaFilePdf, FaChevronLeft, FaChevronRight, FaTimes, FaCity as FaCityIcon } from 'react-icons/fa'; // Icons for UI

// Stylesheets (assuming these are already present and styled for consistency)
import '../../styles/Form.css';
import '../../styles/Table.css';
import '../../styles/Modal.css';

// NOTE: jsPDF and jspdf-autotable are expected to be loaded globally via CDN in public/index.html
// If you are using npm, you'd do: npm install jspdf jspdf-autotable
// Then import them here:
// import { jsPDF } from 'jspdf';
// import 'jspdf-autotable';


const PublicationManagement = ({ showFlashMessage }) => {
    // State for managing list of publications
    const [publications, setPublications] = useState([]);
    // State for managing list of cities for the dropdown in the form
    const [cities, setCities] = useState([]);
    // State for form inputs (for creating new or editing existing publication)
    const [formData, setFormData] = useState({
        name: '',
        personName: '',
        city: '', // Will store City ID
        mobileNumber: '',
        bank: '',
        accountNumber: '',
        ifsc: '',
        gstin: '',
        discount: 0, // Default discount
        address: '',
        status: 'active', // Default status
    });
    // State for loading indicators
    const [loading, setLoading] = useState(false);
    // State for managing local errors (e.g., form validation)
    const [localError, setLocalError] = useState(null);
    // State to track if we are in edit mode and which publication is being edited
    const [editingPublicationId, setEditingPublicationId] = useState(null);

    // States for confirmation modal (for deleting main publication)
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [publicationToDeleteId, setPublicationToDeleteId] = useState(null);
    const [publicationToDeleteName, setPublicationToDeleteName] = useState('');

    // States for Subtitle Management Modal
    const [showSubtitleModal, setShowSubtitleModal] = useState(false);
    const [selectedPublicationForSubtitle, setSelectedPublicationForSubtitle] = useState(null);
    const [newSubtitleName, setNewSubtitleName] = useState('');
    const [subtitleModalLoading, setSubtitleModalLoading] = useState(false);
    const [subtitleModalError, setSubtitleModalError] = useState(null);

    // NEW: States for Add New City Modal
    const [showAddCityModal, setShowAddCityModal] = useState(false);
    const [newCityName, setNewCityName] = useState('');
    const [newCityStatus, setNewCityStatus] = useState('active');
    const [addCityModalLoading, setAddCityModalLoading] = useState(false);
    const [addCityModalError, setAddCityModalError] = useState(null);


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

    // --- Fetch Publications ---
    const fetchPublications = useCallback(async (scrollToNew = false) => {
        setLoading(true);
        setLocalError(null);
        try {
            const response = await api.get(`/publications`); // Fetch all publications for client-side filtering/pagination
            if (response.data.status === 'success') {
                setPublications(response.data.data.publications);
                
                const totalPagesCalculated = Math.ceil(response.data.data.publications.length / itemsPerPage);
                if (currentPage > totalPagesCalculated && totalPagesCalculated > 0) {
                    setCurrentPage(totalPagesCalculated);
                } else if (response.data.data.publications.length === 0) {
                    setCurrentPage(1);
                }
                
                if (scrollToNew && tableBodyRef.current) {
                    setTimeout(() => {
                        const lastPageIndex = Math.ceil(response.data.data.publications.length / itemsPerPage);
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
                setLocalError(response.data.message || 'Failed to fetch publications.');
            }
        } catch (err) {
            console.error('Error fetching publications:', err);
            setLocalError(err.response?.data?.message || 'Failed to load publications due to network error.');
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage]); // Re-fetch when page or itemsPerPage changes (searchTerm is handled by filteredPublications)

    // --- Fetch Cities for Dropdown ---
    const fetchCitiesForDropdown = useCallback(async () => {
        try {
            const response = await api.get('/cities?status=active&limit=1000'); // Fetch all active cities
            if (response.data.status === 'success') {
                setCities(response.data.data.cities);
                // If creating a new publication and no city is pre-selected, set the first one as default
                if (!editingPublicationId && response.data.data.cities.length > 0 && !formData.city) {
                    setFormData(prev => ({ ...prev, city: response.data.data.cities[0]._id }));
                }
            } else {
                console.error('Failed to fetch cities for dropdown:', response.data.message);
                showFlashMessage('Failed to load cities for dropdown.', 'error');
            }
        } catch (err) {
            console.error('Error fetching cities for dropdown:', err);
            showFlashMessage('Network error fetching cities for dropdown.', 'error');
        }
    }, [editingPublicationId, showFlashMessage, formData.city]); // Added formData.city to dependencies

    // Fetch publications and cities on component mount or relevant state changes
    useEffect(() => {
        fetchPublications();
    }, [fetchPublications]); // Only fetch publications when dependencies change

    useEffect(() => {
        fetchCitiesForDropdown();
    }, [fetchCitiesForDropdown]); // Only fetch cities when dependencies change


    // Debugging useEffect for PDF libraries
    useEffect(() => {
        console.log("PDF Libraries Check (PublicationManagement):");
        console.log("window.jspdf (global object):", typeof window.jspdf);
        console.log("window.jspdf.jsPDF (constructor):", typeof window.jspdf?.jsPDF);
    }, []);


    // --- Form Handling ---
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

        // Basic validation
        if (!formData.city) {
            setLocalError('Please select a City.');
            showFlashMessage('Please select a City.', 'error');
            setLoading(false);
            return;
        }

        try {
            let response;
            if (editingPublicationId) {
                // Update existing publication
                response = await api.patch(`/publications/${editingPublicationId}`, formData);
                if (response.data.status === 'success') {
                    showFlashMessage('Publication updated successfully!', 'success');
                } else {
                    throw new Error(response.data.message || 'Failed to update publication.');
                }
            } else {
                // Create new publication
                response = await api.post('/publications', formData);
                if (response.data.status === 'success') {
                    showFlashMessage('Publication created successfully!', 'success');
                } else {
                    throw new Error(response.data.message || 'Failed to create publication.');
                }
            }
            // Reset form and re-fetch publications
            setFormData({
                name: '', personName: '', city: cities.length > 0 ? cities[0]._id : '',
                mobileNumber: '', bank: '', accountNumber: '', ifsc: '', gstin: '',
                discount: 0, address: '', status: 'active',
            });
            setEditingPublicationId(null);
            fetchPublications(true); // Re-fetch and indicate to scroll
        } catch (err) {
            console.error('Error saving publication:', err);
            const errorMessage = err.response?.data?.message || 'Failed to save publication. Please check your input and ensure publication name is unique.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Edit and Delete Operations ---
    const handleEdit = (publicationItem) => {
        setFormData({
            name: publicationItem.name,
            personName: publicationItem.personName,
            city: publicationItem.city._id, // Set city ID for dropdown
            mobileNumber: publicationItem.mobileNumber,
            bank: publicationItem.bank,
            accountNumber: publicationItem.accountNumber,
            ifsc: publicationItem.ifsc,
            gstin: publicationItem.gstin,
            discount: publicationItem.discount,
            address: publicationItem.address,
            status: publicationItem.status,
        });
        setEditingPublicationId(publicationItem._id);
        setLocalError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to form
    };

    const openConfirmModal = (publicationItem) => {
        setPublicationToDeleteId(publicationItem._id);
        setPublicationToDeleteName(publicationItem.name);
        setShowConfirmModal(true);
    };

    const closeConfirmModal = () => {
        setShowConfirmModal(false);
        setPublicationToDeleteId(null);
        setPublicationToDeleteName('');
    };

    const confirmDelete = async () => {
        setLoading(true);
        setLocalError(null);
        closeConfirmModal();

        try {
            const response = await api.delete(`/publications/${publicationToDeleteId}`);
            if (response.status === 204) { // 204 No Content for successful deletion
                showFlashMessage('Publication deleted successfully!', 'success');
                fetchPublications(); // Re-fetch publications to update the list
            } else {
                throw new Error(response.data?.message || 'Failed to delete publication.');
            }
        } catch (err) {
            console.error('Error deleting publication:', err);
            const errorMessage = err.response?.data?.message || 'Failed to delete publication.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Subtitle Management Handlers ---
    const openSubtitleModal = (publicationItem) => {
        setSelectedPublicationForSubtitle(publicationItem);
        setNewSubtitleName(''); // Clear previous input
        setSubtitleModalError(null);
        setShowSubtitleModal(true);
    };

    const closeSubtitleModal = () => {
        setShowSubtitleModal(false);
        setSelectedPublicationForSubtitle(null);
        setNewSubtitleName('');
        setSubtitleModalError(null);
        setSubtitleModalLoading(false);
    };

    const handleAddSubtitle = async (e) => {
        e.preventDefault();
        setSubtitleModalLoading(true);
        setSubtitleModalError(null);

        if (!newSubtitleName.trim()) {
            setSubtitleModalError('Subtitle name cannot be empty.');
            setSubtitleModalLoading(false);
            return;
        }

        try {
            const response = await api.post(`/publications/${selectedPublicationForSubtitle._id}/subtitles`, {
                name: newSubtitleName.trim(),
                publication: selectedPublicationForSubtitle._id
            });
            if (response.data.status === 'success') {
                showFlashMessage('Subtitle added successfully!', 'success');
                closeSubtitleModal();
                fetchPublications(); // Re-fetch publications to update the table with new subtitle
            } else {
                throw new Error(response.data.message || 'Failed to add subtitle.');
            }
        } catch (err) {
            console.error('Error adding subtitle:', err);
            const errorMessage = err.response?.data?.message || 'Failed to add subtitle. Ensure it is unique for this publication.';
            setSubtitleModalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setSubtitleModalLoading(false);
        }
    };

    const handleRemoveSubtitle = async (subtitleId, publicationId, subtitleName) => {
        if (!window.confirm(`Are you sure you want to remove subtitle "${subtitleName}"?`)) {
            return;
        }
        setLoading(true); // Use main loading for this action
        setLocalError(null);

        try {
            const response = await api.delete(`/publications/subtitles/${subtitleId}`);
            if (response.status === 204) {
                showFlashMessage('Subtitle removed successfully!', 'success');
                fetchPublications(); // Re-fetch publications to update the table
            } else {
                throw new Error(response.data?.message || 'Failed to remove subtitle.');
            }
        } catch (err) {
            console.error('Error removing subtitle:', err);
            const errorMessage = err.response?.data?.message || 'Failed to remove subtitle.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- NEW: Add City Modal Handlers ---
    const openAddCityModal = () => {
        setNewCityName(''); // Clear previous input
        setNewCityStatus('active'); // Reset to default
        setAddCityModalError(null);
        setShowAddCityModal(true);
    };

    const closeAddCityModal = () => {
        setShowAddCityModal(false);
        setNewCityName('');
        setNewCityStatus('active');
        setAddCityModalError(null);
        setAddCityModalLoading(false);
    };

    const handleAddNewCity = async (e) => {
        e.preventDefault();
        setAddCityModalLoading(true);
        setAddCityModalError(null);

        if (!newCityName.trim()) {
            setAddCityModalError('City name cannot be empty.');
            setAddCityModalLoading(false);
            return;
        }

        try {
            const response = await api.post('/cities', {
                name: newCityName.trim(),
                status: newCityStatus
            });
            if (response.data.status === 'success') {
                showFlashMessage(`City "${response.data.data.city.name}" added successfully!`, 'success');
                closeAddCityModal();
                // Re-fetch cities for dropdown and set the newly created city as selected
                await fetchCitiesForDropdown();
                setFormData(prev => ({ ...prev, city: response.data.data.city._id })); // Set newly created city as selected
            } else {
                throw new Error(response.data.message || 'Failed to add new city.');
            }
        } catch (err) {
            console.error('Error adding new city:', err);
            const errorMessage = err.response?.data?.message || 'Failed to add new city. Ensure city name is unique.';
            setAddCityModalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setAddCityModalLoading(false);
        }
    };


    // --- Search Filtering ---
    const filteredPublications = publications.filter(publicationItem =>
        publicationItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        publicationItem.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (publicationItem.city && publicationItem.city.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        publicationItem.mobileNumber.includes(searchTerm) ||
        publicationItem.gstin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (publicationItem.subtitles && publicationItem.subtitles.some(sub => sub.name.toLowerCase().includes(searchTerm.toLowerCase()))) // Search by subtitle name
    );

    // --- Pagination Logic ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPublications = filteredPublications.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredPublications.length / itemsPerPage);

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

        doc.text("Publication List", 14, 15);

        const tableColumn = [
            "S.No.", "Name", "Person", "Address", "City", "Mobile",
            "Bank", "Acc No.", "IFSC", "GSTIN", "Discount", "Add Date", "Status"
        ];
        const tableRows = [];

        filteredPublications.forEach((pubItem, index) => {
            const pubData = [
                index + 1,
                pubItem.name,
                pubItem.personName,
                pubItem.address,
                pubItem.city ? pubItem.city.name : 'N/A', // Display city name
                pubItem.mobileNumber,
                pubItem.bank,
                pubItem.accountNumber,
                pubItem.ifsc,
                pubItem.gstin,
                `${pubItem.discount}%`,
                formatDateWithTime(pubItem.createdAt),
                pubItem.status.charAt(0).toUpperCase() + pubItem.status.slice(1)
            ];
            tableRows.push(pubData);
        });

        doc.autoTable(tableColumn, tableRows, { startY: 20 });
        doc.save(`Publication_List_${new Date().toLocaleDateString()}.pdf`);
        showFlashMessage('Publication list downloaded as PDF!', 'success');
    };

    // --- UI Rendering ---
    return (
        <div className="publication-management-container">
            <h2 className="section-title">Publication Management</h2>

            {localError && (
                <p className="error-message text-center">{localError}</p>
            )}

            {/* Publication Creation/Update Form */}
            <div className="form-container-card">
                <form onSubmit={handleSubmit} className="app-form">
                    <h3 className="form-title">{editingPublicationId ? 'Edit Publication' : 'Add Publication'}</h3>
                    
                    <div className="form-row"> {/* Use form-row for multi-column layout */}
                        <div className="form-group">
                            <label htmlFor="name">Publication Name:</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g., NCERT, Arihant"
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="personName">Person Name:</label>
                            <input
                                type="text"
                                id="personName"
                                name="personName"
                                value={formData.personName}
                                onChange={handleChange}
                                placeholder="e.g., John Doe"
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="city">City:</label>
                            <div className="input-with-button"> {/* Wrapper for input and button */}
                                <select
                                    id="city"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    required
                                    disabled={loading || cities.length === 0}
                                >
                                    {cities.length === 0 ? (
                                        <option value="">Loading Cities...</option>
                                    ) : (
                                        <>
                                            <option value="">Select a City</option>
                                            {cities.map(city => (
                                                <option key={city._id} value={city._id}>
                                                    {city.name}
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                                <button
                                    type="button"
                                    className="btn btn-icon-only btn-add-new"
                                    onClick={openAddCityModal}
                                    title="Add New City"
                                    disabled={loading}
                                >
                                    <FaPlusCircle /> <FaCityIcon />
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="mobileNumber">Mobile Number:</label>
                            <input
                                type="text"
                                id="mobileNumber"
                                name="mobileNumber"
                                value={formData.mobileNumber}
                                onChange={handleChange}
                                placeholder="e.g., 9876543210"
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="bank">Bank:</label>
                            <input
                                type="text"
                                id="bank"
                                name="bank"
                                value={formData.bank}
                                onChange={handleChange}
                                placeholder="e.g., SBI, HDFC"
                                disabled={loading}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="accountNumber">Acc Number:</label>
                            <input
                                type="text"
                                id="accountNumber"
                                name="accountNumber"
                                value={formData.accountNumber}
                                onChange={handleChange}
                                placeholder="e.g., 1234567890"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="ifsc">IFSC:</label>
                            <input
                                type="text"
                                id="ifsc"
                                name="ifsc"
                                value={formData.ifsc}
                                onChange={handleChange}
                                placeholder="e.g., HDFC0001234"
                                disabled={loading}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="gstin">GSTIN:</label>
                            <input
                                type="text"
                                id="gstin"
                                name="gstin"
                                value={formData.gstin}
                                onChange={handleChange}
                                placeholder="e.g., 22AAAAA0000A1Z5"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="discount">Discount (%):</label>
                            <input
                                type="number"
                                id="discount"
                                name="discount"
                                value={formData.discount}
                                onChange={handleChange}
                                placeholder="e.g., 10"
                                min="0"
                                max="100"
                                disabled={loading}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="address">Address:</label>
                            <textarea
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Full Address"
                                required
                                disabled={loading}
                            ></textarea>
                        </div>
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
                            {loading ? (editingPublicationId ? 'Updating...' : 'Adding...') : (editingPublicationId ? 'Update Publication' : 'Add Publication')}
                            <FaPlusCircle className="ml-2" />
                        </button>
                        {editingPublicationId && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                    setEditingPublicationId(null);
                                    setFormData({
                                        name: '', personName: '', city: cities.length > 0 ? cities[0]._id : '',
                                        mobileNumber: '', bank: '', accountNumber: '', ifsc: '', gstin: '',
                                        discount: 0, address: '', status: 'active',
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

            {/* Publication List Table */}
            <div className="table-container">
                <h3 className="table-title">Existing Publications</h3>

                {/* Search and PDF Download Section */}
                <div className="table-controls">
                    <div className="search-input-group">
                        <input
                            type="text"
                            placeholder="Search by Name, Person, City, Mobile, GSTIN..."
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

                {loading && publications.length === 0 ? (
                    <p className="loading-state">Loading publications...</p>
                ) : filteredPublications.length === 0 ? (
                    <p className="no-data-message">No publications found matching your criteria. Start by adding one!</p>
                ) : (
                    <>
                        <table className="data-table">
                            <thead>
                                <tr>{/* Fixed whitespace here */}
                                    <th>S.No.</th><th>Name</th><th>Sub Title</th><th>Person</th><th>Address</th><th>City</th><th>Phone</th><th>Bank</th><th>Acc No.</th><th>IFSC</th><th>OTHER (GSTIN/Disc)</th><th>Add Date</th><th>Status</th><th>Action</th>
                                </tr>
                            </thead>
                            <tbody ref={tableBodyRef}>
                                {currentPublications.map((pubItem, index) => (
                                    <tr key={pubItem._id}>
                                        <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                        <td>{pubItem.name}</td>
                                        <td>
                                            {/* Display Subtitles and Add Button */}
                                            <div className="subtitle-list">
                                                {pubItem.subtitles && pubItem.subtitles.length > 0 ? (
                                                    pubItem.subtitles.map(sub => (
                                                        <span key={sub._id} className="subtitle-tag">
                                                            {sub.name}
                                                            <button
                                                                className="remove-subtitle-btn"
                                                                onClick={() => handleRemoveSubtitle(sub._id, pubItem._id, sub.name)}
                                                                title="Remove Subtitle"
                                                                disabled={loading}
                                                            >
                                                                <FaTimes />
                                                            </button>
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span>No subtitles</span>
                                                )}
                                                <button
                                                    className="btn-add-subtitle"
                                                    onClick={() => openSubtitleModal(pubItem)}
                                                    title="Add New Subtitle"
                                                    disabled={loading}
                                                >
                                                    + Add
                                                </button>
                                            </div>
                                        </td>
                                        <td>{pubItem.personName}</td>
                                        <td>{pubItem.address}</td>
                                        <td>{pubItem.city ? pubItem.city.name : 'N/A'}</td>
                                        <td>{pubItem.mobileNumber}</td>
                                        <td>{pubItem.bank}</td>
                                        <td>{pubItem.accountNumber}</td>
                                        <td>{pubItem.ifsc}</td>
                                        <td>
                                            {pubItem.gstin && `GSTIN: ${pubItem.gstin}`}
                                            {pubItem.gstin && pubItem.discount > 0 && <br />}
                                            {pubItem.discount > 0 && `DISCOUNT: ${pubItem.discount}%`}
                                        </td>
                                        <td>{formatDateWithTime(pubItem.createdAt)}</td>
                                        <td>
                                            <span className={`status-badge ${pubItem.status}`}>
                                                {pubItem.status.charAt(0).toUpperCase() + pubItem.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="actions-column">
                                            <button
                                                onClick={() => handleEdit(pubItem)}
                                                className="action-icon-button edit-button"
                                                title="Edit Publication"
                                                disabled={loading}
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => openConfirmModal(pubItem)}
                                                className="action-icon-button delete-button"
                                                title="Delete Publication"
                                                disabled={loading}
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

            {/* Confirmation Modal for Publication Deletion */}
            {showConfirmModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to delete publication: <strong>{publicationToDeleteName}</strong>?</p>
                        <div className="modal-actions">
                            <button onClick={confirmDelete} className="btn btn-danger" disabled={loading}>Delete</button>
                            <button onClick={closeConfirmModal} className="btn btn-secondary" disabled={loading}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Subtitle Management Modal */}
            {showSubtitleModal && selectedPublicationForSubtitle && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <div className="form-header">
                            <h3>Add Subtitle for "{selectedPublicationForSubtitle.name}"</h3>
                            <button onClick={closeSubtitleModal} className="close-button" disabled={subtitleModalLoading}>
                                <FaTimes />
                            </button>
                        </div>
                        <form onSubmit={handleAddSubtitle} className="app-form">
                            <div className="form-group">
                                <label htmlFor="newSubtitleName">Subtitle Name:</label>
                                <input
                                    type="text"
                                    id="newSubtitleName"
                                    name="newSubtitleName"
                                    value={newSubtitleName}
                                    onChange={(e) => setNewSubtitleName(e.target.value)}
                                    placeholder="e.g., Class 10 Edition, Volume 2"
                                    required
                                    disabled={subtitleModalLoading}
                                />
                            </div>
                            {subtitleModalError && (
                                <p className="error-message text-center">{subtitleModalError}</p>
                            )}
                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary" disabled={subtitleModalLoading}>
                                    {subtitleModalLoading ? 'Adding...' : 'Add Subtitle'}
                                    <FaPlusCircle className="ml-2" />
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={closeSubtitleModal} disabled={subtitleModalLoading}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* NEW: Add New City Modal */}
            {showAddCityModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <div className="form-header">
                            <h3>Add New City</h3>
                            <button onClick={closeAddCityModal} className="close-button" disabled={addCityModalLoading}>
                                <FaTimes />
                            </button>
                        </div>
                        <form onSubmit={handleAddNewCity} className="app-form">
                            <div className="form-group">
                                <label htmlFor="newCityName">City Name:</label>
                                <input
                                    type="text"
                                    id="newCityName"
                                    name="newCityName"
                                    value={newCityName}
                                    onChange={(e) => setNewCityName(e.target.value)}
                                    placeholder="e.g., Mumbai, Delhi"
                                    required
                                    disabled={addCityModalLoading}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="newCityStatus">Status:</label>
                                <select
                                    id="newCityStatus"
                                    name="newCityStatus"
                                    value={newCityStatus}
                                    onChange={(e) => setNewCityStatus(e.target.value)}
                                    disabled={addCityModalLoading}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            {addCityModalError && (
                                <p className="error-message text-center">{addCityModalError}</p>
                            )}
                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary" disabled={addCityModalLoading}>
                                    {addCityModalLoading ? 'Adding City...' : 'Add City'}
                                    <FaPlusCircle className="ml-2" />
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={closeAddCityModal} disabled={addCityModalLoading}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicationManagement;
