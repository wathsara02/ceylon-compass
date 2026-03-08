import React, { useState, useEffect } from 'react';
import { useLocation as useLocationContext } from '../context/LocationContext';
import '../styles/Listings.css';

const LocationFilter = ({ onFilterChange, initialFilters }) => {
  const { countries, cities, fetchCitiesByCountry, loading: contextLoading, error: contextError } = useLocationContext();
  const [filters, setFilters] = useState(initialFilters || {
    country: '',
    city: '',
    showAll: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('LocationFilter initialized with filters:', initialFilters);
  }, []);

  useEffect(() => {
    if (initialFilters && JSON.stringify(initialFilters) !== JSON.stringify(filters)) {
      console.log('LocationFilter: Updating filters from initialFilters:', initialFilters);
      setFilters(initialFilters);
      
      if (initialFilters.country && initialFilters.country !== filters.country) {
        console.log('LocationFilter: Fetching cities for initial country:', initialFilters.country);
        fetchCitiesByCountry(initialFilters.country);
      }
    }
  }, [initialFilters, fetchCitiesByCountry, filters]);

  useEffect(() => {
    if (contextError) setError(contextError);
    setLoading(contextLoading);
  }, [contextError, contextLoading]);

  const handleCountryChange = async (e) => {
    const country = e.target.value;
    const newFilters = {
      ...filters,
      country,
      city: '',
      showAll: false
    };
    console.log('LocationFilter: Country changed to', country);
    setFilters(newFilters);
    await fetchCitiesByCountry(country);
    onFilterChange(newFilters);
  };

  const handleCityChange = (e) => {
    const city = e.target.value;
    const newFilters = {
      ...filters,
      city,
      showAll: false
    };
    console.log('LocationFilter: City changed to', city);
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleShowAll = () => {
    const newShowAll = !filters.showAll;
    const newFilters = {
      ...filters,
      showAll: newShowAll,
      country: newShowAll ? '' : filters.country,
      city: newShowAll ? '' : filters.city
    };
    console.log('LocationFilter: Show All toggled to', newShowAll);
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  useEffect(() => {
    if (filters.country && cities.length === 0) {
      console.log('LocationFilter: Fetching cities for country', filters.country);
      fetchCitiesByCountry(filters.country);
    }
  }, [filters.country, cities.length, fetchCitiesByCountry]);

  if (error) {
    console.error('Filter Error:', error);
  }

  return (
    <div className="filters-container">
      <div className="filter-group">
        <label htmlFor="country">Country</label>
        <select
          id="country"
          value={filters.country}
          onChange={handleCountryChange}
          disabled={filters.showAll || loading}
        >
          <option value="">Select Country</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </div>
      
      <div className="filter-group">
        <label htmlFor="city">City</label>
        <select
          id="city"
          value={filters.city}
          onChange={handleCityChange}
          disabled={!filters.country || filters.showAll || loading}
        >
          <option value="">Select City</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>
      
      <div className="toggle-container">
        <label className="toggle-label">
          <span>Show All</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={filters.showAll}
              onChange={toggleShowAll}
            />
            <span className="toggle-slider"></span>
          </label>
        </label>
        <span className="toggle-text">
          {filters.showAll ? 'Showing all locations' : 'Showing filtered location'}
        </span>
      </div>
    </div>
  );
};

export default LocationFilter; 