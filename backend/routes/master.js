const express = require('express');
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

router.use(auth);

// General CRUD for masters
const createCRUD = (Model, populateFields = '') => {
    const r = express.Router();
    // GET is allowed for all authenticated users (User, Superadmin, Staff, etc) so dropdowns work!
    r.get('/', async (req, res) => {
        try {
            let query = Model.find();
            if (populateFields) query = query.populate(populateFields);
            const data = await query.exec();
            res.json(data);
        } catch(err) {
            res.status(500).send('Server Error');
        }
    });
    // POST, PUT, DELETE only for Superadmin
    r.post('/', roleCheck(['Superadmin']), async (req, res) => {
        try {
            const newItem = new Model(req.body);
            const savedItem = await newItem.save();
            let result = savedItem;
            if (populateFields) {
                result = await Model.findById(savedItem._id).populate(populateFields);
            }
            res.json(result);
        } catch(err) {
            res.status(500).send('Server Error');
        }
    });
    r.put('/:id', roleCheck(['Superadmin']), async (req, res) => {
        try {
            let query = Model.findByIdAndUpdate(req.params.id, req.body, {new: true});
            if (populateFields) query = query.populate(populateFields);
            const updated = await query.exec();
            res.json(updated);
        } catch(err) {
            res.status(500).send('Server Error');
        }
    });
    r.delete('/:id', roleCheck(['Superadmin']), async (req, res) => {
        try {
            await Model.findByIdAndDelete(req.params.id);
            res.json({ msg: 'Deleted' });
        } catch(err) {
            res.status(500).send('Server Error');
        }
    });
    return r;
};

router.use('/departments', createCRUD(Department));
router.use('/programmes', createCRUD(Programme, 'department'));
router.use('/blocks', createCRUD(Block, 'department programme'));
router.use('/rooms', createCRUD(Room, 'department programme block'));
router.use('/roles', createCRUD(Role));

router.get('/users', roleCheck(['Superadmin']), async (req, res) => {
    try { const users = await User.find().populate('role department programme').select('-password'); res.json(users); } catch(err) { res.status(500).send('Server Error'); }
});
router.post('/users', roleCheck(['Superadmin']), async (req, res) => {
    try {
        let user = new User(req.body);
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password || 'password123', salt);
        await user.save();
        res.json(user);
    } catch(err) { res.status(500).send('Server Error'); }
});
router.put('/users/:id', roleCheck(['Superadmin']), async (req, res) => {
    try { 
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            req.body.password = await bcrypt.hash(req.body.password, salt);
        }
        const updated = await User.findByIdAndUpdate(req.params.id, req.body, {new: true}); 
        res.json(updated); 
    } catch(err) { res.status(500).send('Server Error'); }
});
router.delete('/users/:id', roleCheck(['Superadmin']), async (req, res) => {
    try { await User.findByIdAndDelete(req.params.id); res.json({ msg: 'Deleted' }); } catch(err) { res.status(500).send('Server Error'); }
});

module.exports = router;