// src/ErrorBoundary.js
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Agle render mein fallback UI dikhane ke liye state update karein.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Aap yahan error reporting service (jaise Sentry) ko error log kar sakte hain
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Jab koi error ho to yeh fallback UI dikhayenge
      return <h1>Something went wrong. Please try again later.</h1>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;