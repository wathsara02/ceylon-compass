const express = require('express');
const router = express.Router();
const notificationRepository = require('../repositories/notificationRepository');
const { auth } = require('../middleware/auth');

// Create a new notification
router.post('/', auth, async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;
    const notification = await notificationRepository.create({ userId, title, message, type });
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Error creating notification', error: error.message });
  }
});

// Get user's notifications
router.get('/user', auth, async (req, res) => {
  try {
    const notifications = await notificationRepository.findByUser(req.user._id);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await notificationRepository.markRead(req.params.id, req.user._id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification', error: error.message });
  }
});

// Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
  try {
    await notificationRepository.markAllRead(req.user._id);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notifications', error: error.message });
  }
});

// Get count of unread notifications
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await notificationRepository.countUnread(req.user._id);
    res.json({ count });
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    res.status(500).json({ message: 'Error counting unread notifications', error: error.message });
  }
});

module.exports = router;
