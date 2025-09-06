
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const CustomerOrderRecord = () => {
  const [customerTypes, setCustomerTypes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [salesRepresentatives, setSalesRepresentatives] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [publications, setPublications] = useState([]);
  const [subtitles, setSubtitles] = useState([]);
  const [books, setBooks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [formData, setFormData] = useState({
    customerType: '',
    customerId: '',
    salesBy: '',
    orderEntryBy: '',
    publication: '',
    subtitle: 'null',
    shippedTo: '',
    orderDate: new Date().toISOString().split('T')[0],
    orderBy: 'Online',
    remark: '',
    orderImage: null,
  });
  const [orderItems, setOrderItems] = useState([{ book: '', quantity: 0, price: 0, discount: 0, total: 0, className: '' }]);
  const [orderNumber, setOrderNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  const apiBaseUrl = 'http://localhost:5000/api/v1/customer-orders';
  const authApiBaseUrl = 'http://localhost:5000/api/v1/auth';

  const getJwtToken = () => {
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      acc[name] = value;
      return acc;
    }, {});
    console.log('Cookies:', document.cookie);
    return cookies.jwt || null;
  };

  const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

  const fetchData = async (url, setter) => {
    try {
      setLoading(true);
      const response = await fetch(url, {
        credentials: 'include',
      });
      console.log(`Fetching ${url}: Status ${response.status}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch ${url} (Status: ${response.status})`);
      }
      const data = await response.json();
      console.log(`Data from ${url}:`, data);
      setter(data.data[Object.keys(data.data)[0]]);
    } catch (err) {
      setError(`Error fetching ${url}: ${err.message}`);
      console.error(`Error fetching ${url}:`, err);
    } finally {
      setLoading(false);
    }
  };

const checkAuth = async () => {
  try {
    const response = await fetch(`${authApiBaseUrl}/me`, {
      credentials: 'include',
    });
    console.log('Auth response status:', response.status);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'User not authenticated');
    }
    const data = await response.json();
    console.log('Authenticated user:', data.data.user);
    setIsAuthenticated(true);
    setUser(data.data.user);
    return data.data.user;
  } catch (err) {
    setIsAuthenticated(false);
    setError('Please log in to access this page');
    console.error('Authentication check failed:', err);
    navigate('/login');
    return null;
  }
};

useEffect(() => {
  const initializeData = async () => {
    const user = await checkAuth();
    if (user) {
      if (['super_admin', 'branch_admin', 'stock_manager'].includes(user.role)) {
        fetchData(`${apiBaseUrl}/types`, setCustomerTypes);
        fetchData(`${apiBaseUrl}/sales-representatives`, setSalesRepresentatives);
        fetchData(`${apiBaseUrl}/employees`, setAllEmployees);
        fetchData(`${apiBaseUrl}/publications`, setPublications);
        fetchData(`${apiBaseUrl}`, (data) => {
          setOrders(data);
          const lastOrder = data[data.length - 1];
          setOrderNumber(lastOrder ? lastOrder.orderNumber + 1 : 1);
        });
      } else {
        setError('You do not have permission to access this page');
        setIsAuthenticated(false);
        navigate('/login');
      }
    }
  };
  initializeData();
}, [navigate]);

  useEffect(() => {
    if (formData.customerType) {
      fetchData(`${apiBaseUrl}/customers/${formData.customerType}`, setCustomers);
    } else {
      setCustomers([]);
      setOrderItems([{ book: '', quantity: 0, price: 0, discount: 0, total: 0, className: '' }]);
    }
  }, [formData.customerType]);

  // Memoize the discount update to prevent unnecessary re-renders
  const updateDiscount = useCallback(() => {
    if (formData.customerId) {
      const selectedCustomer = customers.find((c) => c._id === formData.customerId);
      if (selectedCustomer && selectedCustomer.discount != null) {
        setOrderItems((prevItems) =>
          prevItems.map((item) => {
            const discount = parseFloat(selectedCustomer.discount || 0);
            return {
              ...item,
              discount,
              total: parseFloat(item.price || 0) * parseInt(item.quantity || 0) * (1 - discount / 100),
            };
          })
        );
      }
    }
  }, [formData.customerId, customers]);

  useEffect(() => {
    updateDiscount();
  }, [updateDiscount]);

  useEffect(() => {
    if (formData.publication) {
      fetchData(`${apiBaseUrl}/publications/${formData.publication}/subtitles`, setSubtitles);
    } else {
      setSubtitles([]);
    }
  }, [formData.publication]);

  useEffect(() => {
    if (formData.publication) {
      const subtitleId = formData.subtitle || 'null';
      fetchData(`${apiBaseUrl}/publications/${formData.publication}/subtitles/${subtitleId}/books`, (books) => {
        console.log('Fetched books:', books);
        setBooks(books);
      });
    } else {
      setBooks([]);
    }
  }, [formData.publication, formData.subtitle]);

  const handleChange = useCallback((e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'orderImage' ? files[0] : value,
    }));
  }, []);

  const addItem = useCallback(() => {
    const selectedCustomer = customers.find((c) => c._id === formData.customerId);
    const discount = selectedCustomer ? parseFloat(selectedCustomer.discount || 0) : 0;
    setOrderItems((prev) => [
      ...prev,
      { book: '', quantity: 0, price: 0, discount, total: 0, className: '' },
    ]);
  }, [customers, formData.customerId]);

  const updateOrderItem = useCallback(
    (index, field, value) => {
      setOrderItems((prevItems) => {
        const updatedItems = [...prevItems];
        updatedItems[index] = { ...updatedItems[index], [field]: value };
        const selectedCustomer = customers.find((c) => c._id === formData.customerId);
        const discount = selectedCustomer ? parseFloat(selectedCustomer.discount || 0) : updatedItems[index].discount;

        if (field === 'book') {
          const selectedBook = books.find((b) => b._id === value);
          console.log('Selected book:', selectedBook);
          if (selectedBook) {
            updatedItems[index].className = selectedBook.bookType === 'common_price' ? '' : updatedItems[index].className;
            updatedItems[index].price = selectedBook.bookType === 'common_price' ? selectedBook.commonPrice || 0 : 0;
            if (selectedBook.bookType !== 'common_price' && updatedItems[index].className) {
              const price = selectedBook.pricesByClass?.[updatedItems[index].className] || 0;
              console.log(`Setting price for className ${updatedItems[index].className}: ${price}`);
              updatedItems[index].price = price;
            }
          } else {
            updatedItems[index].price = 0;
            updatedItems[index].className = '';
          }
        }
        if (field === 'className' && updatedItems[index].book) {
          const selectedBook = books.find((b) => b._id === updatedItems[index].book);
          if (selectedBook && selectedBook.bookType !== 'common_price' && value) {
            const price = selectedBook.pricesByClass?.[value] || 0;
            console.log(`Updating price for className ${value}: ${price}`);
            updatedItems[index].price = price;
          }
        }
        if (['quantity', 'price'].includes(field)) {
          updatedItems[index].discount = discount;
          const { quantity, price } = updatedItems[index];
          updatedItems[index].total = parseFloat(price || 0) * parseInt(quantity || 0) * (1 - discount / 100);
        }
        return updatedItems;
      });
    },
    [books, customers, formData.customerId]
  );

  const removeItem = useCallback((index) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const totalQty = useMemo(() => orderItems.reduce((sum, item) => sum + parseInt(item.quantity || 0), 0), [orderItems]);
  const totalAmount = useMemo(() => orderItems.reduce((sum, item) => sum + parseFloat(item.total || 0), 0), [orderItems]);

  const isFormValid = useCallback(() => {
    if (
      !formData.customerType ||
      !formData.customerId ||
      !formData.salesBy ||
      !formData.orderEntryBy ||
      !formData.publication ||
      !formData.orderDate ||
      !formData.orderBy
    ) {
      return false;
    }
    return orderItems.every((item) => {
      if (!item.book || !item.quantity || item.price <= 0) {
        return false;
      }
      const selectedBook = books.find((b) => b._id === item.book);
      if (!selectedBook) {
        return false;
      }
      if (selectedBook.bookType !== 'common_price' && !item.className) {
        return false;
      }
      const expectedPrice = selectedBook.bookType === 'common_price' ? selectedBook.commonPrice : selectedBook.pricesByClass?.[item.className];
      return expectedPrice && expectedPrice > 0 && Math.abs(expectedPrice - parseFloat(item.price)) <= 0.01;
    });
  }, [formData, orderItems, books]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      console.log('Submitting order items:', orderItems);

      for (const item of orderItems) {
        const selectedBook = books.find((b) => b._id === item.book);
        if (!selectedBook) {
          throw new Error(`Invalid book ID: ${item.book}`);
        }
        if (selectedBook.bookType !== 'common_price' && !item.className) {
          throw new Error(`Class name is required for book: ${selectedBook.bookName}`);
        }
        const expectedPrice = selectedBook.bookType === 'common_price' ? selectedBook.commonPrice : selectedBook.pricesByClass?.[item.className];
        if (!expectedPrice || expectedPrice <= 0) {
          throw new Error(`Invalid price for book: ${selectedBook.bookName}. Price must be greater than 0.`);
        }
        if (Math.abs(expectedPrice - parseFloat(item.price)) > 0.01) {
          throw new Error(`Price mismatch for book: ${selectedBook.bookName}. Expected ${expectedPrice}, received ${item.price}`);
        }
      }

      const form = new FormData();
      form.append('customerId', formData.customerId);
      form.append('customerType', formData.customerType);
      form.append('salesBy', formData.salesBy);
      form.append('orderEntryBy', formData.orderEntryBy);
      form.append('publication', formData.publication);
      form.append('subtitle', formData.subtitle);
      form.append('orderItems', JSON.stringify(orderItems));
      form.append('orderDate', formData.orderDate);
      form.append('orderBy', formData.orderBy);
      if (formData.shippedTo) form.append('shippedTo', formData.shippedTo);
      if (formData.remark) form.append('remark', formData.remark);
      if (formData.orderImage) form.append('orderImage', formData.orderImage);

      const response = await fetch(`${apiBaseUrl}`, {
        method: 'POST',
        body: form,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create order');
      }

      const data = await response.json();
      setOrders((prev) => [...prev, data.data.order]);
      setOrderNumber((prev) => prev + 1);
      handleReset();
    } catch (err) {
      setError(err.message);
      console.error('Error creating order:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = useCallback(() => {
    setFormData({
      customerType: '',
      customerId: '',
      salesBy: '',
      orderEntryBy: '',
      publication: '',
      subtitle: 'null',
      shippedTo: '',
      orderDate: new Date().toISOString().split('T')[0],
      orderBy: 'Online',
      remark: '',
      orderImage: null,
    });
    setOrderItems([{ book: '', quantity: 0, price: 0, discount: 0, total: 0, className: '' }]);
    setError(null);
  }, []);

  return (
    <div className="container mx-auto p-6">
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {loading && <div className="text-blue-500 mb-4">Loading...</div>}
      {!isAuthenticated && <div className="text-red-500 mb-4">Please log in to access this page</div>}
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Customer Order Record</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Customer Type</label>
            <select
              name="customerType"
              value={formData.customerType}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="">Select Customer Type</option>
              {customerTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Customer</label>
            <select
              name="customerId"
              value={formData.customerId}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading || !formData.customerType}
            >
              <option value="">Select Customer</option>
              {customers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.customerName} {customer.discount ? `(Discount: ${customer.discount}%)` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Sales Representative</label>
            <select
              name="salesBy"
              value={formData.salesBy}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading || !formData.customerId}
            >
              <option value="">Select Sales Representative</option>
              {salesRepresentatives.map((rep) => (
                <option key={rep._id} value={rep._id}>
                  {rep.name} {rep.mobileNumber ? `(${rep.mobileNumber})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Order Entry By</label>
            <select
              name="orderEntryBy"
              value={formData.orderEntryBy}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="">Select Order Entry By</option>
              {allEmployees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} {emp.mobileNumber ? `(${emp.mobileNumber})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Publication</label>
            <select
              name="publication"
              value={formData.publication}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="">Select Publication</option>
              {publications.map((pub) => (
                <option key={pub._id} value={pub._id}>
                  {pub.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Subtitle</label>
            <select
              name="subtitle"
              value={formData.subtitle}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading || !formData.publication}
            >
              <option value="null">No Subtitle</option>
              {subtitles.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Order Date</label>
            <input
              type="date"
              name="orderDate"
              value={formData.orderDate}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Order By</label>
            <select
              name="orderBy"
              value={formData.orderBy}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="Online">Online</option>
              <option value="Phone">Phone</option>
              <option value="In-Person">In-Person</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Shipped To</label>
            <input
              type="text"
              name="shippedTo"
              value={formData.shippedTo}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Remark</label>
            <textarea
              name="remark"
              value={formData.remark}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Order Image</label>
            <input
              type="file"
              name="orderImage"
              accept="image/jpeg,image/png"
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
              disabled={loading}
            />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Order Items</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Book', 'Class', 'Quantity', 'Price', 'Discount (%)', 'Total', 'Action'].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orderItems.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <select
                        value={item.book}
                        onChange={(e) => updateOrderItem(index, 'book', e.target.value)}
                        className="w-full border border-gray-300 rounded-md p-2"
                        disabled={loading}
                      >
                        <option value="">Select Book</option>
                        {books.map((book) => (
                          <option key={book._id} value={book._id}>
                            {book.bookName}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <select
                        value={item.className}
                        onChange={(e) => updateOrderItem(index, 'className', e.target.value)}
                        className="w-full border border-gray-300 rounded-md p-2"
                        disabled={loading || !item.book || books.find((b) => b._id === item.book)?.bookType === 'common_price'}
                        required={item.book && books.find((b) => b._id === item.book)?.bookType !== 'common_price'}
                      >
                        <option value="">Select Class</option>
                        {books
                          .find((b) => b._id === item.book)?.pricesByClass
                          ? Object.entries(books.find((b) => b._id === item.book).pricesByClass).map(([classId, price]) => (
                              <option key={classId} value={classId}>
                                {classId} (Price: {price})
                              </option>
                            ))
                          : null}
                      </select>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateOrderItem(index, 'quantity', e.target.value)}
                        className="w-full border border-gray-300 rounded-md p-2"
                        min="1"
                        disabled={loading}
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <input
                        type="number"
                        value={item.price}
                        readOnly
                        className="w-full border border-gray-300 rounded-md p-2 bg-gray-100"
                        disabled
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <input
                        type="number"
                        value={item.discount}
                        readOnly
                        className="w-full border border-gray-300 rounded-md p-2 bg-gray-100"
                        disabled
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">{item.total.toFixed(2)}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-700"
                        disabled={loading || orderItems.length === 1}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              onClick={addItem}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
              disabled={loading}
            >
              Add Item
            </button>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Book Qty</label>
                <input
                  type="number"
                  value={totalQty}
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Order Amount</label>
                <input
                  type="number"
                  value={totalAmount.toFixed(2)}
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-gray-100"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          <button
            type="submit"
            className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 disabled:bg-green-300"
            disabled={loading || !isFormValid()}
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 disabled:bg-gray-300"
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </form>
      <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-800">Order History</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Order Number', 'Customer', 'Customer Type', 'Sales By', 'Order Date', 'Total Qty', 'Total Amount'].map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order._id}>
                <td className="px-4 py-2 whitespace-nowrap">{order.orderNumber}</td>
                <td className="px-4 py-2 whitespace-nowrap">{order.customer?.customerName || 'N/A'}</td>
                <td className="px-4 py-2 whitespace-nowrap">{order.customerType}</td>
                <td className="px-4 py-2 whitespace-nowrap">{order.salesBy?.name || 'N/A'}</td>
                <td className="px-4 py-2 whitespace-nowrap">{new Date(order.orderDate).toLocaleDateString()}</td>
                <td className="px-4 py-2 whitespace-nowrap">{order.orderItems.reduce((sum, item) => sum + item.quantity, 0)}</td>
                <td className="px-4 py-2 whitespace-nowrap">{order.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerOrderRecord;
