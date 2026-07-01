const { db, admin } = require('../config/firebaseAdmin');

const collection = db.collection('events');
const toDoc = (doc) => (doc.exists ? { _id: doc.id, ...doc.data() } : null);

module.exports = {
  findApproved: async ({ country, city, sortDirection = 'asc', fromDate } = {}) => {
    let query = collection.where('status', '==', 'approved');
    if (fromDate) query = query.where('date', '>=', fromDate);
    if (country) query = query.where('country', '==', country);
    if (city) query = query.where('city', '==', city);
    query = query.orderBy('date', sortDirection);
    const snapshot = await query.get();
    return snapshot.docs.map(toDoc);
  },

  findById: async (id) => toDoc(await collection.doc(id).get()),

  findByCreatedBy: async (uid) => {
    const snapshot = await collection.where('createdBy', '==', uid).orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(toDoc);
  },

  findByStatus: async (status) => {
    const snapshot = await collection.where('status', '==', status).orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(toDoc);
  },

  findOlderThan: async (date) => {
    const snapshot = await collection.where('date', '<', date).get();
    return snapshot.docs.map((doc) => doc.ref);
  },

  create: async (data) => {
    const ref = await collection.add({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return toDoc(await ref.get());
  },

  updateById: async (id, data) => {
    await collection.doc(id).update(data);
    return toDoc(await collection.doc(id).get());
  },

  deleteById: async (id) => collection.doc(id).delete(),

  countByStatus: async (status) => {
    const snapshot = await collection.where('status', '==', status).count().get();
    return snapshot.data().count;
  }
};
