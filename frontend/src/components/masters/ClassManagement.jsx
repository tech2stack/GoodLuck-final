// src/components/masters/ClassManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api';
import useDataFetching from '../../hooks/useDataFetching'; // NEW: Import the custom hook
import { FaEdit, FaTrashAlt, FaPlusCircle, FaSearch, FaFilePdf, FaChevronLeft, FaChevronRight, FaSpinner } from 'react-icons/fa'; // Added FaSpinner

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
    const { data: classesData, loading: isTableLoading, error, refetch } = useDataFetching('/classes');
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

    // State for local form and modal loading
    const [isSubmitting, setIsSubmitting] = useState(false); // NEW: For form submission and deletion loading

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
        setIsSubmitting(true); // NEW: Form submit ke dauran loading state ko true karein

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
        } finally {
            setIsSubmitting(false); // NEW: Request poora hone par loading state ko false karein
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
        setIsSubmitting(true); // NEW: Deletion ke dauran loading state ko true karein
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
        } finally {
            setIsSubmitting(false); // NEW: Request poora hone par loading state ko false karein
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
        
        // --- Add headers and footers to all pages, and generate the table ---
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
        };

        doc.save(`Class_List_${new Date().toISOString().slice(0, 10)}.pdf`);
        showFlashMessage('PDF exported successfully!', 'success');
    };

    return (
        <PageLayout
            headerTitle="Class Management"
            headerLogo={companyLogo}
            showFlashMessage={showFlashMessage}
            onAddNew={() => {
                setFormData({ name: '', status: 'active' });
                setEditingClassId(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onExportPdf={downloadPdf}
            buttonText="Add New Class"
        >
            {/* Form Section */}
            <FormSection title={editingClassId ? 'Edit Class' : 'Add New Class'} error={error}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name" className="form-label">Class Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g., Class 10"
                            required
                            className="form-input"
                            disabled={isSubmitting} // NEW: isSubmitting ke dauran input ko disable karein
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="status" className="form-label">Status</label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="form-input"
                            disabled={isSubmitting} // NEW: isSubmitting ke dauran select ko disable karein
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <FaSpinner className="btn-icon-mr animate-spin" />
                            ) : (
                                editingClassId ? 'Update Class' : 'Add Class'
                            )}
                        </button>
                        {editingClassId && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                    setEditingClassId(null);
                                    setFormData({ name: '', status: 'active' });
                                }}
                                disabled={isSubmitting} // NEW: isSubmitting ke dauran cancel button ko disable karein
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>
                </form>
            </FormSection>

            {/* Table Section */}
            <TableSection
                title="Existing Classes"
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
            >
                {/* Conditional rendering for loading state */}
                {isTableLoading && (
                    <div className="flex justify-center items-center py-8">
                        <FaSpinner className="animate-spin text-4xl text-blue-500" />
                    </div>
                )}
                {/* Conditional rendering for error state */}
                {error && !isTableLoading && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4" role="alert">
                        <p>{error.message || 'Failed to fetch classes. Please try again.'}</p>
                    </div>
                )}
                {/* Conditional rendering for no data */}
                {!isTableLoading && !error && filteredClasses.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No classes found.</p>
                )}
                {/* Conditional rendering for the table itself */}
                {!isTableLoading && !error && filteredClasses.length > 0 && (
                    <>
                        <div className="overflow-x-auto rounded-lg shadow-md">
                            <table className="min-w-full bg-white">
                                <thead className="bg-gray-800 text-white">
                                    <tr>
                                        <th className="py-3 px-6 text-left">Class Name</th>
                                        <th className="py-3 px-6 text-left">Status</th>
                                        <th className="py-3 px-6 text-left">Add Date</th>
                                        <th className="py-3 px-6 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody ref={tableBodyRef} className="divide-y divide-gray-200">
                                    {currentClasses.map((classItem) => (
                                        <tr key={classItem._id} className="hover:bg-gray-50 transition duration-150">
                                            <td className="py-4 px-6">{classItem.name}</td>
                                            <td className="py-4 px-6">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${classItem.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {classItem.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">{formatDateWithTime(classItem.createdAt)}</td>
                                            <td className="py-4 px-6 text-center">
                                                <button
                                                    onClick={() => handleEdit(classItem)}
                                                    className="text-blue-600 hover:text-blue-900 mr-4 transition duration-150"
                                                    title="Edit"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => openConfirmModal(classItem)}
                                                    className="text-red-600 hover:text-red-900 transition duration-150"
                                                    title="Delete"
                                                >
                                                    <FaTrashAlt />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination controls */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center mt-4 space-x-2">
                                <button
                                    onClick={goToPrevPage}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 transition"
                                >
                                    <FaChevronLeft />
                                </button>
                                <span className="text-gray-700">Page {currentPage} of {totalPages}</span>
                                <button
                                    onClick={goToNextPage}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 transition"
                                >
                                    <FaChevronRight />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </TableSection>


            {/* Confirmation Modal */}
            <ConfirmationModal
                show={showConfirmModal}
                title="Confirm Deletion"
                message={`Are you sure you want to delete class: ${classToDeleteName}?`}
                onConfirm={confirmDelete}
                onCancel={closeConfirmModal}
                confirmText="Delete"
                cancelText="Cancel"
                loading={isSubmitting} // NEW: Modal ke loading state ko isSubmitting se jodein
            />
        </PageLayout>
    );
};

export default ClassManagement;
