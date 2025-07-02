import React, { useState, useEffect, useRef } from 'react';
import '../styles/Sidebar.css';

import {
  FaChartBar,
  FaThLarge,
  FaChevronDown,
  FaShoppingCart,
  FaDollarSign,
  FaGraduationCap,
  FaGlobeAsia,
  FaCity,
  FaBook,
  FaBookOpen,
  FaPencilRuler,
  FaUserFriends,
  FaTruck,
  FaLayerGroup,
  FaHourglassHalf,
  FaLanguage, // ✅ Add this line
  FaClipboardList,
  FaFileInvoice,
  FaMoneyBillAlt,
  FaUndo,
  FaBook as FaBookLedger,
  FaChartLine,
  FaWarehouse,
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


const Sidebar = ({ activeView, onOptionClick, userData }) => {
    const [showMasterDropdown, setShowMasterDropdown] = useState(false);
    const [showPurchaseDropdown, setShowPurchaseDropdown] = useState(false);
    const [showSalesDropdown, setShowSalesDropdown] = useState(false);

    const masterDropdownRef = useRef(null);
    const purchaseDropdownRef = useRef(null);
    const salesDropdownRef = useRef(null);

    const toggleDropdown = (type) => {
        setShowMasterDropdown(type === 'master' ? !showMasterDropdown : false);
        setShowPurchaseDropdown(type === 'purchase' ? !showPurchaseDropdown : false);
        setShowSalesDropdown(type === 'sales' ? !showSalesDropdown : false);
    };

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
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
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
                            onClick={() => onOptionClick('dashboard')}
                        >
                            <FaChartBar className="nav-icon" /> Dashboard Summary
                        </button>
                    </li>

                    {/* Master Dropdown */}
                    <li className="relative-dropdown" ref={masterDropdownRef}>
                        <button
                            className={showMasterDropdown ? 'active' : ''}
                            onClick={() => toggleDropdown('master')}
                        >
                            <FaThLarge className="nav-icon" /> Masters
                            <FaChevronDown className={`dropdown-arrow ${showMasterDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        {showMasterDropdown && (
                            <div className="dropdown-menu">
                                <button onClick={() => onOptionClick('class')}><FaGraduationCap className="dropdown-icon" /> Class</button>
                                <button onClick={() => onOptionClick('zone')}><FaGlobeAsia className="dropdown-icon" /> Zone</button>
                                <button onClick={() => onOptionClick('city')}><FaCity className="dropdown-icon" /> City</button>
                                <button onClick={() => onOptionClick('publication')}><FaBook className="dropdown-icon" /> Publication</button>
                                <button onClick={() => onOptionClick('language')}><FaLanguage className="dropdown-icon" /> Language</button>
                                <button onClick={() => onOptionClick('book-catalog')}><FaBookOpen className="dropdown-icon" /> Book Catalog</button>
                                <button onClick={() => onOptionClick('stationery-item')}><FaPencilRuler className="dropdown-icon" /> Stationery Item</button>
                                <button onClick={() => onOptionClick('customers')}><FaUserFriends className="dropdown-icon" /> Customers</button>
                                <button onClick={() => onOptionClick('transports')}><FaTruck className="dropdown-icon" /> Transports</button>
                                <button onClick={() => onOptionClick('create-sets')}><FaLayerGroup className="dropdown-icon" /> Create Sets</button>
                                <button onClick={() => onOptionClick('pending-book')}><FaHourglassHalf className="dropdown-icon" /> Pending Book</button>
                            </div>
                        )}
                    </li>

                    {/* Purchase Dropdown */}
                    <li className="relative-dropdown" ref={purchaseDropdownRef}>
                        <button
                            className={showPurchaseDropdown ? 'active' : ''}
                            onClick={() => toggleDropdown('purchase')}
                        >
                            <FaShoppingCart className="nav-icon" /> Purchase
                            <FaChevronDown className={`dropdown-arrow ${showPurchaseDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        {showPurchaseDropdown && (
                            <div className="dropdown-menu">
                                <button onClick={() => onOptionClick('purchase-order')}><FaClipboardList className="dropdown-icon" /> Purchase Order</button>
                                <button onClick={() => onOptionClick('purchase-invoice')}><FaFileInvoice className="dropdown-icon" /> Purchase Invoice</button>
                                <button onClick={() => onOptionClick('payment-voucher')}><FaMoneyBillAlt className="dropdown-icon" /> Payment Voucher</button>
                                <button onClick={() => onOptionClick('purchase-return-debit-note')}><FaUndo className="dropdown-icon" /> Purchase Return</button>
                                <button onClick={() => onOptionClick('purchase-ledgers')}><FaBookLedger className="dropdown-icon" /> Purchase Ledgers</button>
                                <button onClick={() => onOptionClick('purchase-reports')}><FaChartLine className="dropdown-icon" /> Purchase Reports</button>
                                <button onClick={() => onOptionClick('stock-balance')}><FaWarehouse className="dropdown-icon" /> Stock Balance</button>
                            </div>
                        )}
                    </li>

                    {/* Sales Dropdown */}
                    <li className="relative-dropdown" ref={salesDropdownRef}>
                        <button
                            className={showSalesDropdown ? 'active' : ''}
                            onClick={() => toggleDropdown('sales')}
                        >
                            <FaDollarSign className="nav-icon" /> Sales
                            <FaChevronDown className={`dropdown-arrow ${showSalesDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        {showSalesDropdown && (
                            <div className="dropdown-menu">
                                <button onClick={() => onOptionClick('sale-bill')}><FaReceipt className="dropdown-icon" /> Sale Bill</button>
                                <button onClick={() => onOptionClick('manual-pending-sale')}><FaHourglass className="dropdown-icon" /> Manual Pending Sale</button>
                                <button onClick={() => onOptionClick('pending-books')}><FaBookDead className="dropdown-icon" /> Pending Books</button>
                                <button onClick={() => onOptionClick('pending-books-ledger')}><FaFileContract className="dropdown-icon" /> Pending Books Ledger</button>
                                <button onClick={() => onOptionClick('receipt-voucher')}><FaMoneyCheckAlt className="dropdown-icon" /> Receipt Voucher</button>
                                <button onClick={() => onOptionClick('advance-deposit')}><FaWallet className="dropdown-icon" /> Advance Deposit</button>
                                <button onClick={() => onOptionClick('sale-return-credit-note')}><FaExchangeAlt className="dropdown-icon" /> Sale Return</button>
                                <button onClick={() => onOptionClick('sale-ledgers')}><FaChartBarLedger className="dropdown-icon" /> Sale Ledgers</button>
                                <button onClick={() => onOptionClick('books-not-sold')}><FaBan className="dropdown-icon" /> Books Not Sold</button>
                                <button onClick={() => onOptionClick('sale-reports')}><FaChartPie className="dropdown-icon" /> Sale Reports</button>
                                <button onClick={() => onOptionClick('books-sale-reports')}><FaChartArea className="dropdown-icon" /> Books Sale Reports</button>
                                <button onClick={() => onOptionClick('sale-purchase-reports')}><FaChartBar className="dropdown-icon" /> Sale-Purchase Reports</button>
                            </div>
                        )}
                    </li>
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;
