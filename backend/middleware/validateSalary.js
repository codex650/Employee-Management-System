/**
 * Validation for Salary and Payroll
 */

const validateSalaryUpdate = (req, res, next) => {
    const { basic, reason } = req.body;
    const errors = [];

    if (basic && (isNaN(basic) || basic < 0)) errors.push('Basic salary must be a positive number');
    if (!reason || reason.trim().length < 5) errors.push('Reason for change is required (min 5 characters)');

    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
    }
    next();
};

const validateBonus = (req, res, next) => {
    const { amount, type, reason } = req.body;
    const errors = [];

    if (!amount || isNaN(amount) || amount <= 0) errors.push('Valid bonus amount is required');
    if (!type) errors.push('Bonus type is required');
    if (!reason || reason.trim().length < 5) errors.push('Reason is required');

    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
    }
    next();
};

const validatePayrollGen = (req, res, next) => {
    const { month, year } = req.body;
    if (!month || month < 1 || month > 12) return res.status(400).json({ success: false, message: 'Valid month (1-12) is required' });
    if (!year || year < 2000) return res.status(400).json({ success: false, message: 'Valid year is required' });
    next();
};

module.exports = {
    validateSalaryUpdate,
    validateBonus,
    validatePayrollGen
};
