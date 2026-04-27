/**
 * Builds a MongoDB query object based on provided filters
 * @param {Object} filters - The filters from req.query
 * @returns {Object} - MongoDB query object
 */
const buildEmployeeQuery = (filters) => {
    const query = {};

    // 1. Search term (regex on firstName, lastName, email)
    if (filters.search) {
        const searchRegex = new RegExp(filters.search, 'i');
        query.$or = [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { email: searchRegex }
        ];
    }

    // 2. Department filter (exact match)
    if (filters.department) {
        query.department = filters.department;
    }

    // 3. Status filter (exact match)
    if (filters.status) {
        query.status = filters.status;
    }

    // 4. Date range filter on hireDate
    if (filters.startDate || filters.endDate) {
        query.hireDate = {};
        if (filters.startDate) {
            query.hireDate.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
            query.hireDate.$lte = new Date(filters.endDate);
        }
    }

    return query;
};

module.exports = { buildEmployeeQuery };
