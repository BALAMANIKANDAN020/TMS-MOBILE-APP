const mongoose = require('mongoose');
const BlockSchema = new mongoose.Schema({
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: false },
    programme: { type: mongoose.Schema.Types.ObjectId, ref: 'Programme', required: false },
    name: { type: String, required: true },
    description: { type: String, default: '-' }
});
module.exports = mongoose.model('Block', BlockSchema);
