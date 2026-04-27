const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  period: {
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    startDate: Date,
    endDate: Date
  },
  status: {
    type: String,
    enum: ['draft', 'paid', 'cancelled'],
    default: 'draft'
  },
  items: [{
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    basic: Number,
    allowances: Number,
    deductions: {
      unpaidLeave: { type: Number, default: 0 },
      lateFines: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    bonus: { type: Number, default: 0 },
    netSalary: { type: Number, required: true }
  }],
  summary: {
    totalEmployees: Number,
    totalNetSalary: Number
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paidAt: Date,
  transactionReference: String
}, {
  timestamps: true
});

payrollSchema.index({ 'period.month': 1, 'period.year': 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);
