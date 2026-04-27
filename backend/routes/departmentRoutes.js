const express = require('express');
const {
    getDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment
} = require('../controllers/departmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', protect, getDepartments);
router.post('/', protect, authorize('manager'), createDepartment);
router.put('/:id', protect, authorize('manager'), updateDepartment);
router.delete('/:id', protect, authorize('manager'), deleteDepartment);

module.exports = router;
