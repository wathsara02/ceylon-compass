import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: '',
    city: ''
  });
  
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (formData.country) {
      fetchCities(formData.country);
    } else {
      setCities([]);
    }
  }, [formData.country]);

  const fetchCountries = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/locations/countries');
      setCountries(response.data);
    } catch (err) {
      console.error('Error fetching countries:', err);
      setError('Failed to load countries. Please try again later.');
    }
  };

  const fetchCities = async (country) => {
    if (!country) return;
    
    try {
      const encodedCountry = encodeURIComponent(country);
      const response = await axios.get(`http://localhost:5000/api/locations/cities/${encodedCountry}`);
      setCities(response.data);
    } catch (err) {
      console.error('Error fetching cities:', err);
      setError('Failed to load cities. Please try again later.');
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field-specific error when user changes the value
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Reset city when country changes
    if (name === 'country') {
      setFormData(prev => ({
        ...prev,
        city: ''
      }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    
    // Validate form
    const newFieldErrors = {};
    let hasError = false;
    
    if (!formData.username) {
      newFieldErrors.username = 'Username is required';
      hasError = true;
    }
    
    if (!formData.email) {
      newFieldErrors.email = 'Email is required';
      hasError = true;
    } else {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newFieldErrors.email = 'Please enter a valid email address';
        hasError = true;
      }
    }
    
    if (!formData.password) {
      newFieldErrors.password = 'Password is required';
      hasError = true;
    } else if (formData.password.length < 6) {
      newFieldErrors.password = 'Password must be at least 6 characters';
      hasError = true;
    }
    
    if (!formData.confirmPassword) {
      newFieldErrors.confirmPassword = 'Please confirm your password';
      hasError = true;
    } else if (formData.password !== formData.confirmPassword) {
      newFieldErrors.confirmPassword = 'Passwords do not match';
      hasError = true;
    }
    
    if (!formData.country) {
      newFieldErrors.country = 'Please select a country';
      hasError = true;
    }
    
    if (!formData.city) {
      newFieldErrors.city = 'Please select a city';
      hasError = true;
    }
    
    if (hasError) {
      setFieldErrors(newFieldErrors);
      return;
    }
    
    try {
      setLoading(true);
      
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...registerData } = formData;
      
      const result = await register(registerData);
      if (result.success) {
        navigate('/');
      } else {
        // Handle registration error
        if (result.field) {
          // Make error messages more specific for username and email
          let errorMessage = result.error;
          
          // Format field-specific errors to be more clear
          if (result.field === 'username' && result.error.includes('exists')) {
            errorMessage = 'This username is already taken. Please choose another one.';
          } else if (result.field === 'email' && result.error.includes('exists')) {
            errorMessage = 'This email is already registered. Please use a different email or try logging in.';
          }
          
          // Set the field-specific error
          setFieldErrors({
            [result.field]: errorMessage
          });
          
          // Make sure we don't set a general error for field-specific issues
          setError('');
        } else {
          // Generic error
          setError(result.error || 'Failed to register');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Register</h1>
        
        {/* Only show general errors that aren't field-specific */}
        {error && !fieldErrors.username && !fieldErrors.email && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
              disabled={loading}
              className={fieldErrors.username ? 'error-input' : ''}
            />
            {fieldErrors.username && <div className="field-error">{fieldErrors.username}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              disabled={loading}
              className={fieldErrors.email ? 'error-input' : ''}
            />
            {fieldErrors.email && <div className="field-error">{fieldErrors.email}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              disabled={loading}
              className={fieldErrors.password ? 'error-input' : ''}
            />
            {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              disabled={loading}
              className={fieldErrors.confirmPassword ? 'error-input' : ''}
            />
            {fieldErrors.confirmPassword && <div className="field-error">{fieldErrors.confirmPassword}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="country">Country</label>
            <select
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              disabled={loading}
              className={fieldErrors.country ? 'error-input' : ''}
            >
              <option value="">Select Country</option>
              {countries.map(country => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            {fieldErrors.country && <div className="field-error">{fieldErrors.country}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="city">City</label>
            <select
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              disabled={!formData.country || loading}
              className={fieldErrors.city ? 'error-input' : ''}
            >
              <option value="">Select City</option>
              {cities.map(city => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            {fieldErrors.city && <div className="field-error">{fieldErrors.city}</div>}
          </div>
          
          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register; 