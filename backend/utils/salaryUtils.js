const salaryConfig = require('../config/salaryConfig');

/**
 * Calculates net salary for an employee based on attendance and leaves
 */
const calculateNetSalary = (basic, allowances, deductions, bonus) => {
    return (basic + allowances + bonus) - deductions;
};

/**
 * Calculates daily rate (assuming 22 working days for MVP)
 */
const getDailyRate = (monthlySalary) => {
    return monthlySalary / 22;
};

/**
 * Calculates late arrival fines
 */
const calculateLateFine = (lateMinutes) => {
    const { graceMinutes, deductionPerMinute, maxDeductionPerDay } = salaryConfig.PAYROLL_DEDUCTION_RULES.lateArrival;
    
    if (lateMinutes <= graceMinutes) return 0;
    
    const taxableMinutes = lateMinutes - graceMinutes;
    const fine = taxableMinutes * deductionPerMinute;
    
    return Math.min(fine, maxDeductionPerDay);
};

module.exports = {
    calculateNetSalary,
    getDailyRate,
    calculateLateFine
};
