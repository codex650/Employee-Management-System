const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Department = require('../models/Department');
const Designation = require('../models/Designation');
const Employee = require('../models/Employee');
require('dotenv').config();

const migrate = async () => {
    try {
        await connectDB();
        console.log('Connected to database...');

        // Get all employees as raw documents (to avoid Mongoose casting errors)
        const rawEmployees = await Employee.collection.find({}).toArray();
        console.log(`Found ${rawEmployees.length} employees to migrate.`);

        const deptMap = new Map(); // Name -> ObjectId
        const posMap = new Map(); // DeptId_PosName -> ObjectId

        for (const emp of rawEmployees) {
            let deptId;
            const deptName = emp.department;
            const posName = emp.position;

            if (typeof deptName !== 'string') {
                console.log(`Skipping employee ${emp.email} - already migrated or invalid data.`);
                continue;
            }

            // 1. Handle Department
            if (deptMap.has(deptName)) {
                deptId = deptMap.get(deptName);
            } else {
                let dept = await Department.findOne({ name: deptName });
                if (!dept) {
                    dept = await Department.create({ name: deptName, description: 'Migrated department' });
                    console.log(`Created Department: ${deptName}`);
                }
                deptId = dept._id;
                deptMap.set(deptName, deptId);
            }

            // 2. Handle Designation
            const posKey = `${deptId}_${posName}`;
            let posId;
            if (posMap.has(posKey)) {
                posId = posMap.get(posKey);
            } else {
                let pos = await Designation.findOne({ name: posName, departmentId: deptId });
                if (!pos) {
                    pos = await Designation.create({ 
                        name: posName, 
                        departmentId: deptId,
                        description: 'Migrated designation' 
                    });
                    console.log(`Created Designation: ${posName} in ${deptName}`);
                }
                posId = pos._id;
                posMap.set(posKey, posId);
            }

            // 3. Update Employee
            await Employee.collection.updateOne(
                { _id: emp._id },
                { 
                    $set: { 
                        department: deptId,
                        position: posId 
                    } 
                }
            );
            console.log(`Updated Employee: ${emp.email}`);
        }

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
