import React from 'react';
import '../styles/VerificationPopup.css';

const VerificationPopup = ({ type = 'event', onClose }) => {
  const getTitle = () => {
    switch (type) {
      case 'event':
        return 'Event Submission Successful';
      case 'accommodation':
        return 'Accommodation Submission Successful';
      case 'restaurant':
        return 'Restaurant Submission Successful';
      default:
        return 'Submission Successful';
    }
  };

  const getMessage = () => {
    switch (type) {
      case 'event':
        return 'Your event request is being verified. You will be notified once it is approved.';
      case 'accommodation':
        return 'Your accommodation request is being verified. You will be notified once it is approved.';
      case 'restaurant':
        return 'Your restaurant request is being verified. You will be notified once it is approved.';
      default:
        return 'Your request is being verified. You will be notified once it is approved.';
    }
  };

  return (
    <div className="verification-popup-overlay">
      <div className="verification-popup">
        <div className="verification-popup-content">
          <h2>{getTitle()}</h2>
          <p>{getMessage()}</p>
          <button onClick={onClose} className="verification-popup-button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationPopup; 