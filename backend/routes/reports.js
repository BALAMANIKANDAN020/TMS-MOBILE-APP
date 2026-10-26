const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/role');
const Complaint = require('../models/Complaint');

router.get('/', auth, async (req, res) => {
    try {
        const { department, programme, type, status, assignee } = req.query;
        let query = {};
        if (department) query.department = department;
        if (programme) query.programme = programme;
        if (type) query.type = type;
        if (status) query.status = status;
        if (assignee) query.assignedTo = assignee;

        const complaints = await Complaint.find(query)
            .populate('user', 'name email phone')
            .populate('assignedTo', 'name email phone')
            .populate('block', 'name')
            .populate('room', 'roomNumber floor capacity')
            .populate('department', 'name shortName')
            .populate('programme', 'name shortName')
            .sort({ createdAt: -1 });

        res.json(complaints);
    } catch (err) { 
        console.error('Error fetching reports:', err);
        res.status(500).send('Server Error'); 
    }
});

module.exports = router;
