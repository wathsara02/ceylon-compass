import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/RestaurantFilter.css';

const RestaurantFilter = ({ onFilterChange }) => {
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch countries when component mounts
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/locations/countries');
        setCountries(response.data || []);
        setError('');
      } catch (err) {
        console.error('Error fetching countries:', err);
        setError('Failed to load countries');
        setCountries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

  // Fetch cities when country changes
  const fetchCities = async (country) => {
    if (!country) {
      setCities([]);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/locations/cities/${encodeURIComponent(country)}`);
      setCities(response.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching cities:', err);
      setError('Failed to load cities');
      setCities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCountryChange = async (event) => {
    const country = event.target.value;
    setSelectedCountry(country);
    setSelectedCity(''); // Reset city when country changes
    await fetchCities(country);
    onFilterChange && onFilterChange({ country, city: '' });
  };

  const handleCityChange = (event) => {
    const city = event.target.value;
    setSelectedCity(city);
    onFilterChange && onFilterChange({ country: selectedCountry, city });
  };

  return (
    <div className="restaurant-filter">
      <div className="filter-section">
        <label htmlFor="country">Country</label>
        <select 
          id="country" 
          value={selectedCountry} 
          onChange={handleCountryChange}
          disabled={loading}
        >
          <option value="">Select a country</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-section">
        <label htmlFor="city">City</label>
        <select
          id="city"
          value={selectedCity}
          onChange={handleCityChange}
          disabled={!selectedCountry || loading}
        >
          <option value="">Select a city</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>
      {error && <div className="error-message">{error}</div>}
      <button className="register-seller-button">
        <Link to="/SellerRegistration" className="register-seller-link">
          Register as a Seller
        </Link>
      </button>
    </div>
  );
};

export default RestaurantFilter;
