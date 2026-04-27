const mongoose = require('mongoose');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Designation = require('../models/Designation');
const connectDB = require('../config/db');
require('dotenv').config();

const seedManager = async () => {
    try {
        await connectDB();
        console.log('Connected for seeding...');

        const email = 'admin@ems.com';
        const password = 'Admin123!';

        // 1. Cleanup check
        const adminExists = await User.findOne({ email });
        if (adminExists) {
            console.log('Admin user already exists. Skipping...');
            process.exit(0);
        }

        // 2. Ensure Department & Designation exist (Relational fix)
        let dept = await Department.findOne({ name: 'IT' });
        if (!dept) dept = await Department.create({ name: 'IT', description: 'Information Technology' });

        let desig = await Designation.findOne({ name: 'System Administrator' });
        if (!desig) desig = await Designation.create({ name: 'System Administrator', departmentId: dept._id });

        // 3. Create Employee
        const employee = await Employee.create({
            firstName: 'System',
            lastName: 'Admin',
            email: email,
            phone: '1234567890',
            department: dept._id,
            position: desig._id,
            hireDate: new Date(),
            status: 'active'
        });

        // 4. Create User (Manager role)
        await User.create({
            email,
            password,
            role: 'manager',
            employeeId: employee._id,
            isVerified: true // Auto-verify so user can log in
        });

        console.log(`-----------------------------------`);
        console.log(`Success! Manager Account Created:`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log(`Role: manager (FULL ACCESS)`);
        console.log(`-----------------------------------`);

        process.exit(0);
    } catch (error) {
        console.error(`Error during seeding: ${error.message}`);
        process.exit(1);
    }
};

seedManager();
