const fs = require('fs');
const path = require('path');

const files = {
    'routes/auth.js': `const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).populate('role');
        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

        const payload = { user: { id: user.id, roleId: user.role._id, roleName: user.role.name, department: user.department, programme: user.programme } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.json({ token, role: user.role.name, user: { name: user.name, email: user.email, id: user.id } });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});
module.exports = router;`,

    'routes/master.js': `const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/role');
const Department = require('../models/Department');
const Programme = require('../models/Programme');
const Block = require('../models/Block');
const Room = require('../models/Room');
const Role = require('../models/Role');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

router.use(auth, roleCheck(['Superadmin']));

// General CRUD for masters
const createCRUD = (Model) => {
    const r = express.Router();
    r.get('/', async (req, res) => {
        try { const data = await Model.find(); res.json(data); } catch(err) { res.status(500).send('Server Error'); }
    });
    r.post('/', async (req, res) => {
        try { const newItem = new Model(req.body); const savedItem = await newItem.save(); res.json(savedItem); } catch(err) { res.status(500).send('Server Error'); }
    });
    return r;
};

router.use('/departments', createCRUD(Department));
router.use('/programmes', createCRUD(Programme));
router.use('/blocks', createCRUD(Block));
router.use('/rooms', createCRUD(Room));
router.use('/roles', createCRUD(Role));

router.get('/users', async (req, res) => {
    try { const users = await User.find().populate('role department programme').select('-password'); res.json(users); } catch(err) { res.status(500).send('Server Error'); }
});
router.post('/users', async (req, res) => {
    try {
        let user = new User(req.body);
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
        await user.save();
        res.json(user);
    } catch(err) { res.status(500).send('Server Error'); }
});

module.exports = router;`,

    'routes/complaints.js': `const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Complaint = require('../models/Complaint');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

// Create Complaint
router.post('/', [auth, upload.single('attachment')], async (req, res) => {
    try {
        const { block, room, type, remarks } = req.body;
        const newComplaint = new Complaint({
            block, room, type, remarks,
            user: req.user.id,
            department: req.user.department,
            attachment: req.file ? req.file.path : null
        });
        const saved = await newComplaint.save();
        res.json(saved);
    } catch (err) { res.status(500).send('Server Error'); }
});

// Get Dashboard Stats
router.get('/dashboard', auth, async (req, res) => {
    try {
        let query = {};
        if (req.user.roleName !== 'Superadmin' && !['Networking Staff', 'Plumber', 'Electrician', 'Software Developer'].includes(req.user.roleName)) {
            query.user = req.user.id;
        } else if (req.user.roleName !== 'Superadmin') {
            query.assignedTo = req.user.id;
        }
        
        const total = await Complaint.countDocuments(query);
        const pending = await Complaint.countDocuments({ ...query, status: 'Pending' });
        const assigned = await Complaint.countDocuments({ ...query, status: 'Assigned' });
        const closed = await Complaint.countDocuments({ ...query, status: 'Completed' }); // Or Closed

        res.json({ total, pending, assigned, closed });
    } catch (err) { res.status(500).send('Server Error'); }
});

// Get Complaints List
router.get('/', auth, async (req, res) => {
    try {
        let query = {};
        if (req.user.roleName === 'Superadmin') {
            // Can view all based on department if needed, but requirements say superadmin views all
        } else if (['Networking Staff', 'Plumber', 'Electrician', 'Software Developer'].includes(req.user.roleName)) {
            query.assignedTo = req.user.id;
        } else {
            query.user = req.user.id;
        }
        const complaints = await Complaint.find(query).populate('user assignedTo block room department');
        res.json(complaints);
    } catch (err) { res.status(500).send('Server Error'); }
});

// Update Complaint Status / Assign
router.put('/:id', auth, async (req, res) => {
    try {
        const { status, assignedTo } = req.body;
        let updateData = {};
        if (req.user.roleName === 'Superadmin') {
            if (assignedTo) { updateData.assignedTo = assignedTo; updateData.status = 'Assigned'; }
            if (status) updateData.status = status;
        } else if (['Networking Staff', 'Plumber', 'Electrician', 'Software Developer'].includes(req.user.roleName)) {
            if (status) updateData.status = status;
        } else {
            return res.status(403).json({ msg: 'Not authorized to update status' });
        }
        
        const complaint = await Complaint.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
        res.json(complaint);
    } catch (err) { res.status(500).send('Server Error'); }
});

module.exports = router;`,

    'routes/reports.js': `const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/role');
const Complaint = require('../models/Complaint');

router.get('/', [auth, roleCheck(['Superadmin'])], async (req, res) => {
    try {
        const { department, programme, type, status, assignee } = req.query;
        let query = {};
        if (department) query.department = department;
        if (type) query.type = type;
        if (status) query.status = status;
        if (assignee) query.assignedTo = assignee;
        
        // Handling programme requires joining with Room/Block if complaint doesn't store programme directly
        // For simplicity, returning based on available fields.

        const complaints = await Complaint.find(query).populate('user assignedTo block room department');
        res.json(complaints);
    } catch (err) { res.status(500).send('Server Error'); }
});

module.exports = router;`
};

for (const [filename, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(__dirname, filename), content);
}
console.log('Routes generated.');
