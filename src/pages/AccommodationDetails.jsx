import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/Details.css';

const AccommodationDetails = () => {
  const { id } = useParams();
  const [accommodation, setAccommodation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAccommodation();
  }, [id]);

  const fetchAccommodation = async () => {
    try {
      setLoading(true);
      console.log(`Fetching accommodation details for ID: ${id}`);
      const response = await axios.get(`http://localhost:5000/api/accommodations/${id}`);
      console.log('Accommodation data received:', response.data);
      
      // Store the accommodation data
      const accommodationData = response.data;
      
      // If accommodation has a createdBy field, fetch the user data
      if (accommodationData.createdBy) {
        try {
          console.log(`Fetching user data for ID: ${accommodationData.createdBy}`);
          const userResponse = await axios.get(`http://localhost:5000/api/users/${accommodationData.createdBy}`);
          console.log('User data received:', userResponse.data);
          
          // Add user data to accommodation object
          accommodationData.createdByUser = userResponse.data;
        } catch (userErr) {
          console.error('Error fetching user details:', userErr);
          // Continue even if user data can't be fetched
        }
      }
      
      setAccommodation(accommodationData);
      setError('');
    } catch (err) {
      console.error('Error fetching accommodation details:', err);
      setError('Failed to load accommodation details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading accommodation details...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!accommodation) {
    return <div className="error-message">Accommodation not found</div>;
  }

  return (
    <div className="simplified-details-container">
      <h1 className="event-title">{accommodation.name}</h1>
      <h2 className="event-location">{accommodation.city}, {accommodation.country}</h2>
      
      <div className="event-content">
        <div className="event-image-container">
          {accommodation.imageUrl ? (
            <img src={accommodation.imageUrl} alt={accommodation.name} className="event-image" />
          ) : accommodation.images && accommodation.images.length > 0 ? (
            <img src={accommodation.images[0]} alt={accommodation.name} className="event-image" />
          ) : (
            <div className="no-image">No image available</div>
          )}
        </div>
        
        <div className="event-info">
          <div className="event-description">
            <p>{accommodation.description}</p>
          </div>
          
          <div className="event-metadata">
            <div className="metadata-item">
              <strong>Price:</strong> ${accommodation.price} per night
            </div>
            <div className="metadata-item">
              <strong>Type:</strong> {accommodation.type || 'Not specified'}
            </div>
            <div className="metadata-item">
              <strong>Address:</strong> {accommodation.address || 'Not specified'}
            </div>
            {accommodation.amenities && accommodation.amenities.length > 0 && (
              <div className="metadata-item">
                <strong>Amenities:</strong> {accommodation.amenities.join(', ')}
              </div>
            )}
          </div>
          
          <div className="contact-section">
            <h3 className="section-heading">Contact Information</h3>
            <div className="contact-details">
              {accommodation.contactNumber && (
                <div className="metadata-item">
                  <strong>Contact Number:</strong> {accommodation.contactNumber}
                </div>
              )}
              {accommodation.email && (
                <div className="metadata-item">
                  <strong>Email:</strong> {accommodation.email}
                </div>
              )}
              <div className="metadata-item">
                <strong>Listed by:</strong> 
                {accommodation.createdByUser ? 
                  (accommodation.createdByUser.username || accommodation.createdByUser.name || 'Anonymous') :
                  (accommodation.ownerName || 'Contact via provided details')
                }
              </div>
              {accommodation.website && (
                <div className="metadata-item">
                  <strong>Website:</strong> <a href={accommodation.website} target="_blank" rel="noopener noreferrer">{accommodation.website}</a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccommodationDetails; 