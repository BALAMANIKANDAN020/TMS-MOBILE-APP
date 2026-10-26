const mongoose = require('mongoose');
const Department = require('./models/Department');
const Programme = require('./models/Programme');
const Block = require('./models/Block');
const Room = require('./models/Room');

const getPrefix = (deptName) => {
    if (deptName === 'Computer Science') return 'CS';
    if (deptName === 'Information Technology') return 'IT';
    if (deptName === 'Electronics') return 'ECE';
    if (deptName === 'Mechanical') return 'MECH';
    if (deptName === 'Civil') return 'CIVIL';
    return 'GEN';
};

mongoose.connect('mongodb://127.0.0.1:27017/cms_db').then(async () => {
    console.log('Connected to DB. Clearing old Blocks and Rooms...');
    
    // 1. Delete all old blocks and rooms
    await Block.deleteMany({});
    await Room.deleteMany({});
    
    // 2. Fetch all departments and programmes
    const departments = await Department.find();
    const programmes = await Programme.find();

    // 3. Create new Blocks based on Departments
    for (const dept of departments) {
        const prefix = getPrefix(dept.name);
        
        // Create 2 blocks per department
        const block1 = new Block({
            department: dept._id,
            name: `${prefix} Main Block`
        });
        await block1.save();
        
        const block2 = new Block({
            department: dept._id,
            name: `${prefix} Annex Block`
        });
        await block2.save();

        // 4. Create Rooms for the blocks based on programmes
        const deptProgs = programmes.filter(p => p.department && p.department.toString() === dept._id.toString());
        
        let roomCounter = 101;
        for (const prog of deptProgs) {
            // Add 2 rooms for block 1 for this programme
            await new Room({
                department: dept._id,
                programme: prog._id,
                block: block1._id,
                roomNumber: `${prefix}-${roomCounter}`
            }).save();
            roomCounter++;
            
            await new Room({
                department: dept._id,
                programme: prog._id,
                block: block1._id,
                roomNumber: `${prefix}-${roomCounter}`
            }).save();
            roomCounter++;

            // Add 1 room for block 2 for this programme
            await new Room({
                department: dept._id,
                programme: prog._id,
                block: block2._id,
                roomNumber: `${prefix}-Annex-${roomCounter}`
            }).save();
            roomCounter++;
        }
    }
    
    console.log('Blocks and Rooms successfully updated!');
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
