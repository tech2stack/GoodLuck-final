// src/components/dashboard/StockManagerDashboardSummary.jsx
import React, { useEffect, useState } from 'react';
import useDataFetching from '../../hooks/useDataFetching';
import SummaryCard from '../common/SummaryCard';
import {
  FaGraduationCap, FaGlobeAsia, FaCity, FaBook,
  FaLanguage, FaBookOpen, FaPencilRuler, FaUserCheck, FaTruck, FaSpinner
} from 'react-icons/fa';

const StockManagerDashboardSummary = ({ showFlashMessage }) => {
  const { data: classesData, loading: loadingClasses, error: errorClasses } = useDataFetching('/summary/classes');
  const { data: zonesData, loading: loadingZones, error: errorZones } = useDataFetching('/summary/zones');
  const { data: citiesData, loading: loadingCities, error: errorCities } = useDataFetching('/summary/cities');
  const { data: publicationsData, loading: loadingPublications, error: errorPublications } = useDataFetching('/summary/publications');
  const { data: languagesData, loading: loadingLanguages, error: errorLanguages } = useDataFetching('/summary/languages');
  const { data: bookCatalogsData, loading: loadingBookCatalogs, error: errorBookCatalogs } = useDataFetching('/summary/book-catalogs');
  const { data: stationeryItemsData, loading: loadingStationeryItems, error: errorStationeryItems } = useDataFetching('/summary/stationery-items');
  const { data: customersData, loading: loadingCustomers, error: errorCustomers } = useDataFetching('/summary/customers');
  const { data: transportsData, loading: loadingTransports, error: errorTransports } = useDataFetching('/summary/transports');

  const loading = loadingClasses || loadingZones || loadingCities || loadingPublications || loadingLanguages || loadingBookCatalogs || loadingStationeryItems || loadingCustomers || loadingTransports;
  const error = errorClasses || errorZones || errorCities || errorPublications || errorLanguages || errorBookCatalogs || errorStationeryItems || errorCustomers || errorTransports;

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

  const [animatedCounts, setAnimatedCounts] = useState({
    classes: 0,
    zones: 0,
    cities: 0,
    publications: 0,
    languages: 0,
    bookCatalogs: 0,
    stationeryItems: 0,
    customers: 0,
    transports: 0,
  });

  useEffect(() => {
    if (!loading && !error) {
      const duration = 1000; // animation duration in ms
      const intervalTime = 50; // interval for count increment
      const steps = Math.ceil(duration / intervalTime);

      const increments = {
        classes: counts.classes / steps,
        zones: counts.zones / steps,
        cities: counts.cities / steps,
        publications: counts.publications / steps,
        languages: counts.languages / steps,
        bookCatalogs: counts.bookCatalogs / steps,
        stationeryItems: counts.stationeryItems / steps,
        customers: counts.customers / steps,
        transports: counts.transports / steps,
      };

      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        setAnimatedCounts(prev => ({
          classes: Math.min(prev.classes + increments.classes, counts.classes),
          zones: Math.min(prev.zones + increments.zones, counts.zones),
          cities: Math.min(prev.cities + increments.cities, counts.cities),
          publications: Math.min(prev.publications + increments.publications, counts.publications),
          languages: Math.min(prev.languages + increments.languages, counts.languages),
          bookCatalogs: Math.min(prev.bookCatalogs + increments.bookCatalogs, counts.bookCatalogs),
          stationeryItems: Math.min(prev.stationeryItems + increments.stationeryItems, counts.stationeryItems),
          customers: Math.min(prev.customers + increments.customers, counts.customers),
          transports: Math.min(prev.transports + increments.transports, counts.transports),
        }));
        if (currentStep >= steps) clearInterval(interval);
      }, intervalTime);

      return () => clearInterval(interval);
    }
  }, [loading, error, counts]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin rounded-full h-12 w-12 text-green-500" />
      </div>
    );
  }

  if (error) {
    const errorMessage = error.message || 'Failed to load dashboard summary.';
    showFlashMessage(errorMessage, 'error');
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
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-6 mt-6 drop-shadow-md animate__animated animate__fadeIn">
  Stock Dashboard Summary
     </h2>

      <div className="dashboard-content">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <SummaryCard title="Total Classes" count={Math.floor(animatedCounts.classes)} icon={FaGraduationCap} color="from-green-400 to-green-600" />
        <SummaryCard title="Total Zones" count={Math.floor(animatedCounts.zones)} icon={FaGlobeAsia} color="from-teal-400 to-teal-600" />
        <SummaryCard title="Total Cities" count={Math.floor(animatedCounts.cities)} icon={FaCity} color="from-emerald-400 to-emerald-600" />
        <SummaryCard title="Total Publications" count={Math.floor(animatedCounts.publications)} icon={FaBook} color="from-indigo-400 to-indigo-600" />
        <SummaryCard title="Total Languages" count={Math.floor(animatedCounts.languages)} icon={FaLanguage} color="from-pink-400 to-pink-600" />
        <SummaryCard title="Total Book Catalogs" count={Math.floor(animatedCounts.bookCatalogs)} icon={FaBookOpen} color="from-purple-400 to-purple-600" />
        <SummaryCard title="Total Stationery Items" count={Math.floor(animatedCounts.stationeryItems)} icon={FaPencilRuler} color="from-yellow-400 to-yellow-600" />
        <SummaryCard title="Total Customers" count={Math.floor(animatedCounts.customers)} icon={FaUserCheck} color="from-blue-400 to-blue-600" />
        <SummaryCard title="Total Transports" count={Math.floor(animatedCounts.transports)} icon={FaTruck} color="from-red-400 to-red-600" />
      </div>
    </div>
  </div>
  );
};

export default StockManagerDashboardSummary;
