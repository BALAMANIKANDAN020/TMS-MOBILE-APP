const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Role = require('./models/Role');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const users = await User.find().populate('role');
        const defaultRole = await Role.findOne({ name: 'User' });

        for (let user of users) {
            let updated = false;
            
            if (!user.name) {
                user.name = user.email ? user.email.split('@')[0] : 'Unknown';
                updated = true;
            }
            if (!user.phone) {
                user.phone = '0000000000';
                updated = true;
            }
            if (!user.email) {
                user.email = `${user.name.toLowerCase().replace(/\s/g, '')}@example.com`;
                updated = true;
            }
            if (!user.role) {
                user.role = defaultRole ? defaultRole._id : null;
                updated = true;
            }

            if (updated) {
                await user.save();
                console.log(`Updated user: ${user.name}`);
            }
        }
        console.log('Finished updating existing users.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
