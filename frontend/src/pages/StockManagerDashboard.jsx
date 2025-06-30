// src/pages/StockManagerDashboard.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
// Removed: import api from '../utils/api'; // This import was unused in this file

// UI Components and Utilities
import FlashMessage from '../components/FlashMessage';
import StockManagerDashboardSummary from '../components/dashboard/StockManagerDashboardSummary';
import ClassManagement from '../components/masters/ClassManagement'; // Import ClassManagement component
import ZoneManagement from '../components/masters/ZoneManagement'; // Import ZoneManagement component
import CityManagement from '../components/masters/CityManagement'; // Import CityManagement component
import PublicationManagement from '../components/masters/PublicationManagement'; // Import PublicationManagement component
import LanguageManagement from '../components/masters/LanguageManagement'; // NEW: Import LanguageManagement component

// Icons for navigation and UI (Make sure you have react-icons installed: npm install react-icons)
import {
    FaChartBar,        // For Dashboard Summary
    FaThLarge,         // For Master Options
    FaChevronDown,     // For dropdown arrow
    FaShoppingCart,    // NEW: For Purchase
    FaDollarSign,      // NEW: For Sales

    // Master Option Icons:
    FaGraduationCap,   // For Class
    FaGlobeAsia,       // For Zone (reused for Master option)
    FaCity,            // For City (reused for Master option)
    FaBook,            // For Publication
    FaBookOpen,        // For Book Catalog
    FaPencilRuler,     // For Stationery Item
    FaUserFriends,     // For Customers
    FaTruck,           // For Transports
    FaLayerGroup,      // For Create Sets
    FaLanguage,        // For Language (First use of FaLanguage)
    FaHourglassHalf,   // For Pending Book

    // NEW: Purchase Option Icons:
    FaClipboardList,   // Purchase Order
    FaFileInvoice,     // Purchase Invoice
    FaMoneyBillAlt,    // Payment Voucher
    FaUndo,            // Purchase Return (Debit Note)
    FaBook as FaBookLedger, // ALIASED: FaBook for Purchase Ledgers
    FaChartLine,       // Purchase Reports
    FaWarehouse,       // Stock Balance

    // NEW: Sales Option Icons:
    FaReceipt,         // Sale Bill
    FaHourglass,       // Manual Pending Sale (reusing FaHourglass)
    FaBookDead,        // Pending Books (using a different book icon)
    FaFileContract,    // Pending Books Ledger
    FaMoneyCheckAlt,   // Receipt Voucher
    FaWallet,          // Advance Deposit (using FaWallet)
    FaExchangeAlt,     // Sale Return (Credit Note)
    FaChartBar as FaChartBarLedger, // ALIASED: FaChartBar for Sale Ledgers
    FaBan,             // Books Not Sold (using FaBan for 'not sold')
    FaChartPie,        // Sale Reports
    FaChartArea        // Books Sale Reports (using FaChartArea)

} from 'react-icons/fa';


// Stylesheets
import '../styles/Dashboard.css';
import '../styles/StockManagerDashboard.css';


const StockManagerDashboard = () => {
    const { userData, isLoggedIn, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [activeView, setActiveView] = useState('dashboard');
    const [flashMessage, setFlashMessage] = useState(null); // State to hold the flash message

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
        console.log(`FlashMessage: ${message} (Type: ${type})`); // Debugging: Log when a flash message is set
        setFlashMessage({ message, type });
        // Clear message after 5 seconds
        setTimeout(() => setFlashMessage(null), 5000);
    }, []);

    // Function to toggle Master dropdown visibility
    const toggleMasterDropdown = () => {
        setShowMasterDropdown(prev => !prev);
        setShowPurchaseDropdown(false); // Close other dropdowns
        setShowSalesDropdown(false);    // Close other dropdowns
    };

    // Function to toggle Purchase dropdown visibility
    const togglePurchaseDropdown = () => {
        setShowPurchaseDropdown(prev => !prev);
        setShowMasterDropdown(false); // Close other dropdowns
        setShowSalesDropdown(false);    // Close other dropdowns
    };

    // Function to toggle Sales dropdown visibility
    const toggleSalesDropdown = () => {
        setShowSalesDropdown(prev => !prev);
        setShowMasterDropdown(false); // Close other dropdowns
        setShowPurchaseDropdown(false); // Close other dropdowns
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

    // Handler for when a Master/Purchase/Sales dropdown option is clicked.
    const handleOptionClick = useCallback((option) => { // Renamed from handleMasterOptionClick
        setActiveView(option);
        // Close all dropdowns after an option is clicked
        setShowMasterDropdown(false);
        setShowPurchaseDropdown(false);
        setShowSalesDropdown(false);
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
        <div className="dashboard-container">
            {/* Sidebar Navigation */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h3>Stock Manager</h3>
                    <p>{userData.name || userData.email}</p>
                </div>
                <nav className="sidebar-nav">
                    <ul>
                        <li>
                            <button
                                className={activeView === 'dashboard' ? 'active' : ''}
                                onClick={() => {
                                    handleOptionClick('dashboard'); // Use general handler
                                }}
                            >
                                <FaChartBar className="nav-icon" /> Dashboard Summary
                            </button>
                        </li>

                        {/* Master Options Dropdown */}
                        <li className="relative-dropdown" ref={masterDropdownRef}>
                            <button
                                className={`${showMasterDropdown ? 'active' : ''}`}
                                onClick={toggleMasterDropdown}
                            >
                                <FaThLarge className="nav-icon" /> Masters
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
                                        <FaLanguage className="dropdown-icon" /> Language {/* NEW: Language button */}
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
                                <FaShoppingCart className="nav-icon" /> Purchase
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
                                <FaDollarSign className="nav-icon" /> Sales
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
            <main className="dashboard-main-content">
                <header className="dashboard-header">
                    <h1>Stock Management Dashboard</h1>
                </header>

                {/* Flash Message Display */}
                {flashMessage && (
                    <FlashMessage message={flashMessage.message} type={flashMessage.type} />
                )}

                {/* Conditional Rendering of Views */}
                <div className="dashboard-content-area">
                    {activeView === 'dashboard' && (
                        <StockManagerDashboardSummary showFlashMessage={showFlashMessage} />
                    )}

                    {activeView === 'class' && (
                        <ClassManagement showFlashMessage={showFlashMessage} />
                    )}

                    {activeView === 'zone' && (
                        <ZoneManagement showFlashMessage={showFlashMessage} />
                    )}

                    {activeView === 'city' && (
                        <CityManagement showFlashMessage={showFlashMessage} />
                    )}

                    {activeView === 'publication' && (
                        <PublicationManagement showFlashMessage={showFlashMessage} />
                    )}

                    {activeView === 'language' && ( // NEW: Render LanguageManagement component
                        <LanguageManagement showFlashMessage={showFlashMessage} />
                    )}

                    {/* Placeholders for other Master Options */}
                    {activeView === 'book-catalog' && <div className="content-placeholder card"><h3>Book Catalog Management (Coming Soon)</h3><p>Details related to Book Catalogs will be displayed and managed here.</p></div>}
                    {activeView === 'stationery-item' && <div className="content-placeholder card"><h3>Stationery Item Management (Coming Soon)</h3><p>Details related to Stationery Items will be displayed and managed here.</p></div>}
                    {activeView === 'customers' && <div className="content-placeholder card"><h3>Customer Management (Coming Soon)</h3><p>Details related to Customers will be displayed and managed here.</p></div>}
                    {activeView === 'transports' && <div className="content-placeholder card"><h3>Transport Management (Coming Soon)</h3><p>Details related to Transports will be displayed and managed here.</p></div>}
                    {activeView === 'create-sets' && <div className="content-placeholder card"><h3>Create Sets (Coming Soon)</h3><p>Details related to creating sets will be displayed and managed here.</p></div>}
                    {activeView === 'pending-book' && <div className="content-placeholder card"><h3>Pending Book Management (Coming Soon)</h3><p>Details related to Pending Books will be displayed and managed here.</p></div>}

                    {/* Placeholders for Purchase Options */}
                    {activeView === 'purchase-order' && <div className="content-placeholder card"><h3>Purchase Order (Coming Soon)</h3><p>Manage purchase orders here.</p></div>}
                    {activeView === 'purchase-invoice' && <div className="content-placeholder card"><h3>Purchase Invoice (Coming Soon)</h3><p>Manage purchase invoices here.</p></div>}
                    {activeView === 'payment-voucher' && <div className="content-placeholder card"><h3>Payment Voucher (Coming Soon)</h3><p>Manage payment vouchers here.</p></div>}
                    {activeView === 'purchase-return-debit-note' && <div className="content-placeholder card"><h3>Purchase Return (Debit Note) (Coming Soon)</h3><p>Manage purchase returns and debit notes here.</p></div>}
                    {activeView === 'purchase-ledgers' && <div className="content-placeholder card"><h3>Purchase Ledgers (Coming Soon)</h3><p>View purchase ledgers here.</p></div>}
                    {activeView === 'purchase-reports' && <div className="content-placeholder card"><h3>Purchase Reports (Coming Soon)</h3><p>Access purchase reports here.</p></div>}
                    {activeView === 'stock-balance' && <div className="content-placeholder card"><h3>Stock Balance (Coming Soon)</h3><p>View current stock balance here.</p></div>}

                    {/* Placeholders for Sales Options */}
                    {activeView === 'sale-bill' && <div className="content-placeholder card"><h3>Sale Bill (Coming Soon)</h3><p>Create and manage sale bills here.</p></div>}
                    {activeView === 'manual-pending-sale' && <div className="content-placeholder card"><h3>Manual Pending Sale (Coming Soon)</h3><p>Manage manually pending sales here.</p></div>}
                    {activeView === 'pending-books' && <div className="content-placeholder card"><h3>Pending Books (Coming Soon)</h3><p>View pending book orders here.</p></div>}
                    {activeView === 'pending-books-ledger' && <div className="content-placeholder card"><h3>Pending Books Ledger (Coming Soon)</h3><p>View pending books ledger here.</p></div>}
                    {activeView === 'receipt-voucher' && <div className="content-placeholder card"><h3>Receipt Voucher (Coming Soon)</h3><p>Manage receipt vouchers here.</p></div>}
                    {activeView === 'advance-deposit' && <div className="content-placeholder card"><h3>Advance Deposit (Coming Soon)</h3><p>Manage customer advance deposits here.</p></div>}
                    {activeView === 'sale-return-credit-note' && <div className="content-placeholder card"><h3>Sale Return (Credit Note) (Coming Soon)</h3><p>Manage sale returns and credit notes here.</p></div>}
                    {activeView === 'sale-ledgers' && <div className="content-placeholder card"><h3>Sale Ledgers (Coming Soon)</h3><p>View sale ledgers here.</p></div>}
                    {activeView === 'books-not-sold' && <div className="content-placeholder card"><h3>Books Not Sold (Coming Soon)</h3><p>View reports on books not sold here.</p></div>}
                    {activeView === 'sale-reports' && <div className="content-placeholder card"><h3>Sale Reports (Coming Soon)</h3><p>Access various sales reports here.</p></div>}
                    {activeView === 'books-sale-reports' && <div className="content-placeholder card"><h3>Books Sale Reports (Coming Soon)</h3><p>Access book-specific sales reports here.</p></div>}
                    {activeView === 'sale-purchase-reports' && <div className="content-placeholder card"><h3>Sale-Purchase Reports (Coming Soon)</h3><p>Access combined sale and purchase reports here.</p></div>}
                </div>
            </main>
        </div>
    );
};

export default StockManagerDashboard;
