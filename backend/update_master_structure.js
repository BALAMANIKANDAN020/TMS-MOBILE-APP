require('dotenv').config();
const mongoose = require('mongoose');
const Department = require('./models/Department');
const Programme = require('./models/Programme');
const Block = require('./models/Block');
const Room = require('./models/Room');
const Role = require('./models/Role');
const User = require('./models/User');

const updateStructure = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cms_db');
        console.log('Connected to MongoDB...');

        // 1. Ensure the 5 Departments exist with shortNames
        const deptsConfig = [
            { name: 'Department of Management Studies', shortName: 'MBA' },
            { name: 'School of Computer studies', shortName: 'CS' },
            { name: 'Department of Commerce', shortName: 'BCOM' },
            { name: 'Information Technology', shortName: 'IT' },
            { name: 'Computer Science and Engineering', shortName: 'CSE' }
        ];

        let departments = [];
        for (const cfg of deptsConfig) {
            let dept = await Department.findOne({ name: cfg.name });
            if (!dept) {
                dept = await Department.create({ name: cfg.name, shortName: cfg.shortName, description: '-' });
            } else {
                dept.shortName = cfg.shortName;
                await dept.save();
            }
            departments.push(dept);
        }

        // Clean up any old departments not in the 5
        await Department.deleteMany({ name: { $nin: deptsConfig.map(d => d.name) } });
        console.log('Departments configured (5):', departments.map(d => d.name + ' (' + d.shortName + ')'));

        const getDept = (shortName) => departments.find(d => d.shortName === shortName)?._id;

        // 2. Exactly 2 Programmes per Department (Total 10)
        await Programme.deleteMany();
        const programmesData = [
            // MBA Dept
            { name: 'Master of Business Administration', shortName: 'MBA', department: getDept('MBA') },
            { name: 'Bachelor of Business Administration', shortName: 'BBA', department: getDept('MBA') },
            // CS Dept
            { name: 'Bachelor of Computer Applications', shortName: 'BCA', department: getDept('CS') },
            { name: 'Master of Computer Applications', shortName: 'MCA', department: getDept('CS') },
            // BCOM Dept
            { name: 'Bachelor of Commerce', shortName: 'B.COM', department: getDept('BCOM') },
            { name: 'Master of Commerce', shortName: 'M.COM', department: getDept('BCOM') },
            // IT Dept
            { name: 'Bachelor of Science in Information Technology', shortName: 'B.SC IT', department: getDept('IT') },
            { name: 'Master of Science in Information Technology', shortName: 'M.SC IT', department: getDept('IT') },
            // CSE Dept
            { name: 'B.E Computer Science and Engineering', shortName: 'B.E CSE', department: getDept('CSE') },
            { name: 'M.E Computer Science and Engineering', shortName: 'M.E CSE', department: getDept('CSE') }
        ];
        const programmes = await Programme.insertMany(programmesData);
        console.log('Programmes created (10, 2 per dept):', programmes.length);

        const getProg = (shortName) => programmes.find(p => p.shortName === shortName)?._id;

        // 3. Exactly 5 Blocks - 1 for each department, named after department's shortName
        await Block.deleteMany();
        const blocksData = [
            { name: 'MBA Block', department: getDept('MBA'), programme: getProg('MBA') },
            { name: 'CS Block', department: getDept('CS'), programme: getProg('BCA') },
            { name: 'BCOM Block', department: getDept('BCOM'), programme: getProg('B.COM') },
            { name: 'IT Block', department: getDept('IT'), programme: getProg('B.SC IT') },
            { name: 'CSE Block', department: getDept('CSE'), programme: getProg('B.E CSE') }
        ];
        const blocks = await Block.insertMany(blocksData);
        console.log('Blocks created (5):', blocks.map(b => b.name));

        const getBlock = (name) => blocks.find(b => b.name === name)?._id;

        // 4. Exactly 5 Floors & 3 Rooms per Block on that Floor (Total 15 Rooms)
        await Room.deleteMany();
        const roomsData = [
            // MBA Block - Floor 1
            { roomNumber: '101', floor: '1', capacity: '50', department: getDept('MBA'), programme: getProg('MBA'), block: getBlock('MBA Block') },
            { roomNumber: '102', floor: '1', capacity: '50', department: getDept('MBA'), programme: getProg('MBA'), block: getBlock('MBA Block') },
            { roomNumber: '103', floor: '1', capacity: '50', department: getDept('MBA'), programme: getProg('BBA'), block: getBlock('MBA Block') },

            // CS Block - Floor 2
            { roomNumber: '201', floor: '2', capacity: '60', department: getDept('CS'), programme: getProg('BCA'), block: getBlock('CS Block') },
            { roomNumber: '202', floor: '2', capacity: '60', department: getDept('CS'), programme: getProg('BCA'), block: getBlock('CS Block') },
            { roomNumber: '203', floor: '2', capacity: '60', department: getDept('CS'), programme: getProg('MCA'), block: getBlock('CS Block') },

            // BCOM Block - Floor 3
            { roomNumber: '301', floor: '3', capacity: '50', department: getDept('BCOM'), programme: getProg('B.COM'), block: getBlock('BCOM Block') },
            { roomNumber: '302', floor: '3', capacity: '50', department: getDept('BCOM'), programme: getProg('B.COM'), block: getBlock('BCOM Block') },
            { roomNumber: '303', floor: '3', capacity: '50', department: getDept('BCOM'), programme: getProg('M.COM'), block: getBlock('BCOM Block') },

            // IT Block - Floor 4
            { roomNumber: '401', floor: '4', capacity: '50', department: getDept('IT'), programme: getProg('B.SC IT'), block: getBlock('IT Block') },
            { roomNumber: '402', floor: '4', capacity: '50', department: getDept('IT'), programme: getProg('B.SC IT'), block: getBlock('IT Block') },
            { roomNumber: '403', floor: '4', capacity: '50', department: getDept('IT'), programme: getProg('M.SC IT'), block: getBlock('IT Block') },

            // CSE Block - Floor 5
            { roomNumber: '501', floor: '5', capacity: '60', department: getDept('CSE'), programme: getProg('B.E CSE'), block: getBlock('CSE Block') },
            { roomNumber: '502', floor: '5', capacity: '60', department: getDept('CSE'), programme: getProg('B.E CSE'), block: getBlock('CSE Block') },
            { roomNumber: '503', floor: '5', capacity: '60', department: getDept('CSE'), programme: getProg('M.E CSE'), block: getBlock('CSE Block') }
        ];
        const rooms = await Room.insertMany(roomsData);
        console.log('Rooms created (15, 3 per block across 5 floors):', rooms.length);

        console.log('\n--- VERIFICATION ---');
        console.log('Departments:', departments.length);
        console.log('Programmes:', programmes.length);
        console.log('Blocks:', blocks.length);
        console.log('Rooms:', rooms.length);
        console.log('Floors:', [...new Set(rooms.map(r => r.floor))]);

        process.exit(0);
    } catch (err) {
        console.error('Error updating master structure:', err);
        process.exit(1);
    }
};

updateStructure();
