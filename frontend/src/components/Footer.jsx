import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaYoutube } from 'react-icons/fa'; // Import icons
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-about">
            <Link to="/" className="footer-logo">
              <span>Ceylon Compass</span>
            </Link>
            <p className="footer-description">
              Enjoy authentic Sri Lankan experiences wherever you go.
            </p>
            <div className="social-links">
              <a href="#" className="social-icon">
                <FaFacebook /> {/* Facebook Icon */}
              </a>
              <a href="#" className="social-icon">
                <FaInstagram /> {/* Instagram Icon */}
              </a>
              <a href="#" className="social-icon">
                <FaYoutube /> {/* YouTube Icon */}
              </a>
            </div>
          </div>

          <div className="footer-links">
            <h3 className="footer-heading">Useful Links</h3>
            <ul className="links-list">
              <li><Link to="/about" className="footer-link">About us</Link></li>
              <li><Link to="/events" className="footer-link">Events</Link></li>
              <li><Link to="/restaurants" className="footer-link">Restaurant</Link></li>
            </ul>
          </div>

          <div className="footer-links">
            <h3 className="footer-heading">Main Menu</h3>
            <ul className="links-list">
              <li><Link to="/" className="footer-link">Home</Link></li>
              <li><Link to="/offers" className="footer-link">Offers</Link></li>
              <li><Link to="/menus" className="footer-link">Menus</Link></li>
            </ul>
          </div>

          <div className="footer-contact">
            <h3 className="footer-heading">Contact Us</h3>
            <p className="contact-info">ceyloncompasslk@gmail.com</p>
            <p className="contact-info">+94 77 9977189</p>
          </div>
        </div>

        <div className="copyright">
          <p>© 2025 Sri Lanka Services, United Kingdom</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;