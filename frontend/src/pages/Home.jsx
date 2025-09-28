import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/Home.css';

const Home = () => {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        const response = await axios.get(`${API_URL}/events`);
        // Filter future events and sort by date
        const futureEvents = response.data
          .filter(event => new Date(event.date) > new Date())
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 3); // Get only the 3 nearest events
        setUpcomingEvents(futureEvents);
        setError('');
      } catch (err) {
        console.error('Error fetching upcoming events:', err);
        setError('Failed to load upcoming events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingEvents();
  }, []);

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Welcome to Ceylon Compass</h1>
        <h2 className="hero-headline">Stay Connected to Sri Lankan Culture Wherever You Are</h2>
        <p className="subtitle">Find or share events, places to stay, and restaurants that bring a taste of home</p>
      </div>

      <div className="upcoming-events-section">
        <h2>Upcoming Events</h2>
        {loading ? (
          <div className="loading">Loading upcoming events...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : upcomingEvents.length === 0 ? (
          <div className="empty-message">No upcoming events found</div>
        ) : (
          <div className="events-grid">
            {upcomingEvents.map((event) => (
              <Link to={`/events/${event._id}`} key={event._id} className="event-card">
                <div className="event-image">
                  <img src={event.image} alt={event.title} />
                </div>
                <div className="event-content">
                  <h3>{event.title}</h3>
                  <p className="event-date">
                    {new Date(event.date).toLocaleDateString()} at {event.time}
                  </p>
                  <p className="event-location">
                    {event.city}, {event.country}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="features-section">
        <h2>Why Choose Us</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Community Connection</h3>
            <p>Connect with the Sri Lankan community in your area through events and meetups</p>
          </div>
          <div className="feature-card">
            <h3>Cultural Discovery</h3>
            <p>Find authentic Sri Lankan restaurants and cultural experiences wherever you are</p>
          </div>
          <div className="feature-card">
            <h3>Accommodation Options</h3>
            <p>Discover Sri Lankan-friendly accommodation listings from trusted community members</p>
          </div>
          <div className="feature-card">
            <h3>Easy Information Sharing</h3>
            <p>Add your own events, restaurants, and accommodations to help others connect</p>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <h2>Ready to Get Started?</h2>
        <p>Join thousands of satisfied customers who trust us for their events and accommodations</p>
        <Link to="/register" className="btn btn-primary">Sign Up Now</Link>
      </div>
    </div>
  );
};

export default Home; 