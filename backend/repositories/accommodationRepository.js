const { db, admin } = require('../config/firebaseAdmin');

const collection = db.collection('accommodations');
const toDoc = (doc) => (doc.exists ? { _id: doc.id, ...doc.data() } : null);

module.exports = {
  findApproved: async ({ country, city, priceRange, minPrice, maxPrice } = {}) => {
    let query = collection.where('status', '==', 'approved');
    if (country) query = query.where('country', '==', country);
    if (city) query = query.where('city', '==', city);
    if (priceRange) query = query.where('priceRange', '==', priceRange);
    if (minPrice) query = query.where('price', '>=', Number(minPrice));
    if (maxPrice) query = query.where('price', '<=', Number(maxPrice));

    const snapshot = await query.get();
    const docs = snapshot.docs.map(toDoc);
    return docs.sort((a, b) => a.price - b.price);
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

  deleteByCreatedBy: async (uid) => {
    const snapshot = await collection.where('createdBy', '==', uid).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  },

  countByStatus: async (status) => {
    const snapshot = await collection.where('status', '==', status).count().get();
    return snapshot.data().count;
  }
};
