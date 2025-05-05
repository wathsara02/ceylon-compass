import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import VerificationPopup from '../components/VerificationPopup';
import '../styles/Details.css';

const AddRestaurant = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    countries, 
    cities, 
    loading: locationLoading, 
    error: locationError, 
    fetchCountries, 
    fetchCitiesByCountry 
  } = useLocation();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [cloudinaryLoaded, setCloudinaryLoaded] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    cuisine: '',
    country: '',
    city: '',
    address: '',
    description: '',
    website: '',
    contactNumber: '',
    openingHours: '',
    images: [],
    cloudName: 'dzetdg1sz',
    uploadPreset: 'restaurants',
    status: 'pending'
  });

  // Load initial data
  useEffect(() => {
    // Load Cloudinary script
    if (window.cloudinary && window.cloudinary.openUploadWidget) {
      setCloudinaryLoaded(true);
    } else if (!document.querySelector('script[src="https://widget.cloudinary.com/v2.0/global/all.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://widget.cloudinary.com/v2.0/global/all.js';
      script.async = true;
      script.onload = () => {
        if (window.cloudinary && window.cloudinary.openUploadWidget) {
          setCloudinaryLoaded(true);
        } else {
          setError('Cloudinary widget failed to initialize. Please refresh the page.');
        }
      };
      script.onerror = () => {
        setError('Failed to load Cloudinary script. Please check your network and try again.');
      };
      document.body.appendChild(script);
    }

    // Fetch countries
    fetchCountries();
  }, []);

  // Fetch cities when country changes
  useEffect(() => {
    if (formData.country) {
      console.log("Fetching cities for country:", formData.country);
      fetchCitiesByCountry(formData.country);
    }
  }, [formData.country]);

  // Update error state if location context has an error
  useEffect(() => {
    if (locationError) {
      setError(locationError);
    }
  }, [locationError]);

  const handleCountryChange = (e) => {
    const country = e.target.value;
    console.log("Country selected:", country);
    setFormData(prev => ({
      ...prev,
      country,
      city: ''
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = () => {
    if (!cloudinaryLoaded || !window.cloudinary || !window.cloudinary.openUploadWidget) {
      setError('Cloudinary widget is not available. Please refresh the page.');
      return;
    }

    window.cloudinary.openUploadWidget(
      {
        cloudName: 'dzetdg1sz',
        uploadPreset: 'restaurants',
        sources: ['local', 'url', 'camera'],
        multiple: true,
        maxFiles: 5,
        resourceType: 'image',
        maxFileSize: 5000000, // 5MB
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
        if (!error && result && result.event === 'success') {
          const imageUrl = result.info.secure_url;
          setUploadedImages(prev => [...prev, imageUrl]);
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, imageUrl]
          }));
        } else if (error) {
          console.error('Upload error:', error);
          setError('Image upload failed: ' + (error.message || 'Unknown error'));
        }
      }
    );
  };

  const removeImage = (indexToRemove) => {
    setUploadedImages(prev => prev.filter((_, index) => index !== indexToRemove));
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleVerificationClose = () => {
    setShowVerification(false);
    navigate('/restaurants');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
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

      const restaurantReqData = {
        ...formData,
        createdBy: userId,
        status: 'pending'
      };

      // Debug log what we're sending
      console.log('Sending restaurant request data:', restaurantReqData);

      const response = await axios.post(
        'http://localhost:5000/api/restaurantreq',
        restaurantReqData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Restaurant creation response:', response.data);

      if (response.status === 201) {
        setShowVerification(true);
      }
    } catch (error) {
      console.error('Error adding restaurant:', error);
      // Enhanced error logging to show response data if available
      if (error.response && error.response.data) {
        console.error('Server error response:', error.response.data);
        // Show detailed error message if available
        const errorMessage = error.response.data.message || 'Failed to add restaurant';
        const detailedError = error.response.data.details || 
                             (error.response.data.fields ? 
                              `Missing fields: ${error.response.data.fields.join(', ')}` : 
                              '');
        
        setError(detailedError ? `${errorMessage}: ${detailedError}` : errorMessage);
      } else {
        setError('Failed to add restaurant');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="details-container">
      <div className="details-header">
        <h1 className="details-title">Add New Restaurant</h1>
      </div>

      <div className="details-content">
        <form onSubmit={handleSubmit} className="add-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="name">Restaurant Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Restaurant Images</label>
            <div className="image-upload-container">
              <button 
                type="button" 
                className="upload-button"
                onClick={handleImageUpload}
                disabled={!cloudinaryLoaded}
              >
                {cloudinaryLoaded ? 'Upload Images' : 'Loading Widget...'}
              </button>
              <div className="uploaded-images">
                {uploadedImages.map((url, index) => (
                  <div key={index} className="uploaded-image-container">
                    <img src={url} alt={`Upload ${index + 1}`} className="uploaded-image-preview" />
                    <button
                      type="button"
                      className="remove-image-button"
                      onClick={() => removeImage(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <p className="image-help-text">
                Upload up to 5 images. First image will be the main display image.
              </p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="cuisine">Cuisine</label>
            <input
              type="text"
              id="cuisine"
              name="cuisine"
              value={formData.cuisine}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="country">Country</label>
            <select
              id="country"
              name="country"
              value={formData.country}
              onChange={handleCountryChange}
              required
              disabled={locationLoading && countries.length === 0}
            >
              <option value="">
                {locationLoading && countries.length === 0 ? 'Loading countries...' : 'Select Country'}
              </option>
              {countries && countries.map(country => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            {locationLoading && countries.length === 0 && (
              <div className="loading-indicator">Loading countries...</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="city">City</label>
            <select
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              disabled={!formData.country || (locationLoading && formData.country)}
            >
              <option value="">
                {locationLoading && formData.country ? 'Loading cities...' : 'Select City'}
              </option>
              {cities && cities.length > 0 ? (
                cities.map(city => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))
              ) : formData.country && !locationLoading ? (
                <option value="" disabled>No cities found for this country</option>
              ) : null}
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
            <label htmlFor="website">Website URL</label>
            <input
              type="url"
              id="website"
              name="website"
              placeholder="https://www.example.com"
              value={formData.website}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              required
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="contactNumber">Contact Number</label>
            <input
              type="text"
              id="contactNumber"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="openingHours">Opening Hours</label>
            <input
              type="text"
              id="openingHours"
              name="openingHours"
              value={formData.openingHours}
              onChange={handleChange}
              placeholder="e.g., Mon-Fri: 9AM-10PM"
              required
            />
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={loading || uploadedImages.length === 0}
          >
            {loading ? 'Adding Restaurant...' : 'Add Restaurant'}
          </button>
        </form>
      </div>

      {showVerification && (
        <VerificationPopup
          type="restaurant"
          onClose={handleVerificationClose}
        />
      )}
    </div>
  );
};

export default AddRestaurant; 