/**
 * Validation middleware for Employee creation and updates.
 */

const validateCreateEmployee = (req, res, next) => {
    if (!req.body) {
        return res.status(400).json({ success: false, message: 'Request body is missing' });
    }
    const { firstName, lastName, email, department, position, hireDate, salary } = req.body || {};
    const errors = [];

    if (!firstName || firstName.trim().length < 2) errors.push('firstName is required and must be at least 2 chars');
    if (!lastName || lastName.trim().length < 2) errors.push('lastName is required and must be at least 2 chars');
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.push('A valid email is required');
    if (!department) errors.push('department is required');
    if (!position) errors.push('position is required');
    
    if (hireDate) {
        const hDate = new Date(hireDate);
        if (isNaN(hDate.getTime()) || hDate > new Date()) {
            errors.push('hireDate must be a valid date and not in the future');
        }
    }

    if (salary && isNaN(Number(salary))) {
        errors.push('salary must be a number');
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
    }

    next();
};

const validateUpdateEmployee = (req, res, next) => {
    if (!req.body) {
        return res.status(400).json({ success: false, message: 'Request body is missing' });
    }
    const { email, hireDate, salary } = req.body || {};
    const errors = [];

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
        errors.push('email must be a valid email format');
    }

    if (hireDate) {
        const hDate = new Date(hireDate);
        if (isNaN(hDate.getTime()) || hDate > new Date()) {
            errors.push('hireDate must be a valid date and not in the future');
        }
    }

    if (salary && isNaN(Number(salary))) {
        errors.push('salary must be a number');
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
    }

    next();
};

module.exports = {
    validateCreateEmployee,
    validateUpdateEmployee
};
