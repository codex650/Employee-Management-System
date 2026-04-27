const { CATEGORIES } = require('../config/documentConfig');

const validateDocumentUpload = (req, res, next) => {
    const { category, title, employeeId } = req.body;
    const errors = [];

    if (!category || !CATEGORIES.includes(category)) {
        errors.push(`Category must be one of: ${CATEGORIES.join(', ')}`);
    }
    if (!title || title.trim().length < 3) errors.push('Title must be at least 3 characters');
    
    // Managers must specify employeeId, Employees can leave it blank (defaults to self)
    if (req.user.role === 'manager' && !employeeId) {
        errors.push('employeeId is required for manager uploads');
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
    }
    next();
};

const validateDocumentUpdate = (req, res, next) => {
    const { title, category } = req.body;
    const errors = [];

    if (title && title.trim().length < 3) errors.push('Title must be at least 3 characters');
    if (category && !CATEGORIES.includes(category)) {
        errors.push(`Category must be one of: ${CATEGORIES.join(', ')}`);
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
    }
    next();
};

module.exports = {
    validateDocumentUpload,
    validateDocumentUpdate
};
