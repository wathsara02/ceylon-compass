import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Admin.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [accommodations, setAccommodations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'events') {
        const response = await axios.get('http://localhost:5000/api/events', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setEvents(response.data);
      } else if (activeTab === 'accommodations') {
        const response = await axios.get('http://localhost:5000/api/accommodations', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setAccommodations(response.data);
      } else if (activeTab === 'messages') {
        const response = await axios.get('http://localhost:5000/api/contact', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        console.log('Messages fetched:', response.data);
        setMessages(response.data);
      }
      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) {
      return;
    }

    try {
      if (type === 'message') {
        await axios.delete(`http://localhost:5000/api/contact/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } else {
        await axios.delete(`http://localhost:5000/api/${type}/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }
      fetchData();
    } catch (err) {
      setError(`Failed to delete ${type}`);
    }
  };

  const handleMarkAsRead = async (id, isRead) => {
    try {
      await axios.patch(`http://localhost:5000/api/contact/${id}/read`, 
        { read: isRead },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      // Update the message in the local state
      setMessages(messages.map(msg => 
        msg._id === id ? { ...msg, read: isRead } : msg
      ));
    } catch (err) {
      setError('Failed to update message status');
    }
  };

  const handleEventCleanup = async () => {
    if (window.confirm('Are you sure you want to delete all past events? This action cannot be undone.')) {
      try {
        const response = await axios.post('http://localhost:5000/api/admin/cleanup-past-events', {}, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        alert(`Cleanup successful! Deleted ${response.data.deletedCount} past events.`);
        
        // Refresh the events list if on events tab
        if (activeTab === 'events') {
          fetchData();
        }
      } catch (error) {
        console.error('Error cleaning up past events:', error);
        alert('Failed to clean up past events. See console for details.');
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-actions">
          <button
            onClick={() => navigate('/events/add')}
            className="add-button"
          >
            Add Event
          </button>
          <button
            onClick={() => navigate('/accommodations/add')}
            className="add-button"
          >
            Add Accommodation
          </button>
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-tabs">
          <button
            className={`tab-button ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            Events
          </button>
          <button
            className={`tab-button ${activeTab === 'accommodations' ? 'active' : ''}`}
            onClick={() => setActiveTab('accommodations')}
          >
            Accommodations
          </button>
          <button
            className={`tab-button ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            Messages
            {messages.filter(msg => !msg.read).length > 0 && (
              <span className="message-badge">{messages.filter(msg => !msg.read).length}</span>
            )}
          </button>
        </div>

        <div className="admin-main">
          {activeTab === 'events' ? (
            <div className="events-section">
              <div className="section-header">
                <h2>Manage Events</h2>
                <button 
                  onClick={handleEventCleanup}
                  className="admin-action-button cleanup-button"
                >
                  <i className="fas fa-trash-alt"></i> Clean Up Past Events
                </button>
              </div>
              {events.length === 0 ? (
                <div className="no-items">
                  <p>No events found.</p>
                </div>
              ) : (
                <div className="items-grid">
                  {events.map(event => (
                    <div key={event._id} className="item-card">
                      <div className="item-image">
                        <img src={event.image} alt={event.title} />
                      </div>
                      <div className="item-info">
                        <h3>{event.title}</h3>
                        <p className="location">
                          {event.location.city}, {event.location.country}
                        </p>
                        <p className="date">
                          {new Date(event.date).toLocaleDateString()}
                        </p>
                        <div className="item-actions">
                          <button
                            onClick={() => navigate(`/events/${event._id}/edit`)}
                            className="edit-button"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(event._id, 'events')}
                            className="delete-button"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'accommodations' ? (
            <div className="accommodations-section">
              <h2>Manage Accommodations</h2>
              {accommodations.length === 0 ? (
                <div className="no-items">
                  <p>No accommodations found.</p>
                </div>
              ) : (
                <div className="items-grid">
                  {accommodations.map(accommodation => (
                    <div key={accommodation._id} className="item-card">
                      <div className="item-image">
                        <img src={accommodation.images[0]} alt={accommodation.name} />
                      </div>
                      <div className="item-info">
                        <h3>{accommodation.name}</h3>
                        <p className="location">
                          {accommodation.location.city}, {accommodation.location.country}
                        </p>
                        <p className="type">{accommodation.type}</p>
                        <div className="item-actions">
                          <button
                            onClick={() => navigate(`/accommodations/${accommodation._id}/edit`)}
                            className="edit-button"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(accommodation._id, 'accommodations')}
                            className="delete-button"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="messages-section">
              <div className="section-header">
                <h2>Messages from Contact Form</h2>
                <div className="messages-filter">
                  <span className="filter-label">
                    {messages.filter(msg => !msg.read).length} unread messages
                  </span>
                </div>
              </div>
              {messages.length === 0 ? (
                <div className="no-items">
                  <p>No messages found.</p>
                </div>
              ) : (
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
                          onClick={() => handleDelete(message._id, 'message')}
                          className="delete-button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;