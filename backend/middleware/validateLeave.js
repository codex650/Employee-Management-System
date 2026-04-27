/**
 * Validation for Leave Requests
 */

const validateLeaveRequest = (req, res, next) => {
    const { leaveType, startDate, endDate, reason, halfDay, halfDaySession } = req.body;
    const errors = [];

    if (!leaveType) errors.push('leaveType is required');
    if (!startDate) errors.push('startDate is required');
    if (!endDate) errors.push('endDate is required');
    if (!reason || reason.trim().length < 5) errors.push('Reason is required and must be at least 5 chars');

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        errors.push('startDate cannot be after endDate');
    }

    if (new Date(startDate) < new Date().setHours(0, 0, 0, 0)) {
        errors.push('Cannot request leave for past dates');
    }

    if (halfDay) {
        if (!['morning', 'afternoon'].includes(halfDaySession)) {
            errors.push('halfDaySession must be morning or afternoon');
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
    }
    next();
};

const validateDecision = (req, res, next) => {
    const { reason } = req.body;
    if (req.path.includes('reject') && (!reason || reason.trim().length < 5)) {
        return res.status(400).json({ success: false, message: 'Rejection reason is required (min 5 chars)' });
    }
    next();
};

module.exports = {
    validateLeaveRequest,
    validateDecision
};
