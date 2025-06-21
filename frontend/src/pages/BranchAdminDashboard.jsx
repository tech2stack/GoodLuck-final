// src/pages/BranchAdminDashboard.js
import React from 'react';

const BranchAdminDashboard = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Branch Admin Dashboard</h2>
        <p className="text-gray-600 mb-6">
          यह ब्रांच एडमिन के लिए आपका डैशबोर्ड है। यहां आप अपनी ब्रांच से संबंधित जानकारी और कार्यों का प्रबंधन कर सकते हैं।
        </p>
        <div className="space-y-3">
          {/* Add specific Branch Admin functionalities here */}
          <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md transition duration-300">
            Manage Inventory
          </button>
          <button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md transition duration-300">
            View Sales Reports
          </button>
          <button className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-md transition duration-300">
            Manage Employees
          </button>
        </div>
      </div>
    </div>
  );
};

export default BranchAdminDashboard;
