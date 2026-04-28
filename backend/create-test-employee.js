const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Employee = require('./models/Employee');
const Department = require('./models/Department');
const Designation = require('./models/Designation');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    // Find or create Department
    let dept = await Department.findOne();
    if (!dept) {
      dept = await Department.create({ name: 'Engineering', description: 'Tech team' });
      console.log('Created Department');
    }

    // Find or create Designation
    let desig = await Designation.findOne();
    if (!desig) {
      desig = await Designation.create({ name: 'Software Engineer', department: dept._id });
      console.log('Created Designation');
    }

    // Create Employee
    const email = 'employee@ems.com';
    let emp = await Employee.findOne({ email });
    if (!emp) {
      emp = await Employee.create({
        firstName: 'John',
        lastName: 'Doe',
        email,
        department: dept._id,
        position: desig._id,
        status: 'active'
      });
      console.log('Created Employee');
    }

    // Create User
    let user = await User.findOne({ email });
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('Employee123!', salt);

    if (!user) {
      user = await User.create({
        email,
        password,
        role: 'employee',
        employeeId: emp._id,
        isVerified: true
      });
      console.log('Created User');
    } else {
      user.password = password;
      user.employeeId = emp._id;
      user.isVerified = true;
      user.role = 'employee';
      await user.save();
      console.log('Updated User Password');
    }

    console.log('Test Employee Created Successfully!');
    console.log('Email: employee@ems.com');
    console.log('Password: Employee123!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating employee:', error);
    process.exit(1);
  }
};

run();
