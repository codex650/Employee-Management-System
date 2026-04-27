const mongoose = require('mongoose');

const notificationPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  emailNotifications: {
    clockIn: { type: Boolean, default: false },
    clockOut: { type: Boolean, default: false },
    lateArrival: { type: Boolean, default: true },
    leaveRequest: { type: Boolean, default: true },
    leaveStatusChange: { type: Boolean, default: true },
    salaryUpdate: { type: Boolean, default: true },
    documentExpired: { type: Boolean, default: true }
  },
  inAppNotifications: {
    attendance: { type: Boolean, default: true },
    leave: { type: Boolean, default: true },
    salary: { type: Boolean, default: true },
    document: { type: Boolean, default: true },
    system: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('NotificationPreference', notificationPreferenceSchema);
