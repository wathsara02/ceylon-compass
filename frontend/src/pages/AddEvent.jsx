import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import VerificationPopup from '../components/VerificationPopup';
import '../styles/Forms.css';

// JWT decoder function
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

const AddEvent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    country: '',
    city: '',
    address: '',
    organizer: {
      name: '',
      contactNumber: '',
      email: ''
    },
    category: '',
    price: '',
    capacity: '',
    image: ''
  });

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Initialize Cloudinary widget
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://widget.cloudinary.com/v2.0/global/all.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Hardcoded countries and cities
  const countries = ['Sri Lanka', 'India', 'Maldives', 'Thailand', 'Malaysia'];
  const cities = {
    'Sri Lanka': ['Colombo', 'Kandy', 'Galle', 'Jaffna', 'Anuradhapura'],
    'India': ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'],
    'Maldives': ['Male', 'Addu City', 'Fuvahmulah', 'Kulhudhuffushi'],
    'Thailand': ['Bangkok', 'Phuket', 'Chiang Mai', 'Pattaya'],
    'Malaysia': ['Kuala Lumpur', 'George Town', 'Malacca City', 'Kota Kinabalu']
  };

  const handleCountryChange = (e) => {
    const country = e.target.value;
    setFormData(prev => ({
      ...prev,
      country,
      city: ''
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('organizer.')) {
      const organizerField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        organizer: {
          ...prev.organizer,
          [organizerField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const openCloudinaryWidget = () => {
    window.cloudinary.openUploadWidget(
      {
        cloudName: 'dzetdg1sz',
        uploadPreset: 'eventsreq',
        sources: ['local', 'url', 'camera'],
        multiple: false,
        defaultSource: 'local',
        styles: {
          palette: {
            window: "#FFFFFF",
            sourceBg: "#f4f4f5",
            windowBorder: "#90a0b3",
            tabIcon: "#000000",
            inactiveTabIcon: "#555a5f",
            menuIcons: "#555a5f",
            link: "#0433ff",
            action: "#339933",
            inProgress: "#0433ff",
            complete: "#339933",
            error: "#cc0000",
            textDark: "#000000",
            textLight: "#fcfffd"
          }
        }
      },
      (error, result) => {
        if (!error && result && result.event === "success") {
          setFormData(prev => ({
            ...prev,
            image: result.info.secure_url
          }));
        }
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You must be logged in to submit an event');
      }

      // Get user from context and localStorage
      const currentUser = user;
      const storedUser = JSON.parse(localStorage.getItem('user'));

      if (!currentUser && !storedUser) {
        throw new Error('User information not found. Please log in again.');
      }

      // Use the user ID from either source
      const userId = currentUser?._id || storedUser?._id || storedUser?.id;
      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }

      // Format the date to ISO string
      const formattedDate = new Date(formData.date).toISOString();

      // Create the event request data with proper types
      const eventReqData = {
        title: formData.title,
        description: formData.description,
        date: formattedDate,
        time: formData.time,
        country: formData.country,
        city: formData.city,
        address: formData.address,
        organizer: {
          name: formData.organizer.name,
          contactNumber: formData.organizer.contactNumber,
          email: formData.organizer.email
        },
        category: formData.category,
        price: Number(formData.price),
        capacity: Number(formData.capacity),
        image: formData.image,
        status: 'pending',
        createdBy: userId
      };

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${API_URL}/eventreq`, eventReqData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data) {
        setShowVerification(true);
      } else {
        throw new Error('No response from server');
      }
    } catch (err) {
      console.error('Error submitting event request:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || err.message || 'Failed to submit event request');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationClose = () => {
    setShowVerification(false);
    navigate('/events');
  };

  return (
    <div className="form-container">
      <h1>Add New Event</h1>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="title">Event Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="time">Time</label>
            <input
              type="time"
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="country">Country</label>
          <select
            id="country"
            name="country"
            value={formData.country}
            onChange={handleCountryChange}
            required
          >
            <option value="">Select Country</option>
            {countries.map(country => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="city">City</label>
          <select
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
            disabled={!formData.country}
          >
            <option value="">Select City</option>
            {formData.country &&
              cities[formData.country].map(city => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="address">Address</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="organizer.name">Organizer Name</label>
          <input
            type="text"
            id="organizer.name"
            name="organizer.name"
            value={formData.organizer.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="organizer.contactNumber">Organizer Contact Number</label>
          <input
            type="tel"
            id="organizer.contactNumber"
            name="organizer.contactNumber"
            value={formData.organizer.contactNumber}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="organizer.email">Organizer Email</label>
          <input
            type="email"
            id="organizer.email"
            name="organizer.email"
            value={formData.organizer.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select Category</option>
            <option value="Food & Culture">Food & Culture</option>
            <option value="Cultural Festival">Cultural Festival</option>
            <option value="Film & Arts">Film & Arts</option>
            <option value="Music & Performance">Music & Performance</option>
            <option value="Arts & Culture">Arts & Culture</option>
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="price">Price</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="capacity">Capacity</label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              min="1"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="image">Event Image</label>
          <button type="button" onClick={openCloudinaryWidget}>
            Upload Image
          </button>
          {formData.image && <img src={formData.image} alt="Event" />}
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Event'}
        </button>
      </form>
      {showVerification && <VerificationPopup onClose={handleVerificationClose} />}
    </div>
  );
};

export default AddEvent;
