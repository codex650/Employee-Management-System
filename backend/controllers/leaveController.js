const Leave = require('../models/Leave');
const LeaveBalance = require('../models/LeaveBalance');
const Employee = require('../models/Employee');
const { calculateDays, isOverlap } = require('../utils/leaveUtils');
const NotificationService = require('../services/notificationService');

// Helper to get or create balance
const getOrCreateBalance = async (employeeId) => {
    const year = new Date().getFullYear();
    let balance = await LeaveBalance.findOne({ employeeId, year });
    if (!balance) {
        balance = await LeaveBalance.create({ employeeId, year });
    }
    return balance;
};

// @desc    Request leave
// @route   POST /api/leaves/request
// @access  Private
const requestLeave = async (req, res) => {
    try {
        const { leaveType, startDate, endDate, reason, halfDay, halfDaySession } = req.body;
        const employeeId = req.user.employeeId;

        if (!employeeId) {
            return res.status(400).json({ success: false, message: 'User not linked to an employee record' });
        }

        const daysRequested = calculateDays(startDate, endDate, halfDay);
        if (daysRequested === 0) {
            return res.status(400).json({ success: false, message: 'No working days in request period' });
        }

        // Check balance
        const balance = await getOrCreateBalance(employeeId);
        const leavePool = balance.balances[leaveType];
        
        if (leavePool.total !== null) {
            const available = leavePool.total - leavePool.used - leavePool.pending;
            if (daysRequested > available) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Insufficient ${leaveType} balance. Requested: ${daysRequested}, Available: ${available}` 
                });
            }
        }

        // Check for overlaps (only against non-rejected/non-cancelled leaves)
        const existingLeaves = await Leave.find({ 
            employeeId, 
            status: { $in: ['pending', 'approved'] } 
        });

        if (isOverlap(existingLeaves, startDate, endDate)) {
            return res.status(400).json({ success: false, message: 'Leave request overlaps with an existing request' });
        }

        const leave = await Leave.create({
            employeeId,
            leaveType,
            startDate,
            endDate,
            daysRequested,
            halfDay: !!halfDay,
            halfDaySession: halfDay ? halfDaySession : null,
            reason,
            status: 'pending'
        });

        // Update pending balance
        balance.balances[leaveType].pending += daysRequested;
        await balance.save();

        res.status(201).json({
            success: true,
            message: 'Leave request submitted successfully',
            leave,
            remainingBalance: leavePool.total - leavePool.used - leavePool.pending
        });

        // Notify Managers
        const employee = await Employee.findById(employeeId);
        if (employee) {
            await NotificationService.notifyManagers({
                type: 'leave',
                title: 'New Leave Request',
                message: `${employee.firstName} ${employee.lastName} requested ${daysRequested} days of ${leaveType}`,
                priority: 'medium',
                emailTrigger: 'leaveRequest',
                emailData: {
                    employeeName: `${employee.firstName} ${employee.lastName}`,
                    leaveType,
                    status: 'Pending',
                    startDate: new Date(startDate).toLocaleDateString(),
                    endDate: new Date(endDate).toLocaleDateString(),
                    days: daysRequested
                },
                metadata: { leaveId: leave._id, employeeId }
            });
        }

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get my leave requests
// @route   GET /api/leaves/my-requests
// @access  Private
const getMyRequests = async (req, res) => {
    try {
        const employeeId = req.user.employeeId;
        const leaves = await Leave.find({ employeeId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: leaves.length, leaves });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get my leave balance
// @route   GET /api/leaves/balance
// @access  Private
const getMyBalance = async (req, res) => {
    try {
        const balance = await getOrCreateBalance(req.user.employeeId);
        res.status(200).json({ success: true, balance: balance.balances, year: balance.year });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all pending requests (Manager)
// @route   GET /api/leaves/pending
// @access  Private/Manager
const getPendingRequests = async (req, res) => {
    try {
        const leaves = await Leave.find({ status: 'pending' })
            .populate({
                path: 'employeeId',
                select: 'firstName lastName department',
                populate: { path: 'department', select: 'name' }
            })
            .sort({ createdAt: 1 });
        res.status(200).json({ success: true, count: leaves.length, leaves });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Approve leave (Manager)
// @route   PUT /api/leaves/:id/approve
// @access  Private/Manager
const approveLeave = async (req, res) => {
    try {
        const { notes } = req.body;
        const leave = await Leave.findById(req.params.id);

        if (!leave || leave.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Invalid or already processed leave request' });
        }

        const balance = await getOrCreateBalance(leave.employeeId);
        
        leave.status = 'approved';
        leave.approvedBy = req.user._id;
        leave.approvedAt = Date.now();
        if (notes) leave.notes = notes;

        // Shift from pending to used
        balance.balances[leave.leaveType].pending -= leave.daysRequested;
        balance.balances[leave.leaveType].used += leave.daysRequested;

        await leave.save();
        await balance.save();

        res.status(200).json({ success: true, message: 'Leave approved successfully', leave });

        // Notify Employee
        const fullLeave = await Leave.findById(leave._id).populate('employeeId');
        if (fullLeave && fullLeave.employeeId) {
            const employeeUser = await require('../models/User').findOne({ employeeId: fullLeave.employeeId._id });
            if (employeeUser) {
                await NotificationService.notify(employeeUser._id, {
                    type: 'leave',
                    title: 'Leave Approved ✅',
                    message: `Your ${leave.leaveType} leave request for ${leave.daysRequested} days has been approved`,
                    priority: 'high',
                    emailTrigger: 'leaveStatusChange',
                    emailData: {
                        employeeName: `${fullLeave.employeeId.firstName} ${fullLeave.employeeId.lastName}`,
                        leaveType: leave.leaveType,
                        status: 'Approved',
                        startDate: new Date(leave.startDate).toLocaleDateString(),
                        endDate: new Date(leave.endDate).toLocaleDateString(),
                        days: leave.daysRequested
                    },
                    metadata: { leaveId: leave._id }
                });
            }
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Reject leave (Manager)
// @route   PUT /api/leaves/:id/reject
// @access  Private/Manager
const rejectLeave = async (req, res) => {
    try {
        const { reason } = req.body;
        const leave = await Leave.findById(req.params.id);

        if (!leave || leave.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Invalid or already processed leave request' });
        }

        const balance = await getOrCreateBalance(leave.employeeId);
        
        leave.status = 'rejected';
        leave.approvedBy = req.user._id;
        leave.approvedAt = Date.now();
        leave.rejectionReason = reason;

        // Remove from pending
        balance.balances[leave.leaveType].pending -= leave.daysRequested;

        await leave.save();
        await balance.save();

        res.status(200).json({ success: true, message: 'Leave rejected successfully', leave });

        // Notify Employee
        const fullLeave = await Leave.findById(leave._id).populate('employeeId');
        if (fullLeave && fullLeave.employeeId) {
            const employeeUser = await require('../models/User').findOne({ employeeId: fullLeave.employeeId._id });
            if (employeeUser) {
                await NotificationService.notify(employeeUser._id, {
                    type: 'leave',
                    title: 'Leave Rejected ❌',
                    message: `Your ${leave.leaveType} leave request for ${leave.daysRequested} days has been rejected`,
                    priority: 'medium',
                    emailTrigger: 'leaveStatusChange',
                    emailData: {
                        employeeName: `${fullLeave.employeeId.firstName} ${fullLeave.employeeId.lastName}`,
                        leaveType: leave.leaveType,
                        status: 'Rejected',
                        startDate: new Date(leave.startDate).toLocaleDateString(),
                        endDate: new Date(leave.endDate).toLocaleDateString(),
                        days: leave.daysRequested
                    },
                    metadata: { leaveId: leave._id, reason }
                });
            }
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Cancel leave (Employee)
// @route   PUT /api/leaves/:id/cancel
// @access  Private
const cancelLeave = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);

        if (!leave || leave.employeeId.toString() !== req.user.employeeId.toString()) {
            return res.status(404).json({ success: false, message: 'Leave request not found' });
        }

        if (leave.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Only pending requests can be cancelled' });
        }

        const balance = await getOrCreateBalance(leave.employeeId);
        
        leave.status = 'cancelled';
        balance.balances[leave.leaveType].pending -= leave.daysRequested;

        await leave.save();
        await balance.save();

        res.status(200).json({ success: true, message: 'Leave request cancelled', leave });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    requestLeave,
    getMyRequests,
    getMyBalance,
    getPendingRequests,
    approveLeave,
    rejectLeave,
    cancelLeave
};
