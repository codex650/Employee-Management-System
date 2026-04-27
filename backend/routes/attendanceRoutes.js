const express = require('express');
const {
    clockIn,
    clockOut,
    getMyHistory,
    getMyTodayStatus,
    getAllAttendance,
    updateAttendance,
    getSummaryReport,
    generateQRToken
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateClockIn, validateClockOut, validateAttendanceUpdate } = require('../middleware/validateAttendance');

const router = express.Router();

/**
 * @swagger
 * /api/attendance/clock-in:
 *   post:
 *     summary: Employee clock-in for the day
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Clocked in successfully
 *       400:
 *         description: Already clocked in or holiday
 */
router.post('/clock-in', protect, validateClockIn, clockIn);

/**
 * @swagger
 * /api/attendance/clock-out:
 *   post:
 *     summary: Employee clock-out for the day
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Clocked out successfully
 */
router.post('/clock-out', protect, validateClockOut, clockOut);

/**
 * @swagger
 * /api/attendance/my-history:
 *   get:
 *     summary: Get employee's own attendance history with summary
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Attendance history retrieved
 */
router.get('/my-history', protect, getMyHistory);

/**
 * @swagger
 * /api/attendance/my-today:
 *   get:
 *     summary: Get today's attendance status for current employee
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's status retrieved
 */
router.get('/my-today', protect, getMyTodayStatus);

/**
 * @swagger
 * /api/attendance/all:
 *   get:
 *     summary: Get all employees' attendance (Manager only)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [present, late, absent] }
 *     responses:
 *       200:
 *         description: Attendance records retrieved
 */
router.get('/all', protect, authorize('manager'), getAllAttendance);

/**
 * @swagger
 * /api/attendance/report/summary:
 *   get:
 *     summary: Get aggregated attendance reports (Manager only)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema: { type: string }
 *         description: YYYY-MM
 *     responses:
 *       200:
 *         description: Summary report generated
 */
router.get('/report/summary', protect, authorize('manager'), getSummaryReport);

/**
 * @swagger
 * /api/attendance/{attendanceId}:
 *   put:
 *     summary: Update attendance record (Manager only)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attendanceId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clockIn: { type: string, format: date-time }
 *               clockOut: { type: string, format: date-time }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Record updated successfully
 */
router.put('/:attendanceId', protect, authorize('manager'), validateAttendanceUpdate, updateAttendance);

/**
 * @swagger
 * /api/attendance/qr-token-generator:
 *   get:
 *     summary: Generate a dynamic QR token for office kiosk (Manager only)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: QR token generated
 */
router.get('/qr-token-generator', protect, authorize('manager'), generateQRToken);

module.exports = router;
