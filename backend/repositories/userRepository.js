const { db, admin } = require('../config/firebaseAdmin');

const collection = db.collection('users');

const toUser = (doc) => (doc.exists ? { _id: doc.id, ...doc.data() } : null);

module.exports = {
  findByUid: async (uid) => toUser(await collection.doc(uid).get()),

  findByUsername: async (username) => {
    const snapshot = await collection.where('username', '==', username).limit(1).get();
    return snapshot.empty ? null : toUser(snapshot.docs[0]);
  },

  findByEmail: async (email) => {
    const snapshot = await collection.where('email', '==', email).limit(1).get();
    return snapshot.empty ? null : toUser(snapshot.docs[0]);
  },

  create: async (uid, data) => {
    await collection.doc(uid).set({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return toUser(await collection.doc(uid).get());
  },

  updateByUid: async (uid, data) => {
    await collection.doc(uid).update(data);
    return toUser(await collection.doc(uid).get());
  },

  deleteByUid: async (uid) => collection.doc(uid).delete(),

  findAll: async () => {
    const snapshot = await collection.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(toUser);
  },

  findByUids: async (uids) => {
    const uniqueUids = [...new Set(uids)].filter(Boolean);
    if (uniqueUids.length === 0) return [];

    const chunks = [];
    for (let i = 0; i < uniqueUids.length; i += 30) {
      chunks.push(uniqueUids.slice(i, i + 30));
    }

    const results = await Promise.all(
      chunks.map((chunk) =>
        collection.where(admin.firestore.FieldPath.documentId(), 'in', chunk).get()
      )
    );

    return results.flatMap((snapshot) => snapshot.docs.map(toUser));
  }
};
