const mongoose = require('mongoose');

const CompanySettingSchema = new mongoose.Schema(
  {
    supportEmail: {
      type: String,
      trim: true,
      default: 'amitwebsolutioncompany@gmail.com',
    },
    supportPhone: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('CompanySetting', CompanySettingSchema);
