const config = require('../config/leaveConfig');

/**
 * Calculates number of leave days between two dates
 * Excludes weekends if configured
 */
const calculateDays = (start, end, halfDay = false) => {
    if (halfDay) return 0.5;

    let startDate = new Date(start);
    let endDate = new Date(end);
    let days = 0;

    while (startDate <= endDate) {
        if (config.EXCLUDE_WEEKENDS) {
            const dayOfWeek = startDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sun, 6 = Sat
                days++;
            }
        } else {
            days++;
        }
        startDate.setDate(startDate.getDate() + 1);
    }
    return days;
};

/**
 * Checks for overlapping leave records
 */
const isOverlap = (existingLeaves, newStart, newEnd) => {
    const start = new Date(newStart);
    const end = new Date(newEnd);

    return existingLeaves.some(leave => {
        const leaveStart = new Date(leave.startDate);
        const leaveEnd = new Date(leave.endDate);
        // Overlap logic: (StartA <= EndB) and (EndA >= StartB)
        return (start <= leaveEnd) && (end >= leaveStart);
    });
};

module.exports = {
    calculateDays,
    isOverlap
};
