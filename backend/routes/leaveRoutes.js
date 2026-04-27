const express = require('express');
const {
    requestLeave,
    getMyRequests,
    getMyBalance,
    getPendingRequests,
    approveLeave,
    rejectLeave,
    cancelLeave
} = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateLeaveRequest, validateDecision } = require('../middleware/validateLeave');

const router = express.Router();

/**
 * @swagger
 * /api/leaves/request:
 *   post:
 *     summary: Submit a new leave request
 *     tags: [Leaves]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [leaveType, startDate, endDate, reason]
 *             properties:
 *               leaveType: { type: string, enum: [vacation, sick, personal, unpaid] }
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date }
 *               reason: { type: string }
 *               halfDay: { type: boolean }
 *               halfDaySession: { type: string, enum: [morning, afternoon] }
 *     responses:
 *       201:
 *         description: Request submitted
 */
router.post('/request', protect, validateLeaveRequest, requestLeave);

/**
 * @swagger
 * /api/leaves/my-requests:
 *   get:
 *     summary: Get all leave requests submitted by current user
 *     tags: [Leaves]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of requests
 */
router.get('/my-requests', protect, getMyRequests);

/**
 * @swagger
 * /api/leaves/balance:
 *   get:
 *     summary: Get current available leave balances
 *     tags: [Leaves]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Balance details
 */
router.get('/balance', protect, getMyBalance);

/**
 * @swagger
 * /api/leaves/pending:
 *   get:
 *     summary: Get all pending leave requests (Manager only)
 *     tags: [Leaves]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of pending requests
 */
router.get('/pending', protect, authorize('manager'), getPendingRequests);

/**
 * @swagger
 * /api/leaves/{id}/approve:
 *   put:
 *     summary: Approve a leave request (Manager only)
 *     tags: [Leaves]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Leave approved
 */
router.put('/:id/approve', protect, authorize('manager'), approveLeave);

/**
 * @swagger
 * /api/leaves/{id}/reject:
 *   put:
 *     summary: Reject a leave request (Manager only)
 *     tags: [Leaves]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Leave rejected
 */
router.put('/:id/reject', protect, authorize('manager'), validateDecision, rejectLeave);

/**
 * @swagger
 * /api/leaves/{id}/cancel:
 *   put:
 *     summary: Cancel a pending leave request
 *     tags: [Leaves]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Request cancelled
 */
router.put('/:id/cancel', protect, cancelLeave);

module.exports = router;
