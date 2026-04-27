module.exports = {
  WORK_START_TIME: 9,      // 9:00 AM
  WORK_END_TIME: 17,       // 5:00 PM
  WORK_HOURS_PER_DAY: 8,
  LATE_THRESHOLD_MINUTES: 0,  // Any minutes after 9 AM is late
  AUTO_CLOCKOUT_HOUR: 23,     // 11:00 PM auto clockout
  HOLIDAYS: [
    // List of public holidays (YYYY-MM-DD)
    '2024-01-01',  // New Year
    '2024-12-25'   // Christmas
  ],
  QR_EXPIRY_SECONDS: 60
};
