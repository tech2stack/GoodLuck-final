// src/components/masters/StationeryItemManagement.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '../../utils/api';
import {
  FaEdit,
  FaTrashAlt,
  FaPlusCircle,
  FaSearch,
  FaFilePdf,
  FaChevronLeft,
  FaChevronRight,
  FaSpinner,
  FaTimesCircle,
  FaList,
} from 'react-icons/fa';

import '../../styles/Form.css';
import '../../styles/Table.css';
import '../../styles/Modal.css';
// import '../../styles/StationeryItemManagement.css';

import companyLogo from '../../assets/glbs-logo.jpg';
import { addHeaderAndSetStartY, addReportTitle, addTableToDoc } from '../../utils/pdfTheme';

const StationeryItemManagement = ({ showFlashMessage }) => {
  // main refs
  const tableBodyRef = useRef(null);
  const topRef = useRef(null); // <-- new ref to scroll to the top/title

  // data states
  const [stationeryItems, setStationeryItems] = useState([]);
  const [formData, setFormData] = useState({
    itemName: '',
    price: '',
    marginPercentage: '',
    customerDiscountPercentage: '',
    companyDiscountPercentage: '',
    status: 'active',
  });
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);

  // highlight for newly added item
  const [highlightedId, setHighlightedId] = useState(null);

  // confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState(null);
  const [itemToDeleteName, setItemToDeleteName] = useState('');

  // filters / search / pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // categories list (as before)
  const categories = ['Notebooks', 'Covers', 'Plastic Items', 'Bags', 'School kit', 'Other Stationery'];

  // helper: format date
  const formatDateWithTime = (dateString) => {
    if (!dateString) return 'N/A';
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-US', options);
  };

  // fetch items
  const fetchStationeryItems = useCallback(async () => {
    setLoading(true);
    setLocalError(null);
    try {
      const response = await api.get('/stationery-items', { params: { _: Date.now() } });
      if (response.data.status === 'success') {
        const sorted = (response.data.data.stationeryItems || []).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setStationeryItems(sorted);

        const totalPagesCalculated = Math.ceil(sorted.length / itemsPerPage);
        if (currentPage > totalPagesCalculated && totalPagesCalculated > 0) {
          setCurrentPage(totalPagesCalculated);
        } else if (sorted.length === 0) {
          setCurrentPage(1);
        }
      } else {
        const msg = response.data.message || 'Failed to fetch stationery items.';
        setLocalError(msg);
        showFlashMessage(msg, 'error');
      }
    } catch (err) {
      console.error('Error fetching stationery items:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load stationery items due to network error.';
      setLocalError(errorMessage);
      showFlashMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, showFlashMessage]);

  useEffect(() => {
    fetchStationeryItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auto-calc margin (100 - (customer + company))
  useEffect(() => {
    const { customerDiscountPercentage, companyDiscountPercentage } = formData;
    const totalDiscount = (parseFloat(customerDiscountPercentage) || 0) + (parseFloat(companyDiscountPercentage) || 0);
    const newMargin = 100 - totalDiscount;
    if (!isNaN(newMargin) && newMargin >= 0 && newMargin <= 100) {
      setFormData((prev) => ({ ...prev, marginPercentage: newMargin }));
    } else {
      setFormData((prev) => ({ ...prev, marginPercentage: '' }));
    }
  }, [formData.customerDiscountPercentage, formData.companyDiscountPercentage]);

  // handle form change
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      const numericValue = parseFloat(value);
      setFormData((prev) => ({ ...prev, [name]: isNaN(numericValue) ? '' : numericValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // submit (create / update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLocalError(null);

    // validation
    if (
      !formData.itemName.trim() ||
      formData.price === '' ||
      formData.price === null ||
      isNaN(formData.price) ||
      formData.marginPercentage === '' ||
      formData.marginPercentage === null ||
      isNaN(formData.marginPercentage) ||
      formData.customerDiscountPercentage === '' ||
      formData.customerDiscountPercentage === null ||
      isNaN(formData.customerDiscountPercentage) ||
      formData.companyDiscountPercentage === '' ||
      formData.companyDiscountPercentage === null ||
      isNaN(formData.companyDiscountPercentage)
    ) {
      setLocalError(
        'Please fill in all required fields (Item Name, Price, Margin %, Customer Discount %, Company Discount %).'
      );
      showFlashMessage('Please fill in all required fields.', 'error');
      setLoading(false);
      return;
    }

    if (!selectedCategory) {
      setLocalError('Please select a category from the dropdown above the table.');
      showFlashMessage('Please select a category first.', 'error');
      setLoading(false);
      return;
    }

    if (formData.price < 0) {
      setLocalError('Price cannot be negative.');
      showFlashMessage('Price cannot be negative.', 'error');
      setLoading(false);
      return;
    }

    if (formData.marginPercentage < 0 || formData.marginPercentage > 100) {
      setLocalError('Margin % must be between 0 and 100.');
      showFlashMessage('Margin % must be between 0 and 100.', 'error');
      setLoading(false);
      return;
    }

    if (formData.customerDiscountPercentage < 0 || formData.companyDiscountPercentage < 0) {
      setLocalError('Discount percentages cannot be negative.');
      showFlashMessage('Discount percentages cannot be negative.', 'error');
      setLoading(false);
      return;
    }

    try {
      let response;
      const dataToSend = {
        itemName: formData.itemName,
        category: selectedCategory,
        price: parseFloat(formData.price),
        marginPercentage: parseFloat(formData.marginPercentage),
        customerDiscountPercentage: parseFloat(formData.customerDiscountPercentage),
        companyDiscountPercentage: parseFloat(formData.companyDiscountPercentage),
        status: formData.status,
      };

      if (editingItemId) {
        response = await api.patch(`/stationery-items/${editingItemId}`, dataToSend);
        if (response.data.status === 'success') {
          showFlashMessage('Stationery Item updated successfully!', 'success');
          // highlight updated item
          const updatedId = response.data.data?.stationeryItem?._id || editingItemId;
          setHighlightedId(updatedId);
          setTimeout(() => setHighlightedId(null), 4000);
          // refresh
          await fetchStationeryItems();
          // scroll to top
          if (topRef.current) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          throw new Error(response.data.message || 'Failed to update stationery item.');
        }
      } else {
        response = await api.post('/stationery-items', dataToSend);
        if (response.data.status === 'success') {
          showFlashMessage('Stationery Item created successfully!', 'success');

          // try to get created item id (API may return created object)
          const createdId = response.data.data?.stationeryItem?._id || response.data.data?._id;
          if (createdId) {
            // optimistic highlight (after refresh we'll still have it)
            setHighlightedId(createdId);
            setTimeout(() => setHighlightedId(null), 4000);
          }

          // clear filters & page
          setSearchTerm('');
          setCategoryFilter('');
          setCurrentPage(1);

          // refresh list
          await fetchStationeryItems();

          // scroll to top/title
          if (topRef.current) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          throw new Error(response.data.message || 'Failed to create stationery item.');
        }
      }

      // reset form
      setFormData({
        itemName: '',
        price: '',
        marginPercentage: '',
        customerDiscountPercentage: '',
        companyDiscountPercentage: '',
        status: 'active',
      });
      setSelectedCategory('');
      setEditingItemId(null);
    } catch (err) {
      console.error('Error saving stationery item:', err);
      const errorMessage = err.response?.data?.message || 'Failed to save stationery item.';
      setLocalError(errorMessage);
      showFlashMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // edit
  const handleEdit = (item) => {
    setFormData({
      itemName: item.itemName || '',
      price: item.price || '',
      marginPercentage: item.marginPercentage || '',
      customerDiscountPercentage: item.customerDiscountPercentage || '',
      companyDiscountPercentage: item.companyDiscountPercentage || '',
      status: item.status || 'active',
    });
    setSelectedCategory(item.category || '');
    setEditingItemId(item._id);
    setLocalError(null);
    if (topRef.current) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // delete
  const openConfirmModal = (item) => {
    setItemToDeleteId(item._id);
    setItemToDeleteName(item.itemName || '');
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setItemToDeleteId(null);
    setItemToDeleteName('');
  };

  const confirmDelete = async () => {
    setLoading(true);
    setLocalError(null);
    closeConfirmModal();
    try {
      const response = await api.delete(`/stationery-items/${itemToDeleteId}`);
      if (response.status === 204 || response.data?.status === 'success') {
        showFlashMessage('Stationery Item deleted successfully!', 'success');
        await fetchStationeryItems();
      } else {
        throw new Error(response.data?.message || 'Failed to delete stationery item.');
      }
    } catch (err) {
      console.error('Error deleting stationery item:', err);
      const errorMessage = err.response?.data?.message || 'Failed to delete stationery item.';
      setLocalError(errorMessage);
      showFlashMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      itemName: '',
      price: '',
      marginPercentage: '',
      customerDiscountPercentage: '',
      companyDiscountPercentage: '',
      status: 'active',
    });
    setSelectedCategory('');
    setEditingItemId(null);
    setLocalError(null);
  };

  // filtering / searching
  const filteredItems = useMemo(() => {
    const lowercasedSearchTerm = (searchTerm || '').toString().toLowerCase();
    return stationeryItems.filter((item) => {
      const itemName = (item.itemName || '').toString().toLowerCase();
      const category = (item.category || '').toString().toLowerCase();
      const price = item.price !== undefined && item.price !== null ? String(item.price).toLowerCase() : '';
      const marginPercentage = item.marginPercentage !== undefined && item.marginPercentage !== null ? String(item.marginPercentage).toLowerCase() : '';
      const customerDiscountPercentage = item.customerDiscountPercentage !== undefined && item.customerDiscountPercentage !== null ? String(item.customerDiscountPercentage).toLowerCase() : '';
      const companyDiscountPercentage = item.companyDiscountPercentage !== undefined && item.companyDiscountPercentage !== null ? String(item.companyDiscountPercentage).toLowerCase() : '';
      const status = (item.status || '').toString().toLowerCase();

      const matchesSearchTerm =
        itemName.includes(lowercasedSearchTerm) ||
        category.includes(lowercasedSearchTerm) ||
        price.includes(lowercasedSearchTerm) ||
        marginPercentage.includes(lowercasedSearchTerm) ||
        customerDiscountPercentage.includes(lowercasedSearchTerm) ||
        companyDiscountPercentage.includes(lowercasedSearchTerm) ||
        status.includes(lowercasedSearchTerm);

      const matchesCategory = categoryFilter ? category === (categoryFilter || '').toLowerCase() : true;

      return matchesSearchTerm && matchesCategory;
    });
  }, [stationeryItems, searchTerm, categoryFilter]);

  // pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };
  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  // PDF download (same as before)
  const downloadPdf = () => {
    if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF !== 'function') {
      showFlashMessage('PDF generation libraries not fully loaded or accessible. Check console for details.', 'error');
      console.error("PDF generation failed: window.jspdf or window.jspdf.jsPDF is not available/callable.");
      return;
    }

    const doc = new window.jspdf.jsPDF('portrait');
    let startY = addHeaderAndSetStartY(doc, companyLogo, 25, 22);
    startY = addReportTitle(doc, startY, "Stationery Item List Report");

    const tableColumn = ["S.No.", "Item Name", "Category", "Price (Rs.)", "Margin %"];
    const tableRows = filteredItems.map((item, index) => [
      index + 1,
      item.itemName || 'N/A',
      item.category || 'N/A',
      (typeof item.price === 'number' && !isNaN(item.price)) ? `Rs ${item.price}` : 'N/A',
      (typeof item.marginPercentage === 'number' && !isNaN(item.marginPercentage)) ? `${item.marginPercentage}%` : 'N/A',
    ]);

    addTableToDoc(doc, tableColumn, tableRows, startY);
    doc.save(`Stationary_List_${new Date().toLocaleDateString('en-CA').replace(/\//g, '-')}.pdf`);
    showFlashMessage('Stationary list downloaded as PDF!', 'success');
  };

  // ---------- Render ----------
  return (
    <div className="stationery-item-management-container">
      <div ref={topRef} />
      <h2 className="main-section-title">Stationery Item Management</h2>

      {localError && (
        <p className="error-message text-center">
          <FaTimesCircle className="error-icon" /> {localError}
        </p>
      )}

      <div className="main-content-layout">
        <div className="form-container-card">
          <form onSubmit={handleSubmit} className="app-form">
            <h3 className="form-title">{editingItemId ? 'Edit Stationery Item' : 'Add New Stationery Item'}</h3>

            <div className="form-group">
              <label htmlFor="category-filter">Category:</label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="category-select-styled"
                disabled={loading}
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="itemName">Item's Name:</label>
              <input
                type="text"
                id="itemName"
                name="itemName"
                value={formData.itemName}
                onChange={handleChange}
                placeholder="e.g., Pencil, Notebook, School Bag"
                required
                disabled={loading}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="price">MRP Price:</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="e.g., 10.00, 500.00"
                min="0"
                required
                disabled={loading}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="customerDiscountPercentage">Customer Discount (%):</label>
              <input
                type="number"
                id="customerDiscountPercentage"
                name="customerDiscountPercentage"
                value={formData.customerDiscountPercentage}
                onChange={handleChange}
                placeholder="e.g., 20"
                min="0"
                required
                disabled={loading}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="companyDiscountPercentage">Company Discount (%):</label>
              <input
                type="number"
                id="companyDiscountPercentage"
                name="companyDiscountPercentage"
                value={formData.companyDiscountPercentage}
                onChange={handleChange}
                placeholder="e.g., 10"
                min="0"
                required
                disabled={loading}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="marginPercentage">Profit Margin (%):</label>
              <input
                type="number"
                id="marginPercentage"
                name="marginPercentage"
                value={formData.marginPercentage}
                placeholder="e.g., 70"
                min="0"
                max="100"
                required
                disabled={true}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">Status:</label>
              <select id="status" name="status" value={formData.status} onChange={handleChange} disabled={loading} className="form-select">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading || !selectedCategory}>
                {loading ? <FaSpinner className="btn-icon-mr animate-spin" /> : (editingItemId ? 'Update Item' : 'Add Item')}
              </button>
              {editingItemId && (
                <button type="button" className="btn btn-secondary ml-2" onClick={handleCancelEdit} disabled={loading}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="table-container">
          <div className="table-controls">
            <div className="form-group">
              <input
                type="text"
                placeholder="Search by Item Name, Price..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="search-input"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="search-input"
                disabled={loading}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <button onClick={downloadPdf} className="btn btn-info download-pdf-btn" disabled={loading || filteredItems.length === 0}>
              <FaFilePdf className="btn-icon-mr" /> Download PDF
            </button>
          </div>

          {/* Always render table header; tbody will show either rows or a "no-data" row */}
          <div className="table-scroll-wrapper">
            <table className="app-table">
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>MRP Price</th>
                  <th>Customer Discount (%)</th>
                  <th>Company Discount (%)</th>
                  <th>Margin (%)</th>
                  <th>Add Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody ref={tableBodyRef}>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center no-data-message" style={{ padding: '12px' }}>
                      No stationery items found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((item, index) => (
                    <tr key={item._id} className={highlightedId === item._id ? 'highlighted-row' : ''}>
                      <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td>{item.itemName}</td>
                      <td>{item.category}</td>
                      <td>
                        {typeof item.price === 'number' && !isNaN(item.price) ? `Rs ${item.price}` : 'N/A'}
                      </td>
                      <td>
                        {typeof item.customerDiscountPercentage === 'number' && !isNaN(item.customerDiscountPercentage)
                          ? `${item.customerDiscountPercentage}%`
                          : 'N/A'}
                      </td>
                      <td>
                        {typeof item.companyDiscountPercentage === 'number' && !isNaN(item.companyDiscountPercentage)
                          ? `${item.companyDiscountPercentage}%`
                          : 'N/A'}
                      </td>
                      <td>
                        {typeof item.marginPercentage === 'number' && !isNaN(item.marginPercentage)
                          ? `${item.marginPercentage}%`
                          : 'N/A'}
                      </td>
                      <td>{formatDateWithTime(item.createdAt)}</td>
                      <td>
                        <span className={`status-badge ${item.status}`}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                      </td>
                      <td className="actions-column">
                        <button onClick={() => handleEdit(item)} className="action-icon-button edit-button" title="Edit Stationery Item" disabled={loading}>
                          <FaEdit />
                        </button>
                        <button onClick={() => openConfirmModal(item)} className="action-icon-button delete-button" title="Delete Stationery Item" disabled={loading}>
                          {loading && itemToDeleteId === item._id ? <FaSpinner className="animate-spin" /> : <FaTrashAlt />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {filteredItems.length > 0 && (
              <div className="pagination-controls" style={{ marginTop: 12 }}>
                <button onClick={goToPrevPage} disabled={currentPage === 1 || loading} className="btn btn-page">
                  <FaChevronLeft className="btn-icon-mr" /> Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button onClick={goToNextPage} disabled={currentPage === totalPages || loading} className="btn btn-page">
                  Next <FaChevronRight className="btn-icon-ml" />
                </button>
              </div>
            )}

            <div className="total-records text-center mt-2">
              Total Records: {filteredItems.length}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete stationery item: <strong>{itemToDeleteName}</strong>?</p>
            <div className="modal-actions">
              <button onClick={confirmDelete} className="btn btn-danger" disabled={loading}>
                {loading ? <FaSpinner className="btn-icon-mr animate-spin" /> : 'Delete'}
              </button>
              <button onClick={closeConfirmModal} className="btn btn-secondary" disabled={loading}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StationeryItemManagement;
