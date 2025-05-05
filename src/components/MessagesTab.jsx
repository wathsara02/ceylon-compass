import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/MessagesTab.css';

const MessagesTab = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/notifications/user', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setNotifications(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications');
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:5000/api/notifications/read-all',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  if (loading) return <div className="loading">Loading messages...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="messages-tab">
      <div className="messages-header">
        <h2>Messages</h2>
        {notifications.some(n => !n.read) && (
          <button onClick={markAllAsRead} className="mark-all-read">
            Mark all as read
          </button>
        )}
      </div>
      
      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="no-messages">No messages yet</div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification._id}
              className={`notification-item ${!notification.read ? 'unread' : ''}`}
              onClick={() => markAsRead(notification._id)}
            >
              <div className="notification-title">{notification.title}</div>
              <div className="notification-message">{notification.message}</div>
              <div className="notification-date">
                {new Date(notification.createdAt).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MessagesTab; 