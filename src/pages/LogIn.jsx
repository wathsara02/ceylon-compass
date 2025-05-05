import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const Login = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState({});
  const [loading, setLoading] = useState(false);
  
  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset errors
    setError('');
    setFieldError({});
    
    // Validate form
    if (!usernameOrEmail || !password) {
      setError('Please fill in all fields');
      if (!usernameOrEmail) setFieldError(prev => ({ ...prev, usernameOrEmail: 'Username or email is required' }));
      if (!password) setFieldError(prev => ({ ...prev, password: 'Password is required' }));
      return;
    }
    
    try {
      setLoading(true);
      console.log('Attempting login with:', { usernameOrEmail });
      const result = await login({ usernameOrEmail, password });
      
      if (result && result.success) {
        console.log('Login successful:', result.user);
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(result.user));
        navigate('/', { replace: true });
      } else {
        console.error('Login failed:', result.error);
        if (result.field) {
          // Provide more user-friendly error messages
          let errorMessage = result.error;
          
          // Make the error messages more helpful
          if (result.field === 'usernameOrEmail' && result.error.includes('No account found')) {
            errorMessage = 'No account found with this username or email. Please check your spelling or register a new account.';
          } else if (result.field === 'password' && result.error.includes('Incorrect password')) {
            errorMessage = 'Incorrect password. Please try again or use the forgot password link.';
          }
          
          setFieldError(prev => ({ ...prev, [result.field]: errorMessage }));
        } else {
          setError(result.error || 'Login failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Login</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="usernameOrEmail">Username or Email</label>
            <input
              type="text"
              id="usernameOrEmail"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              placeholder="Enter your username or email"
              disabled={loading}
              className={fieldError.usernameOrEmail ? 'error-input' : ''}
            />
            {fieldError.usernameOrEmail && (
              <div className="field-error">{fieldError.usernameOrEmail}</div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
              className={fieldError.password ? 'error-input' : ''}
            />
            {fieldError.password && (
              <div className="field-error">{fieldError.password}</div>
            )}
            <div className="forgot-password-link">
              <Link to="/forgot-password">Forgot Password?</Link>
            </div>
          </div>
          
          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;