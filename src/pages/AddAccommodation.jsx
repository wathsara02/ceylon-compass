import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import VerificationPopup from '../components/VerificationPopup';
import '../styles/Forms.css';

const AddAccommodation = () => {
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
  const [showVerification, setShowVerification] = useState(false);
  const [cloudinaryLoaded, setCloudinaryLoaded] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    location: {
      country: '',
      city: '',
      address: ''
    },
    price: '',
    capacity: '',
    amenities: [],
    images: [],
    contactNumber: '',
    status: 'pending'
  });

  // Load Cloudinary script and fetch countries
  useEffect(() => {
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

    // Fetch countries from database
    fetchCountries();
  }, []);

  // Fetch cities when country changes
  useEffect(() => {
    if (formData.location.country) {
      console.log("Fetching cities for country:", formData.location.country);
      fetchCitiesByCountry(formData.location.country);
    }
  }, [formData.location.country]);

  // Update error message if location context has an error
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
      location: {
        ...prev.location,
        country,
        city: ''
      }
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('location.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [field]: value
        }
      }));
    } else if (name === 'price' || name === 'capacity') {
      // Convert price and capacity to numbers
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? '' : Number(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAmenityChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      amenities: checked
        ? [...prev.amenities, value]
        : prev.amenities.filter(amenity => amenity !== value)
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
        uploadPreset: 'accommodations',
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

      // Ensure price and capacity are numbers
      const priceAsNumber = Number(formData.price);
      const capacityAsNumber = Number(formData.capacity);
      
      if (isNaN(priceAsNumber) || priceAsNumber <= 0) {
        setError('Please enter a valid price');
        setLoading(false);
        return;
      }
      
      if (isNaN(capacityAsNumber) || capacityAsNumber <= 0) {
        setError('Please enter a valid capacity');
        setLoading(false);
        return;
      }

      // Flatten the data structure to match what the backend expects
      const { location, ...restFormData } = formData;
      
      const accommodationReqData = {
        ...restFormData,
        // Spread the location fields at the top level
        country: location.country,
        city: location.city,
        address: location.address,
        // Include other required fields
        price: priceAsNumber,
        capacity: capacityAsNumber,
        createdBy: userId,
        status: 'pending'
      };

      // Log the data being sent
      console.log("Sending data to server:", JSON.stringify(accommodationReqData));

      const response = await axios.post(
        'http://localhost:5000/api/accommodationreq',
        accommodationReqData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.status === 201) {
        setShowVerification(true);
      }
    } catch (err) {
      console.error('Error adding accommodation:', err);
      if (err.response?.data) {
        console.error('Server response:', err.response.data);
        setError(err.response.data.message || 'Failed to add accommodation');
        
        if (err.response?.data?.fields) {
          setError(`Missing required fields: ${err.response.data.fields.join(', ')}`);
        }
      } else {
        setError('Failed to add accommodation. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationClose = () => {
    setShowVerification(false);
    navigate('/accommodations');
  };

  return (
    <div className="form-container">
      <h2>Add New Accommodation</h2>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="name">Name</label>
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
          <label>Accommodation Images</label>
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
          <label htmlFor="location.country">Country</label>
          <select
            id="location.country"
            name="location.country"
            value={formData.location.country}
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
          <label htmlFor="location.city">City</label>
          <select
            id="location.city"
            name="location.city"
            value={formData.location.city}
            onChange={handleChange}
            required
            disabled={!formData.location.country || (locationLoading && formData.location.country)}
          >
            <option value="">
              {locationLoading && formData.location.country ? 'Loading cities...' : 'Select City'}
            </option>
            {cities && cities.length > 0 ? (
              cities.map(city => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))
            ) : formData.location.country && !locationLoading ? (
              <option value="" disabled>No cities found for this country</option>
            ) : null}
          </select>
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

        <div className="form-group">
          <label htmlFor="type">Type</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
          >
            <option value="">Select Type</option>
            <option value="hotel">Hotel</option>
            <option value="apartment">Apartment</option>
            <option value="resort">Resort</option>
            <option value="hostel">Hostel</option>
            <option value="guesthouse">Guesthouse</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="location.address">Address</label>
          <input
            type="text"
            id="location.address"
            name="location.address"
            value={formData.location.address}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="price">Price per Night</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="1"
              step="0.01"
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
              step="1"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="contactNumber">Contact Number</label>
          <input
            type="tel"
            id="contactNumber"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleChange}
            required
            placeholder="Enter contact number"
          />
        </div>

        <div className="form-group">
          <label>Amenities</label>
          <div className="amenities-grid">
            {[
              'WiFi',
              'Parking',
              'Pool',
              'Gym',
              'Restaurant',
              'Room Service',
              'Air Conditioning',
              'TV',
              'Kitchen',
              'Laundry',
              'Breakfast',
              'Spa'
            ].map(amenity => (
              <label key={amenity} className="amenity-checkbox">
                <input
                  type="checkbox"
                  value={amenity}
                  checked={formData.amenities.includes(amenity)}
                  onChange={handleAmenityChange}
                />
                {amenity}
              </label>
            ))}
          </div>
        </div>

        <button 
          type="submit" 
          className="submit-button" 
          disabled={loading || uploadedImages.length === 0}
        >
          {loading ? 'Creating Accommodation...' : 'Create Accommodation'}
        </button>
      </form>
      {showVerification && <VerificationPopup onClose={handleVerificationClose} />}
    </div>
  );
};

export default AddAccommodation; 