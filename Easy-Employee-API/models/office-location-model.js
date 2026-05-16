const mongoose = require('mongoose');

const OfficeLocationSchema = new mongoose.Schema(
  {
    officeName: {
      type: String,
      trim: true,
      required: true,
      default: 'Amit Web Solution Company',
    },
    latitude: {
      type: Number,
      required: true,
      default: 23.036245,
    },
    longitude: {
      type: Number,
      required: true,
      default: 72.513106,
    },
    radiusMeters: {
      type: Number,
      required: true,
      default: 100,
      min: 1,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('OfficeLocation', OfficeLocationSchema);
