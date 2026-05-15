// utils/salary-config.js
module.exports = {
  PF_EMPLOYEE_DEFAULT: 12,
  PF_EMPLOYER_DEFAULT: 12,
  ESI_EMPLOYEE_DEFAULT: 0,
  ESI_EMPLOYER_DEFAULT: 0,
  PROFESSIONAL_TAX_MAX: 200,
  TDS_SLABS: [
    { upto: 250000, rate: 0 },
    { upto: 500000, rate: 0.05 },
    { upto: 1000000, rate: 0.2 },
    { upto: Infinity, rate: 0.3 }
  ]
};
