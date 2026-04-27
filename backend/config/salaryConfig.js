module.exports = {
  currency: 'USD',
  
  PAYROLL_DEDUCTION_RULES: {
    lateArrival: {
      enabled: true,
      graceMinutes: 15,
      deductionPerMinute: 0.5, // $0.50 per minute
      maxDeductionPerDay: 10
    },
    unpaidLeave: {
      enabled: true,
      multiplier: 1 // 1x daily rate deduction
    }
  },
  
  ALLOWANCE_PERCENTAGES: {
    house: 20,      // 20% of basic
    transport: 5,   // 5% of basic
    medical: 3      // 3% of basic
  }
};
