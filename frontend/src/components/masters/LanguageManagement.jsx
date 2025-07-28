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
                
                // Client-client side pagination adjustment
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
        console.log("PDF Libraries Check (LanguageManagement):", typeof window.jspdf);
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

        // Basic validation for required fields
        if (!formData.name.trim()) {
            setLocalError('Language name cannot be empty.');
            showFlashMessage('Language name cannot be empty.', 'error');
            setLoading(false);
            return;
        }

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

    const handleCancelEdit = () => {
        setFormData({ name: '', status: 'active' });
        setEditingLanguageId(null);
        setLocalError(null);
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

        const doc = new window.jspdf.jsPDF(); // Default is 'portrait'
        
        if (typeof doc.autoTable !== 'function') {
            showFlashMessage('PDF Table plugin (jspdf-autotable) not loaded or accessible. Check console for details.', 'error');
            console.error("PDF generation failed: doc.autoTable is not a function. Ensure jspdf.plugin.autotable.min.js is correctly linked and loaded AFTER jspdf.umd.min.js.");
            return;
        }

        // Define company details for PDF header
        const companyName = "GOOD LUCK BOOK STORE";
        const companyAddress = "Shop NO. 2, Shriji Tower, Ashoka Garden, Bhopal";
        const companyMobile = "Mobile Number: 7024136476";
        const companyGST = "GST NO: 23EAVPP3772F1Z8";
        const companyLogoUrl = companyLogo; // Use the imported logo directly
        
        // Function to generate the main report content (title, line, table, save)
        const generateReportBody = (startYPositionForTable) => {
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 30);
            doc.text("Language List Report", doc.internal.pageSize.width / 2, startYPositionForTable + 10, { align: 'center' }); 

            doc.setLineWidth(0.5);
            doc.line(14, startYPositionForTable + 15, doc.internal.pageSize.width - 14, startYPositionForTable + 15);

            const tableStartY = startYPositionForTable + 20;

            const tableColumn = [
                "S.No.", "Name", "Add Date", "Status"
            ];
            const tableRows = filteredLanguages.map((langItem, index) => [
                index + 1, 
                langItem.name,
                formatDateWithTime(langItem.createdAt),
                langItem.status.charAt(0).toUpperCase() + langItem.status.slice(1)
            ]);

            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: tableStartY,
                theme: 'plain',
                styles: {
                    font: 'helvetica',
                    fontSize: 10,
                    cellPadding: 3,
                    textColor: [51, 51, 51],
                    valign: 'middle',
                    halign: 'left'
                },
                headStyles: {
                    fillColor: [240, 240, 240],
                    textColor: [51, 51, 51],
                    fontStyle: 'bold',
                    halign: 'center',
                    valign: 'middle',
                    lineWidth: 0.1,
                    lineColor: [200, 200, 200]
                },
                bodyStyles: {
                    lineWidth: 0.1,
                    lineColor: [200, 200, 200]
                },
                columnStyles: {
                    0: { cellWidth: 15, halign: 'center' }, 1: { cellWidth: 'auto', halign: 'left' },
                    2: { halign: 'center' }, 3: { halign: 'center' }
                },
                margin: { top: 10, right: 14, bottom: 10, left: 14 },
                didDrawPage: function (data) {
                    doc.setFontSize(10);
                    doc.setTextColor(100);
                    const pageCount = doc.internal.getNumberOfPages();
                    doc.text(`Page ${data.pageNumber} of ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
                }
            });
            doc.save(`Language_List_${new Date().toLocaleDateString('en-CA').replace(/\//g, '-')}.pdf`);
            showFlashMessage('Language list downloaded as PDF!', 'success');
        };

        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const logoX = 14;
            const logoY = 10;
            const imgWidth = 40;
            const imgHeight = (img.height * imgWidth) / img.width;
            
            doc.addImage(img, 'JPEG', logoX, logoY, imgWidth, imgHeight); 
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 30);
            doc.text(companyName, logoX + imgWidth + 5, logoY + 5);
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(50, 50, 50);
            doc.text(companyAddress, logoX + imgWidth + 5, logoY + 12);
            doc.text(companyMobile, logoX + imgWidth + 5, logoY + 17);
            doc.text(companyGST, logoX + imgWidth + 5, logoY + 22);

            const calculatedStartY = Math.max(logoY + imgHeight + 10, logoY + 22 + 10);
            generateReportBody(calculatedStartY);
        };

        img.onerror = () => {
            console.warn("Logo image could not be loaded. Generating PDF without logo.");
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 30);
            doc.text(companyName, 14, 20);
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(50, 50, 50);
            doc.text(companyAddress, 14, 27);
            doc.text(companyMobile, 14, 32);
            doc.text(companyGST, 14, 37);
            
            const calculatedStartY = 45;
            generateReportBody(calculatedStartY);
        };

        img.src = companyLogoUrl;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Date: ${formatDateWithTime(new Date())}`, doc.internal.pageSize.width - 14, 20, { align: 'right' });
    };

    // --- UI Rendering ---
    return (
        <div className="language-management-container"> {/* This can be a general container or custom for this page */}
            <h2 className="main-table-header">Language Management</h2> {/* Changed to main-table-header */}

            {localError && (
                <p className="error-message text-center">{localError}</p>
            )}

            <div className="main-content-layout">
                <div className="table-container"> {/* Use table-container for the entire table wrapper */}
                    <h3 className="table-title">Existing Languages</h3> {/* Specific title for table */}

                    <div className="table-controls">
                        <div className="search-input-group">
                            <FaSearch className="search-icon" /> {/* Icon placed before input */}
                            <input
                                type="text"
                                placeholder="Search by Language Name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input" /* Corrected: className inside the input tag */
                                disabled={loading} // Disable search while loading
                            />
                        </div>
                        <button onClick={downloadPdf} className="download-pdf-btn" disabled={loading || filteredLanguages.length === 0}>
                            <FaFilePdf className="icon" /> Download PDF {/* Use 'icon' class for consistent styling */}
                        </button>
                    </div>

                    {loading && languages.length === 0 ? (
                        <p className="loading-state text-center">
                            <FaSpinner className="animate-spin mr-2" /> Loading languages...
                        </p>
                    ) : filteredLanguages.length === 0 ? (
                        <p className="no-data-message text-center">No languages found matching your criteria. Start by adding one!</p>
                    ) : (
                        <>
                            <table className="app-table"> {/* Use app-table as defined in Table.css */}
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
                                                    <FaEdit className="icon" /> {/* Use 'icon' class for consistent styling */}
                                                </button>
                                                <button
                                                    onClick={() => openConfirmModal(langItem)}
                                                    className="action-icon-button delete-button"
                                                    title="Delete Language"
                                                    disabled={loading}
                                                >
                                                    {loading && languageToDeleteId === langItem._id ? <FaSpinner className="icon animate-spin" /> : <FaTrashAlt className="icon" />} {/* Apply 'icon' class */}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="pagination-controls">
                                    <button onClick={goToPrevPage} disabled={currentPage === 1 || loading} className="btn-page"> {/* No 'btn' class needed here, use btn-page for pagination buttons */}
                                        <FaChevronLeft className="icon" /> Previous
                                    </button>
                                    <span>Page {currentPage} of {totalPages}</span>
                                    <button onClick={goToNextPage} disabled={currentPage === totalPages || loading} className="btn-page"> {/* No 'btn' class needed here */}
                                        Next <FaChevronRight className="icon" />
                                    </button>
                                </div>
                            )}
                            <div className="total-records text-center mt-2"> {/* Added text-center as per typical utility classes */}
                                Total Records: {filteredLanguages.length}
                            </div>
                        </>
                    )}
                </div>

                {/* Language Creation/Update Form - SECOND CHILD */}
                <div className="form-container-card"> {/* This class should be defined in Form.css */}
                    <form onSubmit={handleSubmit} className="app-form"> {/* Use app-form as defined in Form.css */}
                        <h3 className="form-title">{editingLanguageId ? 'Edit Language' : 'Add Language'}</h3>
                        
                        <div className="form-row"> {/* Use form-row for multi-column layout */}
                            <div className="form-group"> {/* Use form-group */}
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
                                    className="form-input" // Corrected: All attributes must be within the same opening tag
                                />
                            </div>
                            <div className="form-group"> {/* Use form-group */}
                                <label htmlFor="status">Status:</label>
                                <select
                                    id="status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="form-select" /* Use form-select */
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-actions"> {/* Use form-actions */}
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? (editingLanguageId ? 'Updating...' : 'Adding...') : (editingLanguageId ? 'Update Language' : 'Add Language')}
                                <FaPlusCircle className="icon ml-2" /> {/* Use 'icon' class and ml-2 */}
                            </button>
                            {editingLanguageId && (
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleCancelEdit}
                                    disabled={loading}
                                >
                                    <FaTimesCircle className="icon mr-2" /> Cancel Edit {/* Added FaTimesCircle icon and mr-2 */}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div> {/* End of main-content-layout */}

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to delete language: <strong>{languageToDeleteName}</strong>?</p>
                        <div className="modal-actions">
                            <button onClick={confirmDelete} className="btn btn-danger" disabled={loading}>
                                {loading && languageToDeleteId === languageToDeleteId ? <FaSpinner className="icon animate-spin" /> : 'Delete'} {/* Added loading spinner */}
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