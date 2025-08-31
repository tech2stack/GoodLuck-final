// src/components/masters/ClassManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api';
import { FaEdit, FaTrashAlt, FaPlusCircle, FaSearch, FaFilePdf, FaChevronLeft, FaChevronRight, FaSpinner, FaTimesCircle } from 'react-icons/fa';

// Stylesheets
import '../../styles/Form.css';
import '../../styles/Table.css';
import '../../styles/Modal.css';

import companyLogo from '../../assets/glbs-logo.jpg';
import { addHeaderAndSetStartY, addReportTitle, addTableToDoc } from '../../utils/pdfTheme';

const ClassManagement = ({ showFlashMessage }) => {
    const [classes, setClasses] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        status: 'active',
    });
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState(null);
    const [editingClassId, setEditingClassId] = useState(null);
    // NEW: State to track the ID of the newly added class for highlighting
    const [highlightedClassId, setHighlightedClassId] = useState(null);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [classToDeleteId, setClassToDeleteId] = useState(null);
    const [classToDeleteName, setClassToDeleteName] = useState('');

    const tableBodyRef = useRef(null);

    const [searchTerm, setSearchTerm] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // --- Fetch Classes ---
    const fetchClasses = useCallback(async () => {
        setLoading(true);
        setLocalError(null);
        try {
            const response = await api.get('/classes');
            if (response.data.status === 'success') {
                const sorted = response.data.data.classes.sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                );
                setClasses(sorted);
            } else {
                setLocalError(response.data.message || 'Failed to fetch classes.');
            }
        } catch (err) {
            console.error('Error fetching classes:', err);
            setLocalError(err.response?.data?.message || 'Failed to load classes due to network error.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

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
            setLocalError('Class Name is required.');
            showFlashMessage('Class Name is required.', 'error');
            setLoading(false);
            return;
        }

        try {
            let response;
            if (editingClassId) {
                // Update case
                response = await api.patch(`/classes/${editingClassId}`, formData);
                if (response.data.status === 'success') {
                    showFlashMessage('Class updated successfully!', 'success');
                    fetchClasses();
                    setFormData({ name: '', status: 'active' });
                    setEditingClassId(null);
                } else {
                    throw new Error(response.data.message || 'Failed to update class.');
                }
            } else {
                // Create case
                response = await api.post('/classes', formData);
                if (response.data.status === 'success') {
                    showFlashMessage('Class created successfully!', 'success');
                    const newClass = response.data.data.class;
                    setClasses(prev => [newClass, ...prev]);
                    // NEW: Highlight the new entry
                    setHighlightedClassId(newClass._id);
                    // Reset all states after a successful creation
                    setFormData({ name: '', status: 'active' });
                } else {
                    throw new Error(response.data.message || 'Failed to create class.');
                }
            }
            // NEW: Scroll to the top after submission for both create and update
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error('Error saving class:', err);
            const errorMessage = err.response?.data?.message || 'Failed to save class. Please check your input.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (classItem) => {
        setFormData({
            name: classItem.name,
            status: classItem.status
        });
        setEditingClassId(classItem._id);
        setLocalError(null);
        // NEW: Clear highlight on edit
        setHighlightedClassId(null);
        // NEW: Scroll to the top to show the form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const openConfirmModal = (classItem) => {
        setClassToDeleteId(classItem._id);
        setClassToDeleteName(classItem.name);
        setShowConfirmModal(true);
    };

    const closeConfirmModal = () => {
        setShowConfirmModal(false);
        setClassToDeleteId(null);
        setClassToDeleteName('');
    };

    const confirmDelete = async () => {
        setLoading(true);
        setLocalError(null);
        closeConfirmModal();

        try {
            const response = await api.delete(`/classes/${classToDeleteId}`);
            if (response.status === 204) {
                showFlashMessage('Class deleted successfully!', 'success');
                fetchClasses();
            } else {
                throw new Error(response.data?.message || 'Failed to delete class.');
            }
        } catch (err) {
            console.error('Error deleting class:', err);
            const errorMessage = err.response?.data?.message || 'Failed to delete class.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setFormData({ name: '', status: 'active' });
        setEditingClassId(null);
        setLocalError(null);
        setHighlightedClassId(null);
    };

    // --- Search Filtering ---
    const filteredClasses = classes.filter((classItem) => {
        if (!classItem) return false;
        const matchesSearch = classItem.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

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
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF !== 'function') {
            showFlashMessage('PDF generation failed: Core libraries are not loaded. Please check your script links.', 'error');
            return;
        }

        const doc = new window.jspdf.jsPDF('p', 'mm', 'a4');
        let startY = addHeaderAndSetStartY(doc, companyLogo, 25, 22);
        startY = addReportTitle(doc, startY, "Class List Report");

        const tableColumn = ["S.No.", "Class Name", "Status", "Created Date"];
        const tableRows = filteredClasses.map((cl, index) => [
            index + 1,
            cl.name,
            cl.status,
            new Date(cl.createdAt).toLocaleDateString()
        ]);

        addTableToDoc(doc, tableColumn, tableRows, startY);

        doc.save(`Classes_List_${new Date().toLocaleDateString('en-CA').replace(/\//g, '-')}.pdf`);
        showFlashMessage('Classes list downloaded as PDF!', 'success');
    };

    // --- UI Rendering ---
    return (
        <div className="class-management-container">
            <h2 className="main-section-title">Class Management</h2>

            {localError && (
                <p className="error-message text-center">{localError}</p>
            )}

            <div className="main-content-layout">
                {/* Class Creation/Update Form */}
                <div className="form-container-card">
                    <form onSubmit={handleSubmit} className="app-form">
                        <h3 className="form-title">{editingClassId ? 'Edit Class' : 'Class Details'}</h3>
                        <div className="form-group">
                            <label htmlFor="name">Class Name:</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g., 10th, 12th"
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
                                {loading ? <FaSpinner className="btn-icon-mr animate-spin" /> : (editingClassId ? 'Update Class' : 'Add Class')}
                            </button>
                            {editingClassId && (
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

                {/* Class List Table */}
                <div className="table-section">
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
                        <button
                            onClick={downloadPdf}
                            className="btn btn-info download-pdf-btn"
                            disabled={loading || filteredClasses.length === 0}
                        >
                            <FaFilePdf className="mr-2" /> Download PDF
                        </button>
                    </div>

                    <div className="table-container">
                        <table className="app-table">
                            <thead>
                                <tr>
                                    <th>S.No.</th>
                                    <th>Class Name</th>
                                    <th>Status</th>
                                    <th>Add Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody ref={tableBodyRef}>
                                {filteredClasses.length > 0 ? (
                                    currentClasses.map((classItem, index) => (
                                        // NEW: Apply highlight class to the row if it matches the highlighted ID
                                        <tr key={classItem._id} className={classItem._id === highlightedClassId ? 'animate-highlight' : ''}>
                                            <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                            <td>{classItem.name}</td>
                                            <td>
                                                <span className={`status-badge ${classItem.status}`}>
                                                    {classItem.status.charAt(0).toUpperCase() + classItem.status.slice(1)}
                                                </span>
                                            </td>
                                            <td>{new Date(classItem.createdAt).toLocaleDateString()}</td>
                                            <td className="actions-column">
                                                <button
                                                    onClick={() => handleEdit(classItem)}
                                                    className="action-icon-button edit-button"
                                                    title="Edit Class"
                                                    disabled={loading}
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => openConfirmModal(classItem)}
                                                    className="action-icon-button delete-button"
                                                    title="Delete Class"
                                                    disabled={loading}
                                                >
                                                    {loading && classToDeleteId === classItem._id ? <FaSpinner className="animate-spin" /> : <FaTrashAlt />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        {/* Show "No classes found" message if no data exists */}
                                        <td colSpan="5" className="no-data-message text-center">No classes found matching your criteria.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {filteredClasses.length > 0 && totalPages > 1 && (
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
                        Total Records: {filteredClasses.length}
                    </div>
                </div>
            </div>

            {showConfirmModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to delete class: <strong>{classToDeleteName}</strong>?</p>
                        <div className="modal-actions">
                            <button onClick={confirmDelete} className="btn btn-danger" disabled={loading}>
                                {loading ? <FaSpinner className="icon animate-spin" /> : 'Delete'}
                            </button>
                            <button onClick={closeConfirmModal} className="btn btn-secondary" disabled={loading}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassManagement;