import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocation as useLocationContext } from '../context/LocationContext';
import LocationFilter from '../components/LocationFilter';
import '../styles/Listings.css';

const Events = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
      console.log('Setting initial user location filters for events:', newFilters);
      setFilters(newFilters);
      setInitialLoad(false);
    } else if (!user && initialLoad) {
      // If no user is logged in, show all events
      const newFilters = {
        country: '',
        city: '',
        showAll: true
      };
      console.log('No user detected, showing all events');
      setFilters(newFilters);
      setInitialLoad(false);
    }
  }, [user, initialLoad]);

  // Fetch events when filters change or component mounts
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        let url = 'http://localhost:5000/api/events';
        
        // Add query parameters based on filters
        const params = new URLSearchParams();
        
        // We need to check if filters.showAll is false and if we have country/city data
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
        
        // Always sort by date in ascending order (upcoming events first)
        params.append('sort', 'asc');
        
        const queryString = params.toString();
        if (queryString) {
          url += `?${queryString}`;
        }

        console.log(`Fetching events with filters:`, filters);
        console.log(`Fetching events from ${url}`);

        const response = await axios.get(url);
        console.log(`Received ${response.data.length} events:`, response.data);
        
        // Create today's date at 00:00:00 for accurate date comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Filter out any past events on the client side as a backup
        let filteredEvents = response.data.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= today;
        });
        
        // Sort events by date (upcoming first)
        filteredEvents.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateA - dateB;
        });
        
        // Check if the response data appears to be filtered correctly
        if (!filters.showAll && filters.country) {
          filteredEvents = filteredEvents.filter(event => 
            event.country === filters.country && 
            (!filters.city || event.city === filters.city)
          );
        }
        
        setEvents(filteredEvents);
        setError('');
      } catch (error) {
        console.error('Error fetching events:', error);
        setError('Failed to load events. Please try again later.');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we have initialized the filters
    if (!initialLoad) {
      fetchEvents();
    }
  }, [filters, initialLoad]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleAddEvent = () => {
    if (isAuthenticated) {
      navigate('/events/add');
    } else {
      if (window.confirm('You need to log in first to add a new event. Would you like to log in now?')) {
        navigate('/login');
      }
    }
  };

  return (
    <div className="listings-container">
      <div className="listings-header">
        <h1 className="listings-title">Events</h1>
        <p className="listings-subtitle">
          Browse upcoming events.
        </p>
      </div>
      
      <div className="filter-actions-container">
        <LocationFilter 
          onFilterChange={handleFilterChange}
          initialFilters={filters}
        />
        
        <div className="sort-and-add-container">
          <div className="add-event-container">
            <button onClick={handleAddEvent} className="add-new-event">
              <i className="fas fa-plus"></i>
              Add New Event
            </button>
          </div>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading-spinner">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="empty-message">
          No events found. Try changing your filters or location.
        </div>
      ) : (
        <div className="listings-grid">
          {events.map((event) => (
            <Link
              to={`/events/${event._id}`}
              key={event._id}
              className="listing-card"
            >
              <div className="card-image">
                <img src={event.image} alt={event.title} />
              </div>
              <div className="card-content">
                <h3 className="card-title">{event.title}</h3>
                <p className="card-location">
                  {event.city}, {event.country}
                </p>
                <p className="card-category">{event.category}</p>
                <p className="card-date">
                  {new Date(event.date).toLocaleDateString()} at {event.time}
                </p>
                <p className="card-price">
                  {event.price > 0 ? `$${event.price}` : 'Free'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Events; 