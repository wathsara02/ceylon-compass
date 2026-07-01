const { db } = require('../config/firebaseAdmin');
const eventRepository = require('../repositories/eventRepository');

/**
 * Deletes all events with dates older than the current date
 * @returns {Promise<{deleted: number, error: Error|null}>} Result object with count of deleted events
 */
const cleanupPastEvents = async () => {
  try {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    console.log(`Running cleanup for events older than ${currentDate.toISOString()}`);

    const refs = await eventRepository.findOlderThan(currentDate);

    for (let i = 0; i < refs.length; i += 500) {
      const batch = db.batch();
      refs.slice(i, i + 500).forEach((ref) => batch.delete(ref));
      await batch.commit();
    }

    console.log(`Deleted ${refs.length} past events`);
    return { deleted: refs.length, error: null };
  } catch (error) {
    console.error("Error cleaning up past events:", error);
    return { deleted: 0, error };
  }
};

module.exports = { cleanupPastEvents };
