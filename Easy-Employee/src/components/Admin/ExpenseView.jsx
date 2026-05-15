import React, { useEffect, useState } from "react";
import {getEmployees, getLeaders, getAdmins, viewEmployeeExpenses} from "../../http";

import { useHistory } from "react-router-dom";
import Loading from "../Loading";

const ExpenseView = () => {
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [appliedDate, setAppliedDate] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeMap, setEmployeeMap] = useState({});
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const history = useHistory();

  useEffect(() => {
    let empObj = {};

    const fetchData = async () => {
      try {
        const res = await viewEmployeeExpenses();
        const { data } = res || {};
        setExpenses(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching expenses:", err);
        setExpenses([]);
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

  const searchExpenses = async () => {
    const params = {};
    if (selectedEmployee) params["employeeID"] = selectedEmployee;
    if (type) params["type"] = type;
    if (status) params["adminResponse"] = status;
    if (appliedDate) params["appliedDate"] = appliedDate;

    try {
      const res = await viewEmployeeExpenses(params);
      const { data } = res || {};
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error searching expenses:", err);
    }

    setAppliedDate("");
    setType("");
    setStatus("");
  };

  return (
    <>
      {expenses ? (
        <div className="main-content">
          <section className="section">
            <div className="card">
              <div className="card-header d-flex justify-content-between">
                <h4>Expense Applications</h4>
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
                <label>Expense Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="form-control select2"
                >
                  <option value="">Select</option>
                  <option>Travel</option>
                  <option>Food</option>
                  <option>Office Supplies</option>
                  <option>Other</option>
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
                <input
                  onChange={(e) => setAppliedDate(e.target.value)}
                  value={appliedDate}
                  type="date"
                  className="form-control"
                />
              </div>

              <div className="form-group col-md-2 d-flex align-items-end mt-4">
                <button onClick={searchExpenses} className="btn btn-lg btn-primary w-100">
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
                  <th>Amount</th>
                  <th>Applied Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody className="sidebar-wrapper">
                {expenses.length > 0 ? (
                  expenses.map((expense, idx) => {
                    const empData = employeeMap?.[expense.employeeID];
                    return (
                      <tr
                        key={expense._id || idx}
                        className="hover-effect"
                        onClick={() => history.push(`/expenses/${expense._id}`)}
                      >
                        <td>{idx + 1}</td>
                        <td>{empData ? empData[0] : "N/A"}</td>
                        <td>{empData ? empData[1] : "N/A"}</td>
                        <td>{expense.type}</td>
                        <td>₹{expense.amount}</td>
                        <td>{expense.appliedDate}</td>
                        <td
                          className={`${
                            expense.adminResponse === "Rejected"
                              ? "text-danger"
                              : expense.adminResponse === "Pending"
                              ? "text-primary"
                              : "text-success"
                          }`}
                        >
                          {expense.adminResponse}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center">
                      No expenses found.
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

export default ExpenseView;
