const mongoose = require('mongoose');
const config = require('../config/leaveConfig');

const leaveBalanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  year: {
    type: Number,
    required: true,
    default: () => new Date().getFullYear()
  },
  balances: {
    vacation: {
      total: { type: Number, default: config.DEFAULT_LEAVE_ENTITLEMENTS.vacation },
      used: { type: Number, default: 0 },
      pending: { type: Number, default: 0 }
    },
    sick: {
      total: { type: Number, default: config.DEFAULT_LEAVE_ENTITLEMENTS.sick },
      used: { type: Number, default: 0 },
      pending: { type: Number, default: 0 }
    },
    personal: {
      total: { type: Number, default: config.DEFAULT_LEAVE_ENTITLEMENTS.personal },
      used: { type: Number, default: 0 },
      pending: { type: Number, default: 0 }
    },
    unpaid: {
      total: { type: Number, default: 0 }, // null or 0 means tracking only used
      used: { type: Number, default: 0 },
      pending: { type: Number, default: 0 }
    }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure employee only has one balance record per year
leaveBalanceSchema.index({ employeeId: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('LeaveBalance', leaveBalanceSchema);
