const mongoose = require('mongoose');

const salaryHistorySchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  basic: Number,
  allowances: {
    house: Number,
    transport: Number,
    medical: Number
  },
  total: Number,
  reason: String,
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  changedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SalaryHistory', salaryHistorySchema);
