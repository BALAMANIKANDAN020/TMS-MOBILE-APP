const mongoose = require('mongoose');
const ComplaintSchema = new mongoose.Schema({
    block: { type: mongoose.Schema.Types.ObjectId, ref: 'Block', required: false },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: false },
    type: { type: String, required: false },
    remarks: { type: String, required: false },
    attachment: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    status: { type: String, enum: ['Pending', 'Assigned', 'In-Progress', 'On-Hold', 'Completed', 'Closed'], default: 'Pending' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    programme: { type: mongoose.Schema.Types.ObjectId, ref: 'Programme' },
    createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Complaint', ComplaintSchema);
