import React, { useState } from 'react';
import '../styles/Forgot.css';
import logo from '../assets/logo.jpg';
import bgImage from '../assets/3.png';

// Import the LazyImage component
import LazyImage from '../components/LazyImage'; 

const Forgot = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Placeholder logic – replace with actual reset logic
    alert(`Password reset link sent to ${email}`);
  };

  return (
<div
  className="forgot-container"
  style={{
    background: `url(${bgImage}) no-repeat center center / cover`,
    filter: 'brightness(0.8) contrast(1.1)',
    backgroundAttachment: 'fixed'
  }}
>

      <div className="forgot-box">
        {/*
          Changed <img> to <LazyImage> for the logo.
          This image will now be lazy-loaded.
        */}
        <LazyImage src={logo} alt="GoodLuck Logo" className="forgot-logo" />
        <h2>Forgot Password</h2>
        <p className="instruction">Enter your registered email address to receive a password reset link.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Send Reset Link</button>
        </form>
        <p className="back-login">
          <a href="/login">Back to Login</a>
        </p>
      </div>
    </div>
  );
};

export default Forgot;