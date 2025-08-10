// src/components/masters/TransportManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api';
import { FaEdit, FaTrashAlt, FaPlusCircle, FaSearch, FaFilePdf, FaChevronLeft, FaChevronRight, FaSpinner, FaTimesCircle } from 'react-icons/fa';

// Import your existing CSS files for consistency
import '../../styles/Form.css';
import '../../styles/Table.css';
import '../../styles/Modal.css';

import companyLogo from '../../assets/glbs-logo.jpg';


const TransportManagement = ({ showFlashMessage }) => {
    const [transports, setTransports] = useState([]);
    const [formData, setFormData] = useState({
        transportName: '',
        person: '',
        mobile: '',
        address: '',
        status: 'active',
    });
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState(null);
    const [editingTransportId, setEditingTransportId] = useState(null);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [transportToDeleteId, setTransportToDeleteId] = useState(null);
    const [transportToDeleteName, setTransportToDeleteName] = useState('');

    const tableBodyRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [totalTransportsCount, setTotalTransportsCount] = useState(0);

    const formatDateWithTime = (dateString) => {
        if (!dateString) return 'N/A';
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

    const fetchTransports = useCallback(async (scrollToNew = false) => {
        setLoading(true);
        setLocalError(null);
        try {
            const response = await api.get('/transports');
            if (response.data.status === 'success' && Array.isArray(response.data.data.transports)) {
                setTransports(response.data.data.transports);
                
                const totalPagesCalculated = Math.ceil(response.data.data.transports.length / itemsPerPage);
                if (currentPage > totalPagesCalculated && totalPagesCalculated > 0) {
                    setCurrentPage(totalPagesCalculated);
                } else if (response.data.data.transports.length === 0) {
                    setCurrentPage(1);
                }

                if (scrollToNew && tableBodyRef.current) {
                    setTimeout(() => {
                        const lastPageIndex = Math.ceil(response.data.data.transports.length / itemsPerPage);
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
                setLocalError(response.data.message || 'Failed to fetch transports due to unexpected response structure.');
            }
        } catch (err) {
            console.error('Error fetching transports:', err);
            setLocalError(err.response?.data?.message || 'Failed to load transports due to network error.');
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage]);

    useEffect(() => {
        fetchTransports();
    }, [fetchTransports]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setLocalError(null);

        if (!formData.transportName.trim() || !formData.person.trim() || !formData.mobile.trim() || !formData.address.trim()) {
            setLocalError('Please fill in all required fields.');
            showFlashMessage('Please fill in all required fields.', 'error');
            setLoading(false);
            return;
        }

        try {
            let response;
            if (editingTransportId) {
                response = await api.patch(`/transports/${editingTransportId}`, formData);
                if (response.data.status === 'success') {
                    showFlashMessage('Transport updated successfully!', 'success');
                } else {
                    throw new Error(response.data.message || 'Failed to update transport.');
                }
            } else {
                response = await api.post('/transports', formData);
                if (response.data.status === 'success') {
                    showFlashMessage('Transport created successfully!', 'success');
                } else {
                    throw new Error(response.data.message || 'Failed to create transport.');
                }
            }
            setFormData({
                transportName: '',
                person: '',
                mobile: '',
                address: '',
                status: 'active',
            });
            setEditingTransportId(null);
            fetchTransports(true);
        } catch (err) {
            console.error('Error saving transport:', err);
            const errorMessage = err.response?.data?.message || 'Failed to save transport. Please check your input and ensure the name is unique.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (transport) => {
        setFormData({
            transportName: transport.transportName,
            person: transport.person,
            mobile: transport.mobile,
            address: transport.address,
            status: transport.status,
        });
        setEditingTransportId(transport._id);
        setLocalError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const openConfirmModal = (transport) => {
        setTransportToDeleteId(transport._id);
        setTransportToDeleteName(transport.transportName);
        setShowConfirmModal(true);
    };

    const closeConfirmModal = () => {
        setShowConfirmModal(false);
        setTransportToDeleteId(null);
        setTransportToDeleteName('');
    };

    const confirmDelete = async () => {
        setLoading(true);
        setLocalError(null);
        closeConfirmModal();

        try {
            const response = await api.delete(`/transports/${transportToDeleteId}`);
            if (response.status === 204) {
                showFlashMessage('Transport deleted successfully!', 'success');
                fetchTransports();
            } else {
                throw new Error(response.data?.message || 'Failed to delete transport.');
            }
        } catch (err) {
            console.error('Error deleting transport:', err);
            const errorMessage = err.response?.data?.message || 'Failed to delete transport.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setFormData({ transportName: '', person: '', mobile: '', address: '', status: 'active' });
        setEditingTransportId(null);
        setLocalError(null);
    };

    const filteredTransports = transports.filter(transport =>
        transport.transportName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transport.person.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transport.mobile.includes(searchTerm)
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTransports = filteredTransports.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredTransports.length / itemsPerPage);

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
            doc.text("Transport List Report", doc.internal.pageSize.width / 2, startYPositionForTable + 10, { align: 'center' });

            doc.setLineWidth(0.5);
            doc.line(14, startYPositionForTable + 15, doc.internal.pageSize.width - 14, startYPositionForTable + 15);

            const tableStartY = startYPositionForTable + 20;

            const tableColumn = ["S.No.", "Transport Name", "Person", "Mobile", "Status", "Add Date"];
            const tableRows = filteredTransports.map((transport, index) => [
                index + 1,
                transport.transportName,
                transport.person,
                transport.mobile,
                transport.status.charAt(0).toUpperCase() + transport.status.slice(1),
                formatDateWithTime(transport.createdAt)
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
                    3: { halign: 'center' },
                    4: { halign: 'center' },
                    5: { halign: 'center' }
                },
                margin: { top: 10, right: 14, bottom: 10, left: 14 },
                didDrawPage: function (data) {
                    doc.setFontSize(10);
                    doc.setTextColor(100);
                    const pageCount = doc.internal.getNumberOfPages();
                    doc.text(`Page ${data.pageNumber} of ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
                }
            });
            doc.save(`Transport_List_${new Date().toLocaleDateString('en-CA').replace(/\//g, '-')}.pdf`);
            showFlashMessage('Transport list downloaded as PDF!', 'success');
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
        <div className="transport-management-container">
            <h2 className="main-section-title">Transport Management</h2>

            {localError && (
                <p className="error-message text-center">{localError}</p>
            )}

            <div className="main-content-layout">
                <div className="table-container">
                    <h3 className="table-title">Existing Transports</h3>

                    <div className="table-controls">
                        <div className="search-input-group">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                                disabled={loading}
                            />
                        </div>
                        <button onClick={downloadPdf} className="download-pdf-btn" disabled={loading || filteredTransports.length === 0}>
                            <FaFilePdf className="icon" /> Download PDF
                        </button>
                    </div>

                    {loading && transports.length === 0 ? (
                        <p className="loading-state text-center">
                            <FaSpinner className="animate-spin mr-2" /> Loading transports...
                        </p>
                    ) : filteredTransports.length === 0 ? (
                        <p className="no-data-message text-center">No transports found matching your criteria. Start by adding one!</p>
                    ) : (
                        <>
                            <table className="app-table">
                                <thead>
                                    <tr>
                                        <th>S.No.</th>
                                        <th>Transport Name</th>
                                        <th>Person</th>
                                        <th>Mobile</th>
                                        <th>Status</th>
                                        <th>Add Date</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody ref={tableBodyRef}>
                                    {currentTransports.map((transport, index) => (
                                        <tr key={transport._id}>
                                            <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                            <td>{transport.transportName}</td>
                                            <td>{transport.person}</td>
                                            <td>{transport.mobile}</td>
                                            <td>
                                                <span className={`status-badge ${transport.status}`}>
                                                    {transport.status.charAt(0).toUpperCase() + transport.status.slice(1)}
                                                </span>
                                            </td>
                                            <td>{formatDateWithTime(transport.createdAt)}</td>
                                            <td className="actions-column">
                                                <button
                                                    onClick={() => handleEdit(transport)}
                                                    className="action-icon-button edit-button"
                                                    title="Edit Transport"
                                                    disabled={loading}
                                                >
                                                    <FaEdit className="icon" />
                                                </button>
                                                <button
                                                    onClick={() => openConfirmModal(transport)}
                                                    className="action-icon-button delete-button"
                                                    title="Delete Transport"
                                                    disabled={loading}
                                                >
                                                    {loading && transportToDeleteId === transport._id ? <FaSpinner className="icon animate-spin" /> : <FaTrashAlt className="icon" />}
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
                                Total Records: {filteredTransports.length}
                            </div>
                        </>
                    )}
                </div>

                <div className="form-container-card">
                    <form onSubmit={handleSubmit} className="app-form">
                        <h3 className="form-title">{editingTransportId ? 'Edit Transport' : 'Add Transport'}</h3>

                        <div className="form-group">
                            <label htmlFor="transportName">Transport Name:</label>
                            <input
                                type="text"
                                id="transportName"
                                name="transportName"
                                value={formData.transportName}
                                onChange={handleChange}
                                placeholder="e.g., GLBS Transport"
                                required
                                disabled={loading}
                                className="form-input"
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="person">Contact Person:</label>
                                <input
                                    type="text"
                                    id="person"
                                    name="person"
                                    value={formData.person}
                                    onChange={handleChange}
                                    placeholder="e.g., John Doe"
                                    required
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="mobile">Mobile Number:</label>
                                <input
                                    type="text"
                                    id="mobile"
                                    name="mobile"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                    placeholder="e.g., 9876543210"
                                    required
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="address">Address:</label>
                            <input
                                type="text"
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="e.g., 123 Street, City"
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
                                {loading ? (editingTransportId ? 'Updating...' : 'Adding...') : (editingTransportId ? 'Update Transport' : 'Add Transport')}
                                <FaPlusCircle className="icon ml-2" />
                            </button>
                            {editingTransportId && (
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
                        <p>Are you sure you want to delete transport: <strong>{transportToDeleteName}</strong>?</p>
                        <div className="modal-actions">
                            <button onClick={confirmDelete} className="btn btn-danger" disabled={loading}>
                                {loading && transportToDeleteId ? <FaSpinner className="icon animate-spin" /> : 'Delete'}
                            </button>
                            <button onClick={closeConfirmModal} className="btn btn-secondary" disabled={loading}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransportManagement;