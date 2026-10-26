const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    name: { type: String, required: false },
    phone: { type: String, required: false },
    email: { type: String, required: false, unique: true },
    password: { type: String, required: false },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: false },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    programme: { type: mongoose.Schema.Types.ObjectId, ref: 'Programme' }
});
module.exports = mongoose.model('User', UserSchema);
