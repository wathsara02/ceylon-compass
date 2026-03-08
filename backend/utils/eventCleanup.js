// Utility function to delete past events
const mongoose = require('mongoose');
const Event = require('../models/Event');

/**
 * Deletes all events with dates older than the current date
 * @returns {Promise<{deleted: number, error: Error|null}>} Result object with count of deleted events
 */
const cleanupPastEvents = async () => {
  try {
    // Create date for today at 00:00:00 local time
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    console.log(`Running cleanup for events older than ${currentDate.toISOString()}`);
    
    // Find events with dates older than today
    const result = await Event.deleteMany({
      date: { $lt: currentDate }
    });
    
    console.log(`Deleted ${result.deletedCount} past events`);
    return { deleted: result.deletedCount, error: null };
  } catch (error) {
    console.error("Error cleaning up past events:", error);
    return { deleted: 0, error };
  }
};

module.exports = { cleanupPastEvents }; 