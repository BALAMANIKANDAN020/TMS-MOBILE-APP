const mongoose = require('mongoose');
const Department = require('./models/Department');
const Programme = require('./models/Programme');
const Block = require('./models/Block');
const Room = require('./models/Room');

mongoose.connect('mongodb://127.0.0.1:27017/cms_db').then(async () => {
    console.log('Connected to DB. Clearing old Blocks and Rooms...');
    
    // 1. Delete all old blocks and rooms
    await Block.deleteMany({});
    await Room.deleteMany({});
    
    // 2. Fetch all departments and programmes
    const programmes = await Programme.find().populate('department');

    // 3. For each programme, create 3 Blocks
    const blockNames = ['Block A', 'Block B', 'Block C'];
    
    for (const prog of programmes) {
        if (!prog.department) continue;
        
        for (const bName of blockNames) {
            const block = new Block({
                department: prog.department._id,
                programme: prog._id,
                name: `${prog.shortName || prog.name} - ${bName}`
            });
            await block.save();
            
            // 4. For each block, create 3 Rooms
            for (let i = 1; i <= 3; i++) {
                const room = new Room({
                    department: prog.department._id,
                    programme: prog._id,
                    block: block._id,
                    roomNumber: `${bName.split(' ')[1]}-${100 + i}`
                });
                await room.save();
            }
        }
    }
    
    console.log('Blocks and Rooms successfully updated for Programme-dependency!');
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
