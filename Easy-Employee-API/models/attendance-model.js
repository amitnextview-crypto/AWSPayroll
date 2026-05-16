const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AttendanceSchema = new Schema({
  employeeID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  date: { type: Number, required: true },
  day: { type: String, required: true },
  present: { type: Boolean, default: false },
  attendanceIn: { type: String },
  attendanceOut: { type: String },
  late: { type: String },
  totalHours: { type: String },
  timeStatus: { type: String },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Half Day', 'Leave', 'Approved Leave'],
    default: 'Absent'
  },
  correctionReason: { type: String, trim: true },
  checkInLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    accuracy: { type: Number },
    distanceMeters: { type: Number }
  },
  checkOutLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    accuracy: { type: Number },
    distanceMeters: { type: Number }
  }
});

module.exports = mongoose.model('Attendance', AttendanceSchema);
