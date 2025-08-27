import React, { useState, useEffect, useRef } from 'react';
import {
  FaChartBar,
  FaThLarge,
  FaChevronDown,
  FaShoppingCart,
  FaDollarSign,
  FaArrowRight,
  FaArrowLeft,
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
  activeView,
  handleOptionClick
}) => {
  const [showMasterDropdown, setShowMasterDropdown] = useState(false);
  const [showPurchaseDropdown, setShowPurchaseDropdown] = useState(false);
  const [showSalesDropdown, setShowSalesDropdown] = useState(false);

  const masterDropdownRef = useRef(null);
  const purchaseDropdownRef = useRef(null);
  const salesDropdownRef = useRef(null);
  const sidebarRef = useRef(null);

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

  const handleNavigationClick = (key) => {
    handleOptionClick(key);
    setIsSidebarCollapsed(true); // ✅ close sidebar after navigation
    window.scrollTo(0, 0); // Add this line to scroll to the top
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

      // ✅ keep sidebar closed if clicked outside
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsSidebarCollapsed(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setIsSidebarCollapsed]);

  const renderDropdown = (items) => (
    <div className="mt-1 space-y-1 bg-[#3a4e60] rounded-lg w-max z-50">
      {items.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          className="flex items-center w-full p-2 text-sm rounded-lg hover:bg-gray-700"
          onClick={() => handleNavigationClick(key)}
        >
          <Icon className="text-lg min-w-[1.5rem] mr-3" />
          <span className="truncate">{label}</span>
        </button>
      ))}
    </div>
  );

  const sections = [
    {
      title: 'Create Items',
      icon: FaThLarge,
      ref: masterDropdownRef,
      toggle: toggleMasterDropdown,
      show: showMasterDropdown,
      items: [
        { key: 'class', icon: FaGraduationCap, label: 'Class' },
        // { key: 'zone', icon: FaGlobeAsia, label: 'Zone' },
        { key: 'city', icon: FaCity, label: 'Zone Management' },
        { key: 'publication', icon: FaBook, label: 'Publication' },
        { key: 'language', icon: FaLanguage, label: 'Language' },
        { key: 'book-catalog', icon: FaBookOpen, label: 'Book Catalog' },
        { key: 'stationery-item', icon: FaPencilRuler, label: 'Stationery Item' },
        { key: 'customers', icon: FaUserFriends, label: 'Customers' },
        { key: 'transports', icon: FaTruck, label: 'Transports' },
        // { key: 'set-quantity', icon: FaLayerGroup, label: 'Set Quantity' }, // NEW: Added Set Quantity
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
    <>
      {/* Hamburger button */}
      <button
        className={`hamburger-menu-btn fixed left-4 z-50 p-2 transition-all duration-300 transform rounded-full bg-[#2c3e50] shadow-lg
          ${isSidebarCollapsed ? 'left-4' : 'left-[228px]'}`}
        style={{ top: '112px' }}
        onClick={() => setIsSidebarCollapsed(prev => !prev)}
      >
        {isSidebarCollapsed ? (
          <FaArrowRight className="text-xl" style={{ color: "#39c240" }} />
        ) : (
          <FaArrowLeft className="text-xl" style={{ color: "#39c240" }} />
        )}
      </button>

      {/* Sidebar */}
      <aside
  ref={sidebarRef}
  style={{
    position: 'fixed',
    bottom: 0,
    left: 0,
    zIndex: 10,
    top: '85px',
    '@media(maxWidth: 420px)': {
      top: '68px',
    },
  }}
  className={`bg-[#2c3e50] text-gray-200 transition-transform duration-300 ease-in-out
    ${isSidebarCollapsed ? '-translate-x-full' : 'translate-x-0 w-72'}
    overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-transparent`}
>
  <div className="flex items-center justify-between p-4 border-b border-gray-600">
    <div className="flex flex-col overflow-hidden whitespace-nowrap">
      <h3 className="text-xl font-semibold text-white">Stock Manager</h3>
      <p className="text-sm text-gray-400">Welcome, {userData.name || userData.email}!</p>
    </div>
  </div>

  <nav className="flex-grow p-4">
    <ul className="space-y-1">
      <li>
        <button
          className={`flex items-left w-full px-4 py-3 text-sm rounded-lg transition-colors duration-200
            ${activeView === 'dashboard' ? 'bg-[#34495e] text-white' : 'hover:bg-gray-700'}`}
          onClick={() => handleNavigationClick('dashboard')}
        >
          <FaChartBar className="text-lg min-w-[1.5rem] mr-3" />
          <span className="truncate">Home </span>
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
              <span className="truncate">{title}</span>
            </div>
            <FaChevronDown
              className={`transform transition-transform duration-200 ${show ? 'rotate-180' : ''}`}
            />
          </button>
          {show && renderDropdown(items)}
        </li>
      ))}
    </ul>
  </nav>
</aside>
    </>
  );
};

export default SidebarStockManagerDashboard;
