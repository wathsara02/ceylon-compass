const { db, admin } = require('../config/firebaseAdmin');

const collection = db.collection('restaurants');
const toDoc = (doc) => (doc.exists ? { _id: doc.id, ...doc.data() } : null);

module.exports = {
  findAll: async ({ country, city } = {}) => {
    let query = collection;
    if (country) query = query.where('country', '==', country);
    if (city) query = query.where('city', '==', city);
    const snapshot = await query.get();
    return snapshot.docs.map(toDoc);
  },

  findById: async (id) => toDoc(await collection.doc(id).get()),

  create: async (data) => {
    const ref = await collection.add({
      ...data,
      rating: data.rating ?? 0,
      reviews: data.reviews ?? [],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return toDoc(await ref.get());
  },

  updateById: async (id, data) => {
    await collection.doc(id).update(data);
    return toDoc(await collection.doc(id).get());
  },

  deleteById: async (id) => collection.doc(id).delete(),

  addReview: async (id, { userId, rating, comment }) => {
    return db.runTransaction(async (tx) => {
      const ref = collection.doc(id);
      const doc = await tx.get(ref);
      if (!doc.exists) return null;

      const current = doc.data();
      const reviews = [
        ...(current.reviews || []),
        { user: userId, rating, comment, date: new Date() }
      ];
      const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

      tx.update(ref, { reviews, rating: averageRating });
      return { _id: id, ...current, reviews, rating: averageRating };
    });
  }
};
