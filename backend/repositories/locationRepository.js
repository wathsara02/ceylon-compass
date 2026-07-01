const { db } = require('../config/firebaseAdmin');

const collection = db.collection('locations');
const toDoc = (doc) => (doc.exists ? { _id: doc.id, country: doc.id, ...doc.data() } : null);

module.exports = {
  findAllCountries: async () => {
    const snapshot = await collection.get();
    return snapshot.docs.map((doc) => doc.id).sort();
  },

  findAll: async () => {
    const snapshot = await collection.get();
    return snapshot.docs.map(toDoc).sort((a, b) => a.country.localeCompare(b.country));
  },

  findByCountry: async (country) => toDoc(await collection.doc(country).get()),

  create: async (country, cities) => {
    await collection.doc(country).set({ cities });
    return toDoc(await collection.doc(country).get());
  },

  addCity: async (country, city) => {
    const ref = collection.doc(country);
    const doc = await ref.get();
    if (!doc.exists) return null;
    const cities = [...(doc.data().cities || []), city];
    await ref.update({ cities });
    return toDoc(await ref.get());
  },

  removeCity: async (country, city) => {
    const ref = collection.doc(country);
    const doc = await ref.get();
    if (!doc.exists) return null;
    const cities = (doc.data().cities || []).filter((c) => c !== city);
    await ref.update({ cities });
    return toDoc(await ref.get());
  },

  deleteByCountry: async (country) => collection.doc(country).delete()
};
