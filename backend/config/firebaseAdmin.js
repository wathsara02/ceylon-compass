const admin = require('firebase-admin');

const buildCredential = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON));
  }

  return admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Vercel/most env systems escape newlines in multi-line secrets as literal "\n"
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  });
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: buildCredential()
  });
}

const db = admin.firestore();

module.exports = { admin, db };
