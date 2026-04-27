/**
 * Validation for Attendance Clock-in/out
 */

const validateClockIn = (req, res, next) => {
    const { notes } = req.body;
    if (notes && notes.length > 500) {
        return res.status(400).json({ success: false, message: 'Notes cannot exceed 500 characters' });
    }
    next();
};

const validateClockOut = (req, res, next) => {
    const { notes } = req.body;
    if (notes && notes.length > 500) {
        return res.status(400).json({ success: false, message: 'Notes cannot exceed 500 characters' });
    }
    next();
};

const validateAttendanceUpdate = (req, res, next) => {
    const { clockIn, clockOut, notes } = req.body;
    const errors = [];

    if (clockIn && isNaN(new Date(clockIn).getTime())) errors.push('Invalid clockIn date');
    if (clockOut && isNaN(new Date(clockOut).getTime())) errors.push('Invalid clockOut date');
    
    if (clockIn && clockOut && new Date(clockIn) >= new Date(clockOut)) {
        errors.push('clockOut must be after clockIn');
    }

    if (notes && notes.length > 500) errors.push('Notes too long');

    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
    }
    next();
};

module.exports = {
    validateClockIn,
    validateClockOut,
    validateAttendanceUpdate
};
