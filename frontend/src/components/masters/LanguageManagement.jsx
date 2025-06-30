// src/components/masters/LanguageManagement.jsx
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

    // States for confirmation modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [languageToDeleteId, setLanguageToDeleteId] = useState(null);
    const [languageToDeleteName, setLanguageToDeleteName] = useState('');

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

    // --- Fetch Languages ---
    const fetchLanguages = useCallback(async (scrollToNew = false) => {
        setLoading(true);
        setLocalError(null);
        try {
            const response = await api.get(`/languages`); // Fetch all languages
            if (response.data.status === 'success') {
                setLanguages(response.data.data.languages);
                
                // Client-side pagination adjustment
                const totalPagesCalculated = Math.ceil(response.data.data.languages.length / itemsPerPage);
                if (currentPage > totalPagesCalculated && totalPagesCalculated > 0) {
                    setCurrentPage(totalPagesCalculated);
                } else if (response.data.data.languages.length === 0) {
                    setCurrentPage(1);
                }
                
                if (scrollToNew && tableBodyRef.current) {
                    setTimeout(() => {
                        const lastPageIndex = Math.ceil(response.data.data.languages.length / itemsPerPage);
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
                setLocalError(response.data.message || 'Failed to fetch languages.');
            }
        } catch (err) {
            console.error('Error fetching languages:', err);
            setLocalError(err.response?.data?.message || 'Failed to load languages due to network error.');
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage]); // Re-fetch when page or itemsPerPage changes

    // Fetch languages on component mount
    useEffect(() => {
        fetchLanguages();
    }, [fetchLanguages]);


    // Debugging useEffect for PDF libraries
    useEffect(() => {
        console.log("PDF Libraries Check (LanguageManagement):");
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

        try {
            let response;
            if (editingLanguageId) {
                // Update existing language
                response = await api.patch(`/languages/${editingLanguageId}`, formData);
                if (response.data.status === 'success') {
                    showFlashMessage('Language updated successfully!', 'success');
                } else {
                    throw new Error(response.data.message || 'Failed to update language.');
                }
            } else {
                // Create new language
                response = await api.post('/languages', formData);
                if (response.data.status === 'success') {
                    showFlashMessage('Language created successfully!', 'success');
                } else {
                    throw new Error(response.data.message || 'Failed to create language.');
                }
            }
            // Reset form and re-fetch languages
            setFormData({
                name: '',
                status: 'active',
            });
            setEditingLanguageId(null);
            fetchLanguages(true); // Re-fetch and indicate to scroll
        } catch (err) {
            console.error('Error saving language:', err);
            const errorMessage = err.response?.data?.message || 'Failed to save language. Please check your input and ensure language name is unique.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Edit and Delete Operations ---
    const handleEdit = (languageItem) => {
        setFormData({
            name: languageItem.name,
            status: languageItem.status,
        });
        setEditingLanguageId(languageItem._id);
        setLocalError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to form
    };

    const openConfirmModal = (languageItem) => {
        setLanguageToDeleteId(languageItem._id);
        setLanguageToDeleteName(languageItem.name);
        setShowConfirmModal(true);
    };

    const closeConfirmModal = () => {
        setShowConfirmModal(false);
        setLanguageToDeleteId(null);
        setLanguageToDeleteName('');
    };

    const confirmDelete = async () => {
        setLoading(true);
        setLocalError(null);
        closeConfirmModal();

        try {
            const response = await api.delete(`/languages/${languageToDeleteId}`);
            if (response.status === 204) { // 204 No Content for successful deletion
                showFlashMessage('Language deleted successfully!', 'success');
                fetchLanguages(); // Re-fetch languages to update the list
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

    // --- Search Filtering ---
    const filteredLanguages = languages.filter(languageItem =>
        languageItem.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- Pagination Logic ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentLanguages = filteredLanguages.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredLanguages.length / itemsPerPage);

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

        doc.text("Language List", 14, 15);

        const tableColumn = [
            "S.No.", "Name", "Add Date", "Status"
        ];
        const tableRows = [];

        filteredLanguages.forEach((langItem, index) => {
            const langData = [
                index + 1,
                langItem.name,
                formatDateWithTime(langItem.createdAt),
                langItem.status.charAt(0).toUpperCase() + langItem.status.slice(1)
            ];
            tableRows.push(langData);
        });

        doc.autoTable(tableColumn, tableRows, { startY: 20 });
        doc.save(`Language_List_${new Date().toLocaleDateString()}.pdf`);
        showFlashMessage('Language list downloaded as PDF!', 'success');
    };

    // --- UI Rendering ---
    return (
        <div className="language-management-container">
            <h2 className="section-title">Language Management</h2>

            {localError && (
                <p className="error-message text-center">{localError}</p>
            )}

            {/* Language Creation/Update Form */}
            <div className="form-container-card">
                <form onSubmit={handleSubmit} className="app-form">
                    <h3 className="form-title">{editingLanguageId ? 'Edit Language' : 'Add Language'}</h3>
                    
                    <div className="form-row"> {/* Use form-row for multi-column layout */}
                        <div className="form-group">
                            <label htmlFor="name">Language Name:</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g., English, Hindi"
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
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? (editingLanguageId ? 'Updating...' : 'Adding...') : (editingLanguageId ? 'Update Language' : 'Add Language')}
                            <FaPlusCircle className="ml-2" />
                        </button>
                        {editingLanguageId && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                    setEditingLanguageId(null);
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

            {/* Language List Table */}
            <div className="table-container">
                <h3 className="table-title">Existing Languages</h3>

                {/* Search and PDF Download Section */}
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
                    <button onClick={downloadPdf} className="btn btn-info download-pdf-btn">
                        <FaFilePdf className="mr-2" /> Download PDF
                    </button>
                </div>

                {loading && languages.length === 0 ? (
                    <p className="loading-state">Loading languages...</p>
                ) : filteredLanguages.length === 0 ? (
                    <p className="no-data-message">No languages found matching your criteria. Start by adding one!</p>
                ) : (
                    <>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>S.No.</th>
                                    <th>Name</th>
                                    <th>Add Date</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody ref={tableBodyRef}>
                                {currentLanguages.map((langItem, index) => (
                                    <tr key={langItem._id}>
                                        <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                        <td>{langItem.name}</td>
                                        <td>{formatDateWithTime(langItem.createdAt)}</td>
                                        <td>
                                            <span className={`status-badge ${langItem.status}`}>
                                                {langItem.status.charAt(0).toUpperCase() + langItem.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="actions-column">
                                            <button
                                                onClick={() => handleEdit(langItem)}
                                                className="action-icon-button edit-button"
                                                title="Edit Language"
                                                disabled={loading}
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => openConfirmModal(langItem)}
                                                className="action-icon-button delete-button"
                                                title="Delete Language"
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

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to delete language: <strong>{languageToDeleteName}</strong>?</p>
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

export default LanguageManagement;
