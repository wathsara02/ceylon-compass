import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth as firebaseAuth } from '../lib/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  axios.defaults.baseURL = API_URL;

  // Keep the axios Authorization header in sync with the current Firebase ID token
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      async (config) => {
        const currentUser = firebaseAuth.currentUser;
        if (currentUser) {
          const token = await currentUser.getIdToken();
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => axios.interceptors.request.eject(requestInterceptor);
  }, []);

  // Firebase Auth session state drives the profile fetch
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      setLoading(true);
      try {
        if (!firebaseUser) {
          setUser(null);
          return;
        }

        const token = await firebaseUser.getIdToken();
        const response = await axios.get('/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (err) {
        console.error('Error loading user profile:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async ({ usernameOrEmail, password }) => {
    try {
      setError(null);

      const { data } = await axios.get('/auth/resolve-login', {
        params: { identifier: usernameOrEmail }
      });

      const credential = await signInWithEmailAndPassword(firebaseAuth, data.email, password);
      const token = await credential.user.getIdToken();
      const profileResponse = await axios.get('/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser(profileResponse.data);
      return { success: true, user: profileResponse.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Incorrect password or account not found';
      const field = err.response?.data?.field || (err.code?.startsWith('auth/') ? 'password' : undefined);
      setError(message);
      return { success: false, error: message, field };
    }
  };

  const register = async ({ username, email, password, country, city }) => {
    try {
      setError(null);

      const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      const token = await credential.user.getIdToken();

      const response = await axios.post(
        '/auth/register-profile',
        { username, country, city },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUser(response.data.user);
      return { success: true, user: response.data.user };
    } catch (err) {
      const message = err.response?.data?.message
        || (err.code === 'auth/email-already-in-use' ? 'This email is already registered.' : 'Registration failed');
      const field = err.response?.data?.field || (err.code === 'auth/email-already-in-use' ? 'email' : undefined);
      if (!field) setError(message);
      return { success: false, error: message, field };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const response = await axios.put('/auth/profile', profileData);
      setUser(response.data);
      return { success: true, user: response.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Profile update failed';
      setError(message);
      throw new Error(message);
    }
  };

  const updateLocation = async (country, city) => {
    const response = await axios.put('/auth/profile', { country, city });
    setUser(response.data);
    return response.data;
  };

  const logout = useCallback(async () => {
    await signOut(firebaseAuth);
    setUser(null);
    setError(null);
  }, []);

  const fetchUnreadNotificationsCount = async () => {
    try {
      if (!user) return;
      const response = await axios.get('/notifications/unread-count');
      if (response.data && typeof response.data.count === 'number') {
        setUnreadNotificationsCount(response.data.count);
      }
    } catch (err) {
      console.error('Error fetching unread notifications count:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadNotificationsCount();
      const intervalId = setInterval(fetchUnreadNotificationsCount, 60000);
      return () => clearInterval(intervalId);
    }
  }, [user]);

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
