require('dotenv').config();
const { admin } = require('../config/firebaseAdmin');
const userRepository = require('../repositories/userRepository');

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@ceyloncompass.dummy';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'password123';
const ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME || 'admin_dummy';

async function seedAdmin() {
  try {
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(ADMIN_EMAIL);
      console.log('Admin auth account already exists:', userRecord.uid);
    } catch (error) {
      if (error.code !== 'auth/user-not-found') throw error;
      userRecord = await admin.auth().createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        emailVerified: true
      });
      console.log('Created admin auth account:', userRecord.uid);
    }

    await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'admin' });

    const existingProfile = await userRepository.findByUid(userRecord.uid);
    if (!existingProfile) {
      await userRepository.create(userRecord.uid, {
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        country: 'Sri Lanka',
        city: 'Colombo',
        role: 'admin'
      });
      console.log('Created admin Firestore profile');
    } else {
      console.log('Admin Firestore profile already exists');
    }

    console.log(`Admin ready. Login with ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();
