const express = require('express');
const {
    getDesignations,
    createDesignation,
    updateDesignation,
    deleteDesignation
} = require('../controllers/designationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', protect, getDesignations);
router.post('/', protect, authorize('manager'), createDesignation);
router.put('/:id', protect, authorize('manager'), updateDesignation);
router.delete('/:id', protect, authorize('manager'), deleteDesignation);

module.exports = router;
