// src/components/masters/CustomerManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api'; // API utility for backend calls
import {
    FaEdit, FaTrashAlt, FaPlusCircle, FaSearch, FaChevronLeft,
    FaChevronRight, FaSpinner, FaTimesCircle, FaEye, FaDownload,
    FaFile, FaFilePdf, FaInfoCircle, FaMinusCircle
} from 'react-icons/fa';

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
import { addHeaderAndSetStartY, addReportTitle, addTableToDoc } from '../../utils/pdfTheme';


const CustomerManagement = ({ showFlashMessage }) => {
    // Backend base URL ko environment variable se fetch karein.
    const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

    // State for managing list of customers
    const [customers, setCustomers] = useState([]);
    // States for dropdown data (Branches and Cities)
    const [branches, setBranches] = useState([]);
    const [cities, setCities] = useState([]);
    // NEW STATE: State for sales representatives
    const [salesRepresentatives, setSalesRepresentatives] = useState([]);

    // NEW STATE: State for firms
    const [firms, setFirms] = useState([]);

    // State for firm management modal
    const [showFirmModal, setShowFirmModal] = useState(false);
    const [editingFirmId, setEditingFirmId] = useState(null);
    const [firmName, setFirmName] = useState('');

    const [firmAddress, setFirmAddress] = useState('');
    const [firmRemark, setFirmRemark] = useState('');
    const [firmGstin, setFirmGstin] = useState('');
    const [selectedFirmLogo, setSelectedFirmLogo] = useState(null);
    const [firmLogoPreviewUrl, setFirmLogoPreviewUrl] = useState('');

    // Initial form data state
    const initialFormData = {
        firm: '', // NEW: Firm ID
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
        status: 'active', // Default status
        primaryCustomerType: null, // Change: Default to null, no radio button selected
        secondaryCustomerType: null, // Change: Secondary type is initially null
        salesBy: '', // This will now store Sales Representative ID
        discount: 0,
        returnTime: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        openingBalance: 0,
        balanceType: 'Dr.',
        customerShopName: '',
        age: '',
        so: '',
        customerCity: '',
        distt: '',
        state: '',
        pinCode: '',
        shopRegNo: '',
        fixedTradeDiscount: '',
        remark: '',
        goodsDeliveredTransportationPay: '',
        goodsReturnTransportationPay: '',
        finalSalesReturnMonth: '',
        finalPaymentInAccountMonth: '',
        paymentConcernPersonName: '',
        closedDate: '',
        chequeNo: '',
        chequeOfBankName: '',
        profitMargin: 0, // NEW: Added profitMargin
        advancePayment: 0, // NEW: Added advancePayment
    };

    // State for form inputs
    const [formData, setFormData] = useState(initialFormData);
    const [selectedChequeFile, setSelectedChequeFile] = useState(null);
    const [selectedPassportFile, setSelectedPassportFile] = useState(null);
    const [selectedOtherFile, setSelectedOtherFile] = useState(null); // NEW: Other attachment file state
    const [chequeImagePreviewUrl, setChequeImagePreviewUrl] = useState('');
    const [passportImagePreviewUrl, setPassportImagePreviewUrl] = useState('');
    const [otherAttachmentPreviewUrl, setOtherAttachmentPreviewUrl] = useState(''); // NEW: Other attachment preview state
    // New state to hold current attachment URLs for viewing
    const [currentAttachmentUrls, setCurrentAttachmentUrls] = useState({});
    const [showAttachmentModal, setShowAttachmentModal] = useState(false);

    const [showOtherDetails, setShowOtherDetails] = useState(false);

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
    // --- Filter States ---
    const [selectedBranchFilter, setSelectedBranchFilter] = useState('');
    const [selectedFirmFilter, setSelectedFirmFilter] = useState('');
    const [selectedCityFilter, setSelectedCityFilter] = useState('');
    const [selectedSalesRepFilter, setSelectedSalesRepFilter] = useState('');
    const [selectedCustomerTypeFilter, setSelectedCustomerTypeFilter] = useState('');


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
    // --- Helper function to get address string ---
    const getAddressString = (customer) => {
        const shop = getStringValue(customer.shopAddress);
        return shop !== 'N/A' ? `Shop: ${shop}` : 'N/A';
    };

    // --- Helper function to get documents string ---
    const getDocumentsString = (customer) => {
        const docs = [];
        if (customer.aadharNumber) docs.push(`Aadhar: ${getStringValue(customer.aadharNumber)}`);
        if (customer.panNumber) docs.push(`PAN: ${getStringValue(customer.panNumber)}`);
        if (customer.gstNumber) docs.push(`GST: ${getStringValue(customer.gstNumber)}`);
        return docs.length > 0 ? docs.join('\n') : 'N/A';
    };

    // --- Fetch Firms ---
    const fetchFirms = useCallback(async () => {
        try {
            const response = await api.get('/firms');
            if (response.data.status === 'success') {
                setFirms(response.data.data.firms);
            } else {
                showFlashMessage('Failed to load firms.', 'error');
            }
        } catch (err) {
            showFlashMessage(err.response?.data?.message || 'Failed to load firms due to network error.', 'error');
        }
    }, []);

    // Fetch firms on component mount
    useEffect(() => {
        fetchFirms();
    }, [fetchFirms]);

    // --- Handle Firm Submit (Add/Update) ---
    const handleFirmSubmit = async (e) => {
        e.preventDefault();
        if (!firmName) {
            showFlashMessage('Firm name is required.', 'error');
            return;
        }

        const firmFormData = new FormData();
        firmFormData.append('name', firmName);
        firmFormData.append('address', firmAddress || '');
        firmFormData.append('remark', firmRemark || '');
        firmFormData.append('gstin', firmGstin || '');
        if (selectedFirmLogo) {
            firmFormData.append('logo', selectedFirmLogo);
            console.log('Logo file:', selectedFirmLogo.name, selectedFirmLogo.size); // Debug
        } else {
            console.log('No logo file selected');
        }

        try {
            if (editingFirmId) {
                await api.patch(`/firms/${editingFirmId}`, firmFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showFlashMessage('Firm updated successfully!', 'success');
            } else {
                await api.post('/firms', firmFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showFlashMessage('Firm added successfully!', 'success');
            }
            fetchFirms();
            setFirmName('');
            setFirmAddress('');
            setFirmRemark('');
            setFirmGstin('');
            setSelectedFirmLogo(null);
            setFirmLogoPreviewUrl('');
            setEditingFirmId(null);
            setShowFirmModal(false);
        } catch (err) {
            console.error('Firm submit error:', err.response?.data || err.message); // Debug
            showFlashMessage(err.response?.data?.message || 'Failed to save firm.', 'error');
        }
    };

    const openFirmLogoModal = (firm) => {
        setCurrentAttachmentUrls({
            logo: firm.logo ? `${BACKEND_BASE_URL}/uploads/firm-logos/${firm.logo}` : '' // Note: lowercase 'uploads'
        });
        setShowAttachmentModal(true);
    };

    // --- Handle Firm Delete ---
    const handleFirmDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete firm: ${name}?`)) {
            try {
                await api.delete(`/firms/${id}`);
                showFlashMessage('Firm deleted successfully!', 'success');
                fetchFirms();
            } catch (err) {
                showFlashMessage(err.response?.data?.message || 'Failed to delete firm.', 'error');
            }
        }
    };

    // --- Fetch Customers ---
    const fetchCustomers = useCallback(async (scrollToNew = false) => {
        setLoading(true);
        setLocalError(null);
        try {
            const queryParams = new URLSearchParams();
            if (selectedBranchFilter) queryParams.append('branch', selectedBranchFilter);
            if (selectedFirmFilter) queryParams.append('firm', selectedFirmFilter);
            if (selectedCityFilter) queryParams.append('city', selectedCityFilter);
            if (selectedSalesRepFilter) queryParams.append('salesBy', selectedSalesRepFilter);
            if (selectedCustomerTypeFilter) queryParams.append('customerType', selectedCustomerTypeFilter);
            if (searchTerm) queryParams.append('search', searchTerm);

            const response = await api.get(`/customers?${queryParams.toString()}`);
            if (response.data.status === 'success' && response.data.data && Array.isArray(response.data.data.customers)) {
                setCustomers(response.data.data.customers);

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
    }, [currentPage, itemsPerPage, selectedBranchFilter, selectedFirmFilter, selectedCityFilter, selectedSalesRepFilter, selectedCustomerTypeFilter, searchTerm]);

    // --- Fetch Branches, Cities, and Sales Representatives for Dropdowns ---
    const fetchDropdownData = useCallback(async () => {
        setLoading(true); // Set loading true for dropdowns
        try {
            const [branchesRes, citiesRes, salesRepsRes] = await Promise.all([
                api.get('/branches'),
                api.get('/cities'),
                api.get('/employees/sales-representatives')
            ]);

            let fetchedBranches = [];
            if (branchesRes.data && branchesRes.data.success) {
                if (Array.isArray(branchesRes.data.data)) {
                    fetchedBranches = branchesRes.data.data;
                } else if (branchesRes.data.data && Array.isArray(branchesRes.data.data.branches)) {
                    fetchedBranches = branchesRes.data.data.branches;
                } else if (Array.isArray(branchesRes.data)) {
                    fetchedBranches = branchesRes.data;
                } else {
                    console.warn('DEBUG: Branches data array not found in expected paths within branchesRes.data');
                }
                setBranches(fetchedBranches);
            } else {
                console.error('Failed to fetch branches: Unexpected response structure or status not success.', branchesRes.data);
                showFlashMessage(branchesRes.data?.message || 'Failed to load branches for dropdown.', 'error');
            }

            let fetchedCities = [];
            if (citiesRes.data && citiesRes.data.status === 'success') {
                if (citiesRes.data.data && Array.isArray(citiesRes.data.data.cities)) {
                    fetchedCities = citiesRes.data.data.cities;
                } else if (citiesRes.data.data && Array.isArray(citiesRes.data.data)) {
                    fetchedCities = citiesRes.data.data;
                } else if (Array.isArray(citiesRes.data)) {
                    fetchedCities = citiesRes.data;
                } else {
                    console.warn('DEBUG: Cities data array not found in expected nested paths within citiesRes.data');
                }
                setCities(fetchedCities);
            } else {
                console.error('Failed to fetch cities: Unexpected response structure or status not success.', citiesRes.data);
                showFlashMessage(citiesRes.data?.message || 'Failed to load cities for dropdown.', 'error');
            }

            let fetchedSalesReps = [];
            if (salesRepsRes.data && salesRepsRes.data.status === 'success' && Array.isArray(salesRepsRes.data.data.employees)) {
                fetchedSalesReps = salesRepsRes.data.data.employees;
                setSalesRepresentatives(fetchedSalesReps);
            } else {
                console.error('Failed to fetch sales representatives: Unexpected response structure or status not success.', salesRepsRes.data);
                showFlashMessage(salesRepsRes.data?.message || 'Failed to load sales representatives for dropdown.', 'error');
            }

            // Set initial dropdown values if not in edit mode and data is available
            if (!editingCustomerId) {
                setFormData(prev => ({
                    ...prev,
                    city: fetchedCities.length > 0 ? fetchedCities[0]._id : '',
                    salesBy: fetchedSalesReps.length > 0 ? fetchedSalesReps[0]._id : ''
                }));
            }

        } catch (err) {
            console.error('Error fetching dropdown data:', err);
            const errorMessage = err.response?.data?.message || 'Network error fetching dropdown data (Branches/Cities/Sales Reps). Please ensure backend is running and accessible.';
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
    }, [fetchDropdownData]); // This fetches branches, cities, and sales reps once or when editingCustomerId changes



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
                    newState.secondaryCustomerType = 'Both';
                    // Set default branch and school code if available
                    newState.branch = branches.length > 0 ? branches[0]._id : '';
                    newState.schoolCode = ''; // Default to empty
                } else if (value === 'Dealer') {
                    // Set default secondary type for 'Dealer' to 'Retail'
                    newState.secondaryCustomerType = 'Retail';
                    // Reset fields not relevant for 'Dealer'
                    newState.branch = '';
                    newState.schoolCode = '';
                } else {
                    // This handles the case where no primary type is selected
                    newState.secondaryCustomerType = null;
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
                } else if (fieldName === 'otherAttachment') {
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

        // customerType derive
        const finalCustomerType =
            formData.primaryCustomerType === 'School'
                ? `School-${formData.secondaryCustomerType}`
                : formData.primaryCustomerType === 'Dealer'
                    ? `Dealer-${formData.secondaryCustomerType || 'Retail'}`
                    : '';


        // Basic validation
        if (!formData.firm) {
            setLocalError('Please select a firm.');
            showFlashMessage('Please select a firm.', 'error');
            setLoading(false);
            return;
        }
        if (!formData.customerName || !formData.city || !formData.mobileNumber) {
            setLocalError('Please fill in all required fields: Customer Name, City, and Mobile Number.');
            showFlashMessage('Please fill in all required fields.', 'error');
            setLoading(false);
            return;
        }

        // Conditional validation for School-Retail, School-Supply, and School-Both
        if (formData.primaryCustomerType === 'School' && !formData.branch) {
            setLocalError('For School customers, Branch is a required field.');
            showFlashMessage('For School customers, Branch is a required field.', 'error');
            setLoading(false);
            return;
        }
        if (formData.primaryCustomerType === 'School' && !formData.schoolCode) {
            setLocalError('For School customers, School Code is a required field.');
            showFlashMessage('For School customers, School Code is a required field.', 'error');
            setLoading(false);
            return;
        }

        const dataToSend = new FormData();
        for (const key in formData) {
            const value = formData[key];
            if (value !== null && value !== undefined) {
                dataToSend.append(key, String(value));
            }
        }
        if (finalCustomerType) {
            dataToSend.append('customerType', finalCustomerType);
        }

        if (selectedChequeFile) dataToSend.append('chequeImage', selectedChequeFile);
        if (selectedPassportFile) dataToSend.append('passportImage', selectedPassportFile);
        if (selectedOtherFile) dataToSend.append('otherAttachment', selectedOtherFile);

        try {
            let response;
            if (editingCustomerId) {
                // Update existing
                response = await api.patch(`/customers/${editingCustomerId}`, dataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                if (response.data.status === 'success') {
                    showFlashMessage('Customer updated successfully!', 'success');
                    fetchCustomers(); // re-fetch
                } else {
                    throw new Error(response.data.message || 'Failed to update customer.');
                }
            } else {
                // ✅ Create new → add at top & reset to page 1
                response = await api.post('/customers', dataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                if (response.data.status === 'success') {
                    showFlashMessage('Customer created successfully!', 'success');
                    setCustomers(prev => [response.data.data.customer, ...prev]); // add at top
                    setCurrentPage(1); // reset to page 1
                } else {
                    throw new Error(response.data.message || 'Failed to create customer.');
                }
            }

            // Reset form
            setFormData(initialFormData);
            setSelectedChequeFile(null);
            setSelectedPassportFile(null);
            setSelectedOtherFile(null);
            setChequeImagePreviewUrl('');
            setPassportImagePreviewUrl('');
            setOtherAttachmentPreviewUrl('');
            setEditingCustomerId(null);

        } catch (err) {
            console.error('Error saving customer:', err);
            const errorMessage =
                err.response?.data?.message ||
                'Failed to save customer. Please check your input and ensure unique fields (Name, Mobile, Email, GST, Aadhar, PAN) are not duplicated.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };
    // --- Edit and Delete Operations ---
    const handleEdit = (customerItem) => {
        let primaryType = null;
        let secondaryType = null;

        if (customerItem.customerType) {
            const parts = customerItem.customerType.split('-');
            primaryType = parts[0];
            secondaryType = parts[1];
        }

        // Check if any of the "Other Details" fields have data to determine
        // if the section should be visible on edit.
        const hasOtherDetails = [
            'customerShopName', 'age', 'so', 'customerCity', 'distt', 'state', 'pinCode',
            'shopRegNo', 'fixedTradeDiscount', 'remark', 'goodsDeliveredTransportationPay',
            'goodsReturnTransportationPay', 'finalSalesReturnMonth', 'finalPaymentInAccountMonth',
            'paymentConcernPersonName', 'closedDate', 'chequeNo', 'chequeOfBankName',
            'profitMargin', 'advancePayment' // NEW: Added profitMargin and advancePayment
        ].some(key => customerItem[key] !== null && customerItem[key] !== '' && customerItem[key] !== 0);

        setFormData({
            ...initialFormData, // Use spread operator to ensure all fields are reset
            firm: customerItem.firm ? customerItem.firm._id : '',
            customerName: customerItem.customerName || '',
            schoolCode: customerItem.schoolCode || '',
            branch: customerItem.branch?._id || '',
            city: customerItem.city?._id || '',
            contactPerson: customerItem.contactPerson || '',
            mobileNumber: customerItem.mobileNumber || '',
            email: customerItem.email || '',
            gstNumber: customerItem.gstNumber || '',
            aadharNumber: customerItem.aadharNumber || '',
            panNumber: customerItem.panNumber || '',
            shopAddress: customerItem.shopAddress || '',
            status: customerItem.status || 'active',
            primaryCustomerType: primaryType,
            secondaryCustomerType: secondaryType,
            salesBy: customerItem.salesBy?._id || '',
            discount: customerItem.discount || 0,
            returnTime: customerItem.returnTime || '',
            bankName: customerItem.bankName || '',
            accountNumber: customerItem.accountNumber || '',
            ifscCode: customerItem.ifscCode || '',
            openingBalance: customerItem.openingBalance || 0,
            balanceType: customerItem.balanceType || 'Dr.',
            // NEW FIELDS
            customerShopName: customerItem.customerShopName || '',
            age: customerItem.age || '',
            so: customerItem.so || '',
            customerCity: customerItem.customerCity || '',
            distt: customerItem.distt || '',
            state: customerItem.state || '',
            pinCode: customerItem.pinCode || '',
            shopRegNo: customerItem.shopRegNo || '',
            fixedTradeDiscount: customerItem.fixedTradeDiscount || '',
            remark: customerItem.remark || '',
            goodsDeliveredTransportationPay: customerItem.goodsDeliveredTransportationPay || '',
            goodsReturnTransportationPay: customerItem.goodsReturnTransportationPay || '',
            finalSalesReturnMonth: customerItem.finalSalesReturnMonth || '',
            finalPaymentInAccountMonth: customerItem.finalPaymentInAccountMonth || '',
            paymentConcernPersonName: customerItem.paymentConcernPersonName || '',
            closedDate: customerItem.closedDate ? new Date(customerItem.closedDate).toISOString().split('T')[0] : '',
            chequeNo: customerItem.chequeNo || '',
            chequeOfBankName: customerItem.chequeOfBankName || '',
            profitMargin: customerItem.profitMargin || 0, // NEW: Added profitMargin
            advancePayment: customerItem.advancePayment || 0 // NEW: Added advancePayment
        });

        // Set the state for showing/hiding the "Other Details" section
        setShowOtherDetails(hasOtherDetails);

        setChequeImagePreviewUrl(customerItem.chequeImage ? `${BACKEND_BASE_URL}/uploads/customer-logos/${customerItem.chequeImage}` : '');
        setPassportImagePreviewUrl(customerItem.passportImage ? `${BACKEND_BASE_URL}/uploads/customer-logos/${customerItem.passportImage}` : '');
        setOtherAttachmentPreviewUrl(customerItem.otherAttachment ? `${BACKEND_BASE_URL}/uploads/customer-logos/${customerItem.otherAttachment}` : '');
        setSelectedChequeFile(null);
        setSelectedPassportFile(null);
        setSelectedOtherFile(null);
        setEditingCustomerId(customerItem._id);
        setLocalError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // --- Attachment Modal Functions ---
    const openAttachmentModal = (customerItem) => {
        setCurrentAttachmentUrls({
            cheque: customerItem.chequeImage ? `${BACKEND_BASE_URL}/uploads/customer-logos/${customerItem.chequeImage}` : null,
            passport: customerItem.passportImage ? `${BACKEND_BASE_URL}/uploads/customer-logos/${customerItem.passportImage}` : null,
            other: customerItem.otherAttachment ? `${BACKEND_BASE_URL}/uploads/customer-logos/${customerItem.otherAttachment}` : null
        });
        setShowAttachmentModal(true);
    };

    const closeAttachmentModal = () => {
        setShowAttachmentModal(false);
        setCurrentAttachmentUrls({});
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
    // --- PDF Download Functionality ---
    const downloadPdf = () => {
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF !== 'function') {
            showFlashMessage('PDF generation failed: Core libraries are not loaded. Please check your script links.', 'error');
            console.error("PDF generation failed: window.jspdf is not available.");
            return;
        }

        const doc = new window.jspdf.jsPDF();
        let startY = addHeaderAndSetStartY(doc, companyLogo, 25, 22);
        startY = addReportTitle(doc, startY, "Customer List Report");

        // Updated table columns as per user request
        const tableColumn = ["S.No.", "Customer Name", "Contact Person", "Mobile No.", "Address", "City"];

        // Updated table rows with the new fields
        const tableRows = customers.map((cust, index) => [
            index + 1,
            cust.customerName || 'N/A',
            cust.contactPerson || 'N/A',
            cust.mobileNumber || 'N/A',
            getAddressString(cust), // Use the helper function to combine addresses
            cust.city ? cust.city.name : 'N/A'
        ]);

        addTableToDoc(doc, tableColumn, tableRows, startY);

        doc.save(`Customer_List_${new Date().toLocaleDateString('en-CA').replace(/\//g, '-')}.pdf`);
        showFlashMessage('Customer list downloaded as PDF!', 'success');
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
                <div className="form-container-card">
                    <h3 className="form-title">{editingCustomerId ? 'Update Customer' : 'Add New Customer'}</h3>
                    <button type="button" onClick={() => setShowFirmModal(true)} className="btn-primary mb-2">
                        Manage Firms
                    </button>
                    <form onSubmit={handleSubmit} className="customer-form">
                        <div className="form-row two-cols">
                            <div className="form-group">
                                <label htmlFor="firm">Firm Type:</label>
                                <select
                                    id="firm"
                                    name="firm"
                                    value={formData.firm}
                                    onChange={handleChange}
                                    required
                                    disabled={loading || firms.length === 0}
                                    className="form-select"
                                >
                                    {firms.length === 0 ? (
                                        <option value="">Loading Firms...</option>
                                    ) : (
                                        <>
                                            <option value="">-- SELECT FIRM --</option>
                                            {firms.map(firm => (
                                                <option key={firm._id} value={firm._id}>
                                                    {firm.name}
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
                            <div className="form-group">
                                <label htmlFor="salesBy">Sales Representative:</label>
                                <select
                                    id="salesBy"
                                    name="salesBy"
                                    value={formData.salesBy}
                                    onChange={handleChange}
                                    disabled={loading || salesRepresentatives.length === 0}
                                    className="form-select"
                                >
                                    {salesRepresentatives.length === 0 ? (
                                        <option value="">Loading Sales Reps...</option>
                                    ) : (
                                        <>
                                            <option value="">-- SELECT SALES REP --</option>
                                            {salesRepresentatives.map(rep => (
                                                <option key={rep._id} value={rep._id}>
                                                    {rep.name}
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                            </div>

                            <div className="form-group customer-type-group">
                                <label>Customer Type (Primary):</label>
                                <select
                                    name="primaryCustomerType"
                                    value={formData.primaryCustomerType || ""}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="dropdown"
                                >
                                    <option value="" disabled>
                                        -- Select Primary Customer Type --
                                    </option>
                                    <option value="Dealer">Dealer</option>
                                    <option value="School">School</option>
                                </select>
                            </div>

                            {formData.primaryCustomerType && (
                                <div className="form-group customer-type-group">
                                    <label>Customer Type (Secondary):</label>
                                    <select
                                        name="secondaryCustomerType"
                                        value={formData.secondaryCustomerType || ""}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className="dropdown"
                                    >
                                        <option value="" disabled>
                                            -- Select Secondary Customer Type --
                                        </option>
                                        <option value="Retail">Retail</option>
                                        <option value="Supply">Supply</option>
                                        {formData.primaryCustomerType === "School" && (
                                            <option value="Both">Both</option>
                                        )}
                                    </select>
                                </div>
                            )}
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

                        {/* Conditional rendering for School/Retail fields */}
                        {formData.primaryCustomerType === 'School' && (
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
                                <label htmlFor="profitMargin">Profit Margin (%):</label>
                                <input
                                    type="number"
                                    id="profitMargin"
                                    name="profitMargin"
                                    value={formData.profitMargin}
                                    onChange={handleChange}
                                    placeholder="Enter profit margin"
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
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

                        </div>

                        <div className="form-row">
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
                            <div className="form-group">
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
                        <h3 className="form-title">Add Bank Details</h3>
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
                            <div className="form-actions">
                                <button
                                    type="button"
                                    className={`btn-toggle ${showOtherDetails ? 'active' : ''}`}
                                    onClick={() => setShowOtherDetails(!showOtherDetails)}
                                >
                                    <FaInfoCircle /> {showOtherDetails ? 'Hide Other Details' : 'Add Other Details'}
                                </button>
                            </div>
                        </div>

                        {showOtherDetails && (
                            <>
                                <header className="section-title"><h3>Other Details</h3></header>
                                <div className="form-section">
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label htmlFor="customerShopName">Customer Shop Name</label>
                                            <input type="text" id="customerShopName" name="customerShopName" value={formData.customerShopName} onChange={handleChange} />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="age">Age</label>
                                            <input type="number" id="age" name="age" value={formData.age} onChange={handleChange} />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="so">S/O (Son Of)</label>
                                            <input type="text" id="so" name="so" value={formData.so} onChange={handleChange} />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="customerCity">City (Manual)</label>
                                            <input type="text" id="customerCity" name="customerCity" value={formData.customerCity} onChange={handleChange} />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="distt">District</label>
                                            <input type="text" id="distt" name="distt" value={formData.distt} onChange={handleChange} />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="state">State</label>
                                            <input type="text" id="state" name="state" value={formData.state} onChange={handleChange} />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="pinCode">Pincode</label>
                                            <input type="text" id="pinCode" name="pinCode" value={formData.pinCode} onChange={handleChange} />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="shopRegNo">Shop Reg No</label>
                                            <input type="text" id="shopRegNo" name="shopRegNo" value={formData.shopRegNo} onChange={handleChange} />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="fixedTradeDiscount">Fixed Trade Discount</label>
                                            <input type="number" id="fixedTradeDiscount" name="fixedTradeDiscount" value={formData.fixedTradeDiscount} onChange={handleChange} />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="goodsDeliveredTransportationPay">Goods Del. Transport Pay</label>
                                            <input type="text" id="goodsDeliveredTransportationPay" name="goodsDeliveredTransportationPay" value={formData.goodsDeliveredTransportationPay} onChange={handleChange} />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="goodsReturnTransportationPay">Goods Return Transport Pay</label>
                                            <input type="text" id="goodsReturnTransportationPay" name="goodsReturnTransportationPay" value={formData.goodsReturnTransportationPay} onChange={handleChange} />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="finalSalesReturnMonth">Final Sales Return Month</label>
                                            <input type="text" id="finalSalesReturnMonth" name="finalSalesReturnMonth" value={formData.finalSalesReturnMonth} onChange={handleChange} />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="finalPaymentInAccountMonth">Final Payment In Account Month</label>
                                            <input type="text" id="finalPaymentInAccountMonth" name="finalPaymentInAccountMonth" value={formData.finalPaymentInAccountMonth} onChange={handleChange} />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="paymentConcernPersonName">Payment Concern Person</label>
                                            <input type="text" id="paymentConcernPersonName" name="paymentConcernPersonName" value={formData.paymentConcernPersonName} onChange={handleChange} />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="advancePayment">Advance Payment:</label>
                                            <input
                                                type="number"
                                                id="advancePayment"
                                                name="advancePayment"
                                                value={formData.advancePayment}
                                                onChange={handleChange}
                                                placeholder="Enter advance payment"

                                                disabled={loading}
                                                className="form-input"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="closedDate">Closed Date</label>
                                            <input type="date" id="closedDate" name="closedDate" value={formData.closedDate} onChange={handleChange} />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="chequeNo">Cheque No.</label>
                                            <input type="text" id="chequeNo" name="chequeNo" value={formData.chequeNo} onChange={handleChange} />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="chequeOfBankName">Cheque Of Bank Name</label>
                                            <input type="text" id="chequeOfBankName" name="chequeOfBankName" value={formData.chequeOfBankName} onChange={handleChange} />
                                        </div>
                                        <div className="form-group full-width">
                                            <label htmlFor="remark">Remark</label>
                                            <textarea id="remark" name="remark" rows="1" value={formData.remark} onChange={handleChange}></textarea>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="form-section-heading"><h3 className="form-title">Document Attachments</h3></div>
                        <div className="form-row file-upload-section">
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
                            <div className="form-group">
                                <label htmlFor="otherAttachment">Other Document:</label>
                                <input
                                    type="file"
                                    id="otherAttachment"
                                    name="otherAttachment"
                                    accept="image/*, .pdf, .doc, .docx"
                                    onChange={(e) => handleFileChange(e, 'otherAttachment')}
                                    disabled={loading}
                                    className="form-input-file"
                                />
                                {otherAttachmentPreviewUrl && (
                                    <div className="image-preview">
                                        <img src={otherAttachmentPreviewUrl} alt="Other Document Preview" />
                                        <button type="button" onClick={() => setOtherAttachmentPreviewUrl('')} className="remove-image-btn">Remove</button>
                                    </div>
                                )}
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
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? <FaSpinner className="icon mr-2 animate-spin" /> : editingCustomerId ? 'Update' : ' +  Add'}
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
                            <select
                                id="branchFilter"
                                value={selectedBranchFilter}
                                onChange={(e) => { setSelectedBranchFilter(e.target.value); setCurrentPage(1); }}
                                className="search-input" disabled={loading || branches.length === 0} >
                                <option value="">All Branches </option> {branches.map(branch => (<option key={branch._id} value={branch._id}> {branch.name} </option>))}
                            </select>
                        </div>
                        <div className="filter-group">
                            <select
                                id="firmFilter"
                                value={selectedFirmFilter}
                                onChange={(e) => {
                                    setSelectedFirmFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="search-input"
                                disabled={loading || firms.length === 0}
                            >
                                <option value="">Firms-All</option>
                                {firms.map(firm => (
                                    <option key={firm._id} value={firm._id}>{firm.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <select
                                id="cityFilter"
                                value={selectedCityFilter}
                                onChange={(e) => {
                                    setSelectedCityFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="search-input"
                                disabled={loading || cities.length === 0}
                            >
                                <option value="">All Cities</option>
                                {cities.map(city => (
                                    <option key={city._id} value={city._id}>{city.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <select
                                id="salesRepFilter"
                                value={selectedSalesRepFilter}
                                onChange={(e) => {
                                    setSelectedSalesRepFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="search-input"
                                disabled={loading || salesRepresentatives.length === 0}
                            >
                                <option value="">All Sales Reps</option>
                                {salesRepresentatives.map(rep => (
                                    <option key={rep._id} value={rep._id}>{rep.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <select
                                id="customerTypeFilter"
                                value={selectedCustomerTypeFilter}
                                onChange={(e) => {
                                    setSelectedCustomerTypeFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="search-input"
                                disabled={loading}
                            >
                                <option value="">All Customer Types</option>
                                <option value="Dealer-Retail">Dealer - Retail</option>
                                <option value="Dealer-Supply">Dealer - Supply</option>
                                <option value="School-Retail">School - Retail</option>
                                <option value="School-Supply">School - Supply</option>
                                <option value="School-Both">School - Both</option>
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
                                        <th>Firm</th> {/* NEW: Firm column */}
                                        <th>Name (Type)</th>
                                        <th>Contact Person</th>
                                        <th>Mobile No.</th>
                                        <th>Address</th>
                                        <th>City</th>
                                        <th>Branch</th>
                                        <th>School Code</th>
                                        <th>Sales Rep</th>
                                        <th>Discount</th>
                                        <th>Status</th>
                                        <th>Customer Shop Name</th>
                                        <th>Age</th>
                                        <th>S/O</th>
                                        <th>Customer City</th>
                                        <th>District</th>
                                        <th>State</th>
                                        <th>Pincode</th>
                                        <th>Shop Reg No</th>
                                        <th>Fixed Trade Discount</th>
                                        <th>Remark</th>
                                        <th>Goods Del. Transport Pay</th>
                                        <th>Goods Return Transport Pay</th>
                                        <th>Final Sales Return Month</th>
                                        <th>Final Payment Month</th>
                                        <th>Payment Concern Person</th>
                                        <th>Closed Date</th>
                                        <th>Cheque No.</th>
                                        <th>Cheque Bank Name</th>
                                        <th>Attachments</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody ref={tableBodyRef}>
                                    {currentItems.map((customer, index) => (
                                        <tr key={customer._id}>
                                            <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                            <td>{customer.firm ? customer.firm.name : 'N/A'}</td> {/* NEW: Firm value */}
                                            <td>{customer.customerName} ({customer.customerType || 'N/A'})</td>
                                            <td>{customer.contactPerson || 'N/A'}</td>
                                            <td>{customer.mobileNumber || 'N/A'}</td>
                                            <td>{customer.shopAddress || customer.homeAddress || 'N/A'}</td>
                                            <td>{customer.city ? customer.city.name : 'N/A'}</td>
                                            <td>{customer.branch ? customer.branch.name : 'N/A'}</td>
                                            <td>{customer.schoolCode || 'N/A'}</td>
                                            <td>{customer.salesBy ? customer.salesBy.name : 'N/A'}</td>
                                            <td>{customer.discount || 0}%</td>
                                            <td>{customer.status}</td>
                                            <td>{customer.customerShopName || 'N/A'}</td>
                                            <td>{customer.age || 'N/A'}</td>
                                            <td>{customer.so || 'N/A'}</td>
                                            <td>{customer.customerCity || 'N/A'}</td>
                                            <td>{customer.distt || 'N/A'}</td>
                                            <td>{customer.state || 'N/A'}</td>
                                            <td>{customer.pinCode || 'N/A'}</td>
                                            <td>{customer.shopRegNo || 'N/A'}</td>
                                            <td>{customer.fixedTradeDiscount || 'N/A'}</td>
                                            <td>{customer.remark || 'N/A'}</td>
                                            <td>{customer.goodsDeliveredTransportationPay || 'N/A'}</td>
                                            <td>{customer.goodsReturnTransportationPay || 'N/A'}</td>
                                            <td>{customer.finalSalesReturnMonth || 'N/A'}</td>
                                            <td>{customer.finalPaymentInAccountMonth || 'N/A'}</td>
                                            <td>{customer.paymentConcernPersonName || 'N/A'}</td>
                                            <td>{customer.closedDate ? formatDateWithTime(customer.closedDate) : 'N/A'}</td>
                                            <td>{customer.chequeNo || 'N/A'}</td>
                                            <td>{customer.chequeOfBankName || 'N/A'}</td>
                                            <td className="actions-column">
                                                {(customer.chequeImage || customer.passportImage || customer.otherAttachment) && (
                                                    <button
                                                        onClick={() => openAttachmentModal(customer)}
                                                        className="action-icon-button view-button"
                                                        title="View Attachment"
                                                    >
                                                        <FaEye className="icon" />
                                                    </button>
                                                )}

                                            </td>
                                            <td className="actions-column">
                                                <button onClick={() => handleEdit(customer)} className="action-icon-button edit-button">
                                                    <FaEdit />
                                                </button>
                                                <button onClick={() => openConfirmModal(customer)} className="action-icon-button delete-button">
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

            {/* Attachment Modal */}
            {/* Attachment Modal */}
            {showAttachmentModal && (
                <div
                    className="modal-backdrop"
                    onClick={() => setShowAttachmentModal(false)} // close when clicking outside
                >
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
                    >
                        <h3>Attachments</h3>
                        <div className="attachment-list">
                            {currentAttachmentUrls.logo && (
                                <div className="attachment-item">
                                    <h4>Firm Logo</h4>
                                    <a href={currentAttachmentUrls.logo} target="_blank" rel="noopener noreferrer">
                                        <img src={currentAttachmentUrls.logo} alt="Firm Logo" />
                                    </a>
                                    <a href={currentAttachmentUrls.logo} download className="btn-download">
                                        <FaDownload /> Download
                                    </a>
                                </div>
                            )}
                            {currentAttachmentUrls.cheque && (
                                <div className="attachment-item">
                                    <h4>Cheque Image</h4>
                                    <a href={currentAttachmentUrls.cheque} target="_blank" rel="noopener noreferrer">
                                        <img src={currentAttachmentUrls.cheque} alt="Cheque" />
                                    </a>
                                    <a href={currentAttachmentUrls.cheque} download className="btn-download">
                                        <FaDownload /> Download
                                    </a>
                                </div>
                            )}
                            {currentAttachmentUrls.passport && (
                                <div className="attachment-item">
                                    <h4>Passport Image</h4>
                                    <a href={currentAttachmentUrls.passport} target="_blank" rel="noopener noreferrer">
                                        <img src={currentAttachmentUrls.passport} alt="Passport" />
                                    </a>
                                    <a href={currentAttachmentUrls.passport} download className="btn-download">
                                        <FaDownload /> Download
                                    </a>
                                </div>
                            )}
                            {currentAttachmentUrls.other && (
                                <div className="attachment-item">
                                    <h4>Other Document</h4>
                                    <a href={currentAttachmentUrls.other} target="_blank" rel="noopener noreferrer">
                                        <img src={currentAttachmentUrls.other} alt="Other Document" />
                                    </a>
                                    <a href={currentAttachmentUrls.other} download className="btn-download">
                                        <FaDownload /> Download
                                    </a>
                                </div>
                            )}
                            {(!currentAttachmentUrls.logo &&
                                !currentAttachmentUrls.cheque &&
                                !currentAttachmentUrls.passport &&
                                !currentAttachmentUrls.other) && (
                                    <p>No attachments found.</p>
                                )}
                        </div>
                        <div className="modal-actions mt-4">
                            <button onClick={() => setShowAttachmentModal(false)} className="btn-secondary">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Firm Management Modal */}
            {showFirmModal && (
                <div
                    className="modal-backdrop"
                    onClick={() => {
                        // Close when clicking outside modal content
                        setShowFirmModal(false);
                        setFirmName('');
                        setFirmAddress('');
                        setFirmRemark('');
                        setFirmGstin('');
                        setSelectedFirmLogo(null);
                        setFirmLogoPreviewUrl('');
                        setEditingFirmId(null);
                    }}
                >
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
                    >
                        <h3>{editingFirmId ? 'Update Firm' : 'Add Firm'}</h3>
                        <form onSubmit={handleFirmSubmit}>
                            <div className="form-group">
                                <label htmlFor="firmName">Firm Name:</label>
                                <input
                                    type="text"
                                    id="firmName"
                                    value={firmName}
                                    onChange={(e) => setFirmName(e.target.value)}
                                    placeholder="e.g., Good Luck Book Store"
                                    required
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="firmAddress">Address:</label>
                                <textarea
                                    id="firmAddress"
                                    value={firmAddress}
                                    onChange={(e) => setFirmAddress(e.target.value)}
                                    placeholder="Enter firm address"
                                    disabled={loading}
                                    className="form-textarea"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="firmRemark">Remark:</label>
                                <textarea
                                    id="firmRemark"
                                    value={firmRemark}
                                    onChange={(e) => setFirmRemark(e.target.value)}
                                    placeholder="Enter remarks"
                                    disabled={loading}
                                    className="form-textarea"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="firmGstin">GSTIN:</label>
                                <input
                                    type="text"
                                    id="firmGstin"
                                    value={firmGstin}
                                    onChange={(e) => setFirmGstin(e.target.value)}
                                    placeholder="Enter GSTIN (e.g., 22AAAAA0000A1Z5)"
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="firmLogo">Logo:</label>
                                <input
                                    type="file"
                                    id="firmLogo"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        setSelectedFirmLogo(file);
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => setFirmLogoPreviewUrl(reader.result);
                                            reader.readAsDataURL(file);
                                        } else {
                                            setFirmLogoPreviewUrl('');
                                        }
                                    }}
                                    disabled={loading}
                                    className="form-input"
                                />
                                {firmLogoPreviewUrl && (
                                    <div className="image-preview">
                                        <img src={firmLogoPreviewUrl} alt="Firm Logo Preview" style={{ maxWidth: '100px', marginTop: '10px' }} />
                                    </div>
                                )}
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? <FaSpinner className="icon mr-2 animate-spin" /> : editingFirmId ? 'Update' : 'Add'}
                                </button>
                                <button type="button" onClick={() => {
                                    setShowFirmModal(false);
                                    setFirmName('');
                                    setFirmAddress('');
                                    setFirmRemark('');
                                    setFirmGstin('');
                                    setSelectedFirmLogo(null);
                                    setFirmLogoPreviewUrl('');
                                    setEditingFirmId(null);
                                }} className="btn-secondary" disabled={loading}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                        <h3>Available Firms</h3>
                        {/* ... firm table (updated below) ... */}
                        <table className="app-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Address</th>
                                    <th>Remark</th>
                                    <th>GSTIN</th>
                                    <th>Logo</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {firms.map(firm => (
                                    <tr key={firm._id}>
                                        <td>{firm.name}</td>
                                        <td>{firm.address || 'N/A'}</td>
                                        <td>{firm.remark || 'N/A'}</td>
                                        <td>{firm.gstin || 'N/A'}</td>
                                        <td>
                                            {firm.logo ? (
                                                <button
                                                    onClick={() => openFirmLogoModal(firm)}
                                                    className="action-icon-button view-button"
                                                    title="View Logo"
                                                >
                                                    <FaEye className="icon" />
                                                </button>
                                            ) : (
                                                <FaFile className="icon" />
                                            )}
                                        </td>
                                        <td className="actions-column">
                                            <button onClick={() => {
                                                setEditingFirmId(firm._id);
                                                setFirmName(firm.name);
                                                setFirmAddress(firm.address || '');
                                                setFirmRemark(firm.remark || '');
                                                setFirmGstin(firm.gstin || '');
                                                setFirmLogoPreviewUrl(firm.logo ? `${BACKEND_BASE_URL}/uploads/firm-logos/${firm.logo}` : '');
                                                setSelectedFirmLogo(null);
                                            }} className="btn-action edit">
                                                <FaEdit />
                                            </button>
                                            <button onClick={() => handleFirmDelete(firm._id, firm.name)} className="btn-action delete">
                                                <FaTrashAlt />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerManagement;