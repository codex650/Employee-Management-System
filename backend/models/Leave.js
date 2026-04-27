const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  leaveType: {
    type: String,
    enum: ['vacation', 'sick', 'personal', 'unpaid'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  daysRequested: {
    type: Number,
    required: true,
    min: 0.5
  },
  halfDay: {
    type: Boolean,
    default: false
  },
  halfDaySession: {
    type: String,
    enum: ['morning', 'afternoon', null],
    default: null
  },
  reason: {
    type: String,
    required: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    maxlength: 500,
    default: null
  },
  notes: {
    type: String,
    maxlength: 500,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
leaveSchema.index({ employeeId: 1, startDate: 1, status: 1 });
leaveSchema.index({ status: 1, startDate: 1 });

module.exports = mongoose.model('Leave', leaveSchema);
