const User = require("../models/user-model");
const Attendance = require("../models/attendance-model");
const Leave = require("../models/leave-model");
const Expense = require("../models/expense-model");
const PayrollPolicy = require("../models/payroll-policy-model");
const UserSalaries = require("../models/user-salary");
const SalaryTaxRule = require("../models/salary-tax-rule-model");
const OfficeLocation = require("../models/office-location-model");
const CompanySetting = require("../models/company-setting-model");
const Team = require("../models/team-model");
const ErrorHandler = require('../utils/error-handler');
const userService = require('../services/user-service');
const UserDto = require('../dtos/user-dto');
const mongoose = require('mongoose');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const teamService = require('../services/team-service');
const attendanceService = require('../services/attendance-service');
const payrollPolicyService = require('../services/payrollPolicyService');

const toNumber = value => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const PF_AMOUNT_LIMIT = 1800;

const defaultSalaryTaxRules = [
  { label: 'Up to 4,00,000', fromAmount: 0, toAmount: 400000, ratePercent: 0, sortOrder: 1 },
  { label: '4,00,001 to 8,00,000', fromAmount: 400000, toAmount: 800000, ratePercent: 5, sortOrder: 2 },
  { label: '8,00,001 to 12,00,000', fromAmount: 800000, toAmount: 1200000, ratePercent: 10, sortOrder: 3 },
  { label: '12,00,001 to 16,00,000', fromAmount: 1200000, toAmount: 1600000, ratePercent: 15, sortOrder: 4 },
  { label: '16,00,001 to 20,00,000', fromAmount: 1600000, toAmount: 2000000, ratePercent: 20, sortOrder: 5 },
  { label: '20,00,001 to 24,00,000', fromAmount: 2000000, toAmount: 2400000, ratePercent: 25, sortOrder: 6 },
  { label: 'Above 24,00,000', fromAmount: 2400000, toAmount: null, ratePercent: 30, sortOrder: 7 },
];

const ensureDefaultSalaryTaxRules = async () => {
  await Promise.all(
    defaultSalaryTaxRules.map(rule =>
      SalaryTaxRule.updateOne(
        { label: rule.label, financialYear: 'FY 2025-26', regime: 'New Regime' },
        { $setOnInsert: { ...rule, financialYear: 'FY 2025-26', regime: 'New Regime', isDefault: true } },
        { upsert: true },
      ),
    ),
  );
};

const getDateParts = (date = new Date()) => ({
  year: date.getFullYear(),
  month: date.getMonth() + 1,
  date: date.getDate(),
});

const normalizeDateOnly = date => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const formatIsoDate = date =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const daysInMonth = (year, month) => new Date(year, month, 0).getDate();

const clampDayToMonth = (year, month, day) =>
  Math.min(Math.max(Number(day) || 1, 1), daysInMonth(year, month));

const dateRange = (start, end) => {
  const dates = [];
  const cursor = normalizeDateOnly(start);
  const last = normalizeDateOnly(end);
  while (cursor <= last) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

const monthYearPairsForRange = (start, end) => {
  const pairs = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= last) {
    pairs.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1 });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return pairs;
};

const escapeXml = value =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const columnName = index => {
  let name = '';
  let current = index + 1;
  while (current > 0) {
    const modulo = (current - 1) % 26;
    name = String.fromCharCode(65 + modulo) + name;
    current = Math.floor((current - modulo) / 26);
  }
  return name;
};

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

const crc32 = buffer => {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const dosDateTime = date => {
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosTime, dosDate };
};

const createZip = files => {
  const parts = [];
  const central = [];
  let offset = 0;
  const { dosTime, dosDate } = dosDateTime(new Date());

  files.forEach(file => {
    const nameBuffer = Buffer.from(file.name);
    const dataBuffer = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data);
    const crc = crc32(dataBuffer);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(dataBuffer.length, 18);
    local.writeUInt32LE(dataBuffer.length, 22);
    local.writeUInt16LE(nameBuffer.length, 26);
    local.writeUInt16LE(0, 28);
    parts.push(local, nameBuffer, dataBuffer);

    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(20, 6);
    header.writeUInt16LE(0, 8);
    header.writeUInt16LE(0, 10);
    header.writeUInt16LE(dosTime, 12);
    header.writeUInt16LE(dosDate, 14);
    header.writeUInt32LE(crc, 16);
    header.writeUInt32LE(dataBuffer.length, 20);
    header.writeUInt32LE(dataBuffer.length, 24);
    header.writeUInt16LE(nameBuffer.length, 28);
    header.writeUInt16LE(0, 30);
    header.writeUInt16LE(0, 32);
    header.writeUInt16LE(0, 34);
    header.writeUInt16LE(0, 36);
    header.writeUInt32LE(0, 38);
    header.writeUInt32LE(offset, 42);
    central.push(header, nameBuffer);
    offset += local.length + nameBuffer.length + dataBuffer.length;
  });

  const centralSize = central.reduce((sum, item) => sum + item.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...parts, ...central, end]);
};

const buildXlsx = rows => {
  const sheetRows = rows.map((row, rowIndex) => {
    const cells = row.map((value, columnIndex) => {
      const ref = `${columnName(columnIndex)}${rowIndex + 1}`;
      if (typeof value === 'number' && Number.isFinite(value)) {
        return `<c r="${ref}"><v>${value}</v></c>`;
      }
      return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
    }).join('');
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join('');
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`;
  const workbook = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Bank Salary Upload" sheetId="1" r:id="rId1"/></sheets></workbook>';
  const workbookRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>';
  const rootRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
  const contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>';
  return createZip([
    { name: '[Content_Types].xml', data: contentTypes },
    { name: '_rels/.rels', data: rootRels },
    { name: 'xl/workbook.xml', data: workbook },
    { name: 'xl/_rels/workbook.xml.rels', data: workbookRels },
    { name: 'xl/worksheets/sheet1.xml', data: sheet },
  ]);
};

const buildBankSalaryRows = payload => [
  [
    'Employee Name',
    'Email',
    'Employee ID',
    'Employee Code',
    'PAN',
    'Bank Name',
    'Account Number',
    'IFSC Code',
    'Cycle Start',
    'Cycle End',
    'Salary Month',
    'Salary Year',
    'Monthly Gross',
    'Assigned Net Salary',
    'Per Day Salary',
    'Payable Days',
    'Present Days',
    'Half Days',
    'Leave Days',
    'Absent Days',
    'Approved Expenses',
    'PF Employee',
    'ESI Employee',
    'Professional Tax',
    'Loan Recovery',
    'TDS Monthly',
    'Total Deductions',
    'Final Salary Paid',
  ],
  ...(payload.data || []).map(item => [
    item.name,
    item.email,
    item.username || String(item.employeeID),
    item.employeeCode || '',
    item.panNumber || '',
    item.bankName || '',
    item.accountNumber || '',
    item.ifscCode || '',
    item.cycle?.startDate,
    item.cycle?.fullEndDate || item.cycle?.endDate,
    item.month,
    item.year,
    item.assignedGross || item.earnings?.gross || 0,
    item.assignedNetPay || 0,
    item.perDaySalary || 0,
    item.payableDays || 0,
    item.presentDays || 0,
    item.halfDays || 0,
    item.leaveDays || 0,
    item.absentDays || 0,
    item.totalExpenses || 0,
    item.deductions?.pfEmployee || 0,
    item.deductions?.esiEmployee || 0,
    item.deductions?.professionalTax || 0,
    item.deductions?.loanRecovery || 0,
    item.deductions?.tdsMonthly || 0,
    item.deductions?.totalDeductions || 0,
    item.totalPay || 0,
  ]),
];

const buildSalaryPdf = (payload, rows) => new Promise(resolve => {
  const doc = new PDFDocument({ margin: 36, size: 'A4', layout: 'landscape' });
  const chunks = [];
  doc.on('data', chunk => chunks.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.fontSize(16).text('Bank Salary Upload', { align: 'center' });
  doc.moveDown(0.4);
  doc.fontSize(9).text(`Cycle: ${payload.cycle?.startDate || '-'} to ${payload.cycle?.fullEndDate || payload.cycle?.endDate || '-'}`);
  doc.text(`Employees: ${(payload.data || []).length}`);
  doc.moveDown(0.8);
  rows.slice(0, 1).concat(rows.slice(1)).forEach((row, index) => {
    const line = [
      row[0],
      row[2],
      row[5],
      row[6],
      row[7],
      row[12],
      row[26],
      row[27],
    ].map(value => String(value ?? '')).join(' | ');
    doc.font(index === 0 ? 'Helvetica-Bold' : 'Helvetica').fontSize(index === 0 ? 8 : 7).text(line, { continued: false });
    if (doc.y > 520) doc.addPage();
  });
  doc.end();
});

const parseTimeToMinutes = value => {
  const text = String(value || '').trim();
  if (!text || text === '-') return null;
  const match = text.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridian = match[3]?.toUpperCase();
  if (meridian === 'PM' && hours !== 12) hours += 12;
  if (meridian === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const normalizeRuleLabel = value =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\bdays\b/g, 'day')
    .replace(/\s+/g, ' ')
    .trim();

const hoursBetweenTimes = (start, end) => {
  const startMinutes = parseTimeToMinutes(start);
  const endMinutes = parseTimeToMinutes(end);
  if (startMinutes === null || endMinutes === null) return 0;
  const diff = endMinutes >= startMinutes ? endMinutes - startMinutes : endMinutes + 24 * 60 - startMinutes;
  return Number((diff / 60).toFixed(2));
};

const timeStatusFromHours = (day, totalHours, status = '') => {
  const dayLower = String(day || '').toLowerCase();
  const statusLower = String(status || '').toLowerCase();
  if (statusLower === 'approved leave' || statusLower === 'leave') return 'Full Time';
  if (dayLower === 'sunday') return 'Holiday';
  if (dayLower === 'saturday') return totalHours > 0 ? 'Full Time' : '-';
  return Number(totalHours || 0) >= 7 ? 'Full Time' : 'Half Time';
};

const attendanceStatusFromTime = (day, totalHours, status = '') => {
  const timeStatus = timeStatusFromHours(day, totalHours, status);
  if (timeStatus === 'Half Time') return 'Half Day';
  if (timeStatus === 'Holiday') return 'Holiday';
  if (timeStatus === 'Full Time') return status === 'Approved Leave' ? 'Approved Leave' : 'Present';
  return status || 'Absent';
};

const getRuleNumber = (rules, labels, fallback) => {
  const normalizedLabels = labels.map(normalizeRuleLabel);
  const rule = rules.find(item => normalizedLabels.includes(normalizeRuleLabel(item.label)));
  if (!rule) return fallback;
  const number = Number(String(rule.value || '').match(/\d+(\.\d+)?/)?.[0]);
  return Number.isFinite(number) ? number : fallback;
};

const getRuleValue = (rules, labels, fallback = '') => {
  const normalizedLabels = labels.map(normalizeRuleLabel);
  const rule = rules.find(item => normalizedLabels.includes(normalizeRuleLabel(item.label)));
  return rule ? String(rule.value || '').trim() : fallback;
};

const getRuleBoolean = (rules, labels, fallback = false) => {
  const value = getRuleValue(rules, labels, fallback ? 'Yes' : 'No').toLowerCase();
  if (['yes', 'true', 'paid', '1', 'allow', 'allowed'].some(item => value.includes(item))) return true;
  if (['no', 'false', 'unpaid', '0', 'deny'].some(item => value.includes(item))) return false;
  return fallback;
};

const splitRuleList = value =>
  String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

const fallbackMasterSalaryRules = [
  { label: 'Fixed Paid Days', value: '26' },
  { label: 'Salary Cycle Start Day', value: '1' },
  { label: 'Salary Cycle End Day', value: '31' },
  { label: 'Annual Start Date', value: '01-04' },
  { label: 'Weekly Off Days', value: 'Sunday' },
  { label: 'Approved Leave Paid', value: 'Yes' },
  { label: 'Paid Holiday Dates', value: '2026-01-26, 2026-08-15, 2026-10-02' },
  { label: 'Paid Holiday Names', value: 'Republic Day, Independence Day, Gandhi Jayanti, Diwali, Holi, Makar Sankranti' },
  { label: 'Minimum Full Day Hours', value: '7' },
  { label: 'Half Day Pay Value', value: '0.5' },
  { label: 'Absent Pay Value', value: '0' },
  { label: 'Expense Reimbursement Paid', value: 'Yes' },
];

const getMasterSalaryPolicy = async () => {
  await payrollPolicyService.ensureDefaults();
  const policies = await PayrollPolicy.find({
    status: 'active',
    $or: [
      { category: /^master salary rule$/i },
      { title: /^master salary rule$/i },
    ],
  }).sort({ updatedAt: -1, createdAt: -1 });
  return policies[0];
};

const parseDayMonthRule = value => {
  const parts = String(value || '').match(/\d{1,2}/g);
  if (!parts || parts.length < 2) return null;
  const day = Number(parts[0]);
  const month = Number(parts[1]);
  if (!Number.isInteger(day) || !Number.isInteger(month) || day < 1 || day > 31 || month < 1 || month > 12) {
    return null;
  }
  return { day, month };
};

const getPayrollCycleSettings = async (year, month) => {
  const masterPolicy = await getMasterSalaryPolicy();
  const rules = masterPolicy?.rules?.length ? masterPolicy.rules : fallbackMasterSalaryRules;
  const monthDays = daysInMonth(year, month);
  const requestedStartDay = getRuleNumber(rules, ['Salary Cycle Start Day', 'Cycle Start Day'], 1);
  const requestedEndDay = getRuleNumber(rules, ['Salary Cycle End Day', 'Cycle End Day'], monthDays);
  const startDay = Math.min(Math.max(requestedStartDay, 1), 31);
  const endDay = Math.min(Math.max(requestedEndDay, 1), 31);
  const halfTimeMinimumHours = getRuleNumber(rules, ['Half Time Minimum Hours', 'Minimum Full Time Hours', 'Minimum Full Day Hours'], 7);
  const sundayAutoPaidAbove = getRuleNumber(rules, ['Sunday Auto Paid When Open Days Above'], 26);
  const weeklyOffDays = splitRuleList(getRuleValue(rules, ['Weekly Off Days', 'Weekly Off'], 'Sunday')).map(item => item.toLowerCase());
  const paidHolidayDates = splitRuleList(getRuleValue(rules, ['Paid Holiday Dates', 'Holiday Dates'], '')).map(item => item.toLowerCase());
  const paidHolidayNames = splitRuleList(getRuleValue(rules, ['Paid Holiday Names', 'Festival Holidays', 'National Holidays'], '')).map(item => item.toLowerCase());
  const startMonthDate = startDay <= endDay
    ? new Date(year, month - 1, 1)
    : new Date(year, month - 2, 1);
  const startDate = new Date(
    startMonthDate.getFullYear(),
    startMonthDate.getMonth(),
    clampDayToMonth(startMonthDate.getFullYear(), startMonthDate.getMonth() + 1, startDay),
  );
  const endDate = new Date(year, month - 1, clampDayToMonth(year, month, endDay));
  const finalStartDate = startDate;
  const finalEndDate = endDate;
  const workingDates = dateRange(finalStartDate, finalEndDate).filter(dateObj => {
    const day = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return !weeklyOffDays.includes(day);
  });
  const fixedPaidDays = getRuleNumber(
    rules,
    ['Fixed Paid Days', 'Fixed Paid Day', 'Fixed Pay Days', 'Paid Days', 'Office Open Days In Month', 'Salary Paid Days'],
    workingDates.length || monthDays,
  );
  return {
    openDaysInMonth: fixedPaidDays,
    salaryBasis: `${fixedPaidDays} fixed paid days from master salary rule`,
    fixedPaidDays,
    startDay,
    endDay,
    halfTimeMinimumHours,
    halfDayPayValue: getRuleNumber(rules, ['Half Day Pay Value'], 0.5),
    absentPayValue: getRuleNumber(rules, ['Absent Pay Value'], 0),
    approvedLeavePaid: getRuleBoolean(rules, ['Approved Leave Paid', 'Approved Leave Attendance'], true),
    expenseReimbursementPaid: getRuleBoolean(rules, ['Expense Reimbursement Paid'], true),
    weeklyOffDays,
    paidHolidayDates,
    paidHolidayNames,
    sundayAutoPaidAbove,
    startDate: finalStartDate,
    endDate: finalEndDate,
  };
};

const getAttendanceCycleSettings = async (year, month) => {
  const salaryCycle = await getPayrollCycleSettings(year, month);
  const startDate = new Date(
    year,
    month - 1,
    clampDayToMonth(year, month, salaryCycle.startDay),
  );
  const endMonthDate = salaryCycle.startDay <= salaryCycle.endDay
    ? new Date(year, month - 1, 1)
    : new Date(year, month, 1);
  const endDate = new Date(
    endMonthDate.getFullYear(),
    endMonthDate.getMonth(),
    clampDayToMonth(endMonthDate.getFullYear(), endMonthDate.getMonth() + 1, salaryCycle.endDay),
  );

  return {
    ...salaryCycle,
    startDate,
    endDate,
  };
};

const dateFromAttendanceParts = item => new Date(Number(item.year), Number(item.month) - 1, Number(item.date));

const attendanceCyclePayload = cycle => ({
  startDay: cycle.startDay,
  endDay: cycle.endDay,
  startDate: formatIsoDate(cycle.startDate),
  endDate: formatIsoDate(cycle.endDate),
  weeklyOffDays: cycle.weeklyOffDays,
});

const buildUserQuery = (query = {}, forcedType) => {
  const filter = {};
  if (forcedType) filter.type = forcedType;
  if (query.status) filter.status = String(query.status).toLowerCase();
  if (query.department) filter.department = new RegExp(String(query.department).trim(), 'i');
  if (query.designation) filter.designation = new RegExp(String(query.designation).trim(), 'i');
  if (query.joiningFrom || query.joiningTo) {
    filter.date = {};
    if (query.joiningFrom) filter.date.$gte = query.joiningFrom;
    if (query.joiningTo) filter.date.$lte = query.joiningTo;
  }
  if (query.search) {
    const search = new RegExp(String(query.search).trim(), 'i');
    filter.$or = [
      { name: search },
      { username: search },
      { email: search },
      { mobile: search },
      { employeeCode: search },
      { department: search },
      { designation: search },
    ];
  }
  return filter;
};

const normalizeSalaryPayload = data => {
  const earnings = {
    basic: toNumber(data.basic ?? data.earnings?.basic),
    hra: toNumber(data.hra ?? data.earnings?.hra),
    specialAllowance: toNumber(data.specialAllowance ?? data.allowance ?? data.earnings?.specialAllowance),
    bonus: toNumber(data.bonus ?? data.earnings?.bonus),
    otherBenefits: toNumber(data.incentives ?? data.otherBenefits ?? data.earnings?.otherBenefits),
    conveyance: toNumber(data.conveyance ?? data.earnings?.conveyance),
    medical: toNumber(data.medical ?? data.earnings?.medical),
    overtimeHours: toNumber(data.overtimeHours ?? data.earnings?.overtimeHours),
    overtimeRate: toNumber(data.overtimeRate ?? data.earnings?.overtimeRate),
  };
  earnings.overtimePay = toNumber(data.overtimePay ?? data.earnings?.overtimePay) || earnings.overtimeHours * earnings.overtimeRate;
  earnings.gross =
    toNumber(data.gross ?? data.earnings?.gross) ||
    (earnings.basic +
      earnings.hra +
      earnings.specialAllowance +
      earnings.bonus +
      earnings.otherBenefits +
      earnings.conveyance +
      earnings.medical +
      earnings.overtimePay);

  const deductions = {
    pfEmployeePercent: toNumber(data.pfEmployeePercent ?? data.deductions?.pfEmployeePercent ?? 12),
    pfEmployerPercent: toNumber(data.pfEmployerPercent ?? data.deductions?.pfEmployerPercent ?? 12),
    esiEmployeePercent: toNumber(data.esiEmployeePercent ?? data.deductions?.esiEmployeePercent),
    esiEmployerPercent: toNumber(data.esiEmployerPercent ?? data.deductions?.esiEmployerPercent),
    pfEmployee: toNumber(data.pf ?? data.pfEmployee ?? data.deductions?.pfEmployee),
    pfEmployer: toNumber(data.pfEmployer ?? data.deductions?.pfEmployer),
    esiEmployee: toNumber(data.esic ?? data.esiEmployee ?? data.deductions?.esiEmployee),
    esiEmployer: toNumber(data.esiEmployer ?? data.deductions?.esiEmployer),
    tdsMonthly: toNumber(data.tax ?? data.tdsMonthly ?? data.deductions?.tdsMonthly),
    professionalTax: toNumber(data.professionalTax ?? data.deductions?.professionalTax),
    loanRecovery: toNumber(data.loanRecovery ?? data.deductions?.loanRecovery),
  };
  if (!deductions.pfEmployee) deductions.pfEmployee = (earnings.basic * deductions.pfEmployeePercent) / 100;
  if (!deductions.pfEmployer) deductions.pfEmployer = (earnings.basic * deductions.pfEmployerPercent) / 100;
  deductions.pfEmployee = Math.min(deductions.pfEmployee, PF_AMOUNT_LIMIT);
  deductions.pfEmployer = Math.min(deductions.pfEmployer, PF_AMOUNT_LIMIT);
  if (!deductions.esiEmployee) deductions.esiEmployee = (earnings.gross * deductions.esiEmployeePercent) / 100;
  if (!deductions.esiEmployer) deductions.esiEmployer = (earnings.gross * deductions.esiEmployerPercent) / 100;
  deductions.totalDeductions =
    toNumber(data.totalDeductions ?? data.deductions?.totalDeductions) ||
    (deductions.pfEmployee +
      deductions.esiEmployee +
      deductions.tdsMonthly +
      deductions.professionalTax +
      deductions.loanRecovery +
      toNumber(data.deductionsAmount));

  return {
    employeeID: data.employeeID,
    earnings,
    deductions,
    netPay: toNumber(data.netPay) || Math.max(earnings.gross - deductions.totalDeductions, 0),
    month: data.month,
    year: data.year,
    meta: data.meta || {},
  };
};

const DEFAULT_OFFICE_LOCATION = {
  officeName: process.env.OFFICE_NAME || 'Amit Web Solution Company',
  latitude: Number(process.env.OFFICE_LATITUDE || 23.036245),
  longitude: Number(process.env.OFFICE_LONGITUDE || 72.513106),
  radiusMeters: Number(process.env.OFFICE_RADIUS_METERS || 100),
};

const getActiveOfficeLocation = async () => {
  let location = await OfficeLocation.findOne({ status: 'active' }).sort({ updatedAt: -1 });
  if (!location) {
    location = await OfficeLocation.create({ ...DEFAULT_OFFICE_LOCATION, status: 'active' });
  }
  return location;
};

const getCompanySettingDocument = async () => {
  let settings = await CompanySetting.findOne({}).sort({ updatedAt: -1 });
  if (!settings) {
    settings = await CompanySetting.create({});
  }
  return settings;
};

const distanceInMeters = (from, to = DEFAULT_OFFICE_LOCATION) => {
  const toRadians = value => (value * Math.PI) / 180;
  const earthRadiusMeters = 6371000;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
};

const validateAttendanceLocation = async (employeeID, latitude, longitude) => {
  const employee = await userService.findUser({ _id: employeeID });
  if (!employee) {
    return { valid: false, message: "Employee not found" };
  }

  if (String(employee.workType).toLowerCase() !== "onsite") {
    return { valid: true };
  }

  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { valid: false, message: "Office location verification is required" };
  }

  const officeLocation = await getActiveOfficeLocation();
  const distanceMeters = distanceInMeters({ latitude: lat, longitude: lng }, officeLocation);
  if (distanceMeters > officeLocation.radiusMeters) {
    return {
      valid: false,
      message: `You are outside ${officeLocation.officeName} radius (${Math.round(distanceMeters)}m away)`,
    };
  }

  return { valid: true, distanceMeters };
};

const attendanceLocationPayload = (latitude, longitude, accuracy, distanceMeters) => {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return undefined;
  }
  return {
    latitude: lat,
    longitude: lng,
    accuracy: Number.isFinite(Number(accuracy)) ? Number(accuracy) : undefined,
    distanceMeters,
  };
};


class UserController {
  annualPayrollDataCleanup = async () => {
    const today = normalizeDateOnly(new Date());
    const todayIso = formatIsoDate(today);
    const masterPolicy = await getMasterSalaryPolicy();
    const rules = masterPolicy?.rules?.length ? masterPolicy.rules : fallbackMasterSalaryRules;
    const annualStart = parseDayMonthRule(
      getRuleValue(rules, ['Annual Start Date', 'Annual Start Day Month', 'Annual Data Reset Date'], ''),
    );

    if (!annualStart) return { skipped: true, reason: 'Annual start date not configured' };
    if (today.getDate() !== annualStart.day || today.getMonth() + 1 !== annualStart.month) {
      return { skipped: true, reason: 'Today is not annual cleanup date' };
    }
    if (masterPolicy?.meta?.lastAnnualCleanupDate === todayIso) {
      return { skipped: true, reason: 'Annual cleanup already completed today' };
    }

    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const date = today.getDate();
    const attendanceFilter = {
      $or: [
        { year: { $lt: year } },
        { year, month: { $lt: month } },
        { year, month, date: { $lt: date } },
      ],
    };

    const [attendance, leaves, expenses] = await Promise.all([
      Attendance.deleteMany(attendanceFilter),
      Leave.deleteMany({ endDate: { $lt: todayIso } }),
      Expense.deleteMany({ appliedDate: { $lt: todayIso } }),
    ]);

    if (masterPolicy?._id) {
      await PayrollPolicy.updateOne(
        { _id: masterPolicy._id },
        {
          $set: {
            'meta.lastAnnualCleanupDate': todayIso,
            'meta.lastAnnualCleanupSummary': {
              attendanceDeleted: attendance.deletedCount || 0,
              leavesDeleted: leaves.deletedCount || 0,
              expensesDeleted: expenses.deletedCount || 0,
            },
          },
        },
      );
    }

    return {
      success: true,
      date: todayIso,
      attendanceDeleted: attendance.deletedCount || 0,
      leavesDeleted: leaves.deletedCount || 0,
      expensesDeleted: expenses.deletedCount || 0,
    };
  }

  getCompanySettings = async (req, res, next) => {
    const settings = await getCompanySettingDocument();
    res.json({ success: true, data: settings });
  }

  updateCompanySettings = async (req, res, next) => {
    const current = await getCompanySettingDocument();
    const data = {
      supportEmail:
        req.body.supportEmail === undefined
          ? current.supportEmail
          : String(req.body.supportEmail || '').trim(),
      supportPhone:
        req.body.supportPhone === undefined
          ? current.supportPhone
          : String(req.body.supportPhone || '').trim(),
    };
    const updated = await CompanySetting.findByIdAndUpdate(current._id, data, {
      new: true,
      runValidators: true,
    });
    res.json({ success: true, message: 'Help contact updated', data: updated });
  }

  getOfficeLocations = async (req, res, next) => {
    const locations = await OfficeLocation.find({}).sort({ status: 1, updatedAt: -1 });
    if (!locations.length) {
      const location = await OfficeLocation.create({ ...DEFAULT_OFFICE_LOCATION, status: 'active' });
      return res.json({ success: true, data: [location] });
    }
    res.json({ success: true, data: locations });
  }

  createOfficeLocation = async (req, res, next) => {
    const data = {
      officeName: String(req.body.officeName || '').trim(),
      latitude: Number(req.body.latitude),
      longitude: Number(req.body.longitude),
      radiusMeters: Number(req.body.radiusMeters || 100),
      status: req.body.status || 'active',
    };
    if (!data.officeName) return next(ErrorHandler.badRequest('Office name is required'));
    if (!Number.isFinite(data.latitude) || !Number.isFinite(data.longitude)) {
      return next(ErrorHandler.badRequest('Valid office latitude and longitude are required'));
    }
    if (!Number.isFinite(data.radiusMeters) || data.radiusMeters <= 0) {
      return next(ErrorHandler.badRequest('Allowed radius must be greater than 0'));
    }
    if (data.status === 'active') {
      await OfficeLocation.updateMany({}, { status: 'inactive' });
    }
    const location = await OfficeLocation.create(data);
    res.status(201).json({ success: true, message: 'Office location saved', data: location });
  }

  updateOfficeLocation = async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return next(ErrorHandler.badRequest('Invalid office location id'));
    const data = {
      officeName: req.body.officeName === undefined ? undefined : String(req.body.officeName || '').trim(),
      latitude: req.body.latitude === undefined ? undefined : Number(req.body.latitude),
      longitude: req.body.longitude === undefined ? undefined : Number(req.body.longitude),
      radiusMeters: req.body.radiusMeters === undefined ? undefined : Number(req.body.radiusMeters),
      status: req.body.status,
    };
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
    if (data.officeName === '') return next(ErrorHandler.badRequest('Office name is required'));
    if ((data.latitude !== undefined && !Number.isFinite(data.latitude)) || (data.longitude !== undefined && !Number.isFinite(data.longitude))) {
      return next(ErrorHandler.badRequest('Valid office latitude and longitude are required'));
    }
    if (data.radiusMeters !== undefined && (!Number.isFinite(data.radiusMeters) || data.radiusMeters <= 0)) {
      return next(ErrorHandler.badRequest('Allowed radius must be greater than 0'));
    }
    if (data.status === 'active') {
      await OfficeLocation.updateMany({ _id: { $ne: id } }, { status: 'inactive' });
    }
    const location = await OfficeLocation.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!location) return next(ErrorHandler.notFound('Office location not found'));
    res.json({ success: true, message: 'Office location updated', data: location });
  }

  deleteOfficeLocation = async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return next(ErrorHandler.badRequest('Invalid office location id'));
    const deleted = await OfficeLocation.findByIdAndDelete(id);
    if (!deleted) return next(ErrorHandler.notFound('Office location not found'));
    res.json({ success: true, message: 'Office location deleted' });
  }

  calculateCurrentMonthSalaries = async (req, res) => {
  try {
    const currentDate = new Date();
    const year = Number(req.query.year || currentDate.getFullYear());
    const month = Number(req.query.month || currentDate.getMonth() + 1);
    const today = normalizeDateOnly(currentDate);
    const cycle = await getPayrollCycleSettings(year, month);
    let effectiveEndDate = cycle.endDate;
    if (today < cycle.startDate) {
      effectiveEndDate = cycle.startDate;
    } else if (cycle.endDate > today) {
      effectiveEndDate = today;
    }
    const cycleDates = dateRange(cycle.startDate, effectiveEndDate);
    const shouldPayWeeklyOff = cycle.openDaysInMonth >= 30;
    const cycleStartIso = formatIsoDate(cycle.startDate);
    const cycleEndIso = formatIsoDate(effectiveEndDate);
    const fullCycleEndIso = formatIsoDate(cycle.endDate);
    const isFinalSalary = today >= cycle.endDate;
    const salaryLabel = isFinalSalary ? 'Final Salary' : 'Salary Till Date';
    const attendanceRangeQuery = monthYearPairsForRange(cycle.startDate, effectiveEndDate);
    const requestedEmployeeID = req.query.employeeID && mongoose.Types.ObjectId.isValid(req.query.employeeID)
      ? req.query.employeeID
      : '';
    const workforceQuery = { type: { $in: ['employee', 'leader'] }, status: { $ne: 'deleted' } };
    if (requestedEmployeeID) workforceQuery._id = requestedEmployeeID;

    const [users, salaries, attendances, expenses, approvedLeaves] = await Promise.all([
      User.find(workforceQuery),
      UserSalaries.find({}),
      Attendance.find(attendanceRangeQuery.length ? { $or: attendanceRangeQuery } : { year, month }),
      Expense.find({ adminResponse: "Approved" }),
      Leave.find({
        adminResponse: 'Approved',
        startDate: { $lte: cycleEndIso },
        endDate: { $gte: cycleStartIso },
      }),
    ]);

    const salaryByEmployee = new Map(salaries.map(item => [String(item.employeeID), item]));
    const attendanceByEmployeeDate = new Map(
      attendances.map(item => [
        `${String(item.employeeID)}-${item.year}-${String(item.month).padStart(2, '0')}-${String(item.date).padStart(2, '0')}`,
        item,
      ]),
    );

    const paidHolidayDates = cycleDates.filter(dateObj =>
      cycle.paidHolidayDates.includes(formatIsoDate(dateObj).toLowerCase())
    );
    if (paidHolidayDates.length) {
      await Promise.all(users.flatMap(user =>
        paidHolidayDates.map(async dateObj => {
          const employeeId = String(user._id);
          const dayNumber = dateObj.getDate();
          const dateYear = dateObj.getFullYear();
          const dateMonth = dateObj.getMonth() + 1;
          const isoDate = formatIsoDate(dateObj);
          const day = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
          const key = `${employeeId}-${isoDate}`;
          const saved = await Attendance.findOneAndUpdate(
            { employeeID: user._id, year: dateYear, month: dateMonth, date: dayNumber },
            {
              $setOnInsert: {
                employeeID: user._id,
                year: dateYear,
                month: dateMonth,
                date: dayNumber,
                day,
                present: true,
                status: 'Present',
                attendanceIn: 'Paid Holiday',
                attendanceOut: 'Paid Holiday',
                late: 'No',
                totalHours: '0',
                timeStatus: 'Full Time',
                reason: 'Paid holiday by master salary rule',
              },
            },
            { upsert: true, new: true },
          );
          attendanceByEmployeeDate.set(key, saved);
        })
      ));
    }

    await Promise.all(approvedLeaves.flatMap(leave =>
      cycleDates
        .filter(dateObj => {
          const isoDate = formatIsoDate(dateObj);
          return leave.startDate <= isoDate && leave.endDate >= isoDate;
        })
        .map(async dateObj => {
          const employeeId = String(leave.applicantID);
          const dayNumber = dateObj.getDate();
          const dateYear = dateObj.getFullYear();
          const dateMonth = dateObj.getMonth() + 1;
          const isoDate = formatIsoDate(dateObj);
          const day = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
          const key = `${employeeId}-${isoDate}`;
          const saved = await Attendance.findOneAndUpdate(
            { employeeID: leave.applicantID, year: dateYear, month: dateMonth, date: dayNumber },
            {
              $setOnInsert: {
                employeeID: leave.applicantID,
                year: dateYear,
                month: dateMonth,
                date: dayNumber,
                day,
                present: true,
                status: 'Approved Leave',
                attendanceIn: 'Approved Leave',
                attendanceOut: 'Approved Leave',
                late: 'No',
                totalHours: '0',
                timeStatus: 'Full Time',
                reason: `Approved leave: ${leave.type || leave.title || 'Leave'}`,
              },
            },
            { upsert: true, new: true },
          );
          attendanceByEmployeeDate.set(key, saved);
        })
    ));

    if (shouldPayWeeklyOff) {
      const weeklyOffDates = cycleDates.filter(dateObj => {
        const day = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        return cycle.weeklyOffDays.includes(day);
      });
      await Promise.all(users.flatMap(user =>
        weeklyOffDates.map(async dateObj => {
          const employeeId = String(user._id);
          const dayNumber = dateObj.getDate();
          const dateYear = dateObj.getFullYear();
          const dateMonth = dateObj.getMonth() + 1;
          const isoDate = formatIsoDate(dateObj);
          const day = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
          const key = `${employeeId}-${isoDate}`;
          const saved = await Attendance.findOneAndUpdate(
            { employeeID: user._id, year: dateYear, month: dateMonth, date: dayNumber },
            {
              $set: {
                employeeID: user._id,
                year: dateYear,
                month: dateMonth,
                date: dayNumber,
                day,
                present: true,
                status: 'Present',
                attendanceIn: 'Auto Weekly Off',
                attendanceOut: 'Auto Weekly Off',
                late: 'No',
                totalHours: '0',
                timeStatus: 'Full Time',
                reason: `${day} auto-present because fixed paid days is ${cycle.openDaysInMonth}`,
              },
            },
            { upsert: true, new: true },
          );
          attendanceByEmployeeDate.set(key, saved);
        })
      ));
    }

    const results = users.map(user => {
      const employeeId = String(user._id);
      const empSalary = salaryByEmployee.get(employeeId);
      const assignedGross = toNumber(empSalary?.earnings?.gross);
      const assignedDeductions = toNumber(empSalary?.deductions?.totalDeductions);
      const assignedNetPay = toNumber(empSalary?.netPay) || Math.max(assignedGross - assignedDeductions, 0);
      const perDaySalary = cycle.openDaysInMonth > 0 ? Number((assignedNetPay / cycle.openDaysInMonth).toFixed(2)) : 0;
      let payableDays = 0;
      let presentDays = 0;
      let halfDays = 0;
      let leaveDays = 0;
      let weeklyOffDays = 0;
      let weeklyOffPaidDays = 0;
      let weeklyOffUnpaidDays = 0;
      let holidayPaidDays = 0;
      let absentDays = 0;

      const isApprovedLeaveDate = isoDate => approvedLeaves.find(item =>
        String(item.applicantID) === employeeId &&
        item.startDate <= isoDate &&
        item.endDate >= isoDate
      );
      const attendanceDetails = cycleDates.map(dateObj => {
        const dayNumber = dateObj.getDate();
        const day = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        const dayLower = day.toLowerCase();
        const isoDate = formatIsoDate(dateObj);
        const isoDateLower = isoDate.toLowerCase();
        const record = attendanceByEmployeeDate.get(`${employeeId}-${isoDate}`);
        const leave = isApprovedLeaveDate(isoDate);
        const isWeeklyOff = cycle.weeklyOffDays.includes(dayLower);
        const holidayName = cycle.paidHolidayNames.find(name => name && (
          String(record?.reason || '').toLowerCase().includes(name) ||
          String(record?.day || '').toLowerCase().includes(name)
        ));
        const isPaidHoliday = cycle.paidHolidayDates.includes(isoDateLower) || Boolean(holidayName);

        let status = 'Absent';
        let timeStatus = '-';
        let reason = 'Check-in not recorded';
        let dayValue = 0;
        let totalHours = 0;

        if (leave) {
          status = 'Approved Leave';
          timeStatus = cycle.approvedLeavePaid ? 'Full Time' : 'Unpaid Leave';
          reason = `Approved leave: ${leave.type || leave.title || 'Leave'}`;
          dayValue = cycle.approvedLeavePaid ? 1 : 0;
          presentDays += dayValue;
          leaveDays += 1;
        } else if (isPaidHoliday) {
          status = 'Present';
          timeStatus = 'Full Time';
          reason = holidayName ? `Paid holiday: ${holidayName}` : 'Paid holiday by master salary rule';
          dayValue = 1;
          presentDays += 1;
          holidayPaidDays += 1;
        } else if (isWeeklyOff) {
          status = shouldPayWeeklyOff ? 'Present' : 'Weekly Off';
          timeStatus = shouldPayWeeklyOff ? 'Full Time' : 'Weekly Off';
          dayValue = shouldPayWeeklyOff ? 1 : 0;
          reason = shouldPayWeeklyOff
            ? `${day} auto-present because fixed paid days is ${cycle.openDaysInMonth}`
            : `${day} weekly off by master salary rule`;
          weeklyOffDays += 1;
          if (shouldPayWeeklyOff) {
            weeklyOffPaidDays += 1;
            presentDays += 1;
          } else {
            weeklyOffUnpaidDays += 1;
          }
        } else if (record?.present) {
          totalHours = toNumber(record.totalHours) || hoursBetweenTimes(record.attendanceIn, record.attendanceOut);
          timeStatus = record.timeStatus || timeStatusFromHours(day, totalHours, record.status);
          status = record.status || attendanceStatusFromTime(day, totalHours, record.status);
          if (totalHours > 0 && totalHours < cycle.halfTimeMinimumHours && status !== 'Approved Leave') {
            timeStatus = 'Half Time';
            status = 'Half Day';
          }
          if (timeStatus === 'Half Time' || status === 'Half Day') {
            status = 'Half Day';
            timeStatus = 'Half Time';
            reason = `Worked less than ${cycle.halfTimeMinimumHours} hours`;
            dayValue = cycle.halfDayPayValue;
            presentDays += dayValue;
            halfDays += 1;
          } else {
            status = status === 'Approved Leave' ? 'Approved Leave' : 'Present';
            timeStatus = 'Full Time';
            reason = record.reason || 'Attendance completed';
            dayValue = 1;
            presentDays += 1;
          }
        } else {
          dayValue = cycle.absentPayValue;
          absentDays += 1;
        }

        payableDays += dayValue;
        return {
          date: isoDate,
          day,
          status,
          timeStatus,
          reason: record?.reason || reason,
          attendanceIn: record?.attendanceIn || (shouldPayWeeklyOff && isWeeklyOff ? 'Auto Weekly Off' : '-'),
          attendanceOut: record?.attendanceOut || (shouldPayWeeklyOff && isWeeklyOff ? 'Auto Weekly Off' : '-'),
          totalHours: totalHours || record?.totalHours || (shouldPayWeeklyOff && isWeeklyOff ? '0' : '-'),
          payableDays: dayValue,
        };
      });

      const approvedExpenseItems = expenses.filter(item => {
        const appliedDate = item.appliedDate;
        return String(item.employeeID) === employeeId && appliedDate >= cycleStartIso && appliedDate <= cycleEndIso;
      });
      const totalExpenses = cycle.expenseReimbursementPaid
        ? approvedExpenseItems.reduce((sum, item) => sum + toNumber(item.amount), 0)
        : 0;
      const cappedPayableDays = Math.min(payableDays, cycle.openDaysInMonth);
      const salaryTillDate = Number((cappedPayableDays * perDaySalary).toFixed(2));
      const totalPay = Number((salaryTillDate + totalExpenses).toFixed(2));

      return {
        employeeID: user._id,
        name: user.name || user.username,
        email: user.email,
        username: user.username,
        employeeCode: user.employeeCode,
        panNumber: user.panNumber,
        bankName: user.bankName,
        accountNumber: user.accountNumber,
        ifscCode: user.ifscCode,
        month,
        year,
        cycle: {
          startDate: cycleStartIso,
          endDate: cycleEndIso,
          fullEndDate: fullCycleEndIso,
          openDaysInMonth: cycle.openDaysInMonth,
          salaryBasis: shouldPayWeeklyOff
            ? `${cycle.salaryBasis}; weekly off auto-present because fixed paid days is ${cycle.openDaysInMonth}`
            : cycle.salaryBasis,
          salaryCycleStartDay: cycle.startDay,
          salaryCycleEndDay: cycle.endDay,
          weeklyOffDays: cycle.weeklyOffDays,
          paidHolidayDates: cycle.paidHolidayDates,
          isFinalSalary,
          salaryLabel,
        },
        earnings: empSalary?.earnings || { gross: assignedGross },
        deductions: empSalary?.deductions || {},
        assignedNetPay,
        assignedGross,
        perDaySalary,
        payableDays: Number(cappedPayableDays.toFixed(2)),
        attendancePayableDays: Number(payableDays.toFixed(2)),
        presentDays: Number(presentDays.toFixed(2)),
        halfDays,
        leaveDays,
        sundayPaidDays: weeklyOffPaidDays,
        weeklyOffPaidDays,
        weeklyOffUnpaidDays,
        weeklyOffDays,
        holidayPaidDays,
        absentDays,
        salaryTillDate,
        totalExpenses,
        totalPay,
        isFinalSalary,
        salaryLabel,
        salaryCalculatedTillDate: cycleEndIso,
        fullCycleEndDate: fullCycleEndIso,
        attendanceDetails,
      };
    });

    res.json({
      success: true,
      data: results,
      cycle: {
        startDate: cycleStartIso,
        endDate: cycleEndIso,
        fullEndDate: fullCycleEndIso,
        openDaysInMonth: cycle.openDaysInMonth,
        salaryBasis: shouldPayWeeklyOff
          ? `${cycle.salaryBasis}; weekly off auto-present because fixed paid days is ${cycle.openDaysInMonth}`
          : cycle.salaryBasis,
        salaryCycleStartDay: cycle.startDay,
        salaryCycleEndDay: cycle.endDay,
        weeklyOffDays: cycle.weeklyOffDays,
        paidHolidayDates: cycle.paidHolidayDates,
        isFinalSalary,
        salaryLabel,
      },
      message: "Monthly cycle salary calculated successfully",
    });
  } catch (err) {
    console.error("Salary error:", err);
    res.status(500).json({
      success: false,
      message: "Error calculating salary",
      error: err.message,
    });
  }
};

  calculateMyMonthlySalary = async (req, res) => {
    const employeeID = String(req.user?._id || '');
    if (!employeeID) {
      return res.status(401).json({ success: false, message: 'Login required to view monthly salary' });
    }
    const originalJson = res.json.bind(res);
    let payload = null;
    res.json = data => {
      payload = data;
      return data;
    };
    req.query = { ...(req.query || {}), employeeID };
    await this.calculateCurrentMonthSalaries(req, res);
    res.json = originalJson;
    if (!payload?.success) {
      return res.status(500).json(payload || { success: false, message: 'Salary calculation failed' });
    }
    const detail = (payload.data || []).find(item => String(item.employeeID) === employeeID);
    if (!detail) {
      return res.status(404).json({ success: false, message: 'Monthly salary details not found' });
    }
    return originalJson({ success: true, data: detail, cycle: payload.cycle, message: 'Monthly salary calculated successfully' });
  }

  calculateMyMonthlySalaryList = async (req, res) => {
    const employeeID = String(req.user?._id || '');
    if (!employeeID) {
      return res.status(401).json({ success: false, message: 'Login required to view monthly salary' });
    }

    const employee = await User.findById(employeeID);
    const currentDate = new Date();
    const joiningDate = new Date(employee?.date || employee?.createdAt || currentDate);
    const start = Number.isNaN(joiningDate.getTime())
      ? new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      : new Date(joiningDate.getFullYear(), joiningDate.getMonth(), 1);
    const cursor = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const months = [];

    while (cursor >= start) {
      months.push({ month: cursor.getMonth() + 1, year: cursor.getFullYear() });
      cursor.setMonth(cursor.getMonth() - 1);
    }

    const rows = [];
    for (const option of months) {
      let payload = null;
      const salaryReq = {
        ...req,
        query: { employeeID, month: option.month, year: option.year },
      };
      const salaryRes = {
        json: data => {
          payload = data;
          return data;
        },
        status: () => salaryRes,
      };
      await this.calculateCurrentMonthSalaries(salaryReq, salaryRes);
      if (payload?.success) {
        const detail = (payload.data || []).find(item => String(item.employeeID) === employeeID);
        if (detail) rows.push(detail);
      }
    }

    return res.json({ success: true, data: rows, message: 'Monthly salary list calculated successfully' });
  }

  exportMonthlySalariesCsv = async (req, res) => {
    if (String(req.query.pastCycle || '').toLowerCase() === 'true') {
      const today = normalizeDateOnly(new Date());
      const currentCycle = await getPayrollCycleSettings(today.getFullYear(), today.getMonth() + 1);
      const exportDate = today > currentCycle.endDate
        ? currentCycle.endDate
        : new Date(today.getFullYear(), today.getMonth() - 1, 1);
      req.query.month = exportDate.getMonth() + 1;
      req.query.year = exportDate.getFullYear();
    }
    const originalJson = res.json.bind(res);
    let payload = null;
    res.json = data => {
      payload = data;
      return data;
    };
    await this.calculateCurrentMonthSalaries(req, res);
    res.json = originalJson;
    if (!payload?.success) {
      return res.status(500).json(payload || { success: false, message: 'Export failed' });
    }
    const rows = buildBankSalaryRows(payload);
    const cycleStart = payload.cycle?.startDate || `${req.query.year}-${String(req.query.month).padStart(2, '0')}`;
    const cycleEnd = payload.cycle?.fullEndDate || payload.cycle?.endDate || cycleStart;
    const format = String(req.query.format || 'xlsx').toLowerCase();
    const filenameBase = `bank-salary-upload-${cycleStart}-to-${cycleEnd}`;

    if (format === 'pdf') {
      const pdf = await buildSalaryPdf(payload, rows);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.pdf"`);
      return res.send(pdf);
    }

    const xlsx = buildXlsx(rows);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.xlsx"`);
    return res.send(xlsx);
  }


createUser = async (req, res) => {
    try {
      const {
        name,
        username,
        email,
        mobile,
        password,
        type,
        address,
        employeeCode,
        department,
        designation,
        date,
        panNumber,
        aadhaarNumber,
        bankName,
        accountNumber,
        ifscCode,
        workType,   // ✅ added
        uan,        // ✅ added
        esi,        // ✅ added
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRelation,
      } = req.body;

      const finalUsername =
        typeof username === "string"
          ? username
          : Array.isArray(username)
          ? username[0]
          : "";

      if (!finalUsername) {
        return res.status(400).json({ success: false, message: "Enter Username" });
      }

      const userObj = {
        name,
        username: finalUsername,
        email,
        mobile,
        password,
        type,
        address,
        employeeCode,
        department,
        designation,
        date,
        panNumber,
        aadhaarNumber,
        bankName,
        accountNumber,
        ifscCode,
        workType,   // ✅ added
        uan,        // ✅ added
        esi,        // ✅ added
        emergencyContact: {
          name: emergencyContactName || "",
          phone: emergencyContactPhone || "",
          relation: emergencyContactRelation || "",
        },
        profile: req.file ? req.file.filename : "user.png",
      };

      const user = new User(userObj);
      await user.save();

      res.status(200).json({
        success: true,
        message: "User Created Successfully",
        data: user,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: err.message || "Something went wrong",
      });
    }
  };

  // ===========================
  // UPDATE USER
  // ===========================
  updateUser = async (req, res, next) => {
    try {
      const file = req.file;
      const { id } = req.params;
      const {
        name,
        username,
        email,
        mobile,
        password,
        type,
        status,
        address,
        employeeCode,
        department,
        designation,
        date,
        panNumber,
        aadhaarNumber,
        bankName,
        accountNumber,
        ifscCode,
        workType,   // ✅ added
        uan,        // ✅ added
        esi,        // ✅ added
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRelation,
      } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id))
        return next(ErrorHandler.badRequest("Invalid User Id"));

      const dbUser = await userService.findUser({ _id: id });
      if (!dbUser) return next(ErrorHandler.notFound("User not found"));

      const userData = {
        name: name || dbUser.name,
        username: username || dbUser.username,
        email: email || dbUser.email,
        mobile: mobile || dbUser.mobile,
        type: type || dbUser.type,
        status: status || dbUser.status,
        address: address || dbUser.address,
        employeeCode: employeeCode || dbUser.employeeCode,
        department: department || dbUser.department,
        designation: designation || dbUser.designation,
        date: date || dbUser.date,
        panNumber: panNumber || dbUser.panNumber,
        aadhaarNumber: aadhaarNumber || dbUser.aadhaarNumber,
        bankName: bankName || dbUser.bankName,
        accountNumber: accountNumber || dbUser.accountNumber,
        ifscCode: ifscCode || dbUser.ifscCode,
        workType: workType || dbUser.workType,   // ✅ added
        uan: uan || dbUser.uan,                  // ✅ added
        esi: esi || dbUser.esi,                  // ✅ added
        emergencyContact: {
          name: emergencyContactName || dbUser.emergencyContact?.name || "",
          phone: emergencyContactPhone || dbUser.emergencyContact?.phone || "",
          relation: emergencyContactRelation || dbUser.emergencyContact?.relation || "",
        },
        profile: file ? file.filename : dbUser.profile,
      };
      if (password) userData.password = password;

      const updatedUser = await userService.updateUser(id, userData);
      if (!updatedUser)
        return next(ErrorHandler.serverError("Failed To Update Account"));

      res.json({
        success: true,
        message: "User Updated Successfully",
        data: updatedUser,
      });
    } catch (error) {
      console.error("Update User Error:", error);
      res.json({ success: false, error });
    }
  };

  // ===========================
  // REMAINING METHODS (unchanged)
  // ===========================

  getUsers = async (req, res, next) => {
    const type = req.path.split('/').pop().replace('s', '');
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '25', 10), 1), 100);
    const skip = (page - 1) * limit;
    const filter = buildUserQuery(req.query, type);

    const [emps, total] = await Promise.all([
      User.find(filter)
        .populate('team')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    const employees = emps.map((o) => new UserDto(o));
    res.json({
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1).replace(' ', '')} List Found`,
      data: employees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  };

  getFreeEmployees = async (req, res, next) => {
    const emps = await userService.findUsers({ type: 'employee', team: null });
    if (!emps || emps.length < 1)
      return next(ErrorHandler.notFound(`No Free Employee Found`));
    const employees = emps.map((o) => new UserDto(o));
    res.json({ success: true, message: 'Free Employees List Found', data: employees });
  };

  deleteUser = async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id))
        return next(ErrorHandler.badRequest('Invalid User ID'));
      const deletedUser = await userService.deleteUser({ _id: id });
      if (!deletedUser)
        return next(ErrorHandler.notFound('User not found or already deleted'));
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      console.error("Delete user error:", error);
      res.json({ success: false, error });
    }
  };

    getUser = async (req,res,next) =>
    {
        const {id} = req.params;
        const type = req.path.replace(id,'').replace('/','').replace('/','');
        if(!mongoose.Types.ObjectId.isValid(id)) return next(ErrorHandler.badRequest(`Invalid ${type.charAt(0).toUpperCase() + type.slice(1).replace(' ','')} Id`));
        const emp = await userService.findUser({_id:id,type});
        if(!emp) return next(ErrorHandler.notFound(`No ${type.charAt(0).toUpperCase() + type.slice(1).replace(' ','')} Found`));
        res.json({success:true,message:'Employee Found',data:new UserDto(emp)})
    }

    getUserNoFilter = async (req,res,next) =>
    {
        const {id} = req.params;
        if(!mongoose.Types.ObjectId.isValid(id)) return next(ErrorHandler.badRequest('Invalid User Id'));
        const emp = await userService.findUser({_id:id});
        if(!emp) return next(ErrorHandler.notFound('No User Found'));
        res.json({success:true,message:'User Found',data:new UserDto(emp)})
    }

    getLeaders = async (req,res,next) =>
    {
        const filter = buildUserQuery(req.query, 'leader');
        const leaders = await User.find(filter).populate('team').sort({ createdAt: -1 });
        const data = leaders.map((o)=>new UserDto(o));
        res.json({success:true,message:'Leaders Found',data})
    }

    getFreeLeaders = async (req,res,next) =>
    {
        const leaders = await userService.findFreeLeaders();
        const data = leaders.map((o)=>new UserDto(o));
        res.json({success:true,message:'Free Leaders Found',data})
    }

    getAdminDashboard = async (req, res) => {
      const today = getDateParts();
      const currentMonth = today.month;
      const currentYear = today.year;
      const todayIso = new Date().toISOString().split('T')[0];
      const dashboardCycle = await getPayrollCycleSettings(currentYear, currentMonth);
      const todayDay = new Date(currentYear, currentMonth - 1, today.date)
        .toLocaleDateString('en-US', { weekday: 'long' })
        .toLowerCase();
      const isWeeklyOffToday = dashboardCycle.weeklyOffDays.includes(todayDay);
      const workforceFilter = { type: { $in: ['employee', 'leader'] } };
      const activeWorkforceFilter = { ...workforceFilter, status: 'active' };

      const [
        totalEmployees,
        workforceUsers,
        totalTeams,
        totalLeaders,
        pendingLeaves,
        todayAttendance,
        leavesToday,
        salarySummary,
        recentLeaves,
        recentUsers,
      ] = await Promise.all([
        User.countDocuments(workforceFilter),
        User.find(activeWorkforceFilter).select('name username email employeeCode type status'),
        Team.countDocuments({ status: { $ne: 'deleted' } }),
        User.countDocuments({ type: 'leader' }),
        Leave.find({ adminResponse: 'Pending' }).sort({ createdAt: -1 }),
        Attendance.find({ year: today.year, month: today.month, date: today.date }),
        Leave.find({
          adminResponse: 'Approved',
          startDate: { $lte: todayIso },
          endDate: { $gte: todayIso },
        }),
        UserSalaries.aggregate([
          {
            $match: {
              $or: [
                { month: String(currentMonth), year: String(currentYear) },
                { month: currentMonth, year: currentYear },
                { month: { $exists: false } },
              ],
            },
          },
          {
            $group: {
              _id: null,
              gross: { $sum: '$earnings.gross' },
              netPay: { $sum: '$netPay' },
              deductions: { $sum: '$deductions.totalDeductions' },
              employees: { $sum: 1 },
            },
          },
        ]),
        Leave.find({}).sort({ createdAt: -1 }).limit(5),
        User.find(workforceFilter).sort({ createdAt: -1 }).limit(5),
      ]);

      const workforceIds = new Set(workforceUsers.map(user => String(user._id)));
      const approvedLeaveIds = new Set(leavesToday.map(leave => String(leave.applicantID)));
      const presentIds = new Set(
        todayAttendance
          .filter(item => item.present && !isWeeklyOffToday && String(item.status || '').toLowerCase() !== 'weekly off' && workforceIds.has(String(item.employeeID)))
          .map(item => String(item.employeeID)),
      );
      const presentToday = presentIds.size;
      const leaveToday = leavesToday.filter(leave => workforceIds.has(String(leave.applicantID))).length;
      const absentUsers = isWeeklyOffToday
        ? []
        : workforceUsers.filter(user => !presentIds.has(String(user._id)) && !approvedLeaveIds.has(String(user._id)));
      const absentToday = absentUsers.length;
      const pendingLeaveRequests = pendingLeaves.filter(leave => workforceIds.has(String(leave.applicantID))).length;
      const payrollSummary = salarySummary[0] || { gross: 0, netPay: 0, deductions: 0, employees: 0 };
      let livePayroll = null;
      const payrollCaptureRes = {
        json: payload => {
          livePayroll = payload;
          return payload;
        },
        status: () => payrollCaptureRes,
        setHeader: () => {},
        send: payload => payload,
      };
      await this.calculateCurrentMonthSalaries(
        { query: { month: currentMonth, year: currentYear } },
        payrollCaptureRes,
      );
      const livePayrollRows = livePayroll?.success ? livePayroll.data || [] : [];
      payrollSummary.payableTillDate = livePayrollRows.reduce((sum, item) => sum + toNumber(item.totalPay), 0);
      payrollSummary.salaryTillDate = livePayrollRows.reduce((sum, item) => sum + toNumber(item.salaryTillDate), 0);
      payrollSummary.approvedExpensesTillDate = livePayrollRows.reduce((sum, item) => sum + toNumber(item.totalExpenses), 0);
      payrollSummary.cycle = livePayroll?.cycle || null;
      const pendingLeaveList = pendingLeaves
        .filter(leave => workforceIds.has(String(leave.applicantID)))
        .slice(0, 10)
        .map(leave => ({
          id: leave._id,
          employeeID: leave.applicantID,
          name: leave.applicantName,
          email: leave.applicantEmail,
          type: leave.type,
          status: leave.adminResponse,
          startDate: leave.startDate,
          endDate: leave.endDate,
          title: `${leave.applicantName} (${leave.applicantID}) - ${leave.type}`,
        }));
      const absentList = absentUsers.slice(0, 10).map(user => ({
        id: user._id,
        employeeID: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        employeeCode: user.employeeCode,
        title: `${user.name || user.username} (${user.username || user.employeeCode || user._id})`,
      }));
      const recentActivities = [
        ...recentLeaves.map(leave => ({
          type: 'Leave',
          title: `${leave.applicantName} requested ${leave.type}`,
          status: leave.adminResponse,
          date: leave.createdAt || leave.appliedDate,
        })),
        ...recentUsers.map(user => ({
          type: 'User',
          title: `${user.name} joined as ${user.type}`,
          status: user.status,
          date: user.createdAt,
        })),
      ]
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        .slice(0, 8);

      res.json({
        success: true,
        data: {
          totalEmployees,
          presentToday,
          absentToday,
          onLeaveToday: leaveToday,
          totalTeams,
          totalLeaders,
          pendingLeaveRequests,
          payrollSummary,
          recentActivities,
          pendingLeaveList,
          absentList,
          notifications: [
            pendingLeaveRequests
              ? `${pendingLeaveRequests} leave request${pendingLeaveRequests > 1 ? 's' : ''} need review`
              : 'No pending leave approvals',
            absentToday
              ? `${absentToday} employee${absentToday > 1 ? 's are' : ' is'} absent today`
              : 'All active employees are covered today',
          ],
        },
      });
    }

    markEmployeeAttendance = async (req, res, next) => {
  try {
    const { employeeID } = req.body;
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const d = new Date();
    const todayDay = days[d.getDay()];
    const cycle = await getPayrollCycleSettings(d.getFullYear(), d.getMonth() + 1);
    if (cycle.weeklyOffDays.includes(todayDay.toLowerCase())) {
      return res.json({ success: false, message: `${todayDay} is weekly off as per master salary rule.` });
    }

      const newAttendance = {
      employeeID,
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      date: d.getDate(),
      day: todayDay,
      present: true,
      status: "Present",
    };

    const isAttendanceMarked = await attendanceService.findAttendance(newAttendance);
    if (isAttendanceMarked)
      return res.json({ success: false, message: "Attendance already marked!" });

    // 🟢 If Sunday — mark auto-present, no In/Out times
    const resp = await attendanceService.markAttendance(newAttendance);
    res.json({
      success: true,
      message: `${todayDay} Attendance Marked!`,
      data: resp,
    });
  } catch (error) {
    res.json({ success: false, error });
  }
};

 checkInEmployeeAttendance = async (req, res, next) => {
  try {
    const { employeeID, latitude, longitude, accuracy } = req.body;
    const locationCheck = await validateAttendanceLocation(employeeID, latitude, longitude);
    if (!locationCheck.valid) {
      return res.json({ success: false, message: locationCheck.message });
    }
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const d = new Date();
    const cycle = await getPayrollCycleSettings(d.getFullYear(), d.getMonth() + 1);
    const todayDay = days[d.getDay()];
    if (cycle.weeklyOffDays.includes(todayDay.toLowerCase())) {
      return res.json({ success: false, message: `${todayDay} is weekly off as per master salary rule.` });
    }

    // Convert current time to readable format
    const attendanceIn = d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // ✅ Extract current hour & minute in 24-hour format
    const currentHour = d.getHours(); // e.g. 10
    const currentMinute = d.getMinutes(); // e.g. 45

    // ✅ Company start time — 11:00 AM
    const late = currentHour > 11 || (currentHour === 11 && currentMinute > 0) ? "Yes" : "No";

    const newAttendance = {
      employeeID,
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      date: d.getDate(),
      day: todayDay,
      present: true,
      status: "Present",
      attendanceIn,
      late,
      checkInLocation: attendanceLocationPayload(
        latitude,
        longitude,
        accuracy,
        locationCheck.distanceMeters
      ),
    };

    // ✅ Prevent duplicate check-ins
    const isMarked = await attendanceService.findAttendance({
      employeeID,
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      date: d.getDate(),
    });

    if (isMarked)
      return res.json({ success: false, message: "Already checked in today!" });

    const resp = await attendanceService.markAttendance(newAttendance);
    res.json({
      success: true,
      data: resp,
      message: `Checked In successfully! (${late === "Yes" ? "Late" : "On Time"})`,
    });
  } catch (error) {
    res.json({ success: false, error });
  }
};



checkOutEmployeeAttendance = async (req, res, next) => {
  try {
    const { employeeID, latitude, longitude, accuracy } = req.body;
    const locationCheck = await validateAttendanceLocation(employeeID, latitude, longitude);
    if (!locationCheck.valid) {
      return res.json({ success: false, message: locationCheck.message });
    }
    const d = new Date();

    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const date = d.getDate();

    const record = await attendanceService.findTodayAttendance(
      employeeID,
      year,
      month,
      date
    );

    if (!record)
      return res.json({ success: false, message: "Please check in first!" });

    if (record.attendanceOut)
      return res.json({ success: false, message: "Already checked out today!" });

    const attendanceOut = d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // ✅ Calculate total hours as decimal
    const totalHours = hoursBetweenTimes(record.attendanceIn, attendanceOut).toFixed(2);
    const timeStatus = timeStatusFromHours(record.day, Number(totalHours), record.status);
    const status = timeStatus === "Half Time" ? "Half Day" : record.status === "Approved Leave" ? "Approved Leave" : "Present";

    const updated = await attendanceService.updateAttendanceOut(record._id, {
      attendanceOut,
      totalHours,
      timeStatus,
      status,
      reason: timeStatus === "Half Time" ? "Worked less than 7 hours" : record.reason,
      checkOutLocation: attendanceLocationPayload(
        latitude,
        longitude,
        accuracy,
        locationCheck.distanceMeters
      ),
    });

    res.json({ success: true, data: updated, message: "Checked Out successfully!" });
  } catch (error) {
    res.json({ success: false, error });
  }
};



    viewEmployeeAttendance = async (req,res,next) => {
        try {
            const data = req.body || {};
            const year = Number(data.year);
            const month = Number(data.month);

            if (year && month && !data.date) {
              const cycle = await getAttendanceCycleSettings(year, month);
              const rangeQuery = monthYearPairsForRange(cycle.startDate, cycle.endDate);
              const query = {
                ...data,
                $or: rangeQuery,
              };
              delete query.year;
              delete query.month;

              const records = await attendanceService.findAllAttendance(query);
              const resp = (records || []).filter(item => {
                const itemDate = dateFromAttendanceParts(item);
                return itemDate >= cycle.startDate && itemDate <= cycle.endDate;
              });

              return res.json({
                success: true,
                data: resp,
                cycle: attendanceCyclePayload(cycle),
              });
            }

            const resp = await attendanceService.findAllAttendance(data);
            if(!resp) return next(ErrorHandler.notFound('No Attendance found'));

            res.json({success:true,data:resp});
            
        } catch (error) {
            res.json({success:false,error});
        }
    }

updateEmployeeAttendance = async (req, res, next) => {
  try {
    const {
      id,
      employeeID,
      attendanceIn,
      attendanceOut,
      present,
      date,
      month,
      year,
      day,
      status,
      timeStatus: bodyTimeStatus,
      late: bodyLate,
    } = req.body;

    // 🧩 Validation
    if (!employeeID || !date || !month || !year) {
      return res.json({
        success: false,
        message: "Missing employee or date info",
      });
    }

    // 🚫 Prevent editing future date
    const today = new Date();
    const targetDate = new Date(year, month - 1, date);
    today.setHours(0, 0, 0, 0);
    if (targetDate > today) {
      return res.json({
        success: false,
        message: "Cannot modify attendance for a future date.",
      });
    }

    const cycle = await getPayrollCycleSettings(Number(year), Number(month));
    const targetDay = day || targetDate.toLocaleDateString("en-US", { weekday: "long" });
    if (cycle.weeklyOffDays.includes(String(targetDay).toLowerCase())) {
      return res.json({
        success: false,
        message: `${targetDay} is weekly off as per master salary rule.`,
      });
    }

    // 🧩 Absent case
    if (!present) {
      const absentData = {
        employeeID,
        attendanceIn: "-",
        attendanceOut: "-",
        totalHours: "-",
        late: "-",
        timeStatus: bodyTimeStatus || "-",
        present: false,
        status: status || "Absent",
        date,
        month,
        year,
        day,
      };

      const updated = id
        ? await attendanceService.updateAttendance(id, absentData)
        : await Attendance.findOneAndUpdate(
            { employeeID, year, month, date },
            { $set: absentData },
            { upsert: true, new: true, runValidators: true },
          );
      return res.json({ success: true, message: "Attendance marked Absent", data: updated });
    }

    // ✅ Present case
    const totalHours = hoursBetweenTimes(attendanceIn, attendanceOut);
    const inMinutes = parseTimeToMinutes(attendanceIn);
    const isLate = inMinutes !== null && inMinutes > 11 * 60 ? "Yes" : "No";

    let timeStatus = bodyTimeStatus || "-";
    const d = (day || "").toLowerCase();
    if (!bodyTimeStatus) {
      if (d === "sunday") timeStatus = "Holiday";
      else if (d === "saturday") timeStatus = totalHours > 0 ? "Full Time" : "-";
      else timeStatus = totalHours >= 7 ? "Full Time" : "Half Time";
    }
    if (status === "Half Day") timeStatus = "Half Time";
    if (status === "Present" && bodyTimeStatus === "Full Time") timeStatus = "Full Time";

    const attendanceData = {
      employeeID,
      attendanceIn,
      attendanceOut,
      totalHours: totalHours.toFixed(2),
      late: bodyLate || isLate,
      timeStatus,
      reason: timeStatus === "Half Time" ? "Worked less than 7 hours" : req.body.reason || "",
      present: true,
      status: status === "Half Day" || timeStatus === "Half Time" ? "Half Day" : "Present",
      date,
      month,
      year,
      day,
    };

    if (id) {
      const updated = await attendanceService.updateAttendance(id, attendanceData);
      return res.json({ success: true, message: "Attendance updated", data: updated });
    }

    const newAttendance = await Attendance.findOneAndUpdate(
      { employeeID, year, month, date },
      { $set: attendanceData },
      { upsert: true, new: true, runValidators: true },
    );
    return res.json({ success: true, message: "Attendance created", data: newAttendance });

  } catch (error) {
    console.error("Attendance update error:", error);
    res.json({
      success: false,
      message: error.message || "Server error while updating attendance",
    });
  }
};

autoMarkAttendanceForAll = async () => {
  try {
    console.log("Running Auto Attendance Cron Job...");

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const date = today.getDate();
    const day = today.toLocaleString("en-US", { weekday: "long" });

    // 1️⃣ Fetch approved leaves for today
    const approvedLeaves = await Leave.find({
      adminResponse: "Approved",
      startDate: { $lte: todayStr },
      endDate: { $gte: todayStr }
    });

    if (!approvedLeaves.length) {
      console.log("📌 No approved leaves for today");
      return;
    }

    console.log("🎉 Approved Leaves detected — marking present=true");

    // 2️⃣ Loop through approved leaves
    for (const leave of approvedLeaves) {
      // Upsert attendance for that employee
      const attendance = await Attendance.findOneAndUpdate(
        {
          employeeID: leave.applicantID,
          year,
          month,
          date
        },
        {
      $set: {
            present: true,
            attendanceIn: "-",
            attendanceOut: "-",
            totalHours: "-",
            late: "-",
            status: "Approved Leave",
            leaveID: leave._id
          }
        },
        { upsert: true, new: true }
      );

      console.log(
        `✅ Attendance marked for user ${leave.applicantID} (${leave.applicantName}) on ${todayStr}`
      );
    }
  } catch (err) {
    console.log("❌ Auto mark error:", err);
  }
};


  applyLeaveApplication = async (req, res, next) => {
    console.log("✅ Apply Leave API hit, body:", req.body); // <-- ADD THIS LINE
    try {
        const data = req.body;
        const { applicantID, title, type, startDate, endDate, appliedDate, period, reason } = data;

        // 👇 Get applicant details from DB
        const applicant = await userService.findUser({ _id: applicantID });
        if (!applicant) return next(ErrorHandler.notFound('Applicant not found'));

        const newLeaveApplication = {
            applicantID,
            applicantName: applicant.name,     // 👈 store name
            applicantEmail: applicant.email,   // 👈 store email
            title,
            type,
            startDate,
            endDate,
            appliedDate,
            period,
            reason,
            adminResponse: "Pending"
        };

        const isLeaveApplied = await userService.findLeaveApplication({
            applicantID,
            startDate,
            endDate,
            appliedDate
        });
        if (isLeaveApplied) return next(ErrorHandler.notAllowed('Leave Already Applied'));

        const resp = await userService.createLeaveApplication(newLeaveApplication);
        if (!resp) return next(ErrorHandler.serverError('Failed to apply leave'));
        res.json({ success: true, data: resp });

    } catch (error) {
        res.json({ success: false, error });
    }
};


    viewLeaveApplications = async (req, res, next) => {
        try {
            const data = req.body;
            const resp = await userService.findAllLeaveApplications(data);
            if(!resp) return next(ErrorHandler.notFound('No Leave Applications found'));

            res.json({success:true,data:resp});

        } catch (error) {
            res.json({success:false,error});
        }
    }

    updateLeaveApplication = async (req, res, next) => {
        try {

            const {id} = req.params;
            const body = req.body;
            if (String(body.adminResponse || '').toLowerCase() === 'rejected' && !String(body.rejectionReason || body.message || '').trim()) {
                return next(ErrorHandler.badRequest('Rejection reason is required'));
            }
            if (body.message && !body.rejectionReason) body.rejectionReason = body.message;
            const isLeaveUpdated = await userService.updateLeaveApplication(id,body);
            if(!isLeaveUpdated) return next(ErrorHandler.serverError('Failed to update leave'));
            res.json({success:true,message:'Leave Updated'});
            
            
        } catch (error) {
            res.json({success:false,error});
        }
    }

    assignEmployeeSalary = async (req, res, next) => {
        try {
            const data = normalizeSalaryPayload(req.body);
            const obj = {
                "employeeID":data.employeeID
            }
            const isSalaryAssigned = await userService.findSalary(obj);
            if(isSalaryAssigned) return next(ErrorHandler.serverError('Salary already assigned'));

            const d = new Date();
            data["assignedDate"] = d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();
            const resp = await userService.assignSalary(data);
            if(!resp) return next(ErrorHandler.serverError('Failed to assign salary'));
            res.json({success:true,data:resp}); 
        } catch (error) {
            res.json({success:false,error});
        }
    }

   updateEmployeeSalary = async (req, res, next) => {
  try {
    const body = normalizeSalaryPayload(req.body);
    const { employeeID } = body;
    const d = new Date();
    body["assignedDate"] = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

    const isSalaryUpdated = await userService.updateEmployeeSalary({ employeeID }, body);

    if (!isSalaryUpdated) 
      return next(ErrorHandler.serverError('Failed to update salary'));

    res.json({ success: true, message: 'Salary Updated' });
  } catch (error) {
    console.error("Update Salary Error:", error);
    res.json({ success: false, message: 'Update Failed', error: error.message });
  }
};

deleteEmployeeAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return next(ErrorHandler.badRequest('Invalid attendance id'));
    const deleted = await attendanceService.deleteAttendance(id);
    if (!deleted) return next(ErrorHandler.notFound('Attendance not found'));
    res.json({ success: true, message: 'Attendance deleted' });
  } catch (error) {
    res.json({ success: false, message: error.message || 'Attendance could not be deleted' });
  }
};

    deleteEmployeeSalary = async (req, res, next) => {
      try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return next(ErrorHandler.badRequest('Invalid salary id'));
        const deleted = await userService.deleteSalary({ _id: id });
        if (!deleted) return next(ErrorHandler.notFound('Salary not found'));
        res.json({ success: true, message: 'Salary deleted' });
      } catch (error) {
        res.json({ success: false, message: 'Delete Failed', error: error.message });
      }
    }


    viewSalary = async (req,res,next) => {
        try {
            const data = req.body;
            const resp = await userService.findAllSalary(data);
            if(!resp) return next(ErrorHandler.notFound('No Salary Found'));
            res.json({success:true,data:resp});

        } catch (error) {
            res.json({success:false,error});
        }
    }
    getAllUsers = async (req, res, next) => {
        try {
            const users = await User.find(buildUserQuery(req.query, req.query.type)).populate('team').sort({ createdAt: -1 });
            if(!users || users.length<1) return next(ErrorHandler.notFound('No Users Found'));
            res.json({success:true,data:users});
        } catch (error) {
            res.json({success:false,error});
        }
    }

    getSalaryTaxRules = async (req, res, next) => {
      await ensureDefaultSalaryTaxRules();
      const filter = {};
      if (req.query.status) filter.status = req.query.status;
      const rules = await SalaryTaxRule.find(filter).sort({ sortOrder: 1, fromAmount: 1 });
      res.json({ success: true, data: rules });
    }

    createSalaryTaxRule = async (req, res, next) => {
      const data = {
        label: String(req.body.label || '').trim(),
        fromAmount: toNumber(req.body.fromAmount),
        toAmount: req.body.toAmount === null || req.body.toAmount === '' ? null : toNumber(req.body.toAmount),
        ratePercent: toNumber(req.body.ratePercent),
        sortOrder: toNumber(req.body.sortOrder),
        regime: req.body.regime || 'New Regime',
        financialYear: req.body.financialYear || 'FY 2025-26',
        status: req.body.status || 'active',
      };
      if (!data.label) return next(ErrorHandler.badRequest('Tax rule label is required'));
      const rule = await SalaryTaxRule.create(data);
      res.status(201).json({ success: true, message: 'Tax rule created', data: rule });
    }

    updateSalaryTaxRule = async (req, res, next) => {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) return next(ErrorHandler.badRequest('Invalid tax rule id'));
      const data = {
        label: req.body.label,
        fromAmount: req.body.fromAmount === undefined ? undefined : toNumber(req.body.fromAmount),
        toAmount: req.body.toAmount === null || req.body.toAmount === '' ? null : req.body.toAmount === undefined ? undefined : toNumber(req.body.toAmount),
        ratePercent: req.body.ratePercent === undefined ? undefined : toNumber(req.body.ratePercent),
        sortOrder: req.body.sortOrder === undefined ? undefined : toNumber(req.body.sortOrder),
        regime: req.body.regime,
        financialYear: req.body.financialYear,
        status: req.body.status,
      };
      Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
      const rule = await SalaryTaxRule.findByIdAndUpdate(id, data, { new: true, runValidators: true });
      if (!rule) return next(ErrorHandler.notFound('Tax rule not found'));
      res.json({ success: true, message: 'Tax rule updated', data: rule });
    }

    deleteSalaryTaxRule = async (req, res, next) => {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) return next(ErrorHandler.badRequest('Invalid tax rule id'));
      const rule = await SalaryTaxRule.findByIdAndDelete(id);
      if (!rule) return next(ErrorHandler.notFound('Tax rule not found'));
      res.json({ success: true, message: 'Tax rule deleted' });
    }
    

}

module.exports = new UserController();
