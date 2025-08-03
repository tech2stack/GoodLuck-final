// src/components/masters/CustomerManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api'; // API utility for backend calls
import { FaEdit, FaTrashAlt, FaPlusCircle, FaSearch, FaFilePdf, FaChevronLeft, FaChevronRight, FaSpinner, FaTimesCircle } from 'react-icons/fa'; // Icons for UI

// Stylesheets (assuming these are already present and styled for consistency)
import '../../styles/Form.css';
import '../../styles/Table.css';
import '../../styles/Modal.css';
// Import the new CustomerManagement specific styles
import '../../styles/CustomerManagement.css'; // NEW: Import specific styles

// NOTE: jsPDF and jspdf-autotable are expected to be loaded globally via CDN in public/index.html
// If you are using npm, you'd do: npm install jspdf jspdf-autotable
// Then import them here:
// import { jsPDF } = require('jspdf'); // This syntax is incorrect for modern JS modules
// import 'jspdf-autotable';

// Import the logo image directly (assuming it exists at this path for PDF)
import companyLogo from '../../assets/glbs-logo.jpg';


const CustomerManagement = ({ showFlashMessage }) => {
    // Backend base URL ko environment variable se fetch karein.
    // Ismein sirf domain aur port hoga, /api/v1 nahi.
    const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

    // State for managing list of customers
    const [customers, setCustomers] = useState([]);
    // States for dropdown data (Branches and Cities)
    const [branches, setBranches] = useState([]);
    const [cities, setCities] = useState([]);
    // State for form inputs
    const [formData, setFormData] = useState({
        customerName: '',
        schoolCode: '',
        branch: '', // Will store Branch ID
        city: '',   // Will store City ID
        contactPerson: '',
        mobileNumber: '',
        email: '',
        gstNumber: '',
        aadharNumber: '',
        panNumber: '',
        shopAddress: '',
        homeAddress: '',
        status: 'active', // Default status
    });
    const [selectedImageFile, setSelectedImageFile] = useState(null); // To store the actual File object
    const [imagePreviewUrl, setImagePreviewUrl] = useState(''); // To display image preview

    // State for loading indicators
    const [loading, setLoading] = useState(false);
    // State for managing local errors (e.g., form validation)
    const [localError, setLocalError] = useState(null);
    // State to track if we are in edit mode and which customer is being edited
    const [editingCustomerId, setEditingCustomerId] = useState(null);

    // States for confirmation modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [customerToDeleteId, setCustomerToDeleteId] = useState(null);
    const [customerToDeleteName, setCustomerToDeleteName] = useState('');

    // Ref for scrolling to the new item in the table (if needed)
    const tableBodyRef = useRef(null);

    // States for Search
    const [searchTerm, setSearchTerm] = useState('');

    // NEW: State for Branch Filter
    const [selectedBranchFilter, setSelectedBranchFilter] = useState(''); // Stores branch ID for filtering


    // States for Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Show 10 entries per page


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

    // --- Helper function to safely get string value or 'N/A' ---
    const getStringValue = (field) => field ? String(field).trim() : 'N/A';

    // --- Helper function to get address string ---
    const getAddressString = (customer) => {
        const shop = getStringValue(customer.shopAddress);
        const home = getStringValue(customer.homeAddress);
        let addressParts = [];
        if (shop !== 'N/A') addressParts.push(`Shop: ${shop}`);
        if (home !== 'N/A') addressParts.push(`Home: ${home}`);
        return addressParts.length > 0 ? addressParts.join('\n') : 'N/A';
    };

    // --- Helper function to get documents string ---
    const getDocumentsString = (customer) => {
        const docs = [];
        if (customer.aadharNumber) docs.push(`Aadhar: ${getStringValue(customer.aadharNumber)}`);
        if (customer.panNumber) docs.push(`PAN: ${getStringValue(customer.panNumber)}`);
        if (customer.gstNumber) docs.push(`GST: ${getStringValue(customer.gstNumber)}`);
        return docs.length > 0 ? docs.join('\n') : 'N/A';
    };


    // --- Fetch Customers ---
    const fetchCustomers = useCallback(async (scrollToNew = false) => {
        setLoading(true);
        setLocalError(null);
        try {
            // Construct query parameters, including the branch filter
            const queryParams = new URLSearchParams();
            if (selectedBranchFilter) {
                queryParams.append('branch', selectedBranchFilter);
            }
            // Add search term if present
            if (searchTerm) {
                queryParams.append('search', searchTerm); // Assuming backend handles a 'search' parameter
            }


            const response = await api.get(`/customers?${queryParams.toString()}`);
            console.log('API Response for customers:', response.data); // Debugging: Log full response
            if (response.data.status === 'success' && response.data.data && Array.isArray(response.data.data.customers)) {
                setCustomers(response.data.data.customers);
                console.log('Customers fetched and set to state:', response.data.data.customers); // Debugging: Confirm state update

                const totalPagesCalculated = Math.ceil(response.data.data.customers.length / itemsPerPage);
                if (currentPage > totalPagesCalculated && totalPagesCalculated > 0) {
                    setCurrentPage(totalPagesCalculated);
                } else if (response.data.data.customers.length === 0) {
                    setCurrentPage(1);
                }

                if (scrollToNew && tableBodyRef.current) {
                    setTimeout(() => {
                        const lastPageIndex = Math.ceil(response.data.data.customers.length / itemsPerPage);
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
                setLocalError(response.data.message || 'Failed to fetch customers due to unexpected response structure.');
            }
        } catch (err) {
            console.error('Error fetching customers:', err);
            setLocalError(err.response?.data?.message || 'Failed to load customers due to network error.');
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, selectedBranchFilter, searchTerm]); // Added selectedBranchFilter and searchTerm to dependencies

    // --- Fetch Branches and Cities for Dropdowns ---
    const fetchDropdownData = useCallback(async () => {
        setLoading(true); // Set loading true for dropdowns
        try {
            const [branchesRes, citiesRes] = await Promise.all([
                api.get('/branches'),
                api.get('/cities')
            ]);

            let fetchedBranches = [];
            console.log('DEBUG: branchesRes.data received:', branchesRes.data); // Log full response data for branches
            // Refined check for branches array based on the 'success' boolean field
            if (branchesRes.data && branchesRes.data.success) {
                if (Array.isArray(branchesRes.data.data)) { // Prioritize: if array is directly under 'data'
                    fetchedBranches = branchesRes.data.data;
                    console.log('DEBUG: Branches found directly under data.data');
                } else if (branchesRes.data.data && Array.isArray(branchesRes.data.data.branches)) { // Fallback: if array is under 'data.branches'
                    fetchedBranches = branchesRes.data.data.branches;
                    console.log('DEBUG: Branches found under data.data.branches');
                } else if (Array.isArray(branchesRes.data)) { // Fallback: if array is directly under the root response.data
                    fetchedBranches = branchesRes.data;
                    console.log('DEBUG: Branches found directly under response.data');
                } else {
                    console.warn('DEBUG: Branches data array not found in expected paths within branchesRes.data');
                }
                setBranches(fetchedBranches);
            } else {
                console.error('Failed to fetch branches: Unexpected response structure or status not success.', branchesRes.data);
                showFlashMessage(branchesRes.data?.message || 'Failed to load branches for dropdown.', 'error');
            }

            let fetchedCities = [];
            console.log('DEBUG: citiesRes.data received:', citiesRes.data); // Log full response data for cities
            // Check for cities array based on the 'status' string field
            if (citiesRes.data && citiesRes.data.status === 'success') {
                if (citiesRes.data.data && Array.isArray(citiesRes.data.data.cities)) {
                    fetchedCities = citiesRes.data.data.cities;
                    console.log('DEBUG: Cities found under data.data.cities');
                } else if (citiesRes.data.data && Array.isArray(citiesRes.data.data)) { // Fallback: if array is directly under 'data'
                    fetchedCities = citiesRes.data.data;
                    console.log('DEBUG: Cities found directly under data.data');
                } else if (Array.isArray(citiesRes.data)) { // Fallback: if array is directly under the root response.data
                    fetchedCities = citiesRes.data;
                    console.log('DEBUG: Cities found directly under response.data');
                } else {
                    console.warn('DEBUG: Cities data array not found in expected nested paths within citiesRes.data');
                }
                setCities(fetchedCities);
            } else {
                console.error('Failed to fetch cities: Unexpected response structure or status not success.', citiesRes.data);
                showFlashMessage(citiesRes.data?.message || 'Failed to load cities for dropdown.', 'error');
            }

            // Set initial dropdown values if not in edit mode and data is available
            if (!editingCustomerId) {
                setFormData(prev => ({
                    ...prev,
                    branch: fetchedBranches.length > 0 ? fetchedBranches[0]._id : '',
                    city: fetchedCities.length > 0 ? fetchedCities[0]._id : ''
                }));
            }

        } catch (err) {
            console.error('Error fetching dropdown data:', err);
            // More specific error message for network/API issues
            const errorMessage = err.response?.data?.message || 'Network error fetching dropdown data (Branches/Cities). Please ensure backend is running and accessible.';
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    }, [editingCustomerId, showFlashMessage]);

    // Fetch data on component mount and when filters change
    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]); // Now depends on selectedBranchFilter and searchTerm via fetchCustomers

    useEffect(() => {
        fetchDropdownData();
    }, [fetchDropdownData]); // This fetches branches and cities once or when editingCustomerId changes


    // --- Form Handling ---
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value
        }));
    };

    // --- Handle Image File Change ---
    const handleImageFileChange = (e) => {
        const file = e.target.files[0];
        const MAX_FILE_SIZE_MB = 5; // 5 MB limit
        const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

        if (file) {
            if (file.size > MAX_FILE_SIZE_BYTES) {
                showFlashMessage(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit. Please choose a smaller image.`, 'error');
                e.target.value = null; // Clear the input
                setSelectedImageFile(null);
                setImagePreviewUrl('');
                return;
            }

            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                showFlashMessage('Invalid file type. Please upload an image (JPEG, PNG, GIF, WEBP).', 'error');
                e.target.value = null; // Clear the input
                setSelectedImageFile(null);
                setImagePreviewUrl('');
                return;
            }


            setSelectedImageFile(file); // Store the File object
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviewUrl(reader.result); // Store Base64 string for preview
                console.log('Selected image for preview.');
            };
            reader.onerror = (error) => {
                console.error("Error reading file:", error);
                showFlashMessage('Failed to read image file.', 'error');
                setSelectedImageFile(null);
                setImagePreviewUrl('');
            };
            reader.readAsDataURL(file); // Read file as Base64 for preview
        } else {
            setSelectedImageFile(null);
            setImagePreviewUrl('');
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setLocalError(null);

        // Basic validation
        if (!formData.customerName || !formData.branch || !formData.city || !formData.mobileNumber) {
            setLocalError('Please fill in all required fields: Customer Name, Branch, City, Mobile Number.');
            showFlashMessage('Please fill in all required fields.', 'error');
            setLoading(false);
            return;
        }

        const dataToSend = new FormData();
        // Append all form data fields
        // Ensure values are explicitly strings or File objects
        console.log('--- Populating FormData ---');
        for (const key in formData) {
            const value = formData[key];
            console.log(`Attempting to append: ${key}:`, value); // Log value before conversion
            if (value !== null && value !== undefined) {
                dataToSend.append(key, String(value)); // Explicitly convert to string
                console.log(`Appended ${key}: "${String(value)}"`);
            } else {
                dataToSend.append(key, ''); // Append empty string for null/undefined fields
                console.log(`Appended ${key}: "" (empty string for null/undefined)`);
            }
        }

        // --- Image Handling Logic for FormData ---
        if (selectedImageFile) {
            // Case 1: A new image file has been selected by the user.
            dataToSend.append('image', selectedImageFile);
            console.log('Appended new image file:', selectedImageFile.name);
        } else if (editingCustomerId && imagePreviewUrl && !imagePreviewUrl.startsWith('data:image/')) {
            // Case 2: In edit mode, and there's an existing image URL (not a new base64 preview).
            // This means the user did not select a new file, and we should retain the existing one.
            // Send the existing URL back to the backend.
            dataToSend.append('image', imagePreviewUrl);
            console.log('Appended existing image URL (no new file selected):', imagePreviewUrl);
        } else if (editingCustomerId && imagePreviewUrl === '') {
            // Case 3: In edit mode, and imagePreviewUrl is explicitly empty.
            // This means the user cleared the image. Send an empty string to signal removal.
            dataToSend.append('image', '');
            console.log('Appended empty string for image (user cleared existing image).');
        } else if (!editingCustomerId && imagePreviewUrl === '') {
            // Case 4: In add mode, and no image selected.
            dataToSend.append('image', '');
            console.log('Appended empty string for image (add mode, no image selected).');
        }
        // Implicit Case: If in edit mode, selectedImageFile is null, and imagePreviewUrl is a base64 string,
        // it means a file was selected for *preview* but not for *upload* in this specific update action.
        // In this scenario, we do NOT append the 'image' field to FormData.
        // The backend will then correctly infer that no new image was provided and retain the old image.
        // This prevents sending large base64 strings unnecessarily.
        console.log('--- FormData Population Complete ---');


        try {
            let response;
            if (editingCustomerId) {
                console.log('Attempting to update customer with ID:', editingCustomerId);
                console.log('FormData state before sending:', formData); // Log the React state formData

                // Log the FormData content (for debugging multipart/form-data, you can't directly log it,
                // but you can iterate over its entries)
                console.log('FormData entries being sent for update:');
                for (let [key, value] of dataToSend.entries()) {
                    console.log(`FormData Entry - ${key}:`, value); // Log value directly, not stringified for File objects
                }

                // Update existing customer
                response = await api.patch(`/customers/${editingCustomerId}`, dataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }, // Important for file uploads
                });
                if (response.data.status === 'success') {
                    showFlashMessage('Customer updated successfully!', 'success');
                } else {
                    throw new Error(response.data.message || 'Failed to update customer.');
                }
            } else {
                // Create new customer
                response = await api.post('/customers', dataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }, // Important for file uploads
                });
                if (response.data.status === 'success') {
                    showFlashMessage('Customer created successfully!', 'success');
                } else {
                    throw new Error(response.data.message || 'Failed to create customer.');
                }
            }
            console.log('Customer saved successfully. Response:', response.data); // Debugging: Confirm save
            // Reset form and re-fetch customers
            setFormData({
                customerName: '', schoolCode: '', branch: branches.length > 0 ? branches[0]._id : '',
                city: cities.length > 0 ? cities[0]._id : '', contactPerson: '', mobileNumber: '',
                email: '', gstNumber: '', aadharNumber: '', panNumber: '', shopAddress: '',
                homeAddress: '',
                status: 'active'
            });
            setSelectedImageFile(null);
            setImagePreviewUrl('');
            setEditingCustomerId(null);
            fetchCustomers(true); // Re-fetch and indicate to scroll
        } catch (err) {
            console.error('Error saving customer:', err);
            const errorMessage = err.response?.data?.message || 'Failed to save customer. Please check your input and ensure unique fields (Name, Mobile, Email, GST, Aadhar, PAN) are not duplicated.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Edit and Delete Operations ---
    const handleEdit = (customerItem) => {
        console.log('handleEdit: customerItem received:', customerItem); // NEW: Log the entire item
        console.log('handleEdit: customerItem.branch:', customerItem.branch); // NEW: Log branch object
        console.log('handleEdit: customerItem.city:', customerItem.city);   // NEW: Log city object

        setFormData({
            customerName: customerItem.customerName || '',
            schoolCode: customerItem.schoolCode || '',
            branch: customerItem.branch?._id || '', // Set branch ID
            city: customerItem.city?._id || '',     // Set city ID
            contactPerson: customerItem.contactPerson || '',
            mobileNumber: customerItem.mobileNumber || '',
            email: customerItem.email || '',
            gstNumber: customerItem.gstNumber || '',
            aadharNumber: customerItem.aadharNumber || '',
            panNumber: customerItem.panNumber || '',
            shopAddress: customerItem.shopAddress || '',
            homeAddress: customerItem.homeAddress || '',
            status: customerItem.status || 'active'
        });
        setImagePreviewUrl(customerItem.image ? (customerItem.image.startsWith('/customer-logos/') ? `${BACKEND_BASE_URL}/uploads${customerItem.image}` : customerItem.image) : '');
        setSelectedImageFile(null); // No file selected during edit initially
        setEditingCustomerId(customerItem._id);
        setLocalError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to form
    };

    const openConfirmModal = (customerItem) => {
        setCustomerToDeleteId(customerItem._id);
        setCustomerToDeleteName(customerItem.customerName);
        setShowConfirmModal(true);
    };

    const closeConfirmModal = () => {
        setShowConfirmModal(false);
        setCustomerToDeleteId(null);
        setCustomerToDeleteName('');
    };

    const confirmDelete = async () => {
        setLoading(true);
        setLocalError(null);
        closeConfirmModal();

        try {
            const response = await api.delete(`/customers/${customerToDeleteId}`);
            if (response.status === 204) {
                showFlashMessage('Customer deleted successfully!', 'success');
                fetchCustomers();
            } else {
                throw new Error(response.data?.message || 'Failed to delete customer.');
            }
        } catch (err) {
            console.error('Error deleting customer:', err);
            const errorMessage = err.response?.data?.message || 'Failed to delete customer.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setFormData({
            customerName: '', schoolCode: '', branch: branches.length > 0 ? branches[0]._id : '',
            city: cities.length > 0 ? cities[0]._id : '', contactPerson: '', mobileNumber: '',
            email: '', gstNumber: '', aadharNumber: '', panNumber: '', shopAddress: '',
            homeAddress: '',
            status: 'active'
        });
        setSelectedImageFile(null);
        setImagePreviewUrl('');
        setEditingCustomerId(null);
        setLocalError(null);
    };

    // --- Search Filtering (now handled by API call in fetchCustomers) ---
    // The filtering is now done on the backend via the 'search' query parameter
    // and 'branch' query parameter. The 'customers' state already holds the filtered data.

    // --- Pagination Logic ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = customers.slice(indexOfFirstItem, indexOfLastItem); // Use 'customers' directly as filtering is via API
    const totalPages = Math.ceil(customers.length / itemsPerPage); // Use 'customers.length' for total pages

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

        // Changed: Set PDF to A4 portrait
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
            doc.text("Customer List Report", doc.internal.pageSize.width / 2, startYPositionForTable + 10, { align: 'center' });

            // Add a line separator below the main title
            doc.setLineWidth(0.5);
            doc.line(14, startYPositionForTable + 15, doc.internal.pageSize.width - 14, startYPositionForTable + 15); // Line spanning almost full width

            // Update startYPositionForTable for autoTable
            const tableStartY = startYPositionForTable + 20;


            // Generate table data
            const tableColumn = [
                "S.No.", "Name (Code)", "Branch", "City", "Contact Person", "Mobile", "Email",
                "Documents", "Address"
            ];
            const tableRows = [];

            customers.forEach((customer, index) => { // Use 'customers' directly for PDF generation
                const documents = [];
                if (customer.aadharNumber) documents.push(`Aadhar: ${getStringValue(customer.aadharNumber)}`);
                if (customer.panNumber) documents.push(`PAN: ${getStringValue(customer.panNumber)}`);
                if (customer.gstNumber) documents.push(`GST: ${getStringValue(customer.gstNumber)}`);

                // Construct the full image URL for PDF
                // Now, customer.image will be like '/customer-logos/image.jpg'
                const imageUrlForPdf = customer.image && customer.image.startsWith('/customer-logos/')
                    ? `${BACKEND_BASE_URL}/uploads${customer.image}`
                    : customer.image;

                const customerData = [
                    String(index + 1), // S.No.
                    `${getStringValue(customer.customerName)} ${customer.schoolCode ? `(${getStringValue(customer.schoolCode)})` : ''}`.trim(), // Name and School Code
                    customer.branch ? getStringValue(customer.branch.name) : 'N/A',
                    customer.city ? getStringValue(customer.city.name) : 'N/A',
                    getStringValue(customer.contactPerson),
                    getStringValue(customer.mobileNumber),
                    getStringValue(customer.email),
                    documents.join('\n') || 'N/A', // Combine documents
                    `${getStringValue(customer.shopAddress)}\n${getStringValue(customer.homeAddress)}`.trim() || 'N/A', // Combine addresses
                    imageUrlForPdf && (imageUrlForPdf.startsWith('data:image/') || imageUrlForPdf.startsWith('http')) ? 'Image Available' : 'No Image', // Check if it's a Base64 image or URL
                    formatDateWithTime(customer.createdAt),
                    getStringValue(customer.status).charAt(0).toUpperCase() + getStringValue(customer.status).slice(1)
                ];
                tableRows.push(customerData);
            });

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
                    6: { cellWidth: 'auto', halign: 'left' }, 7: { cellWidth: 'auto', halign: 'left' },
                    8: { cellWidth: 'auto', halign: 'left' }, 9: { cellWidth: 'auto', halign: 'center' }, // Logo column
                    10: { halign: 'center' }, 11: { halign: 'center' }
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
            doc.save(`Customer_List_${new Date().toLocaleDateString('en-CA').replace(/\//g, '-')}.pdf`);
            showFlashMessage('Customer list downloaded as PDF!', 'success');
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
        doc.text(`Date: ${formatDateWithTime(new Date())}`, doc.internal.pageSize.width - 14, 20, { align: 'right' });
    };

    // --- UI Rendering ---
    return (
        <div className="customer-management-container">
            <h2 className="page-section-title">Customer Management</h2> {/* Renamed class */}

            {localError && (
                <p className="error-message text-center">
                    <FaTimesCircle className="icon error-icon mr-2" /> {localError} {/* Added icon and margin utility */}
                </p>
            )}

            {/* Main content layout for two columns */}
            <div className="main-content-layout">
                {/* Customer List Table - FIRST CHILD */}
                <div className="table-container"> {/* Renamed class from table-section to table-container (for the card) */}
                    <h3 className="table-title">Existing Customers</h3>

                    {/* Search and Filter Section */}
                    <div className="table-controls">
                        <div className="search-input-group">
                            <input
                                type="text"
                                placeholder="Search by Name, Mobile, Email, GST, Aadhar, PAN..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1); // Reset to first page on search
                                }}
                                className="search-input"
                                disabled={loading}
                            />
                            <FaSearch className="search-icon" />
                        </div>

                        <div className="filter-group">
                            <label htmlFor="branchFilter" className="sr-only">Filter by Branch:</label>
                            <select
                                id="branchFilter"
                                value={selectedBranchFilter}
                                onChange={(e) => {
                                    setSelectedBranchFilter(e.target.value);
                                    setCurrentPage(1); // Reset to first page on filter change
                                }}
                                className="filter-select"
                                disabled={loading || branches.length === 0}
                            >
                                <option value="">All Branches</option>
                                {branches.map(branch => (
                                    <option key={branch._id} value={branch._id}>
                                        {branch.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button onClick={downloadPdf} className="download-pdf-btn" disabled={loading || customers.length === 0}>
                            <FaFilePdf className="icon mr-2" /> Download PDF {/* Renamed class */}
                        </button>
                    </div>

                    {loading && customers.length === 0 ? (
                        <p className="loading-state text-center">
                            <FaSpinner className="icon animate-spin mr-2" /> Loading customers... {/* Added icon class */}
                        </p>
                    ) : customers.length === 0 ? (
                        <p className="no-data-message text-center">No customers found matching your criteria. Start by adding one!</p>
                    ) : (
                        <div className="table-scroll-wrapper"> {/* Renamed class for table overflow */}
                            <table className="app-table"> {/* Renamed class from data-table to app-table */}
                                <thead>
                                    <tr>
                                        <th>S.No.</th>
                                        <th>Customer Name (Code)</th>
                                        <th>Branch</th>
                                        <th>City</th>
                                        <th>Contact Person</th>
                                        <th>Mobile</th>
                                        <th>Email</th>
                                        <th>Documents</th>
                                        <th>Address</th>
                                        <th>Logo</th>
                                        <th>Add Date</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody ref={tableBodyRef}>
                                    {currentItems.map((customer, index) => (
                                        <tr key={customer._id}>
                                            <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                            <td>{`${customer.customerName} ${customer.schoolCode ? `(${customer.schoolCode})` : ''}`}</td>
                                            <td>{customer.branch?.name || 'N/A'}</td>
                                            <td>{customer.city?.name || 'N/A'}</td>
                                            <td>{customer.contactPerson}</td>
                                            <td>{customer.mobileNumber}</td>
                                            <td>{customer.email || 'N/A'}</td>
                                            <td>{getDocumentsString(customer)}</td>
                                            <td>{getAddressString(customer)}</td>
                                            <td>
                                                {customer.image ? (
                                                    <img
                                                        src={customer.image.startsWith('/customer-logos/') ? `${BACKEND_BASE_URL}/uploads${customer.image}` : customer.image}
                                                        alt="Customer Logo"
                                                        className="customer-logo-thumbnail"
                                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/50x50/e0e0e0/ffffff?text=No+Logo'; }}
                                                    />
                                                ) : (
                                                    'No Logo'
                                                )}
                                            </td>
                                            <td>{formatDateWithTime(customer.createdAt)}</td>
                                            <td>
                                                <span className={`status-badge ${customer.status}`}>
                                                    {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="actions-column">
                                                <button
                                                    onClick={() => handleEdit(customer)}
                                                    className="action-icon-button edit-button"
                                                    title="Edit Customer"
                                                    disabled={loading}
                                                >
                                                    <FaEdit className="icon" /> {/* Added icon class */}
                                                </button>
                                                <button
                                                    onClick={() => openConfirmModal(customer)}
                                                    className="action-icon-button delete-button"
                                                    title="Delete Customer"
                                                    disabled={loading}
                                                >
                                                    {loading && customerToDeleteId === customer._id ? <FaSpinner className="icon animate-spin" /> : <FaTrashAlt className="icon" />} {/* Added icon class */}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="pagination-controls">
                                    <button onClick={goToPrevPage} disabled={currentPage === 1 || loading} className="btn-page"> {/* Renamed class */}
                                        <FaChevronLeft className="icon mr-2" /> Previous {/* Renamed class */}
                                    </button>
                                    <span>Page {currentPage} of {totalPages}</span>
                                    <button onClick={goToNextPage} disabled={currentPage === totalPages || loading} className="btn-page"> {/* Renamed class */}
                                        Next <FaChevronRight className="icon ml-2" /> {/* Renamed class */}
                                    </button>
                                </div>
                            )}
                            <div className="total-records text-center mt-2">
                                Total Records: {customers.length}
                            </div>
                        </div>
                    )}
                </div>

                {/* Customer Creation/Update Form - SECOND CHILD */}
                <div className="form-container-card">
                    <form onSubmit={handleSubmit} className="app-form">
                        <h3 className="form-title">{editingCustomerId ? 'Edit Customer' : 'Add New Customer'}</h3>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="customerName">Customer Name:</label>
                                <input
                                    type="text"
                                    id="customerName"
                                    name="customerName"
                                    value={formData.customerName}
                                    onChange={handleChange}
                                    placeholder="e.g., ABC School"
                                    required
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="schoolCode">School Code:</label>
                                <input
                                    type="text"
                                    id="schoolCode"
                                    name="schoolCode"
                                    value={formData.schoolCode}
                                    onChange={handleChange}
                                    placeholder="e.g., SCH001"
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="branch">Branch:</label>
                                <select
                                    id="branch"
                                    name="branch"
                                    value={formData.branch}
                                    onChange={handleChange}
                                    required
                                    disabled={loading || branches.length === 0}
                                    className="form-select"
                                >
                                    {branches.length === 0 ? (
                                        <option value="">Loading Branches...</option>
                                    ) : (
                                        <>
                                            <option value="">-- SELECT BRANCH --</option>
                                            {branches.map(branch => (
                                                <option key={branch._id} value={branch._id}>
                                                    {branch.name}
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="city">City:</label>
                                <select
                                    id="city"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    required
                                    disabled={loading || cities.length === 0}
                                    className="form-select"
                                >
                                    {cities.length === 0 ? (
                                        <option value="">Loading Cities...</option>
                                    ) : (
                                        <>
                                            <option value="">-- SELECT CITY --</option>
                                            {cities.map(city => (
                                                <option key={city._id} value={city._id}>
                                                    {city.name}
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="contactPerson">Contact Person:</label>
                                <input
                                    type="text"
                                    id="contactPerson"
                                    name="contactPerson"
                                    value={formData.contactPerson}
                                    onChange={handleChange}
                                    placeholder="e.g., Jane Doe"
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
                                <label htmlFor="email">Email:</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="e.g., info@example.com"
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="gstNumber">GST Number:</label>
                                <input
                                    type="text"
                                    id="gstNumber"
                                    name="gstNumber"
                                    value={formData.gstNumber}
                                    onChange={handleChange}
                                    placeholder="e.g., 22AAAAA0000A1Z5"
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="aadharNumber">Aadhar Number:</label>
                                <input
                                    type="text"
                                    id="aadharNumber"
                                    name="aadharNumber"
                                    value={formData.aadharNumber}
                                    onChange={handleChange}
                                    placeholder="e.g., XXXX XXXX XXXX"
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="panNumber">PAN Number:</label>
                                <input
                                    type="text"
                                    id="panNumber"
                                    name="panNumber"
                                    value={formData.panNumber}
                                    onChange={handleChange}
                                    placeholder="e.g., ABCDE1234F"
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="shopAddress">Shop Address:</label>
                            <textarea
                                id="shopAddress"
                                name="shopAddress"
                                value={formData.shopAddress}
                                onChange={handleChange}
                                placeholder="Full Shop Address"
                                disabled={loading}
                                className="form-textarea"
                            ></textarea>
                        </div>

                        <div className="form-group">
                            <label htmlFor="homeAddress">Home Address:</label>
                            <textarea
                                id="homeAddress"
                                name="homeAddress"
                                value={formData.homeAddress}
                                onChange={handleChange}
                                placeholder="Full Home Address"
                                disabled={loading}
                                className="form-textarea"
                            ></textarea>
                        </div>

                        <div className="form-group">
                            <label htmlFor="customerImage">Customer Logo:</label>
                            <input
                                type="file"
                                id="customerImage"
                                name="image" // Ensure this matches the backend field name for file upload
                                accept="image/*"
                                onChange={handleImageFileChange}
                                disabled={loading}
                                className="form-input-file"
                            />
                            {imagePreviewUrl && (
                                <div className="image-preview-container">
                                    <img src={imagePreviewUrl} alt="Customer Preview" className="image-preview" />
                                    <button
                                        type="button"
                                        className="clear-image-btn"
                                        onClick={() => {
                                            setSelectedImageFile(null);
                                            setImagePreviewUrl('');
                                            // Clear the file input visually as well
                                            const fileInput = document.getElementById('customerImage');
                                            if (fileInput) fileInput.value = '';
                                        }}
                                        disabled={loading}
                                    >
                                        <FaTimesCircle className="icon mr-1" /> Clear Image {/* Added icon and margin utility */}
                                    </button>
                                </div>
                            )}
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
                            <button type="submit" className="btn-primary" disabled={loading}> {/* Renamed class */}
                                {loading ? <FaSpinner className="icon mr-2 animate-spin" /> : (editingCustomerId ? 'Update Customer' : 'Add Customer')} {/* Added icon class */}
                            </button>
                            {editingCustomerId && (
                                <button
                                    type="button"
                                    className="btn-secondary ml-2" 
                                    onClick={handleCancelEdit}
                                    disabled={loading}
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div> {/* End of main-content-layout */}

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to delete customer: <strong>{customerToDeleteName}</strong>?</p>
                        <div className="modal-actions">
                            <button onClick={confirmDelete} className="btn-danger" disabled={loading}> {/* Renamed class */}
                                {loading ? <FaSpinner className="icon mr-2 animate-spin" /> : 'Delete'} {/* Added icon class */}
                            </button>
                            <button onClick={closeConfirmModal} className="btn-secondary" disabled={loading}>Cancel</button> {/* Renamed class */}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerManagement;