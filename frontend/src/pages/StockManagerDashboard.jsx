import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom'; // Corrected import path for react-router-dom

// UI Components and Utilities
import FlashMessage from '../components/FlashMessage';
import StockManagerDashboardSummary from '../components/dashboard/StockManagerDashboardSummary';
import ClassManagement from '../components/masters/ClassManagement';
import ZoneManagement from '../components/masters/ZoneManagement';
import CityManagement from '../components/masters/CityManagement';
import PublicationManagement from '../components/masters/PublicationManagement';
import LanguageManagement from '../components/masters/LanguageManagement';
import BookCatalogManagement from '../components/masters/BookCatalogManagement';
import StationeryItemManagement from '../components/masters/StationeryItemManagement';
import CustomerManagement from '../components/masters/CustomerManagement';
import TransportManagement from '../components/masters/TransportManagement';
import PendingBookManagement from '../components/PendingBookManagement';
import CreateSetManagement from '../components/masters/CreateSetManagement';

// Icons for navigation and UI
import {
    FaChartBar,
    FaThLarge,
    FaChevronDown,
    FaShoppingCart,
    FaDollarSign,
    FaBars, // Icon for opening sidebar
    FaTimes, // Icon for closing sidebar

    // Master Option Icons:
    FaGraduationCap,
    FaGlobeAsia,
    FaCity,
    FaBook,
    FaBookOpen,
    FaPencilRuler,
    FaUserFriends,
    FaTruck,
    FaLayerGroup, // For Create Sets
    FaLanguage,
    FaHourglassHalf, // For Pending Book

    // Purchase Option Icons:
    FaClipboardList,
    FaFileInvoice,
    FaMoneyBillAlt,
    FaUndo,
    FaBook as FaBookLedger,
    FaChartLine,
    FaWarehouse,

    // Sales Option Icons:
    FaReceipt,
    FaHourglass,
    FaBookDead,
    FaFileContract,
    FaMoneyCheckAlt,
    FaWallet,
    FaExchangeAlt,
    FaChartBar as FaChartBarLedger,
    FaBan,
    FaChartPie,
    FaChartArea

} from 'react-icons/fa';


// Stylesheets
import '../styles/Dashboard.css';
import '../styles/StockManagerDashboard.css';


// Placeholder for un-implemented sections, used by ManagementPlaceholder
const ManagementPlaceholder = ({ title }) => (
    <div className="content-placeholder card">
        <h3>{title} (Coming Soon)</h3>
        <p>Manage {title.toLowerCase()} here.</p>
    </div>
);


const StockManagerDashboard = ({ showFlashMessage: propShowFlashMessage }) => {
    const { userData, isLoggedIn, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [activeView, setActiveView] = useState('dashboard');
    const [flashMessage, setFlashMessage] = useState(null);

    // State to control sidebar collapse/expand for desktop, and mobile visibility
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    // State to track if it's a mobile view
    const [isMobile, setIsMobile] = useState(false);

    // State to control the visibility of dropdown menus
    const [showMasterDropdown, setShowMasterDropdown] = useState(false);
    const [showPurchaseDropdown, setShowPurchaseDropdown] = useState(false);
    const [showSalesDropdown, setShowSalesDropdown] = useState(false);

    // Refs for click-outside detection
    const masterDropdownRef = useRef(null);
    const purchaseDropdownRef = useRef(null);
    const salesDropdownRef = useRef(null);

    // Effect hook for authentication check and redirection.
    useEffect(() => {
        if (!authLoading && (!isLoggedIn || userData?.role !== 'stock_manager')) {
            console.log('StockManagerDashboard: Unauthorized or not logged in. Redirecting to login page.');
            navigate('/login', { replace: true, state: { message: 'Please log in as a Stock Manager to access this page.' } });
        }
    }, [isLoggedIn, userData, navigate, authLoading]);

    // Callback function to display flash messages.
    const showFlashMessage = useCallback((message, type) => {
        if (propShowFlashMessage) {
            propShowFlashMessage(message, type);
        } else {
            console.log(`FlashMessage: ${message} (Type: ${type})`);
            setFlashMessage(null); // Clear previous message first
            setFlashMessage({ message, type });
            setTimeout(() => setFlashMessage(null), 5000);
        }
    }, [propShowFlashMessage]);

    // Handler for when a Master/Purchase/Sales dropdown option is clicked.
    const handleOptionClick = useCallback((option) => {
        setActiveView(option); // This sets the active view state
        // Close all dropdowns after an option is clicked
        setShowMasterDropdown(false);
        setShowPurchaseDropdown(false);
        setShowSalesDropdown(false);
        // On mobile, also close the sidebar when an option is clicked
        if (isMobile) {
            setIsSidebarCollapsed(true); // Set to collapsed state for mobile to hide it
        }
    }, [isMobile]);

    // Function to toggle Master dropdown visibility
    const toggleMasterDropdown = () => {
        setShowMasterDropdown(prev => !prev);
        setShowPurchaseDropdown(false);
        setShowSalesDropdown(false);
    };

    // Function to toggle Purchase dropdown visibility
    const togglePurchaseDropdown = () => {
        setShowPurchaseDropdown(prev => !prev);
        setShowMasterDropdown(false);
        setShowSalesDropdown(false);
    };

    // Function to toggle Sales dropdown visibility
    const toggleSalesDropdown = () => {
        setShowSalesDropdown(prev => !prev);
        setShowMasterDropdown(false);
        setShowPurchaseDropdown(false);
    };

    // Effect hook to close any open dropdown when a click occurs outside of it.
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (masterDropdownRef.current && !masterDropdownRef.current.contains(event.target)) {
                setShowMasterDropdown(false);
            }
            if (purchaseDropdownRef.current && !purchaseDropdownRef.current.contains(event.target)) {
                setShowPurchaseDropdown(false);
            }
            if (salesDropdownRef.current && !salesDropdownRef.current.contains(event.target)) {
                setShowSalesDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Handle sidebar toggle and responsiveness
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (mobile) {
                setIsSidebarCollapsed(true); // Always collapsed by default on mobile (hidden)
            } else {
                setIsSidebarCollapsed(false); // Always expanded by default on desktop
            }
        };

        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Render a loading screen if authentication is in progress
    if (authLoading || (!isLoggedIn && !authLoading)) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <p className="text-xl text-gray-700">Loading user authentication status...</p>
            </div>
        );
    }

    if (!userData || userData.role !== 'stock_manager') {
        return null;
    }

    return (
        <>
            <div className="dashboard-container">
                {/* Sidebar Navigation */}
                <aside className={`sidebar ${isMobile ? (isSidebarCollapsed ? 'mobile-hidden' : 'mobile-visible') : (isSidebarCollapsed ? 'collapsed' : '')}`}>
                    <div className="sidebar-header">
                        <h3>Stock Manager</h3>
                        {/* Removed the duplicate user info/logout button from sidebar header */}
                        <button className="sidebar-toggle" onClick={() => setIsSidebarCollapsed(prev => !prev)}>
                            {isSidebarCollapsed ? (
                                // Menu Icon
                                <FaBars />
                            ) : (
                                // Close Icon
                                <FaTimes />
                            )}
                        </button>
                    </div>
                    <nav className="sidebar-nav">
                        <ul>
                            <li>
                                <button
                                    className={activeView === 'dashboard' ? 'active' : ''}
                                    onClick={() => handleOptionClick('dashboard')}
                                >
                                    <FaChartBar className="nav-icon" /> <span className="text">Dashboard Summary</span>
                                </button>
                            </li>

                            {/* Master Options Dropdown */}
                            <li className="relative-dropdown" ref={masterDropdownRef}>
                                <button
                                    className={`${showMasterDropdown ? 'active' : ''}`}
                                    onClick={toggleMasterDropdown}
                                >
                                    <FaThLarge className="nav-icon" /> <span className="text">Masters</span>
                                    <FaChevronDown className={`dropdown-arrow ${showMasterDropdown ? 'rotate-180' : ''}`} />
                                </button>
                                {showMasterDropdown && (
                                    <div className="dropdown-menu">
                                        <button onClick={() => handleOptionClick('class')}>
                                            <FaGraduationCap className="dropdown-icon" /> Class
                                        </button>
                                        <button onClick={() => handleOptionClick('zone')}>
                                            <FaGlobeAsia className="dropdown-icon" /> Zone
                                        </button>
                                        <button onClick={() => handleOptionClick('city')}>
                                            <FaCity className="dropdown-icon" /> City
                                        </button>
                                        <button onClick={() => handleOptionClick('publication')}>
                                            <FaBook className="dropdown-icon" /> Publication
                                        </button>
                                        <button onClick={() => handleOptionClick('language')}>
                                            <FaLanguage className="dropdown-icon" /> Language
                                        </button>
                                        <button onClick={() => handleOptionClick('book-catalog')}>
                                            <FaBookOpen className="dropdown-icon" /> Book Catalog
                                        </button>
                                        <button onClick={() => handleOptionClick('stationery-item')}>
                                            <FaPencilRuler className="dropdown-icon" /> Stationery Item
                                        </button>
                                        <button onClick={() => handleOptionClick('customers')}>
                                            <FaUserFriends className="dropdown-icon" /> Customers
                                        </button>
                                        <button onClick={() => handleOptionClick('transports')}>
                                            <FaTruck className="dropdown-icon" /> Transports
                                        </button>
                                        <button onClick={() => handleOptionClick('create-sets')}>
                                            <FaLayerGroup className="dropdown-icon" /> Create Sets
                                        </button>
                                        <button onClick={() => handleOptionClick('pending-book')}>
                                            <FaHourglassHalf className="dropdown-icon" /> Pending Book
                                        </button>
                                    </div>
                                )}
                            </li>

                            {/* Purchase Options Dropdown */}
                            <li className="relative-dropdown" ref={purchaseDropdownRef}>
                                <button
                                    className={`${showPurchaseDropdown ? 'active' : ''}`}
                                    onClick={togglePurchaseDropdown}
                                >
                                    <FaShoppingCart className="nav-icon" /> <span className="text">Purchase</span>
                                    <FaChevronDown className={`dropdown-arrow ${showPurchaseDropdown ? 'rotate-180' : ''}`} />
                                </button>
                                {showPurchaseDropdown && (
                                    <div className="dropdown-menu">
                                        <button onClick={() => handleOptionClick('purchase-order')}>
                                            <FaClipboardList className="dropdown-icon" /> Purchase Order
                                        </button>
                                        <button onClick={() => handleOptionClick('purchase-invoice')}>
                                            <FaFileInvoice className="dropdown-icon" /> Purchase Invoice
                                        </button>
                                        <button onClick={() => handleOptionClick('payment-voucher')}>
                                            <FaMoneyBillAlt className="dropdown-icon" /> Payment Voucher
                                        </button>
                                        <button onClick={() => handleOptionClick('purchase-return-debit-note')}>
                                            <FaUndo className="dropdown-icon" /> Purchase Return (Debit Note)
                                        </button>
                                        <button onClick={() => handleOptionClick('purchase-ledgers')}>
                                            <FaBookLedger className="dropdown-icon" /> Purchase Ledgers
                                        </button>
                                        <button onClick={() => handleOptionClick('purchase-reports')}>
                                            <FaChartLine className="dropdown-icon" /> Purchase Reports
                                        </button>
                                        <button onClick={() => handleOptionClick('stock-balance')}>
                                            <FaWarehouse className="dropdown-icon" /> Stock Balance
                                        </button>
                                    </div>
                                )}
                            </li>

                            {/* Sales Options Dropdown */}
                            <li className="relative-dropdown" ref={salesDropdownRef}>
                                <button
                                    className={`${showSalesDropdown ? 'active' : ''}`}
                                    onClick={toggleSalesDropdown}
                                >
                                    <FaDollarSign className="nav-icon" /> <span className="text">Sales</span>
                                    <FaChevronDown className={`dropdown-arrow ${showSalesDropdown ? 'rotate-180' : ''}`} />
                                </button>
                                {showSalesDropdown && (
                                    <div className="dropdown-menu">
                                        <button onClick={() => handleOptionClick('sale-bill')}>
                                            <FaReceipt className="dropdown-icon" /> Sale Bill
                                        </button>
                                        <button onClick={() => handleOptionClick('manual-pending-sale')}>
                                            <FaHourglass className="dropdown-icon" /> Manual Pending Sale
                                        </button>
                                        <button onClick={() => handleOptionClick('pending-books')}>
                                            <FaBookDead className="dropdown-icon" /> Pending Books
                                        </button>
                                        <button onClick={() => handleOptionClick('pending-books-ledger')}>
                                            <FaFileContract className="dropdown-icon" /> Pending Books Ledger
                                        </button>
                                        <button onClick={() => handleOptionClick('receipt-voucher')}>
                                            <FaMoneyCheckAlt className="dropdown-icon" /> Receipt Voucher
                                        </button>
                                        <button onClick={() => handleOptionClick('advance-deposit')}>
                                            <FaWallet className="dropdown-icon" /> Advance Deposit
                                        </button>
                                        <button onClick={() => handleOptionClick('sale-return-credit-note')}>
                                            <FaExchangeAlt className="dropdown-icon" /> Sale Return (Credit Note)
                                        </button>
                                        <button onClick={() => handleOptionClick('sale-ledgers')}>
                                            <FaChartBarLedger className="dropdown-icon" /> Sale Ledgers
                                        </button>
                                        <button onClick={() => handleOptionClick('books-not-sold')}>
                                            <FaBan className="dropdown-icon" /> Books Not Sold
                                        </button>
                                        <button onClick={() => handleOptionClick('sale-reports')}>
                                            <FaChartPie className="dropdown-icon" /> Sale Reports
                                        </button>
                                        <button onClick={() => handleOptionClick('books-sale-reports')}>
                                            <FaChartArea className="dropdown-icon" /> Books Sale Reports
                                        </button>
                                        <button onClick={() => handleOptionClick('sale-purchase-reports')}>
                                            <FaChartBar className="dropdown-icon" /> Sale-Purchase Reports
                                        </button>
                                    </div>
                                )}
                            </li>
                        </ul>
                    </nav>
                </aside>

                {/* Main Content Area */}
                <div className="main-content-wrapper">
                    <header className="dashboard-header">
                        
                        <div className="user-info">
                            <span>Welcome, {userData.name || userData.email}!</span>
                           
                        </div>
                    </header>

                    <main className="dashboard-main-content">
                        {flashMessage && (
                            <FlashMessage message={flashMessage.message} type={flashMessage.type} />
                        )}

                        <div className="dashboard-content-area">
                            {activeView === 'dashboard' && <StockManagerDashboardSummary showFlashMessage={showFlashMessage} />}
                            {activeView === 'class' && <ClassManagement showFlashMessage={showFlashMessage} />}
                            {activeView === 'zone' && <ZoneManagement showFlashMessage={showFlashMessage} />}
                            {activeView === 'city' && <CityManagement showFlashMessage={showFlashMessage} />}
                            {activeView === 'publication' && <PublicationManagement showFlashMessage={showFlashMessage} />}
                            {activeView === 'language' && <LanguageManagement showFlashMessage={showFlashMessage} />}
                            {activeView === 'book-catalog' && <BookCatalogManagement showFlashMessage={showFlashMessage} />}
                            {activeView === 'stationery-item' && <StationeryItemManagement showFlashMessage={showFlashMessage} />}
                            {activeView === 'customers' && <CustomerManagement showFlashMessage={showFlashMessage} />}
                            {activeView === 'transports' && <TransportManagement showFlashMessage={showFlashMessage} />}

                            {/* THIS IS THE CORRECT RENDERING FOR CreateSetManagement */}
                            {activeView === 'create-sets' && (
                                <CreateSetManagement showFlashMessage={showFlashMessage} />
                            )}

                            {activeView === 'pending-book' && (
                                <PendingBookManagement showFlashMessage={showFlashMessage} />
                            )}

                            {/* Placeholders for Purchase Options */}
                            {activeView === 'purchase-order' && <ManagementPlaceholder title="Purchase Order" />}
                            {activeView === 'purchase-invoice' && <ManagementPlaceholder title="Purchase Invoice" />}
                            {activeView === 'payment-voucher' && <ManagementPlaceholder title="Payment Voucher" />}
                            {activeView === 'purchase-return-debit-note' && <ManagementPlaceholder title="Purchase Return (Debit Note)" />}
                            {activeView === 'purchase-ledgers' && <ManagementPlaceholder title="Purchase Ledgers" />}
                            {activeView === 'purchase-reports' && <ManagementPlaceholder title="Purchase Reports" />}
                            {activeView === 'stock-balance' && <ManagementPlaceholder title="Stock Balance" />}

                            {/* Placeholders for Sales Options */}
                            {activeView === 'sale-bill' && <ManagementPlaceholder title="Sale Bill" />}
                            {activeView === 'manual-pending-sale' && <ManagementPlaceholder title="Manual Pending Sale" />}
                            {activeView === 'pending-books' && <ManagementPlaceholder title="Pending Books" />}
                            {activeView === 'pending-books-ledger' && <ManagementPlaceholder title="Pending Books Ledger" />}
                            {activeView === 'receipt-voucher' && <ManagementPlaceholder title="Receipt Voucher" />}
                            {activeView === 'advance-deposit' && <ManagementPlaceholder title="Advance Deposit" />}
                            {activeView === 'sale-return-credit-note' && <ManagementPlaceholder title="Sale Return (Credit Note)" />}
                            {activeView === 'sale-ledgers' && <ManagementPlaceholder title="Sale Ledgers" />}
                            {activeView === 'books-not-sold' && <ManagementPlaceholder title="Books Not Sold" />}
                            {activeView === 'sale-reports' && <ManagementPlaceholder title="Sale Reports" />}
                            {activeView === 'books-sale-reports' && <ManagementPlaceholder title="Books Sale Reports" />}
                            {activeView === 'sale-purchase-reports' && <ManagementPlaceholder title="Sale-Purchase Reports" />}
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
};

export default StockManagerDashboard;
