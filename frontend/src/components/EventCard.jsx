import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/EventCard.css';

const EventCard = ({ id, title, image, location, category, date, time, price }) => {
  const [imgSrc, setImgSrc] = useState(image);
  const navigate = useNavigate();

  const handleImageError = () => {
    setImgSrc("https://via.placeholder.com/300x150?text=Event+Image+Not+Available");
  };

  const handleClick = () => {
    navigate(`/events/${id}`);
  };

  // Format date nicely
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="event-card" onClick={handleClick}>
      <div className="event-card-image-container">
        <img
          src={imgSrc}
          alt={title || "Event"}
          className="event-card-photo"
          onError={handleImageError}
        />
        {category && (
          <div className="event-card-category">{category}</div>
        )}
      </div>
      <div className="event-card-details">
        <h3 className="event-card-title">{title}</h3>
        <p className="event-card-location">
          <i className="fas fa-map-marker-alt"></i>
          {location?.city}, {location?.country}
        </p>
        {date && (
          <p className="event-card-date">
            <i className="far fa-calendar"></i>
            {formatDate(date)} {time && `at ${time}`}
          </p>
        )}
        {price !== undefined && (
          <p className="event-card-price">
            {price > 0 ? `$${price}` : 'Free'}
          </p>
        )}
      </div>
    </div>
  );
};

export default EventCard; 