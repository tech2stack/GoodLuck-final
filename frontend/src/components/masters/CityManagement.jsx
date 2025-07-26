// src/components/masters/CityManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api'; // API utility for backend calls
import FlashMessage from '../FlashMessage'; // Assuming FlashMessage is directly under src/components
import { FaEdit, FaTrashAlt, FaPlusCircle } from 'react-icons/fa'; // Icons for UI (FaSearch, FaFilePdf, FaChevronLeft, FaChevronRight are now handled by TableSection)

// Import new common components
import PageLayout from '../common/PageLayout';
import TableSection from '../common/TableSection';
import FormSection from '../common/FormSection';
import ConfirmationModal from '../common/ConfirmationModal';

// Stylesheets (generic ones for elements, specific for layout overrides)
import '../../styles/Form.css';
import '../../styles/Table.css';
import '../../styles/Modal.css';
import '../../styles/CommonLayout.css'; // Import the common layout styles
import '../../styles/CityManagement.css'; // Component-specific layout overrides

// Import the logo image directly (assuming it's in src/assets)
import companyLogo from '../../assets/glbs-logo.jpg'; 

// NOTE: jsPDF and jspdf-autotable are expected to be loaded globally via CDN in public/index.html
// If you are using npm, you'd do: npm install jspdf jspdf-autotable
// Then import them here:
// import { jsPDF } from 'jspdf';
// import 'jspdf-autotable';


const CityManagement = ({ showFlashMessage }) => {
    // State for managing list of cities
    const [cities, setCities] = useState([]);
    // State for managing list of zones for the dropdown
    const [zones, setZones] = useState([]);
    // State for form inputs (for creating new or editing existing city)
    const [formData, setFormData] = useState({
        name: '',
        zone: '', // Will store Zone ID
        status: 'active', // Default status
    });
    // State for loading indicators
    const [loading, setLoading] = useState(false);
    // State for managing local errors (e.g., form validation)
    const [localError, setLocalError] = useState(null);
    // State to track if we are in edit mode and which city is being edited
    const [editingCityId, setEditingCityId] = useState(null);

    // States for confirmation modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [cityToDeleteId, setCityToDeleteId] = useState(null);
    const [cityToDeleteName, setCityToDeleteName] = useState('');

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

    // --- Fetch Cities ---
    const fetchCities = useCallback(async (scrollToNew = false) => {
        setLoading(true);
        setLocalError(null);
        try {
            const response = await api.get('/cities'); // API endpoint to get all cities
            if (response.data.status === 'success') {
                setCities(response.data.data.cities);
                const totalPages = Math.ceil(response.data.data.cities.length / itemsPerPage);
                if (currentPage > totalPages && totalPages > 0) {
                    setCurrentPage(totalPages);
                } else if (totalPages === 0) {
                    setCurrentPage(1);
                }
                
                if (scrollToNew && tableBodyRef.current) {
                    setTimeout(() => {
                        const lastPageIndex = Math.ceil(response.data.data.cities.length / itemsPerPage);
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
                setLocalError(response.data.message || 'Failed to fetch cities.');
            }
        } catch (err) {
            console.error('Error fetching cities:', err);
            setLocalError(err.response?.data?.message || 'Failed to load cities due to network error.');
        } finally {
            setLoading(false);
        }
    }, [currentPage]);

    // --- Fetch Zones for Dropdown ---
    const fetchZonesForDropdown = useCallback(async () => {
        try {
            const response = await api.get('/zones'); // API endpoint to get all zones
            if (response.data.status === 'success') {
                setZones(response.data.data.zones);
                // If creating a new city and no zone is pre-selected, set the first one as default
                if (!editingCityId && response.data.data.zones.length > 0) {
                    setFormData(prev => ({ ...prev, zone: response.data.data.zones[0]._id }));
                }
            } else {
                console.error('Failed to fetch zones for dropdown:', response.data.message);
                showFlashMessage('Failed to load zones for dropdown.', 'error');
            }
        } catch (err) {
            console.error('Error fetching zones for dropdown:', err);
            showFlashMessage('Network error fetching zones for dropdown.', 'error');
        }
    }, [editingCityId, showFlashMessage]); // Include editingCityId in dependencies

    // Fetch cities and zones on component mount
    useEffect(() => {
        fetchCities();
        fetchZonesForDropdown();
    }, [fetchCities, fetchZonesForDropdown]);

    // Debugging useEffect for PDF libraries (similar to ClassManagement)
    useEffect(() => {
        console.log("PDF Libraries Check (CityManagement):");
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
        setLocalError(null);

        // Basic validation for zone selection
        if (!formData.zone) {
            setLocalError('Please select a Zone.');
            showFlashMessage('Please select a Zone.', 'error');
            setLoading(false);
            return;
        }

        try {
            let response;
            if (editingCityId) {
                // Update existing city
                response = await api.patch(`/cities/${editingCityId}`, formData);
                if (response.data.status === 'success') {
                    showFlashMessage('City updated successfully!', 'success');
                } else {
                    throw new Error(response.data.message || 'Failed to update city.');
                }
            } else {
                // Create new city
                response = await api.post('/cities', formData);
                if (response.data.status === 'success') {
                    showFlashMessage('City created successfully!', 'success');
                } else {
                    throw new Error(response.data.message || 'Failed to create city.');
                }
            }
            setFormData({ name: '', zone: zones.length > 0 ? zones[0]._id : '', status: 'active' }); // Reset zone to first available
            setEditingCityId(null);
            fetchCities(true); // Re-fetch and indicate to scroll
        } catch (err) {
            console.error('Error saving city:', err);
            const errorMessage = err.response?.data?.message || 'Failed to save city. Please check your input and ensure city name is unique.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Edit and Delete Operations ---
    const handleEdit = (cityItem) => {
        setFormData({ name: cityItem.name, zone: cityItem.zone._id, status: cityItem.status }); // Set zone ID for dropdown
        setEditingCityId(cityItem._id);
        setLocalError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const openConfirmModal = (cityItem) => {
        setCityToDeleteId(cityItem._id);
        setCityToDeleteName(cityItem.name);
        setShowConfirmModal(true);
    };

    const closeConfirmModal = () => {
        setShowConfirmModal(false);
        setCityToDeleteId(null);
        setCityToDeleteName('');
    };

    const confirmDelete = async () => {
        setLoading(true);
        setLocalError(null);
        closeConfirmModal();

        try {
            const response = await api.delete(`/cities/${cityToDeleteId}`);
            if (response.status === 204) {
                showFlashMessage('City deleted successfully!', 'success');
                fetchCities();
            } else {
                throw new Error(response.data?.message || 'Failed to delete city.');
            }
        } catch (err) {
            console.error('Error deleting city:', err);
            const errorMessage = err.response?.data?.message || 'Failed to delete city.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Search Filtering ---
    const filteredCities = cities.filter(cityItem =>
        cityItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cityItem.zone && cityItem.zone.name.toLowerCase().includes(searchTerm.toLowerCase())) // Search by zone name too, safely
    );

    // --- Pagination Logic ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCities = filteredCities.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredCities.length / itemsPerPage);

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

        // Define company details for PDF header
        const companyName = "GOOD LUCK BOOK STORE";
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
            doc.text("City List Report", doc.internal.pageSize.width / 2, startYPositionForTable + 10, { align: 'center' }); 

            // Add a line separator below the main title
            doc.setLineWidth(0.5);
            doc.line(14, startYPositionForTable + 15, doc.internal.pageSize.width - 14, startYPositionForTable + 15); // Line spanning almost full width

            // Update startYPositionForTable for autoTable
            const tableStartY = startYPositionForTable + 20;


            // Generate table data
            const tableColumn = ["S.No.", "City Name", "Zone", "Add Date", "Status"];
            const tableRows = filteredCities.map((cityItem, index) => [
                // S.No. is always index + 1 for the filtered data for PDF
                index + 1, 
                cityItem.name,
                cityItem.zone ? cityItem.zone.name : 'N/A', // Display zone name
                formatDateWithTime(cityItem.createdAt),
                cityItem.status.charAt(0).toUpperCase() + cityItem.status.slice(1)
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
                    1: { cellWidth: 'auto', halign: 'left' }, // City Name column: auto width, left-aligned
                    2: { cellWidth: 'auto', halign: 'left' }, // Zone column: auto width, left-aligned
                    3: { halign: 'center' }, // Add Date column: centered
                    4: { halign: 'center' } // Status column: centered
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
            doc.save(`City_List_${new Date().toLocaleDateString('en-CA').replace(/\//g, '-')}.pdf`); 
            showFlashMessage('City list downloaded as PDF!', 'success');
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
        <PageLayout title="City Management" errorMessage={localError}>
            {/* Table Section - Left Side */}
            <TableSection
                sectionTitle="Existing Cities"
                searchTerm={searchTerm}
                onSearchChange={(e) => setSearchTerm(e.target.value)}
                onDownloadPdf={downloadPdf}
                loading={loading}
                data={filteredCities}
                renderTableContent={() => (
                    <>
                        <thead>
                            <tr>
                                <th>S.No.</th>
                                <th>City Name</th>
                                <th>Zone</th>
                                <th>Add Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody ref={tableBodyRef}>
                            {currentCities.map((cityItem, index) => (
                                <tr key={cityItem._id}>
                                    <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                    <td>{cityItem.name}</td>
                                    <td>{cityItem.zone ? cityItem.zone.name : 'N/A'}</td>
                                    <td>{formatDateWithTime(cityItem.createdAt)}</td>
                                    <td>
                                        <span className={`status-badge ${cityItem.status}`}>
                                            {cityItem.status.charAt(0).toUpperCase() + cityItem.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="actions-column">
                                        <button
                                            onClick={() => handleEdit(cityItem)}
                                            className="action-icon-button edit-button"
                                            title="Edit City"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => openConfirmModal(cityItem)}
                                            className="action-icon-button delete-button"
                                            title="Delete City"
                                        >
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
                sectionTitle={editingCityId ? 'Edit City' : 'Create New City'}
                onSubmit={handleSubmit}
            >
                <div className="form-group">
                    <label htmlFor="name" className="form-label">City Name:</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g., Indore, Bhopal"
                        required
                        disabled={loading}
                        className="form-input"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="zone" className="form-label">Zone:</label>
                    <select
                        id="zone"
                        name="zone"
                        value={formData.zone}
                        onChange={handleChange}
                        required
                        disabled={loading || zones.length === 0}
                        className="form-select"
                    >
                        {zones.length === 0 ? (
                            <option value="">Loading Zones...</option>
                        ) : (
                            <>
                                <option value="">Select a Zone</option>
                                {zones.map(zone => (
                                    <option key={zone._id} value={zone._id}>
                                        {zone.name}
                                    </option>
                                ))}
                            </>
                        )}
                    </select>
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
                        {loading ? (editingCityId ? 'Updating...' : 'Creating...') : (editingCityId ? 'Update City' : 'Create City')}
                        <FaPlusCircle className="ml-2" />
                    </button>
                    {editingCityId && (
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => {
                                setEditingCityId(null);
                                setFormData({ name: '', zone: zones.length > 0 ? zones[0]._id : '', status: 'active' });
                                setLocalError(null);
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
                message={`Are you sure you want to delete city: ${cityToDeleteName}?`}
                onConfirm={confirmDelete}
                onCancel={closeConfirmModal}
                confirmText="Delete"
                cancelText="Cancel"
                loading={loading}
            />
        </PageLayout>
    );
};

export default CityManagement;
