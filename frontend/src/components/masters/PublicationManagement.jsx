// src/components/masters/PublicationManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api'; // API utility for backend calls
import { FaEdit, FaTrashAlt, FaPlusCircle, FaSearch, FaFilePdf, FaChevronLeft, FaChevronRight, FaTimes, FaSpinner } from 'react-icons/fa'; // Icons for UI
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

// Stylesheets (assuming these are already present and styled for consistency)
import '../../styles/Form.css';
import '../../styles/Table.css';
import '../../styles/Modal.css';
import '../../styles/PublicationManagement.css'; // Component-specific layout overrides
import '../../styles/CommonLayout.css'; // Ensure CommonLayout is imported

// Import the logo image directly
import companyLogo from '../../assets/glbs-logo.jpg';

// NOTE: jsPDF and jspdf-autotable are expected to be loaded globally via CDN in public/index.html
// If you are using npm, you'd do: npm install jspdf jspdf-autotable
// Then import them here:
// import { jsPDF } from 'jspdf';
// import 'jspdf-autotable';



const PublicationManagement = ({ showFlashMessage }) => {
    const [isOpen, setIsOpen] = useState(false);
    // State for managing list of publications
    const [publications, setPublications] = useState([]);
    // State for managing list of cities for lookup/validation (not for dropdown anymore)
    const [cities, setCities] = useState([]);
    // State for form inputs (for creating new or editing existing publication)
    const [formData, setFormData] = useState({
        name: '',
        personName: '',
        city: '', // Will now store City Name directly
        mobileNumber: '',
        bank: '',
        accountNumber: '',
        ifsc: '',
        gstin: '',
        discount: 0, // Default discount
        address: '',
        status: 'active', // Default status
        // Removed subtitles from here as they will be managed via a separate modal
    });
    // State for loading indicators
    const [loading, setLoading] = useState(false);
    // State for managing local errors (e.g., form validation)
    const [localError, setLocalError] = useState(null);
    // State to track if we are in edit mode and which publication is being edited
    const [editingPublicationId, setEditingPublicationId] = useState(null);

    // States for confirmation modal (for deleting main publication)
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [publicationToDeleteId, setPublicationToDeleteId] = useState(null);
    const [publicationToDeleteName, setPublicationToDeleteName] = useState('');

    // States for Subtitle Management Modal
    const [showSubtitleModal, setShowSubtitleModal] = useState(false);
    const [selectedPublicationForSubtitle, setSelectedPublicationForSubtitle] = useState(null); // This will hold the full publication object for subtitle ops
    const [newSubtitleName, setNewSubtitleName] = useState('');
    const [subtitleModalLoading, setSubtitleModalLoading] = useState(false);
    const [subtitleModalError, setSubtitleModalError] = useState(null);

    // NEW STATE: Temporary subtitles for a new publication being created (before it's saved)
    const [newPublicationSubtitles, setNewPublicationSubtitles] = useState([]);

    // Ref for scrolling to the new item in the table (if needed)
    const tableBodyRef = useRef(null);

    // States for Search
    const [searchTerm, setSearchTerm] = useState('');

    // States for Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Show 10 entries per page

    // --- Initial form state for clearing/resetting ---
    const initialFormData = {
        name: '', personName: '', city: '',
        mobileNumber: '', bank: '', accountNumber: '', ifsc: '', gstin: '',
        discount: 0, address: '', status: 'active',
    };

    // --- Helper function for date formatting ---
    const formatDateWithTime = (dateString) => {
        if (!dateString) return 'N/A';
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

    // --- Fetch Publications ---
    const fetchPublications = useCallback(async (scrollToNew = false) => {
        setLoading(true);
        setLocalError(null);
        try {
            const response = await api.get(`/publications`); // Fetch all publications for client-client-side filtering/pagination
            if (response.data.status === 'success') {
                setPublications(response.data.data.publications);

                const totalPagesCalculated = Math.ceil(response.data.data.publications.length / itemsPerPage);
                if (currentPage > totalPagesCalculated && totalPagesCalculated > 0) {
                    setCurrentPage(totalPagesCalculated);
                } else if (response.data.data.publications.length === 0) {
                    setCurrentPage(1);
                }

                if (scrollToNew && tableBodyRef.current) {
                    setTimeout(() => {
                        const lastPageIndex = Math.ceil(response.data.data.publications.length / itemsPerPage);
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
                setLocalError(response.data.message || 'Failed to fetch publications.');
            }
        } catch (err) {
            console.error('Error fetching publications:', err);
            setLocalError(err.response?.data?.message || 'Failed to load publications due to network error.');
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage]); // Re-fetch when page or itemsPerPage changes (searchTerm is handled by filteredPublications)

    // --- Fetch Cities for Lookup ---
    const fetchCitiesForLookup = useCallback(async () => {
        try {
            // Fetch all active cities to use for validation/lookup
            const response = await api.get('/cities?status=active&limit=1000');
            if (response.data.status === 'success') {
                setCities(response.data.data.cities || []); // Safeguard: Ensure cities is always an array
            } else {
                console.error('Failed to fetch cities for lookup:', response.data.message);
                showFlashMessage('Failed to load cities for lookup.', 'error');
            }
        } catch (err) {
            console.error('Error fetching cities for lookup:', err);
            showFlashMessage('Network error fetching cities for lookup.', 'error');
        }
    }, [showFlashMessage]);

    // Fetch publications and cities on component mount or relevant state changes
    useEffect(() => {
        fetchPublications();
    }, [fetchPublications]);

    useEffect(() => {
        fetchCitiesForLookup();
    }, [fetchCitiesForLookup]);


    // Debugging useEffect for PDF libraries
    useEffect(() => {
        console.log("PDF Libraries Check (PublicationManagement):");
        console.log("window.jspdf (global object):", typeof window.jspdf);
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
        if (!formData.name || !formData.personName || !formData.mobileNumber || !formData.address || !formData.city.trim()) {
            setLocalError('Please fill all required fields.');
            showFlashMessage('Please fill all required fields.', 'error');
            setLoading(false);
            return;
        }

        let cityIdToUse = '';
        const enteredCityName = formData.city.trim();

        try {
            // 1. Check if city exists in the fetched list
            // Safeguard: Ensure c and c.name are not null/undefined
            let existingCity = cities.find(c => c && c.name && c.name.toLowerCase() === enteredCityName.toLowerCase());

            if (existingCity) {
                cityIdToUse = existingCity._id;
            } else {
                // 2. If city doesn't exist, create it
                const newCityResponse = await api.post('/cities', {
                    name: enteredCityName,
                    status: 'active' // Default status for newly created cities
                });
                if (newCityResponse.data.status === 'success') {
                    cityIdToUse = newCityResponse.data.data.city._id;
                    showFlashMessage(`New city "${enteredCityName}" created successfully!`, 'success');
                    // Re-fetch cities list to include the newly added city for future lookups
                    await fetchCitiesForLookup();
                } else {
                    throw new Error(newCityResponse.data.message || 'Failed to create new city.');
                }
            }

            // Prepare data for publication submission
            // Ensure formData.city (name) is replaced with cityIdToUse (_id)
            const publicationData = { ...formData, city: cityIdToUse }; // Subtitles are not part of main form submission initially

            let response;
            if (editingPublicationId) {
                // Update existing publication
                response = await api.patch(`/publications/${editingPublicationId}`, publicationData);
                if (response.data.status === 'success') {
                    showFlashMessage('Publication updated successfully!', 'success');
                    // Reset form after successful update
                    setFormData(initialFormData);
                    setEditingPublicationId(null);
                    setSelectedPublicationForSubtitle(null);
                    setNewPublicationSubtitles([]); // Clear any temporary subtitles if they were somehow left over
                } else {
                    throw new Error(response.data.message || 'Failed to update publication.');
                }
            } else {
                // Create new publication
                // Include temporarily added subtitles (only send their names)
                const newPublicationData = {
                    ...publicationData,
                    subtitles: newPublicationSubtitles.map(s => ({ name: s.name }))
                };
                response = await api.post('/publications', newPublicationData);
                if (response.data.status === 'success') {
                    showFlashMessage('Publication created successfully! You can now continue adding subtitles to this new publication or reset the form.', 'success');
                    // Clear temporary subtitles after successful save
                    setNewPublicationSubtitles([]);
                    // Set the newly created publication as the one being edited
                    setEditingPublicationId(response.data.data.publication._id);
                    setSelectedPublicationForSubtitle(response.data.data.publication);
                    // Update formData to reflect the full data of the newly created publication
                    setFormData({
                        ...response.data.data.publication,
                        city: response.data.data.publication.city ? response.data.data.publication.city.name : '' // Ensure city name is set for the input
                    });
                } else {
                    throw new Error(response.data.message || 'Failed to create publication.');
                }
            }
            fetchPublications(true); // Re-fetch and indicate to scroll
        } catch (err) {
            console.error('Error saving publication:', err);
            const errorMessage = err.response?.data?.message || 'Failed to save publication. Please check your input and ensure data is valid.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Edit and Delete Operations ---
    const handleEdit = (publicationItem) => {
        setFormData({
            name: publicationItem.name,
            personName: publicationItem.personName,
            city: publicationItem.city ? publicationItem.city.name : '', // Set city NAME for input field
            mobileNumber: publicationItem.mobileNumber,
            bank: publicationItem.bank,
            accountNumber: publicationItem.accountNumber,
            ifsc: publicationItem.ifsc,
            gstin: publicationItem.gstin,
            discount: publicationItem.discount,
            address: publicationItem.address,
            status: publicationItem.status,
            // Subtitles are not edited via the main form
        });
        setEditingPublicationId(publicationItem._id);
        // When editing, also set the selected publication for potential subtitle operations
        setSelectedPublicationForSubtitle(publicationItem);
        // Clear temporary subtitles when starting to edit an existing one
        setNewPublicationSubtitles([]);
        setLocalError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to form
    };

    const openConfirmModal = (publicationItem) => {
        setPublicationToDeleteId(publicationItem._id);
        setPublicationToDeleteName(publicationItem.name);
        setShowConfirmModal(true);
    };

    const closeConfirmModal = () => {
        setShowConfirmModal(false);
        setPublicationToDeleteId(null);
        setPublicationToDeleteName('');
    };

    const confirmDelete = async () => {
        setLoading(true);
        setLocalError(null);
        closeConfirmModal();

        try {
            const response = await api.delete(`/publications/${publicationToDeleteId}`);
            if (response.status === 204) { // 204 No Content for successful deletion
                showFlashMessage('Publication deleted successfully!', 'success');
                fetchPublications(); // Re-fetch publications to update the list
            } else {
                throw new Error(response.data?.message || 'Failed to delete publication.');
            }
        } catch (err) {
            console.error('Error deleting publication:', err);
            const errorMessage = err.response?.data?.message || 'Failed to delete publication.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Subtitle Management Functions ---
    // This function will now be called from the main form
    const handleOpenSubtitleModalFromForm = () => {
        // The button is always available, but we need to manage if we are adding for new or existing
        setNewSubtitleName('');
        setSubtitleModalError(null);
        setShowSubtitleModal(true);
    };

    const closeSubtitleModal = () => {
        setShowSubtitleModal(false);
        setNewSubtitleName('');
        setSubtitleModalError(null);
    };

    const handleAddSubtitle = async (e) => {
        e.preventDefault();
        setSubtitleModalLoading(true);
        setSubtitleModalError(null);

        if (!newSubtitleName.trim()) {
            setSubtitleModalError('Subtitle name cannot be empty.');
            setSubtitleModalLoading(false);
            return;
        }

        if (editingPublicationId) {
            // Logic for adding subtitle to an existing publication
            if (!selectedPublicationForSubtitle?._id) {
                setSubtitleModalError('No publication selected to add subtitle.');
                setSubtitleModalLoading(false);
                return;
            }
            try {
                const response = await api.post(`/publications/${selectedPublicationForSubtitle._id}/subtitles`, { name: newSubtitleName.trim() });
                if (response.data.status === 'success') {
                    showFlashMessage('Subtitle added successfully!', 'success');
                    closeSubtitleModal();
                    fetchPublications(); // Re-fetch publications to update the table with new subtitle
                    // Update selectedPublicationForSubtitle with new subtitles array for immediate feedback
                    setSelectedPublicationForSubtitle(prev => ({
                        ...prev,
                        subtitles: [...(prev?.subtitles || []), response.data.data.subtitle]
                    }));
                } else {
                    throw new Error(response.data.message || 'Failed to add subtitle.');
                }
            } catch (err) {
                console.error('Error adding subtitle:', err);
                const errorMessage = err.response?.data?.message || 'Failed to add subtitle.';
                setSubtitleModalError(errorMessage);
                showFlashMessage(errorMessage, 'error');
            } finally {
                setSubtitleModalLoading(false);
            }
        } else {
            // Logic for adding subtitle to a new (unsaved) publication
            // Generate a temporary unique ID for new subtitles
            const tempSubtitle = { _id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, name: newSubtitleName.trim() };
            setNewPublicationSubtitles(prev => [...prev, tempSubtitle]);
            showFlashMessage('Subtitle added temporarily. It will be saved with the new publication.', 'info');
            closeSubtitleModal();
            setSubtitleModalLoading(false); // Manually set false as no API call for temporary add
        }
    };

    const handleRemoveSubtitle = async (subtitleId, publicationId, subtitleName) => {
        const isConfirmed = window.confirm(`Are you sure you want to remove subtitle "${subtitleName}"?`);

        if (!isConfirmed) {
            return;
        }

        setLoading(true); // Use main loading for this action
        setLocalError(null);

        if (editingPublicationId) {
            // Logic for removing subtitle from an existing publication
            try {
                const response = await api.delete(`/publications/subtitles/${subtitleId}`);
                if (response.status === 204) {
                    showFlashMessage('Subtitle removed successfully!', 'success');
                    fetchPublications(); // Re-fetch publications to update the table

                    // Also update selectedPublicationForSubtitle if it's the current one being edited
                    setSelectedPublicationForSubtitle(prev => {
                        if (prev && prev._id === publicationId) {
                            return { ...prev, subtitles: prev.subtitles.filter(sub => sub._id !== subtitleId) };
                        }
                        return prev;
                    });

                } else {
                    throw new Error(response.data?.message || 'Failed to remove subtitle.');
                }
            } catch (err) {
                console.error('Error removing subtitle:', err);
                const errorMessage = err.response?.data?.message || 'Failed to remove subtitle.';
                setLocalError(errorMessage);
                showFlashMessage(errorMessage, 'error');
            } finally {
                setLoading(false);
            }
        } else {
            // Logic for removing subtitle from a new (unsaved) publication
            setNewPublicationSubtitles(prev => prev.filter(sub => sub._id !== subtitleId));
            showFlashMessage('Subtitle removed temporarily.', 'info');
            setLoading(false); // Manually set false as no API call for temporary remove
        }
    };

    const handleCancelEdit = () => {
        setFormData(initialFormData); // Reset to initial state
        setEditingPublicationId(null);
        setSelectedPublicationForSubtitle(null); // Also clear selected publication for subtitle ops
        setNewPublicationSubtitles([]); // IMPORTANT: Clear temporary subtitles
        setLocalError(null);
    };

    // --- Search Filtering ---
    const filteredPublications = publications.filter(publicationItem =>
        publicationItem && (
            publicationItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            publicationItem.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (publicationItem.city && publicationItem.city.name && publicationItem.city.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (publicationItem.mobileNumber && publicationItem.mobileNumber.includes(searchTerm)) ||
            (publicationItem.gstin && publicationItem.gstin.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (Array.isArray(publicationItem.subtitles) && publicationItem.subtitles.some(sub => sub && sub.name && sub.name.toLowerCase().includes(searchTerm.toLowerCase())))
        )
    );

    // --- Pagination Logic ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPublications = filteredPublications.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredPublications.length / itemsPerPage);

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

        // Changed: Set PDF to A4 portrait using 'mm' units
        const doc = new window.jspdf.jsPDF('portrait', 'mm', 'a4');

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
            doc.text("Publication List Report", doc.internal.pageSize.width / 2, startYPositionForTable + 10, { align: 'center' });

            // Add a line separator below the main title
            doc.setLineWidth(0.5);
            doc.line(14, startYPositionForTable + 15, doc.internal.pageSize.width - 14, startYPositionForTable + 15); // Line spanning almost full width

            // Update startYPositionForTable for autoTable
            const tableStartY = startYPositionForTable + 20;


            // Generate table data
            const tableColumn = [
                "S.No.", "Name", "Person", "Address", "City", "Mobile",
                "GSTIN", "Discount" // NOTE: Removed Bank, Acc No., IFSC from PDF columns as they were missing from column headers.
            ];
            const tableRows = filteredPublications.map((pubItem, index) => [
                // S.No. is always index + 1 for the filtered data for PDF
                index + 1,
                pubItem.name,
                pubItem.personName,
                pubItem.address,
                pubItem.city ? pubItem.city.name : 'N/A', // Display city name
                pubItem.mobileNumber,
                pubItem.gstin,
                `${pubItem.discount}%`,
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
                    0: { cellWidth: 15, halign: 'center' }, 1: { cellWidth: 'auto', halign: 'left' },
                    2: { cellWidth: 'auto', halign: 'left' }, 3: { cellWidth: 'auto', halign: 'left' },
                    4: { cellWidth: 'auto', halign: 'left' }, 5: { cellWidth: 'auto', halign: 'center' },
                    6: { cellWidth: 'auto', halign: 'left' }, 7: { cellWidth: 'auto', halign: 'center' },
                },
                margin: { top: 10, right: 14, bottom: 10, left: 14 },
                didDrawPage: function (data) {
                    // Add footer on each page
                    doc.setFontSize(10);
                    doc.setTextColor(100); // Gray color for footer text
                    const pageCount = doc.internal.getNumberOfPages();
                    doc.text(`Page ${data.pageNumber} of ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
                }
            });
            doc.save(`Publication_List_${new Date().toLocaleDateString('en-CA').replace(/\//g, '-')}.pdf`);
            showFlashMessage('Publication list downloaded as PDF!', 'success');
        };

        // 5. **Handle Logo Loading Asynchronously:**
        const img = new Image();
        img.crossOrigin = 'Anonymous'; // Important for CORS if using a different domain
        img.onload = () => {
            const logoX = 14; // Left margin for logo
            const logoY = 10; // Top margin for logo
            const imgWidth = 25; // Changed: Reduced logo width
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
        // For portrait, adjust X position for right alignment
        doc.text(`Date: ${formatDateWithTime(new Date())}`, doc.internal.pageSize.width - 14, 20, { align: 'right' });
    };

    // --- UI Rendering ---
    return (
        <div className="publication-management-container">
            <h2 className="main-section-title">Publication Management</h2>

            {localError && (
                <p className="error-message text-center">{localError}</p>
            )}

            {/* Main content layout for two columns */}
            <div className="main-content-layout">

                {/* Publication Creation/Update Form - SECOND CHILD */}
                <div className="form-container-card">
                    <form onSubmit={handleSubmit} className="app-form">
                        <h3 className="form-title">{editingPublicationId ? 'Edit Publication' : 'Add Publication'}</h3>

                        <div className="form-row"> {/* Use form-row for multi-column layout */}
                            <div className="form-group">
                                <label htmlFor="name">Publication Name:</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g., NCERT, Arihant"
                                    required
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="personName">Person Name:</label>
                                <input
                                    type="text"
                                    id="personName"
                                    name="personName"
                                    value={formData.personName}
                                    onChange={handleChange}
                                    placeholder="e.g., John Doe"
                                    required
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                        </div>

                        {/* Display temporarily added subtitles for new publication OR existing for edited one */}
                        {(!editingPublicationId && newPublicationSubtitles.length > 0) || (editingPublicationId && selectedPublicationForSubtitle?.subtitles?.length > 0) ? (
                            <div className="form-group">
                                <label>Subtitles:</label>
                                <div className="subtitle-list form-subtitle-list">
                                    {editingPublicationId
                                        ? selectedPublicationForSubtitle.subtitles.map(sub => (
                                            <span key={sub._id} className="subtitle-tag">
                                                {sub.name}
                                                <button
                                                    className="remove-subtitle-btn"
                                                    onClick={() => handleRemoveSubtitle(sub._id, selectedPublicationForSubtitle._id, sub.name)}
                                                    title="Remove Subtitle"
                                                    disabled={loading}
                                                >
                                                    <FaTimes />
                                                </button>
                                            </span>
                                        ))
                                        : newPublicationSubtitles.map(sub => (
                                            <span key={sub._id} className="subtitle-tag">
                                                {sub.name}
                                                <button
                                                    className="remove-subtitle-btn"
                                                    onClick={() => handleRemoveSubtitle(sub._id, null, sub.name)} // Pass null for publicationId as it's temporary
                                                    title="Remove temporary Subtitle"
                                                    disabled={loading}
                                                >
                                                    <FaTimes />
                                                </button>
                                            </span>
                                        ))
                                    }
                                </div>
                            </div>
                        ) : null}

                        {/* Add Subtitle button - always visible and enabled as per user request */}
                        <div className="form-group mt-3">
                            <button
                                type="button"
                                onClick={handleOpenSubtitleModalFromForm}
                                className="btn btn-info"
                                disabled={loading}
                            >
                                <FaPlusCircle className="mr-2" /> Add Subtitle
                            </button>
                            <small className="form-text-muted ml-2">
                                Add new subtitles {editingPublicationId ? 'to this publication.' : 'for the new publication.'}
                            </small>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="city">City:</label>
                                {/* City input is now a direct text input */}
                                <input
                                    type="text"
                                    id="city"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    placeholder="e.g., Indore, Bhopal"
                                    required
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="mobileNumber">Mobile Number:</label>
                                <input
                                    type="text"
                                    id="mobileNumber"
                                    name="mobileNumber"
                                    value={formData.mobileNumber}
                                    onChange={handleChange}
                                    placeholder="e.g., 9876543210"
                                    required
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="bank">Bank:</label>
                                <input
                                    type="text"
                                    id="bank"
                                    name="bank"
                                    value={formData.bank}
                                    onChange={handleChange}
                                    placeholder="e.g., SBI, HDFC"
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="accountNumber">Acc Number:</label>
                                <input
                                    type="text"
                                    id="accountNumber"
                                    name="accountNumber"
                                    value={formData.accountNumber}
                                    onChange={handleChange}
                                    placeholder="e.g., 1234567890"
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="ifsc">IFSC:</label>
                                <input
                                    type="text"
                                    id="ifsc"
                                    name="ifsc"
                                    value={formData.ifsc}
                                    onChange={handleChange}
                                    placeholder="e.g., HDFC0001234"
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="gstin">GSTIN:</label>
                                <input
                                    type="text"
                                    id="gstin"
                                    name="gstin"
                                    value={formData.gstin}
                                    onChange={handleChange}
                                    placeholder="e.g., 22AAAAA0000A1Z5"
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="discount">Discount (%):</label>
                                <input
                                    type="number"
                                    id="discount"
                                    name="discount"
                                    value={formData.discount}
                                    onChange={handleChange}
                                    placeholder="e.g., 10"
                                    min="0"
                                    max="100"
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="address">Address:</label>
                                <textarea
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Full Address"
                                    required
                                    disabled={loading}
                                    className="form-textarea"
                                ></textarea>
                            </div>
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
                                {loading ? <FaSpinner className="btn-icon-mr animate-spin" /> : (editingPublicationId ? 'Update Publication' : 'Add Publication')}
                            </button>
                            {editingPublicationId && (
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
                {/* Publication List Table - FIRST CHILD */}
                <div className="table-section">
                    {/* <h3 className="table-title">Existing Publications</h3> */}

                    {/* Search and PDF Download Section */}
                    <div className="table-controls">
                        <div className="search-input-group">
                            <input
                                type="text"
                                placeholder="Search by Name, Person, City, Mobile, GSTIN..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                            <FaSearch className="search-icon" />
                        </div>
                        <button onClick={downloadPdf} className="btn btn-info download-pdf-btn" disabled={loading || filteredPublications.length === 0}>
                            <FaFilePdf className="mr-2" /> Download PDF
                        </button>
                    </div>

                    {loading && publications.length === 0 ? (
                        <p className="loading-state">Loading publications...</p>
                    ) : filteredPublications.length === 0 ? (
                        <p className="no-data-message">No publications found matching your criteria. Start by adding one!</p>
                    ) : (
                        <div className="table-container"> {/* This div is for table overflow, not layout */}
                            <table className="app-table">
                                <thead>
                                    <tr>
                                        <th>S.No.</th><th>Name</th><th>Sub Title</th><th>Person</th><th>Address</th><th>City</th><th>Phone</th><th>Bank</th><th>Acc No.</th><th>IFSC</th><th>OTHER (GSTIN/Disc)</th><th>Add Date</th><th>Status</th><th>Action</th>
                                    </tr>
                                </thead>
                                <tbody ref={tableBodyRef}>
                                    {currentPublications.map((pubItem, index) => (
                                        <tr key={pubItem._id}>
                                            <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                            <td>{pubItem.name}</td>
                                            <td>

                                                {/* Display Subtitles */}
                                                <div className="subtitle-list">
                                                    <button
                                                        className="toggle-subtitles-btn"
                                                        onClick={() => setIsOpen(prev => !prev)}
                                                    >
                                                        {isOpen ? "Hide Subtitles" : "Show Subtitles"}
                                                        {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                                                    </button>

                                                    {isOpen && (
                                                        <div className="subtitle-dropdown">
                                                            {pubItem.subtitles && pubItem.subtitles.length > 0 ? (
                                                                pubItem.subtitles.map(sub => (
                                                                    <span key={sub._id} className="subtitle-tag">
                                                                        {sub.name}
                                                                        <button
                                                                            className="remove-subtitle-btn"
                                                                            onClick={() => handleRemoveSubtitle(sub._id, pubItem._id, sub.name)}
                                                                            title="Remove Subtitle"
                                                                            disabled={loading}
                                                                        >
                                                                            <FaTimes />
                                                                        </button>
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span>No subtitles</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                            </td>
                                            <td>{pubItem.personName}</td>
                                            <td>{pubItem.address}</td>
                                            <td>{pubItem.city ? pubItem.city.name : 'N/A'}</td>
                                            <td>{pubItem.mobileNumber}</td>
                                            <td>{pubItem.bank}</td>
                                            <td>{pubItem.accountNumber}</td>
                                            <td>{pubItem.ifsc}</td>
                                            <td>
                                                {pubItem.gstin && `GSTIN: ${pubItem.gstin}`}
                                                {pubItem.gstin && pubItem.discount > 0 && <br />}
                                                {pubItem.discount > 0 && `DISCOUNT: ${pubItem.discount}%`}
                                            </td>
                                            <td>{formatDateWithTime(pubItem.createdAt)}</td>
                                            <td>
                                                <span className={`status-badge ${pubItem.status}`}>
                                                    {pubItem.status.charAt(0).toUpperCase() + pubItem.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="actions-column">
                                                <button
                                                    onClick={() => handleEdit(pubItem)}
                                                    className="action-icon-button edit-button"
                                                    title="Edit Publication"
                                                    disabled={loading}
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => openConfirmModal(pubItem)}
                                                    className="action-icon-button delete-button"
                                                    title="Delete Publication"
                                                    disabled={loading}
                                                >
                                                    {loading && publicationToDeleteId === pubItem._id ? <FaSpinner className="animate-spin" /> : <FaTrashAlt />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="pagination-controls">
                                    <button onClick={goToPrevPage} disabled={currentPage === 1 || loading} className="btn btn-page">
                                        <FaChevronLeft /> Previous
                                    </button>
                                    <span>Page {currentPage} of {totalPages}</span>
                                    <button onClick={goToNextPage} disabled={currentPage === totalPages || loading} className="btn btn-page">
                                        Next <FaChevronRight />
                                    </button>
                                </div>
                            )}
                            <div className="total-records text-center mt-2">
                                Total Records: {filteredPublications.length}
                            </div>
                        </div>
                    )}
                </div>


            </div> {/* End of main-content-layout */}

            {/* Confirmation Modal for Publication Deletion */}
            {showConfirmModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to delete publication: <strong>{publicationToDeleteName}</strong>?</p>
                        <div className="modal-actions">
                            <button onClick={confirmDelete} className="btn btn-danger" disabled={loading}>
                                {loading ? <FaSpinner className="btn-icon-mr animate-spin" /> : 'Delete'}
                            </button>
                            <button onClick={closeConfirmModal} className="btn btn-secondary" disabled={loading}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Subtitle Management Modal */}
            {showSubtitleModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Add Subtitle {editingPublicationId ? `for "${selectedPublicationForSubtitle?.name}"` : 'for New Publication'}</h3>
                        <form onSubmit={handleAddSubtitle}>
                            <div className="form-group">
                                <label htmlFor="newSubtitleName">Subtitle Name:</label>
                                <input
                                    type="text"
                                    id="newSubtitleName"
                                    name="newSubtitleName"
                                    value={newSubtitleName}
                                    onChange={(e) => setNewSubtitleName(e.target.value)}
                                    placeholder="e.g., Class 10 Edition, Volume 2"
                                    required
                                    disabled={subtitleModalLoading}
                                    className="form-input"
                                />
                            </div>
                            {subtitleModalError && (
                                <p className="error-message text-center">{subtitleModalError}</p>
                            )}
                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary" disabled={subtitleModalLoading}>
                                    {subtitleModalLoading ? <FaSpinner className="btn-icon-mr animate-spin" /> : 'Add Subtitle'}
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={closeSubtitleModal} disabled={subtitleModalLoading}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicationManagement;