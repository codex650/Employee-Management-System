const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const checkAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ email: 'admin@ems.com' });
        if (user) {
            console.log('User found:', {
                email: user.email,
                role: user.role,
                hasPassword: !!user.password,
                passwordLength: user.password ? user.password.length : 0,
                isHashed: user.password ? user.password.startsWith('$2') : false
            });
        } else {
            console.log('User admin@ems.com not found');
        }
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkAdmin();
