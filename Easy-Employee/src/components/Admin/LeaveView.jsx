import React, { useEffect, useState } from "react";
import { getEmployees, getLeaders, viewLeaves, getAdmins } from "../../http";
import { useHistory } from "react-router-dom";
import Loading from "../Loading";

const LeaveView = () => {
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [appliedDate, setAppliedDate] = useState("");
  const [applications, setApplications] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeMap, setEmployeeMap] = useState({});
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const history = useHistory();

  useEffect(() => {
    let empObj = {};

    const fetchData = async () => {
      try {
        const res = await viewLeaves({});
        const { data } = res || {};
        setApplications(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching leave applications:", err);
        setApplications([]);
      }
    };

    const fetchEmployees = async () => {
      try {
        const emps = await getEmployees();
        const leaders = await getLeaders();
        const admins = await getAdmins();
       

        emps?.data?.forEach(
          (employee) => (empObj[employee.id] = [employee.name, employee.email])
        );
        leaders?.data?.forEach(
          (leader) => (empObj[leader.id] = [leader.name, leader.email])
        );
        admins?.data?.forEach(
          (admin) => (empObj[admin.id] = [admin.name, admin.email])
        );

        setEmployeeMap(empObj);
        setEmployees([...(emps?.data || []), ...(leaders?.data || []), ...(admins?.data || [])]);
      } catch (err) {
        console.error("Error fetching employees:", err);
        setEmployees([]);
      }
    };

    fetchData();
    fetchEmployees();
  }, []);

  const searchLeaveApplications = async () => {
    const obj = {};

    if (selectedEmployee) obj["applicantID"] = selectedEmployee;
    if (type) obj["type"] = type;
    if (status) obj["adminResponse"] = status;
    if (appliedDate) obj["appliedDate"] = appliedDate;

    try {
      const res = await viewLeaves(obj);
      const { data } = res || {};
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error searching leave applications:", err);
    }

    setAppliedDate("");
    setType("");
    setStatus("");
  };

  return (
    <>
      {applications ? (
        <div className="main-content">
          <section className="section">
            <div className="card">
              <div className="card-header d-flex justify-content-between">
                <h4>Leave Applications</h4>
              </div>
            </div>

            <div className="d-flex justify-content-center align-items-center w-100 flex-wrap">
              <div className="form-group col-md-2">
                <label>Employee</label>
                <select
                  className="form-control select2"
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                >
                  <option value="">Employees</option>
                  {employees?.map((employee) => (
                    <option key={employee._id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group col-md-2">
                <label>Leave Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="form-control select2"
                >
                  <option value="">Select</option>
                  <option>Sick Leave</option>
                  <option>Casual Leave</option>
                  <option>Emergency Leave</option>
                   <option>Earning Day Leave</option>
                </select>
              </div>

              <div className="form-group col-md-2">
                <label>Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="form-control select2"
                >
                  <option value="">Select</option>
                  <option>Pending</option>
                  <option>Approved</option>
                  <option>Rejected</option>
                </select>
              </div>

              <div className="form-group col-md-3">
                <label>Applied Date</label>
                <div className="input-group">
                  <div className="input-group-prepend">
                    <div className="input-group-text">
                      <i className="fa fa-calendar"></i>
                    </div>
                  </div>
                  <input
                    onChange={(e) => setAppliedDate(e.target.value)}
                    value={appliedDate}
                    type="date"
                    id="startDate"
                    name="startDate"
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group col-md-2 d-flex align-items-end mt-4">
                <button
                  onClick={searchLeaveApplications}
                  className="btn btn-lg btn-primary w-100"
                >
                  Search
                </button>
              </div>
            </div>
          </section>

          <div className="table-responsive">
            <table className="table table-striped table-md center-text">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Applied Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody className="sidebar-wrapper">
                {applications.length > 0 ? (
                  applications.map((application, idx) => {
                    const empData = employeeMap?.[application.applicantID];
                    return (
                      <tr
                        key={application._id || idx}
                        className="hover-effect"
                        onClick={() =>
                          history.push(`leaves/${application._id}`)
                        }
                      >
                        <td>{idx + 1}</td>
                        <td>{empData ? empData[0] : "N/A"}</td>
                        <td>{empData ? empData[1] : "N/A"}</td>
                        <td>{application.type}</td>
                        <td>{application.title}</td>
                        <td>{application.appliedDate}</td>
                        <td
                          className={`${
                            application.adminResponse === "Rejected"
                              ? "text-danger"
                              : application.adminResponse === "Pending"
                              ? "text-primary"
                              : "text-success"
                          }`}
                        >
                          {application.adminResponse}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center">
                      No leave applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <Loading />
      )}
    </>
  );
};

export default LeaveView;
