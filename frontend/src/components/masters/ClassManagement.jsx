// src/components/masters/ClassManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api';
import useDataFetching from '../../hooks/useDataFetching'; // NEW: Import the custom hook
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
import '../../styles/CommonLayout.css'; // Ensure CommonLayout is imported

// Import the logo image directly
import companyLogo from '../../assets/glbs-logo.jpg';

// NOTE: jsPDF and jspdf-autotable are expected to be loaded globally via CDN in public/index.html
// If you are using npm, you'd do: npm install jspdf jspdf-autotable
// Then import them here:
// import { jsPDF } from 'jspdf';
// import 'jspdf-autotable';


const ClassManagement = ({ showFlashMessage }) => {
    // NEW: Use the custom hook to fetch all classes.
    // The data is automatically managed, along with loading and error states.
    const { data: classesData, loading, error, refetch } = useDataFetching('/classes');
    const classes = classesData?.data?.classes || []; // Extract the classes array or default to an empty array

    // State for form inputs (for creating new or editing existing class)
    const [formData, setFormData] = useState({
        name: '',
        status: 'active', // Default status
    });
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
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-US', options);
    };

    // NOTE: The useEffect to fetch data on component mount is now handled inside useDataFetching hook.
    // We only need a useEffect to handle pagination when the data changes.
    useEffect(() => {
        const totalPages = Math.ceil(classes.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        } else if (totalPages === 0) {
            setCurrentPage(1);
        }
    }, [classes, itemsPerPage]);

    // --- Form Handling ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
            // NEW: Use refetch from the hook to update the list
            await refetch();
        } catch (err) {
            console.error('Error saving class:', err);
            const errorMessage = err.response?.data?.message || 'Failed to save class. Please check your input and ensure class name is unique.';
            showFlashMessage(errorMessage, 'error'); // Also send to global flash message
        }
    };

    // --- Edit and Delete Operations ---
    const handleEdit = (classItem) => {
        setFormData({ name: classItem.name, status: classItem.status });
        setEditingClassId(classItem._id);
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
        closeConfirmModal(); // Close modal immediately

        try {
            const response = await api.delete(`/classes/${classToDeleteId}`);
            if (response.status === 204) { // 204 No Content is successful deletion
                showFlashMessage('Class deleted successfully!', 'success'); // Using parent's flash message
                // NEW: Use refetch from the hook to update the list
                await refetch();
            } else {
                throw new Error(response.data?.message || 'Failed to delete class.');
            }
        } catch (err) {
            console.error('Error deleting class:', err);
            const errorMessage = err.response?.data?.message || 'Failed to delete class.';
            showFlashMessage(errorMessage, 'error'); // Also send to global flash message
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
        
        const generateReportBody = (startYPositionForTable) => {
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 30);
            doc.text("Class List Report", doc.internal.pageSize.width / 2, startYPositionForTable + 10, { align: 'center' }); 

            doc.setLineWidth(0.5);
            doc.line(14, startYPositionForTable + 15, doc.internal.pageSize.width - 14, startYPositionForTable + 15);

            const tableStartY = startYPositionForTable + 20;

            // Generate table data
            const tableColumn = ["S.No.", "Class Name", "Status", "Add Date"]; // NEW: Add 'Add Date' column
            const tableRows = filteredClasses.map((classItem, index) => [
                index + 1, 
                classItem.name,
                classItem.status.charAt(0).toUpperCase() + classItem.status.slice(1),
                formatDateWithTime(classItem.createdAt) // NEW: Add creation date
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
                    0: { cellWidth: 15, halign: 'center' },
                    1: { cellWidth: 'auto', halign: 'left' },
                    2: { halign: 'center' },
                    3: { halign: 'center' }
                },
                margin: { top: 10, right: 14, bottom: 10, left: 14 },
                didDrawPage: function (data) {
                    doc.setFontSize(10);
                    doc.setTextColor(100);
                    const pageCount = doc.internal.getNumberOfPages();
                    doc.text(`Page ${data.pageNumber} of ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
                }
            });

            doc.save(`Class_List_${new Date().toLocaleDateString('en-CA').replace(/\//g, '-')}.pdf`); 
            showFlashMessage('Class list downloaded as PDF!', 'success');
        };

        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const logoX = 14;
            const logoY = 10;
            const imgWidth = 25;
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
        <PageLayout title="Class Management" errorMessage={error ? (error.message || 'Failed to load classes.') : null}>
            {/* Table Section - Left Side */}
            <TableSection
                sectionTitle="Existing Classes"
                searchTerm={searchTerm}
                onSearchChange={(e) => setSearchTerm(e.target.value)}
                onDownloadPdf={downloadPdf}
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
