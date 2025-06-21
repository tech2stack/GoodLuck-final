import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

// Import AuthContext
import { useAuth } from '../context/AuthContext';

// Import stylesheet and assets
import '../styles/Login.css';
import logo from '../assets/logo.jpg';

// Lazy load image component
import LazyImage from '../components/LazyImage';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { login, isLoggedIn, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('Login useEffect running');
    console.log('  isLoggedIn:', isLoggedIn);
    console.log('  userData:', userData);
    console.log('  userData?.role:', userData?.role);
    console.log('  location.state:', location.state);

    if (location.state && location.state.fromLogout) {
      setMessage(location.state.message || 'You have successfully logged out.');
      navigate(location.pathname, { replace: true, state: {} });
    } else if (isLoggedIn && userData && userData.role) {
      console.log('Login useEffect: User already logged in. Redirecting based on role:', userData.role);
      if (userData.role === 'super_admin') {
        navigate('/superadmin-dashboard', { replace: true });
      } else if (userData.role === 'branch_admin') {
        navigate('/branch-admin-dashboard', { replace: true });
      } else if (userData.role === 'employee') {
        navigate('/employee-dashboard', { replace: true });
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
      const result = await login(credentials.username, credentials.password);

      setMessage(`Login successful! Welcome, ${result.user.name || result.user.username || result.user.loginId}. Role: ${result.user.role}`);
      console.log('Login successful. User data:', result.user);

      if (result.user.role === 'super_admin') {
        navigate('/superadmin-dashboard');
      } else if (result.user.role === 'branch_admin') {
        navigate('/branch-admin-dashboard');
      } else if (result.user.role === 'employee') {
        navigate('/employee-dashboard');
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

  return (
    <div className="login-container">
      <div className="login-box">
        <LazyImage src={logo} alt="GoodLuck Logo" className="login-logo" />
        <h2>Login</h2>

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
              placeholder="Username"
              value={credentials.username}
              onChange={handleChange}
              required
              autoComplete="username"
              disabled={loading}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={credentials.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              disabled={loading}
            />
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
