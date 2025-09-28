import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/RestaurantCard.css';

const RestaurantCard = ({ id, title, image, location, cuisine }) => {
  const [imgSrc, setImgSrc] = useState(image);
  const navigate = useNavigate();

  const handleImageError = () => {
    setImgSrc("https://via.placeholder.com/300x150?text=Restaurant+Image+Not+Available");
  };

  const handleClick = () => {
    navigate(`/restaurants/${id}`);
  };

  return (
    <div className="restaurant-card" onClick={handleClick}>
      <div className="restaurant-card-image-container">
        <img
          src={imgSrc}
          alt={title || "Restaurant"}
          className="restaurant-card-photo"
          onError={handleImageError}
        />
        {cuisine && (
          <div className="restaurant-card-cuisine">{cuisine}</div>
        )}
      </div>
      <div className="restaurant-card-details">
        <h3 className="restaurant-card-title">{title}</h3>
        <p className="restaurant-card-location">
          <i className="fas fa-map-marker-alt"></i>
          {location?.city}, {location?.country}
        </p>
      </div>
    </div>
  );
};

export default RestaurantCard; 