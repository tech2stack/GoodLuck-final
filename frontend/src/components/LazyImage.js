// src/components/LazyImage.js
import React from 'react';

const LazyImage = ({ src, alt, className, style, ...props }) => {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading="lazy" // <-- Yehi hai magic! Har image ko lazy load karega
      {...props} // Baaki saare props (e.g., width, height) aage pass karega
    />
  );
};

export default LazyImage;