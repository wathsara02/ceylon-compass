import React, { useEffect, useState } from 'react';
import AccomodationCard from './AccomodationCard'; // Import the card component
import '../styles/AccomodationList.css';

function AccommodationList({ filters }) {
  const [accommodations, setAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const query = new URLSearchParams();

    if (filters.country) query.append('country', filters.country);
    if (filters.city) query.append('city', filters.city);
    if (filters.minPrice !== undefined) query.append('minPrice', filters.minPrice);
    if (filters.maxPrice !== undefined) query.append('maxPrice', filters.maxPrice);

    // Fetch data from backend with query string
    fetch(`http://localhost:5000/api/accommodations?${query.toString()}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('No accommodations found with the selected filters');
        }
        return res.json();
      })
      .then(data => {
        setAccommodations(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'An unexpected error occurred');
        setLoading(false);
      });
  }, [filters]);

  if (loading) return <p className="loading">Loading accommodations...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="accommodation-container">
      {accommodations.length > 0 ? (
        accommodations.map((item) => (
          <AccomodationCard
            key={item._id}
            id={item._id}
            title={item.name}
            photo={item.images && item.images.length > 0 ? item.images[0] : "https://via.placeholder.com/300x200?text=Accommodation+Image+Not+Available"}
            location={{ country: item.country, city: item.city }}
            type={item.type}
          />
        ))
      ) : (
        <p>No accommodations found for the selected filters.</p>
      )}
    </div>
  );
}

export default AccommodationList;
