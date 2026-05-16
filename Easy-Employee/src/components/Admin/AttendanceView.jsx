import React, { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { toast } from "react-toastify";
import { FaEdit, FaSave } from "react-icons/fa";
import {
  getAdmins,
  getAttendance,
  getEmployees,
  getLeaders,
  updateEmployeeAttendance,
} from "../../http";
import Loading from "../Loading";

const getUserId = (user) => String(user?.id || user?._id || "");
const getAttendanceUserId = (attendance) => String(attendance?.employeeID?._id || attendance?.employeeID || "");

const formatDate = (record) => {
  if (!record?.date || record.date === "-") return "-";
  return `${record.date}/${record.month}/${record.year}`;
};

const toTimeInput = (value) => {
  if (!value || value === "-") return "";
  const text = String(value).trim();
  const match = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return text;
  let hour = Number(match[1]);
  const minute = match[2];
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${minute}`;
};

const AttendanceView = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMonthYear, setSelectedMonthYear] = useState(new Date());
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [loading, setLoading] = useState(true);
  const [noDataMessage, setNoDataMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [editPresent, setEditPresent] = useState(true);
  const [editInTime, setEditInTime] = useState("");
  const [editOutTime, setEditOutTime] = useState("");

  const employeeMap = useMemo(() => {
    const map = {};
    employees.forEach((employee) => {
      map[getUserId(employee)] = employee;
    });
    return map;
  }, [employees]);

  const buildAttendanceList = (records, dateParts, employeeID = selectedEmployee) => {
    const targetEmployees = employeeID
      ? employees.filter((employee) => getUserId(employee) === String(employeeID))
      : employees;

    const list = [...records];
    targetEmployees.forEach((employee) => {
      const id = getUserId(employee);
      const hasRecord = records.some((record) => getAttendanceUserId(record) === id);
      if (!hasRecord) {
        list.push({
          employeeID: id,
          date: dateParts.date,
          month: dateParts.month,
          year: dateParts.year,
          day: new Date(dateParts.year, dateParts.month - 1, dateParts.date).toLocaleDateString("en-US", {
            weekday: "long",
          }),
          present: false,
          status: "Absent",
          attendanceIn: "-",
          attendanceOut: "-",
          totalHours: "-",
          late: "-",
          timeStatus: "-",
        });
      }
    });
    return list;
  };

  const loadEmployees = async () => {
    const [emps, leaders, admins] = await Promise.all([getEmployees(), getLeaders(), getAdmins()]);
    const allEmployees = [...(emps?.data || []), ...(leaders?.data || []), ...(admins?.data || [])];
    setEmployees(allEmployees);
    return allEmployees;
  };

  const loadDailyAttendance = async (date = selectedDate, employeeID = selectedEmployee) => {
    if (!date) return;
    setLoading(true);
    setNoDataMessage("");
    const dateParts = {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      date: date.getDate(),
    };
    const payload = { ...dateParts };
    if (employeeID) payload.employeeID = employeeID;

    try {
      const res = await getAttendance(payload);
      const records = res?.data || [];
      setAttendance(buildAttendanceList(records, dateParts, employeeID));
      setNoDataMessage(records.length ? "" : "No attendance records found for the selected date.");
    } catch (error) {
      console.error(error);
      setNoDataMessage("Error fetching attendance data.");
    } finally {
      setLoading(false);
    }
  };

  const generateMonthDays = (year, month) => {
    const today = new Date();
    const lastDate =
      today.getFullYear() === year && today.getMonth() + 1 === month
        ? today.getDate()
        : new Date(year, month, 0).getDate();
    return Array.from({ length: lastDate }, (_, index) => {
      const date = index + 1;
      return {
        date,
        month,
        year,
        day: new Date(year, month - 1, date).toLocaleDateString("en-US", { weekday: "long" }),
      };
    }).reverse();
  };

  const loadMonthlyAttendance = async () => {
    if (!selectedMonthYear) return toast.error("Please select a month and year");
    setLoading(true);
    setNoDataMessage("");
    const year = selectedMonthYear.getFullYear();
    const month = selectedMonthYear.getMonth() + 1;

    try {
      const res = await getAttendance({ year, month });
      const records = res?.data || [];
      const list = [];
      const targetEmployees = selectedEmployee
        ? employees.filter((employee) => getUserId(employee) === selectedEmployee)
        : employees;

      generateMonthDays(year, month).forEach((day) => {
        targetEmployees.forEach((employee) => {
          const id = getUserId(employee);
          const found = records.find(
            (record) =>
              getAttendanceUserId(record) === id &&
              Number(record.date) === day.date &&
              Number(record.month) === day.month &&
              Number(record.year) === day.year
          );
          list.push(
            found || {
              employeeID: id,
              ...day,
              present: false,
              status: "Absent",
              attendanceIn: "-",
              attendanceOut: "-",
              totalHours: "-",
              late: "-",
              timeStatus: "-",
            }
          );
        });
      });
      setAttendance(list);
    } catch (error) {
      console.error(error);
      setNoDataMessage("Error fetching monthly attendance.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await loadEmployees();
      } catch (error) {
        console.error(error);
        setNoDataMessage("Error fetching employees.");
      }
    })();
  }, []);

  useEffect(() => {
    if (employees.length) loadDailyAttendance(new Date(), "");
  }, [employees]);

  const openEdit = (record) => {
    setEditData(record);
    setEditPresent(Boolean(record.present));
    setEditInTime(toTimeInput(record.attendanceIn));
    setEditOutTime(toTimeInput(record.attendanceOut));
    setShowModal(true);
  };

  const saveAttendance = async () => {
    if (!editData) return;
    if (editPresent && (!editInTime || !editOutTime)) {
      return toast.error("Both In Time and Out Time are required");
    }

    const selectedDateObj = new Date(editData.year, editData.month - 1, editData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDateObj > today) return toast.error("You cannot edit future attendance");

    const payload = {
      id: editData._id || null,
      employeeID: getAttendanceUserId(editData),
      date: editData.date,
      month: editData.month,
      year: editData.year,
      day: editData.day,
      attendanceIn: editInTime,
      attendanceOut: editOutTime,
      present: editPresent,
    };

    const res = await updateEmployeeAttendance(payload);
    if (res?.success) {
      toast.success(res.message || "Attendance updated successfully");
      setShowModal(false);
      await loadDailyAttendance(selectedDate, selectedEmployee);
    } else {
      toast.error(res?.message || "Failed to update attendance");
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="main-content">
      <section className="section">
        <div className="card">
          <div className="card-header">
            <h4>Attendance</h4>
          </div>
          <div className="card-body">
            <div className="row align-items-end">
              <div className="form-group col-md-3">
                <label>Employee</label>
                <select
                  className="form-control"
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                >
                  <option value="">All Employees</option>
                  {employees.map((employee) => (
                    <option key={getUserId(employee)} value={getUserId(employee)}>
                      {employee.name} ({employee.type})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group col-md-2">
                <label>Date</label>
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  dateFormat="dd/MM/yyyy"
                  className="form-control"
                />
              </div>
              <div className="form-group col-md-2">
                <button className="btn btn-primary btn-block" onClick={() => loadDailyAttendance()}>
                  Search Day
                </button>
              </div>
              <div className="form-group col-md-3">
                <label>Month</label>
                <DatePicker
                  selected={selectedMonthYear}
                  onChange={(date) => setSelectedMonthYear(date)}
                  showMonthYearPicker
                  dateFormat="MM/yyyy"
                  className="form-control"
                />
              </div>
              <div className="form-group col-md-2">
                <button className="btn btn-success btn-block" onClick={loadMonthlyAttendance}>
                  Search Month
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="table-responsive mt-4">
        {attendance.length ? (
          <table className="table table-striped table-md center-text">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Date</th>
                <th>Day</th>
                <th>Status</th>
                <th>In Time</th>
                <th>Out Time</th>
                <th>Late</th>
                <th>Total Hours</th>
                <th>Time Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((record, index) => {
                const employee = employeeMap[getAttendanceUserId(record)] || {};
                const totalHours = Number(record.totalHours);
                const timeStatus = record.present ? record.timeStatus || (totalHours >= 7 ? "Full Time" : "Half Time") : "-";
                return (
                  <tr key={`${record._id || getAttendanceUserId(record)}-${record.date}-${record.month}-${index}`}>
                    <td>{index + 1}</td>
                    <td>{employee.name || record.name || "-"}</td>
                    <td>{employee.email || record.email || "-"}</td>
                    <td>{formatDate(record)}</td>
                    <td>{record.day || "-"}</td>
                    <td>
                      <span className={`badge ${record.present ? "badge-success" : "badge-danger"}`}>
                        {record.status || (record.present ? "Present" : "Absent")}
                      </span>
                    </td>
                    <td>{record.attendanceIn || "-"}</td>
                    <td>{record.attendanceOut || "-"}</td>
                    <td style={{ color: record.late === "Yes" ? "red" : "green", fontWeight: "bold" }}>
                      {record.late || "-"}
                    </td>
                    <td>{Number.isFinite(totalHours) ? totalHours : "-"}</td>
                    <td style={{ color: timeStatus === "Full Time" ? "green" : "orange", fontWeight: "bold" }}>
                      {timeStatus}
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(record)}>
                        <FaEdit />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-5">
            <h5 className="text-muted">{noDataMessage || "No attendance data available."}</h5>
          </div>
        )}
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Attendance</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editData ? (
            <>
              <div className="form-group">
                <label>Date</label>
                <DatePicker
                  selected={new Date(editData.year, editData.month - 1, editData.date)}
                  onChange={(date) => {
                    const day = date.toLocaleDateString("en-US", { weekday: "long" });
                    setEditData((current) => ({
                      ...current,
                      date: date.getDate(),
                      month: date.getMonth() + 1,
                      year: date.getFullYear(),
                      day,
                    }));
                  }}
                  dateFormat="dd/MM/yyyy"
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Day</label>
                <input className="form-control" value={editData.day || ""} readOnly />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  className="form-control"
                  value={editPresent ? "true" : "false"}
                  onChange={(e) => setEditPresent(e.target.value === "true")}
                >
                  <option value="true">Present</option>
                  <option value="false">Absent</option>
                </select>
              </div>
              <div className="form-group">
                <label>In Time</label>
                <input
                  className="form-control"
                  disabled={!editPresent}
                  type="time"
                  value={editInTime}
                  onChange={(e) => setEditInTime(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Out Time</label>
                <input
                  className="form-control"
                  disabled={!editPresent}
                  type="time"
                  value={editOutTime}
                  onChange={(e) => setEditOutTime(e.target.value)}
                />
              </div>
            </>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={saveAttendance}>
            <FaSave className="mr-1" /> Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AttendanceView;
