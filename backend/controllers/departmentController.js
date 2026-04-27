const Department = require('../models/Department');

// @desc    Get all active departments
// @route   GET /api/departments
// @access  Private
const getDepartments = async (req, res) => {
    try {
        const departments = await Department.find({ active: true }).sort({ name: 1 });
        res.status(200).json({ success: true, count: departments.length, departments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a new department
// @route   POST /api/departments
// @access  Private/Manager
const createDepartment = async (req, res) => {
    try {
        const { name, description } = req.body;
        const department = await Department.create({ name, description });
        res.status(201).json({ success: true, department });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Department already exists' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a department
// @route   PUT /api/departments/:id
// @access  Private/Manager
const updateDepartment = async (req, res) => {
    try {
        const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!department) {
            return res.status(404).json({ success: false, message: 'Department not found' });
        }
        res.status(200).json({ success: true, department });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Department with this name already exists' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Soft delete a department
// @route   DELETE /api/departments/:id
// @access  Private/Manager
const deleteDepartment = async (req, res) => {
    try {
        const department = await Department.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
        if (!department) {
            return res.status(404).json({ success: false, message: 'Department not found' });
        }
        res.status(200).json({ success: true, message: 'Department deactivated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment
};
