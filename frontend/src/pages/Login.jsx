import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

import '../styles/Login.css';
import logo from '../assets/glbs-logo.jpg';
import LazyImage from '../components/LazyImage';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false); // New state for password visibility

  const { login, isLoggedIn, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('Login useEffect running');
    console.log('    isLoggedIn:', isLoggedIn);
    console.log('    userData:', userData);
    console.log('    userData?.role:', userData?.role);
    console.log('    location.state:', location.state);

    if (location.state && location.state.fromLogout) {
      setMessage(location.state.message || 'You have successfully logged out.');
      navigate(location.pathname, { replace: true, state: {} });
    } else if (isLoggedIn && userData && userData.role) {
      console.log('Login useEffect: User already logged in. Redirecting based on role:', userData.role);
      // Ensure this redirection logic is correct based on your userData structure
      if (userData.role === 'super_admin') {
        navigate('/superadmin-dashboard', { replace: true });
      } else if (userData.role === 'branch_admin') {
        navigate('/branch-admin-dashboard', { replace: true });
      } else if (userData.role === 'employee') {
        navigate('/employee-dashboard', { replace: true });
      } else if (userData.role === 'stock_manager') {
        navigate('/stock-manager-dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isLoggedIn, userData, navigate, location.state, location.pathname]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // <<< CRITICAL CHANGE: 'result' is the user object directly >>>
      const loggedInUser = await login(credentials.username, credentials.password);

      // <<< CRITICAL CHANGE: Access properties directly from 'loggedInUser' >>>
      setMessage(`Login successful! Welcome, ${loggedInUser.name || loggedInUser.username || loggedInUser.email}. Role: ${loggedInUser.role}`);
      console.log('Login successful. User data:', loggedInUser);

      // <<< CRITICAL CHANGE: Access 'role' directly from 'loggedInUser' >>>
      if (loggedInUser.role === 'super_admin') {
        navigate('/superadmin-dashboard');
      } else if (loggedInUser.role === 'branch_admin') {
        navigate('/branch-admin-dashboard');
      } else if (loggedInUser.role === 'employee') {
        navigate('/employee-dashboard');
      } else if (loggedInUser.role === 'stock_manager') {
        navigate('/stock-manager-dashboard');
      } else {
        navigate('/dashboard');
      }

    } catch (error) {
      const errorMessage = error.response ? error.response.data.message : 'Login failed: Network or server error.';
      setMessage(errorMessage);
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <LazyImage src={logo} alt="GoodLuck Logo" className="login-logo" />
        <h2 className="erp">SHARK ERP V 0.1</h2>

        {message && (
          <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {!isLoggedIn ? (
          <form onSubmit={handleLogin}>
            <input
              type="text"
              name="username"
              placeholder="Username or Email"
              value={credentials.username}
              onChange={handleChange}
              required
              autoComplete="username"
              disabled={loading}
            />
            <div className="password-input-container"> {/* Added a container for the password field and eye icon */}
              <input
                type={showPassword ? 'text' : 'password'} // Dynamically change type
                name="password"
                placeholder="Password"
                value={credentials.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                disabled={loading}
              />
              <span
                className="password-toggle-icon"
                onClick={togglePasswordVisibility}
              >
                {/* Basic eye icon - you might want to use an actual icon library like Font Awesome */}
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20px" height="20px">
                    <path d="M12 4.5c5 0 9.27 3.03 11 7.5-1.73 4.47-6 7.5-11 7.5S2.73 16.47 1 12c1.73-4.47 6-7.5 11-7.5zM12 17c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0-8c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20px" height="20px">
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.47-6-7.5-11-7.5-1.4 0-2.74.25-3.98.71l2.48 2.48c.82-.47 1.73-.71 2.58-.71zm0 9c-2.76 0-5-2.24-5-5 0-.65.13-1.26.36-1.83L3.5 6.05C2.18 7.35 1 8.94 1 12c1.73 4.47 6 7.5 11 7.5 1.4 0 2.74-.25 3.98-.71l-2.48-2.48c-.82.47-1.73.71-2.58.71zm0-4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                  </svg>
                )}
              </span>
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (
          <div className="text-center p-4">
            <p className="text-xl font-semibold mb-4">You are already logged in.</p>
            <Link to={
              userData?.role === 'super_admin' ? '/superadmin-dashboard' :
              userData?.role === 'branch_admin' ? '/branch-admin-dashboard' :
              userData?.role === 'employee' ? '/employee-dashboard' :
              userData?.role === 'stock_manager' ? '/stock-manager-dashboard' :
              '/'
            } className="text-blue-600 hover:underline">
              Go to your Dashboard
            </Link>
          </div>
        )}

        {!isLoggedIn && (
          <p className="forgot">
            <a href="/forgot">Forgot Password?</a>
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;