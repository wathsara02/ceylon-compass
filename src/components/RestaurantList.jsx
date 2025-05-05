import React, { useState, useEffect } from 'react';
import RestaurantCard from './RestaurantCard';
import '../styles/RestaurantList.css';

const RestaurantList = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        console.log("Fetching restaurants from API...");
        const response = await fetch('http://localhost:5000/api/restaurants', {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.error("Restaurants API error:", response.status, response.statusText);
          throw new Error(`Failed to fetch restaurants (${response.status})`);
        }

        const data = await response.json();
        console.log("Fetched restaurants:", data); // Enhanced debugging
        
        if (!Array.isArray(data)) {
          console.error("API did not return an array:", typeof data, data);
          setRestaurants([]);
        } else {
          console.log(`Loaded ${data.length} restaurants`);
          setRestaurants(data);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching restaurants:", err);
        setError(err.message || 'An unexpected error occurred');
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  if (loading) return (
    <div className="restaurant-list-loading">
      <div className="loading-spinner"></div>
      <p>Loading restaurants...</p>
    </div>
  );

  if (error) return (
    <div className="restaurant-list-error">
      <p>{error}</p>
      <button onClick={() => window.location.reload()}>Try Again</button>
    </div>
  );

  return (
    <div className="restaurant-list-container">
      <div className="restaurant-list">
        {restaurants.length > 0 ? (
          restaurants.map(restaurant => (
            <RestaurantCard
              key={restaurant._id}
              id={restaurant._id}
              title={restaurant.name}
              image={restaurant.image}
              location={{
                city: restaurant.city,
                country: restaurant.country
              }}
              cuisine={restaurant.cuisine}
            />
          ))
        ) : (
          <p>No restaurants found. Please try a different filter or check back later.</p>
        )}
      </div>
    </div>
  );
};

export default RestaurantList; 