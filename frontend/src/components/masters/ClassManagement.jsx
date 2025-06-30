// src/components/masters/ClassManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api'; // Corrected API import path
import FlashMessage from '../FlashMessage'; // Assuming FlashMessage is directly under src/components
import { FaEdit, FaTrashAlt, FaPlusCircle, FaSearch, FaFilePdf, FaChevronLeft, FaChevronRight } from 'react-icons/fa'; // Icons for actions and new features

// Stylesheets
import '../../styles/Form.css'; // For form styling
import '../../styles/Table.css'; // For table styling
import '../../styles/Modal.css'; // For modal styling

// Import the logo image directly
import companyLogo from '../../assets/glbs-logo.jpg'; 

// NOTE: jsPDF and jspdf-autotable are expected to be loaded globally via CDN in public/index.html
// If you are using npm, you'd do: npm install jspdf jspdf-autotable
// Then import them here:
// import { jsPDF } from 'jspdf';
// import 'jspdf-autotable';


const ClassManagement = ({ showFlashMessage }) => {
    // State for managing list of classes
    const [classes, setClasses] = useState([]);
    // State for form inputs (for creating new or editing existing class)
    const [formData, setFormData] = useState({
        name: '',
        status: 'active', // Default status
    });
    // State for loading indicators
    const [loading, setLoading] = useState(false);
    // State for managing local errors (e.g., form validation)
    const [localError, setLocalError] = useState(null);
    // State to track if we are in edit mode and which class is being edited
    const [editingClassId, setEditingClassId] = useState(null);

    // States for confirmation modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [classToDeleteId, setClassToDeleteId] = useState(null);
    const [classToDeleteName, setClassToDeleteName] = useState('');

    // Ref for scrolling to the new item in the table
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
        // Ensure date is valid before formatting
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-US', options);
    };

    // --- Fetch Classes ---
    const fetchClasses = useCallback(async (scrollToNew = false) => { // Added scrollToNew param
        setLoading(true);
        setLocalError(null); // Clear local errors
        try {
            const response = await api.get('/classes'); // API endpoint to get all classes
            if (response.data.status === 'success') {
                setClasses(response.data.data.classes);
                // After fetching, ensure we are on a valid page (e.g., if items were deleted)
                const totalPages = Math.ceil(response.data.data.classes.length / itemsPerPage);
                if (currentPage > totalPages && totalPages > 0) {
                    setCurrentPage(totalPages); // Go to last page if current page is now out of bounds
                } else if (totalPages === 0) {
                    setCurrentPage(1); // If no items, ensure page 1
                }
                
                if (scrollToNew && tableBodyRef.current) {
                    // Timeout to ensure DOM has updated with new data before scrolling
                    setTimeout(() => {
                        // For auto-scrolling to newly created items, ensure it's on the correct page
                        const lastPageIndex = Math.ceil(response.data.data.classes.length / itemsPerPage);
                        if (currentPage !== lastPageIndex) {
                           setCurrentPage(lastPageIndex); // Move to the page where the new item exists
                           // Set a second timeout to scroll AFTER the page has potentially changed
                           setTimeout(() => {
                                if (tableBodyRef.current.lastElementChild) {
                                    tableBodyRef.current.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
                                } else {
                                    tableBodyRef.current.scrollTop = tableBodyRef.current.scrollHeight;
                                }
                           }, 50); // Small delay after page change
                        } else {
                            if (tableBodyRef.current.lastElementChild) {
                                tableBodyRef.current.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
                            } else {
                                tableBodyRef.current.scrollTop = tableBodyRef.current.scrollHeight;
                            }
                        }
                    }, 100); // Small initial delay for DOM update
                }
            } else {
                setLocalError(response.data.message || 'Failed to fetch classes.');
            }
        } catch (err) {
            console.error('Error fetching classes:', err);
            setLocalError(err.response?.data?.message || 'Failed to load classes due to network error.');
        } finally {
            setLoading(false);
        }
    }, [currentPage]);

    // Fetch classes on component mount
    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    // Debugging useEffect for PDF libraries (now less verbose, as it was confirmed working but for the deprecation warning)
    useEffect(() => {
        console.log("PDF Libraries Check (on mount):");
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
        setLocalError(null); // Clear local errors on submit

        try {
            let response;
            if (editingClassId) {
                // Update existing class
                response = await api.patch(`/classes/${editingClassId}`, formData);
                if (response.data.status === 'success') {
                    showFlashMessage('Class updated successfully!', 'success'); // Using parent's flash message
                } else {
                    throw new Error(response.data.message || 'Failed to update class.');
                }
            } else {
                // Create new class
                response = await api.post('/classes', formData);
                if (response.data.status === 'success') {
                    showFlashMessage('Class created successfully!', 'success'); // Using parent's flash message
                } else {
                    throw new Error(response.data.message || 'Failed to create class.');
                }
            }
            // After successful create/update, clear form, exit edit mode, and refetch classes
            setFormData({ name: '', status: 'active' });
            setEditingClassId(null);
            fetchClasses(true); // Re-fetch and indicate to scroll for new items
        } catch (err) {
            console.error('Error saving class:', err);
            const errorMessage = err.response?.data?.message || 'Failed to save class. Please check your input and ensure class name is unique.';
            setLocalError(errorMessage); // Display local error for form-specific issues
            showFlashMessage(errorMessage, 'error'); // Also send to global flash message
        } finally {
            setLoading(false);
        }
    };

    // --- Edit and Delete Operations ---
    const handleEdit = (classItem) => {
        setFormData({ name: classItem.name, status: classItem.status });
        setEditingClassId(classItem._id);
        setLocalError(null); // Clear any previous local errors when starting edit
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to form
    };

    // Function to open confirmation modal
    const openConfirmModal = (classItem) => {
        setClassToDeleteId(classItem._id);
        setClassToDeleteName(classItem.name);
        setShowConfirmModal(true);
    };

    // Function to close confirmation modal
    const closeConfirmModal = () => {
        setShowConfirmModal(false);
        setClassToDeleteId(null);
        setClassToDeleteName('');
    };

    // Function to confirm and proceed with deletion
    const confirmDelete = async () => {
        setLoading(true);
        setLocalError(null); // Clear local errors
        closeConfirmModal(); // Close modal immediately

        try {
            const response = await api.delete(`/classes/${classToDeleteId}`);
            if (response.status === 204) { // 204 No Content is successful deletion
                showFlashMessage('Class deleted successfully!', 'success'); // Using parent's flash message
                fetchClasses(); // Refetch classes to update the list (no scroll needed for delete)
            } else {
                throw new Error(response.data?.message || 'Failed to delete class.');
            }
        } catch (err) {
            console.error('Error deleting class:', err);
            const errorMessage = err.response?.data?.message || 'Failed to delete class.';
            setLocalError(errorMessage); // Display local error for form-specific issues
            showFlashMessage(errorMessage, 'error'); // Also send to global flash message
        } finally {
            setLoading(false);
        }
    };

    // --- Search Filtering ---
    const filteredClasses = classes.filter(classItem =>
        classItem.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- Pagination Logic ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentClasses = filteredClasses.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);

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
        // 1. **Robust Check for Libraries:** Ensure jsPDF and jspdf-autotable are loaded.
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF !== 'function') {
            showFlashMessage('PDF generation failed: Core libraries are not loaded. Please check your script links.', 'error');
            console.error("PDF generation failed: window.jspdf is not available. Ensure CDNs for jsPDF are correctly linked in your HTML file.");
            return;
        }

        // 2. **Instantiate jsPDF and Check for autoTable Plugin:**
        const doc = new window.jspdf.jsPDF();
        if (typeof doc.autoTable !== 'function') {
            showFlashMessage('PDF generation failed: The table plugin is not loaded. Please check your script links.', 'error');
            console.error("PDF generation failed: doc.autoTable is not a function. Ensure jspdf.plugin.autotable.min.js is linked AFTER jspdf.umd.min.js.");
            return;
        }

        // 3. **Define Company Details:**
        const companyName = "GoodLuck Bharat Schools"; // Full company name for display
        const companyLogoUrl = companyLogo; // Use the imported logo directly
        
        let startYPosition = 45; // A dynamic starting Y position for the table.

        // 4. **Function to Add Header and Content:**
        const addHeaderAndContent = () => {
            // Add a professional title
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 30); // Dark gray for title
            doc.text("Class List Report", doc.internal.pageSize.width / 2, 30, { align: 'center' }); // Centered title

            // Add a line separator below the main title
            doc.setLineWidth(0.5);
            doc.line(14, 35, doc.internal.pageSize.width - 14, 35); // Line spanning almost full width

            // Generate table data
            const tableColumn = ["S.No.", "Class Name", "Status", "Add Date"];
            const tableRows = filteredClasses.map((classItem, index) => [
                // CORRECTED: Ensure S.No. is always index + 1
                (currentPage - 1) * itemsPerPage + index + 1, // Corrected S.No. to reflect current page and index
                classItem.name,
                classItem.status.charAt(0).toUpperCase() + classItem.status.slice(1),
                formatDateWithTime(classItem.createdAt)
            ]);

            // Add the table to the document with professional styling
            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: startYPosition, // Use our dynamic start position
                theme: 'striped',
                styles: {
                    font: 'helvetica',
                    fontSize: 10,
                    cellPadding: 3,
                    textColor: [51, 51, 51], // Default text color for body
                },
                headStyles: {
                    fillColor: [23, 162, 184], // A nice cyan-like color for the header
                    textColor: [255, 255, 255], // White text for header
                    fontStyle: 'bold',
                    halign: 'center', // Center align header text
                    valign: 'middle' // Vertically align header text
                },
                bodyStyles: {
                    // No need to repeat textColor if defined in general styles, but can override here
                },
                columnStyles: {
                    0: { cellWidth: 15, halign: 'center' }, // S.No. column: narrow and centered
                    1: { cellWidth: 'auto', halign: 'left' }, // Class Name column: auto width, left-aligned
                    2: { halign: 'center' }, // Status column: centered
                    3: { halign: 'center' } // Add Date column: centered
                },
                margin: { top: 10, right: 14, bottom: 10, left: 14 }, // Consistent margins
                didDrawPage: function (data) {
                    // Add footer on each page
                    doc.setFontSize(10);
                    doc.setTextColor(100); // Gray color for footer text
                    const pageCount = doc.internal.getNumberOfPages();
                    doc.text(`Page ${data.pageNumber} of ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
                }
            });

            // Save the PDF
            // The toLocaleDateString('en-CA') gives YYYY-MM-DD, then replace hyphens with underscores for filename
            doc.save(`Class_List_${new Date().toLocaleDateString('en-CA').replace(/\//g, '-')}.pdf`); 
            showFlashMessage('Class list downloaded as PDF!', 'success');
        };

        // 5. **Handle Logo Loading Asynchronously:**
        const img = new Image();
        img.crossOrigin = 'Anonymous'; // Important for CORS if using a different domain
        img.onload = () => {
            const logoX = 14; // Left margin for logo
            const logoY = 10; // Top margin for logo
            const imgWidth = 40; // Adjust as needed for your logo size
            const imgHeight = (img.height * imgWidth) / img.width; // Maintain aspect ratio
            
            // Add the logo at the top-left
            // Using 'JPEG' format for a .jpg file. If your logo is actually a PNG, change this back to 'PNG'
            doc.addImage(img, 'JPEG', logoX, logoY, imgWidth, imgHeight); 

            // Add the company name next to the logo
            doc.setFontSize(14); // Slightly smaller for company name next to logo
            doc.setFont('helvetica', 'normal'); // Not too bold here, main title is bold
            doc.setTextColor(50, 50, 50); // Slightly lighter gray for company name
            // Position next to logo, roughly centered vertically relative to the logo's height
            doc.text(companyName, logoX + imgWidth + 5, logoY + (imgHeight / 2) + 2); 

            // Adjust startYPosition for the table based on header content
            // Ensure table starts below the combined height of logo and company name, plus some padding,
            // but not higher than the default startY (45) if logo/name space is small.
            startYPosition = Math.max(logoY + imgHeight + 10, 45); 

            // Now, add the rest of the content
            addHeaderAndContent();
        };

        img.onerror = () => {
            console.warn("Logo image could not be loaded. Generating PDF without logo.");
            // If logo fails, add only the company name at the top left
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 30);
            doc.text(companyName, 14, 20); // Position company name alone
            
            // Adjust the startY for the table since there's no logo
            startYPosition = 35; // Moved up since no logo
            addHeaderAndContent();
        };

        img.src = companyLogoUrl; // This will now use the imported image data
    };

    // --- UI Rendering ---
    return (
        <div className="class-management-container">
            <h2 className="section-title">Class Management</h2>

            {/* Local Error Display - Optional: Can show component-specific errors here */}
            {localError && (
                <p className="error-message text-center">{localError}</p> // Direct error message
            )}

            {/* Class Creation/Update Form */}
            <div className="form-container-card">
                <form onSubmit={handleSubmit} className="app-form">
                    <h3 className="form-title">{editingClassId ? 'Edit Class' : 'Create New Class'}</h3>
                    
                    <div className="form-group">
                        <label htmlFor="name">Class Name:</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g., Class 1, 10th Standard"
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
                            {loading ? (editingClassId ? 'Updating...' : 'Creating...') : (editingClassId ? 'Update Class' : 'Create Class')}
                            <FaPlusCircle className="ml-2" />
                        </button>
                        {editingClassId && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                    setEditingClassId(null);
                                    setFormData({ name: '', status: 'active' });
                                    setLocalError(null); // Clear error on cancel
                                }}
                                disabled={loading}
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Class List Table */}
            <div className="table-container">
                <h3 className="table-title">Existing Classes</h3>

                {/* Search and PDF Download Section */}
                <div className="table-controls">
                    <div className="search-input-group">
                        <input
                            type="text"
                            placeholder="Search by Class Name..."
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

                {loading && classes.length === 0 ? (
                    <p className="loading-state">Loading classes...</p>
                ) : filteredClasses.length === 0 ? (
                    <p className="no-data-message">No classes found matching your criteria. Start by creating one!</p>
                ) : (
                    <>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>S.No.</th>
                                    <th>Class Name</th>
                                    <th>Status</th>
                                    <th>Add Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody ref={tableBodyRef}>
                                {/* Ensured no whitespace text nodes inside <tbody> or <tr> elements */}
                                {currentClasses.map((classItem, index) => (
                                    <tr key={classItem._id}>
                                        <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                        <td>{classItem.name}</td>
                                        <td>
                                            <span className={`status-badge ${classItem.status}`}>
                                                {classItem.status.charAt(0).toUpperCase() + classItem.status.slice(1)}
                                            </span>
                                        </td>
                                        <td>{formatDateWithTime(classItem.createdAt)}</td>
                                        <td className="actions-column">
                                            <button onClick={() => handleEdit(classItem)} className="action-icon-button edit-button" title="Edit Class">
                                                <FaEdit />
                                            </button>
                                            <button onClick={() => openConfirmModal(classItem)} className="action-icon-button delete-button" title="Delete Class">
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
                        <p>Are you sure you want to delete class: <strong>{classToDeleteName}</strong>?</p>
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

export default ClassManagement;