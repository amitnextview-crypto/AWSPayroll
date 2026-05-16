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
const teamService = require('../services/team-service');
const attendanceService = require('../services/attendance-service');

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
  const lowerLabels = labels.map(label => label.toLowerCase());
  const rule = rules.find(item => lowerLabels.includes(String(item.label || '').trim().toLowerCase()));
  if (!rule) return fallback;
  const number = Number(String(rule.value || '').match(/\d+(\.\d+)?/)?.[0]);
  return Number.isFinite(number) ? number : fallback;
};

const getPayrollCycleSettings = async (year, month) => {
  const policies = await PayrollPolicy.find({ status: 'active' });
  const rules = policies.flatMap(policy => policy.rules || []);
  const monthDays = daysInMonth(year, month);
  const rawOpenDays = rules.find(rule => /office open days/i.test(rule.label || ''))?.value;
  const parsedOpenDays = Number(String(rawOpenDays || '').match(/\d+/)?.[0]);
  const openDaysInMonth = Number.isFinite(parsedOpenDays) ? parsedOpenDays : monthDays;
  const startDay = Math.min(Math.max(getRuleNumber(rules, ['Salary Cycle Start Day', 'Cycle Start Day'], 1), 1), monthDays);
  const rawEndDay = getRuleNumber(rules, ['Salary Cycle End Day', 'Cycle End Day'], monthDays);
  const endDay = Math.min(Math.max(rawEndDay, 1), monthDays);
  const halfTimeMinimumHours = getRuleNumber(rules, ['Half Time Minimum Hours', 'Minimum Full Time Hours'], 7);
  const sundayAutoPaidAbove = getRuleNumber(rules, ['Sunday Auto Paid When Open Days Above'], 26);
  const startDate = new Date(year, month - 1, startDay);
  const endDate = new Date(year, month - 1, endDay);
  return {
    openDaysInMonth,
    startDay,
    endDay,
    halfTimeMinimumHours,
    sundayAutoPaidAbove,
    startDate: startDate <= endDate ? startDate : new Date(year, month - 1, 1),
    endDate: startDate <= endDate ? endDate : new Date(year, month, 0),
  };
};

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
    const effectiveEndDate = cycle.endDate > today ? today : cycle.endDate;
    const cycleDates = dateRange(cycle.startDate, effectiveEndDate);
    const cycleStartIso = formatIsoDate(cycle.startDate);
    const cycleEndIso = formatIsoDate(effectiveEndDate);

    const [users, salaries, attendances, expenses, approvedLeaves] = await Promise.all([
      User.find({ type: { $in: ['employee', 'leader'] }, status: { $ne: 'deleted' } }),
      UserSalaries.find({}),
      Attendance.find({ year, month }),
      Expense.find({ adminResponse: "Approved" }),
      Leave.find({
        adminResponse: 'Approved',
        startDate: { $lte: cycleEndIso },
        endDate: { $gte: cycleStartIso },
      }),
    ]);

    const salaryByEmployee = new Map(salaries.map(item => [String(item.employeeID), item]));
    const attendanceByEmployeeDate = new Map(
      attendances.map(item => [`${String(item.employeeID)}-${item.date}`, item]),
    );

    if (cycle.openDaysInMonth > cycle.sundayAutoPaidAbove) {
      const sundayDates = cycleDates.filter(dateObj => dateObj.getDay() === 0);
      await Promise.all(users.flatMap(user =>
        sundayDates.map(async dateObj => {
          const employeeId = String(user._id);
          const dayNumber = dateObj.getDate();
          const key = `${employeeId}-${dayNumber}`;
          if (attendanceByEmployeeDate.has(key)) return;
          const saved = await Attendance.findOneAndUpdate(
            { employeeID: user._id, year, month, date: dayNumber },
            {
              $setOnInsert: {
                employeeID: user._id,
                year,
                month,
                date: dayNumber,
                day: 'Sunday',
                present: true,
                status: 'Present',
                attendanceIn: 'Weekly Off',
                attendanceOut: 'Weekly Off',
                late: 'No',
                totalHours: '0',
                timeStatus: 'Full Time',
                reason: 'Sunday auto paid by salary policy',
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
      const assignedNetPay = toNumber(empSalary?.netPay);
      const assignedGross = toNumber(empSalary?.earnings?.gross);
      const perDaySalary = cycle.openDaysInMonth > 0 ? Number((assignedNetPay / cycle.openDaysInMonth).toFixed(2)) : 0;
      let payableDays = 0;
      let presentDays = 0;
      let halfDays = 0;
      let leaveDays = 0;
      let sundayPaidDays = 0;
      let absentDays = 0;

      const attendanceDetails = cycleDates.map(dateObj => {
        const dayNumber = dateObj.getDate();
        const day = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        const dayLower = day.toLowerCase();
        const isoDate = formatIsoDate(dateObj);
        const record = attendanceByEmployeeDate.get(`${employeeId}-${dayNumber}`);
        const leave = approvedLeaves.find(item =>
          String(item.applicantID) === employeeId &&
          item.startDate <= isoDate &&
          item.endDate >= isoDate
        );

        let status = 'Absent';
        let timeStatus = '-';
        let reason = 'Check-in not recorded';
        let dayValue = 0;
        let totalHours = 0;

        if (leave) {
          status = 'Approved Leave';
          timeStatus = 'Full Time';
          reason = `Approved leave: ${leave.type || leave.title || 'Leave'}`;
          dayValue = 1;
          leaveDays += 1;
        } else if (dayLower === 'sunday' && cycle.openDaysInMonth > cycle.sundayAutoPaidAbove) {
          status = 'Present';
          timeStatus = 'Full Time';
          reason = 'Sunday auto paid by salary policy';
          dayValue = 1;
          sundayPaidDays += 1;
        } else if (record?.present) {
          totalHours = toNumber(record.totalHours) || hoursBetweenTimes(record.attendanceIn, record.attendanceOut);
          timeStatus = record.timeStatus || timeStatusFromHours(day, totalHours, record.status);
          status = record.status || attendanceStatusFromTime(day, totalHours, record.status);
          if (timeStatus === 'Half Time' || status === 'Half Day') {
            status = 'Half Day';
            timeStatus = 'Half Time';
            reason = 'Worked less than 7 hours';
            dayValue = 0.5;
            halfDays += 1;
          } else {
            status = status === 'Approved Leave' ? 'Approved Leave' : 'Present';
            timeStatus = 'Full Time';
            reason = record.reason || 'Attendance completed';
            dayValue = 1;
            presentDays += 1;
          }
        } else if (dayLower === 'sunday') {
          status = 'Holiday';
          timeStatus = 'Holiday';
          reason = 'Weekly off';
        } else {
          absentDays += 1;
        }

        payableDays += dayValue;
        return {
          date: isoDate,
          day,
          status,
          timeStatus,
          reason: record?.reason || reason,
          attendanceIn: record?.attendanceIn || '-',
          attendanceOut: record?.attendanceOut || '-',
          totalHours: totalHours || record?.totalHours || '-',
          payableDays: dayValue,
        };
      });

      const approvedExpenseItems = expenses.filter(item => {
        const appliedDate = item.appliedDate;
        return String(item.employeeID) === employeeId && appliedDate >= cycleStartIso && appliedDate <= cycleEndIso;
      });
      const totalExpenses = approvedExpenseItems.reduce((sum, item) => sum + toNumber(item.amount), 0);
      const salaryTillDate = Number((payableDays * perDaySalary).toFixed(2));
      const totalPay = Number((salaryTillDate + totalExpenses).toFixed(2));

      return {
        employeeID: user._id,
        name: user.name || user.username,
        email: user.email,
        username: user.username,
        employeeCode: user.employeeCode,
        month,
        year,
        cycle: {
          startDate: cycleStartIso,
          endDate: cycleEndIso,
          openDaysInMonth: cycle.openDaysInMonth,
          salaryCycleStartDay: cycle.startDay,
          salaryCycleEndDay: cycle.endDay,
        },
        earnings: empSalary?.earnings || { gross: assignedGross },
        deductions: empSalary?.deductions || {},
        assignedNetPay,
        assignedGross,
        perDaySalary,
        payableDays: Number(payableDays.toFixed(2)),
        presentDays,
        halfDays,
        leaveDays,
        sundayPaidDays,
        absentDays,
        salaryTillDate,
        totalExpenses,
        totalPay,
        attendanceDetails,
      };
    });

    res.json({
      success: true,
      data: results,
      cycle: {
        startDate: cycleStartIso,
        endDate: cycleEndIso,
        openDaysInMonth: cycle.openDaysInMonth,
        salaryCycleStartDay: cycle.startDay,
        salaryCycleEndDay: cycle.endDay,
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

  exportMonthlySalariesCsv = async (req, res) => {
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
    const rows = [
      [
        'Employee Name',
        'Email',
        'Employee ID',
        'Month',
        'Year',
        'Cycle Start',
        'Cycle End',
        'Open Days',
        'Assigned Net Pay',
        'Per Day Salary',
        'Payable Days',
        'Present Days',
        'Half Days',
        'Approved Leave Days',
        'Sunday Paid Days',
        'Absent Days',
        'Salary Till Date',
        'Approved Expenses',
        'Total Pay',
      ],
      ...payload.data.map(item => [
        item.name,
        item.email,
        item.username || item.employeeCode || String(item.employeeID),
        item.month,
        item.year,
        item.cycle?.startDate,
        item.cycle?.endDate,
        item.cycle?.openDaysInMonth,
        item.assignedNetPay,
        item.perDaySalary,
        item.payableDays,
        item.presentDays,
        item.halfDays,
        item.leaveDays,
        item.sundayPaidDays,
        item.absentDays,
        item.salaryTillDate,
        item.totalExpenses,
        item.totalPay,
      ]),
    ];
    const csv = rows
      .map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="monthly-salaries-${req.query.month || new Date().getMonth() + 1}-${req.query.year || new Date().getFullYear()}.csv"`);
    return res.send(csv);
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
          .filter(item => item.present && workforceIds.has(String(item.employeeID)))
          .map(item => String(item.employeeID)),
      );
      const presentToday = presentIds.size;
      const leaveToday = leavesToday.filter(leave => workforceIds.has(String(leave.applicantID))).length;
      const absentUsers = workforceUsers.filter(user => !presentIds.has(String(user._id)) && !approvedLeaveIds.has(String(user._id)));
      const absentToday = absentUsers.length;
      const pendingLeaveRequests = pendingLeaves.filter(leave => workforceIds.has(String(leave.applicantID))).length;
      const payrollSummary = salarySummary[0] || { gross: 0, netPay: 0, deductions: 0, employees: 0 };
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
    if (todayDay === "Sunday") {
      const resp = await attendanceService.markAttendance({
        ...newAttendance,
        attendanceIn: "-",
        attendanceOut: "-",
        totalHours: "-",
        late: "-",
      });
      return res.json({
        success: true,
        message: "Sunday marked automatically as Present",
        data: resp,
      });
    }

    // Otherwise normal marking
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
      day: days[d.getDay()],
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
            const data = req.body;
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

      if (id) {
        const updated = await attendanceService.updateAttendance(id, absentData);
        return res.json({ success: true, message: "Marked Absent", data: updated });
      }

      const created = await attendanceService.createAttendance(absentData);
      return res.json({ success: true, message: "Attendance marked Absent", data: created });
    }

    // ✅ Present case
    const totalHours = hoursBetweenTimes(attendanceIn, attendanceOut);
    const inMinutes = parseTimeToMinutes(attendanceIn);
    const isLate = inMinutes !== null && inMinutes > 11 * 60 ? "Yes" : "No";

    let timeStatus = "-";
    const d = (day || "").toLowerCase();
    if (d === "sunday") timeStatus = "Holiday";
    else if (d === "saturday") timeStatus = totalHours > 0 ? "Full Time" : "-";
    else timeStatus = totalHours >= 7 ? "Full Time" : "Half Time";

    const attendanceData = {
      employeeID,
      attendanceIn,
      attendanceOut,
      totalHours: totalHours.toFixed(2),
      late: isLate,
      timeStatus,
      reason: timeStatus === "Half Time" ? "Worked less than 7 hours" : req.body.reason || "",
      present: true,
      status: timeStatus === "Half Time" ? "Half Day" : "Present",
      date,
      month,
      year,
      day,
    };

    if (id) {
      const updated = await attendanceService.updateAttendance(id, attendanceData);
      return res.json({ success: true, message: "Attendance updated", data: updated });
    }

    const newAttendance = await attendanceService.createAttendance(attendanceData);
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
