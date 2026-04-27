const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const Salary = require('../models/Salary');
const User = require('../models/User');
require('dotenv').config();

const migrateSalaries = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const admin = await User.findOne({ role: 'manager' });
        if (!admin) {
            console.error('No manager found');
            await mongoose.disconnect();
            return;
        }

        const employees = await Employee.find({});
        console.log(`Found ${employees.length} employees`);
        
        let createdCount = 0;
        for (const emp of employees) {
            const exists = await Salary.findOne({ employeeId: emp._id });
            if (!exists) {
                await Salary.create({
                    employeeId: emp._id,
                    basic: 5000,
                    allowances: { house: 1000, transport: 250, medical: 150 },
                    reason: 'Initial migration',
                    updatedBy: admin._id
                });
                createdCount++;
            }
        }

        console.log(`Successfully migrated salaries for ${createdCount} employees.`);
        await mongoose.disconnect();
    } catch (error) {
        console.error('Migration failed:', error);
        await mongoose.disconnect();
    }
};

migrateSalaries();
