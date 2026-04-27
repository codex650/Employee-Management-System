const Salary = require('../models/Salary');
const SalaryHistory = require('../models/SalaryHistory');
const Payroll = require('../models/Payroll');
const Bonus = require('../models/Bonus');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const { calculateNetSalary, getDailyRate, calculateLateFine } = require('../utils/salaryUtils');

// @desc    Update employee salary
// @route   PUT /api/salary/employees/:employeeId
// @access  Private/Manager
const updateEmployeeSalary = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { basic, allowances, reason } = req.body;

        let salary = await Salary.findOne({ employeeId });

        // Save to history if exists
        if (salary) {
            await SalaryHistory.create({
                employeeId: salary.employeeId,
                basic: salary.basic,
                allowances: salary.allowances,
                total: salary.total,
                reason: salary.reason,
                changedBy: req.user._id
            });
            
            salary.basic = basic || salary.basic;
            salary.allowances = allowances || salary.allowances;
            salary.reason = reason;
            salary.updatedBy = req.user._id;
            await salary.save();
        } else {
            salary = await Salary.create({
                employeeId,
                basic,
                allowances,
                reason,
                updatedBy: req.user._id
            });
        }

        res.status(200).json({ success: true, message: 'Salary updated successfully', salary });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Generate monthly payroll
// @route   POST /api/salary/payroll/generate
// @access  Private/Manager
const generatePayroll = async (req, res) => {
    try {
        const { month, year } = req.body;

        // Check if payroll already exists
        const existing = await Payroll.findOne({ 'period.month': month, 'period.year': year });
        if (existing) return res.status(400).json({ success: false, message: 'Payroll already generated for this period' });

        const employees = await Employee.find({ status: 'active' });
        const payrollItems = [];
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        for (const emp of employees) {
            const salary = await Salary.findOne({ employeeId: emp._id });
            if (!salary) continue; // Skip employees with no salary config

            // Calculate Deductions from Attendance (Lates)
            const attendance = await Attendance.find({
                employeeId: emp._id,
                date: { $gte: startDate, $lte: endDate }
            });
            const lateFines = attendance.reduce((acc, curr) => acc + calculateLateFine(curr.lateMinutes || 0), 0);

            // Calculate Deductions from Leaves (Unpaid)
            const leaves = await Leave.find({
                employeeId: emp._id,
                startDate: { $gte: startDate, $lte: endDate },
                status: 'approved',
                leaveType: 'unpaid'
            });
            const unpaidDays = leaves.reduce((acc, curr) => acc + (curr.daysRequested || 0), 0);
            const unpaidDeduction = unpaidDays * getDailyRate(salary.basic);

            // Fetch approved bonuses for this period
            const bonuses = await Bonus.find({
                employeeId: emp._id,
                payrollMonth: month,
                payrollYear: year,
                status: 'pending'
            });
            const totalBonus = bonuses.reduce((acc, curr) => acc + curr.amount, 0);

            const totalDeductions = lateFines + unpaidDeduction;
            const netSalary = calculateNetSalary(salary.basic, salary.total - salary.basic, totalDeductions, totalBonus);

            payrollItems.push({
                employeeId: emp._id,
                basic: salary.basic,
                allowances: salary.total - salary.basic,
                deductions: {
                    unpaidLeave: unpaidDeduction,
                    lateFines,
                    total: totalDeductions
                },
                bonus: totalBonus,
                netSalary
            });

            // Mark bonuses as paid
            if (bonuses.length > 0) {
                await Bonus.updateMany({ _id: { $in: bonuses.map(b => b._id) } }, { status: 'paid' });
            }
        }

        const summary = {
            totalEmployees: payrollItems.length,
            totalNetSalary: payrollItems.reduce((acc, curr) => acc + curr.netSalary, 0)
        };

        const payroll = await Payroll.create({
            period: { month, year, startDate, endDate },
            items: payrollItems,
            summary,
            generatedBy: req.user._id
        });

        res.status(201).json({ success: true, message: `Payroll generated for ${month}/${year}`, payroll });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get salary history
// @route   GET /api/salary/employees/:employeeId/history
// @access  Private/Manager
const getSalaryHistory = async (req, res) => {
    try {
        const history = await SalaryHistory.find({ employeeId: req.params.employeeId }).sort({ changedAt: -1 });
        res.status(200).json({ success: true, history });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Add bonus to employee
// @route   POST /api/salary/employees/:employeeId/bonus
// @access  Private/Manager
const addBonus = async (req, res) => {
    try {
        const { amount, type, reason, payrollMonth, payrollYear } = req.body;
        const bonus = await Bonus.create({
            employeeId: req.params.employeeId,
            amount,
            type,
            reason,
            payrollMonth,
            payrollYear,
            approvedBy: req.user._id
        });
        res.status(201).json({ success: true, bonus });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    updateEmployeeSalary,
    generatePayroll,
    getSalaryHistory,
    addBonus
};
