const userRepository = require('../repositories/userRepository');

// Mirrors Mongoose's .populate('createdBy', 'username email') for Firestore docs
// where createdBy is stored as a Firebase UID string.
const attachCreator = async (docs) => {
  const list = Array.isArray(docs) ? docs : [docs];
  const uids = list.map((doc) => doc.createdBy).filter(Boolean);
  const users = await userRepository.findByUids(uids);
  const usersByUid = new Map(users.map((user) => [user._id, user]));

  const withCreator = list.map((doc) => {
    const creator = usersByUid.get(doc.createdBy);
    return {
      ...doc,
      createdBy: creator
        ? { _id: creator._id, username: creator.username, email: creator.email }
        : doc.createdBy
    };
  });

  return Array.isArray(docs) ? withCreator : withCreator[0];
};

module.exports = attachCreator;
