import React, { useEffect, useState } from 'react';
import { viewAllSalaries } from '../../http';
import { useHistory } from "react-router-dom";
import Loading from '../Loading';

const Salaries = () => {
  const history = useHistory();
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch all salaries (with populated employee details)
  const fetchSalaries = async (filter = {}) => {
    setLoading(true);
    try {
      const res = await viewAllSalaries(filter);
      if (res?.success) {
        setSalaries(res.data || []);
      } else {
        setSalaries([]);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSalaries();
  }, []);

  // ✅ Filter by selected employee
  const searchSalary = async () => {
    const filter = {};
    if (selectedEmployee) {
      filter.employeeID = selectedEmployee;
    }
    await fetchSalaries(filter);
  };

  if (loading) return <Loading />;

  return (
    <div className="main-content">
      <section className="section">
        <div className="card">
          <div className="card-header d-flex justify-content-between">
            <h4>Salaries</h4>
          </div>
        </div>

        {/* Dropdown */}
        <div className="d-flex justify-content-center align-items-center w-100">
          <div className="form-group col-md-6">
            <label>Employee</label>
            <select
              className="form-control select2"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="">All Employees</option>
              {salaries?.map(
                (s, idx) =>
                  s?.employeeID && (
                    <option key={idx} value={s.employeeID._id}>
                      {s.employeeID.name}
                    </option>
                  )
              )}
            </select>
          </div>
          <button onClick={searchSalary} className="btn btn-lg btn-primary col">
            Search
          </button>
        </div>
      </section>

      {/* Salary Table */}
      <div className="table-responsive">
        <table className="table table-striped table-md center-text">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Gross Salary</th>
              <th>Net Pay</th>
              <th>View & Update</th>
            </tr>
          </thead>
          <tbody>
            {salaries?.length > 0 ? (
              salaries.map((salary, idx) => (
                <tr
                  key={salary._id || idx}
                  className="hover-effect"
                >
                  <td>{idx + 1}</td>
                  <td>{salary.employeeID?.name || 'N/A'}</td>
                  <td>{salary.employeeID?.email || 'N/A'}</td>
                  <td>{salary.earnings?.gross ?? '—'}</td>
                  <td>{salary?.netPay ?? '—'}</td>
                  <td>
                    <button  onClick={() => history.push(`salary/${salary._id}`)} className="btn btn-primary btn-sm">
                      View & Update
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center">
                  No salary records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Salaries;
