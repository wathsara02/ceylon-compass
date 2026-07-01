const { db, admin } = require('../config/firebaseAdmin');

const collection = db.collection('eventreq');
const toDoc = (doc) => (doc.exists ? { _id: doc.id, ...doc.data() } : null);

module.exports = {
  findAll: async () => {
    const snapshot = await collection.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(toDoc);
  },

  findByStatus: async (status) => {
    const snapshot = await collection.where('status', '==', status).orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(toDoc);
  },

  findById: async (id) => toDoc(await collection.doc(id).get()),

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

  deleteById: async (id) => collection.doc(id).delete()
};
