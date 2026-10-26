const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/cms_db')
  .then(async () => {
    console.log('Connected to MongoDB');
    const result = await User.deleteMany({
      name: { $in: ['Admin', 'Tech Staff', 'Test User 1', 'Test User 2'] }
    });
    console.log('Deleted users:', result.deletedCount);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
