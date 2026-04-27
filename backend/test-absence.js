const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Employee = require('./models/Employee');
const Attendance = require('./models/Attendance');
const Leave = require('./models/Leave');
const { isHoliday } = require('./utils/attendanceUtils');
require('dotenv').config();

const testAbsenceLogic = async () => {
    try {
        await connectDB();
        console.log('--- TESTING ABSENCE TRACKING LOGIC ---');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        // 1. Holiday Check
        if (isHoliday(today)) {
            console.log('Today is a holiday. Skip test.');
            process.exit(0);
        }

        // 2. Fetch Active Employees
        const activeEmployees = await Employee.find({ status: 'active' });
        console.log(`Checking ${activeEmployees.length} active employees...`);

        for (const employee of activeEmployees) {
            // 3. Attendance Check
            const existingAttendance = await Attendance.findOne({ 
                employeeId: employee._id, 
                date: today 
            });

            if (existingAttendance) {
                console.log(`[PASS] ${employee.email} has existing attendance: ${existingAttendance.status}`);
                continue;
            }

            // 4. Leave Check
            const onLeave = await Leave.findOne({
                employeeId: employee._id,
                status: 'approved',
                startDate: { $lte: todayEnd },
                endDate: { $gte: today }
            });

            if (onLeave) {
                console.log(`[PASS] ${employee.email} is on approved leave.`);
                continue;
            }

            // 5. Simulation output (don't actually create record to avoid polluting real data, or use a flag)
            console.log(`[ABSENT] ${employee.email} would be marked as Absent.`);
        }

        console.log('--- TEST COMPLETED ---');
        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
};

testAbsenceLogic();
