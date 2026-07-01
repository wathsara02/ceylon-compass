const { db, admin } = require('../config/firebaseAdmin');

const collection = db.collection('notifications');
const toDoc = (doc) => (doc.exists ? { _id: doc.id, ...doc.data() } : null);

module.exports = {
  findByUser: async (userId) => {
    const snapshot = await collection.where('userId', '==', userId).orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(toDoc);
  },

  create: async (data) => {
    const ref = await collection.add({
      read: false,
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return toDoc(await ref.get());
  },

  markRead: async (id, userId) => {
    const doc = await collection.doc(id).get();
    if (!doc.exists || doc.data().userId !== userId) return null;
    await doc.ref.update({ read: true });
    return toDoc(await doc.ref.get());
  },

  markAllRead: async (userId) => {
    const snapshot = await collection.where('userId', '==', userId).where('read', '==', false).get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.update(doc.ref, { read: true }));
    await batch.commit();
  },

  countUnread: async (userId) => {
    const snapshot = await collection.where('userId', '==', userId).where('read', '==', false).count().get();
    return snapshot.data().count;
  }
};
