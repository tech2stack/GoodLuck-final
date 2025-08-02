// src/components/common/SummaryCard.jsx
import React from 'react';

const SummaryCard = ({ title, count, icon: Icon, color = 'green' }) => {
  const colorVariants = {
    green: {
      bg: 'bg-green-100', // Thoda halka shade behtar visual ke liye
      text: 'text-green-600',
      border: 'border-green-200'
    },
    teal: {
      bg: 'bg-teal-100',
      text: 'text-teal-600',
      border: 'border-teal-200'
    },
    emerald: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-600',
      border: 'border-emerald-200'
    },
    lime: {
      bg: 'bg-lime-100',
      text: 'text-lime-600',
      border: 'border-lime-200'
    }
  };

  const colors = colorVariants[color] || colorVariants.green;

  return (
    <div className={`p-4 rounded-lg shadow-sm border ${colors.border} bg-white hover:shadow-md transition-all duration-200`}>
      <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center mb-3`}>
        {Icon && <Icon className={`text-xl ${colors.text}`} />}
      </div>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{count}</p>
    </div>
  );
};

export default SummaryCard;