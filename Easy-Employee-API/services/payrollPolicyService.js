const PayrollPolicyModel = require('../models/payroll-policy-model');

const defaultPolicies = [
  {
    title: 'Master Salary Rule',
    category: 'Master Salary Rule',
    sortOrder: 0,
    isDefault: true,
    description: 'Controls monthly employee and leader salary calculation from attendance, approved leave, weekly off, and paid holidays.',
    rules: [
      ['Fixed Paid Days', '26'],
      ['Salary Cycle Start Day', '1'],
      ['Salary Cycle End Day', '31'],
      ['Weekly Off Days', 'Sunday'],
      ['Approved Leave Paid', 'Yes'],
      ['Paid Holiday Dates', '2026-01-26, 2026-08-15, 2026-10-02'],
      ['Paid Holiday Names', 'Republic Day, Independence Day, Gandhi Jayanti, Diwali, Holi, Makar Sankranti'],
      ['Minimum Full Day Hours', '7'],
      ['Half Day Pay Value', '0.5'],
      ['Absent Pay Value', '0'],
      ['Expense Reimbursement Paid', 'Yes'],
    ],
  },
  {
    title: 'Attendance Policy',
    category: 'Attendance',
    sortOrder: 1,
    isDefault: true,
    rules: [
      ['Office Start Time', '10:30 AM'],
      ['Office End Time', '07:30 PM'],
      ['Total Working Hours', '9 Hours'],
      ['Break Time', '1 Hour'],
      ['Weekly Off', 'Sunday'],
      ['2nd & 4th Saturday', 'Half Day / Optional Off'],
      ['Late Mark After', '10:45 AM'],
      ['Grace Time Allowed', '15 Minutes'],
      ['Monthly Allowed Late Marks', '3'],
      ['Late Deduction Rule', '3 Late Marks = 1 Half Day Deduction'],
      ['Half Day Rule', 'Login After 01:00 PM = Half Day'],
      ['Absent Rule', 'No attendance without approval = Absent'],
      ['Work From Home', 'Only with manager approval'],
      ['Attendance Correction Request', 'Allowed within 2 days only'],
    ],
  },
  {
    title: 'Leave Policy',
    category: 'Leave',
    sortOrder: 2,
    isDefault: true,
    rules: [
      ['Casual Leave (CL)', '12 per year'],
      ['Sick Leave (SL)', '12 per year'],
      ['Privilege Leave (PL)', '15 per year'],
      ['Earned Leave', 'Included in PL'],
      ['Emergency Leave', '3 per year'],
      ['Maternity Leave', '26 weeks'],
      ['Paternity Leave', '7 days'],
      ['Unpaid Leave (LWP)', 'Unlimited with approval'],
      ['Leave Carry Forward', 'Maximum 10 leaves'],
      ['Leave Encashment', 'Allowed only for Privilege Leave'],
      ['Leave Approval', 'Leader -> HR -> Admin'],
      ['Leave Apply Before', 'Minimum 1 day before'],
      ['Emergency Leave', 'Can apply same day'],
    ],
  },
  {
    title: 'Salary Cycle Policy',
    category: 'Payroll',
    sortOrder: 3,
    isDefault: true,
    rules: [
      ['Office Open Days In Month', '26'],
      ['Salary Cycle Start Day', '1'],
      ['Salary Cycle End Day', '31'],
      ['Half Time Minimum Hours', '7'],
      ['Approved Leave Attendance', 'Full Time'],
      ['Sunday Auto Paid When Open Days Above', '26'],
    ],
  },
  {
    title: 'Salary & Payroll Policy',
    category: 'Payroll',
    sortOrder: 4,
    isDefault: true,
    rules: [
      ['Payroll Cycle', '1st to Last Day of Month'],
      ['Salary Credit Date', 'Every Month 5th'],
      ['Salary Hold', 'Allowed for incomplete documents'],
      ['Salary Revision', 'Once per year'],
      ['Advance Salary', 'Allowed once in 6 months'],
      ['Final Settlement', 'Within 30 days after exit'],
      ['Notice Period Salary Recovery', 'Applicable if notice period not served'],
    ],
  },
  {
    title: 'Overtime Policy',
    category: 'Overtime',
    sortOrder: 5,
    isDefault: true,
    rules: [
      ['Minimum Overtime', '2 Hours'],
      ['Overtime Rate', 'Per Hour Basic Salary Calculation'],
      ['Weekend Overtime', '1.5X Rate'],
      ['Holiday Overtime', '2X Rate'],
      ['Approval Required', 'Yes (Leader + HR)'],
    ],
  },
  {
    title: 'Late Mark & Deduction Policy',
    category: 'Attendance',
    sortOrder: 6,
    isDefault: true,
    rules: [
      ['Allowed Late Marks', '3 per month'],
      ['After 3 Late Marks', '1 Half Day Deduction'],
      ['After 6 Late Marks', '1 Full Day Deduction'],
      ['Repeated Late', 'Warning + HR escalation'],
    ],
  },
  {
    title: 'Holiday Policy',
    category: 'Holiday',
    sortOrder: 7,
    isDefault: true,
    rules: [
      ['National Holidays', '26 January, 15 August, 2 October'],
      ['Festival Holidays', 'Diwali, Holi, Eid al-Fitr, Christmas'],
      ['Total Paid Holidays', '12 to 15 per year'],
      ['Weekly Off', 'Sunday'],
      ['Optional Holidays', '2 per year'],
    ],
  },
  {
    title: 'Tax & Statutory Deduction Policy',
    category: 'Tax',
    sortOrder: 8,
    isDefault: true,
    rules: [
      ['PF Deduction', '12% Employee + 12% Employer'],
      ['ESIC', 'Applicable below salary threshold'],
      ['Professional Tax', 'As per state government rules'],
      ['TDS', 'As per income tax slab'],
      ['Bonus Tax', 'Applicable as per law'],
      ['Reimbursement Tax', 'Depends on category'],
    ],
  },
  {
    title: 'Bonus & Incentive Policy',
    category: 'Bonus',
    sortOrder: 9,
    isDefault: true,
    rules: [
      ['Performance Bonus', 'Yearly based on performance'],
      ['Festival Bonus', 'Diwali bonus applicable'],
      ['Attendance Bonus', 'For zero absent employees'],
      ['Sales Incentive', 'Role-based'],
      ['Referral Bonus', 'Applicable after probation completion'],
    ],
  },
  {
    title: 'Reimbursement Policy',
    category: 'Reimbursement',
    sortOrder: 10,
    isDefault: true,
    rules: [
      ['Travel Reimbursement', 'Actual bills required'],
      ['Food Reimbursement', 'Manager approval required'],
      ['Internet Reimbursement', 'WFH employees only'],
      ['Medical Reimbursement', 'As per company rules'],
      ['Approval Flow', 'Leader -> HR -> Finance'],
    ],
  },
  {
    title: 'Exit Policy',
    category: 'Exit',
    sortOrder: 11,
    isDefault: true,
    rules: [
      ['Notice Period', '30 Days'],
      ['Manager Level', '60 Days'],
      ['Final Settlement', 'Within 30 Days'],
      ['Experience Letter', 'After clearance completion'],
      ['Full & Final', 'Mandatory'],
      ['Exit Interview', 'Required'],
    ],
  },
  {
    title: 'Probation Policy',
    category: 'Probation',
    sortOrder: 12,
    isDefault: true,
    rules: [
      ['Probation Period', '6 Months'],
      ['Confirmation', 'Based on performance review'],
      ['Salary Revision', 'After confirmation only'],
      ['Probation Extension', 'Maximum 3 months'],
    ],
  },
  {
    title: 'Team & Reporting Policy',
    category: 'Team',
    sortOrder: 13,
    isDefault: true,
    rules: [
      ['Every Employee', 'Must belong to one team'],
      ['One Team', 'One Leader mandatory'],
      ['Reporting Manager', 'Team Leader'],
      ['Escalation', 'Leader -> HR -> Admin'],
    ],
  },
  {
    title: 'Security Policy',
    category: 'Security',
    sortOrder: 14,
    isDefault: true,
    rules: [
      ['Password Change', 'Every 90 Days'],
      ['Minimum Password Length', '8 Characters'],
      ['Login Attempt Limit', '5 Attempts'],
      ['Account Lock', '30 Minutes after failed attempts'],
      ['Device Restriction', 'Optional'],
      ['Admin Access', 'Role-based only'],
      ['Sub Admin Access', 'Limited permissions'],
    ],
  },
].map(policy => ({
  ...policy,
  rules: policy.rules.map(([label, value]) => ({ label, value })),
  status: 'active',
}));

class PayrollPolicyService {
  ensureDefaults = async () => {
    const masterPolicy = defaultPolicies[0];
    await PayrollPolicyModel.updateOne(
      { title: masterPolicy.title, category: masterPolicy.category, isDefault: true },
      { $setOnInsert: masterPolicy },
      { upsert: true },
    );
    await PayrollPolicyModel.deleteMany(
      {
        isDefault: true,
        title: {
          $in: defaultPolicies.slice(1).map(policy => policy.title),
        },
      },
    );
  };

  getAll = async (query = {}) => {
    await this.ensureDefaults();
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.category) filter.category = new RegExp(String(query.category).trim(), 'i');
    if (query.search) {
      const search = new RegExp(String(query.search).trim(), 'i');
      filter.$or = [
        { title: search },
        { category: search },
        { description: search },
        { 'rules.label': search },
        { 'rules.value': search },
      ];
    }
    return await PayrollPolicyModel.find(filter).sort({ sortOrder: 1, createdAt: -1 });
  };

  createPolicy = async (data) => PayrollPolicyModel.create(data);

  updatePolicy = async (id, data) => PayrollPolicyModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });

  deletePolicy = async (id) => PayrollPolicyModel.findByIdAndDelete(id);
}

module.exports = new PayrollPolicyService();
