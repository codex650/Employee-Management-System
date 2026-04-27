const express = require('express');
const { 
    getNotifications, 
    markAsRead, 
    markAllAsRead, 
    getPreferences, 
    updatePreferences 
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user's notifications
 *     tags: [Notifications]
 */
router.get('/', getNotifications);

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 */
router.put('/read-all', markAllAsRead);

/**
 * @swagger
 * /api/notifications/preferences:
 *   get:
 *     summary: Get notification preferences
 *     tags: [Notifications]
 *   put:
 *     summary: Update notification preferences
 *     tags: [Notifications]
 */
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark single notification as read
 *     tags: [Notifications]
 */
router.put('/:id/read', markAsRead);

module.exports = router;
