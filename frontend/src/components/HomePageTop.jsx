// src/components/home/HeroSection.jsx
import React from 'react';
import '../styles/HomePageTop.css'; // Import the regular CSS file

import heroMainImage from '../assets/images/hero-food.jpg';
import foodItem1 from '../assets/images/food-item-1.jpg';
import foodItem2 from '../assets/images/food-item-2.jpg';

export default function HeroSection() {
  return (
    <section className="heroSection">
      <div className="container">
        <div className="content">
          {/* Left side - Text content */}
          <div className="textContent">
            <div className="foodBadge">Hot spicy food 🌶️</div>
            <h1 className="heading">
              Bringing Sri Lanka <br />
              Closer to <span className="highlight">You</span>
            </h1>
            <p className="description">
              Find Sri Lankan restaurants, events, and apartments wherever you are.
            </p>
          </div>

          {/* Right side - Image */}
          <div className="imageContent">
            <div className="mainImageContainer">
              <div className="circleBackground"></div>
              <div className="mainImage">
                <img src={heroMainImage} alt="Sri Lankan Food" />
              </div>
            </div>

            <div className="foodItem1">
              <img src={foodItem1} alt="Spicy noodles" />
              <div className="foodItemLabel">
                <p>Spicy noodles</p>
                <p className="price">LKR 450.00</p>
              </div>
            </div>

            <div className="foodItem2">
              <img src={foodItem2} alt="Vegetarian salad" />
              <div className="foodItemLabel">
                <p>Vegetarian salad</p>
                <p className="price">LKR 350.00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
