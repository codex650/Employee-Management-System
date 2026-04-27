const getVerificationEmailTemplate = (name, otp) => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #4CAF50;">Verify Your Email</h2>
        <p>Hello ${name},</p>
        <p>Thank you for joining EMS. Your one-time verification code is:</p>
        <div style="text-align: center; margin: 30px 0;">
            <h1 style="font-size: 48px; letter-spacing: 10px; color: #4CAF50; background: #f9f9f9; padding: 20px; border-radius: 10px; display: inline-block;">${otp}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777;">If you did not create an account, please ignore this email.</p>
    </div>
</body>
</html>
`;

const getPasswordResetTemplate = (name, otp) => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #f44336;">Reset Your Password</h2>
        <p>Hello ${name},</p>
        <p>We received a password reset request. Your one-time reset code is:</p>
        <div style="text-align: center; margin: 30px 0;">
            <h1 style="font-size: 48px; letter-spacing: 10px; color: #f44336; background: #f9f9f9; padding: 20px; border-radius: 10px; display: inline-block;">${otp}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777;">If you did not request a password reset, no further action is required.</p>
    </div>
</body>
</html>
`;

module.exports = {
    getVerificationEmailTemplate,
    getPasswordResetTemplate
};
