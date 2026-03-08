import React from 'react';
import '../styles/About.css';

const About = () => {
  return (
    <div className="about-container">
      <div className="about-header">
        <div className="about-header-image">
          <img src="https://res.cloudinary.com/dzetdg1sz/image/upload/v1746417925/Nine-Arch-Bridge-1205x650-1_ikaght.jpg" alt="Sri Lanka scenic view" />
        </div>
        <h1>About Us</h1>
        <p className="subtitle">Discover the best of Sri Lanka's culture, cuisine, and comfort</p>
      </div>

      <div className="about-content">
        <section className="about-section">
          <h2>Our Mission</h2>
          <div className="mission-content">
            <div className="mission-text">
              <p>
                At Ceylon Compass, we are passionate about connecting visitors and locals with the authentic 
                experiences Sri Lanka has to offer. Our platform showcases the island's vibrant cultural events, 
                delicious local cuisine, and comfortable accommodations - making it easier for you to explore 
                and experience the best of this beautiful country.
              </p>
            </div>
            <div className="mission-image">
              <img src="https://images.unsplash.com/photo-1588083949404-c4f1ed1323b3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80" alt="Sri Lankan cultural scene" />
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>What We Offer</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-image">
                <img src="https://res.cloudinary.com/dzetdg1sz/image/upload/v1746418118/DeWatermark.ai_1735543409243_ihs3xf.png" alt="Cultural event" />
              </div>
              <h3>Cultural Events</h3>
              <p>
                Discover local festivals, performances, cultural ceremonies, 
                and special events happening across the island. Find unique experiences 
                that showcase Sri Lanka's rich heritage and traditions.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-image">
                <img src="https://images.unsplash.com/photo-1563245372-f21724e3856d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80" alt="Sri Lankan cuisine" />
              </div>
              <h3>Local Restaurants</h3>
              <p>
                Explore Sri Lanka's culinary delights from authentic local eateries to 
                fine dining establishments. Read reviews, browse menus, and find the 
                perfect spot for your next meal.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-image">
                <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80" alt="Accommodation in Sri Lanka" />
              </div>
              <h3>Quality Accommodations</h3>
              <p>
                Find the ideal place to stay - from luxury hotels and boutique villas to 
                cozy homestays and budget-friendly options. Compare amenities and locations 
                to make your stay comfortable and convenient.
              </p>
            </div>

            
          </div>
        </section>

        <section className="about-section">
          <h2>How It Works</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Find Your Location</h3>
              <p>Select your current location or destination to discover local events, restaurants, and accommodations</p>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Explore Options</h3>
              <p>Browse through cultural events, local dining spots, and comfortable places to stay</p>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <h3>View Details</h3>
              <p>Check availability, prices, reviews, and all important information before making your choice</p>
            </div>

            <div className="step-card">
              <div className="step-number">4</div>
              <h3>Connect & Enjoy</h3>
              <p>Get contact information for events and venues, then enjoy authentic local experiences</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About; 