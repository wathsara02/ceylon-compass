import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/Details.css';

const EventDetails = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      console.log(`Fetching event details for ID: ${id}`);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${API_URL}/events/${id}`);
      console.log('Event data received:', response.data);
      setEvent(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching event details:', err);
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading event details...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!event) {
    return <div className="error-message">Event not found</div>;
  }

  return (
    <div className="simplified-details-container">
      <h1 className="event-title">{event.title}</h1>
      <h2 className="event-location">{event.city}, {event.country}</h2>
      
      <div className="event-content">
        <div className="event-image-container">
          <img src={event.image} alt={event.title} className="event-image" />
        </div>
        
        <div className="event-info">
          <div className="event-description">
            <p>{event.description}</p>
          </div>
          
          <div className="event-metadata">
            <div className="metadata-item">
              <strong>Date:</strong> {new Date(event.date).toLocaleDateString()}
            </div>
            <div className="metadata-item">
              <strong>Time:</strong> {event.time}
            </div>
            <div className="metadata-item">
              <strong>Category:</strong> {event.category}
            </div>
            <div className="metadata-item">
              <strong>Address:</strong> {event.address || 'Not specified'}
            </div>
            {event.price > 0 && (
              <div className="metadata-item">
                <strong>Price:</strong> ${event.price}
              </div>
            )}
          </div>
          
          <div className="organizer-section">
            <h3 className="section-heading">For More Info Contact:</h3>
            <div className="organizer-details">
              <div className="metadata-item">
                <strong>Organizer:</strong> {event.organizer?.name || 'Not specified'}
              </div>
              <div className="metadata-item">
                <strong>Phone:</strong> {event.organizer?.contactNumber || 'Not specified'}
              </div>
              <div className="metadata-item">
                <strong>Email:</strong> {event.organizer?.email || 'Not specified'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails; 