const User = require('../models/User');
const Employee = require('../models/Employee');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds

// @desc    Register a new user (Manager only)
// @route   POST /api/auth/register
// @access  Private/Manager
const register = async (req, res) => {
    try {
        let { email, password, role, employeeData } = req.body;

        // If employeeData is a string (from form-data), parse it to an object
        if (typeof employeeData === 'string') {
            employeeData = JSON.parse(employeeData);
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create Employee document first
        const employee = await Employee.create({
            firstName: employeeData.firstName,
            lastName: employeeData.lastName,
            email: employeeData.email || email,
            phone: employeeData.phone,
            department: employeeData.department,
            position: employeeData.position,
            hireDate: employeeData.hireDate,
            profileImage: req.file ? req.file.filename : ""
        });

        // Create User document with reference to employeeId
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        
        const user = await User.create({
            email,
            password,
            role: role || 'employee',
            employeeId: employee._id,
            verificationToken,
            passwordResetExpires: Date.now() + 600000 // OTP expires in 10 mins
        });

        // Send verification email
        await sendVerificationEmail(user.email, employeeData.firstName, verificationToken);

        // Return user and employee data (without password)
        res.status(201).json({
            message: 'User created successfully. Please check your email to verify your account.',
            user: {
                _id: user._id,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified,
                employee: employee
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email and populate employeeId
        const user = await User.findOne({ email }).populate('employeeId');

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if account is locked
        if (user.isLocked) {
            const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
            return res.status(403).json({ 
                message: `Account is temporarily locked. Try again in ${remainingTime} minutes.` 
            });
        }

        const isMatch = await user.comparePassword(password);

        if (isMatch) {
            // Check if verified
            if (!user.isVerified) {
                return res.status(401).json({ message: 'Please verify your email before logging in.' });
            }

            // Reset login attempts on success
            if (user.loginAttempts > 0 || user.lockUntil) {
                user.loginAttempts = 0;
                user.lockUntil = undefined;
                await user.save();
            }

            const token = jwt.sign(
                { _id: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE || '7d' }
            );

            // Set cookie options
            const cookieOptions = {
                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Lax'
            };

            res.cookie('token', token, cookieOptions);

            res.json({
                success: true,
                token,
                user: {
                    _id: user._id,
                    email: user.email,
                    role: user.role,
                    employee: user.employeeId
                }
            });
        } else {
            // Increment login attempts on failure
            user.loginAttempts += 1;
            
            if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
                user.lockUntil = Date.now() + LOCK_TIME;
                await user.save();
                return res.status(403).json({ 
                    message: `Too many failed attempts. Account locked for 30 minutes.` 
                });
            }
            
            await user.save();
            res.status(401).json({ 
                message: `Invalid email or password. ${MAX_LOGIN_ATTEMPTS - user.loginAttempts} attempts remaining.` 
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('employeeId');
        if (user) {
            res.json({
                user: {
                    _id: user._id,
                    email: user.email,
                    role: user.role,
                    employee: user.employeeId
                }
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify if token is valid
// @route   GET /api/auth/verify
// @access  Private
const verify = async (req, res) => {
    return res.status(200).json({ 
        success: true, 
        user: { _id: req.user._id, role: req.user.role } 
    });
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({ success: true, message: "Logged out successfully" });
};

// @desc    Verify email with OTP
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        const user = await User.findOne({ 
            email, 
            verificationToken: otp,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification code' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.status(200).json({ success: true, message: 'Email verified successfully. You can now log in.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Resend verification OTP
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerificationToken = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findOne({ email }).populate('employeeId');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'This account is already verified' });
        }

        const newOTP = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationToken = newOTP;
        user.passwordResetExpires = Date.now() + 600000; // 10 minutes
        await user.save();

        const firstName = user.employeeId ? user.employeeId.firstName : 'User';
        await sendVerificationEmail(user.email, firstName, newOTP);

        res.status(200).json({ success: true, message: 'A new verification code has been sent to your email.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Forgot password request (Generates OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email }).populate('employeeId');

        if (!user) {
            return res.status(404).json({ success: false, message: 'No account found with this email address.' });
        }

        const resetOTP = Math.floor(100000 + Math.random() * 900000).toString();
        user.passwordResetToken = resetOTP;
        user.passwordResetExpires = Date.now() + 600000; // 10 minutes
        await user.save();

        const firstName = user.employeeId ? user.employeeId.firstName : 'User';
        await sendPasswordResetEmail(user.email, firstName, resetOTP);

        res.status(200).json({ success: true, message: 'Password reset OTP has been sent to your email.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset password using OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    try {
        const { email, otp, password } = req.body;

        if (!email || !otp || !password) {
            return res.status(400).json({ message: 'Email, OTP, and new password are required' });
        }

        const user = await User.findOne({ 
            email,
            passwordResetToken: otp,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset code' });
        }

        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        
        await user.save();

        res.status(200).json({ success: true, message: 'Password reset successful. You can now log in.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    register,
    login,
    getMe,
    verify,
    logout,
    verifyEmail,
    resendVerificationToken,
    forgotPassword,
    resetPassword
};
