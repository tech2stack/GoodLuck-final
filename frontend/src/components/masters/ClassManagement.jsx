// src/components/masters/ClassManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api';
import { FaEdit, FaTrashAlt, FaPlusCircle, FaSearch, FaFilePdf, FaChevronLeft, FaChevronRight, FaSpinner, FaTimesCircle } from 'react-icons/fa';

// Stylesheets
import '../../styles/Form.css';
import '../../styles/Table.css';
import '../../styles/Modal.css';

import companyLogo from '../../assets/glbs-logo.jpg';

const ClassManagement = ({ showFlashMessage }) => {
    const [classes, setClasses] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        status: 'active',
    });
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState(null);
    const [editingClassId, setEditingClassId] = useState(null);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [classToDeleteId, setClassToDeleteId] = useState(null);
    const [classToDeleteName, setClassToDeleteName] = useState('');

    const tableBodyRef = useRef(null);

    const [searchTerm, setSearchTerm] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

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

    const fetchClasses = useCallback(async (scrollToNew = false) => {
        setLoading(true);
        setLocalError(null);
        try {
            const response = await api.get('/classes');
            if (response.data.status === 'success') {
                setClasses(response.data.data.classes);

                const totalPagesCalculated = Math.ceil(response.data.data.classes.length / itemsPerPage);
                if (currentPage > totalPagesCalculated && totalPagesCalculated > 0) {
                    setCurrentPage(totalPagesCalculated);
                } else if (response.data.data.classes.length === 0) {
                    setCurrentPage(1);
                }

                if (scrollToNew && tableBodyRef.current) {
                    setTimeout(() => {
                        const lastPageIndex = Math.ceil(response.data.data.classes.length / itemsPerPage);
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
                setLocalError(response.data.message || 'Failed to fetch classes.');
            }
        } catch (err) {
            console.error('Error fetching classes:', err);
            setLocalError(err.response?.data?.message || 'Failed to load classes due to network error.');
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setLocalError(null);

        if (!formData.name.trim()) {
            setLocalError('Class name cannot be empty.');
            showFlashMessage('Class name cannot be empty.', 'error');
            setLoading(false);
            return;
        }

        try {
            let response;
            if (editingClassId) {
                response = await api.patch(`/classes/${editingClassId}`, formData);
                if (response.data.status === 'success') {
                    showFlashMessage('Class updated successfully!', 'success');
                } else {
                    throw new Error(response.data.message || 'Failed to update class.');
                }
            } else {
                response = await api.post('/classes', formData);
                if (response.data.status === 'success') {
                    showFlashMessage('Class created successfully!', 'success');
                } else {
                    throw new Error(response.data.message || 'Failed to create class.');
                }
            }
            setFormData({
                name: '',
                status: 'active',
            });
            setEditingClassId(null);
            fetchClasses(true);
        } catch (err) {
            console.error('Error saving class:', err);
            const errorMessage = err.response?.data?.message || 'Failed to save class. Please check your input and ensure class name is unique.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (classItem) => {
        setFormData({
            name: classItem.name,
            status: classItem.status,
        });
        setEditingClassId(classItem._id);
        setLocalError(null);
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
    };

    const filteredClasses = classes.filter(classItem =>
        classItem.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentClasses = filteredClasses.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);

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

    const downloadPdf = () => {
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF !== 'function') {
            showFlashMessage('PDF generation failed: Core libraries are not loaded. Please check your script links.', 'error');
            console.error("PDF generation failed: window.jspdf is not available. Ensure CDNs for jsPDF are correctly linked in your HTML file.");
            return;
        }

        const doc = new window.jspdf.jsPDF();
        if (typeof doc.autoTable !== 'function') {
            showFlashMessage('PDF generation failed: The table plugin is not loaded. Please check your script links.', 'error');
            console.error("PDF generation failed: doc.autoTable is not a function. Ensure jspdf.plugin.autotable.min.js is linked AFTER jspdf.umd.min.js.");
            return;
        }

        const companyName = "GOOD LUCK BOOK STORE";
        const companyAddress = "Shop NO. 2, Shriji Tower, Ashoka Garden, Bhopal";
        const companyMobile = "Mobile Number: 7024136476";
        const companyGST = "GST NO: 23EAVPP3772F1Z8";
        const companyLogoUrl = companyLogo;

        const generateReportBody = (startYPositionForTable) => {
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 30);
            doc.text("Class List Report", doc.internal.pageSize.width / 2, startYPositionForTable + 10, { align: 'center' });

            doc.setLineWidth(0.5);
            doc.line(14, startYPositionForTable + 15, doc.internal.pageSize.width - 14, startYPositionForTable + 15);

            const tableStartY = startYPositionForTable + 20;

            const tableColumn = ["S.No.", "Class Name", "Status", "Add Date"];
            const tableRows = filteredClasses.map((classItem, index) => [
                index + 1,
                classItem.name,
                classItem.status.charAt(0).toUpperCase() + classItem.status.slice(1),
                formatDateWithTime(classItem.createdAt)
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

    return (
        <div className="class-management-container">
            <h2 className="main-section-title">Class Management</h2>

            {localError && (
                <p className="error-message text-center">{localError}</p>
            )}

            <div className="main-content-layout">
                <div className="table-container">
                    <h3 className="table-title">Existing Classes</h3>

                    <div className="table-controls">
                        <div className="search-input-group">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search by Class Name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                                disabled={loading}
                            />
                        </div>
                        <button onClick={downloadPdf} className="download-pdf-btn" disabled={loading || filteredClasses.length === 0}>
                            <FaFilePdf className="icon" /> Download PDF
                        </button>
                    </div>

                    {loading && classes.length === 0 ? (
                        <p className="loading-state text-center">
                            <FaSpinner className="animate-spin mr-2" /> Loading classes...
                        </p>
                    ) : filteredClasses.length === 0 ? (
                        <p className="no-data-message text-center">No classes found matching your criteria. Start by adding one!</p>
                    ) : (
                        <>
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
                                                <button
                                                    onClick={() => handleEdit(classItem)}
                                                    className="action-icon-button edit-button"
                                                    title="Edit Class"
                                                    disabled={loading}
                                                >
                                                    <FaEdit className="icon" />
                                                </button>
                                                <button
                                                    onClick={() => openConfirmModal(classItem)}
                                                    className="action-icon-button delete-button"
                                                    title="Delete Class"
                                                    disabled={loading}
                                                >
                                                    {loading && classToDeleteId === classItem._id ? <FaSpinner className="icon animate-spin" /> : <FaTrashAlt className="icon" />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {totalPages > 1 && (
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
                        </>
                    )}
                </div>

                <div className="form-container-card">
                    <form onSubmit={handleSubmit} className="app-form">
                        <h3 className="form-title">{editingClassId ? 'Edit Class' : 'Add Class'}</h3>

                        <div className="form-row">
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
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? (editingClassId ? 'Updating...' : 'Adding...') : (editingClassId ? 'Update Class' : 'Add Class')}
                                <FaPlusCircle className="icon ml-2" />
                            </button>
                            {editingClassId && (
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleCancelEdit}
                                    disabled={loading}
                                >
                                    <FaTimesCircle className="icon mr-2" /> Cancel Edit
                                </button>
                            )}
                        </div>
                    </form>
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