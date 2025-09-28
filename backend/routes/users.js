const express = require("express");
const router = express.Router();
const User = require("../models/User");

// POST /api/users/register
router.post("/register", async (req, res) => {
  const { username, password, name } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

  try {
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const user = new User({ username, password, name });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/users/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    const userResponse = {
      _id: user._id,
      username: user.username,
      name: user.name
    };

    res.status(200).json({ message: "Login successful", user: userResponse });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
