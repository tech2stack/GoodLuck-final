// src/components/masters/CustomerManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api'; // API utility for backend calls
import { FaEdit, FaTrashAlt, FaPlusCircle, FaSearch, FaFilePdf, FaChevronLeft, FaChevronRight, FaSpinner, FaTimesCircle } from 'react-icons/fa'; // Icons for UI

// Stylesheets (assuming these are already present and styled for consistency)
import '../../styles/Form.css';
import '../../styles/Table.css';
import '../../styles/Modal.css';
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
    const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

    // State for managing list of customers
    const [customers, setCustomers] = useState([]);
    // States for dropdown data (Branches and Cities)
    const [branches, setBranches] = useState([]);
    const [cities, setCities] = useState([]);

    // Initial form data state
    const initialFormData = {
        customerName: '',
        schoolCode: '',
        branch: '', // Will store Branch ID
        city: '',   // Will store City ID
        contactPerson: '',
        mobileNumber: '',
        // email field is no longer required
        email: '',
        gstNumber: '',
        aadharNumber: '',
        panNumber: '',
        shopAddress: '',
        homeAddress: '',
        status: 'active', // Default status
        primaryCustomerType: null, // Change: Default to null, no radio button selected
        secondaryCustomerType: null, // Change: Secondary type is initially null
        zone: '',
        salesBy: '',
        dealer: '',
        discount: 0,
        returnTime: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        openingBalance: 0,
        balanceType: 'Dr.',
    };
    
    // State for form inputs
    const [formData, setFormData] = useState(initialFormData);
    const [selectedChequeFile, setSelectedChequeFile] = useState(null);
    const [selectedPassportFile, setSelectedPassportFile] = useState(null);
    const [selectedOtherFile, setSelectedOtherFile] = useState(null); // NEW: Other attachment file state
    const [chequeImagePreviewUrl, setChequeImagePreviewUrl] = useState('');
    const [passportImagePreviewUrl, setPassportImagePreviewUrl] = useState('');
    const [otherAttachmentPreviewUrl, setOtherAttachmentPreviewUrl] = useState(''); // NEW: Other attachment preview state

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

    // Ref for scrolling to the new item in the table
    const tableBodyRef = useRef(null);

    // States for Search
    const [searchTerm, setSearchTerm] = useState('');

    // State for Branch Filter
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
        const { name, value, type, checked } = e.target;
        
        setFormData(prev => {
            const newState = { ...prev };
    
            if (name === 'primaryCustomerType') {
                newState.primaryCustomerType = value;
                // Change: Secondary type reset when primary changes
                if (value === 'School') {
                    // Set default secondary type for 'School'
                    newState.secondaryCustomerType = 'Retail'; 
                    // Set default branch and school code if available
                    newState.branch = branches.length > 0 ? branches[0]._id : '';
                    newState.schoolCode = ''; // Default to empty
                } else {
                    // Reset fields not relevant for 'Dealer'
                    newState.secondaryCustomerType = 'Retail'; // Change: Default to 'Retail' when 'Dealer' is selected
                    newState.branch = '';
                    newState.schoolCode = '';
                }
            } else if (name === 'secondaryCustomerType') {
                newState.secondaryCustomerType = value;
            } else {
                newState[name] = type === 'number' ? (value === '' ? '' : parseFloat(value)) : value;
            }
            return newState;
        });
    };
    
    // --- Handle Image File Change ---
    const handleFileChange = (e, fieldName) => {
        const file = e.target.files[0];
        const MAX_FILE_SIZE_MB = 5; // 5 MB limit
        const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

        if (file) {
            if (file.size > MAX_FILE_SIZE_BYTES) {
                showFlashMessage(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit. Please choose a smaller image.`, 'error');
                e.target.value = null; // Clear the input
                // Reset the specific file state and preview URL
                if (fieldName === 'chequeImage') {
                    setSelectedChequeFile(null);
                    setChequeImagePreviewUrl('');
                } else if (fieldName === 'passportImage') {
                    setSelectedPassportFile(null);
                    setPassportImagePreviewUrl('');
                } else if (fieldName === 'otherAttachment') { // NEW: Handle other attachment file
                    setSelectedOtherFile(null);
                    setOtherAttachmentPreviewUrl('');
                }
                return;
            }

            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                showFlashMessage('Invalid file type. Please upload an image (JPEG, PNG, GIF, WEBP) or PDF.', 'error');
                e.target.value = null; // Clear the input
                // Reset the specific file state and preview URL
                if (fieldName === 'chequeImage') {
                    setSelectedChequeFile(null);
                    setChequeImagePreviewUrl('');
                } else if (fieldName === 'passportImage') {
                    setSelectedPassportFile(null);
                    setPassportImagePreviewUrl('');
                } else if (fieldName === 'otherAttachment') { // NEW: Handle other attachment file
                    setSelectedOtherFile(null);
                    setOtherAttachmentPreviewUrl('');
                }
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                if (fieldName === 'chequeImage') {
                    setSelectedChequeFile(file);
                    setChequeImagePreviewUrl(reader.result);
                } else if (fieldName === 'passportImage') {
                    setSelectedPassportFile(file);
                    setPassportImagePreviewUrl(reader.result);
                } else if (fieldName === 'otherAttachment') { // NEW: Handle other attachment file
                    setSelectedOtherFile(file);
                    setOtherAttachmentPreviewUrl(reader.result);
                }
                console.log(`Selected ${fieldName} for preview.`);
            };
            reader.onerror = (error) => {
                console.error("Error reading file:", error);
                showFlashMessage('Failed to read file.', 'error');
                // Reset the specific file state and preview URL
                if (fieldName === 'chequeImage') {
                    setSelectedChequeFile(null);
                    setChequeImagePreviewUrl('');
                } else if (fieldName === 'passportImage') {
                    setSelectedPassportFile(null);
                    setPassportImagePreviewUrl('');
                } else if (fieldName === 'otherAttachment') { // NEW: Handle other attachment file
                    setSelectedOtherFile(null);
                    setOtherAttachmentPreviewUrl('');
                }
            };
            reader.readAsDataURL(file); // Read file as Base64 for preview
        } else {
            // If file input is cleared
            if (fieldName === 'chequeImage') {
                setSelectedChequeFile(null);
                setChequeImagePreviewUrl('');
            } else if (fieldName === 'passportImage') {
                setSelectedPassportFile(null);
                setPassportImagePreviewUrl('');
            } else if (fieldName === 'otherAttachment') {
                setSelectedOtherFile(null);
                setOtherAttachmentPreviewUrl('');
            }
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setLocalError(null);

        // Derive final customerType from the two states
        const finalCustomerType = formData.primaryCustomerType === 'School'
            ? `School-${formData.secondaryCustomerType}`
            : formData.primaryCustomerType === 'Dealer'
                ? `Dealer-${formData.secondaryCustomerType || 'Retail'}`
                : '';
        
        // Basic validation
        // email is no longer required
        if (!formData.customerName || !formData.city || !formData.mobileNumber) {
            setLocalError('Please fill in all required fields: Customer Name, City, and Mobile Number.');
            showFlashMessage('Please fill in all required fields.', 'error');
            setLoading(false);
            return;
        }

        // Conditional validation for School-Retail
        // NOTE: The backend already has this validation, but good to have it on the frontend too
        if (finalCustomerType === 'School-Retail' || finalCustomerType === 'School-Supply') {
            if (!formData.branch || !formData.schoolCode) {
                setLocalError('For School customers, Branch and School Code are required fields.');
                showFlashMessage('For School customers, Branch and School Code are required fields.', 'error');
                setLoading(false);
                return;
            }
        }

        const dataToSend = new FormData();
        // Append all form data fields
        for (const key in formData) {
            const value = formData[key];
            if (value !== null && value !== undefined) {
                dataToSend.append(key, String(value));
            }
        }
        // IMPORTANT: Append the combined customerType field for the backend
        dataToSend.append('customerType', finalCustomerType);

        // Append image files
        if (selectedChequeFile) {
            dataToSend.append('chequeImage', selectedChequeFile);
        }
        if (selectedPassportFile) {
            dataToSend.append('passportImage', selectedPassportFile);
        }
        if (selectedOtherFile) { // NEW: Append other attachment file
            dataToSend.append('otherAttachment', selectedOtherFile);
        }

        try {
            let response;
            if (editingCustomerId) {
                // Update existing customer
                response = await api.patch(`/customers/${editingCustomerId}`, dataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                if (response.data.status === 'success') {
                    showFlashMessage('Customer updated successfully!', 'success');
                } else {
                    throw new Error(response.data.message || 'Failed to update customer.');
                }
            } else {
                // Create new customer
                response = await api.post('/customers', dataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                if (response.data.status === 'success') {
                    showFlashMessage('Customer created successfully!', 'success');
                } else {
                    throw new Error(response.data.message || 'Failed to create customer.');
                }
            }
            console.log('Customer saved successfully. Response:', response.data);
            // Reset form and re-fetch customers
            setFormData(initialFormData);
            setSelectedChequeFile(null);
            setSelectedPassportFile(null);
            setSelectedOtherFile(null); // NEW: Reset other attachment state
            setChequeImagePreviewUrl('');
            setPassportImagePreviewUrl('');
            setOtherAttachmentPreviewUrl(''); // NEW: Reset other attachment preview URL
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
        let primaryType = customerItem.customerType;
        let secondaryType = '';

        if (customerItem.customerType.includes('-')) {
            const parts = customerItem.customerType.split('-');
            primaryType = parts[0];
            secondaryType = parts[1];
        }

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
            status: customerItem.status || 'active',
            primaryCustomerType: primaryType,
            secondaryCustomerType: secondaryType,
            zone: customerItem.zone || '',
            salesBy: customerItem.salesBy || '',
            dealer: customerItem.dealer || '',
            discount: customerItem.discount || 0,
            returnTime: customerItem.returnTime || '',
            bankName: customerItem.bankName || '',
            accountNumber: customerItem.accountNumber || '',
            ifscCode: customerItem.ifscCode || '',
            openingBalance: customerItem.openingBalance || 0,
            balanceType: customerItem.balanceType || 'Dr.',
        });
        setChequeImagePreviewUrl(customerItem.chequeImage ? `${BACKEND_BASE_URL}/uploads/customer-logos/${customerItem.chequeImage}` : '');
        setPassportImagePreviewUrl(customerItem.passportImage ? `${BACKEND_BASE_URL}/uploads/customer-logos/${customerItem.passportImage}` : '');
        setOtherAttachmentPreviewUrl(customerItem.otherAttachment ? `${BACKEND_BASE_URL}/uploads/customer-logos/${customerItem.otherAttachment}` : ''); // NEW: Set preview URL for other attachment
        setSelectedChequeFile(null); // No file selected during edit initially
        setSelectedPassportFile(null);
        setSelectedOtherFile(null); // NEW: No other file selected during edit initially
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
        setFormData(initialFormData);
        setSelectedChequeFile(null);
        setSelectedPassportFile(null);
        setSelectedOtherFile(null);
        setChequeImagePreviewUrl('');
        setPassportImagePreviewUrl('');
        setOtherAttachmentPreviewUrl('');
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
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
            showFlashMessage('PDF generation library (jspdf) not loaded or accessible. Check console for details.', 'error');
            console.error("PDF generation failed: jspdf is not loaded. Ensure jspdf.umd.min.js is correctly linked in public/index.html");
            return;
        }

        if (customers.length === 0) {
            showFlashMessage('No customer data to download.', 'warning');
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
        const generateReportBody = (startYPositionForTable) => {
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 30); // Dark gray for title
            doc.text("Customer List Report", doc.internal.pageSize.width / 2, startYPositionForTable + 10, { align: 'center' });
            doc.setLineWidth(0.5);
            doc.line(14, startYPositionForTable + 15, doc.internal.pageSize.width - 14, startYPositionForTable + 15); // Line spanning almost full width
            const tableStartY = startYPositionForTable + 20;

            // Generate table data
            const tableColumn = [
                "S.No.", "Name (Type)", "Contact Person", "Mobile No.", "Address", "City", "School Code", "GST No.", "Discount", "Opening Balance", "Sales By", "Return Time"
            ];
            const tableRows = [];

            // Populate tableRows with data from filteredCustomers
            customers.forEach((customer, index) => {
                const customerType = customer.customerType ? `(${customer.customerType})` : '';
                const customerData = [
                    index + 1,
                    `${getStringValue(customer.customerName)} ${customerType}`,
                    getStringValue(customer.contactPerson),
                    getStringValue(customer.mobileNumber),
                    getAddressString(customer),
                    customer.city ? getStringValue(customer.city.name) : 'N/A',
                    getStringValue(customer.schoolCode),
                    getStringValue(customer.gstNumber),
                    getStringValue(customer.discount),
                    getStringValue(customer.openingBalance),
                    getStringValue(customer.salesBy),
                    getStringValue(customer.returnTime)
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
                    0: { cellWidth: 15, halign: 'center' },
                    1: { cellWidth: 30, halign: 'left' },
                    2: { cellWidth: 25, halign: 'left' },
                    3: { cellWidth: 25, halign: 'center' },
                    4: { cellWidth: 35, halign: 'left' },
                    5: { cellWidth: 20, halign: 'left' },
                    6: { cellWidth: 20, halign: 'center' },
                    7: { cellWidth: 25, halign: 'left' },
                    8: { cellWidth: 20, halign: 'center' },
                    9: { cellWidth: 25, halign: 'center' },
                    10: { cellWidth: 25, halign: 'left' },
                    11: { cellWidth: 25, halign: 'center' }
                },
                didParseCell: function (data) {
                    if (data.section === 'head' && data.cell.text[0] === "Name (Type)") {
                        data.cell.text = ["Name", "(Type)"];
                    }
                }
            });

            // Save the PDF
            doc.save('Customer_List_Report.pdf');
        };

        // --- Header Generation with Logo and Info ---
        const img = new Image();
        img.onload = () => {
            const imgWidth = 40; // width in mm
            const imgHeight = (img.height * imgWidth) / img.width;
            const logoX = 14; // Start X position from left margin
            const logoY = 10; // Start Y position from top margin

            // Add the image to the PDF
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

            const calculatedStartY = Math.max(logoY + imgHeight + 10, logoY + 22 + 10);
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
            <h2 className="main-section-title">Customer Management</h2>
            {localError && (
                <p className="error-message text-center">
                    <FaTimesCircle className="icon error-icon mr-2" /> {localError}
                </p>
            )}
            <div className="main-content-layout">
                {/* Customer Form - SECOND CHILD */}
                <div className="form-container">
                    <h3>{editingCustomerId ? 'Update Customer' : 'Add New Customer'}</h3>
                    <form onSubmit={handleSubmit} className="customer-form">
                        <div className="form-row">
                            <div className="form-group customer-type-group">
                                <label>Customer Type (Primary):</label>
                                <div className="radio-group">
                                    <label>
                                        <input
                                            type="radio"
                                            name="primaryCustomerType"
                                            value="Dealer"
                                            checked={formData.primaryCustomerType === 'Dealer'}
                                            onChange={handleChange}
                                            disabled={loading}
                                        /> Dealer
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="primaryCustomerType"
                                            value="School"
                                            checked={formData.primaryCustomerType === 'School'}
                                            onChange={handleChange}
                                            disabled={loading}
                                        /> School
                                    </label>
                                </div>
                            </div>
                        </div>
                        {/* Secondary radio buttons are now always visible, but conditionally disabled */}
                        <div className="form-row">
                            <div className="form-group customer-type-group">
                                <label>Customer Type (Secondary):</label>
                                <div className="radio-group">
                                    <label>
                                        <input
                                            type="radio"
                                            name="secondaryCustomerType"
                                            value="Retail"
                                            checked={formData.secondaryCustomerType === 'Retail'}
                                            onChange={handleChange}
                                            disabled={loading || !formData.primaryCustomerType}
                                        /> Retail
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="secondaryCustomerType"
                                            value="Supply"
                                            checked={formData.secondaryCustomerType === 'Supply'}
                                            onChange={handleChange}
                                            disabled={loading || !formData.primaryCustomerType}
                                        /> Supply
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="customerName">Customer Name:</label>
                                <input
                                    type="text"
                                    id="customerName"
                                    name="customerName"
                                    value={formData.customerName}
                                    onChange={handleChange}
                                    placeholder="e.g., Good Luck Book Store"
                                    required
                                    disabled={loading}
                                    className="form-input"
                                />
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

                        {/* Conditional rendering for School/Retail fields */}
                        {(formData.primaryCustomerType === 'School' && formData.secondaryCustomerType) && (
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="schoolCode">School Code:</label>
                                    <input
                                        type="text"
                                        id="schoolCode"
                                        name="schoolCode"
                                        value={formData.schoolCode}
                                        onChange={handleChange}
                                        placeholder="e.g., GSS001"
                                        disabled={loading}
                                        className="form-input"
                                    />
                                </div>
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
                            </div>
                        )}
                        
                        <div className="form-row">
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
                                    // Removed 'required' from here
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

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="zone">Zone:</label>
                                <input
                                    type="text"
                                    id="zone"
                                    name="zone"
                                    value={formData.zone}
                                    onChange={handleChange}
                                    placeholder="e.g., North"
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="salesBy">Sales By:</label>
                                <input
                                    type="text"
                                    id="salesBy"
                                    name="salesBy"
                                    value={formData.salesBy}
                                    onChange={handleChange}
                                    placeholder="e.g., Piyush Goyal"
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="discount">Discount:</label>
                                <input
                                    type="number"
                                    id="discount"
                                    name="discount"
                                    value={formData.discount}
                                    onChange={handleChange}
                                    placeholder="e.g., 10"
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="returnTime">Return Time:</label>
                                <input
                                    type="text"
                                    id="returnTime"
                                    name="returnTime"
                                    value={formData.returnTime}
                                    onChange={handleChange}
                                    placeholder="e.g., 7 days"
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="bankName">Bank Name:</label>
                                <input
                                    type="text"
                                    id="bankName"
                                    name="bankName"
                                    value={formData.bankName}
                                    onChange={handleChange}
                                    placeholder="e.g., HDFC Bank"
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="accountNumber">Account Number:</label>
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
                                <label htmlFor="ifscCode">IFSC Code:</label>
                                <input
                                    type="text"
                                    id="ifscCode"
                                    name="ifscCode"
                                    value={formData.ifscCode}
                                    onChange={handleChange}
                                    placeholder="e.g., HDFC0001234"
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="openingBalance">Opening Balance:</label>
                                <input
                                    type="number"
                                    id="openingBalance"
                                    name="openingBalance"
                                    value={formData.openingBalance}
                                    onChange={handleChange}
                                    placeholder="e.g., 5000"
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                        </div>
                        <div className="form-row">
                             <div className="form-group full-width-group">
                                <label htmlFor="balanceType">Balance Type:</label>
                                <select
                                    id="balanceType"
                                    name="balanceType"
                                    value={formData.balanceType}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="form-select"
                                >
                                    <option value="Dr.">Dr.</option>
                                    <option value="Cr.">Cr.</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group full-width-group">
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
                        <div className="form-group full-width-group">
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
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="chequeImage">Cheque Image:</label>
                                <input
                                    type="file"
                                    id="chequeImage"
                                    name="chequeImage"
                                    accept="image/*, .pdf"
                                    onChange={(e) => handleFileChange(e, 'chequeImage')}
                                    disabled={loading}
                                    className="form-input-file"
                                />
                                {chequeImagePreviewUrl && (
                                    <div className="image-preview">
                                        <img src={chequeImagePreviewUrl} alt="Cheque Preview" />
                                        <button type="button" onClick={() => setChequeImagePreviewUrl('')} className="remove-image-btn">Remove</button>
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label htmlFor="passportImage">Passport Image:</label>
                                <input
                                    type="file"
                                    id="passportImage"
                                    name="passportImage"
                                    accept="image/*, .pdf"
                                    onChange={(e) => handleFileChange(e, 'passportImage')}
                                    disabled={loading}
                                    className="form-input-file"
                                />
                                {passportImagePreviewUrl && (
                                    <div className="image-preview">
                                        <img src={passportImagePreviewUrl} alt="Passport Preview" />
                                        <button type="button" onClick={() => setPassportImagePreviewUrl('')} className="remove-image-btn">Remove</button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="form-group status-group">
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
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? <FaSpinner className="icon mr-2 animate-spin" /> : editingCustomerId ? 'Update' : 'Add'}
                            </button>
                            {editingCustomerId && (
                                <button type="button" className="btn-secondary ml-2" onClick={handleCancelEdit} disabled={loading}>
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </form>
                </div>
                {/* Customer List Table - FIRST CHILD */}
                <div className="table-container">
                    {/* <h3 className="table-title">Existing Customers</h3> */}
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
                            {/* <label htmlFor="branchFilter" className="sr-only" >Filter by Branch:</label> */}
                            <select
                                id="branchFilter"
                                value={selectedBranchFilter}
                                onChange={(e) => {
                                    setSelectedBranchFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="search-input"
                                disabled={loading || branches.length === 0}
                            >
                                <option value="">All Branches </option>
                                {branches.map(branch => (
                                    <option key={branch._id} value={branch._id}>
                                        {branch.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button onClick={downloadPdf} className="download-pdf-btn" disabled={loading || customers.length === 0}>
                            <FaFilePdf className="icon mr-2" /> Download PDF
                        </button>
                    </div>
                    {loading && customers.length === 0 ? (
                        <p className="loading-state text-center">
                            <FaSpinner className="icon animate-spin" /> Fetching customer data...
                        </p>
                    ) : customers.length === 0 ? (
                        <p className="no-records-found">No customers found.</p>
                    ) : (
                        <div className="table-scroll-container">
                            <table className="app-table">
                                <thead>
                                    <tr>
                                        <th>S.No.</th>
                                        <th>Name</th>
                                        <th>Contact Person</th>
                                        <th>Mobile No.</th>
                                        <th>Address</th>
                                        <th>City</th>
                                        <th>Status</th>
                                        <th>Created At</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody ref={tableBodyRef}>
                                    {currentItems.map((customer, index) => (
                                        <tr key={customer._id}>
                                            <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                            <td>{customer.customerName} ({customer.customerType})</td>
                                            <td>{customer.contactPerson || 'N/A'}</td>
                                            <td>{customer.mobileNumber || 'N/A'}</td>
                                            <td>{customer.shopAddress || customer.homeAddress || 'N/A'}</td>
                                            <td>{customer.city ? customer.city.name : 'N/A'}</td>
                                            <td>{customer.status}</td>
                                            <td>{formatDateWithTime(customer.createdAt)}</td>
                                            <td className="actions-column">
                                                <button onClick={() => handleEdit(customer)} className="btn-action edit">
                                                    <FaEdit />
                                                </button>
                                                <button onClick={() => openConfirmModal(customer)} className="btn-action delete">
                                                    <FaTrashAlt />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {/* Pagination Controls */}
                            {customers.length > itemsPerPage && (
                                <div className="pagination-controls">
                                    <button onClick={goToPrevPage} disabled={currentPage === 1 || loading} className="btn-page">
                                        <FaChevronLeft className="icon mr-2" /> Prev
                                    </button>
                                    <span>Page {currentPage} of {totalPages}</span>
                                    <button onClick={goToNextPage} disabled={currentPage === totalPages || loading} className="btn-page">
                                        Next <FaChevronRight className="icon ml-2" />
                                    </button>
                                </div>
                            )}
                            <div className="total-records text-center mt-2">
                                Total Records: {customers.length}
                            </div>
                        </div>
                    )}
                </div>

            </div> {/* End of main-content-layout */}

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to delete customer: <strong>{customerToDeleteName}</strong>?</p>
                        <div className="modal-actions">
                            <button onClick={confirmDelete} className="btn-danger" disabled={loading}>
                                {loading ? <FaSpinner className="icon mr-2 animate-spin" /> : 'Delete'}
                            </button>
                            <button onClick={closeConfirmModal} className="btn-secondary" disabled={loading}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerManagement;