const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const { 
  calculateHours, 
  calculateLateMinutes, 
  calculateEarlyMinutes, 
  calculateOvertime, 
  determineStatus, 
  isHoliday 
} = require('../utils/attendanceUtils');
const NotificationService = require('../services/notificationService');
const jwt = require('jsonwebtoken');
const config = require('../config/attendanceConfig');

// @desc    Clock in for today
// @route   POST /api/attendance/clock-in
// @access  Private
const clockIn = async (req, res) => {
    try {
        const { notes, qrToken } = req.body;
        const employeeId = req.user.employeeId;

        // Verify QR Token
        if (!qrToken) {
            return res.status(400).json({ success: false, message: 'QR Code scan is required for clock-in' });
        }

        try {
            const decoded = jwt.verify(qrToken, process.env.QR_SECRET);
            if (decoded.type !== 'attendance_qr') {
                throw new Error('Invalid QR type');
            }
        } catch (err) {
            return res.status(401).json({ success: false, message: 'Invalid or expired QR code. Please scan a fresh code.' });
        }

        if (!employeeId) {
            return res.status(400).json({ success: false, message: 'User is not linked to an employee record' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if holiday
        if (isHoliday(today)) {
            return res.status(400).json({ success: false, message: 'Cannot clock in on a public holiday' });
        }

        // Check if already clocked in today
        const existingAttendance = await Attendance.findOne({ employeeId, date: today });
        if (existingAttendance) {
            return res.status(400).json({ success: false, message: 'You have already clocked in for today' });
        }

        const now = new Date();
        const lateMinutes = calculateLateMinutes(now);
        const status = determineStatus(lateMinutes);

        const attendance = await Attendance.create({
            employeeId,
            date: today,
            clockIn: now,
            status,
            lateMinutes,
            notes
        });

        // Trigger Notification to Managers
        const employee = await Employee.findById(employeeId).populate('department');
        if (employee) {
            await NotificationService.notifyManagers({
                type: 'attendance',
                title: lateMinutes > 0 ? '⚠️ Late Arrival' : 'New Clock-In',
                message: `${employee.firstName} ${employee.lastName} clocked in at ${now.toLocaleTimeString()}` + (lateMinutes > 0 ? ` (${lateMinutes} mins late)` : ''),
                priority: lateMinutes > 15 ? 'high' : 'medium',
                emailTrigger: lateMinutes > 0 ? 'lateArrival' : 'clockIn',
                emailData: {
                    employeeName: `${employee.firstName} ${employee.lastName}`,
                    department: employee.department?.name || 'N/A',
                    time: now.toLocaleTimeString(),
                    isLate: lateMinutes > 0,
                    lateMinutes
                },
                metadata: { attendanceId: attendance._id, employeeId }
            });
        }

        res.status(201).json({
            success: true,
            message: `Clocked in successfully at ${now.toLocaleTimeString()}`,
            attendance
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Clock out for today
// @route   POST /api/attendance/clock-out
// @access  Private
const clockOut = async (req, res) => {
    try {
        const { notes, qrToken } = req.body;

        // Verify QR Token
        if (!qrToken) {
            return res.status(400).json({ success: false, message: 'QR Code scan is required for clock-out' });
        }

        try {
            const decoded = jwt.verify(qrToken, process.env.QR_SECRET);
            if (decoded.type !== 'attendance_qr') {
                throw new Error('Invalid QR type');
            }
        } catch (err) {
            return res.status(401).json({ success: false, message: 'Invalid or expired QR code. Please scan a fresh code.' });
        }

        const employeeId = req.user.employeeId;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await Attendance.findOne({ employeeId, date: today });

        if (!attendance) {
            return res.status(400).json({ success: false, message: 'No clock-in record found for today' });
        }

        if (attendance.clockOut) {
            return res.status(400).json({ success: false, message: 'You have already clocked out for today' });
        }

        const now = new Date();
        const totalHours = calculateHours(attendance.clockIn, now);
        const earlyMinutes = calculateEarlyMinutes(now);
        const overtimeMinutes = calculateOvertime(totalHours);

        attendance.clockOut = now;
        attendance.totalHours = totalHours;
        attendance.earlyMinutes = earlyMinutes;
        attendance.overtimeMinutes = overtimeMinutes;
        if (notes) attendance.notes = (attendance.notes ? attendance.notes + " | " : "") + notes;

        await attendance.save();

        // Trigger Notification to Managers
        const employee = await Employee.findById(employeeId).populate('department');
        if (employee) {
            await NotificationService.notifyManagers({
                type: 'attendance',
                title: 'Employee Clock-Out',
                message: `${employee.firstName} ${employee.lastName} clocked out at ${now.toLocaleTimeString()}. Total: ${totalHours}h`,
                priority: 'low',
                emailTrigger: 'clockOut',
                emailData: {
                    employeeName: `${employee.firstName} ${employee.lastName}`,
                    department: employee.department?.name || 'N/A',
                    time: now.toLocaleTimeString(),
                    isLate: false
                },
                metadata: { attendanceId: attendance._id, employeeId }
            });
        }

        res.status(200).json({
            success: true,
            message: `Clocked out successfully at ${now.toLocaleTimeString()}. Total hours: ${totalHours}`,
            attendance
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get employee's own attendance history
// @route   GET /api/attendance/my-history
// @access  Private
const getMyHistory = async (req, res) => {
    try {
        const employeeId = req.user.employeeId;
        const { startDate, endDate, page = 1, limit = 30 } = req.query;
        const skip = (page - 1) * limit;

        const query = { employeeId };
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const attendance = await Attendance.find(query)
            .sort({ date: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalRecords = await Attendance.countDocuments(query);

        // Calculate summary for the period
        const allRecords = await Attendance.find(query);
        const summary = {
            totalDays: allRecords.length,
            presentDays: allRecords.filter(a => a.status === 'present' || a.status === 'late').length,
            lateDays: allRecords.filter(a => a.status === 'late').length,
            totalOvertimeHours: Math.round(allRecords.reduce((acc, curr) => acc + (curr.overtimeMinutes / 60), 0) * 10) / 10,
            averageHoursPerDay: allRecords.length > 0 
                ? Math.round((allRecords.reduce((acc, curr) => acc + curr.totalHours, 0) / allRecords.length) * 10) / 10 
                : 0
        };

        res.status(200).json({
            success: true,
            count: attendance.length,
            pagination: { page: parseInt(page), limit: parseInt(limit), totalRecords },
            attendance,
            summary
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get today's attendance status
// @route   GET /api/attendance/my-today
// @access  Private
const getMyTodayStatus = async (req, res) => {
    try {
        const employeeId = req.user.employeeId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await Attendance.findOne({ employeeId, date: today });

        res.status(200).json({
            success: true,
            clockedIn: !!attendance,
            clockedOut: !!(attendance && attendance.clockOut),
            attendance: attendance || null,
            currentTime: new Date()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all employees attendance (Manager)
// @route   GET /api/attendance/all
// @access  Private/Manager
const getAllAttendance = async (req, res) => {
    try {
        const { employeeId, startDate, endDate, status, page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const query = {};
        if (employeeId) query.employeeId = employeeId;
        if (status) query.status = status;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const attendance = await Attendance.find(query)
            .populate({
                path: 'employeeId',
                select: 'firstName lastName department',
                populate: { path: 'department', select: 'name' }
            })
            .sort({ date: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalRecords = await Attendance.countDocuments(query);

        res.status(200).json({
            success: true,
            count: attendance.length,
            pagination: { page: parseInt(page), limit: parseInt(limit), totalRecords },
            attendance
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update attendance record (Manager)
// @route   PUT /api/attendance/:attendanceId
// @access  Private/Manager
const updateAttendance = async (req, res) => {
    try {
        const { clockIn, clockOut, notes } = req.body;
        let attendance = await Attendance.findById(req.params.attendanceId);

        if (!attendance) {
            return res.status(404).json({ success: false, message: 'Attendance record not found' });
        }

        if (clockIn) attendance.clockIn = new Date(clockIn);
        if (clockOut) attendance.clockOut = new Date(clockOut);
        if (notes) attendance.notes = notes;

        // Recalculate metrics
        if (attendance.clockIn && attendance.clockOut) {
            attendance.totalHours = calculateHours(attendance.clockIn, attendance.clockOut);
            attendance.lateMinutes = calculateLateMinutes(attendance.clockIn);
            attendance.earlyMinutes = calculateEarlyMinutes(attendance.clockOut);
            attendance.overtimeMinutes = calculateOvertime(attendance.totalHours);
            attendance.status = determineStatus(attendance.lateMinutes);
        }

        attendance.verifiedBy = req.user._id;
        await attendance.save();

        res.status(200).json({
            success: true,
            message: 'Attendance record updated successfully',
            attendance
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get summary report (Manager)
// @route   GET /api/attendance/report/summary
// @access  Private/Manager
const getSummaryReport = async (req, res) => {
    try {
        const { month, department } = req.query; // format YYYY-MM
        const query = {};

        if (month) {
            const start = new Date(`${month}-01`);
            const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
            query.date = { $gte: start, $lte: end };
        }

        let attendance = await Attendance.find(query).populate({
            path: 'employeeId',
            select: 'department firstName lastName',
            populate: { path: 'department', select: 'name' }
        });

        if (department) {
            attendance = attendance.filter(a => a.employeeId.department?._id.toString() === department.toString() || a.employeeId.department?.name === department);
        }

        const summary = {
            totalRecords: attendance.length,
            totalLateArrivals: attendance.filter(a => a.status === 'late').length,
            totalOvertimeHours: Math.round(attendance.reduce((acc, curr) => acc + (curr.overtimeMinutes / 60), 0) * 10) / 10,
            averageHours: attendance.length > 0 
                ? Math.round((attendance.reduce((acc, curr) => acc + curr.totalHours, 0) / attendance.length) * 10) / 10 
                : 0
        };

        res.status(200).json({
            success: true,
            month: month || 'All Time',
            summary,
            recordCount: attendance.length
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Generate a dynamic QR token for office kiosk
// @route   GET /api/attendance/qr-token-generator
// @access  Private/Manager
const generateQRToken = async (req, res) => {
    try {
        const token = jwt.sign(
            { type: 'attendance_qr', timestamp: Date.now() },
            process.env.QR_SECRET,
            { expiresIn: config.QR_EXPIRY_SECONDS || 60 }
        );

        res.status(200).json({
            success: true,
            qrToken: token,
            expiresIn: config.QR_EXPIRY_SECONDS || 60
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    clockIn,
    clockOut,
    getMyHistory,
    getMyTodayStatus,
    getAllAttendance,
    updateAttendance,
    getSummaryReport,
    generateQRToken
};
