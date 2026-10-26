
const mongoose = require('mongoose');
const Department = require('./models/Department');
const Programme = require('./models/Programme');

mongoose.connect('mongodb://127.0.0.1:27017/cms_db').then(async () => {
    const deps = await Department.find();
    console.log('Departments:', deps.map(d => ({id: d._id, name: d.name})));
    const progs = await Programme.find().populate('department');
    console.log('Programmes:', progs.map(p => ({name: p.name, dep: p.department ? p.department.name : 'None'})));
    process.exit(0);
});
