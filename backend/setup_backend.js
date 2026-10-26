const fs = require('fs');
const path = require('path');

const dirs = ['models', 'controllers', 'routes', 'middleware', 'config'];
dirs.forEach(dir => fs.mkdirSync(path.join(__dirname, dir), { recursive: true }));

const files = {
    'config/db.js': `const mongoose = require('mongoose');
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};
module.exports = connectDB;`,

    'models/Role.js': `const mongoose = require('mongoose');
const RoleSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }
});
module.exports = mongoose.model('Role', RoleSchema);`,

    'models/Department.js': `const mongoose = require('mongoose');
const DepartmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    shortName: { type: String, required: true }
});
module.exports = mongoose.model('Department', DepartmentSchema);`,

    'models/Programme.js': `const mongoose = require('mongoose');
const ProgrammeSchema = new mongoose.Schema({
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    name: { type: String, required: true },
    shortName: { type: String, required: true }
});
module.exports = mongoose.model('Programme', ProgrammeSchema);`,

    'models/Block.js': `const mongoose = require('mongoose');
const BlockSchema = new mongoose.Schema({
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    programme: { type: mongoose.Schema.Types.ObjectId, ref: 'Programme', required: true },
    name: { type: String, required: true }
});
module.exports = mongoose.model('Block', BlockSchema);`,

    'models/Room.js': `const mongoose = require('mongoose');
const RoomSchema = new mongoose.Schema({
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    programme: { type: mongoose.Schema.Types.ObjectId, ref: 'Programme', required: true },
    block: { type: mongoose.Schema.Types.ObjectId, ref: 'Block', required: true },
    roomNumber: { type: String, required: true }
});
module.exports = mongoose.model('Room', RoomSchema);`,

    'models/User.js': `const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    programme: { type: mongoose.Schema.Types.ObjectId, ref: 'Programme' }
});
module.exports = mongoose.model('User', UserSchema);`,

    'models/Complaint.js': `const mongoose = require('mongoose');
const ComplaintSchema = new mongoose.Schema({
    block: { type: mongoose.Schema.Types.ObjectId, ref: 'Block', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    type: { type: String, required: true },
    remarks: { type: String, required: true },
    attachment: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['Pending', 'Assigned', 'In-Progress', 'On-Hold', 'Completed', 'Closed'], default: 'Pending' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Complaint', ComplaintSchema);`,

    'middleware/auth.js': `const jwt = require('jsonwebtoken');
module.exports = function(req, res, next) {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token.split(' ')[1] || token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};`,

    'middleware/role.js': `module.exports = function(roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.roleName)) {
            return res.status(403).json({ msg: 'Access denied' });
        }
        next();
    }
};`,

    '.env': `PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/cms_db
JWT_SECRET=supersecret123`,

    'server.js': `require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
connectDB();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/master', require('./routes/master'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/reports', require('./routes/reports'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(\`Server started on port \${PORT}\`));`
};

for (const [filename, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(__dirname, filename), content);
}
console.log('Backend files created successfully.');
