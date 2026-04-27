const Employee = require('../models/Employee');
const { buildEmployeeQuery } = require('../utils/searchFilter');

// @desc    Get all employees (search, filter, paginate)
// @route   GET /api/employees
// @access  Private/Manager
const getAllEmployees = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = buildEmployeeQuery(req.query);
        const sortBy = req.query.sort || '-createdAt';

        const employees = await Employee.find(query)
            .populate('department', 'name')
            .populate('position', 'name')
            .sort(sortBy)
            .skip(skip)
            .limit(limit);

        const totalEmployees = await Employee.countDocuments(query);
        const totalPages = Math.ceil(totalEmployees / limit);

        res.status(200).json({
            success: true,
            count: employees.length,
            pagination: {
                page,
                limit,
                totalPages,
                totalEmployees
            },
            employees
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private (Manager or self)
const getEmployeeById = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id)
            .populate('department', 'name')
            .populate('position', 'name');

        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        // Check authorization: managers can see anyone, employees can only see themselves
        if (req.user.role === 'employee' && employee._id.toString() !== req.user.employeeId.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to access this record' });
        }

        res.status(200).json({ success: true, employee });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private/Manager
const createEmployee = async (req, res) => {
    try {
        const { email } = req.body;
        const employeeExists = await Employee.findOne({ email });

        if (employeeExists) {
            return res.status(400).json({ success: false, message: 'Employee with this email already exists' });
        }

        const employee = await Employee.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Employee created successfully',
            employee
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private/Manager
const updateEmployee = async (req, res) => {
    try {
        let employee = await Employee.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        // If email is changing, check for duplicates
        if (req.body.email && req.body.email !== employee.email) {
            const exists = await Employee.findOne({ email: req.body.email });
            if (exists) {
                return res.status(400).json({ success: false, message: 'Email already in use' });
            }
        }

        employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            message: 'Employee updated successfully',
            employee
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Soft delete employee
// @route   DELETE /api/employees/:id
// @access  Private/Manager
const deleteEmployee = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        if (employee.status === 'inactive') {
            return res.status(400).json({ success: false, message: 'Employee is already inactive' });
        }

        employee.status = 'inactive';
        await employee.save();

        res.status(200).json({
            success: true,
            message: 'Employee deactivated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all active departments list for dropdowns
// @route   GET /api/employees/departments/list
// @access  Private/Manager
const getDepartmentsList = async (req, res) => {
    try {
        const Department = require('../models/Department');
        const departments = await Department.find({ active: true }).select('name');
        
        res.status(200).json({
            success: true,
            departments: departments.map(d => d.name)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getDepartmentsList
};
