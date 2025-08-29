// src/components/masters/PublicationManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api'; // API utility for backend calls
import { FaEdit, FaTrashAlt, FaPlusCircle, FaSearch, FaFilePdf, FaChevronLeft, FaChevronRight, FaTimes, FaSpinner } from 'react-icons/fa'; // Icons for UI
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

// Stylesheets (assuming these are already present and styled for consistency)
import '../../styles/Form.css';
import '../../styles/Table.css';
import '../../styles/Modal.css';
import '../../styles/PublicationManagement.css'; // Component-specific layout overrides
import '../../styles/CommonLayout.css'; // Ensure CommonLayout is imported

// Import the logo image directly
import companyLogo from '../../assets/glbs-logo.jpg';
import { addHeaderAndSetStartY, addReportTitle, addTableToDoc } from '../../utils/pdfTheme';

// NOTE: jsPDF and jspdf-autotable are expected to be loaded globally via CDN in public/index.html
// If you are using npm, you'd do: npm install jspdf jspdf-autotable
// Then import them here:
// import { jsPDF } from 'jspdf';
// import 'jspdf-autotable';



const PublicationManagement = ({ showFlashMessage }) => {
    const [isOpen, setIsOpen] = useState(false);
    // State for managing list of publications
    const [publications, setPublications] = useState([]);
    // State for managing list of cities for lookup/validation (not for dropdown anymore)
    const [cities, setCities] = useState([]);
    // State for form inputs (for creating new or editing existing publication)
    const [formData, setFormData] = useState({
        name: '',
        personName: '',
        city: '', // Will now store City Name directly
        mobileNumber: '',
        bank: '',
        accountNumber: '',
        ifsc: '',
        gstin: '',
        address: '',
        status: 'active', // Default status
        publicationType: 'Private Pub' // NEW: State for the radio buttons
        // Removed subtitles and discount from here as they will be managed via a separate modal/field
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
    const [selectedPublicationForSubtitle, setSelectedPublicationForSubtitle] = useState(null); // This will hold the full publication object for subtitle ops
    const [newSubtitleName, setNewSubtitleName] = useState('');
    const [newSubtitleDiscount, setNewSubtitleDiscount] = useState(0); // NEW: State for subtitle discount
    const [subtitleModalLoading, setSubtitleModalLoading] = useState(false);
    const [subtitleModalError, setSubtitleModalError] = useState(null);

    // NEW STATE: Temporary subtitles for a new publication being created (before it's saved)
    const [newPublicationSubtitles, setNewPublicationSubtitles] = useState([]);

    // NEW STATE: ID of the subtitle currently being edited
    const [editingSubtitleId, setEditingSubtitleId] = useState(null);


    // Ref for scrolling to the new item in the table (if needed)
    const tableBodyRef = useRef(null);

    // States for Search
    const [searchTerm, setSearchTerm] = useState('');
    const [publicationTypeFilter, setPublicationTypeFilter] = useState('all'); // Default to 'all' for no filter
    const [publicationNameFilter, setPublicationNameFilter] = useState('all');

    // States for Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Show 10 entries per page

    // --- Initial form state for clearing/resetting ---
    const initialFormData = {
        name: '', personName: '', city: '',
        mobileNumber: '', bank: '', accountNumber: '', ifsc: '', gstin: '',
        address: '', status: 'active', publicationType: 'Private Pub'
    };

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

    // --- Fetch Publications ---
    // --- Fetch Publications ---
    const fetchPublications = useCallback(async () => {
        setLoading(true);
        setLocalError(null);
        try {
            const response = await api.get(`/publications`);
            if (response.data.status === 'success') {
                // ✅ Sort by latest createdAt first
                const sorted = response.data.data.publications.sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                );
                setPublications(sorted);

                const totalPagesCalculated = Math.ceil(sorted.length / itemsPerPage);
                if (currentPage > totalPagesCalculated && totalPagesCalculated > 0) {
                    setCurrentPage(totalPagesCalculated);
                } else if (sorted.length === 0) {
                    setCurrentPage(1);
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
    }, [currentPage, itemsPerPage]);

    // --- Fetch Cities for Lookup ---
    const fetchCitiesForLookup = useCallback(async () => {
        try {
            // Fetch all active cities to use for validation/lookup
            const response = await api.get('/cities?status=active&limit=1000');
            if (response.data.status === 'success') {
                setCities(response.data.data.cities || []); // Safeguard: Ensure cities is always an array
            } else {
                console.error('Failed to fetch cities for lookup:', response.data.message);
                showFlashMessage('Failed to load cities for lookup.', 'error');
            }
        } catch (err) {
            console.error('Error fetching cities for lookup:', err);
            showFlashMessage('Network error fetching cities for lookup.', 'error');
        }
    }, [showFlashMessage]);

    // Fetch publications and cities on component mount or relevant state changes
    useEffect(() => {
        fetchPublications();
    }, [fetchPublications]);

    useEffect(() => {
        fetchCitiesForLookup();
    }, [fetchCitiesForLookup]);


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

    // --- Submit Form ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setLocalError(null);


        if (!formData.name.trim()) {
            setLocalError('Publication Name is required.');
            showFlashMessage('Publication Name is required.', 'error');
            setLoading(false);
            return;
        }

        let cityIdToUse = '';
        const enteredCityName = formData.city.trim();

        try {

            if (enteredCityName) {
                let existingCity = cities.find(c => c && c.name && c.name.toLowerCase() === enteredCityName.toLowerCase());
                if (existingCity) {
                    cityIdToUse = existingCity._id;
                } else {
                    const newCityResponse = await api.post('/cities', { name: enteredCityName, status: 'active' });
                    if (newCityResponse.data.status === 'success') {
                        cityIdToUse = newCityResponse.data.data.city._id;
                        showFlashMessage(`New city "${enteredCityName}" created successfully!`, 'success');
                        await fetchCitiesForLookup();
                    } else {
                        throw new Error(newCityResponse.data.message || 'Failed to create new city.');
                    }
                }
            }

            const publicationData = { ...formData, city: cityIdToUse || undefined };

            let response;
            if (editingPublicationId) {
                // Update case
                response = await api.patch(`/publications/${editingPublicationId}`, publicationData);
                if (response.data.status === 'success') {
                    showFlashMessage('Publication updated successfully!', 'success');
                    fetchPublications();
                    setFormData(initialFormData);
                    setEditingPublicationId(null);
                    setSelectedPublicationForSubtitle(null);
                    setNewPublicationSubtitles([]);
                } else {
                    throw new Error(response.data.message || 'Failed to update publication.');
                }
            } else {
                // Create case
                const newPublicationData = {
                    ...publicationData,
                    subtitles: newPublicationSubtitles.map(s => ({ name: s.name, discount: s.discount }))
                };
                response = await api.post('/publications', newPublicationData);
                if (response.data.status === 'success') {
                    showFlashMessage('Publication created successfully!', 'success');
                    setPublications(prev => [response.data.data.publication, ...prev]);
                    setCurrentPage(1);
                    setNewPublicationSubtitles([]);
                    setEditingPublicationId(response.data.data.publication._id);
                    setSelectedPublicationForSubtitle(response.data.data.publication);
                    setFormData({
                        ...response.data.data.publication,
                        city: response.data.data.publication.city ? response.data.data.publication.city.name : ''
                    });
                } else {
                    throw new Error(response.data.message || 'Failed to create publication.');
                }
            }
        } catch (err) {
            console.error('Error saving publication:', err);
            const errorMessage = err.response?.data?.message || 'Failed to save publication. Please check your input.';
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
            city: publicationItem.city ? publicationItem.city.name : '', // Set city NAME for input field
            mobileNumber: publicationItem.mobileNumber,
            bank: publicationItem.bank,
            accountNumber: publicationItem.accountNumber,
            ifsc: publicationItem.ifsc,
            gstin: publicationItem.gstin,
            address: publicationItem.address,
            status: publicationItem.status,
            publicationType: publicationItem.publicationType // NEW: Set publication type on edit
            // Subtitles are not edited via the main form
        });
        setEditingPublicationId(publicationItem._id);
        // When editing, also set the selected publication for potential subtitle operations
        setSelectedPublicationForSubtitle(publicationItem);
        // Clear temporary subtitles when starting to edit an existing one
        setNewPublicationSubtitles([]);
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

    // --- Subtitle Management Functions ---
    // This function will now be called from the main form
    const handleOpenSubtitleModalFromForm = () => {
        // Reset subtitle form fields and states for a fresh start
        setNewSubtitleName('');
        setNewSubtitleDiscount(0);
        setEditingSubtitleId(null); // Ensure we are in "add" mode
        setSubtitleModalError(null);
        setShowSubtitleModal(true);
    };

    const handleEditSubtitle = (subtitle, publication) => {
        setNewSubtitleName(subtitle.name);
        setNewSubtitleDiscount(subtitle.discount);
        setEditingSubtitleId(subtitle._id); // Set the ID of the subtitle being edited
        setSelectedPublicationForSubtitle(publication);
        setSubtitleModalError(null);
        setShowSubtitleModal(true);
    };

    const closeSubtitleModal = () => {
        setShowSubtitleModal(false);
        setNewSubtitleName('');
        setNewSubtitleDiscount(0);
        setEditingSubtitleId(null); // Reset to null after closing
        setSubtitleModalError(null);
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

        if (editingSubtitleId) {
            // Logic for UPDATING a subtitle
            try {
                const response = await api.patch(`/publications/subtitles/${editingSubtitleId}`, {
                    name: newSubtitleName.trim(),
                    discount: newSubtitleDiscount
                });
                if (response.data.status === 'success') {
                    showFlashMessage('Subtitle updated successfully!', 'success');
                    closeSubtitleModal();
                    fetchPublications(); // Re-fetch publications to update the table with new subtitle
                } else {
                    throw new Error(response.data.message || 'Failed to update subtitle.');
                }
            } catch (err) {
                console.error('Error updating subtitle:', err);
                const errorMessage = err.response?.data?.message || 'Failed to update subtitle.';
                setSubtitleModalError(errorMessage);
                showFlashMessage(errorMessage, 'error');
            } finally {
                setSubtitleModalLoading(false);
            }
        } else {
            // Logic for ADDING a new subtitle
            if (editingPublicationId) {
                // Add to existing publication
                try {
                    const response = await api.post(`/publications/${editingPublicationId}/subtitles`, {
                        name: newSubtitleName.trim(),
                        discount: newSubtitleDiscount
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
                    const errorMessage = err.response?.data?.message || 'Failed to add subtitle.';
                    setSubtitleModalError(errorMessage);
                    showFlashMessage(errorMessage, 'error');
                } finally {
                    setSubtitleModalLoading(false);
                }
            } else {
                // Add to a new (unsaved) publication
                const tempSubtitle = {
                    _id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: newSubtitleName.trim(),
                    discount: newSubtitleDiscount
                };
                setNewPublicationSubtitles(prev => [...prev, tempSubtitle]);
                showFlashMessage('Subtitle added temporarily. It will be saved with the new publication.', 'info');
                closeSubtitleModal();
                setSubtitleModalLoading(false);
            }
        }
    };

    const handleRemoveSubtitle = async (subtitleId, publicationId, subtitleName) => {
        const isConfirmed = window.confirm(`Are you sure you want to remove subtitle "${subtitleName}"?`);

        if (!isConfirmed) {
            return;
        }

        setLoading(true); // Use main loading for this action
        setLocalError(null);

        if (publicationId) {
            // Logic for removing subtitle from an existing publication
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
        } else {
            // Logic for removing subtitle from a new (unsaved) publication
            setNewPublicationSubtitles(prev => prev.filter(sub => sub._id !== subtitleId));
            showFlashMessage('Subtitle removed temporarily.', 'info');
            setLoading(false); // Manually set false as no API call for temporary remove
        }
    };

    const handleCancelEdit = () => {
        setFormData(initialFormData); // Reset to initial state
        setEditingPublicationId(null);
        setSelectedPublicationForSubtitle(null); // Also clear selected publication for subtitle ops
        setNewPublicationSubtitles([]); // IMPORTANT: Clear temporary subtitles
        setLocalError(null);
    };

    // --- Search Filtering ---
    const filteredPublications = publications.filter((publicationItem) => {
        if (!publicationItem) return false;

        // Apply publicationType filter
        const matchesType =
            publicationTypeFilter === 'all' ||
            publicationItem.publicationType === publicationTypeFilter;

        // NEW: Apply publicationName filter
        const matchesName =
            publicationNameFilter === 'all' ||
            publicationItem.name === publicationNameFilter;

        // Apply existing search term filter
        const matchesSearch =
            publicationItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            publicationItem.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (publicationItem.city &&
                publicationItem.city.name &&
                publicationItem.city.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (publicationItem.mobileNumber &&
                publicationItem.mobileNumber.includes(searchTerm)) ||
            (publicationItem.gstin &&
                publicationItem.gstin.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (Array.isArray(publicationItem.subtitles) &&
                publicationItem.subtitles.some(
                    (sub) =>
                        sub && sub.name && sub.name.toLowerCase().includes(searchTerm.toLowerCase())
                ));

        // Combine all filter conditions
        return matchesType && matchesName && matchesSearch;
    });

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
    // --- PDF Download Functionality ---
    const downloadPdf = () => {
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF !== 'function') {
            showFlashMessage('PDF generation failed: Core libraries are not loaded. Please check your script links.', 'error');
            console.error("PDF generation failed: window.jspdf is not available. Ensure CDNs for jsPDF are correctly linked in your HTML file.");
            return;
        }

        const doc = new window.jspdf.jsPDF('p', 'mm', 'a4');

        // Corrected coordinates for the logo to fix the positioning issue
        let startY = addHeaderAndSetStartY(doc, companyLogo, 25, 22);
        startY = addReportTitle(doc, startY, "Publications Report");

        const tableColumn = ["S.No.", "Publication Name", "City", "Total Subtitles", "Status"];
        const tableRows = filteredPublications.map((pub, index) => [
            index + 1,
            pub.name,
            pub.city?.name || 'N/A',
            pub.subtitles.length,
            pub.status
        ]);

        addTableToDoc(doc, tableColumn, tableRows, startY);

        doc.save(`Publications_List_${new Date().toLocaleDateString('en-CA').replace(/\//g, '-')}.pdf`);
        showFlashMessage('Publications list downloaded as PDF!', 'success');
    };

    // --- UI Rendering ---
    return (
        <div className="publication-management-container">
            <h2 className="main-section-title">Publication Management</h2>

            {localError && (
                <p className="error-message text-center">{localError}</p>
            )}

            {/* Main content layout for two columns */}
            <div className="main-content-layout">

                {/* Publication Creation/Update Form - SECOND CHILD */}
                <div className="form-container-card">
                    <form onSubmit={handleSubmit} className="app-form">
                        <h3 className="form-title">{editingPublicationId ? 'Edit Publication' : 'Publication Details'}</h3>

                        {/* NEW: Radio buttons for publication type */}
                        <div className="form-group publication-type-radio-group">
                            <label>Publishers Detail:</label>
                            <div className="radio-group">
                                <label>
                                    <input
                                        type="radio"
                                        name="publicationType"
                                        value="Private Pub"
                                        checked={formData.publicationType === 'Private Pub'}
                                        onChange={handleChange}
                                        disabled={loading}
                                    /> Private
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="publicationType"
                                        value="Govt. Pub"
                                        checked={formData.publicationType === 'Govt. Pub'}
                                        onChange={handleChange}
                                        disabled={loading}
                                    /> Govt.
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="publicationType"
                                        value="Other Pub"
                                        checked={formData.publicationType === 'Other Pub'}
                                        onChange={handleChange}
                                        disabled={loading}
                                    /> Other
                                </label>
                            </div>
                        </div>

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
                                    className="form-input"
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
                                    // required
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                        </div>

                        {/* Display temporarily added subtitles for new publication OR existing for edited one */}
                        {(!editingPublicationId && newPublicationSubtitles.length > 0) || (editingPublicationId && selectedPublicationForSubtitle?.subtitles?.length > 0) ? (
                            <div className="form-group">
                                <label>Subtitles:</label>
                                <div className="subtitle-list form-subtitle-list">
                                    {editingPublicationId
                                        ? selectedPublicationForSubtitle.subtitles.map(sub => (
                                            <span key={sub._id} className="subtitle-tag">
                                                {sub.name} ({sub.discount}%)
                                                <button
                                                    className="remove-subtitle-btn"
                                                    onClick={() => handleRemoveSubtitle(sub._id, selectedPublicationForSubtitle._id, sub.name)}
                                                    title="Remove Subtitle"
                                                    disabled={loading}
                                                >
                                                    <FaTimes />
                                                </button>
                                            </span>
                                        ))
                                        : newPublicationSubtitles.map(sub => (
                                            <span key={sub._id} className="subtitle-tag">
                                                {sub.name} ({sub.discount}%)
                                                <button
                                                    className="remove-subtitle-btn"
                                                    onClick={() => handleRemoveSubtitle(sub._id, null, sub.name)} // Pass null for publicationId as it's temporary
                                                    title="Remove temporary Subtitle"
                                                    disabled={loading}
                                                >
                                                    <FaTimes />
                                                </button>
                                            </span>
                                        ))
                                    }
                                </div>
                            </div>
                        ) : null}

                        {/* Add Subtitle button - always visible and enabled as per user request */}
                        <div className="form-group mt-3">
                            <button
                                type="button"
                                onClick={handleOpenSubtitleModalFromForm}
                                className="btn btn-info"
                                disabled={loading}
                            >
                                <FaPlusCircle className="mr-2" /> Add Subtitle
                            </button>
                            {/* <small className="form-text-muted ml-2">
                                Add new subtitles {editingPublicationId ? 'to this publication.' : 'for the new publication.'}
                            </small> */}
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="mobileNumber">Mobile Number:</label>
                                <input
                                    type="text"
                                    id="mobileNumber"
                                    name="mobileNumber"
                                    value={formData.mobileNumber}
                                    onChange={handleChange}
                                    placeholder="e.g., 9876543210"
                                    // required
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="city">City:</label>
                                {/* City input is now a direct text input */}
                                <input
                                    type="text"
                                    id="city"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    placeholder="e.g., Indore, Bhopal"
                                    // required
                                    disabled={loading}
                                    className="form-input"
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
                                    // required
                                    disabled={loading}
                                    className="form-textarea"
                                ></textarea>
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
                                    className="form-input"
                                />
                            </div>

                        </div>
                        <h3 className="form-title">{editingPublicationId ? 'Edit Bank Details' : 'Bank Details'}</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="bank">Bank Name:</label>
                                <input
                                    type="text"
                                    id="bank"
                                    name="bank"
                                    value={formData.bank}
                                    onChange={handleChange}
                                    placeholder="e.g., SBI, HDFC"
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="accountNumber">Account Number:</label>
                                <input
                                    type="text"
                                    id="accountNumber"
                                    name="accountNumber"
                                    value={formData.accountNumber}
                                    onChange={handleChange}
                                    placeholder="e.g., 1234567890"
                                    disabled={loading}
                                    className="form-input"
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
                                    className="form-input"
                                />
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
                                className="form-select"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? <FaSpinner className="btn-icon-mr animate-spin" /> : (editingPublicationId ? 'Update Publication' : 'Add Publication')}
                            </button>
                            {editingPublicationId && (
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
                {/* Publication List Table - FIRST CHILD */}
                <div className="table-section">
                    {/* <h3 className="table-title">Existing Publications</h3> */}

                    {/* Search and PDF Download Section */}


                    {loading && publications.length === 0 ? (
                        <p className="loading-state">Loading publications...</p>
                    ) : filteredPublications.length === 0 ? (
                        <p className="no-data-message">No publications found matching your criteria. Start by adding one!</p>
                    ) : (
                        <div className="table-container"> {/* This div is for table overflow, not layout */}
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
                                <div className="publication-type-filter">
                                    <label htmlFor="publicationNameFilter" className="mr-2"></label>
                                    <select
                                        id="publicationNameFilter"
                                        value={publicationNameFilter}
                                        onChange={(e) => {
                                            setPublicationNameFilter(e.target.value);
                                            setCurrentPage(1); // Reset to first page when filter changes
                                        }}
                                        className="form-select"
                                    >
                                        <option value="all">All Publications</option>
                                        {/* Map over a unique list of publication names here */}
                                        {publications.map(pub => (
                                            <option key={pub._id} value={pub.name}>
                                                {pub.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {/* NEW: Publication Type Filter Dropdown */}
                                <div className="publication-type-filter">
                                    <label htmlFor="publicationTypeFilter" className="mr-2"></label>
                                    <select
                                        id="publicationTypeFilter"
                                        value={publicationTypeFilter}
                                        onChange={(e) => {
                                            setPublicationTypeFilter(e.target.value);
                                            setCurrentPage(1); // Reset to first page when filter changes
                                        }}
                                        className="form-select"
                                    >
                                        <option value="all">All Types</option>
                                        <option value="Private Pub">Private</option>
                                        <option value="Govt. Pub">Government</option>
                                        <option value="Other Pub">Other</option>
                                    </select>
                                </div>
                                <button
                                    onClick={downloadPdf}
                                    className="btn btn-info download-pdf-btn"
                                    disabled={loading || filteredPublications.length === 0}
                                >
                                    <FaFilePdf className="mr-2" /> Download PDF
                                </button>
                            </div>
                            <table className="app-table">
                                <thead>
                                    <tr>
                                        {/* <th>S.No.</th><th>Name</th><th>Sub Title</th><th>Person</th><th>Address</th><th>City</th><th>Phone</th><th>Bank</th><th>Acc No.</th><th>IFSC</th><th>OTHER (GSTIN/Disc)</th><th>Add Date</th><th>Status</th><th>Action</th> */}
                                        <th>S.No.</th><th>Publication Type</th><th>Publication Name</th><th>Contact Person Name</th><th>Sub Title</th><th>Mobile No</th><th>Address</th><th>City</th><th>GST No.</th><th>Bank</th><th>Acc No.</th><th>IFSC</th><th>Add Date</th><th>Status</th><th>Action</th>
                                    </tr>
                                </thead>
                                <tbody ref={tableBodyRef}>
                                    {currentPublications.map((pubItem, index) => (
                                        <tr key={pubItem._id}>
                                            <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                            <td>{pubItem.publicationType}</td>
                                            <td>{pubItem.name}</td>
                                            <td>{pubItem.personName}</td>
                                            <td>
                                                {pubItem.subtitles && pubItem.subtitles.length > 0 ? (
                                                    <details>
                                                        <summary style={{ cursor: "pointer", color: "#007bff" }}>
                                                            View Subtitles ({pubItem.subtitles.length})
                                                        </summary>
                                                        <div className="subtitle-list">
                                                            {pubItem.subtitles.map(sub => (
                                                                <div key={sub._id} className="subtitle-tag-container">
                                                                    <span className="subtitle-tag">
                                                                        {sub.name} ({sub.discount}%)
                                                                    </span>
                                                                    <button
                                                                        onClick={() => handleEditSubtitle(sub, pubItem)}
                                                                        className="action-icon-button edit-button"
                                                                        title="Edit Subtitle"
                                                                        disabled={loading}
                                                                    >
                                                                        <FaEdit />
                                                                    </button>
                                                                    <button
                                                                        className="action-icon-button remove-subtitle-btn"
                                                                        onClick={() => handleRemoveSubtitle(sub._id, pubItem._id, sub.name)}
                                                                        title="Remove Subtitle"
                                                                        disabled={loading}
                                                                    >
                                                                        <FaTimes />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </details>
                                                ) : (
                                                    <span>No subtitles</span>
                                                )}
                                            </td>

                                            <td>{pubItem.mobileNumber}</td>
                                            <td>{pubItem.address}</td>
                                            <td>{pubItem.city ? pubItem.city.name : 'N/A'}</td>
                                            <td>
                                                {pubItem.gstin && `${pubItem.gstin}`}
                                            </td>
                                            <td>{pubItem.bank}</td>
                                            <td>{pubItem.accountNumber}</td>
                                            <td>{pubItem.ifsc}</td>
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
                                                    {loading && publicationToDeleteId === pubItem._id ? <FaSpinner className="animate-spin" /> : <FaTrashAlt />}
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
                            <div className="total-records text-center mt-2">
                                Total Records: {filteredPublications.length}
                            </div>
                        </div>
                    )}
                </div>


            </div> {/* End of main-content-layout */}

            {/* Confirmation Modal for Publication Deletion */}
            {showConfirmModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to delete publication: <strong>{publicationToDeleteName}</strong>?</p>
                        <div className="modal-actions">
                            <button onClick={confirmDelete} className="btn btn-danger" disabled={loading}>
                                {loading ? <FaSpinner className="btn-icon-mr animate-spin" /> : 'Delete'}
                            </button>
                            <button onClick={closeConfirmModal} className="btn btn-secondary" disabled={loading}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Subtitle Management Modal */}
            {showSubtitleModal && (
                <div
                    className="modal-backdrop"
                    onClick={closeSubtitleModal} // close on outside click
                >
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()} // prevent close when clicking inside
                    >
                        <h3>{editingSubtitleId ? 'Edit Subtitle' : 'Add Subtitle'}</h3>
                        <form onSubmit={handleAddSubtitle}>
                            <div className="form-group">
                                <label htmlFor="newSubtitleName" className="font-bold">Subtitle Name:</label>
                                <input
                                    type="text"
                                    id="newSubtitleName"
                                    name="newSubtitleName"
                                    value={newSubtitleName}
                                    onChange={(e) => setNewSubtitleName(e.target.value)}
                                    placeholder="e.g., Astreca , Real Life"
                                    required
                                    disabled={subtitleModalLoading}
                                    className="form-input"
                                />
                            </div>

                            {/* Discount input */}
                            <div className="form-group">
                                <label htmlFor="newSubtitleDiscount">Discount (%):</label>
                                <input
                                    type="number"
                                    id="newSubtitleDiscount"
                                    name="newSubtitleDiscount"
                                    value={newSubtitleDiscount}
                                    onChange={(e) => setNewSubtitleDiscount(e.target.value)}
                                    placeholder="e.g., 10"
                                    min="0"
                                    max="100"
                                    disabled={subtitleModalLoading}
                                    className="form-input"
                                />
                            </div>

                            {subtitleModalError && (
                                <p className="error-message text-center">{subtitleModalError}</p>
                            )}

                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary" disabled={subtitleModalLoading}>
                                    {subtitleModalLoading
                                        ? <FaSpinner className="btn-icon-mr animate-spin" />
                                        : (editingSubtitleId ? 'Update Subtitle' : 'Add Subtitle')}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={closeSubtitleModal}
                                    disabled={subtitleModalLoading}
                                >
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