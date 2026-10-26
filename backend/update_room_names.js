const mongoose = require('mongoose');
const Block = require('./models/Block');
const Room = require('./models/Room');

mongoose.connect('mongodb://127.0.0.1:27017/cms_db').then(async () => {
    console.log('Connected to DB. Updating Room names...');
    
    const rooms = await Room.find().populate('block');
    
    for (const room of rooms) {
        if (room.block) {
            // block.name is something like "B.Tech CSE - Block A"
            // We want "B.Tech CSE - Block A - 101"
            // The current roomNumber is "A-101" or similar.
            // Let's extract the number part (e.g., 101)
            const numberMatch = room.roomNumber.match(/\d+/);
            const num = numberMatch ? numberMatch[0] : Math.floor(Math.random() * 100) + 100;
            
            room.roomNumber = `${room.block.name} - Room ${num}`;
            await room.save();
        }
    }
    
    console.log('Room names successfully updated to include block names!');
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
