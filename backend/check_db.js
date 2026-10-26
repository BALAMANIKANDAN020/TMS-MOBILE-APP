
const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/cms_db').then(async () => {
    const deps = await mongoose.connection.collection('departments').find().toArray();
    console.log('Departments:', deps.length);
    const progs = await mongoose.connection.collection('programmes').find().toArray();
    console.log('Programmes:', progs.length);
    const blocks = await mongoose.connection.collection('blocks').find().toArray();
    console.log('Blocks:', blocks.length);
    const rooms = await mongoose.connection.collection('rooms').find().toArray();
    console.log('Rooms:', rooms.length);
    process.exit(0);
});
