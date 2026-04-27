module.exports = {
  // Default annual leave entitlements
  DEFAULT_LEAVE_ENTITLEMENTS: {
    vacation: 15,
    sick: 10,
    personal: 3,
    unpaid: null  // null means unlimited
  },
  
  // Maximum consecutive days allowed without special approval
  MAX_CONSECUTIVE_DAYS: 20,
  
  // Minimum notice period (days before start date)
  MIN_NOTICE_DAYS: 0,
  
  // Allow half-day leaves
  ALLOW_HALF_DAYS: true,
  
  // Weekend configuration (true means they don't count as leave days)
  EXCLUDE_WEEKENDS: true,
  
  // Carryover settings
  CARRYOVER: {
    enabled: true,
    maxCarryoverDays: 10,
    expiryMonths: 3
  }
};
