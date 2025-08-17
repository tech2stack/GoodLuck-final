// src/pages/SuperAdminDashboard.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
// Icons for buttons and tables
import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaChevronDown,
    FaBuilding,
    FaUsers,
    FaUserTie,
    FaEye,
    FaHome,
    FaTimes,
    FaCheckCircle,
    FaExclamationCircle,
    FaChartBar,
    FaSearchLocation,
    FaGlobeAsia,
    FaCity,
    FaUserFriends,
    FaBook,
    FaBookOpen,
    FaUserCheck,
    FaTruck,
    FaUserCog,
    FaBoxes, // New icon for Stock Managers
    FaFilePdf, // Icon for PDF documents
    FaImage // Icon for images
} from 'react-icons/fa';
// Import all form components
import CreateBranchForm from '../components/forms/CreateBranchForm';
import UpdateBranchForm from '../components/forms/UpdateBranchForm';
import CreateBranchAdminForm from '../components/forms/CreateBranchAdminForm';
import UpdateBranchAdminForm from '../components/forms/UpdateBranchAdminForm';
import CreateEmployeeForm from '../components/forms/CreateEmployeeForm';
import UpdateEmployeeForm from '../components/forms/UpdateEmployeeForm';
// New: Stock Manager Forms
import CreateStockManagerForm from '../components/forms/CreateStockManagerForm';
import UpdateStockManagerForm from '../components/forms/UpdateStockManagerForm';

// Import report components
import OverallReportsComponent from '../components/reports/OverallReportsComponent';
import BranchOverviewReport from '../components/reports/BranchOverviewReport';
import BranchSelector from '../components/reports/BranchSelector';
import BranchDetailsReport from '../components/reports/BranchDetailsReport';
// src/pages/SuperAdminDashboard.jsx
import CreatePostForm from '../components/forms/CreatePostForm';
// Import CSS file (provides general styles for forms and tables, and now the new flash/confirm styles)
import '../styles/SuperAdminDashboard.css';
// Ensure this CSS file has styles for relative-dropdown and dropdown-menu

// Reusable Flash Message Component
const FlashMessage = ({ message, type, onClose, className }) => {
    if (!message) return null;
    const Icon = type === 'success' ? FaCheckCircle : FaExclamationCircle;
    const messageClass = `flash-message flash-message-${type} ${className}`;
    return (
        <div className={messageClass} role="alert">
            <div className="flash-message-content">
                <Icon className="flash-message-icon" />
                <p>{message}</p>
            </div>
            <button onClick={onClose} className="flash-message-close-btn">
                <FaTimes />
            </button>
        </div>
    );
};

// Reusable Confirmation Dialog Component
const ConfirmDialog = ({ show, message, onConfirm, onCancel }) => {
    if (!show) return null;
    return (
        <div className="confirm-dialog-backdrop">
            <div className="confirm-dialog-content">
                <p className="confirm-dialog-message">{message}</p>
                <div className="confirm-dialog-actions">
                    <button onClick={onConfirm} className="btn btn-primary">
                        Confirm
                    </button>
                    <button onClick={onCancel} className="btn btn-secondary">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

const SuperAdminDashboard = () => {
    const { userData, loading: authLoading, isLoggedIn } = useAuth();
    // State for storing fetched data
    const [branches, setBranches] = useState([]);
    const [posts, setPosts] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [branchAdmins, setBranchAdmins] = useState([]);
    const [stockManagers, setStockManagers] = useState([]); // NEW: State for Stock Managers
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState(null);
    const [zones, setZones] = useState([]);
    const [cities, setCities] = useState([]);
    const [salesReps, setSalesReps] = useState([]);
    const [publications, setPublications] = useState([]);
    const [bookCatalogs, setBookCatalogs] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [transports, setTransports] = useState([]);
    const [users, setUsers] = useState([]);

    // Flash Message State
    const [flashMessage, setFlashMessage] = useState(null);
    const [flashMessageType, setFlashMessageType] = useState(''); // 'success' or 'error'
    const [flashMessageAnimationClass, setFlashMessageAnimationClass] = useState('');

    // Confirmation Dialog State
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [onConfirmAction, setOnConfirmAction] = useState(null);

    // States for controlling dropdown visibility for Branches, Admins, Employees, Stock Managers
    const [showBranchesDropdown, setShowBranchesDropdown] = useState(false);
    const [showAdminsDropdown, setShowAdminsDropdown] = useState(false);
    const [showEmployeesDropdown, setShowEmployeesDropdown] = useState(false);
    const [showStockManagersDropdown, setShowStockManagersDropdown] = useState(false); // NEW: Stock Managers dropdown
    const [showReportsDropdown, setShowReportsDropdown] = useState(false);

    // Refs for handling clicks outside dropdowns (to close them)
    const branchesDropdownRef = useRef(null);
    const adminsDropdownRef = useRef(null);
    const employeesDropdownRef = useRef(null);
    const stockManagersDropdownRef = useRef(null); // NEW: Stock Managers ref
    const reportsDropdownRef = useRef(null);

    // State to control which section is displayed in the main content area
    const [activeView, setActiveView] = useState('summary');

    // NEW: State to control which report is active within the 'reports' view
    const [activeReportView, setActiveReportView] = useState('overall');
    const [selectedBranchId, setSelectedBranchId] = useState(null); // State to hold selected branch ID for details report

    // States for managing data during update operations
    const [editingBranchData, setEditingBranchData] = useState(null);
    const [editingBranchAdminData, setEditingBranchAdminData] = useState(null);
    const [editingEmployeeData, setEditingEmployeeData] = useState(null);
    const [editingStockManagerData, setEditingStockManagerData] = useState(null); // NEW: State for editing Stock Manager

    // --- NEW: States for Post Management inside the table ---
    const [newPostName, setNewPostName] = useState('');
    const [editingPostId, setEditingPostId] = useState(null);
    const [editingPostName, setEditingPostName] = useState('');
    
    // Function to show flash messages
    const showFlashMessage = useCallback((message, type) => {
        clearTimeout(window.flashMessageTimeout);
        clearTimeout(window.flashMessageHideTimeout);

        setFlashMessage(message);
        setFlashMessageType(type);
        setFlashMessageAnimationClass('show');

        window.flashMessageTimeout = setTimeout(() => {
            setFlashMessageAnimationClass('hide');
            window.flashMessageHideTimeout = setTimeout(() => {
                setFlashMessage(null);
                setFlashMessageType('');
                setFlashMessageAnimationClass('');
            }, 500);
        }, 2000);
    }, []); // CORRECTED: Removed showFlashMessage from dependency array

    // Function to fetch all dashboard data
    const fetchData = useCallback(async () => {
        try {
            setLoadingData(true);
            setError(null);

            const [branchesResponse, employeesResponse, branchAdminsResponse, stockManagersResponse, postsResponse] = await Promise.all([
                api.get('/branches'),
                api.get('/employees'),
                api.get('/branch-admins'),
                api.get('/stock-managers'),
                api.get('/posts') // NEW: Fetch Posts
            ]);

            setBranches(branchesResponse.data.data);
            setEmployees(employeesResponse.data.data.employees);
            setBranchAdmins(branchAdminsResponse.data.data);
            setStockManagers(stockManagersResponse.data.data); // NEW: Set Stock Managers data
            setPosts(postsResponse.data.data.posts); // NEW: Set Posts data

        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError(err.response ? err.response.data.message : 'Failed to load dashboard data. Please check your network or API connection.');
            showFlashMessage(err.response ? err.response.data.message : 'Failed to load data.', 'error');
        } finally {
            setLoadingData(false);
        }
    }, [showFlashMessage]);

    // useEffect for initial data fetch and auth check
    useEffect(() => {
        if (authLoading) {
            setLoadingData(true);
            return;
        }

        if (!isLoggedIn || !userData || userData.role !== 'super_admin') {
            setError('You do not have permission to access this dashboard. Please log in as a Super Admin.');
            setLoadingData(false);
            showFlashMessage('Access Denied: Please log in as a Super Admin.', 'error');
            return;
        }

        fetchData();
    }, [userData, authLoading, isLoggedIn, fetchData, showFlashMessage]);

    // useEffect to handle clicks outside dropdowns to close them
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (branchesDropdownRef.current && !branchesDropdownRef.current.contains(event.target)) {
                setShowBranchesDropdown(false);
            }
            if (adminsDropdownRef.current && !adminsDropdownRef.current.contains(event.target)) {
                setShowAdminsDropdown(false);
            }
            if (employeesDropdownRef.current && !employeesDropdownRef.current.contains(event.target)) {
                setShowEmployeesDropdown(false);
            }
            // NEW: Handle Stock Managers dropdown
            if (stockManagersDropdownRef.current && !stockManagersDropdownRef.current.contains(event.target)) {
                setShowStockManagersDropdown(false);
            }
            // Handle reports dropdown
            if (reportsDropdownRef.current && !reportsDropdownRef.current.contains(event.target)) {
                setShowReportsDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Dropdown togglers
    const toggleBranchesDropdown = () => setShowBranchesDropdown(prev => !prev);
    const toggleAdminsDropdown = () => setShowAdminsDropdown(prev => !prev);
    const toggleEmployeesDropdown = () => setShowEmployeesDropdown(prev => !prev);
    const toggleStockManagersDropdown = () => setShowStockManagersDropdown(prev => !prev); // NEW: Stock Managers toggler
    const toggleReportsDropdown = () => setShowReportsDropdown(prev => !prev);

    // Function to close all dropdowns
    const closeAllDropdowns = () => {
        setShowBranchesDropdown(false);
        setShowAdminsDropdown(false);
        setShowEmployeesDropdown(false);
        setShowStockManagersDropdown(false); // NEW: Close stock managers dropdown
        setShowReportsDropdown(false);
    };

    // --- Branch Handlers ---
    const handleCreateBranchClick = () => {
        closeAllDropdowns();
        setActiveView('createBranch');
    };

    const handleViewBranches = () => {
        closeAllDropdowns();
        setActiveView('branches');
        fetchData();
    };

    const handleUpdateBranch = (branch) => {
        closeAllDropdowns();
        setEditingBranchData(branch);
        setActiveView('updateBranch');
    };

    const handleDeleteBranch = (branchId) => {
        setItemToDelete(branchId);
        setOnConfirmAction(() => async () => {
            try {
                await api.delete(`/branches/${branchId}`);
                showFlashMessage("Branch deleted successfully!", 'success');
                fetchData();
            } catch (err) {
                console.error("Error deleting branch:", err.response || err);
                showFlashMessage(`Failed to delete branch: ${err.response?.data?.message || err.message}`, 'error');
            } finally {
                setShowConfirmDialog(false);
                setItemToDelete(null);
                setOnConfirmAction(null);
            }
        });
        setShowConfirmDialog(true);
    };

    const onBranchCreated = (newBranch) => {
        showFlashMessage('New branch created successfully!', 'success');
        fetchData();
        setActiveView('branches');
    };

    const onBranchUpdated = (updatedBranch) => {
        showFlashMessage('Branch updated successfully!', 'success');
        fetchData();
        setActiveView('branches');
        setEditingBranchData(null);
    };

    // --- Branch Admin Handlers ---
    const handleCreateBranchAdminClick = () => {
        closeAllDropdowns();
        setActiveView('createBranchAdmin');
    };

    const handleViewBranchAdmins = () => {
        closeAllDropdowns();
        setActiveView('branchAdmins');
        fetchData();
    };

    const handleUpdateBranchAdmin = (admin) => {
        closeAllDropdowns();
        setEditingBranchAdminData(admin);
        setActiveView('updateBranchAdmin');
    };

    const handleDeleteBranchAdmin = (adminId) => {
        setItemToDelete(adminId);
        setOnConfirmAction(() => async () => {
            try {
                await api.delete(`/branch-admins/${adminId}`);
                showFlashMessage("Branch Admin deleted successfully!", 'success');
                fetchData();
            } catch (err) {
                console.error("Error deleting branch admin:", err.response || err);
                showFlashMessage(`Failed to delete branch admin: ${err.response?.data?.message || err.message}`, 'error');
            } finally {
                setShowConfirmDialog(false);
                setItemToDelete(null);
                setOnConfirmAction(null);
            }
        });
        setShowConfirmDialog(true);
    };

    const onBranchAdminCreated = (newAdmin) => {
        showFlashMessage('New branch admin created successfully!', 'success');
        fetchData();
        setActiveView('branchAdmins');
    };

    const onBranchAdminUpdated = (updatedAdmin) => {
        showFlashMessage('Branch Admin updated successfully!', 'success');
        fetchData();
        setActiveView('branchAdmins');
        setEditingBranchAdminData(null);
    };

    // --- Employee Handlers ---
    const handleCreateEmployeeClick = () => {
        closeAllDropdowns();
        setActiveView('createEmployee');
    };

    const handleViewEmployees = () => {
        closeAllDropdowns();
        setActiveView('employees');
        fetchData();
    };

    const handleUpdateEmployee = (employee) => {
        closeAllDropdowns();
        setEditingEmployeeData(employee);
        setActiveView('updateEmployee');
    };

    const handleDeleteEmployee = (employeeId) => {
        setItemToDelete(employeeId);
        setOnConfirmAction(() => async () => {
            try {
                await api.delete(`/employees/${employeeId}`);
                showFlashMessage("Employee deleted successfully!", 'success');
                fetchData();
            } catch (err) {
                console.error("Error deleting employee:", err.response || err);
                showFlashMessage(`Failed to delete employee: ${err.response?.data?.message || err.message}`, 'error');
            } finally {
                setShowConfirmDialog(false);
                setItemToDelete(null);
                setOnConfirmAction(null);
            }
        });
        setShowConfirmDialog(true);
    };

    const onEmployeeCreated = (newEmployee) => {
        showFlashMessage('New employee created successfully!', 'success');
        fetchData();
        setActiveView('employees');
    };

    const onEmployeeUpdated = (updatedEmployee) => {
        showFlashMessage('Employee updated successfully!', 'success');
        fetchData();
        setActiveView('employees');
        setEditingEmployeeData(null);
    };

    // --- NEW: Stock Manager Handlers ---
    const handleCreateStockManagerClick = () => {
        closeAllDropdowns();
        setActiveView('createStockManager');
    };

    const handleViewStockManagers = () => {
        closeAllDropdowns();
        setActiveView('stockManagers');
        fetchData();
    };

    const handleUpdateStockManager = (manager) => {
        closeAllDropdowns();
        setEditingStockManagerData(manager);
        setActiveView('updateStockManager');
    };

    const handleDeleteStockManager = (managerId) => {
        setItemToDelete(managerId);
        setOnConfirmAction(() => async () => {
            try {
                await api.delete(`/stock-managers/${managerId}`); // Make sure your backend route exists
                showFlashMessage("Stock Manager deleted successfully!", 'success');
                fetchData();
            } catch (err) {
                console.error("Error deleting stock manager:", err.response || err);
                showFlashMessage(`Failed to delete stock manager: ${err.response?.data?.message || err.message}`, 'error');
            } finally {
                setShowConfirmDialog(false);
                setItemToDelete(null);
                setOnConfirmAction(null);
            }
        });
        setShowConfirmDialog(true);
    };
    
    // --- Post Handlers (UPDATED) ---
    const handleViewPosts = () => {
        closeAllDropdowns();
        setActiveView('posts');
        fetchData();
    };

    const handleEditPost = (post) => {
        setEditingPostId(post._id);
        setEditingPostName(post.name);
    };

    const handleCancelEdit = () => {
        setEditingPostId(null);
        setEditingPostName('');
    };

    const handleCreateOrUpdatePost = async (e) => {
        e.preventDefault();
        try {
            if (editingPostId) {
                // Update existing post
                await api.patch(`/posts/${editingPostId}`, { name: editingPostName });
                showFlashMessage("Post updated successfully!", 'success');
            } else {
                // Create new post
                if (!newPostName.trim()) {
                    showFlashMessage("Post name cannot be empty.", 'error');
                    return;
                }
                await api.post('/posts', { name: newPostName });
                showFlashMessage("New post created successfully!", 'success');
            }
            
            setNewPostName('');
            setEditingPostId(null);
            setEditingPostName('');
            fetchData();
        } catch (err) {
            console.error("Error creating/updating post:", err.response || err);
            showFlashMessage(`Failed to save post: ${err.response?.data?.message || err.message}`, 'error');
        }
    };

    const handleDeletePost = (postId) => {
        setItemToDelete(postId);
        setOnConfirmAction(() => async () => {
            try {
                await api.delete(`/posts/${postId}`);
                showFlashMessage("Post deleted successfully!", 'success');
                fetchData();
            } catch (err) {
                console.error("Error deleting post:", err.response || err);
                showFlashMessage(`Failed to delete post: ${err.response?.data?.message || err.message}`, 'error');
            } finally {
                setShowConfirmDialog(false);
                setItemToDelete(null);
                setOnConfirmAction(null);
            }
        });
        setShowConfirmDialog(true);
    };

    const onStockManagerCreated = (newManager) => {
        showFlashMessage('New Stock Manager created successfully!', 'success');
        fetchData();
        setActiveView('stockManagers');
    };

    const onStockManagerUpdated = (updatedManager) => {
        showFlashMessage('Stock Manager updated successfully!', 'success');
        fetchData();
        setActiveView('stockManagers');
        setEditingStockManagerData(null);
    };

    // --- Report Specific Handlers ---
    const handleReportSelection = (reportType) => {
        closeAllDropdowns();
        setActiveView('reports');
        setActiveReportView(reportType);
        setSelectedBranchId(null);
    };

    const handleBranchSelectForDetails = (branchId) => {
        setSelectedBranchId(branchId);
        setActiveReportView('branch-details');
    };

    const clearSelectedBranchForDetails = () => {
        setSelectedBranchId(null);
        setActiveReportView('branch-details-selector');
    };

    // --- General Navigation ---
    const handleGoHome = () => {
        setActiveView('summary');
        closeAllDropdowns();
        // Clear all editing states
        setEditingBranchData(null);
        setEditingBranchAdminData(null);
        setEditingEmployeeData(null);
        setEditingStockManagerData(null); // NEW: Clear editing stock manager state
        // Reset report states
        setActiveReportView('overall');
        setSelectedBranchId(null);
        fetchData();
    };

    // Handle confirmation dialog actions
    const handleConfirm = () => {
        if (onConfirmAction) {
            onConfirmAction();
        }
    };

    const handleCancel = () => {
        setShowConfirmDialog(false);
        setItemToDelete(null);
        setOnConfirmAction(null);
    };

    // Helper component for dropdown buttons
    const DropdownButton = ({ onClick, children, icon: IconComponent }) => (
        <button
            onClick={onClick}
            className="dropdown-item"
        >
            {IconComponent && <IconComponent className="mr-2" />}
            {children}
        </button>
    );
    

    // Function to render the active report component
    const renderActiveReportComponent = () => {
        switch (activeReportView) {
            case 'overall':
                return <OverallReportsComponent showFlashMessage={showFlashMessage} />;
            case 'branch-overview':
                return <BranchOverviewReport showFlashMessage={showFlashMessage} />;
            case 'branch-details-selector':
                return (
                    <div className="report-selector-container">
                        <BranchSelector
                            showFlashMessage={showFlashMessage}
                            onSelectBranch={handleBranchSelectForDetails}
                        />
                        <p className="mt-4 text-muted text-center reports-description">
                            Select a branch from the dropdown above to view its detailed report.
                        </p>
                    </div>
                );
            case 'branch-details':
                if (selectedBranchId) {
                    return (
                        <BranchDetailsReport
                            id={selectedBranchId}
                            showFlashMessage={showFlashMessage}
                            onBackToSelector={clearSelectedBranchForDetails}
                        />
                    );
                }
                return (
                    <p className="text-center text-muted mt-5">
                        Please select a branch to view its details.
                    </p>
                );
            default:
                return (
                    <div className="report-default-message">
                        <p>Select a report type from the "Reports" dropdown.</p>
                    </div>
                );
        }
    };

    // Render loading or error states
    if (authLoading || loadingData) {
        return (
            <div className="loading-screen">
                <p>Dashboard is loading...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-screen">
                <p>Error: {error}</p>
                <button onClick={() => window.location.reload()} className="btn btn-primary mt-4">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="super-admin-dashboard-container">
            {/* Flash Message Display Area */}
            <FlashMessage
                message={flashMessage}
                type={flashMessageType}
                onClose={() => {
                    clearTimeout(window.flashMessageTimeout);
                    clearTimeout(window.flashMessageHideTimeout);
                    setFlashMessageAnimationClass('hide');
                    setTimeout(() => {
                        setFlashMessage(null);
                        setFlashMessageType('');
                        setFlashMessageAnimationClass('');
                    }, 500);
                }}
                className={flashMessageAnimationClass}
            />

            {/* Confirmation Dialog */}
            <ConfirmDialog
                show={showConfirmDialog}
                message="Are you sure you want to delete this item? This action cannot be undone."
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />

            <h1 className="dashboard-title">Super Admin Dashboard</h1>

            <div className="welcome-message-card">
                <p className="welcome-text">
                    Hello, {userData?.name || userData?.username || 'Super Admin'}
                </p>
            </div>

            {/* Main Action Buttons with Dropdowns */}
            <div className="main-actions-grid">
                {/* Home/Summary Button */}
                <button
                    onClick={handleGoHome}
                    className="action-button home-button"
                >
                    <FaHome className="icon" />
                    <span>View Summary</span>
                </button>

                {/* Branches Button and Dropdown */}
                <div className="relative-dropdown" ref={branchesDropdownRef}>
                    <button
                        onClick={toggleBranchesDropdown}
                        className="action-button branch-button"
                    >
                        <FaBuilding className="icon" />
                        <span>Branches</span>
                        <FaChevronDown className={`dropdown-arrow ${showBranchesDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showBranchesDropdown && (
                        <div className="dropdown-menu">
                            <DropdownButton onClick={handleCreateBranchClick} icon={FaPlus}>Add New Branch</DropdownButton>
                            <DropdownButton onClick={handleViewBranches} icon={FaEye}>View Branches</DropdownButton>
                        </div>
                    )}
                </div>

                {/* Admins Button and Dropdown */}
                <div className="relative-dropdown" ref={adminsDropdownRef}>
                    <button
                        onClick={toggleAdminsDropdown}
                        className="action-button admin-button"
                    >
                        <FaUsers className="icon" />
                        <span>Admins</span>
                        <FaChevronDown className={`dropdown-arrow ${showAdminsDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showAdminsDropdown && (
                        <div className="dropdown-menu">
                            <DropdownButton onClick={handleCreateBranchAdminClick} icon={FaPlus}>Add New Branch Admin</DropdownButton>
                            <DropdownButton onClick={handleViewBranchAdmins} icon={FaEye}>View Branch Admins</DropdownButton>
                        </div>
                    )}
                </div>

                {/* Employees Button and Dropdown */}
                <div className="relative-dropdown" ref={employeesDropdownRef}>
                    <button
                        onClick={toggleEmployeesDropdown}
                        className="action-button employee-button"
                    >
                        <FaUserTie className="icon" />
                        <span>Employees</span>
                        <FaChevronDown className={`dropdown-arrow ${showEmployeesDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showEmployeesDropdown && (
                        <div className="dropdown-menu">
                            <DropdownButton onClick={handleCreateEmployeeClick} icon={FaPlus}>Add New Employee</DropdownButton>
                            <DropdownButton onClick={handleViewEmployees} icon={FaEye}>View Employees</DropdownButton>
                        </div>
                    )}
                </div>
                

                {/* NEW: Stock Managers Button and Dropdown */}
                <div className="relative-dropdown" ref={stockManagersDropdownRef}>
                    <button
                        onClick={toggleStockManagersDropdown}
                        className="action-button stock-manager-button"
                    >
                        <FaBoxes className="icon" />
                        <span>Stock Managers</span>
                        <FaChevronDown className={`dropdown-arrow ${showStockManagersDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showStockManagersDropdown && (
                        <div className="dropdown-menu">
                            <DropdownButton onClick={handleCreateStockManagerClick} icon={FaPlus}>Add New Stock Manager</DropdownButton>
                            <DropdownButton onClick={handleViewStockManagers} icon={FaEye}>View Stock Managers</DropdownButton>
                        </div>
                    )}
                </div>
                
                {/* Posts Button (No Dropdown) */}
                <button
                    onClick={handleViewPosts}
                    className="action-button posts-button"
                >
                    <FaBookOpen className="icon" />
                    <span>Posts</span>
                </button>


                {/* Reports Button with Dropdown */}
                <div className="relative-dropdown" ref={reportsDropdownRef}>
                    <button
                        onClick={toggleReportsDropdown}
                        className="action-button report-button"
                    >
                        <FaChartBar className="icon" />
                        <span>View Reports</span>
                        <FaChevronDown className={`dropdown-arrow ${showReportsDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showReportsDropdown && (
                        <div className="dropdown-menu">
                            <DropdownButton onClick={() => handleReportSelection('overall')} icon={FaChartBar}>Overall Business Summary</DropdownButton>
                            <DropdownButton onClick={() => handleReportSelection('branch-overview')} icon={FaBuilding}>All Branches Overview</DropdownButton>
                            <DropdownButton onClick={() => handleReportSelection('branch-details-selector')} icon={FaSearchLocation}>Specific Branch Details</DropdownButton>
                        </div>
                    )}
                </div>
            </div>

            {/* Dynamic Content Area based on activeView */}
            {activeView === 'summary' && (
                <div className="summary-section">
                    <h2 className="section-title">System Summary</h2>
                    <div className="summary-cards-grid">
                        <div className="summary-card">
                            <FaBuilding className="summary-icon purple" />
                            <p className="summary-text"> Branches:</p>
                            <p className="summary-count">{branches.length}</p>
                        </div>

                        <div className="summary-card">
                            <FaUsers className="summary-icon indigo" />
                            <p className="summary-text"> Admins:</p>
                            <p className="summary-count">{branchAdmins.length}</p>
                        </div>

                        <div className="summary-card">
                            <FaUserTie className="summary-icon teal" />
                            <p className="summary-text">Employees:</p>
                            <p className="summary-count">{employees.length}</p>
                        </div>

                        <div className="summary-card">
                            <FaBoxes className="summary-icon brown" /> {/* NEW: Stock Managers Summary Card */}
                            <p className="summary-text">Stock Managers:</p>
                            <p className="summary-count">{stockManagers.length}</p>
                        </div>

                        <div className="summary-card">
                            <FaGlobeAsia className="summary-icon orange" />
                            <p className="summary-text">Zones:</p>
                            <p className="summary-count">{zones.length}</p>
                        </div>

                        <div className="summary-card">
                            <FaCity className="summary-icon cyan" />
                            <p className="summary-text">Cities:</p>
                            <p className="summary-count">{cities.length}</p>
                        </div>

                        <div className="summary-card">
                            <FaUserFriends className="summary-icon blue" />
                            <p className="summary-text">Sales Reps:</p>
                            <p className="summary-count">{salesReps.length}</p>
                        </div>

                        <div className="summary-card">
                            <FaBook className="summary-icon brown" />
                            <p className="summary-text">Publications:</p>
                            <p className="summary-count">{publications.length}</p>
                        </div>

                        <div className="summary-card">
                            <FaBookOpen className="summary-icon violet" />
                            <p className="summary-text">Book Catalogs:</p>
                            <p className="summary-count">{bookCatalogs.length}</p>
                        </div>

                        <div className="summary-card">
                            <FaUserCheck className="summary-icon lime" />
                            <p className="summary-text">Customers:</p>
                            <p className="summary-count">{customers.length}</p>
                        </div>

                        <div className="summary-card">
                            <FaTruck className="summary-icon red" />
                            <p className="summary-text">Transports:</p>
                            <p className="summary-count">{transports.length}</p>
                        </div>

                        <div className="summary-card">
                            <FaUserCog className="summary-icon darkgray" />
                            <p className="summary-text">Users:</p>
                            <p className="summary-count">{users.length}</p>
                        </div>
                    </div>
                </div>
            )}

            {activeView === 'createBranch' && (
                <CreateBranchForm
                    onBranchCreated={onBranchCreated}
                    onCancel={() => setActiveView('branches')}
                    showFlashMessage={showFlashMessage}
                />
            )}

            {activeView === 'updateBranch' && editingBranchData && (
                <UpdateBranchForm
                    branchData={editingBranchData}
                    onBranchUpdated={onBranchUpdated}
                    onCancel={() => setActiveView('branches')}
                    showFlashMessage={showFlashMessage}
                />
            )}

            {activeView === 'createBranchAdmin' && (
                <CreateBranchAdminForm
                    onBranchAdminCreated={onBranchAdminCreated}
                    onCancel={() => setActiveView('branchAdmins')}
                    branches={branches}
                />
            )}

            {activeView === 'updateBranchAdmin' && editingBranchAdminData && (
                <UpdateBranchAdminForm
                    adminData={editingBranchAdminData}
                    onBranchAdminUpdated={onBranchAdminUpdated}
                    onCancel={() => setActiveView('branchAdmins')}
                    branches={branches}
                />
            )}

            {activeView === 'createEmployee' && (
                <CreateEmployeeForm
                    onEmployeeCreated={onEmployeeCreated}
                    onCancel={() => setActiveView('employees')}
                    branches={branches}
                    posts={posts} // Pass the posts to the form
                />
            )}

            {activeView === 'updateEmployee' && editingEmployeeData && (
                <UpdateEmployeeForm
                    employeeData={editingEmployeeData}
                    onEmployeeUpdated={onEmployeeUpdated}
                    onCancel={() => setActiveView('employees')}
                    branches={branches}
                    posts={posts} // Pass the posts to the form
                />
            )}

            {activeView === 'createStockManager' && (
                <CreateStockManagerForm
                    onStockManagerCreated={onStockManagerCreated}
                    onCancel={() => setActiveView('stockManagers')}
                    showFlashMessage={showFlashMessage}
                />
            )}

            {activeView === 'updateStockManager' && editingStockManagerData && (
                <UpdateStockManagerForm
                    managerData={editingStockManagerData}
                    onStockManagerUpdated={onStockManagerUpdated}
                    onCancel={() => setActiveView('stockManagers')}
                    showFlashMessage={showFlashMessage}
                />
            )}
            
            {activeView === 'branches' && (
                <div className="table-section">
                    <div className="table-header">
                        <h2 className="table-title">All Branches</h2>
                        <button onClick={handleCreateBranchClick} className="btn btn-primary">
                            <FaPlus className="mr-2" /> Add New Branch
                        </button>
                    </div>
                    {branches.length === 0 ? (
                        <p className="no-data-message">No branches available. Please add a new branch to see it here.</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="data-table">
                                <thead className="table-head">
                                    <tr>
                                        <th className="table-th">Name</th>
                                        <th className="table-th">Location</th>
                                        <th className="table-th">Status</th>
                                        <th className="table-th actions-th">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="table-body">
                                    {branches.map(branch => (
                                        <tr key={branch._id} className="table-row">
                                            <td className="table-td">{branch.name}</td>
                                            <td className="table-td">{branch.location}</td>
                                            <td className="table-td">
                                                <span className={`status-badge ${branch.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                                                    {branch.status}
                                                </span>
                                            </td>
                                            <td className="table-td action-buttons">
                                                <button
                                                    onClick={() => handleUpdateBranch(branch)}
                                                    className="action-icon-button edit-button"
                                                    title="Update Branch"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteBranch(branch._id)}
                                                    className="action-icon-button delete-button"
                                                    title="Delete Branch"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeView === 'branchAdmins' && (
                <div className="table-section">
                    <div className="table-header">
                        <h2 className="table-title">All Branch Admins</h2>
                        <button onClick={handleCreateBranchAdminClick} className="btn btn-primary">
                            <FaPlus className="mr-2" /> Add New Branch Admin
                        </button>
                    </div>
                    {branchAdmins.length === 0 ? (
                        <p className="no-data-message">No branch admins available. Please add a new branch admin.</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="data-table">
                                <thead className="table-head">
                                    <tr>
                                        <th className="table-th">Name</th>
                                        <th className="table-th">Email</th>
                                        <th className="table-th">Branch</th>
                                        <th className="table-th actions-th">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="table-body">
                                    {branchAdmins.map(admin => (
                                        <tr key={admin._id} className="table-row">
                                            <td className="table-td">{admin.name}</td>
                                            <td className="table-td">{admin.email}</td>
                                            <td className="table-td">
                                                {admin.branchId ? admin.branchId.name || 'N/A' : 'N/A'}
                                            </td>
                                            <td className="table-td action-buttons">
                                                <button
                                                    onClick={() => handleUpdateBranchAdmin(admin)}
                                                    className="action-icon-button edit-button"
                                                    title="Update Branch Admin"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteBranchAdmin(admin._id)}
                                                    className="action-icon-button delete-button"
                                                    title="Delete Branch Admin"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeView === 'employees' && (
                <div className="table-section">
                    <div className="table-header">
                        <h2 className="table-title">All Employees</h2>
                        <button onClick={handleCreateEmployeeClick} className="btn btn-primary">
                            <FaPlus className="mr-2" /> Add New Employee
                        </button>
                    </div>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead className="table-head">
                                <tr>
                                    <th className="table-th">Name</th>
                                    <th className="table-th">Post</th>
                                    <th className="table-th">City</th>
                                    <th className="table-th">Adhaar No</th>
                                    <th className="table-th">PAN Card No</th>
                                    <th className="table-th">Emp. Code</th>
                                    <th className="table-th">Salary</th>
                                    <th className="table-th">Mobile Number</th>
                                    <th className="table-th">Address</th>
                                    <th className="table-th">Bank Details</th>
                                    <th className="table-th">Branch</th>
                                    <th className="table-th">Status</th>
                                    <th className="table-th">Passport Photo</th>
                                    <th className="table-th">Document</th>
                                    <th className="table-th actions-th">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="table-body">
                                {loadingData ? (
                                    <tr>
                                        <td colSpan="15" className="text-center">Loading...</td>
                                    </tr>
                                ) : employees.length === 0 ? (
                                    <tr>
                                        <td colSpan="15" className="text-center">No employees found.</td>
                                    </tr>
                                ) : (
                                    employees.map(employee => (
                                        <tr key={employee._id} className="table-row">
                                            <td className="table-td">{employee.name}</td>
                                            <td className="table-td">{employee.postId?.name || 'N/A'}</td>
                                            <td className="table-td">{employee.cityId?.name || 'N/A'}</td>
                                            <td className="table-td">{employee.adharNo || 'N/A'}</td>
                                            <td className="table-td">{employee.panCardNo || 'N/A'}</td>
                                            <td className="table-td">{employee.employeeCode || 'N/A'}</td>
                                            <td className="table-td">{employee.salary || 'N/A'}</td>
                                            <td className="table-td">{employee.mobileNumber || 'N/A'}</td>
                                            <td className="table-td">{employee.address || 'N/A'}</td>
                                            <td className="table-td">{employee.bankDetail || 'N/A'}</td>
                                            <td className="table-td">
                                                {employee.branchId ? employee.branchId.name || 'N/A' : 'N/A'}
                                            </td>
                                            <td className="table-td">
                                                <span className={`status-badge ${employee.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                                                    {employee.status}
                                                </span>
                                            </td>
                                            <td className="table-td">
                                                {employee.passportPhoto ? (
                                                    <a href={`http://localhost:5000/${employee.passportPhoto}`} target="_blank" rel="noopener noreferrer" className="action-icon-button view-file-button">
                                                        <FaImage />
                                                    </a>
                                                ) : (
                                                    'N/A'
                                                )}
                                            </td>
                                            <td className="table-td">
                                                {employee.documentPDF ? (
                                                    <a href={`http://localhost:5000/${employee.documentPDF}`} target="_blank" rel="noopener noreferrer" className="action-icon-button view-file-button">
                                                        <FaFilePdf />
                                                    </a>
                                                ) : (
                                                    'N/A'
                                                )}
                                            </td>
                                            <td className="table-td action-buttons">
                                                <button
                                                    onClick={() => handleUpdateEmployee(employee)}
                                                    className="action-icon-button edit-button"
                                                    title="Update Employee"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteEmployee(employee._id)}
                                                    className="action-icon-button delete-button"
                                                    title="Delete Employee"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

           {activeView === 'stockManagers' && (
    <div className="table-view card shadow-sm">
        <div className="table-header">
            <h2>All Stock Managers</h2>
            <button onClick={handleCreateStockManagerClick} className="btn btn-add">
                <FaPlus className="mr-2" /> Add New Stock Manager
            </button>
        </div>
        <table className="data-table">
            <thead className="table-head">
                <tr className="table-row-header">
                    <th className="table-th">Name</th>
                    <th className="table-th">Mobile</th>
                    <th className="table-th">Branch</th>
                    <th className="table-th">Actions</th>
                </tr>
            </thead>
            <tbody className="table-body">
                {stockManagers.length === 0 ? (
                    <tr>
                        <td colSpan="4" className="text-center">No stock managers found.</td>
                    </tr>
                ) : (
                    stockManagers.map(manager => (
                        <tr key={manager._id} className="table-row">
                            <td className="table-td">{manager.name}</td>
                            <td className="table-td">{manager.mobileNumber || 'N/A'}</td>
                            <td className="table-td">{manager.branchId?.name || 'N/A'}</td>
                            <td className="table-td action-buttons">
                                <button
                                    onClick={() => handleUpdateStockManager(manager)}
                                    className="action-icon-button edit-button"
                                    title="Update Stock Manager"
                                >
                                    <FaEdit />
                                </button>
                                <button
                                    onClick={() => handleDeleteStockManager(manager._id)}
                                    className="action-icon-button delete-button"
                                    title="Delete Stock Manager"
                                >
                                    <FaTrash />
                                </button>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
)}

{activeView === 'posts' && (
    <div className="table-view card shadow-sm">
        <div className="table-header">
            <h2>All Posts</h2>
        </div>
        <div className="form-container mb-3 p-3">
            <form onSubmit={handleCreateOrUpdatePost}>
                <div className="form-group mb-2 d-flex align-items-center">
                    <FaPlus className="mr-2" />
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Enter new post name..."
                        value={newPostName}
                        onChange={(e) => setNewPostName(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary ml-2">Add Post</button>
                </div>
            </form>
        </div>
        <table className="data-table">
            <thead className="table-head">
                <tr className="table-row-header">
                    <th className="table-th">Post Name</th>
                    <th className="table-th actions-th">Actions</th>
                </tr>
            </thead>
            <tbody className="table-body">
                {posts.length === 0 ? (
                    <tr>
                        <td colSpan="2" className="text-center">No posts found.</td>
                    </tr>
                ) : (
                    posts.map(post => (
                        <tr key={post._id} className="table-row">
                            <td className="table-td">
                                {editingPostId === post._id ? (
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={editingPostName}
                                        onChange={(e) => setEditingPostName(e.target.value)}
                                    />
                                ) : (
                                    post.name
                                )}
                            </td>
                            <td className="table-td action-buttons">
                                {editingPostId === post._id ? (
                                    <>
                                        <button
                                            onClick={handleCreateOrUpdatePost}
                                            className="action-icon-button edit-button"
                                            title="Save Changes"
                                        >
                                            <FaCheckCircle />
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="action-icon-button delete-button"
                                            title="Cancel Edit"
                                        >
                                            <FaTimes />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => handleEditPost(post)}
                                            className="action-icon-button edit-button"
                                            title="Update Post"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => handleDeletePost(post._id)}
                                            className="action-icon-button delete-button"
                                            title="Delete Post"
                                        >
                                            <FaTrash />
                                        </button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
)}


            {activeView === 'reports' && (
                <div className="report-display-area card shadow-sm">
                    <h2 className="reports-main-title">Business Intelligence Reports</h2>
                    {renderActiveReportComponent()}
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;