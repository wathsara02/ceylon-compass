import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLocation as useLocationContext } from '../context/LocationContext';
import '../styles/Listings.css';
import RestaurantCard from '../components/RestaurantCard';
import LocationFilter from '../components/LocationFilter';

const Restaurants = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { fetchCitiesByCountry } = useLocationContext();
  const location = useLocation();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    country: '',
    city: '',
    showAll: false
  });
  const [initialLoad, setInitialLoad] = useState(true);

  // Set initial filters from user data when component mounts
  useEffect(() => {
    if (user && initialLoad) {
      const newFilters = {
        country: user.country || '',
        city: user.city || '',
        showAll: false
      };
      console.log('Setting initial user location filters:', newFilters);
      setFilters(newFilters);
      setInitialLoad(false);
    } else if (!user && initialLoad) {
      // If no user is logged in, show all restaurants
      const newFilters = {
        country: '',
        city: '',
        showAll: true
      };
      console.log('No user detected, showing all restaurants');
      setFilters(newFilters);
      setInitialLoad(false);
    }
  }, [user, initialLoad]);

  // Fetch restaurants when filters change or component mounts
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        let url = 'http://localhost:5000/api/restaurants';
        
        // Add query parameters based on filters
        const params = new URLSearchParams();
        
        // We need to check if filters.showAll is false and if we have country/city data
        // Otherwise, we'll just get everything (equivalent to showAll=true)
        if (!filters.showAll) {
          if (filters.country) {
            params.append('country', filters.country);
            
            // Only add city if country is present
            if (filters.city) {
              params.append('city', filters.city);
            }
          }
        } else {
          // If showAll is true, explicitly set it in the query params
          params.append('showAll', 'true');
        }
        
        const queryString = params.toString();
        if (queryString) {
          url += `?${queryString}`;
        }

        console.log(`Fetching restaurants with filters:`, filters);
        console.log(`Fetching restaurants from ${url}`);
        
        // Public endpoint, no token needed
        const response = await axios.get(url);
        
        console.log(`Received ${response.data.length} restaurants:`, response.data);
        
        // Check if the response data appears to be filtered correctly
        if (!filters.showAll && filters.country) {
          const matchingRestaurants = response.data.filter(restaurant => 
            restaurant.country === filters.country && 
            (!filters.city || restaurant.city === filters.city)
          );
          
          if (matchingRestaurants.length !== response.data.length) {
            console.warn(`Warning: Not all restaurants match the filter criteria. ${matchingRestaurants.length} match out of ${response.data.length}.`);
            // If backend filtering isn't working, we can do it client-side
            setRestaurants(matchingRestaurants);
          } else {
            setRestaurants(response.data);
          }
        } else {
          setRestaurants(Array.isArray(response.data) ? response.data : []);
        }
        
        setError('');
      } catch (error) {
        console.error('Error fetching restaurants:', error);
        setError(error.response?.data?.message || 'Failed to load restaurants. Please try again later.');
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we have initialized the filters 
    // (either from user data or default "show all")
    if (!initialLoad) {
      fetchRestaurants();
    }
  }, [filters, initialLoad]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleAddRestaurant = () => {
    if (isAuthenticated) {
      navigate('/restaurants/add');
    } else {
      if (window.confirm('You need to log in first to add a new restaurant. Would you like to log in now?')) {
        navigate('/login');
      }
    }
  };

  return (
    <div className="listings-container">
      <div className="listings-header">
        <h1 className="listings-title">Restaurants</h1>
      </div>
      
      <div className="filter-actions-container">
        <LocationFilter 
          onFilterChange={handleFilterChange}
          initialFilters={filters}
        />
        
        <div className="add-event-container">
          <button onClick={handleAddRestaurant} className="add-new-event">
            <i className="fas fa-plus"></i>
            Add New Restaurant
          </button>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading-spinner">Loading restaurants...</div>
      ) : restaurants.length === 0 ? (
        <div className="empty-message">
          No restaurants found. Try changing your filters or location.
        </div>
      ) : (
        <div className="listings-grid">
          {restaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant._id}
              id={restaurant._id}
              title={restaurant.name}
              image={restaurant.image}
              location={{
                country: restaurant.country,
                city: restaurant.city
              }}
              cuisine={restaurant.cuisine}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Restaurants; 