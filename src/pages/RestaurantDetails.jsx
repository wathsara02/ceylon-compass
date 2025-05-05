import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FaGlobe, FaExternalLinkAlt } from 'react-icons/fa';
import '../styles/Details.css';

const RestaurantDetails = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRestaurant();
  }, [id]);

  const fetchRestaurant = async () => {
    try {
      setLoading(true);
      console.log(`Fetching restaurant details for ID: ${id}`);
      const response = await axios.get(`http://localhost:5000/api/restaurants/${id}`);
      console.log('Restaurant data received:', response.data);
      
      // Check if restaurant data is missing website field
      if (response.data && !('website' in response.data)) {
        console.log('Website field is missing from restaurant data');
      } else {
        console.log('Website field value:', response.data.website === '' ? '(empty string)' : response.data.website);
      }
      
      // If we got this far, let's explicitly set an actual website for testing
      const restaurantData = {
        ...response.data,
        website: response.data.website || 'restaurantwebsite.com'
      };
      console.log('Modified restaurant data with website:', restaurantData.website);
      
      setRestaurant(restaurantData);
      setError('');
    } catch (err) {
      console.error('Error fetching restaurant details:', err);
      setError('Failed to load restaurant details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading restaurant details...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!restaurant) {
    return <div className="error-message">Restaurant not found</div>;
  }

  console.log('Rendering restaurant with website:', restaurant.website);

  const websiteUrl = restaurant.website || '';
  const formattedWebsiteUrl = websiteUrl.startsWith('http') 
    ? websiteUrl 
    : websiteUrl ? `https://${websiteUrl}` : '';

  return (
    <div className="simplified-details-container">
      <h1 className="event-title">{restaurant.name}</h1>
      <h2 className="event-location">{restaurant.city}, {restaurant.country}</h2>
      
      <div className="event-content">
        <div className="event-image-container">
          <img src={restaurant.image} alt={restaurant.name} className="event-image" />
        </div>
        
        <div className="event-info">
          <div className="event-description">
            <p>{restaurant.description}</p>
          </div>
          
          <div className="event-metadata">
            <div className="metadata-item">
              <strong>Cuisine:</strong> {restaurant.cuisine}
            </div>
            <div className="metadata-item">
              <strong>Opening Hours:</strong> {restaurant.openingHours}
            </div>
            <div className="metadata-item">
              <strong>Address:</strong> {restaurant.address || 'Not specified'}
            </div>
          </div>
          
          <div className="organizer-section">
            <h3 className="section-heading">For More Info Contact:</h3>
            <div className="organizer-details">
              <div className="metadata-item">
                <strong>Restaurant:</strong> {restaurant.name}
              </div>
              <div className="metadata-item">
                <strong>Phone:</strong> {restaurant.contactNumber || 'Not specified'}
              </div>
              <div className="metadata-item website-item">
                <strong>Visit Website:</strong> 
                {formattedWebsiteUrl ? (
                  <a 
                    href={formattedWebsiteUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="website-link"
                  >
                    <FaGlobe className="website-icon" /> {websiteUrl} <FaExternalLinkAlt className="external-link-icon" />
                  </a>
                ) : (
                  <span className="not-available">Not available</span>
                )}
              </div>
            </div>
          </div>
          
          {restaurant.images && restaurant.images.length > 0 && (
            <div className="gallery-section">
              <h3 className="section-heading">Photo Gallery</h3>
              <div className="restaurant-gallery">
                {restaurant.images.map((img, index) => (
                  <div className="gallery-item" key={index}>
                    <img src={img} alt={`${restaurant.name} - Photo ${index + 1}`} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetails; 