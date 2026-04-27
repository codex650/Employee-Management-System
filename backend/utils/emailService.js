const nodemailer = require('nodemailer');
const { getVerificationEmailTemplate, getPasswordResetTemplate } = require('../templates/authEmails');
const { getAttendanceEmailTemplate, getLeaveEmailTemplate } = require('../templates/notificationEmails');

/**
 * Send an email using Nodemailer
 */
const sendEmail = async (options, otpCode = null) => {
    // FORCE LOGGING IN DEV
    console.log('\n=========================================');
    console.log('🚀 [EMAIL SERVICE] OUTGOING MESSAGE');
    console.log(`📍 To:      ${options.to}`);
    console.log(`📍 Subject: ${options.subject}`);
    if (otpCode) console.log(`🔑 OTP CODE: ${otpCode}`);
    console.log('=========================================\n');

    const isConfigured = process.env.SMTP_HOST && 
                        process.env.SMTP_USER && 
                        process.env.SMTP_USER !== 'YOUR_SMTP_USER';

    if (!isConfigured) {
        console.log('⚠️  SMTP not configured. Real email NOT sent.\n');
        return;
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    const mailOptions = {
        from: `EMS System <${process.env.SMTP_FROM || 'noreply@ems.com'}>`,
        to: options.to,
        subject: options.subject,
        html: options.html
    };

    await transporter.sendMail(mailOptions);
};

/**
 * Send Verification OTP
 */
const sendVerificationEmail = async (email, name, otp) => {
    await sendEmail({
        to: email,
        subject: 'Your EMS verification code',
        html: getVerificationEmailTemplate(name, otp)
    }, otp);
};

/**
 * Send Password Reset OTP
 */
const sendPasswordResetEmail = async (email, name, otp) => {
    await sendEmail({
        to: email,
        subject: 'Your EMS password reset code',
        html: getPasswordResetTemplate(name, otp)
    }, otp);
};

/**
 * Send Attendance Notification
 */
const sendAttendanceEmail = async (email, data) => {
    await sendEmail({
        to: email,
        subject: data.isLate ? `[ALERT] Late Arrival: ${data.employeeName}` : `Clock-In: ${data.employeeName}`,
        html: getAttendanceEmailTemplate(data)
    });
};

/**
 * Send Leave Notification
 */
const sendLeaveEmail = async (email, data) => {
    await sendEmail({
        to: email,
        subject: `Leave Request Update: ${data.status}`,
        html: getLeaveEmailTemplate(data)
    });
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendAttendanceEmail,
    sendLeaveEmail
};
