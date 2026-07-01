const express = require('express');
const router = express.Router();
const messageRepository = require('../repositories/messageRepository');
const { auth, isAdmin } = require('../middleware/auth');

// Submit a contact message (public route)
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    await messageRepository.create({ name, email, subject, message });

    res.status(201).json({ message: 'Message submitted successfully', success: true });
  } catch (error) {
    console.error('Error submitting message:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all messages (admin only)
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const messages = await messageRepository.findAll();
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark message as read/unread (admin only)
router.patch('/:id/read', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { read } = req.body;

    const message = await messageRepository.updateById(id, { read: read !== undefined ? read : true });
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json(message);
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a message (admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await messageRepository.deleteById(id);
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
