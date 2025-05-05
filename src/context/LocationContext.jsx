import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const LocationContext = createContext();

export const useLocation = () => {
  return useContext(LocationContext);
};

export const LocationProvider = ({ children }) => {
  const { user } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Update location when user logs in or changes profile
  useEffect(() => {
    if (user) {
      setSelectedCountry(user.country || '');
      setSelectedCity(user.city || '');
    }
  }, [user]);

  // Fetch countries when context is mounted or refreshed
  useEffect(() => {
    fetchCountries();
  }, [lastRefresh]);

  // Fetch all countries from the database
  const fetchCountries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching countries from API...");
      const response = await axios.get('http://localhost:5000/api/locations/countries');
      console.log("Countries API response:", response.data);
      setCountries(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching countries:', err);
      setError('Failed to load countries');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch cities for a specific country from the database
  const fetchCitiesByCountry = useCallback(async (country) => {
    if (!country) {
      console.log("No country provided to fetchCitiesByCountry");
      setCities([]);
      return [];
    }

    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching cities for country: ${country}`);
      const url = `http://localhost:5000/api/locations/cities/${encodeURIComponent(country)}`;
      console.log("Cities API URL:", url);
      const response = await axios.get(url);
      console.log("Cities API response:", response.data);
      setCities(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching cities:', err);
      setError('Failed to load cities');
      setCities([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Update selected location
  const updateLocation = useCallback((country, city) => {
    setSelectedCountry(country);
    setSelectedCity(city);
  }, []);

  // Force refresh of location data
  const refreshLocations = useCallback(() => {
    setLastRefresh(Date.now());
  }, []);

  // Fetch cities when country changes
  useEffect(() => {
    if (selectedCountry) {
      // Use inline function to avoid dependency on fetchCitiesByCountry
      const fetchCities = async () => {
        if (!selectedCountry) return;
        
        try {
          setLoading(true);
          setError(null);
          console.log(`Fetching cities for country: ${selectedCountry}`);
          const url = `http://localhost:5000/api/locations/cities/${encodeURIComponent(selectedCountry)}`;
          console.log("Cities API URL:", url);
          const response = await axios.get(url);
          console.log("Cities API response:", response.data);
          setCities(response.data);
        } catch (err) {
          console.error('Error fetching cities:', err);
          setError('Failed to load cities');
          setCities([]);
        } finally {
          setLoading(false);
        }
      };
      
      fetchCities();
    }
  }, [selectedCountry]);

  const value = {
    selectedCountry,
    selectedCity,
    countries,
    cities,
    loading,
    error,
    updateLocation,
    fetchCountries,
    fetchCitiesByCountry,
    refreshLocations
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}; 