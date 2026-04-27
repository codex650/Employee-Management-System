const express = require('express');
const {
    getDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment
} = require('../controllers/departmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

/**
 * @swagger
 * tags:
 *   name: Departments
 *   description: Organization department management
 */

/**
 * @swagger
 * /api/departments:
 *   get:
 *     summary: Get all departments
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all departments
 */
router.get('/', protect, getDepartments);

/**
 * @swagger
 * /api/departments:
 *   post:
 *     summary: Create a new department (Manager only)
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Department created
 */
router.post('/', protect, authorize('manager'), createDepartment);

/**
 * @swagger
 * /api/departments/{id}:
 *   put:
 *     summary: Update a department (Manager only)
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               active: { type: boolean }
 *     responses:
 *       200:
 *         description: Department updated
 */
router.put('/:id', protect, authorize('manager'), updateDepartment);

/**
 * @swagger
 * /api/departments/{id}:
 *   delete:
 *     summary: Soft-delete a department (Manager only)
 *     description: Sets the department to inactive.
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Department deactivated
 */
router.delete('/:id', protect, authorize('manager'), deleteDepartment);

module.exports = router;
