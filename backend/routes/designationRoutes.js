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

/**
 * @swagger
 * tags:
 *   name: Designations
 *   description: Organization job titles and roles
 */

/**
 * @swagger
 * /api/designations:
 *   get:
 *     summary: Get all designations
 *     tags: [Designations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all designations
 */
router.get('/', protect, getDesignations);

/**
 * @swagger
 * /api/designations:
 *   post:
 *     summary: Create a new designation (Manager only)
 *     tags: [Designations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, departmentId]
 *             properties:
 *               name: { type: string }
 *               departmentId: { type: string, description: "ID of the parent department" }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Designation created
 */
router.post('/', protect, authorize('manager'), createDesignation);

/**
 * @swagger
 * /api/designations/{id}:
 *   put:
 *     summary: Update a designation (Manager only)
 *     tags: [Designations]
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
 *               departmentId: { type: string }
 *               description: { type: string }
 *               active: { type: boolean }
 *     responses:
 *       200:
 *         description: Designation updated
 */
router.put('/:id', protect, authorize('manager'), updateDesignation);

/**
 * @swagger
 * /api/designations/{id}:
 *   delete:
 *     summary: Soft-delete a designation (Manager only)
 *     tags: [Designations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Designation deactivated
 */
router.delete('/:id', protect, authorize('manager'), deleteDesignation);

module.exports = router;
