require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Department = require('./models/Department');
const Programme = require('./models/Programme');
const Block = require('./models/Block');
const Room = require('./models/Room');
const Role = require('./models/Role');
const User = require('./models/User');
const Complaint = require('./models/Complaint');

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cms_db');
        console.log('MongoDB Connected for Seeding...');

        // Clear existing master data
        await Promise.all([
            Department.deleteMany(), Programme.deleteMany(), Block.deleteMany(),
            Room.deleteMany(), Role.deleteMany(), User.deleteMany(), Complaint.deleteMany()
        ]);

        // 1. Roles
        const roleNames = ['Superadmin', 'User', 'Networking Staff', 'Plumber', 'Electrician', 'Software Developer'];
        const roles = await Role.insertMany(roleNames.map(name => ({ name })));
        console.log('Roles seeded.');

        const superAdminRole = roles.find(r => r.name === 'Superadmin');
        const userRole = roles.find(r => r.name === 'User');
        const networkingRole = roles.find(r => r.name === 'Networking Staff');
        const plumberRole = roles.find(r => r.name === 'Plumber');
        const electricianRole = roles.find(r => r.name === 'Electrician');
        const developerRole = roles.find(r => r.name === 'Software Developer');

        // 2. Departments (5)
        const departmentsData = [
            { name: 'Department of Management Studies', shortName: 'MBA' },
            { name: 'School of Computer studies', shortName: 'CS' },
            { name: 'Department of Commerce', shortName: 'BCOM' },
            { name: 'Information Technology', shortName: 'IT' },
            { name: 'Computer Science and Engineering', shortName: 'CSE' }
        ];
        const departments = await Department.insertMany(departmentsData);
        console.log('Departments seeded (5).');

        const getDept = (shortName) => departments.find(d => d.shortName === shortName)?._id;

        // 3. Programmes (2 per Department = 10)
        const programmesData = [
            { name: 'Master of Business Administration', shortName: 'MBA', department: getDept('MBA') },
            { name: 'Bachelor of Business Administration', shortName: 'BBA', department: getDept('MBA') },
            { name: 'Bachelor of Computer Applications', shortName: 'BCA', department: getDept('CS') },
            { name: 'Master of Computer Applications', shortName: 'MCA', department: getDept('CS') },
            { name: 'Bachelor of Commerce', shortName: 'B.COM', department: getDept('BCOM') },
            { name: 'Master of Commerce', shortName: 'M.COM', department: getDept('BCOM') },
            { name: 'Bachelor of Science in Information Technology', shortName: 'B.SC IT', department: getDept('IT') },
            { name: 'Master of Science in Information Technology', shortName: 'M.SC IT', department: getDept('IT') },
            { name: 'B.E Computer Science and Engineering', shortName: 'B.E CSE', department: getDept('CSE') },
            { name: 'M.E Computer Science and Engineering', shortName: 'M.E CSE', department: getDept('CSE') }
        ];
        const programmes = await Programme.insertMany(programmesData);
        console.log('Programmes seeded (10).');

        const getProg = (shortName) => programmes.find(p => p.shortName === shortName)?._id;

        // 4. Blocks (10 blocks: 2 per department for UG and PG)
        const blocksData = [
            // MBA Department
            { name: 'MBA(UG)', department: getDept('MBA'), programme: getProg('BBA') },
            { name: 'MBA(PG)', department: getDept('MBA'), programme: getProg('MBA') },

            // CS Department
            { name: 'CS(UG)', department: getDept('CS'), programme: getProg('BCA') },
            { name: 'CS(PG)', department: getDept('CS'), programme: getProg('MCA') },

            // BCOM Department
            { name: 'BCOM(UG)', department: getDept('BCOM'), programme: getProg('B.COM') },
            { name: 'BCOM(PG)', department: getDept('BCOM'), programme: getProg('M.COM') },

            // IT Department
            { name: 'IT(UG)', department: getDept('IT'), programme: getProg('B.SC IT') },
            { name: 'IT(PG)', department: getDept('IT'), programme: getProg('M.SC IT') },

            // CSE Department
            { name: 'CSE(UG)', department: getDept('CSE'), programme: getProg('B.E CSE') },
            { name: 'CSE(PG)', department: getDept('CSE'), programme: getProg('M.E CSE') }
        ];
        const blocks = await Block.insertMany(blocksData);
        console.log('Blocks seeded (10).');

        const getBlock = (name) => blocks.find(b => b.name === name)?._id;

        // 5. Rooms (3 Rooms per Block = 30 Rooms, Capacity: 5)
        const roomsData = [
            // MBA(UG) - Floor 1
            { roomNumber: '101', floor: '1', capacity: '5', department: getDept('MBA'), programme: getProg('BBA'), block: getBlock('MBA(UG)') },
            { roomNumber: '102', floor: '1', capacity: '5', department: getDept('MBA'), programme: getProg('BBA'), block: getBlock('MBA(UG)') },
            { roomNumber: '103', floor: '1', capacity: '5', department: getDept('MBA'), programme: getProg('BBA'), block: getBlock('MBA(UG)') },

            // MBA(PG) - Floor 2
            { roomNumber: '201', floor: '2', capacity: '5', department: getDept('MBA'), programme: getProg('MBA'), block: getBlock('MBA(PG)') },
            { roomNumber: '202', floor: '2', capacity: '5', department: getDept('MBA'), programme: getProg('MBA'), block: getBlock('MBA(PG)') },
            { roomNumber: '203', floor: '2', capacity: '5', department: getDept('MBA'), programme: getProg('MBA'), block: getBlock('MBA(PG)') },

            // CS(UG) - Floor 1
            { roomNumber: '101', floor: '1', capacity: '5', department: getDept('CS'), programme: getProg('BCA'), block: getBlock('CS(UG)') },
            { roomNumber: '102', floor: '1', capacity: '5', department: getDept('CS'), programme: getProg('BCA'), block: getBlock('CS(UG)') },
            { roomNumber: '103', floor: '1', capacity: '5', department: getDept('CS'), programme: getProg('BCA'), block: getBlock('CS(UG)') },

            // CS(PG) - Floor 2
            { roomNumber: '201', floor: '2', capacity: '5', department: getDept('CS'), programme: getProg('MCA'), block: getBlock('CS(PG)') },
            { roomNumber: '202', floor: '2', capacity: '5', department: getDept('CS'), programme: getProg('MCA'), block: getBlock('CS(PG)') },
            { roomNumber: '203', floor: '2', capacity: '5', department: getDept('CS'), programme: getProg('MCA'), block: getBlock('CS(PG)') },

            // BCOM(UG) - Floor 1
            { roomNumber: '101', floor: '1', capacity: '5', department: getDept('BCOM'), programme: getProg('B.COM'), block: getBlock('BCOM(UG)') },
            { roomNumber: '102', floor: '1', capacity: '5', department: getDept('BCOM'), programme: getProg('B.COM'), block: getBlock('BCOM(UG)') },
            { roomNumber: '103', floor: '1', capacity: '5', department: getDept('BCOM'), programme: getProg('B.COM'), block: getBlock('BCOM(UG)') },

            // BCOM(PG) - Floor 2
            { roomNumber: '201', floor: '2', capacity: '5', department: getDept('BCOM'), programme: getProg('M.COM'), block: getBlock('BCOM(PG)') },
            { roomNumber: '202', floor: '2', capacity: '5', department: getDept('BCOM'), programme: getProg('M.COM'), block: getBlock('BCOM(PG)') },
            { roomNumber: '203', floor: '2', capacity: '5', department: getDept('BCOM'), programme: getProg('M.COM'), block: getBlock('BCOM(PG)') },

            // IT(UG) - Floor 1
            { roomNumber: '101', floor: '1', capacity: '5', department: getDept('IT'), programme: getProg('B.SC IT'), block: getBlock('IT(UG)') },
            { roomNumber: '102', floor: '1', capacity: '5', department: getDept('IT'), programme: getProg('B.SC IT'), block: getBlock('IT(UG)') },
            { roomNumber: '103', floor: '1', capacity: '5', department: getDept('IT'), programme: getProg('B.SC IT'), block: getBlock('IT(UG)') },

            // IT(PG) - Floor 2
            { roomNumber: '201', floor: '2', capacity: '5', department: getDept('IT'), programme: getProg('M.SC IT'), block: getBlock('IT(PG)') },
            { roomNumber: '202', floor: '2', capacity: '5', department: getDept('IT'), programme: getProg('M.SC IT'), block: getBlock('IT(PG)') },
            { roomNumber: '203', floor: '2', capacity: '5', department: getDept('IT'), programme: getProg('M.SC IT'), block: getBlock('IT(PG)') },

            // CSE(UG) - Floor 1
            { roomNumber: '101', floor: '1', capacity: '5', department: getDept('CSE'), programme: getProg('B.E CSE'), block: getBlock('CSE(UG)') },
            { roomNumber: '102', floor: '1', capacity: '5', department: getDept('CSE'), programme: getProg('B.E CSE'), block: getBlock('CSE(UG)') },
            { roomNumber: '103', floor: '1', capacity: '5', department: getDept('CSE'), programme: getProg('B.E CSE'), block: getBlock('CSE(UG)') },

            // CSE(PG) - Floor 2
            { roomNumber: '201', floor: '2', capacity: '5', department: getDept('CSE'), programme: getProg('M.E CSE'), block: getBlock('CSE(PG)') },
            { roomNumber: '202', floor: '2', capacity: '5', department: getDept('CSE'), programme: getProg('M.E CSE'), block: getBlock('CSE(PG)') },
            { roomNumber: '203', floor: '2', capacity: '5', department: getDept('CSE'), programme: getProg('M.E CSE'), block: getBlock('CSE(PG)') }
        ];
        const rooms = await Room.insertMany(roomsData);
        console.log('Rooms seeded (30).');

        // 6. Users
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        const usersData = [
            // 1. Superadmin (KRIXXEEY)
            { 
                name: 'KRIXXEEY', 
                phone: '9876543210', 
                email: 'krixxeey@example.com', 
                password: hashedPassword, 
                role: superAdminRole._id, 
                department: departments[0]._id 
            },

            // 2. User (JEEVIKA)
            { 
                name: 'JEEVIKA', 
                phone: '9876543211', 
                email: 'jeevika@example.com', 
                password: hashedPassword, 
                role: userRole._id, 
                department: departments[1]._id, 
                programme: programmes[2]._id 
            },

            // 3. Staff 1 (Networking Staff)
            { 
                name: 'Networking Staff', 
                phone: '0987654321', 
                email: 'tech@example.com', 
                password: hashedPassword, 
                role: networkingRole._id, 
                department: departments[3]._id 
            },

            // 4. Staff 2 (Plumber Staff)
            { 
                name: 'Plumber Staff', 
                phone: '9876543212', 
                email: 'plumber@example.com', 
                password: hashedPassword, 
                role: plumberRole._id, 
                department: departments[0]._id 
            },

            // 5. Staff 3 (Electrician Staff)
            { 
                name: 'Electrician Staff', 
                phone: '9876543213', 
                email: 'electrician@example.com', 
                password: hashedPassword, 
                role: electricianRole._id, 
                department: departments[4]._id 
            },

            // 6. Staff 4 (Software Developer Staff)
            { 
                name: 'Software Developer Staff', 
                phone: '9876543214', 
                email: 'developer@example.com', 
                password: hashedPassword, 
                role: developerRole._id, 
                department: departments[1]._id 
            }
        ];
        const insertedUsers = await User.insertMany(usersData);
        console.log('Users seeded (Exactly 6 users: KRIXXEEY, JEEVIKA, and 4 Staff).');

        // 7. Complaints (3 sample complaints matching screenshot: 1 Assigned, 1 Completed, 1 Closed)
        const techUser = insertedUsers.find(u => u.email === 'tech@example.com');
        const jeevikaUser = insertedUsers.find(u => u.name === 'JEEVIKA');

        const complaintsData = [
            {
                department: getDept('CS'),
                programme: getProg('BCA'),
                block: getBlock('CS(UG)'),
                room: rooms.find(r => r.block.equals(getBlock('CS(UG)')) && r.roomNumber === '101')?._id,
                type: 'PC Hardware',
                remarks: 'Monitor display flickering in BCA Lab 1',
                status: 'Assigned',
                user: jeevikaUser._id,
                assignedTo: techUser._id
            },
            {
                department: getDept('CS'),
                programme: getProg('BCA'),
                block: getBlock('CS(UG)'),
                room: rooms.find(r => r.block.equals(getBlock('CS(UG)')) && r.roomNumber === '102')?._id,
                type: 'Networking',
                remarks: 'Ethernet switch port speed issue resolved',
                status: 'Completed',
                user: jeevikaUser._id,
                assignedTo: techUser._id
            },
            {
                department: getDept('BCOM'),
                programme: getProg('B.COM'),
                block: getBlock('BCOM(UG)'),
                room: rooms.find(r => r.block.equals(getBlock('BCOM(UG)')) && r.roomNumber === '101')?._id,
                type: 'Electrical',
                remarks: 'Smartboard electrical outlet replaced and tested',
                status: 'Closed',
                user: jeevikaUser._id,
                assignedTo: techUser._id
            }
        ];
        await Complaint.insertMany(complaintsData);
        console.log('Sample complaints seeded (3).');

        console.log('Database Seeding Complete!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedDB();
