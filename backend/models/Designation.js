const mongoose = require('mongoose');

const designationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Designation name is required'],
        trim: true
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: [true, 'Department is required']
    },
    description: {
        type: String,
        trim: true
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Designation', designationSchema);
