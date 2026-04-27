const mongoose = require('mongoose');
const User = require('./models/User');
const Employee = require('./models/Employee');
require('dotenv').config();

const fix = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const employee = await Employee.findOne({ email: 'admin@ems.com' });
        if (!employee) {
            console.log('Employee not found, running full seed migration...');
            // Maybe run seed logic here
            return;
        }

        const user = await User.findOne({ email: 'admin@ems.com' });
        if (user) {
            console.log('User already exists. Updating password just in case...');
            user.password = 'Admin123!';
            await user.save();
            console.log('Password updated.');
        } else {
            console.log('User missing. Creating user linked to employee...');
            await User.create({
                email: 'admin@ems.com',
                password: 'Admin123!',
                role: 'manager',
                employeeId: employee._id
            });
            console.log('User created and linked.');
        }
        process.exit();
    } catch (error) {
        console.error('Error details:', JSON.stringify(error, null, 2));
        console.error('Error message:', error.message);
        process.exit(1);
    }
};

fix();
