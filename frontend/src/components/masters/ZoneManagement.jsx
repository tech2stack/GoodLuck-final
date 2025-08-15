// src/components/masters/ZoneManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api';
import { FaEdit, FaTrashAlt, FaPlusCircle, FaSearch, FaFilePdf, FaChevronLeft, FaChevronRight, FaSpinner, FaTimesCircle } from 'react-icons/fa';

// Stylesheets
import '../../styles/Form.css';
import '../../styles/Table.css';
import '../../styles/Modal.css';

import companyLogo from '../../assets/glbs-logo.jpg';

const ZoneManagement = ({ showFlashMessage }) => {
    const [zones, setZones] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        status: 'active',
    });
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState(null);
    const [editingZoneId, setEditingZoneId] = useState(null);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [zoneToDeleteId, setZoneToDeleteId] = useState(null);
    const [zoneToDeleteName, setZoneToDeleteName] = useState('');

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

    const fetchZones = useCallback(async (scrollToNew = false) => {
        setLoading(true);
        setLocalError(null);
        try {
            const response = await api.get('/zones');
            if (response.data.status === 'success') {
                const fetchedZones = response.data.data.zones;
                setZones(fetchedZones);
                const totalPages = Math.ceil(fetchedZones.length / itemsPerPage);
                if (currentPage > totalPages && totalPages > 0) {
                    setCurrentPage(totalPages);
                } else if (totalPages === 0) {
                    setCurrentPage(1);
                }
                
                if (scrollToNew && tableBodyRef.current) {
                    setTimeout(() => {
                        const lastPageIndex = Math.ceil(fetchedZones.length / itemsPerPage);
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
                setLocalError(response.data.message || 'Failed to fetch zones.');
            }
        } catch (err) {
            console.error('Error fetching zones:', err);
            setLocalError(err.response?.data?.message || 'Failed to load zones due to network error.');
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage]);

    useEffect(() => {
        fetchZones();
    }, [fetchZones]);

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
            setLocalError('Zone name cannot be empty.');
            showFlashMessage('Zone name cannot be empty.', 'error');
            setLoading(false);
            return;
        }

        try {
            let response;
            if (editingZoneId) {
                response = await api.patch(`/zones/${editingZoneId}`, formData);
                if (response.data.status === 'success') {
                    showFlashMessage('Zone updated successfully!', 'success');
                } else {
                    throw new Error(response.data.message || 'Failed to update zone.');
                }
            } else {
                response = await api.post('/zones', formData);
                if (response.data.status === 'success') {
                    showFlashMessage('Zone created successfully!', 'success');
                } else {
                    throw new Error(response.data.message || 'Failed to create zone.');
                }
            }
            setFormData({
                name: '',
                status: 'active',
            });
            setEditingZoneId(null);
            fetchZones(true);
        } catch (err) {
            console.error('Error saving zone:', err);
            const errorMessage = err.response?.data?.message || 'Failed to save zone. Please check your input and ensure zone name is unique.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (zoneItem) => {
        setFormData({
            name: zoneItem.name,
            status: zoneItem.status,
        });
        setEditingZoneId(zoneItem._id);
        setLocalError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const openConfirmModal = (zoneItem) => {
        setZoneToDeleteId(zoneItem._id);
        setZoneToDeleteName(zoneItem.name);
        setShowConfirmModal(true);
    };

    const closeConfirmModal = () => {
        setShowConfirmModal(false);
        setZoneToDeleteId(null);
        setZoneToDeleteName('');
    };

    const confirmDelete = async () => {
        setLoading(true);
        setLocalError(null);
        closeConfirmModal();

        try {
            const response = await api.delete(`/zones/${zoneToDeleteId}`);
            if (response.status === 204) {
                showFlashMessage('Zone deleted successfully!', 'success');
                fetchZones();
            } else {
                throw new Error(response.data?.message || 'Failed to delete zone.');
            }
        } catch (err) {
            console.error('Error deleting zone:', err);
            const errorMessage = err.response?.data?.message || 'Failed to delete zone.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setFormData({ name: '', status: 'active' });
        setEditingZoneId(null);
        setLocalError(null);
    };

    const filteredZones = zones.filter(zone =>
        zone.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentZones = filteredZones.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredZones.length / itemsPerPage);

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
            doc.text("Zone List Report", doc.internal.pageSize.width / 2, startYPositionForTable + 10, { align: 'center' });
            
            doc.setLineWidth(0.5);
            doc.line(14, startYPositionForTable + 15, doc.internal.pageSize.width - 14, startYPositionForTable + 15);

            const tableStartY = startYPositionForTable + 20;

            const tableColumn = ["S.No.", "Zone Name", "Status", "Add Date"];
            const tableRows = filteredZones.map((zoneItem, index) => [
                index + 1,
                zoneItem.name,
                zoneItem.status.charAt(0).toUpperCase() + zoneItem.status.slice(1),
                formatDateWithTime(zoneItem.createdAt)
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
            doc.save(`Zone_List_${new Date().toLocaleDateString('en-CA').replace(/\//g, '-')}.pdf`);
            showFlashMessage('Zone list downloaded as PDF!', 'success');
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
        <div className="zone-management-container">
            <h2 className="main-section-title">Zone Management</h2>

            {localError && (
                <p className="error-message text-center">{localError}</p>
            )}

            <div className="main-content-layout">
                                <div className="form-container-card">
                    <form onSubmit={handleSubmit} className="app-form">
                        <h3 className="form-title">{editingZoneId ? 'Edit Zone' : 'Add Zone'}</h3>
                        
                        <div className="form-group">
                            <label htmlFor="name">Zone Name:</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g., North Zone, South Zone"
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
                                {loading ? (editingZoneId ? 'Updating...' : 'Adding...') : (editingZoneId ? 'Update Zone' : 'Add Zone')}
                                <FaPlusCircle className="icon ml-2" />
                            </button>
                            {editingZoneId && (
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
                <div className="table-container">
                    {/* <h3 className="table-title">Existing Zones</h3> */}

                    <div className="table-controls">
                        <div className="search-input-group">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search by Zone Name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                                disabled={loading}
                            />
                        </div>
                        <button onClick={downloadPdf} className="download-pdf-btn" disabled={loading || filteredZones.length === 0}>
                            <FaFilePdf className="icon" /> Download PDF
                        </button>
                    </div>

                    {loading && zones.length === 0 ? (
                        <p className="loading-state text-center">
                            <FaSpinner className="animate-spin mr-2" /> Loading zones...
                        </p>
                    ) : filteredZones.length === 0 ? (
                        <p className="no-data-message text-center">No zones found matching your criteria. Start by adding one!</p>
                    ) : (
                        <>
                            <table className="app-table">
                                <thead>
                                    <tr>
                                        <th>S.No.</th>
                                        <th>Zone Name</th>
                                        <th>Status</th>
                                        <th>Add Date</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody ref={tableBodyRef}>
                                    {currentZones.map((zoneItem, index) => (
                                        <tr key={zoneItem._id}>
                                            <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                            <td>{zoneItem.name}</td>
                                            <td>
                                                <span className={`status-badge ${zoneItem.status}`}>
                                                    {zoneItem.status.charAt(0).toUpperCase() + zoneItem.status.slice(1)}
                                                </span>
                                            </td>
                                            <td>{formatDateWithTime(zoneItem.createdAt)}</td>
                                            <td className="actions-column">
                                                <button
                                                    onClick={() => handleEdit(zoneItem)}
                                                    className="action-icon-button edit-button"
                                                    title="Edit Zone"
                                                    disabled={loading}
                                                >
                                                    <FaEdit className="icon" />
                                                </button>
                                                <button
                                                    onClick={() => openConfirmModal(zoneItem)}
                                                    className="action-icon-button delete-button"
                                                    title="Delete Zone"
                                                    disabled={loading}
                                                >
                                                    {loading && zoneToDeleteId === zoneItem._id ? <FaSpinner className="icon animate-spin" /> : <FaTrashAlt className="icon" />}
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
                                Total Records: {filteredZones.length}
                            </div>
                        </>
                    )}
                </div>


            </div>

            {showConfirmModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to delete zone: <strong>{zoneToDeleteName}</strong>?</p>
                        <div className="modal-actions">
                            <button onClick={confirmDelete} className="btn btn-danger" disabled={loading}>
                                {loading && zoneToDeleteId ? <FaSpinner className="icon animate-spin" /> : 'Delete'}
                            </button>
                            <button onClick={closeConfirmModal} className="btn btn-secondary" disabled={loading}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ZoneManagement;