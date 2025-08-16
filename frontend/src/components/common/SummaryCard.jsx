// src/components/common/SummaryCard.jsx

import React from 'react';

const SummaryCard = ({ title, count, icon: Icon, color = 'green' }) => {
  const colorVariants = {
    green: {
      gradient: "bg-[rgb(84,186,122)] hover:bg-[rgb(64,160,100)] text-white",
      shadow: 'shadow-green-400/50'
    },
    teal: {
      gradient: 'from-teal-400 to-teal-600',
      shadow: 'shadow-teal-400/50'
    },
    emerald: {
      gradient: 'from-emerald-400 to-emerald-600',
      shadow: 'shadow-emerald-400/50'
    },
    lime: {
      gradient: 'from-lime-400 to-lime-600',
      shadow: 'shadow-lime-400/50'
    },
    lightGreen:{
       gradient: "bg-green-400 hover:bg-green-500 text-white",
       shadow: 'shadow-lime-400/50'
  }
  };


const colors = colorVariants[color] || colorVariants.green;


  return (
    <div
      className={`
        relative p-6 rounded-2xl 
        bg-white/70 backdrop-blur-md 
        border border-gray-200
        shadow-lg hover:shadow-2xl 
        transform hover:-translate-y-2 
        transition-all duration-300 ease-in-out
      `}
    >
      {/* Icon with gradient & glow */}
      <div
        className={`
          w-14 h-14 flex items-center justify-center 
          rounded-full bg-gradient-to-r ${colors.gradient} 
          text-white text-2xl mx-auto mb-3
          shadow-md ${colors.shadow}
        `}
      >
        {Icon && <Icon />}
      </div>

      {/* Title */}
      <p className="text-lg font-medium text-gray-500 mb-1 text-center tracking-wide">
        {title}
      </p>

      {/* Count */}
      <p className="text-3xl font-bold text-gray-800 text-center drop-shadow-sm">
        {count}
      </p>
    </div>
  );
};

export default SummaryCard;
