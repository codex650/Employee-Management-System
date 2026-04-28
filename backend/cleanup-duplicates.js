const connectDB = require('./config/db');
const Designation = require('./models/Designation');
require('dotenv').config();

const cleanupDesignations = async () => {
    try {
        await connectDB();
        console.log('Searching for duplicates...');

        // Find all active designations
        const designations = await Designation.find({ active: true });
        const seen = new Set();
        let deletedCount = 0;

        for (const des of designations) {
            // Create a unique key: Name + DepartmentID
            const key = `${des.name.toLowerCase()}-${des.departmentId.toString()}`;

            if (seen.has(key)) {
                // If we've seen this combo before, delete this one
                await Designation.findByIdAndDelete(des._id);
                console.log(`Deleted duplicate: "${des.name}"`);
                deletedCount++;
            } else {
                seen.add(key);
            }
        }

        console.log(`\nCleanup Complete! Removed ${deletedCount} duplicates.`);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

cleanupDesignations();
