const mongoose = require('mongoose');
const RoomSchema = new mongoose.Schema({
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: false },
    programme: { type: mongoose.Schema.Types.ObjectId, ref: 'Programme', required: false },
    block: { type: mongoose.Schema.Types.ObjectId, ref: 'Block', required: false },
    roomNumber: { type: String, required: true },
    floor: { type: String, default: '1' },
    capacity: { type: String, default: '5' }
});
module.exports = mongoose.model('Room', RoomSchema);
