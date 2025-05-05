import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/EventCards.css";

const EventCards = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Get the auth token from localStorage
        const token = localStorage.getItem('token');
        
        const response = await fetch("http://localhost:5000/api/events", {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch events');
        }

        const data = await response.json();
        console.log("Fetched events:", data);
        setEvents(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleEventClick = (eventId) => {
    console.log("Clicking event with ID:", eventId);
    navigate(`/events/${eventId}`);
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (loading) return <div className="loading">Loading events...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="events-container">
      <h1 className="events-title">Upcoming Cultural Events</h1>
      <div className="event-grid">
        {events.map((event) => (
          <div 
            key={event._id} 
            className="event-card"
            onClick={() => handleEventClick(event._id)}
          >
            <div className="event-image-container">
              <img
                src={event.image || "https://source.unsplash.com/800x600/?culture,festival"}
                alt={event.title}
                className="event-poster"
              />
              <div className="event-date-badge">
                {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
            <div className="event-info">
              <h3 className="event-title">{event.title}</h3>
              <div className="event-location">
                <i className="fas fa-map-marker-alt"></i>
                <span>{`${event.city}, ${event.country}`}</span>
              </div>
              <p className="event-desc">{event.description}</p>
              <div className="event-footer">
                <span className="event-full-date">{formatDate(event.date)}</span>
                <button className="view-details-btn">View Details</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventCards;
