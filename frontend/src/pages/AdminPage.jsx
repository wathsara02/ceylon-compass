import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../context/LocationContext';
import '../styles/AdminPage.css';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Utility functions
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const handleApiError = (error, customMessage) => {
  if (error.response) {
    if (error.response.status === 401) {
      return 'Authentication error. Please log in again.';
    } else if (error.response.status === 403) {
      return 'Access denied. Admin privileges required.';
    }
    return `${customMessage}: ${error.response.data.message || error.message}`;
  } else if (error.request) {
    return 'No response from server. Please check your connection.';
  }
  return `Error: ${error.message}`;
};

// Common state reset function
const resetStates = (setShowDetails, setSelectedRequest, setSelectedItem, setEditingRequest, setEditingItem) => {
  setShowDetails(false);
  setSelectedRequest(null);
  setSelectedItem(null);
  setEditingRequest(null);
  setEditingItem(null);
};

// Common API call function
const makeApiCall = async (method, endpoint, data = {}, setLoading, setError, errorMessage) => {
  try {
    setLoading(true);
    setError(null);
    const headers = getAuthHeaders();
    const response = await axios[method](`${API_BASE_URL}${endpoint}`, data, { headers });
    return response.data;
  } catch (error) {
    const errorMsg = handleApiError(error, errorMessage);
    setError(errorMsg);
    throw error;
  } finally {
    setLoading(false);
  }
};

const AdminPage = () => {
  const { refreshLocations } = useLocation();
  const [activeTab, setActiveTab] = useState('eventRequests');
  const [eventRequests, setEventRequests] = useState([]);
  const [accommodationRequests, setAccommodationRequests] = useState([]);
  const [restaurantRequests, setRestaurantRequests] = useState([]);
  const [events, setEvents] = useState([]);
  const [accommodations, setAccommodations] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [userData, setUserData] = useState(null);
  const [newCountry, setNewCountry] = useState('');
  const [newCity, setNewCity] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (activeTab === 'events' || activeTab === 'restaurants' || activeTab === 'accommodations') {
      fetchApprovedItems();
    } else if (activeTab === 'locations') {
      fetchLocations();
    } else if (activeTab === 'messages') {
      fetchMessages();
    }
  }, [activeTab]);

  const checkAdminAccess = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_BASE_URL}/auth/profile`, { headers });

      if (response.data.role !== 'admin') {
        setError('Access denied. Admin only.');
        return;
      }

      fetchRequests();
    } catch (error) {
      const errorMessage = handleApiError(error, 'Error checking admin access');
      setError(errorMessage);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const fetchRequests = async () => {
    try {
      const [eventRes, accRes, resRes] = await Promise.all([
        makeApiCall('get', '/eventreq', {}, setLoading, setError, 'Error fetching event requests'),
        makeApiCall('get', '/accommodationreq', {}, setLoading, setError, 'Error fetching accommodation requests'),
        makeApiCall('get', '/restaurantreq', {}, setLoading, setError, 'Error fetching restaurant requests')
      ]);

      setEventRequests(eventRes);
      setAccommodationRequests(accRes);
      setRestaurantRequests(resRes);
    } catch (error) {
    }
  };

  const fetchApprovedItems = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      
      switch (activeTab) {
        case 'events':
          const eventsRes = await axios.get(`${API_BASE_URL}/events`, { headers });
          setEvents(eventsRes.data);
          break;
        case 'restaurants':
          const restaurantsRes = await axios.get(`${API_BASE_URL}/restaurants`, { headers });
          setRestaurants(restaurantsRes.data);
          break;
        case 'accommodations':
          const accommodationsRes = await axios.get(`${API_BASE_URL}/accommodations`, { headers });
          setAccommodations(accommodationsRes.data);
          break;
        default:
          break;
      }
    } catch (error) {
      const errorMessage = handleApiError(error, `Error fetching ${activeTab}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_BASE_URL}/locations/all`, { headers });
      setLocations(response.data);
    } catch (error) {
      const errorMessage = handleApiError(error, 'Error fetching locations');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in again.');
        setLoading(false);
        return;
      }
      
      const headers = {
        Authorization: `Bearer ${token}`
      };
      
      console.log('Fetching messages with token:', token.substring(0, 10) + '...');
      
      const response = await axios.get(`${API_BASE_URL}/contact`, { headers });
      console.log('Messages response:', response.data);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError(`Error fetching messages: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id, collectionName) => {
    try {
      await makeApiCall(
        'post',
        `/${collectionName}/${id}/accept`,
        {},
        setLoading,
        setError,
        `Error accepting ${collectionName}`
      );
      
      const requestType = collectionName.replace('req', ' request');
      window.confirm(`${requestType.charAt(0).toUpperCase() + requestType.slice(1)} accepted successfully! An email notification has been sent to the user.`);
      
      fetchRequests();
      resetStates(setShowDetails, setSelectedRequest, setSelectedItem, setEditingRequest, setEditingItem);
    } catch (error) {
    }
  };

  const handleReject = async (id, collectionName) => {
    try {
      setLoading(true);
      setError(null);
      
      const headers = getAuthHeaders();
      const response = await axios.post(
        `${API_BASE_URL}/${collectionName}/${id}/reject`,
        {},
        { headers }
      );
      
      const requestType = collectionName.replace('req', ' request');
      window.confirm(`${requestType.charAt(0).toUpperCase() + requestType.slice(1)} rejected. An email notification has been sent to the user.`);
      
      fetchRequests();
      resetStates(setShowDetails, setSelectedRequest, setSelectedItem, setEditingRequest, setEditingItem);
    } catch (error) {
      const errorMessage = handleApiError(error, `Error rejecting ${collectionName}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, collectionName) => {
    try {
      await makeApiCall(
        'delete',
        `/${collectionName}/${id}`,
        {},
        setLoading,
        setError,
        `Error deleting ${collectionName}`
      );
      
      if (collectionName.includes('request')) {
        fetchRequests();
      } else {
        fetchApprovedItems();
      }
      
      resetStates(setShowDetails, setSelectedRequest, setSelectedItem, setEditingRequest, setEditingItem);
    } catch (error) {
      // Error already handled by makeApiCall
    }
  };

  const handleEdit = (item) => {
    if (activeTab.includes('request')) {
      setEditingRequest(item);
    } else {
      setEditingItem({...item});
    }
  };

  const handleCancelEdit = () => {
    setEditingRequest(null);
    setEditingItem(null);
  };

  const handleSaveEdit = async () => {
    try {
      const headers = getAuthHeaders();
      let endpoint;
      let itemToUpdate;
      
      if (editingRequest) {
        switch (activeTab) {
          case 'eventRequests':
            endpoint = `${API_BASE_URL}/eventreq/${editingRequest._id}`;
            break;
          case 'accommodationRequests':
            endpoint = `${API_BASE_URL}/accommodationreq/${editingRequest._id}`;
            break;
          case 'restaurantRequests':
            endpoint = `${API_BASE_URL}/restaurantreq/${editingRequest._id}`;
            break;
          default:
            throw new Error('Invalid request type');
        }
        itemToUpdate = editingRequest;
      } else if (editingItem) {
        switch (activeTab) {
          case 'events':
            endpoint = `${API_BASE_URL}/events/${editingItem._id}`;
            break;
          case 'accommodations':
            endpoint = `${API_BASE_URL}/accommodations/${editingItem._id}`;
            if (editingItem.location && typeof editingItem.location === 'object') {
              if (!editingItem.location.coordinates) {
                editingItem.location = {
                  type: 'Point',
                  coordinates: [
                    parseFloat(editingItem.location.longitude || 0), 
                    parseFloat(editingItem.location.latitude || 0)
                  ]
                };
              }
            }
            break;
          case 'restaurants':
            endpoint = `${API_BASE_URL}/restaurants/${editingItem._id}`;
            break;
          default:
            throw new Error('Invalid item type');
        }
        itemToUpdate = editingItem;
      } else {
        throw new Error('No item selected for editing');
      }
      
      const response = await axios.put(endpoint, itemToUpdate, { headers });
      
      if (editingRequest) {
        setSelectedRequest(response.data);
        setEditingRequest(null);
        fetchRequests();
      } else {
        setSelectedItem(response.data);
        setEditingItem(null);
        fetchApprovedItems();
      }
      
    } catch (error) {
      const errorMessage = handleApiError(error, 'Error saving edit');
      setError(errorMessage);
    }
  };

  const handleViewDetails = async (item) => {
    if (editingRequest || editingItem) {
      return;
    }

    if (activeTab.includes('Requests')) {
      setSelectedRequest(item);
      setSelectedItem(null);
      
      if (item.createdBy) {
        setUserData(item.createdBy);
      }
    } else {
      setSelectedItem(item);
      setSelectedRequest(null);
    }
    
    setShowDetails(true);
  };

  const getItemTitle = () => {
    if (!selectedItem) return '';

    switch(activeTab) {
      case 'events':
        return `Event: ${selectedItem.title}`;
      case 'accommodations':
        return `Accommodation: ${selectedItem.name}`;
      case 'restaurants':
        return `Restaurant: ${selectedItem.name}`;
      default:
        return selectedItem.name || selectedItem.title || 'Item Details';
    }
  };

  const renderDetails = () => {
    if (selectedRequest && !selectedItem) {
      return renderRequestDetails();
    }
    
    if (selectedItem && !selectedRequest) {
      return renderItemDetails();
    }
    
    return null;
  };

  const renderRequestDetails = () => {
    if (!selectedRequest || !showDetails) return null;

    const getRequestTypeDetails = () => {
      switch (activeTab) {
        case 'eventRequests':
          return {
            title: selectedRequest.title || 'N/A',
            mainFields: [
              { label: 'Description', value: selectedRequest.description },
              { label: 'Date', value: new Date(selectedRequest.date).toLocaleDateString() },
              { label: 'Time', value: selectedRequest.time },
              { label: 'Category', value: selectedRequest.category },
              { label: 'Price', value: `$${selectedRequest.price}` },
              { label: 'Capacity', value: `${selectedRequest.capacity} people` }
            ],
            locationFields: [
              { label: 'Country', value: selectedRequest.country },
              { label: 'City', value: selectedRequest.city },
              { label: 'Address', value: selectedRequest.address }
            ],
            organizerFields: selectedRequest.organizer ? [
              { label: 'Name', value: selectedRequest.organizer.name },
              { label: 'Contact Number', value: selectedRequest.organizer.contactNumber },
              { label: 'Email', value: selectedRequest.organizer.email }
            ] : [],
            collectionType: 'eventreq'
          };

        case 'restaurantRequests':
          return {
            title: selectedRequest.name || 'N/A',
            mainFields: [
              { label: 'Description', value: selectedRequest.description },
              { label: 'Cuisine', value: selectedRequest.cuisine },
              { label: 'Website', value: selectedRequest.website || 'Not provided' },
              { label: 'Contact', value: selectedRequest.contactNumber },
              { label: 'Opening Hours', value: selectedRequest.openingHours }
            ],
            locationFields: [
              { label: 'Country', value: selectedRequest.country },
              { label: 'City', value: selectedRequest.city },
              { label: 'Address', value: selectedRequest.address }
            ],
            collectionType: 'restaurantreq'
          };

        case 'accommodationRequests':
          // Get data directly from the request object
          console.log('Rendering accommodation request:', selectedRequest);
          
          // Determine how to access location fields based on data structure
          let locationFields = [];
          if (selectedRequest.location && typeof selectedRequest.location === 'object') {
            // If nested location object is present
            locationFields = [
              { label: 'Country', value: selectedRequest.location.country },
              { label: 'City', value: selectedRequest.location.city },
              { label: 'Address', value: selectedRequest.location.address }
            ];
          } else {
            // Fallback to direct properties if they exist
            locationFields = [
              { label: 'Country', value: selectedRequest.country },
              { label: 'City', value: selectedRequest.city },
              { label: 'Address', value: selectedRequest.address }
            ];
          }
          
          return {
            title: selectedRequest.name || '',
            mainFields: [
              { label: 'Description', value: selectedRequest.description },
              { label: 'Type', value: selectedRequest.type },
              { label: 'Price', value: selectedRequest.price ? `$${selectedRequest.price}` : '' },
              { label: 'Capacity', value: selectedRequest.capacity }
            ],
            locationFields: locationFields,
            amenitiesFields: selectedRequest.amenities && selectedRequest.amenities.length > 0 ? [
              { label: 'Amenities', value: selectedRequest.amenities.join(', ') }
            ] : [],
            contactFields: [
              { label: 'Contact Number', value: selectedRequest.contactNumber }
            ],
            collectionType: 'accommodationreq'
          };

        default:
          return null;
      }
    };

    const details = getRequestTypeDetails();
    if (!details) return null;

    return (
      <div className="request-details-modal" onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowDetails(false);
        }
      }}>
        <div className="request-details-content">
          <button className="close-button" onClick={() => setShowDetails(false)}>×</button>
          <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Request Details</h2>
          
          <div className="details-section">
            <h4>Basic Information</h4>
            <p><strong>Title/Name:</strong> {details.title}</p>
            {details.mainFields.map((field, index) => (
              <p key={index}><strong>{field.label}:</strong> {field.value || 'N/A'}</p>
            ))}
          </div>

          <div className="details-section">
            <h4>Location Information</h4>
            {details.locationFields.map((field, index) => (
              <p key={index}><strong>{field.label}:</strong> {field.value || 'N/A'}</p>
            ))}
          </div>

          {details.organizerFields && details.organizerFields.length > 0 && (
            <div className="details-section">
              <h4>Organizer Information</h4>
              {details.organizerFields.map((field, index) => (
                <p key={index}><strong>{field.label}:</strong> {field.value || 'N/A'}</p>
              ))}
            </div>
          )}

          {details.contactFields && details.contactFields.length > 0 && (
            <div className="details-section">
              <h4>Contact Information</h4>
              {details.contactFields.map((field, index) => (
                <p key={index}><strong>{field.label}:</strong> {field.value || 'N/A'}</p>
              ))}
            </div>
          )}

          {details.amenitiesFields && details.amenitiesFields.length > 0 && (
            <div className="details-section">
              <h4>Additional Information</h4>
              {details.amenitiesFields.map((field, index) => (
                <p key={index}><strong>{field.label}:</strong> {field.value || 'N/A'}</p>
              ))}
            </div>
          )}

          <div className="details-section">
            <h4>Status Information</h4>
            <p><strong>Created By:</strong> {
              selectedRequest.createdBy ? 
                (typeof selectedRequest.createdBy === 'object' ? 
                  (selectedRequest.createdBy.username || 'No username') : 
                  'ID only: ' + selectedRequest.createdBy) : 
                'Unknown'
            }</p>
            <p><strong>Email:</strong> {
              selectedRequest.createdBy && selectedRequest.createdBy.email ? 
                selectedRequest.createdBy.email : 
                'Unknown'
            }</p>
            <p><strong>Created At:</strong> {new Date(selectedRequest.createdAt).toLocaleString()}</p>
          </div>

          <div className="request-actions">
            {activeTab === 'accommodationRequests' ? (
              <button 
                onClick={() => handleAcceptAccommodation(selectedRequest._id)}
                className="accept-btn"
              >
                Accept Accommodation
              </button>
            ) : (
              <button 
                onClick={() => handleAccept(selectedRequest._id, details.collectionType)}
                className="accept-btn"
              >
                Accept
              </button>
            )}
            <button 
              onClick={() => handleReject(selectedRequest._id, details.collectionType)}
              className="reject-btn"
            >
              Reject
            </button>
            <button 
              onClick={() => handleEdit(selectedRequest)}
              className="edit-btn"
            >
              Edit
            </button>
            <button 
              onClick={() => handleDelete(selectedRequest._id, details.collectionType)}
              className="delete-btn"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderItemDetails = () => {
    if (!selectedItem) return null;
    
    const getItemTypeDetails = () => {
      switch (activeTab) {
        case 'events':
          return (
            <>
              <div className="details-section">
                <h4>Event Details</h4>
                <p><strong>Name:</strong> {selectedItem.title}</p>
                <p><strong>Date:</strong> {new Date(selectedItem.date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {selectedItem.time}</p>
                <p><strong>Location:</strong> {selectedItem.venue}</p>
                <p><strong>Address:</strong> {selectedItem.address}</p>
                <p><strong>City:</strong> {selectedItem.city}</p>
                <p><strong>Country:</strong> {selectedItem.country}</p>
              </div>
              
              <div className="details-section">
                <h4>Description</h4>
                <p>{selectedItem.description}</p>
              </div>
              
              <div className="details-section">
                <h4>Additional Information</h4>
                <p><strong>Category:</strong> {selectedItem.category}</p>
                <p><strong>Price:</strong> {selectedItem.price ? `$${selectedItem.price}` : 'Free'}</p>
                <p><strong>Website:</strong> {selectedItem.website || 'N/A'}</p>
                <p><strong>Contact:</strong> {selectedItem.contactInfo || 'N/A'}</p>
                <p><strong>Status:</strong> <span className={`status-${selectedItem.status}`}>{selectedItem.status}</span></p>
              </div>
              
              {selectedItem.images && selectedItem.images.length > 0 && (
                <div className="details-section">
                  <h4>Images</h4>
                  <div className="image-gallery">
                    {selectedItem.images.map((image, index) => (
                      <img 
                        key={index} 
                        src={image.startsWith('http') ? image : `http://localhost:5000/${image}`} 
                        alt={`Event ${index + 1}`} 
                        className="detail-image"
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          );
          
        case 'accommodations':
          return (
            <>
              <div className="details-section">
                <h4>Accommodation Details</h4>
                <p><strong>Name:</strong> {selectedItem.name}</p>
                <p><strong>Type:</strong> {selectedItem.accommodationType}</p>
                <p><strong>Price Range:</strong> {selectedItem.priceRange}</p>
                <p><strong>Address:</strong> {selectedItem.address}</p>
                <p><strong>City:</strong> {selectedItem.city}</p>
                <p><strong>Country:</strong> {selectedItem.country}</p>
              </div>
              
              <div className="details-section">
                <h4>Description</h4>
                <p>{selectedItem.description}</p>
              </div>
              
              <div className="details-section">
                <h4>Additional Information</h4>
                <p><strong>Amenities:</strong> {selectedItem.amenities ? selectedItem.amenities.join(', ') : 'N/A'}</p>
                <p><strong>Website:</strong> {selectedItem.website || 'N/A'}</p>
                <p><strong>Contact:</strong> {selectedItem.contactInfo || 'N/A'}</p>
                <p><strong>Status:</strong> <span className={`status-${selectedItem.status}`}>{selectedItem.status}</span></p>
              </div>
              
              {selectedItem.images && selectedItem.images.length > 0 && (
                <div className="details-section">
                  <h4>Images</h4>
                  <div className="image-gallery">
                    {selectedItem.images.map((image, index) => (
                      <img 
                        key={index} 
                        src={image.startsWith('http') ? image : `http://localhost:5000/${image}`} 
                        alt={`Accommodation ${index + 1}`} 
                        className="detail-image"
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          );
          
        case 'restaurants':
          return (
            <>
              <div className="details-section">
                <h4>Restaurant Details</h4>
                <p><strong>Name:</strong> {selectedItem.name}</p>
                <p><strong>Cuisine:</strong> {selectedItem.cuisine}</p>
                <p><strong>Opening Hours:</strong> {selectedItem.openingHours}</p>
                <p><strong>Address:</strong> {selectedItem.address}</p>
                <p><strong>City:</strong> {selectedItem.city}</p>
                <p><strong>Country:</strong> {selectedItem.country}</p>
              </div>
              
              <div className="details-section">
                <h4>Description</h4>
                <p>{selectedItem.description}</p>
              </div>
              
              <div className="details-section">
                <h4>Additional Information</h4>
                <p><strong>Website:</strong> {selectedItem.website || 'N/A'}</p>
                <p><strong>Contact:</strong> {selectedItem.contactInfo || 'N/A'}</p>
                <p><strong>Status:</strong> <span className={`status-${selectedItem.status}`}>{selectedItem.status}</span></p>
              </div>
              
              {selectedItem.images && selectedItem.images.length > 0 && (
                <div className="details-section">
                  <h4>Images</h4>
                  <div className="image-gallery">
                    {selectedItem.images.map((image, index) => (
                      <img 
                        key={index} 
                        src={image.startsWith('http') ? image : `http://localhost:5000/${image}`} 
                        alt={`Restaurant ${index + 1}`} 
                        className="detail-image"
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          );
          
        default:
          return <p>No details available.</p>;
      }
    };
    
    return (
      <div className="request-details-modal">
        <div className="request-details-content">
          <button className="close-button" onClick={() => {
            setShowDetails(false);
            setSelectedItem(null);
          }}>×</button>
          
          <h2>{getItemTitle()}</h2>
          
          {getItemTypeDetails()}
          
          <div className="request-actions">
            <button className="edit-btn" onClick={() => handleEdit(selectedItem)}>
              Edit
            </button>
            <button 
              className="delete-btn" 
              onClick={() => handleDelete(selectedItem._id, activeTab)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderRequests = () => {
    let items = [];
    let collectionName = '';

    if (activeTab.includes('Requests')) {
    switch (activeTab) {
      case 'eventRequests':
          items = eventRequests;
        collectionName = 'eventreq';
        break;
      case 'accommodationRequests':
          items = accommodationRequests;
        collectionName = 'accommodationreq';
        break;
      case 'restaurantRequests':
          items = restaurantRequests;
        collectionName = 'restaurantreq';
        break;
      default:
        return null;
      }
    } else {
      switch (activeTab) {
        case 'events':
          items = events;
          collectionName = 'events';
          break;
        case 'accommodations':
          items = accommodations;
          collectionName = 'accommodations';
          break;
        case 'restaurants':
          items = restaurants;
          collectionName = 'restaurants';
          break;
        default:
          return null;
      }
    }

    if (loading) {
      return <div className="loading">Loading...</div>;
    }

    if (error) {
      return <div className="error">{error}</div>;
    }

    return (
      <div className="requests-container">
        {items.length === 0 ? (
          <p className="no-items-message">No {activeTab} found.</p>
        ) : (
          items.map((item) => (
            <div key={item._id} className="request-card" onClick={() => handleViewDetails(item)}>
              <h3>{item.name || item.title}</h3>
              <p>Status: {item.status || 'approved'}</p>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderEditForm = () => {
    const item = editingRequest || editingItem;
    if (!item) return null;
    
    const handleEditChange = (e) => {
      const { name, value } = e.target;
      if (editingRequest) {
        setEditingRequest({
          ...editingRequest,
          [name]: value
        });
      } else {
        // Handle nested properties using dot notation (e.g., location.latitude)
        if (name.includes('.')) {
          const [parent, child] = name.split('.');
          setEditingItem({
            ...editingItem,
            [parent]: {
              ...editingItem[parent],
              [child]: value
            }
          });
        } else {
          setEditingItem({
            ...editingItem,
            [name]: value
          });
        }
      }
    };
    
    const getEditForm = () => {
      if (editingRequest) {
        switch (activeTab) {
          // ... existing editingRequest cases
        }
      } else if (editingItem) {
        switch (activeTab) {
          case 'events':
            return (
              <>
                <div className="form-group">
                  <label>Title</label>
                  <input 
                    type="text" 
                    name="title" 
                    value={editingItem.title || ''} 
                    onChange={handleEditChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input 
                    type="date" 
                    name="date" 
                    value={editingItem.date ? new Date(editingItem.date).toISOString().split('T')[0] : ''} 
                    onChange={handleEditChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <input 
                    type="text" 
                    name="time" 
                    value={editingItem.time || ''} 
                    onChange={handleEditChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Venue</label>
                  <input 
                    type="text" 
                    name="venue" 
                    value={editingItem.venue || ''} 
                    onChange={handleEditChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input 
                    type="text" 
                    name="address" 
                    value={editingItem.address || ''} 
                    onChange={handleEditChange} 
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input 
                    type="text" 
                    name="city" 
                    value={editingItem.city || ''} 
                    onChange={handleEditChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input 
                    type="text" 
                    name="country" 
                    value={editingItem.country || ''} 
                    onChange={handleEditChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    name="description" 
                    value={editingItem.description || ''} 
                    onChange={handleEditChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input 
                    type="text" 
                    name="category" 
                    value={editingItem.category || ''} 
                    onChange={handleEditChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Price</label>
                  <input 
                    type="number" 
                    name="price" 
                    value={editingItem.price || ''} 
                    onChange={handleEditChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Website</label>
                  <input 
                    type="text" 
                    name="website" 
                    value={editingItem.website || ''} 
                    onChange={handleEditChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Contact Info</label>
                  <input 
                    type="text" 
                    name="contactInfo" 
                    value={editingItem.contactInfo || ''} 
                    onChange={handleEditChange} 
                  />
                </div>
              </>
            );
            
          case 'accommodations':
            return (
              <>
                <div className="form-group">
                  <label>Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={editingItem.name || ''} 
                    onChange={handleEditChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <input 
                    type="text" 
                    name="accommodationType" 
                    value={editingItem.accommodationType || ''} 
                    onChange={handleEditChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Price Range</label>
                  <input 
                    type="text" 
                    name="priceRange" 
                    value={editingItem.priceRange || ''} 
                    onChange={handleEditChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input 
                    type="text" 
                    name="address" 
                    value={editingItem.address || ''} 
                    onChange={handleEditChange} 
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input 
                    type="text" 
                    name="city" 
                    value={editingItem.city || ''} 
                    onChange={handleEditChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input 
                    type="text" 
                    name="country" 
                    value={editingItem.country || ''} 
                    onChange={handleEditChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    name="description" 
                    value={editingItem.description || ''} 
                    onChange={handleEditChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Latitude</label>
                  <input 
                    type="number" 
                    name="location.latitude" 
                    value={editingItem.location?.latitude || (editingItem.location?.coordinates ? editingItem.location.coordinates[1] : '')} 
                    onChange={handleEditChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Longitude</label>
                  <input 
                    type="number" 
                    name="location.longitude" 
                    value={editingItem.location?.longitude || (editingItem.location?.coordinates ? editingItem.location.coordinates[0] : '')} 
                    onChange={handleEditChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Website</label>
                  <input 
                    type="text" 
                    name="website" 
                    value={editingItem.website || ''} 
                    onChange={handleEditChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Contact Info</label>
                  <input 
                    type="text" 
                    name="contactInfo" 
                    value={editingItem.contactInfo || ''} 
                    onChange={handleEditChange} 
                  />
                </div>
              </>
            );
            
          case 'restaurants':
            return (
              <>
                <div className="form-group">
                  <label>Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={editingItem.name || ''} 
                    onChange={handleEditChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Cuisine</label>
                  <input 
                    type="text" 
                    name="cuisine" 
                    value={editingItem.cuisine || ''} 
                    onChange={handleEditChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Opening Hours</label>
                  <input 
                    type="text" 
                    name="openingHours" 
                    value={editingItem.openingHours || ''} 
                    onChange={handleEditChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input 
                    type="text" 
                    name="address" 
                    value={editingItem.address || ''} 
                    onChange={handleEditChange} 
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input 
                    type="text" 
                    name="city" 
                    value={editingItem.city || ''} 
                    onChange={handleEditChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input 
                    type="text" 
                    name="country" 
                    value={editingItem.country || ''} 
                    onChange={handleEditChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    name="description" 
                    value={editingItem.description || ''} 
                    onChange={handleEditChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Website</label>
                  <input 
                    type="text" 
                    name="website" 
                    value={editingItem.website || ''} 
                    onChange={handleEditChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Contact Info</label>
                  <input 
                    type="text" 
                    name="contactInfo" 
                    value={editingItem.contactInfo || ''} 
                    onChange={handleEditChange} 
                  />
                </div>
              </>
            );
            
          default:
            return <p>No form available for this item type.</p>;
        }
      }
    };

    // Helper to get appropriate title for edit form
    const getFormTitle = () => {
      if (editingRequest) {
        switch (activeTab) {
          case 'eventRequests': return 'Edit Event Request';
          case 'accommodationRequests': return 'Edit Accommodation Request';
          case 'restaurantRequests': return 'Edit Restaurant Request';
          default: return 'Edit Request';
        }
      } else {
        switch (activeTab) {
          case 'events': return 'Edit Event';
          case 'accommodations': return 'Edit Accommodation';
          case 'restaurants': return 'Edit Restaurant';
          default: return 'Edit Item';
        }
      }
    };
    
    return (
      <div className="edit-form-modal">
        <div className="edit-form-content">
          <button className="close-button" onClick={handleCancelEdit}>×</button>
          <h2>{getFormTitle()}</h2>
          <form onSubmit={(e) => e.preventDefault()}>
            {getEditForm()}
            <div className="form-actions">
              <button type="button" className="save-button" onClick={handleSaveEdit}>
                Save Changes
              </button>
              <button type="button" className="cancel-button" onClick={handleCancelEdit}>
                Cancel
              </button>
            </div>
          </form>
          </div>
      </div>
    );
  };

  // Function that directly accepts an accommodation request
  const handleAcceptAccommodation = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const headers = getAuthHeaders();
      const response = await axios.post(
        `${API_BASE_URL}/accommodationreq/${id}/accept`,
        {},
        { headers }
      );
      
      const result = window.confirm('Accommodation request accepted successfully! An email notification has been sent to the user.');
      
      fetchRequests();
      resetStates(setShowDetails, setSelectedRequest, setSelectedItem, setEditingRequest, setEditingItem);
      
    } catch (error) {
      const errorMessage = handleApiError(error, 'Error accepting accommodation');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCountry = async (e) => {
    e.preventDefault();
    if (!newCountry.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const headers = getAuthHeaders();
      await axios.post(
        `${API_BASE_URL}/locations/country`,
        { country: newCountry },
        { headers }
      );
      
      setNewCountry('');
      fetchLocations();
      refreshLocations();
    } catch (error) {
      const errorMessage = handleApiError(error, 'Error adding country');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddCity = async (e) => {
    e.preventDefault();
    if (!newCity.trim() || !selectedCountry) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const headers = getAuthHeaders();
      await axios.post(
        `${API_BASE_URL}/locations/city/${selectedCountry}`,
        { city: newCity },
        { headers }
      );
      
      setNewCity('');
      fetchLocations();
      refreshLocations();
    } catch (error) {
      const errorMessage = handleApiError(error, 'Error adding city');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteCountry = async (country) => {
    if (!window.confirm(`Are you sure you want to delete ${country}?`)) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const headers = getAuthHeaders();
      await axios.delete(
        `${API_BASE_URL}/locations/country/${country}`,
        { headers }
      );
      
      fetchLocations();
      refreshLocations();
    } catch (error) {
      const errorMessage = handleApiError(error, 'Error deleting country');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteCity = async (country, city) => {
    if (!window.confirm(`Are you sure you want to delete ${city} from ${country}?`)) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const headers = getAuthHeaders();
      await axios.delete(
        `${API_BASE_URL}/locations/city/${country}/${city}`,
        { headers }
      );
      
      fetchLocations();
      refreshLocations();
    } catch (error) {
      const errorMessage = handleApiError(error, 'Error deleting city');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderLocations = () => {
    if (loading) {
      return <div className="loading">Loading...</div>;
    }
    
    if (error) {
      return <div className="error">{error}</div>;
    }
    
    return (
      <div className="locations-container">
        <div className="locations-forms">
          <div className="location-form">
            <h3>Add New Country</h3>
            <form onSubmit={handleAddCountry}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Country Name"
                  value={newCountry}
                  onChange={(e) => setNewCountry(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary">Add Country</button>
            </form>
          </div>
          
          <div className="location-form">
            <h3>Add City to Country</h3>
            <form onSubmit={handleAddCity}>
              <div className="form-group">
                <select 
                  value={selectedCountry} 
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  required
                >
                  <option value="">Select a Country</option>
                  {locations.map((location) => (
                    <option key={location._id} value={location.country}>
                      {location.country}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="City Name"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  required
                  disabled={!selectedCountry}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={!selectedCountry}>
                Add City
              </button>
            </form>
          </div>
        </div>
        
        <div className="locations-list">
          <h3>Current Locations</h3>
          {locations.length === 0 ? (
            <p>No locations found.</p>
          ) : (
            locations.map((location) => (
              <div key={location._id} className="location-card">
                <div className="location-header">
                  <h4>{location.country}</h4>
                  <button 
                    className="btn-delete" 
                    onClick={() => handleDeleteCountry(location.country)}
                  >
                    Delete Country
                  </button>
                </div>
                <div className="cities-list">
                  <h5>Cities:</h5>
                  {location.cities.length === 0 ? (
                    <p>No cities added</p>
                  ) : (
                    <ul>
                      {location.cities.map((city, index) => (
                        <li key={index}>
                          {city}
                          <button 
                            className="btn-delete-small" 
                            onClick={() => handleDeleteCity(location.country, city)}
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const handleMarkAsRead = async (id, isRead) => {
    try {
      const headers = getAuthHeaders();
      await axios.patch(
        `${API_BASE_URL}/contact/${id}/read`,
        { read: isRead },
        { headers }
      );
      
      setMessages(messages.map(msg => 
        msg._id === id ? { ...msg, read: isRead } : msg
      ));
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to update message status');
      setError(errorMessage);
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const headers = getAuthHeaders();
      await axios.delete(
        `${API_BASE_URL}/contact/${id}`,
        { headers }
      );
      setMessages(messages.filter(msg => msg._id !== id));
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to delete message');
      setError(errorMessage);
    }
  };

  const renderMessages = () => {
    if (loading) {
      return <div className="loading">Loading messages...</div>;
    }
    
    if (error) {
      return <div className="error">{error}</div>;
    }
    
    if (messages.length === 0) {
      return <div className="empty-state">No messages found.</div>;
    }
    
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };
    
    return (
      <div className="messages-container">
        <h3>Messages from Contact Form</h3>
        <div className="messages-list">
          {messages.map(message => (
            <div key={message._id} className={`message-card ${!message.read ? 'unread' : ''}`}>
              <div className="message-header">
                <h3>{message.subject}</h3>
                <span className="message-date">{formatDate(message.createdAt)}</span>
              </div>
              <div className="message-sender">
                <strong>From:</strong> {message.name} ({message.email})
              </div>
              <div className="message-content">
                <p>{message.message}</p>
              </div>
              <div className="message-actions">
                {message.read ? (
                  <button 
                    onClick={() => handleMarkAsRead(message._id, false)}
                    className="mark-unread-button"
                  >
                    Mark as Unread
                  </button>
                ) : (
                  <button 
                    onClick={() => handleMarkAsRead(message._id, true)}
                    className="mark-read-button"
                  >
                    Mark as Read
                  </button>
                )}
                <button
                  onClick={() => handleDeleteMessage(message._id)}
                  className="btn-delete"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (error && error.includes('Access denied')) {
    return (
      <div className="admin-page">
        <div className="error-message">
          <h2>Access Denied</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')}>Go to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-sidebar">
        <h2>Admin Dashboard</h2>
        <div className="sidebar-menu">
          <h3>Pending Requests</h3>
          <button 
            className={activeTab === 'eventRequests' ? 'active' : ''}
            onClick={() => setActiveTab('eventRequests')}
          >
            Event Requests
          </button>
          <button 
            className={activeTab === 'accommodationRequests' ? 'active' : ''}
            onClick={() => setActiveTab('accommodationRequests')}
          >
            Accommodation Requests
          </button>
          <button 
            className={activeTab === 'restaurantRequests' ? 'active' : ''}
            onClick={() => setActiveTab('restaurantRequests')}
          >
            Restaurant Requests
          </button>
          
          <h3>Approved Items</h3>
          <button 
            className={activeTab === 'events' ? 'active' : ''}
            onClick={() => setActiveTab('events')}
          >
            Events
          </button>
          <button 
            className={activeTab === 'restaurants' ? 'active' : ''}
            onClick={() => setActiveTab('restaurants')}
          >
            Restaurants
          </button>
          <button 
            className={activeTab === 'accommodations' ? 'active' : ''}
            onClick={() => setActiveTab('accommodations')}
          >
            Accommodations
          </button>
          
          <h3>System Management</h3>
          <button 
            className={activeTab === 'locations' ? 'active' : ''}
            onClick={() => setActiveTab('locations')}
          >
            Locations
          </button>
          <button 
            className={activeTab === 'messages' ? 'active' : ''}
            onClick={() => setActiveTab('messages')}
          >
            Messages
            {messages.filter(msg => !msg.read).length > 0 && (
              <span className="message-badge">{messages.filter(msg => !msg.read).length}</span>
            )}
          </button>
        </div>
      </div>
      <div className="admin-content">
        <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
        {activeTab !== 'locations' && activeTab !== 'messages' && renderRequests()}
        {showDetails && renderDetails()}
        {(editingRequest || editingItem) && renderEditForm()}
        {activeTab === 'locations' && renderLocations()}
        {activeTab === 'messages' && renderMessages()}
      </div>
    </div>
  );
};

export default AdminPage; 