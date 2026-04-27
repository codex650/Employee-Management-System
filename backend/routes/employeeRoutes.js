const express = require('express');
const {
    getAllEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getDepartmentsList
} = require('../controllers/employeeController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateCreateEmployee, validateUpdateEmployee } = require('../middleware/validateEmployee');

const router = express.Router();

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: List all employees with search, filters, and pagination
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name or email
 *       - in: query
 *         name: department
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive] }
 *     responses:
 *       200:
 *         description: List of employees retrieved successfully
 */
router.route('/')
    .get(protect, authorize('manager'), getAllEmployees)
    /**
     * @swagger
     * /api/employees:
     *   post:
     *     summary: Create a new employee record
     *     tags: [Employees]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [firstName, lastName, email, department, position]
     *             properties:
     *               firstName: { type: string }
     *               lastName: { type: string }
     *               email: { type: string }
     *               phone: { type: string }
     *               department: { type: string }
     *               position: { type: string }
     *               hireDate: { type: string, format: date }
     *               salary: { type: number }
     *     responses:
     *       201:
     *         description: Employee created successfully
     */
    .post(protect, authorize('manager'), validateCreateEmployee, createEmployee);

/**
 * @swagger
 * /api/employees/departments/list:
 *   get:
 *     summary: Get list of all unique departments
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of departments retrieved
 */
router.route('/departments/list')
    .get(protect, authorize('manager'), getDepartmentsList);

/**
 * @swagger
 * /api/employees/{id}:
 *   get:
 *     summary: Get a single employee record
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Employee data retrieved
 *       403:
 *         description: Not authorized to view this record
 *       404:
 *         description: Employee not found
 */
router.route('/:id')
    .get(protect, getEmployeeById)
    /**
     * @swagger
     * /api/employees/{id}:
     *   put:
     *     summary: Update an employee record
     *     tags: [Employees]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: string }
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               firstName: { type: string }
     *               lastName: { type: string }
     *               email: { type: string }
     *               phone: { type: string }
     *               department: { type: string }
     *               position: { type: string }
     *               hireDate: { type: string, format: date }
     *               salary: { type: number }
     *               status: { type: string, enum: [active, inactive] }
     *     responses:
     *       200:
     *         description: Employee updated
     */
    .put(protect, authorize('manager'), validateUpdateEmployee, updateEmployee)
    /**
     * @swagger
     * /api/employees/{id}:
     *   delete:
     *     summary: Deactivate an employee record (Soft delete)
     *     tags: [Employees]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: string }
     *     responses:
     *       200:
     *         description: Employee deactivated
     */
    .delete(protect, authorize('manager'), deleteEmployee);

module.exports = router;
