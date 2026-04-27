const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const LeaveBalance = require('../models/LeaveBalance');
require('dotenv').config();

const initBalances = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const employees = await Employee.find({});
        const year = new Date().getFullYear();
        let createdCount = 0;

        for (const employee of employees) {
            const exists = await LeaveBalance.findOne({ employeeId: employee._id, year });
            if (!exists) {
                await LeaveBalance.create({ employeeId: employee._id, year });
                createdCount++;
            }
        }

        console.log(`Successfully initialized balances for ${createdCount} employees.`);
        process.exit();
    } catch (error) {
        console.error('Error initializing balances:', error);
        process.exit(1);
    }
};

initBalances();
