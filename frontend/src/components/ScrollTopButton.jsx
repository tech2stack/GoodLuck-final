import React, { useState, useEffect } from "react";
import { FaArrowCircleUp } from "react-icons/fa";
import "../styles/ScrollTopButton.css";

const ScrollTopButton = () => {
  const [visible, setVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  return (
    visible && (
      <button className="scroll-top-btn" onClick={scrollToTop} aria-label="Scroll to top">
        <FaArrowCircleUp size={35} />
      </button>
    )
  );
};

export default ScrollTopButton;
