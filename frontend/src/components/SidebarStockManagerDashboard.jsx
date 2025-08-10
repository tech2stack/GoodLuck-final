import React, { useState, useEffect, useRef } from 'react';
import {
    FaChartBar,
    FaThLarge,
    FaChevronDown,
    FaShoppingCart,
    FaDollarSign,
    FaBars,
    FaTimes,
    FaGraduationCap,
    FaGlobeAsia,
    FaCity,
    FaBook,
    FaBookOpen,
    FaPencilRuler,
    FaUserFriends,
    FaTruck,
    FaLayerGroup,
    FaLanguage,
    FaHourglassHalf,
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

const SidebarStockManagerDashboard = ({
    userData,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isMobile,
    activeView,
    handleOptionClick
}) => {
    const [showMasterDropdown, setShowMasterDropdown] = useState(false);
    const [showPurchaseDropdown, setShowPurchaseDropdown] = useState(false);
    const [showSalesDropdown, setShowSalesDropdown] = useState(false);

    const masterDropdownRef = useRef(null);
    const purchaseDropdownRef = useRef(null);
    const salesDropdownRef = useRef(null);

    const toggleMasterDropdown = () => {
        setShowMasterDropdown(prev => !prev);
        setShowPurchaseDropdown(false);
        setShowSalesDropdown(false);
    };

    const togglePurchaseDropdown = () => {
        setShowPurchaseDropdown(prev => !prev);
        setShowMasterDropdown(false);
        setShowSalesDropdown(false);
    };

    const toggleSalesDropdown = () => {
        setShowSalesDropdown(prev => !prev);
        setShowMasterDropdown(false);
        setShowPurchaseDropdown(false);
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
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const renderDropdown = (items) => (
        <div className="mt-1 space-y-1 bg-[#3a4e60] rounded-lg w-max  z-50">
            {items.map(({ key, icon: Icon, label }) => (
                <button
                    key={key}
                    className="flex items-center w-full p-2 text-sm rounded-lg hover:bg-gray-700"
                    onClick={() => handleOptionClick(key)}
                >
                    <Icon className="text-lg min-w-[1.5rem] mr-3" />
                    <span className="truncate">{label}</span>
                </button>
            ))}
        </div>
    );

    const sections = [
        {
            title: 'Masters',
            icon: FaThLarge,
            ref: masterDropdownRef,
            toggle: toggleMasterDropdown,
            show: showMasterDropdown,
            items: [
                { key: 'class', icon: FaGraduationCap, label: 'Class' },
                { key: 'zone', icon: FaGlobeAsia, label: 'Zone' },
                { key: 'city', icon: FaCity, label: 'City' },
                { key: 'publication', icon: FaBook, label: 'Publication' },
                { key: 'language', icon: FaLanguage, label: 'Language' },
                { key: 'book-catalog', icon: FaBookOpen, label: 'Book Catalog' },
                { key: 'stationery-item', icon: FaPencilRuler, label: 'Stationery Item' },
                { key: 'customers', icon: FaUserFriends, label: 'Customers' },
                { key: 'transports', icon: FaTruck, label: 'Transports' },
                { key: 'create-sets', icon: FaLayerGroup, label: 'Create Sets' },
                { key: 'pending-book', icon: FaHourglassHalf, label: 'Pending Book' },
            ]
        },
        {
            title: 'Purchase',
            icon: FaShoppingCart,
            ref: purchaseDropdownRef,
            toggle: togglePurchaseDropdown,
            show: showPurchaseDropdown,
            items: [
                { key: 'purchase-order', icon: FaClipboardList, label: 'Purchase Order' },
                { key: 'purchase-invoice', icon: FaFileInvoice, label: 'Purchase Invoice' },
                { key: 'payment-voucher', icon: FaMoneyBillAlt, label: 'Payment Voucher' },
                { key: 'purchase-return-debit-note', icon: FaUndo, label: 'Purchase Return (Debit Note)' },
                { key: 'purchase-ledgers', icon: FaBookLedger, label: 'Purchase Ledgers' },
                { key: 'purchase-reports', icon: FaChartLine, label: 'Purchase Reports' },
                { key: 'stock-balance', icon: FaWarehouse, label: 'Stock Balance' },
            ]
        },
        {
            title: 'Sales',
            icon: FaDollarSign,
            ref: salesDropdownRef,
            toggle: toggleSalesDropdown,
            show: showSalesDropdown,
            items: [
                { key: 'sale-bill', icon: FaReceipt, label: 'Sale Bill' },
                { key: 'manual-pending-sale', icon: FaHourglass, label: 'Manual Pending Sale' },
                { key: 'pending-books', icon: FaBookDead, label: 'Pending Books' },
                { key: 'pending-books-ledger', icon: FaFileContract, label: 'Pending Books Ledger' },
                { key: 'receipt-voucher', icon: FaMoneyCheckAlt, label: 'Receipt Voucher' },
                { key: 'advance-deposit', icon: FaWallet, label: 'Advance Deposit' },
                { key: 'sale-return-credit-note', icon: FaExchangeAlt, label: 'Sale Return (Credit Note)' },
                { key: 'sale-ledgers', icon: FaChartBarLedger, label: 'Sale Ledgers' },
                { key: 'books-not-sold', icon: FaBan, label: 'Books Not Sold' },
                { key: 'sale-reports', icon: FaChartPie, label: 'Sale Reports' },
                { key: 'books-sale-reports', icon: FaChartArea, label: 'Books Sale Reports' },
                { key: 'sale-purchase-reports', icon: FaChartBar, label: 'Sale-Purchase Reports' },
            ]
        }
    ];

    return (
        <aside
  className={`sticky top-[60px] left-0 bg-[#2c3e50] text-gray-200 transition-all duration-300 ease-in-out z-30
    ${isSidebarCollapsed ? 'w-50' : 'w-64'}
    ${isMobile ? 'mobile-sidebar' : ''}
    overflow-y-auto overflow-x-scroll scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-transparent`}
  style={{ maxHeight: 'calc(100vh - 60px)' }}
>
  <div className="flex items-center justify-between p-4 border-b border-gray-600">
    {!isSidebarCollapsed && !isMobile && (
      <div className="flex flex-col overflow-hidden whitespace-nowrap">
        <h3 className="text-xl font-semibold text-white">Stock Manager</h3>
        <p className="text-sm text-gray-400">Welcome, {userData.name || userData.email}!</p>
      </div>
    )}
    <button
      className="p-2 text-white transition-colors duration-200 hover:text-gray-400 focus:outline-none"
      onClick={() => setIsSidebarCollapsed(prev => !prev)}
    >
      {isSidebarCollapsed ? <FaBars className="text-xl" /> : <FaTimes className="text-xl" />}
    </button>
  </div>

  <nav className="flex-grow p-4">
    <ul className="space-y-1">
      <li>
        <button
          className={`flex items-left w-full px-4 py-3 text-sm rounded-lg transition-colors duration-200
            ${activeView === 'dashboard' ? 'bg-[#34495e] text-white' : 'hover:bg-gray-700'}`}
          onClick={() => handleOptionClick('dashboard')}
        >
          <FaChartBar className="text-lg min-w-[1.5rem] mr-3" />
          {!isSidebarCollapsed && !isMobile && <span className="truncate">Dashboard Summary</span>}
        </button>
      </li>

      {sections.map(({ title, icon: Icon, ref, toggle, show, items }) => (
        <li key={title} className="relative" ref={ref}>
          <button
            className={`flex items-flex-start justify-between w-full px-4 py-3 text-sm rounded-lg transition-colors duration-200
              ${show ? 'bg-[#34495e] text-white' : 'hover:bg-gray-700'}`}
            onClick={toggle}
          >
            <div className="flex items-center">
              <Icon className="text-lg min-w-[1.5rem] mr-3" />
              {!isSidebarCollapsed && !isMobile && <span className="truncate">{title}</span>}
            </div>
            {!isSidebarCollapsed && !isMobile && (
              <FaChevronDown
                className={`transform transition-transform duration-200 ${show ? 'rotate-180' : ''}`}
              />
            )}
          </button>
          {show && renderDropdown(items)}
        </li>
      ))}
    </ul>
  </nav>
</aside>

    );
   



};

export default SidebarStockManagerDashboard;
