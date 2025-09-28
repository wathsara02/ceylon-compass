const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Connect directly without the User model to avoid triggering the pre-save hook
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection;
    const users = await db.collection('users').find({}).toArray();
    
    for (const user of users) {
      // Check if the password doesn't look like a bcrypt hash
      if (!user.password.startsWith('$2b$') && !user.password.startsWith('$2a$')) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        
        await db.collection('users').updateOne(
          { _id: user._id },
          { $set: { password: hashedPassword } }
        );
        
        console.log(`Updated password for user: ${user.username}`);
      }
    }
    
    console.log('Password update complete');
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error updating passwords:', err);
    process.exit(1);
  });
