const config = require('../config/attendanceConfig');

/**
 * Calculates total hours worked in decimals
 */
const calculateHours = (clockIn, clockOut) => {
    if (!clockIn || !clockOut) return 0;
    const diff = new Date(clockOut) - new Date(clockIn);
    return Math.round((diff / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
};

/**
 * Calculates late minutes compared to standard start time
 */
const calculateLateMinutes = (clockIn) => {
    const checkTime = new Date(clockIn);
    const workStartTime = new Date(checkTime);
    workStartTime.setHours(config.WORK_START_TIME, config.LATE_THRESHOLD_MINUTES, 0, 0);

    if (checkTime > workStartTime) {
        const diffMs = checkTime - workStartTime;
        return Math.floor(diffMs / (1000 * 60));
    }
    return 0;
};

/**
 * Calculates early departure minutes compared to standard end time
 */
const calculateEarlyMinutes = (clockOut) => {
    const checkTime = new Date(clockOut);
    const workEndTime = new Date(checkTime);
    workEndTime.setHours(config.WORK_END_TIME, 0, 0, 0);

    if (checkTime < workEndTime) {
        const diffMs = workEndTime - checkTime;
        return Math.floor(diffMs / (1000 * 60));
    }
    return 0;
};

/**
 * Calculates overtime minutes beyond standard work hours
 */
const calculateOvertime = (totalHours) => {
    if (totalHours > config.WORK_HOURS_PER_DAY) {
        const overtimeHours = totalHours - config.WORK_HOURS_PER_DAY;
        return Math.floor(overtimeHours * 60);
    }
    return 0;
};

/**
 * Determines attendance status
 */
const determineStatus = (lateMinutes) => {
    return lateMinutes > 0 ? 'late' : 'present';
};

/**
 * Checks if a given date is a holiday
 */
const isHoliday = (date) => {
    const dateString = new Date(date).toISOString().split('T')[0];
    return config.HOLIDAYS.includes(dateString);
};

module.exports = {
    calculateHours,
    calculateLateMinutes,
    calculateEarlyMinutes,
    calculateOvertime,
    determineStatus,
    isHoliday
};
