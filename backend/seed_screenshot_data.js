require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Department = require('./models/Department');
const Programme = require('./models/Programme');
const Block = require('./models/Block');
const Room = require('./models/Room');
const Role = require('./models/Role');
const User = require('./models/User');

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cms_db');
        console.log('Connected to MongoDB for Seeding exact Screenshot Data...');

        // 1. Roles (Keep existing or ensure default roles)
        let roles = await Role.find();
        if (roles.length === 0) {
            const roleNames = ['Superadmin', 'User', 'Networking Staff', 'Plumber', 'Electrician', 'Software Developer'];
            roles = await Role.insertMany(roleNames.map(name => ({ name })));
        }

        const superAdminRole = roles.find(r => r.name === 'Superadmin') || roles[0];
        const userRole = roles.find(r => r.name === 'User') || roles[1];
        const techRole = roles.find(r => r.name === 'Networking Staff') || roles[2];

        // Clear existing master data
        await Promise.all([
            Department.deleteMany(),
            Programme.deleteMany(),
            Block.deleteMany(),
            Room.deleteMany()
        ]);

        // 2. Insert Departments exactly as in screenshots
        const departmentsData = [
            { name: 'Department of Management Studies', shortName: 'MBA', description: '-' },
            { name: 'School of Computer studies', shortName: 'CS', description: '-' },
            { name: 'Department of Commerce', shortName: 'BCOM', description: '-' },
            { name: 'Information Technology', shortName: 'IT', description: '-' },
            { name: 'Computer Science and Engineering', shortName: 'CSE', description: '-' }
        ];
        const departments = await Department.insertMany(departmentsData);
        console.log('Seeded Departments:', departments.length);

        const getDept = (name) => departments.find(d => d.name === name)?._id;

        // 3. Insert Programmes exactly as in screenshots
        const programmesData = [
            {
                name: 'Bachelor of Computer Applications',
                shortName: 'BCA',
                department: getDept('School of Computer studies'),
                description: '-'
            },
            {
                name: 'Master of Computer Applications',
                shortName: 'MCA',
                department: getDept('School of Computer studies'),
                description: '-'
            },
            {
                name: 'Bachelor of Science in Information Technology',
                shortName: 'B.SC IT',
                department: getDept('Information Technology'),
                description: '-'
            },
            {
                name: 'Master of Commerce',
                shortName: 'M.COM',
                department: getDept('Department of Commerce'),
                description: '-'
            },
            {
                name: 'Artificial Intelligence and Machine Learning',
                shortName: 'AI&ML',
                department: getDept('Computer Science and Engineering'),
                description: '-'
            },
            {
                name: 'Cyber Security',
                shortName: 'CS-CY',
                department: getDept('Information Technology'),
                description: '-'
            }
        ];
        const programmes = await Programme.insertMany(programmesData);
        console.log('Seeded Programmes:', programmes.length);

        const getProg = (name) => programmes.find(p => p.name === name)?._id;

        // 4. Insert Blocks exactly as in screenshots
        const blocksData = [
            {
                name: 'R Block',
                department: getDept('School of Computer studies'),
                programme: getProg('Bachelor of Computer Applications'),
                description: '-'
            },
            {
                name: 'R Block',
                department: getDept('School of Computer studies'),
                programme: getProg('Master of Computer Applications'),
                description: '-'
            },
            {
                name: 'V Block',
                department: getDept('Department of Commerce'),
                programme: getProg('Master of Commerce'),
                description: '-'
            },
            {
                name: 'S Block',
                department: getDept('Computer Science and Engineering'),
                programme: getProg('Artificial Intelligence and Machine Learning'),
                description: '-'
            },
            {
                name: 'M Block',
                department: getDept('Information Technology'),
                programme: getProg('Cyber Security'),
                description: '-'
            }
        ];
        const blocks = await Block.insertMany(blocksData);
        console.log('Seeded Blocks:', blocks.length);

        const getBlock = (name, progName) => {
            const progId = getProg(progName);
            return blocks.find(b => b.name === name && String(b.programme) === String(progId))?._id || blocks.find(b => b.name === name)?._id;
        };

        // 5. Insert Rooms exactly as in screenshots
        const roomsData = [
            {
                roomNumber: '201',
                department: getDept('Department of Commerce'),
                programme: getProg('Master of Commerce'),
                block: getBlock('V Block', 'Master of Commerce'),
                floor: '2',
                capacity: '10'
            },
            {
                roomNumber: '301',
                department: getDept('Computer Science and Engineering'),
                programme: getProg('Artificial Intelligence and Machine Learning'),
                block: getBlock('S Block', 'Artificial Intelligence and Machine Learning'),
                floor: '3',
                capacity: '-1'
            },
            {
                roomNumber: '401',
                department: getDept('Information Technology'),
                programme: getProg('Cyber Security'),
                block: getBlock('M Block', 'Cyber Security'),
                floor: '2',
                capacity: '50'
            }
        ];
        const rooms = await Room.insertMany(roomsData);
        console.log('Seeded Rooms:', rooms.length);

        // 6. Update existing users to reference valid departments/programmes if needed
        const adminUser = await User.findOne({ email: 'admin@example.com' });
        if (!adminUser) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password123', salt);
            await User.create({
                name: 'Admin',
                phone: '1234567890',
                email: 'admin@example.com',
                password: hashedPassword,
                role: superAdminRole._id,
                department: departments[0]._id
            });
            console.log('Admin user created.');
        } else {
            adminUser.department = departments[0]._id;
            await adminUser.save();
        }

        console.log('Screenshot data seeding finished successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
};

seedDB();
