const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Complaint = require('../models/Complaint');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

// Create Complaint
router.post('/', [auth, upload.single('attachment')], async (req, res) => {
    try {
        const { block, room, type, remarks, department, programme } = req.body;
        const newComplaint = new Complaint({
            block, room, type, remarks,
            user: req.user.id,
            department: department || req.user.department,
            programme: programme,
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
        const completed = await Complaint.countDocuments({ ...query, status: 'Completed' });
        const closed = await Complaint.countDocuments({ ...query, status: 'Closed' });

        res.json({ total, pending, assigned, completed, closed });
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
// Delete Complaint
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.roleName !== 'Superadmin') {
            return res.status(403).json({ msg: 'Not authorized to delete' });
        }
        await Complaint.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Complaint deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;