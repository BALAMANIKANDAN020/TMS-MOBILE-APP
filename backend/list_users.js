
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/cms')
  .then(async () => {
    const users = await User.find({});
    console.log(users.map(u => u.name));
    process.exit(0);
  });
