import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AccomodationCard.css';

const AccomodationCard = ({ id, title, photo, location, type }) => {
  const [imgSrc, setImgSrc] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log(`AccomodationCard ${id} - Photo URL:`, photo);
    
    if (photo) {
      setImgSrc(photo);
    } else {
      setImgSrc("https://via.placeholder.com/300x200?text=Accommodation+Image+Not+Available");
    }
  }, [photo, id]);

  const handleImageError = () => {
    console.log(`Image failed to load for accommodation ${id}, using placeholder`);
    setImgSrc("https://via.placeholder.com/300x200?text=Accommodation+Image+Not+Available");
  };

  const handleClick = () => {
    console.log(`Navigating to accommodation details for ${id}`);
    navigate(`/accommodations/${id}`);
  };

  return (
    <div className="accommodation-card" onClick={handleClick}>
      <div className="accommodation-card-image-container">
        <img
          src={imgSrc}
          alt={title || "Accommodation"}
          className="accommodation-card-photo"
          onError={handleImageError}
        />
        {type && (
          <div className="accommodation-card-type">{type}</div>
        )}
      </div>
      <div className="accommodation-card-details">
        <h3 className="accommodation-card-title">{title}</h3>
        <p className="accommodation-card-location">
          <i className="fas fa-map-marker-alt"></i>
          {location?.city}, {location?.country}
        </p>
      </div>
    </div>
  );
};

export default AccomodationCard;
