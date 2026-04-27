const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');
const User = require('../models/User');
const { sendAttendanceEmail, sendLeaveEmail } = require('../utils/emailService');

class NotificationService {
  
  /**
   * Send notification to a specific user
   */
  static async notify(userId, data) {
    try {
      // 1. Save In-App Notification (if enabled)
      const prefs = await NotificationPreference.findOne({ userId });
      const inAppEnabled = !prefs || (prefs.inAppNotifications && prefs.inAppNotifications[data.type] !== false);
      
      if (inAppEnabled) {
        await Notification.create({
          userId,
          ...data
        });
      }

      // 2. Send Email (if enabled and requested)
      const emailEnabled = prefs && prefs.emailNotifications && prefs.emailNotifications[data.emailTrigger];
      if (emailEnabled && data.emailData) {
        const user = await User.findById(userId);
        if (user && user.email) {
          if (data.type === 'attendance') {
            await sendAttendanceEmail(user.email, data.emailData);
          } else if (data.type === 'leave') {
            await sendLeaveEmail(user.email, data.emailData);
          }
        }
      }
    } catch (error) {
      console.error('Notification failed:', error);
    }
  }

  /**
   * Notify all managers
   */
  static async notifyManagers(data) {
    const managers = await User.find({ role: 'manager' });
    for (const manager of managers) {
      await this.notify(manager._id, data);
    }
  }
}

module.exports = NotificationService;
