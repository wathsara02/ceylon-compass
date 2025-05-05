import React, { useState, useEffect } from "react";
import "../styles/ListingForm.css";

const countryCityData = {
  USA: ["New York", "Los Angeles", "Chicago"],
  Canada: ["Toronto", "Vancouver", "Montreal"],
  UK: ["London", "Manchester", "Birmingham"],
  India: ["Delhi", "Mumbai", "Bangalore"],
};

const ListingForm = () => {
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [contact, setContact] = useState("");
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cloudinaryLoaded, setCloudinaryLoaded] = useState(false);

  useEffect(() => {
    if (window.cloudinary && window.cloudinary.openUploadWidget) {
      setCloudinaryLoaded(true);
      return;
    }

    if (!document.querySelector('script[src="https://widget.cloudinary.com/v2.0/global/all.js"]')) {
      console.log("Cloudinary script not found, adding dynamically...");
      const script = document.createElement("script");
      script.src = "https://widget.cloudinary.com/v2.0/global/all.js";
      script.type = "text/javascript";
      script.async = true;
      script.onload = () => {
        console.log("Cloudinary script loaded successfully");
        if (window.cloudinary && window.cloudinary.openUploadWidget) {
          setCloudinaryLoaded(true);
        } else {
          setError("Cloudinary widget failed to initialize. Please refresh the page.");
        }
      };
      script.onerror = () => {
        console.error("Failed to load Cloudinary script");
        setError("Failed to load Cloudinary script. Please check your network and try again.");
      };
      document.head.appendChild(script);
    }
  }, []);

  const handleCountryChange = (e) => {
    setSelectedCountry(e.target.value);
    setSelectedCity("");
  };

  const handleImageUpload = () => {
    if (!cloudinaryLoaded || !window.cloudinary || !window.cloudinary.openUploadWidget) {
      setError("Cloudinary widget is not available. Please refresh the page.");
      return;
    }

    window.cloudinary.openUploadWidget(
      {
        cloudName: "dzetdg1sz",
        uploadPreset: "accommodations",
        sources: ["local", "url"],
        multiple: false,
        resourceType: "image",
      },
      (error, result) => {
        if (!error && result && result.event === "success") {
          setImage(result.info.secure_url);
          setSuccess("Image uploaded successfully!");
          setError("");
        } else if (error) {
          console.error("Upload error:", error);
          setError("Image upload failed: " + (error.message || "Unknown error"));
          setSuccess("");
        }
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted with data:", {
      title,
      country: selectedCountry,
      city: selectedCity,
      price,
      contact,
      image,
    });

    setError("");
    setSuccess("");

    // Client-side validation
    if (!title || !selectedCountry || !selectedCity || !price || !contact || !image) {
      setError("Please fill all required fields.");
      return;
    }
    if (isNaN(Number(price)) || Number(price) <= 0) {
      setError("Price must be a valid positive number.");
      return;
    }

    try {
      console.log("Sending POST to /api/accommodationreq");
      const response = await fetch("http://localhost:5000/api/accommodationreq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          country: selectedCountry,
          city: selectedCity,
          price: Number(price),
          contact,
          image,
        }),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        let errorMsg = "Failed to add accommodation request";
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          errorMsg = data.error || data.message || errorMsg;
        } else {
          console.error("Non-JSON response received:", await response.text());
          if (response.status === 404) {
            errorMsg = "API endpoint not found. Please check if the backend is running and the /api/accommodationreq route is registered.";
          }
        }
        setError(`${errorMsg} (HTTP ${response.status})`);
        return;
      }

      const data = await response.json();
      setSuccess("Accommodation request added successfully!");
      console.log("Success response:", data);

      // Reset form
      setTitle("");
      setSelectedCountry("");
      setSelectedCity("");
      setPrice("");
      setContact("");
      setImage("");
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Unable to connect to the server. Please check if the backend is running and try again.");
    }
  };

  return (
    <div className="listing-modal">
      <div className="listing-container">
        <h2>Add Accommodation Request</h2>
        <form className="listing-form" onSubmit={handleSubmit}>
          <label>
            Title
            <input
              type="text"
              placeholder="Enter listing title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label>
            Price
            <input
              type="number"
              placeholder="Enter price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              min="1"
            />
          </label>
          <label>
            Contact Info
            <input
              type="text"
              placeholder="Phone or Email"
              value={contact}
              onChange={(e) => setContact(e.target.value)} // Fixed bug
              required
            />
          </label>
          <label>
            Country
            <select
              value={selectedCountry}
              onChange={handleCountryChange}
              required
            >
              <option value="">Select a country</option>
              {Object.keys(countryCityData).map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </label>
          <label>
            City
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              disabled={!selectedCountry}
              required
            >
              <option value="">Select a city</option>
              {(countryCityData[selectedCountry] || []).map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>
          <label>
            Upload Image
            <button
              type="button"
              className="upload-button"
              onClick={handleImageUpload}
              disabled={!cloudinaryLoaded}
            >
              {cloudinaryLoaded ? "Upload Image" : "Loading Widget..."}
            </button>
            {image && (
              <div className="image-preview">
                <img src={image} alt="Preview" />
              </div>
            )}
          </label>
          {error && <p className="error-text">{error}</p>}
          {success && <p className="success-text">{success}</p>}
          <button type="submit" className="submit-button">
            Submit Listing
          </button>
        </form>
      </div>
    </div>
  );
};

export default ListingForm;