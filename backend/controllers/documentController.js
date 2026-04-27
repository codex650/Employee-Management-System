const Document = require('../models/Document');
const Employee = require('../models/Employee');
const fs = require('fs');
const path = require('path');

// @desc    Upload document
// @route   POST /api/documents/upload
// @access  Private
const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const { category, title, description, employeeId } = req.body;
        
        // Default to logged-in user's employee ID if not provided (for self-upload)
        const targetEmployeeId = req.user.role === 'manager' ? employeeId : req.user.employeeId;

        if (!targetEmployeeId) {
            return res.status(400).json({ success: false, message: 'Invalid target employee' });
        }

        const document = await Document.create({
            employeeId: targetEmployeeId,
            category,
            title,
            description,
            fileName: req.file.filename,
            originalName: req.file.originalname,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            filePath: req.file.path,
            uploadedBy: req.user._id
        });

        res.status(201).json({
            success: true,
            message: 'Document uploaded successfully',
            document
        });

    } catch (error) {
        // Cleanup uploaded file if DB save fails
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get my documents
// @route   GET /api/documents/my-documents
// @access  Private
const getMyDocuments = async (req, res) => {
    try {
        const { category, page = 1, limit = 20 } = req.query;
        const query = { employeeId: req.user.employeeId };
        if (category) query.category = category;

        const documents = await Document.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Document.countDocuments(query);

        res.status(200).json({
            success: true,
            pagination: { page: parseInt(page), limit: parseInt(limit), total },
            documents
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all documents (Manager)
// @route   GET /api/documents
// @access  Private/Manager
const getAllDocuments = async (req, res) => {
    try {
        const { employeeId, category, page = 1, limit = 20 } = req.query;
        const query = {};
        if (employeeId) query.employeeId = employeeId;
        if (category) query.category = category;

        const documents = await Document.find(query)
            .populate('employeeId', 'firstName lastName department')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Document.countDocuments(query);

        res.status(200).json({
            success: true,
            pagination: { page: parseInt(page), limit: parseInt(limit), total },
            documents
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Download document
// @route   GET /api/documents/:id/download
// @access  Private (Owner or Manager)
const downloadDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        // Authorization check
        const isOwner = document.employeeId.toString() === req.user.employeeId?.toString();
        const isManager = req.user.role === 'manager';

        if (!isOwner && !isManager) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        if (!fs.existsSync(document.filePath)) {
            return res.status(404).json({ success: false, message: 'Physical file missing from server' });
        }

        document.downloadCount += 1;
        await document.save();

        res.download(document.filePath, document.originalName);

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete document (Manager)
// @route   DELETE /api/documents/:id
// @access  Private/Manager
const deleteDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        // Remove from disk
        if (fs.existsSync(document.filePath)) {
            fs.unlinkSync(document.filePath);
        }

        await Document.findByIdAndDelete(req.params.id);

        res.status(200).json({ success: true, message: 'Document deleted successfully' });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    uploadDocument,
    getMyDocuments,
    getAllDocuments,
    downloadDocument,
    deleteDocument
};
