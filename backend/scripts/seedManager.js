const mongoose = require('mongoose');
const User = require('../models/User');
const Employee = require('../models/Employee');
const connectDB = require('../config/db');
require('dotenv').config();

const seedManager = async () => {
    try {
        await connectDB();

        // Check if user or employee already exists
        const adminExists = await User.findOne({ email: 'admin@ems.com' });
        const employeeExists = await Employee.findOne({ email: 'admin@ems.com' });

        if (adminExists || employeeExists) {
            console.log('Admin user or employee document already exists.');
            process.exit();
        }

        // Create Employee document first
        const employee = await Employee.create({
            firstName: 'System',
            lastName: 'Administrator',
            email: 'admin@ems.com',
            phone: '0000000000',
            department: 'IT',
            position: 'System Administrator',
            hireDate: new Date()
        });

        // Create User document with reference to employeeId
        await User.create({
            email: 'admin@ems.com',
            password: 'Admin123!',
            role: 'manager',
            employeeId: employee._id
        });

        console.log('Manager user seeded successfully.');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedManager();
