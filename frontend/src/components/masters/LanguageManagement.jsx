// src/components/masters/LanguageManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api'; // API utility for backend calls
import { FaEdit, FaTrashAlt, FaPlusCircle, FaSearch, FaFilePdf, FaChevronLeft, FaChevronRight, FaSpinner, FaTimesCircle } from 'react-icons/fa'; // Icons for UI

// Stylesheets (assuming these are already present and styled for consistency)
import '../../styles/Form.css';
import '../../styles/Table.css';
import '../../styles/Modal.css';

// Import the logo image directly (assuming it exists at this path)
import companyLogo from '../../assets/glbs-logo.jpg';
import { addHeaderAndSetStartY, addReportTitle, addTableToDoc } from '../../utils/pdfTheme';


const LanguageManagement = ({ showFlashMessage }) => {
    // State for managing list of languages
    const [languages, setLanguages] = useState([]);
    // State for form inputs (for creating new or editing existing language)
    const [formData, setFormData] = useState({
        name: '',
        status: 'active', // Default status
    });
    // State for loading indicators
    const [loading, setLoading] = useState(false);
    // State for managing local errors (e.g., form validation)
    const [localError, setLocalError] = useState(null);
    // State to track if we are in edit mode and which language is being edited
    const [editingLanguageId, setEditingLanguageId] = useState(null);
    // NEW: State to track the ID of the newly added language for highlighting
    const [highlightedLanguageId, setHighlightedLanguageId] = useState(null);

    // State for managing the confirmation modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [languageToDeleteId, setLanguageToDeleteId] = useState(null);
    const [languageToDeleteName, setLanguageToDeleteName] = useState('');

    // Ref for the table body to trigger scroll
    const tableBodyRef = useRef(null);

    // State for search and pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Helper function to format date
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

    // Fetch languages from the API
    const fetchLanguages = useCallback(async () => {
        setLoading(true);
        setLocalError(null);
        try {
            const response = await api.get('/languages');
            if (response.data.status === 'success') {
                const sorted = response.data.data.languages.sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                );
                setLanguages(sorted);
                const totalPages = Math.ceil(sorted.length / itemsPerPage);
                if (currentPage > totalPages && totalPages > 0) {
                    setCurrentPage(totalPages);
                } else if (totalPages === 0) {
                    setCurrentPage(1);
                }
            } else {
                setLocalError(response.data.message || 'Failed to fetch languages.');
            }
        } catch (err) {
            console.error('Error fetching languages:', err);
            setLocalError(err.response?.data?.message || 'Failed to load languages due to network error.');
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage]);

    // Fetch languages on component mount
    useEffect(() => {
        fetchLanguages();
    }, [fetchLanguages]);

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle form submission (create or update)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setLocalError(null);

        if (!formData.name.trim()) {
            setLocalError('Language name is required.');
            showFlashMessage('Language name is required.', 'error');
            setLoading(false);
            return;
        }

        try {
            let response;
            if (editingLanguageId) {
                // Update case
                response = await api.patch(`/languages/${editingLanguageId}`, formData);
                if (response.data.status === 'success') {
                    showFlashMessage('Language updated successfully!', 'success');
                    // Directly update the state with the new language instead of re-fetching everything
                    setLanguages(prev => prev.map(lang =>
                        lang._id === editingLanguageId ? { ...lang, ...response.data.data.language } : lang
                    ));
                } else {
                    throw new Error(response.data.message || 'Failed to update language.');
                }
            } else {
                // Create case
                response = await api.post('/languages', formData);
                if (response.data.status === 'success') {
                    showFlashMessage('Language created successfully!', 'success');
                    const newLanguage = response.data.data.language;
                    // Directly update the state with the new language instead of re-fetching everything
                    setLanguages(prev => [newLanguage, ...prev]);
                    // NEW: Highlight the new entry
                    setHighlightedLanguageId(newLanguage._id);
                    setCurrentPage(1); // Reset to page 1 to show the new entry
                } else {
                    throw new Error(response.data.message || 'Failed to create language.');
                }
            }
            // NEW: Scroll to the top after submission for both create and update
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Reset form and edit state
            setFormData({
                name: '',
                status: 'active',
            });
            setEditingLanguageId(null);
            // We no longer need to call fetchLanguages() here as we update the state directly
        } catch (err) {
            console.error('Error saving language:', err);
            const errorMessage = err.response?.data?.message || 'Failed to save language. Please check your input.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle edit button click
    const handleEdit = (languageItem) => {
        setFormData({
            name: languageItem.name,
            status: languageItem.status,
        });
        setEditingLanguageId(languageItem._id);
        setLocalError(null);
        // NEW: Clear highlight on edit
        setHighlightedLanguageId(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Handle delete button click
    const openConfirmModal = (languageItem) => {
        setLanguageToDeleteId(languageItem._id);
        setLanguageToDeleteName(languageItem.name);
        setShowConfirmModal(true);
    };

    // Close the confirmation modal
    const closeConfirmModal = () => {
        setShowConfirmModal(false);
        setLanguageToDeleteId(null);
        setLanguageToDeleteName('');
    };

    // Confirm and perform deletion
    const confirmDelete = async () => {
        setLoading(true);
        setLocalError(null);
        closeConfirmModal();

        try {
            const response = await api.delete(`/languages/${languageToDeleteId}`);
            if (response.status === 204) {
                showFlashMessage('Language deleted successfully!', 'success');
                // Filter out the deleted language directly from the state
                setLanguages(prev => prev.filter(lang => lang._id !== languageToDeleteId));
            } else {
                throw new Error(response.data?.message || 'Failed to delete language.');
            }
        } catch (err) {
            console.error('Error deleting language:', err);
            const errorMessage = err.response?.data?.message || 'Failed to delete language.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle cancel edit button click
    const handleCancelEdit = () => {
        setFormData({ name: '', status: 'active' });
        setEditingLanguageId(null);
        setLocalError(null);
        // NEW: Clear highlight on cancel edit
        setHighlightedLanguageId(null);
    };

    // Filter languages based on search term
    const filteredLanguages = languages.filter(language =>
        language.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentLanguages = filteredLanguages.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredLanguages.length / itemsPerPage);

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

    // PDF Download Functionality
    const downloadPdf = () => {
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF !== 'function') {
            showFlashMessage('PDF generation failed: Core libraries are not loaded. Please check your script links.', 'error');
            console.error("PDF generation failed: window.jspdf is not available.");
            return;
        }

        const doc = new window.jspdf.jsPDF();

        let startY = addHeaderAndSetStartY(doc, companyLogo, 25, 22);
        startY = addReportTitle(doc, startY, "Language List Report");

        const tableColumn = ["S.No.", "Language Name", "Status", "Created Date"];
        const tableRows = filteredLanguages.map((lang, index) => [
            index + 1,
            lang.name,
            lang.status,
            formatDateWithTime(lang.createdAt)
        ]);

        addTableToDoc(doc, tableColumn, tableRows, startY);

        doc.save(`Language_List_${new Date().toLocaleDateString('en-CA').replace(/\//g, '-')}.pdf`);
        showFlashMessage('Languages list downloaded as PDF!', 'success');
    };

    return (
        <div className="language-management-container">
            <h2 className="main-section-title">Language Management</h2>

            {localError && (
                <p className="error-message text-center">{localError}</p>
            )}

            <div className="main-content-layout">
                {/* Language Creation/Update Form */}
                <div className="form-container-card">
                    <form onSubmit={handleSubmit} className="app-form">
                        <h3 className="form-title">{editingLanguageId ? 'Edit Language' : 'Add Language'}</h3>
                        <div className="form-group">
                            <label htmlFor="name">Language Name:</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g., Hindi, English"
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
                                {loading ? <FaSpinner className="btn-icon-mr animate-spin" /> : (editingLanguageId ? 'Update Language' : 'Add Language')}
                            </button>
                            {editingLanguageId && (
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

                {/* Language List Table */}
                <div className="table-section">
                    <div className="table-controls">
                        <div className="search-input-group">
                            <input
                                type="text"
                                placeholder="Search by Language Name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                            <FaSearch className="search-icon" />
                        </div>
                        <button
                            onClick={downloadPdf}
                            className="btn btn-info download-pdf-btn"
                            disabled={loading || filteredLanguages.length === 0}
                        >
                            <FaFilePdf className="mr-2" /> Download PDF
                        </button>
                    </div>

                    <div className="table-container">
                        <table className="app-table">
                            <thead>
                                <tr>
                                    <th>S.No.</th>
                                    <th>Language Name</th>
                                    <th>Status</th>
                                    <th>Add Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody ref={tableBodyRef}>
                                {filteredLanguages.length > 0 ? (
                                    currentLanguages.map((languageItem, index) => (
                                        // NEW: Apply highlight class to the row if it matches the highlighted ID
                                        <tr key={languageItem._id} className={languageItem._id === highlightedLanguageId ? 'animate-highlight' : ''}>
                                            <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                            <td>{languageItem.name}</td>
                                            <td>
                                                <span className={`status-badge ${languageItem.status}`}>
                                                    {languageItem.status.charAt(0).toUpperCase() + languageItem.status.slice(1)}
                                                </span>
                                            </td>
                                            <td>{formatDateWithTime(languageItem.createdAt)}</td>
                                            <td className="actions-column">
                                                <button
                                                    onClick={() => handleEdit(languageItem)}
                                                    className="action-icon-button edit-button"
                                                    title="Edit Language"
                                                    disabled={loading}
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => openConfirmModal(languageItem)}
                                                    className="action-icon-button delete-button"
                                                    title="Delete Language"
                                                    disabled={loading}
                                                >
                                                    {loading && languageToDeleteId === languageItem._id ? <FaSpinner className="animate-spin" /> : <FaTrashAlt />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        {/* Show "No languages found" message if no data exists */}
                                        <td colSpan="5" className="no-data-message text-center">No languages found matching your criteria.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {filteredLanguages.length > 0 && totalPages > 1 && (
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
                        Total Records: {filteredLanguages.length}
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to delete language: <strong>{languageToDeleteName}</strong>?</p>
                        <div className="modal-actions">
                            <button onClick={confirmDelete} className="btn btn-danger" disabled={loading}>
                                {loading && languageToDeleteId === languageToDeleteId ? <FaSpinner className="icon animate-spin" /> : 'Delete'}
                            </button>
                            <button onClick={closeConfirmModal} className="btn btn-secondary" disabled={loading}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LanguageManagement;