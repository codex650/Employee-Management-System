const mongoose = require('mongoose');

const bonusSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    enum: ['performance', 'festival', 'other'],
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  payrollMonth: Number,
  payrollYear: Number,
  status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Bonus', bonusSchema);
