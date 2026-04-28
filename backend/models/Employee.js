const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    phone: {
        type: String
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    position: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Designation',
        required: true
    },
    hireDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    profileImage: {
        type: String,
        default: ""
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    salary: {
        type: Number,
        default: 0
    },
    bankDetails: {
        accountName: { type: String, default: "" },
        accountNumber: { type: String, default: "" },
        bankName: { type: String, default: "" },
        branchCode: { type: String, default: "" }
    },
    paymentMethod: {
        type: String,
        enum: ['bank_transfer', 'cash', 'check'],
        default: 'bank_transfer'
    },
    emergencyContacts: [{
        name: { type: String, required: true },
        relationship: { type: String, required: true },
        phone: { type: String, required: true }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Employee', employeeSchema);
