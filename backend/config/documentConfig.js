const path = require('path');

module.exports = {
  UPLOAD_DIR: path.join(__dirname, '../uploads'),
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  CATEGORIES: ['contract', 'id_proof', 'offer_letter', 'performance_review', 'leave_document', 'certificate', 'other']
};
