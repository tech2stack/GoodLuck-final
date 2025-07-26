// src/components/masters/ClassManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api';
import FlashMessage from '../FlashMessage'; // Assuming FlashMessage is directly under src/components
import { FaEdit, FaTrashAlt, FaPlusCircle, FaSearch, FaFilePdf, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// Import new common components
import PageLayout from '../common/PageLayout';
import TableSection from '../common/TableSection';
import FormSection from '../common/FormSection';
import ConfirmationModal from '../common/ConfirmationModal';

// Stylesheets (generic ones for elements, specific for layout overrides)
import '../../styles/Form.css'; // Generic form styles
import '../../styles/Table.css'; // Generic table styles
import '../../styles/Modal.css'; // Generic modal styles
import '../../styles/ClassManagement.css'; // Component-specific layout overrides
import '../../styles/CommonLayout.css'; // Ensure CommonLayout is imported

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
    // FIX: Correctly initialize setClassToDeleteName with useState
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
        setClassToDeleteName(classItem.name); // This will now correctly call the state setter
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
        const companyName = "GOOD LUCK BOOK STORE"; // Full company name for display
        const companyAddress = "Shop NO. 2, Shriji Tower, Ashoka Garden, Bhopal";
        const companyMobile = "Mobile Number: 7024136476";
        const companyGST = "GST NO: 23EAVPP3772F1Z8";
        const companyLogoUrl = companyLogo; // Use the imported logo directly
        
        // Function to generate the main report content (title, line, table, save)
        // This function now accepts the dynamic startYPositionForTable as an argument
        const generateReportBody = (startYPositionForTable) => {
            // Add a professional report title (centered, below company info)
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 30); // Dark gray for title
            // Adjust Y position for the report title to be below company info
            doc.text("Class List Report", doc.internal.pageSize.width / 2, startYPositionForTable + 10, { align: 'center' }); 

            // Add a line separator below the main title
            doc.setLineWidth(0.5);
            doc.line(14, startYPositionForTable + 15, doc.internal.pageSize.width - 14, startYPositionForTable + 15); // Line spanning almost full width

            // Update startYPositionForTable for autoTable
            const tableStartY = startYPositionForTable + 20;


            // Generate table data
            const tableColumn = ["S.No.", "Class Name", "Status", "Add Date"];
            const tableRows = filteredClasses.map((classItem, index) => [
                // S.No. is always index + 1 for the filtered data for PDF
                index + 1, 
                classItem.name,
                classItem.status.charAt(0).toUpperCase() + classItem.status.slice(1),
                formatDateWithTime(classItem.createdAt)
            ]);

            // Add the table to the document with professional styling
            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: tableStartY, // Use our dynamic start position
                theme: 'plain', // Changed to 'plain' for a cleaner look like the reference PDF
                styles: {
                    font: 'helvetica',
                    fontSize: 10,
                    cellPadding: 3,
                    textColor: [51, 51, 51], // Default text color for body
                    valign: 'middle',
                    halign: 'left'
                },
                headStyles: {
                    fillColor: [240, 240, 240], // Light gray header
                    textColor: [51, 51, 51], // Dark text for header
                    fontStyle: 'bold',
                    halign: 'center', // Center align header text
                    valign: 'middle', // Vertically align header text
                    lineWidth: 0.1, // Add a thin border to header cells
                    lineColor: [200, 200, 200] // Light gray border
                },
                bodyStyles: {
                    lineWidth: 0.1, // Add a thin border to body cells
                    lineColor: [200, 200, 200] // Light gray border
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
            doc.addImage(img, 'JPEG', logoX, logoY, imgWidth, imgHeight); 
            
            // Add company name and details next to logo
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 30);
            doc.text(companyName, logoX + imgWidth + 5, logoY + 5); // Company Name
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(50, 50, 50);
            doc.text(companyAddress, logoX + imgWidth + 5, logoY + 12); // Address
            doc.text(companyMobile, logoX + imgWidth + 5, logoY + 17); // Mobile
            doc.text(companyGST, logoX + imgWidth + 5, logoY + 22); // GST No.

            // Calculate startYPositionForTable based on logo and company info block
            const calculatedStartY = Math.max(logoY + imgHeight + 10, logoY + 22 + 10); // Ensure enough space
            generateReportBody(calculatedStartY); // Pass the calculated Y position
        };

        img.onerror = () => {
            console.warn("Logo image could not be loaded. Generating PDF without logo.");
            // If logo fails, add only company info block
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 30);
            doc.text(companyName, 14, 20); // Company Name
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(50, 50, 50);
            doc.text(companyAddress, 14, 27); // Address
            doc.text(companyMobile, 14, 32); // Mobile
            doc.text(companyGST, 14, 37); // GST No.
            
            const calculatedStartY = 45; // Adjust startY since no logo
            generateReportBody(calculatedStartY); // Pass the calculated Y position
        };

        img.src = companyLogoUrl; // This will now use the imported image data

        // Add generation date/time to the top right (this part can run immediately)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100); // Gray color for date text
        doc.text(`Date: ${formatDateWithTime(new Date())}`, doc.internal.pageSize.width - 14, 20, { align: 'right' });
    };

    // --- UI Rendering ---
    return (
        <PageLayout title="Class Management" errorMessage={localError}>
            {/* Table Section - Left Side */}
            <TableSection
                sectionTitle="Existing Classes"
                searchTerm={searchTerm}
                onSearchChange={(e) => setSearchTerm(e.target.value)}
                onDownloadPdf={downloadPdf} // Pass the updated downloadPdf function
                loading={loading}
                data={filteredClasses}
                renderTableContent={() => (
                    <>
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
                    </>
                )}
                currentPage={currentPage}
                totalPages={totalPages}
                goToPrevPage={goToPrevPage}
                goToNextPage={goToNextPage}
                itemsPerPage={itemsPerPage}
                tableBodyRef={tableBodyRef}
            />

            {/* Form Section - Right Side */}
            <FormSection
                sectionTitle={editingClassId ? 'Edit Class' : 'Add Class'}
                onSubmit={handleSubmit}
            >
                <div className="form-group">
                    <label htmlFor="name" className="form-label">Class Name:</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g., Class 1, 10th Standard"
                        required
                        disabled={loading}
                        className="form-input"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="status" className="form-label">Status:</label>
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
                        {loading ? (editingClassId ? 'Updating...' : 'Adding...') : (editingClassId ? 'Update Class' : 'Add Class')}
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
            </FormSection>

            {/* Confirmation Modal */}
            <ConfirmationModal
                show={showConfirmModal}
                title="Confirm Deletion"
                message={`Are you sure you want to delete class: ${classToDeleteName}?`}
                onConfirm={confirmDelete}
                onCancel={closeConfirmModal}
                confirmText="Delete"
                cancelText="Cancel"
                loading={loading}
            />
        </PageLayout>
    );
};

export default ClassManagement;
