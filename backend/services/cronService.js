const cron = require('node-cron');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const { isHoliday } = require('../utils/attendanceUtils');

/**
 * DAILY ABSENCE TRACKER
 * Runs at 11:55 PM every day
 * Marks active employees as 'absent' if they have no attendance record and aren't on approved leave
 */
const initCronJobs = () => {
    // 23:55 (11:55 PM)
    cron.schedule('55 23 * * *', async () => {
        console.log('Running Daily Absence Tracker...');
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const todayEnd = new Date(today);
            todayEnd.setHours(23, 59, 59, 999);

            // 1. Check if today is a holiday
            if (isHoliday(today)) {
                console.log('Today is a holiday. Skipping absence tracking.');
                return;
            }

            // 2. Fetch all active employees
            const activeEmployees = await Employee.find({ status: 'active' });

            for (const employee of activeEmployees) {
                // 3. Check if attendance record already exists for today
                const existingAttendance = await Attendance.findOne({ 
                    employeeId: employee._id, 
                    date: today 
                });

                if (existingAttendance) continue; // Already present/late/etc.

                // 4. Check if employee is on approved leave today
                const onLeave = await Leave.findOne({
                    employeeId: employee._id,
                    status: 'approved',
                    startDate: { $lte: todayEnd },
                    endDate: { $gte: today }
                });

                if (onLeave) {
                    console.log(`Skipping ${employee.email} - On approved leave.`);
                    continue;
                }

                // 5. Mark as Absent
                await Attendance.create({
                    employeeId: employee._id,
                    date: today,
                    status: 'absent',
                    notes: 'Automatically marked as absent by system'
                });

                console.log(`Marked ${employee.email} as Absent.`);
            }

            console.log('Absence tracking completed for today.');
        } catch (error) {
            console.error('Error in Absence Tracker Cron:', error);
        }
    });

    console.log('Cron Jobs Initialized successfully.');
};

module.exports = { initCronJobs };
