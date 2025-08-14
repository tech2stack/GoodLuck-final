// src/components/dashboard/StockManagerDashboardSummary.jsx
import React from 'react';
import useDataFetching from '../../hooks/useDataFetching'; // NEW: Import the custom hook
import SummaryCard from '../common/SummaryCard';
import {
  FaGraduationCap, FaGlobeAsia, FaCity, FaBook,
  FaLanguage, FaBookOpen, FaPencilRuler, FaUserCheck, FaTruck, FaSpinner
} from 'react-icons/fa';

const StockManagerDashboardSummary = ({ showFlashMessage }) => {
  // NEW: Use the custom hook for each individual summary endpoint
  const { data: classesData, loading: loadingClasses, error: errorClasses } = useDataFetching('/summary/classes');
  const { data: zonesData, loading: loadingZones, error: errorZones } = useDataFetching('/summary/zones');
  const { data: citiesData, loading: loadingCities, error: errorCities } = useDataFetching('/summary/cities');
  const { data: publicationsData, loading: loadingPublications, error: errorPublications } = useDataFetching('/summary/publications');
  const { data: languagesData, loading: loadingLanguages, error: errorLanguages } = useDataFetching('/summary/languages');
  const { data: bookCatalogsData, loading: loadingBookCatalogs, error: errorBookCatalogs } = useDataFetching('/summary/book-catalogs');
  const { data: stationeryItemsData, loading: loadingStationeryItems, error: errorStationeryItems } = useDataFetching('/summary/stationery-items');
  const { data: customersData, loading: loadingCustomers, error: errorCustomers } = useDataFetching('/summary/customers');
  const { data: transportsData, loading: loadingTransports, error: errorTransports } = useDataFetching('/summary/transports');

  // Combine loading and error states from all hooks
  const loading = loadingClasses || loadingZones || loadingCities || loadingPublications || loadingLanguages || loadingBookCatalogs || loadingStationeryItems || loadingCustomers || loadingTransports;
  const error = errorClasses || errorZones || errorCities || errorPublications || errorLanguages || errorBookCatalogs || errorStationeryItems || errorCustomers || errorTransports;

  // Extract counts from the fetched data, providing default values
  const counts = {
    classes: classesData?.data?.count || 0,
    zones: zonesData?.data?.count || 0,
    cities: citiesData?.data?.count || 0,
    publications: publicationsData?.data?.count || 0,
    languages: languagesData?.data?.count || 0,
    bookCatalogs: bookCatalogsData?.data?.count || 0,
    stationeryItems: stationeryItemsData?.data?.count || 0,
    customers: customersData?.data?.count || 0,
    transports: transportsData?.data?.count || 0,
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin rounded-full h-12 w-12 text-green-500" />
      </div>
    );
  }

  // Display a single error message if any of the fetches failed
  if (error) {
    // Determine the specific error message, or use a general one
    const errorMessage = error.message || 'Failed to load dashboard summary.';
    showFlashMessage(errorMessage, 'error'); // Show flash message for a better user experience
    return (
      <div className="bg-red-50 p-4 rounded-lg text-center">
        <p className="text-red-600 mb-3">Error: {errorMessage}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="main-section-title">Overall Dashboard Summary</h2>
      
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
