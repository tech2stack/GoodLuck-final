// src/components/dashboard/StockManagerDashboardSummary.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import SummaryCard from '../common/SummaryCard';
import {
  FaGraduationCap, FaGlobeAsia, FaCity, FaBook,
  FaLanguage, FaBookOpen, FaPencilRuler, FaUserCheck, FaTruck
} from 'react-icons/fa';

const StockManagerDashboardSummary = ({ showFlashMessage }) => {
  const [counts, setCounts] = useState({
    classes: 0,
    zones: 0,
    cities: 0,
    publications: 0,
    languages: 0,
    bookCatalogs: 0,
    stationeryItems: 0,
    customers: 0,
    transports: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const responses = await Promise.all([
        api.get('/summary/classes'),
        api.get('/summary/zones'),
        api.get('/summary/cities'),
        api.get('/summary/publications'),
        api.get('/summary/languages'),
        api.get('/summary/book-catalogs'),
        api.get('/summary/stationery-items'),
        api.get('/summary/customers'),
        api.get('/summary/transports')
      ]);

      setCounts({
        classes: responses[0].data.data.count,
        zones: responses[1].data.data.count,
        cities: responses[2].data.data.count,
        publications: responses[3].data.data.count,
        languages: responses[4].data.data.count,
        bookCatalogs: responses[5].data.data.count,
        stationeryItems: responses[6].data.data.count,
        customers: responses[7].data.data.count || 0,
        transports: responses[8].data.data.count || 0,
      });
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard summary.');
      showFlashMessage(err.response?.data?.message || 'Failed to load dashboard summary.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showFlashMessage]);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-red-600 mb-3">Error: {error}</p>
        <button
          onClick={fetchCounts}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Overall Dashboard Summary</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <SummaryCard title="Total Classes" count={counts.classes} icon={FaGraduationCap} color="green" />
        <SummaryCard title="Total Zones" count={counts.zones} icon={FaGlobeAsia} color="teal" />
        <SummaryCard title="Total Cities" count={counts.cities} icon={FaCity} color="emerald" />
        <SummaryCard title="Total Publications" count={counts.publications} icon={FaBook} color="green" />
        <SummaryCard title="Total Languages" count={counts.languages} icon={FaLanguage} color="teal" />
        <SummaryCard title="Total Book Catalogs" count={counts.bookCatalogs} icon={FaBookOpen} color="emerald" />
        <SummaryCard title="Total Stationery Items" count={counts.stationeryItems} icon={FaPencilRuler} color="green" />
        <SummaryCard title="Total Customers" count={counts.customers} icon={FaUserCheck} color="teal" />
        <SummaryCard title="Total Transports" count={counts.transports} icon={FaTruck} color="emerald" />
      </div>
    </div>
  );
};

export default StockManagerDashboardSummary;