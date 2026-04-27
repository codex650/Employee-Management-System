const jwt = require('jsonwebtoken');
require('dotenv').config();

// Configuration
const QR_SECRET = process.env.QR_SECRET;

const testQRLogic = async () => {
    console.log('--- TESTING QR TOKEN LOGIC ---');

    // 1. Generate a Valid Token
    const validToken = jwt.sign(
        { type: 'attendance_qr', timestamp: Date.now() },
        QR_SECRET,
        { expiresIn: '60s' }
    );
    console.log('Generated Valid Token:', validToken);

    // 2. Validate Valid Token
    try {
        const decoded = jwt.verify(validToken, QR_SECRET);
        console.log('Success: Validating valid token passed!', decoded);
    } catch (err) {
        console.error('Error: Valid token failed validation', err.message);
    }

    // 3. Generate a Token for another type
    const wrongTypeToken = jwt.sign(
        { type: 'wrong_type', timestamp: Date.now() },
        QR_SECRET,
        { expiresIn: '60s' }
    );
    try {
        const decoded = jwt.verify(wrongTypeToken, QR_SECRET);
        if (decoded.type !== 'attendance_qr') {
            console.log('Success: Correctly identified wrong token type.');
        }
    } catch (err) {
        console.error('Failure:', err.message);
    }

    // 4. Test Expiry
    const oldIat = Math.floor(Date.now() / 1000) - 120; // 2 minutes ago
    const expiredToken = jwt.sign(
        { type: 'attendance_qr', iat: oldIat },
        QR_SECRET,
        { expiresIn: '60s' } // Expired 1 minute ago
    );
    try {
        jwt.verify(expiredToken, QR_SECRET);
        console.error('Failure: Expired token was accepted!');
    } catch (err) {
        console.log('Success: Expired token was correctly rejected:', err.message);
    }

    console.log('--- TEST COMPLETED ---');
};

testQRLogic();
