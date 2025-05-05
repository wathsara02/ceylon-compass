import React, { useState } from 'react';

const [formData, setFormData] = useState({
  name: '',
  description: '',
  type: '',
  location: {
    country: '',
    city: '',
    address: ''
  },
  price: '',
  capacity: '',
  amenities: [],
  images: [],
  contactNumber: '',
  status: 'pending'
});

<div className="mb-4">
  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contactNumber">
    Contact Number
  </label>
  <input
    type="tel"
    id="contactNumber"
    value={formData.contactNumber}
    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
    placeholder="Enter contact number"
    required
  />
</div> 