const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    unique: true
  },
  basic: {
    type: Number,
    required: true,
    min: 0
  },
  allowances: {
    house: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    medical: { type: Number, default: 0 },
    other: [{
      name: String,
      amount: Number
    }]
  },
  total: {
    type: Number,
    required: true
  },
  effectiveFrom: {
    type: Date,
    required: true,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Calculate total before save
salarySchema.pre('validate', function(next) {
  let totalAllowances = this.allowances.house + this.allowances.transport + this.allowances.medical;
  if (this.allowances.other) {
    totalAllowances += this.allowances.other.reduce((acc, curr) => acc + curr.amount, 0);
  }
  this.total = this.basic + totalAllowances;
  next();
});

module.exports = mongoose.model('Salary', salarySchema);
