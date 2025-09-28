import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/LogIn';
import Register from './pages/Register';
import Restaurants from './pages/Restaurants';
import RestaurantDetails from './pages/RestaurantDetails';
import AddRestaurant from './pages/AddRestaurant';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import AddEvent from './pages/AddEvent';
import Accommodations from './pages/Accommodations';
import AccommodationDetails from './pages/AccommodationDetails';
import AddAccommodation from './pages/AddAccommodation';
import Profile from './pages/Profile';
import About from './pages/About';
import Contact from './pages/Contact';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminPage from './pages/AdminPage';
import './styles/App.css';

// Protected Route component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAuthenticated } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <LocationProvider>
        <Router>
          <div className="app">
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                
                {/* Restaurant Routes */}
                <Route path="/restaurants" element={<Restaurants />} />
                <Route
                  path="/restaurants/add"
                  element={
                    <ProtectedRoute>
                      <AddRestaurant />
                    </ProtectedRoute>
                  }
                />
                <Route path="/restaurants/:id" element={<RestaurantDetails />} />
                
                {/* Event Routes */}
                <Route path="/events" element={<Events />} />
                <Route
                  path="/events/add"
                  element={
                    <ProtectedRoute>
                      <AddEvent />
                    </ProtectedRoute>
                  }
                />
                <Route path="/events/:id" element={<EventDetails />} />
                
                {/* Accommodation Routes */}
                <Route path="/accommodations" element={<Accommodations />} />
                <Route
                  path="/accommodations/add"
                  element={
                    <ProtectedRoute>
                      <AddAccommodation />
                    </ProtectedRoute>
                  }
                />
                <Route path="/accommodations/:id" element={<AccommodationDetails />} />
                
                {/* Profile Routes */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                
                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Forgot Password Routes */}
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                
                {/* 404 Route */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </LocationProvider>
    </AuthProvider>
  );
};

export default App;
