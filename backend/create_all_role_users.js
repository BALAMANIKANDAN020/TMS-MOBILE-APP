
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Role = require('./models/Role');
const User = require('./models/User');

const seedAllRoles = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const roles = await Role.find();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);
        
        for (let role of roles) {
            const roleNameFormat = role.name.toLowerCase().replace(' ', '');
            const email = roleNameFormat + '@example.com';
            
            const existingUser = await User.findOne({ email });
            if (!existingUser) {
                await User.create({
                    name: role.name + ' User',
                    email: email,
                    password: hashedPassword,
                    phone: '9999999999',
                    role: role._id
                });
                console.log('Created user for role:', role.name, 'Email:', email);
            } else {
                console.log('User already exists for role:', role.name, 'Email:', email);
            }
        }
        
        console.log('Done!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedAllRoles();
