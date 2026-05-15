const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LeaveSchema = new Schema({
    applicantID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    applicantName: { type: String, required: true },   // 👈 Added
    applicantEmail: { type: String, required: true },  // 👈 Added
    title: { type: String, required: true },
    type: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    appliedDate: { type: String, required: true },
    period: { type: Number, required: true, min: 1, max: 60 },
    reason: { type: String, required: true },
    adminResponse: { type: String, default: 'Pending' }, // default matches controller
});

module.exports = mongoose.model('Leave', LeaveSchema);
