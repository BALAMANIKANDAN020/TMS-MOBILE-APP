const mongoose = require('mongoose');
const DepartmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    shortName: { type: String, default: '-' },
    description: { type: String, default: '-' }
});
module.exports = mongoose.model('Department', DepartmentSchema);
