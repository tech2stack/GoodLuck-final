// src/pages/EmployeeDashboard.js
import React from 'react';

const EmployeeDashboard = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Employee Dashboard</h2>
        <p className="text-gray-600 mb-6">
          यह सामान्य कर्मचारी के लिए आपका डैशबोर्ड है। यहां आप अपनी दैनिक गतिविधियों और जानकारी तक पहुंच सकते हैं।
        </p>
        <div className="space-y-3">
          {/* Add specific Employee functionalities here */}
          <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md transition duration-300">
            View Tasks
          </button>
          <button className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-md transition duration-300">
            Submit Reports
          </button>
          <button className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md transition duration-300">
            Request Leave
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
