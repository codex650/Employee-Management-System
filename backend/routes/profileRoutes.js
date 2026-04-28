const express = require('express');
const {
    getProfile,
    updateProfile,
    updatePassword,
    uploadAvatar
} = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get logged-in user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data
 */
router.get('/', protect, getProfile);

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Update profile details
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone: { type: string }
 *               paymentMethod: { type: string }
 *               bankDetails: { type: object }
 *               emergencyContacts: { type: array }
 *               preferences: { type: object }
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/', protect, updateProfile);

/**
 * @swagger
 * /api/profile/password:
 *   put:
 *     summary: Change user password
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200:
 *         description: Password updated
 */
router.put('/password', protect, updatePassword);

/**
 * @swagger
 * /api/profile/avatar:
 *   post:
 *     summary: Upload avatar
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar updated
 */
router.post('/avatar', protect, upload.single('image'), uploadAvatar);

module.exports = router;
