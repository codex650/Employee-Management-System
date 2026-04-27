const express = require('express');
const {
    uploadDocument,
    getMyDocuments,
    getAllDocuments,
    downloadDocument,
    deleteDocument
} = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { validateDocumentUpload } = require('../middleware/validateDocument');

const router = express.Router();

/**
 * @swagger
 * /api/documents/upload:
 *   post:
 *     summary: Upload a document for an employee
 *     tags: [Documents]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, category, title]
 *             properties:
 *               file: { type: string, format: binary }
 *               category: { type: string, enum: [contract, id_proof, offer_letter, performance_review, leave_document, certificate, other] }
 *               title: { type: string }
 *               description: { type: string }
 *               employeeId: { type: string, description: "Required for managers" }
 *     responses:
 *       201:
 *         description: Document uploaded
 */
router.post('/upload', protect, upload.single('file'), validateDocumentUpload, uploadDocument);

/**
 * @swagger
 * /api/documents/my-documents:
 *   get:
 *     summary: Get all documents for the logged-in employee
 *     tags: [Documents]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of own documents
 */
router.get('/my-documents', protect, getMyDocuments);

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Get all documents (Manager only)
 *     tags: [Documents]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of documents
 */
router.get('/', protect, authorize('manager'), getAllDocuments);

/**
 * @swagger
 * /api/documents/{id}/download:
 *   get:
 *     summary: Download a specific document
 *     tags: [Documents]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: File stream
 */
router.get('/:id/download', protect, downloadDocument);

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     summary: Delete a document (Manager only)
 *     tags: [Documents]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Document deleted
 */
router.delete('/:id', protect, authorize('manager'), deleteDocument);

module.exports = router;
