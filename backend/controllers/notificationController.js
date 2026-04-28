const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, type, read } = req.query;
        const query = { userId: req.user._id };

        if (type) query.type = type;
        if (read !== undefined) query.read = read === 'true';

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Notification.countDocuments(query);
        const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });

        res.json({
            success: true,
            count: notifications.length,
            unreadCount,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit),
                total
            },
            notifications
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { read: true, readAt: Date.now() },
            { returnDocument: 'after' }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ success: true, message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark all as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user._id, read: false },
            { read: true, readAt: Date.now() }
        );
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get/Update notification preferences
// @route   GET/PUT /api/notifications/preferences
// @access  Private
const getPreferences = async (req, res) => {
    try {
        let prefs = await NotificationPreference.findOne({ userId: req.user._id });
        if (!prefs) {
            prefs = await NotificationPreference.create({ userId: req.user._id });
        }
        res.json({ success: true, preferences: prefs });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updatePreferences = async (req, res) => {
    try {
        const { emailNotifications, inAppNotifications } = req.body;
        const prefs = await NotificationPreference.findOneAndUpdate(
            { userId: req.user._id },
            { 
                $set: { 
                    ...(emailNotifications && { emailNotifications }),
                    ...(inAppNotifications && { inAppNotifications })
                } 
            },
            { returnDocument: 'after', upsert: true }
        );
        res.json({ success: true, message: 'Preferences updated', preferences: prefs });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    getPreferences,
    updatePreferences
};
