const mongoose = require('mongoose');
const RoleSchema = new mongoose.Schema({
    name: { type: String, required: false, unique: true }
});
module.exports = mongoose.model('Role', RoleSchema);
