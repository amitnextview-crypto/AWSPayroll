import React, { useEffect, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";





import {
  getAttendance,
  getEmployees,
  getLeaders,
  getAdmins,
  updateEmployeeAttendance,
} from "../../http";
import Loading from "../Loading";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";   // ✅ add this
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { FaEdit } from "react-icons/fa";


const AttendanceView = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMonthYear, setSelectedMonthYear] = useState(new Date()); // ✅ default to current month
  const [attendance, setAttendance] = useState(null);
  const [employeeMap, setEmployeeMap] = useState({});
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [loading, setLoading] = useState(true);
  const [noDataMessage, setNoDataMessage] = useState("");
  const [editPresent, setEditPresent] = useState(true);




  const [showModal, setShowModal] = useState(false);
const [editData, setEditData] = useState(null);
const [editInTime, setEditInTime] = useState("");
const [editOutTime, setEditOutTime] = useState("");

useEffect(() => {
  if (!editPresent) {
    setEditInTime("");
    setEditOutTime("");
  }
}, [editPresent]);

  // ✅ Fetch all employees + current month attendance on load
  // ✅ Fetch all employees + current month attendance on load
useEffect(() => {
  const fetchEmployeesAndAttendance = async () => {
    setLoading(true);
    let empObj = {};

    try {
      // 🔹 Fetch employees (all roles)
      const [emps, leaders, admins] = await Promise.all([
        getEmployees(),
        getLeaders(),
        getAdmins(),
      ]);

      // ✅ Merge all employees into single array
      const allEmployees = [...emps.data, ...leaders.data, ...admins.data];

      // ✅ Create map for quick name lookup
      allEmployees.forEach(e => {
        empObj[e.id] = [e.name, e.email];
      });

      setEmployeeMap(empObj);
      setEmployees(allEmployees);
      setSelectedDate(new Date());

      // 🔹 Fetch attendance for current month
      const now = new Date();
      const obj = {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        date: now.getDate(),
      };

      const res = await getAttendance(obj);
      const data = res?.data || [];

      // ✅ Merge attendance + absent employees
      let mergedData = [...data];
      allEmployees.forEach(emp => {
        const hasRecord = data.some(a => a.employeeID === emp.id);
        if (!hasRecord) {
          mergedData.push({
            employeeID: emp.id,
            name: emp.name,
            date: "-",
            month: obj.month,
            year: obj.year,
            day: "-",
            present: false,
            attendanceIn: "-",
            attendanceOut: "-",
            totalHours: "-",
            late: "-",
            timeStatus: "-",
          });
        }
      });

      // ✅ Set attendance and status
      setAttendance(mergedData);
      setNoDataMessage(
        mergedData.length === 0
          ? "No attendance records found for this month."
          : ""
      );
    } catch (error) {
      console.error(error);
      setNoDataMessage("Error fetching attendance data.");
    } finally {
      setLoading(false);
    }
  };

  fetchEmployeesAndAttendance();
}, []);


  // ✅ Search by specific date (for specific employee if selected)
  const searchAttendance = async () => {
    if (!selectedDate) {
      alert("Please select a date first!");
      return;
    }

    setLoading(true);
    setNoDataMessage("");
    const obj = {
      year: selectedDate.getFullYear(),
      month: selectedDate.getMonth() + 1,
      date: selectedDate.getDate(),
    };

    if (selectedEmployee) obj.employeeID = selectedEmployee; // ✅ Filter by employee if selected

    try {
      const res = await getAttendance(obj);
      const { data } = res;
// 🔹 Generate virtual "absent" records
let mergedData = [...data];

employees.forEach(emp => {
  const hasRecord = data.some(a => a.employeeID === emp.id);
  if (!hasRecord) {
    mergedData.push({
      employeeID: emp.id,
      date: obj.date || "-",
      month: obj.month,
      year: obj.year,
      day: "-",
      present: false,
      attendanceIn: "-",
      attendanceOut: "-",
      totalHours: "-",
      late: "-",
      timeStatus: "-",
    });
  }
});

setAttendance(mergedData);

   
      setNoDataMessage(
        data.length === 0
          ? "No attendance records found for the selected date."
          : ""
      );
    } catch (error) {
      console.error(error);
      setNoDataMessage("Error fetching attendance data.");
    } finally {
      setLoading(false);
    }
  };


  // ✅ Generate all dates for selected month until today
const generateMonthDays = (year, month) => {
  const days = [];
  const today = new Date();
  
  const lastDate =
    today.getFullYear() === year && today.getMonth() + 1 === month
      ? today.getDate()
      : new Date(year, month, 0).getDate();

  for (let i = 1; i <= lastDate; i++) {
    days.push({
      date: i,
      month,
      year,
      day: new Date(year, month - 1, i).toLocaleDateString("en-US", {
        weekday: "long",
      }),
    });
  }

  return days.reverse(); // ✅ latest day on top
};

  // ✅ Search attendance by month & year (for all employees or one)
 const searchAttendanceByMonth = async () => {
  if (!selectedMonthYear) {
    alert("Please select a month & year!");
    return;
  }

  setLoading(true);
  setNoDataMessage("");

  const year = selectedMonthYear.getFullYear();
  const month = selectedMonthYear.getMonth() + 1;

  try {
    // 🔹 Step 1: fetch all attendance for that month
    const res = await getAttendance({ year, month });
    const records = res?.data || [];

    // 🔹 Step 2: Generate all days from 1 to today
    const monthDays = generateMonthDays(year, month);

    const finalList = [];

    // 🔹 Step 3: For each day, add all employees (present + absent)
    monthDays.forEach((d) => {
      employees.forEach((emp) => {
        const found = records.find(
          (a) =>
            a.employeeID === emp.id &&
            a.date === d.date &&
            a.month === d.month &&
            a.year === d.year
        );

        if (found) {
          finalList.push({ ...found });
        } else {
          finalList.push({
            employeeID: emp.id,
            date: d.date,
            month: d.month,
            year: d.year,
            day: d.day,
            present: false,
            attendanceIn: "-",
            attendanceOut: "-",
            totalHours: "-",
            late: "-",
            timeStatus: "-",
          });
        }
      });
    });

    setAttendance(finalList);
  } catch (error) {
    console.error("Error fetching monthly attendance:", error);
    setNoDataMessage("Error fetching monthly attendance.");
  } finally {
    setLoading(false);
  }
};
  
  
  if (loading) return <Loading />;

  return (
    <div className="main-content">
      <section className="section">
        <div className="card">
          <div className="card-header d-flex justify-content-between">
            <h4>Attendance</h4>
          </div>
        </div>

        {/* 🔹 Search Filters */}
        <div className="d-flex justify-content-center w-100 align-items-center mt-3 flex-wrap gap-3">
          {/* Employee Select */}
          <div className="col-sm-2">
            <select
              className="form-control select2"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="">All Employees</option>
              {employees?.map((employee) => (
                <option key={employee._id || employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker (Daily) */}
          <div className="col-sm-2">
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              dateFormat="dd/MM/yyyy"
              className="form-control"
              placeholderText="Select Date"
            />
          </div>

          {/* Search Button (Daily) */}
          <button
            onClick={searchAttendance}
            className="btn btn-lg btn-primary col-sm-2"
          >
            Search (Day)
          </button>

          {/* Month & Year Picker */}
          <div className="col-sm-2">
            <DatePicker
              selected={selectedMonthYear}
              onChange={(date) => setSelectedMonthYear(date)}
              showMonthYearPicker
              dateFormat="MM/yyyy"
              className="form-control text-center"
              placeholderText="Select Month & Year"
              customInput={
                <input
                  className="form-control text-center"
                  style={{ minWidth: "200px" }}
                  value={
                    selectedMonthYear
                      ? `${String(selectedMonthYear.getMonth() + 1).padStart(
                          2,
                          "0"
                        )}/${selectedMonthYear.getFullYear()}`
                      : ""
                  }
                  readOnly
                />
              }
            />
          </div>

          {/* Search Button (Monthly) */}
          <button
            onClick={searchAttendanceByMonth}
            className="btn btn-lg btn-success col-sm-2"
          >
            Search (Month)
          </button>
        </div>
      </section>

      {/* 🔹 Attendance Table */}
      <div className="table-responsive mt-4">
        {attendance && attendance.length > 0 ? (
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
  </tr>
</thead>
<tbody>
  {attendance.map((att, idx) => {
    // ✅ Parse total hours safely
    const rawTotal = att.totalHours;
    const totalHrs =
      rawTotal === null || rawTotal === undefined || rawTotal === ""
        ? NaN
        : typeof rawTotal === "string"
        ? parseFloat(rawTotal)
        : Number(rawTotal);

    // ✅ Calculate Time Status
let timeStatus = "-";

if (att.present) {
  const day = (att.day || "").toLowerCase();

  if (day === "sunday") {
    timeStatus = "Full Time";
  } else if (day === "saturday") {
    timeStatus = totalHrs >= 5 ? "Full Time" : "Half Time";
  } else {
    timeStatus = totalHrs >= 7 ? "Full Time" : "Half Time";
  }
} else {
  // ✅ Absent case
  timeStatus = "-";
}

    return (
      <tr key={`${att._id || idx}-${att.date}-${att.month}`}>
        <td>{idx + 1}</td>
        <td>{employeeMap[att.employeeID]?.[0] || "-"}</td>
        <td>{employeeMap[att.employeeID]?.[1] || "-"}</td>
        <td>{`${att.date}/${att.month}/${att.year}`}</td>
        <td>{att.day}</td>
        <td>
          <span
            className={`badge ${
              att.present ? "badge-success" : "badge-danger"
            }`}
          >
            {att.present ? "Present" : "Absent"}
          </span>
        </td>
        <td>{att.attendanceIn || "-"}</td>
        <td>{att.attendanceOut || "-"}</td>
        <td
          style={{
            color: att.late === "Yes" ? "red" : "green",
            fontWeight: "bold",
          }}
        >
          {att.late || "-"}
        </td>
        <td>{!isNaN(totalHrs) ? totalHrs : "-"}</td>
     <td
  style={{
    color: timeStatus === "Full Time" ? "green" : "orange",
    fontWeight: "bold",
  }}
>
  {timeStatus}
  <FaEdit
    style={{
      marginLeft: "8px",
      cursor: "pointer",
      color: "#007bff",
    }}
    onClick={() => {
      setEditData(att);
      setEditInTime(att.attendanceIn || "");
      setEditOutTime(att.attendanceOut || "");
      setEditPresent(att.present); // ✅ Add this line
      setShowModal(true);
    }}
  />
</td>


      </tr>
    );
  })}
</tbody>

          </table>
        ) : (
          <div className="text-center py-5">
            <h5 className="text-muted">
              {noDataMessage || "No attendance data available."}
            </h5>
          </div>
        )}
      </div>

    <Modal show={showModal} onHide={() => setShowModal(false)} centered>
  <Modal.Header closeButton>
    <Modal.Title>Edit Attendance</Modal.Title>
  </Modal.Header>

  <Modal.Body>
    {editData && (
      <>
        {/* ✅ Editable Date */}
        <div className="form-group">
          <label>Date</label>
          <DatePicker
            selected={
              editData.date !== "-" && editData.year && editData.month
                ? new Date(
                    editData.year,
                    editData.month - 1,
                    editData.date
                  )
                : new Date()
            }
           onChange={(date) => {
  const newDay = date.toLocaleDateString("en-US", { weekday: "long" });

  // 🧩 Update date & day
  setEditData((prev) => ({
    ...prev,
    date: date.getDate(),
    month: date.getMonth() + 1,
    year: date.getFullYear(),
    day: newDay,
  }));

  // 🧩 If Sunday — auto mark Present and set fixed In/Out times
  if (newDay === "Sunday") {
    setEditPresent(true);
    setEditInTime("10:30");
    setEditOutTime("19:30");
  } else {
    // Keep user’s existing status & clear times if previously Sunday
    setEditPresent((prev) => prev);
    setEditInTime("");
    setEditOutTime("");
  }
}}
            dateFormat="dd/MM/yyyy"
            className="form-control"
          />
        </div>

        {/* ✅ Auto-updated Day */}
        <div className="form-group mt-2">
          <label>Day</label>
          <input
            type="text"
            className="form-control"
            value={editData.day || ""}
            readOnly
          />
        </div>

        {/* ✅ Attendance Status Dropdown */}
        <div className="form-group mt-3">
          <label>Attendance Status</label>
          <select
            className="form-control"
            value={editPresent ? "true" : "false"}
            onChange={(e) => setEditPresent(e.target.value === "true")}
          >
            <option value="true">Present</option>
            <option value="false">Absent</option>
          </select>
        </div>

        {/* ✅ In Time */}
        <div className="form-group mt-3">
          <label>In Time</label>
          <input
            type="time"
            className="form-control"
            value={editInTime}
            onChange={(e) => setEditInTime(e.target.value)}
            disabled={!editPresent}
          />
        </div>

        {/* ✅ Out Time */}
        <div className="form-group mt-3">
          <label>Out Time</label>
          <input
            type="time"
            className="form-control"
            value={editOutTime}
            onChange={(e) => setEditOutTime(e.target.value)}
            disabled={!editPresent}
          />
        </div>
      </>
    )}
  </Modal.Body>

  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowModal(false)}>
      Cancel
    </Button>

 <Button
  variant="primary"
  onClick={async () => {
    if (editPresent && (!editInTime || !editOutTime)) {
      return toast.error("Both In Time and Out Time are required!");
    }

    // 🚫 Prevent editing future date
    const selectedDateObj = new Date(
      editData.year,
      editData.month - 1,
      editData.date
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDateObj > today) {
      return toast.error("You cannot edit attendance for future dates!");
    }

    const obj = {
      id: editData._id || null,
      employeeID: editData.employeeID,
      date: editData.date,
      month: editData.month,
      year: editData.year,
      day: editData.day,
      attendanceIn: editInTime,
      attendanceOut: editOutTime,
      present: editPresent,
    };

    console.log("📤 Sending to backend:", obj);

    const res = await updateEmployeeAttendance(obj);

    if (res?.success) {
      toast.success(res.message || "Attendance updated successfully!");
      setShowModal(false);

      // Refresh attendance
      const refreshed = await getAttendance({
        year: selectedMonthYear.getFullYear(),
        month: selectedMonthYear.getMonth() + 1,
      });
      setAttendance(refreshed.data);
    } else {
      toast.error(res.message || "Failed to update attendance");
    }
  }}
>
  Save Changes
</Button>

  </Modal.Footer>
</Modal>
    </div>
  );
};

export default AttendanceView;
