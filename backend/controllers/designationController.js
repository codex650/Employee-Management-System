const Designation = require('../models/Designation');

// @desc    Get designations (filterable by department)
// @route   GET /api/designations
// @access  Private
const getDesignations = async (req, res) => {
    try {
        const query = { active: true };
        if (req.query.departmentId) {
            query.departmentId = req.query.departmentId;
        }
        
        const designations = await Designation.find(query)
            .populate('departmentId', 'name')
            .sort({ name: 1 });
            
        res.status(200).json({ success: true, count: designations.length, designations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a new designation
// @route   POST /api/designations
// @access  Private/Manager
const createDesignation = async (req, res) => {
    try {
        const { name, departmentId, description } = req.body;
        const designation = await Designation.create({ name, departmentId, description });
        res.status(201).json({ success: true, designation });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'This designation already exists in this department' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a designation
// @route   PUT /api/designations/:id
// @access  Private/Manager
const updateDesignation = async (req, res) => {
    try {
        const designation = await Designation.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!designation) {
            return res.status(404).json({ success: false, message: 'Designation not found' });
        }
        res.status(200).json({ success: true, designation });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'This designation name already exists in this department' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Soft delete a designation
// @route   DELETE /api/designations/:id
// @access  Private/Manager
const deleteDesignation = async (req, res) => {
    try {
        const designation = await Designation.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
        if (!designation) {
            return res.status(404).json({ success: false, message: 'Designation not found' });
        }
        res.status(200).json({ success: true, message: 'Designation deactivated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getDesignations,
    createDesignation,
    updateDesignation,
    deleteDesignation
};
