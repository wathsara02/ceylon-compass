import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

// Simple JWT decoder function
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // API base URL
  const API_URL = 'http://localhost:5000/api';

  // Setup axios default config
  axios.defaults.baseURL = API_URL;

  // Check token validity
  const isTokenValid = useCallback((token) => {
    if (!token) return false;
    const decoded = decodeJWT(token);
    if (!decoded) return false;
    return decoded.exp * 1000 > Date.now();
  }, []);

  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        console.log('Initializing auth with token:', token ? 'Present' : 'Missing');
        console.log('Stored user:', storedUser);

        if (!token || !isTokenValid(token)) {
          console.log('Token invalid or missing, clearing auth data');
          setUser(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return;
        }

        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // If we have stored user data, use it
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser && (parsedUser._id || parsedUser.id)) {
              setUser(parsedUser);
              return;
            }
          } catch (e) {
            console.error('Error parsing stored user:', e);
          }
        }

        // If no valid stored user, fetch from server
        const response = await axios.get('/auth/profile');
        if (response.data && (response.data._id || response.data.id)) {
          const userData = response.data;
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          throw new Error('Invalid user data received');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [isTokenValid]);

  // Setup axios interceptors
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          setUser(null);
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const login = async (credentials) => {
    try {
      setError(null);
      console.log('Sending login request with credentials:', credentials);
      const response = await axios.post('/auth/login', credentials);
      console.log('Login response:', response.data);
      
      if (response.data && response.data.token) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(user);
        return { success: true, user };
      }
      
      throw new Error('Invalid response from server');
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setError(error.response?.data?.message || 'Login failed');
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed',
        field: error.response?.data?.field
      };
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await axios.post('/auth/register', userData);
      const { token, user: newUser } = response.data;
      
      if (!token || !isTokenValid(token)) {
        throw new Error('Invalid token received');
      }

      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(newUser);
      
      return { success: true, user: newUser };
    } catch (error) {
      console.error('Registration error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const errorMessage = error.response?.data?.message || 'Registration failed';
      // Only set general error if there's no field-specific error
      if (!error.response?.data?.field) {
        setError(errorMessage);
      }
      
      // Return error information including field-specific errors if available
      return { 
        success: false, 
        error: errorMessage,
        field: error.response?.data?.field
      };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const response = await axios.put('/auth/profile', profileData);
      const updatedUser = response.data;
      
      // Update local storage and state
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return { success: true, user: updatedUser };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setError(null);
  }, []);

  const fetchUnreadNotificationsCount = async () => {
    try {
      if (!user) return;
      
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fix the URL to use proper axios configuration
      const response = await axios.get('/api/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data && typeof response.data.count === 'number') {
        setUnreadNotificationsCount(response.data.count);
      }
    } catch (error) {
      console.error('Error fetching unread notifications count:', error);
    }
  };

  // Add this to useEffect to check notifications periodically
  useEffect(() => {
    if (user) {
      fetchUnreadNotificationsCount();
      
      // Set up interval to check for new notifications every minute
      const intervalId = setInterval(fetchUnreadNotificationsCount, 60000);
      
      return () => clearInterval(intervalId);
    }
  }, [user]);

  const updateLocation = async (country, city) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await axios.put('/auth/profile', 
        { country, city },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Update user in state and localStorage
      const updatedUser = response.data;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    updateLocation,
    isAuthenticated: !!user,
    updateProfile,
    unreadNotificationsCount
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 