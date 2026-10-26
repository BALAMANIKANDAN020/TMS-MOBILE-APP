const mongoose = require('mongoose');
const ProgrammeSchema = new mongoose.Schema({
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: false },
    name: { type: String, required: true },
    shortName: { type: String, default: '-' },
    description: { type: String, default: '-' }
});
module.exports = mongoose.model('Programme', ProgrammeSchema);
