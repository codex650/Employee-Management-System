const express = require('express');
const {
    updateEmployeeSalary,
    generatePayroll,
    getSalaryHistory,
    addBonus
} = require('../controllers/salaryController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateSalaryUpdate, validateBonus, validatePayrollGen } = require('../middleware/validateSalary');

const router = express.Router();

/**
 * @swagger
 * /api/salary/employees/{employeeId}:
 *   put:
 *     summary: Update an employee's core salary and allowances
 *     tags: [Salary]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [basic, reason]
 *             properties:
 *               basic: { type: number }
 *               reason: { type: string }
 *               allowances:
 *                 type: object
 *                 properties:
 *                   house: { type: number }
 *                   transport: { type: number }
 *                   medical: { type: number }
 *     responses:
 *       200:
 *         description: Salary updated
 */
router.put('/employees/:employeeId', protect, authorize('manager'), validateSalaryUpdate, updateEmployeeSalary);

/**
 * @swagger
 * /api/salary/payroll/generate:
 *   post:
 *     summary: Execute the payroll engine for a specific month
 *     tags: [Salary]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [month, year]
 *             properties:
 *               month: { type: integer, minimum: 1, maximum: 12 }
 *               year: { type: integer, minimum: 2000 }
 *     responses:
 *       201:
 *         description: Payroll generated success
 */
router.post('/payroll/generate', protect, authorize('manager'), validatePayrollGen, generatePayroll);

/**
 * @swagger
 * /api/salary/employees/{employeeId}/bonus:
 *   post:
 *     summary: Grant a one-time bonus to an employee
 *     tags: [Salary]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, reason]
 *             properties:
 *               amount: { type: number }
 *               type: { type: string, enum: [performance, festival, other] }
 *               reason: { type: string }
 *               payrollMonth: { type: integer }
 *               payrollYear: { type: integer }
 *     responses:
 *       201:
 *         description: Bonus approved
 */
router.post('/employees/:employeeId/bonus', protect, authorize('manager'), validateBonus, addBonus);

/**
 * @swagger
 * /api/salary/employees/{employeeId}/history:
 *   get:
 *     summary: View history of all salary changes for an employee
 *     tags: [Salary]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *     responses:
 *       200:
 *         description: Audit log retrieved
 */
router.get('/employees/:employeeId/history', protect, authorize('manager'), getSalaryHistory);

module.exports = router;
