const User = require('../models/User');
const Employee = require('../models/Employee');

// @desc    Get profile
// @route   GET /api/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate({
            path: 'employeeId',
            populate: [
                { path: 'department', select: 'name' },
                { path: 'position', select: 'name' }
            ]
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                email: user.email,
                role: user.role,
                preferences: user.preferences,
                employee: user.employeeId
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update profile
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const { phone, bankDetails, paymentMethod, emergencyContacts, preferences } = req.body;
        
        // Find user
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update preferences if provided
        if (preferences && preferences.theme) {
            user.preferences = {
                ...user.preferences,
                theme: preferences.theme
            };
            await user.save();
        }

        // Update employee record if linked
        if (user.employeeId) {
            const employee = await Employee.findById(user.employeeId);
            if (employee) {
                if (phone !== undefined) employee.phone = phone;
                if (bankDetails) employee.bankDetails = { ...employee.bankDetails, ...bankDetails };
                if (paymentMethod) employee.paymentMethod = paymentMethod;
                if (emergencyContacts) employee.emergencyContacts = emergencyContacts;

                await employee.save();
            }
        }

        // Fetch fully updated profile
        const updatedUser = await User.findById(req.user._id).populate({
            path: 'employeeId',
            populate: [
                { path: 'department', select: 'name' },
                { path: 'position', select: 'name' }
            ]
        });

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                _id: updatedUser._id,
                email: updatedUser.email,
                role: updatedUser.role,
                preferences: updatedUser.preferences,
                employee: updatedUser.employeeId
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update password
// @route   PUT /api/profile/password
// @access  Private
const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new password are required' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect current password' });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Upload avatar
// @route   POST /api/profile/avatar
// @access  Private
const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image uploaded' });
        }

        const user = await User.findById(req.user._id);
        if (!user || !user.employeeId) {
            return res.status(404).json({ success: false, message: 'Employee record not found' });
        }

        const employee = await Employee.findById(user.employeeId);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee record not found' });
        }

        employee.profileImage = req.file.filename; 
        await employee.save();

        res.status(200).json({
            success: true,
            message: 'Avatar uploaded successfully',
            profileImage: req.file.filename
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    updatePassword,
    uploadAvatar
};
