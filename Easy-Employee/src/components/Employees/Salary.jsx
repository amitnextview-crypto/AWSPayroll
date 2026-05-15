import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { viewEmployeeSalary } from "../../http";
import { toast } from "react-toastify";
import Loading from "../Loading";

const Salary = () => {
  const { user } = useSelector((state) => state.authSlice);
  const [salary, setSalary] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const obj = { employeeID: user._id || user.id };
        const res = await viewEmployeeSalary(obj);
        const { data } = res;
        if (data && data.length > 0) {
          setSalary(data[0]);
        } else {
          toast.error(`${user.name}'s salary not found`);
        }
      } catch (err) {
        toast.error("Error fetching salary details");
      }
    };
    fetchData();
  }, [user]);

  if (!salary) return <Loading />;

  const { earnings, deductions, netPay, assignedDate, month, year } = salary;

  return (
    <div className="main-content">
      <section className="section">
        <div className="card">
          <div className="card-header d-flex justify-content-between">
            <h4>Salary Details - {user?.name}</h4>
          </div>
        </div>

        <div className="card">
          <div className="card-body row">
            <div className="col-md-3">
              <img
                className="img-fluid img-thumbnail"
                src={
                  user?.profile
                }
                alt={user?.name || "User"}
              />
            </div>

            <div className="col-md-9">
              <h5 className="mb-3">Employee Details</h5>
              <table className="table table-bordered">
                <tbody>
                  <tr>
                    <th>Name</th>
                    <td>{user?.name}</td>
                  </tr>
                  <tr>
                    <th>Email</th>
                    <td>{user?.email}</td>
                  </tr>
                  <tr>
                    <th>Mobile</th>
                    <td>{user?.mobile}</td>
                  </tr>
                  <tr>
                    <th>Address</th>
                    <td>{user?.address}</td>
                  </tr>
                  <tr>
                    <th>Month</th>
                    <td>{month}</td>
                  </tr>
                  <tr>
                    <th>Year</th>
                    <td>{year}</td>
                  </tr>
                  <tr>
                    <th>Assigned Date</th>
                    <td>{assignedDate}</td>
                  </tr>
                </tbody>
              </table>

              <h5 className="mt-4 mb-3">Earnings</h5>
              <table className="table table-bordered">
                <tbody>
                  <tr>
                    <th>Basic</th>
                    <td>₹ {earnings?.basic}</td>
                  </tr>
                  <tr>
                    <th>HRA</th>
                    <td>₹ {earnings?.hra}</td>
                  </tr>
                  <tr>
                    <th>Conveyance</th>
                    <td>₹ {earnings?.conveyance}</td>
                  </tr>
                  <tr>
                    <th>Medical</th>
                    <td>₹ {earnings?.medical}</td>
                  </tr>
                  <tr>
                    <th>Special Allowance</th>
                    <td>₹ {earnings?.specialAllowance}</td>
                  </tr>
                  <tr>
                    <th>Overtime Hours</th>
                    <td>{earnings?.overtimeHours}</td>
                  </tr>
                  <tr>
                    <th>Overtime Rate</th>
                    <td>₹ {earnings?.overtimeRate}</td>
                  </tr>
                  <tr>
                    <th>Overtime Pay</th>
                    <td>₹ {earnings?.overtimePay}</td>
                  </tr>
                  <tr>
                    <th>Bonus</th>
                    <td>₹ {earnings?.bonus}</td>
                  </tr>
                  <tr>
                    <th>Other Benefits</th>
                    <td>₹ {earnings?.otherBenefits}</td>
                  </tr>
                  <tr className="table-success">
                    <th>Gross Salary</th>
                    <td><b>₹ {earnings?.gross}</b></td>
                  </tr>
                </tbody>
              </table>

              <h5 className="mt-4 mb-3">Deductions</h5>
              <table className="table table-bordered">
                <tbody>
                  <tr>
                    <th>PF Employee %</th>
                    <td>{deductions?.pfEmployeePercent}%</td>
                  </tr>
                  <tr>
                    <th>PF Employee</th>
                    <td>₹ {deductions?.pfEmployee}</td>
                  </tr>
                  <tr>
                    <th>PF Employer %</th>
                    <td>{deductions?.pfEmployerPercent}%</td>
                  </tr>
                  <tr>
                    <th>PF Employer</th>
                    <td>₹ {deductions?.pfEmployer}</td>
                  </tr>
                  <tr>
                    <th>ESI Employee %</th>
                    <td>{deductions?.esiEmployeePercent}%</td>
                  </tr>
                  <tr>
                    <th>ESI Employee</th>
                    <td>₹ {deductions?.esiEmployee}</td>
                  </tr>
                  <tr>
                    <th>ESI Employer %</th>
                    <td>{deductions?.esiEmployerPercent}%</td>
                  </tr>
                  <tr>
                    <th>ESI Employer</th>
                    <td>₹ {deductions?.esiEmployer}</td>
                  </tr>
                  <tr>
                    <th>Professional Tax</th>
                    <td>₹ {deductions?.professionalTax}</td>
                  </tr>
                  <tr>
                    <th>Loan Recovery</th>
                    <td>₹ {deductions?.loanRecovery}</td>
                  </tr>
                  <tr>
                    <th>TDS Monthly</th>
                    <td>₹ {deductions?.tdsMonthly}</td>
                  </tr>
                  <tr className="table-danger">
                    <th>Total Deductions</th>
                    <td><b>₹ {deductions?.totalDeductions}</b></td>
                  </tr>
                </tbody>
              </table>

              <h5 className="mt-4 mb-3 text-success">Net Pay</h5>
              <table className="table table-bordered">
                <tbody>
                  <tr className="table-primary">
                    <th>Net Pay (Take Home)</th>
                    <td><b>₹ {netPay?.toFixed(2)}</b></td>
                  </tr>
                </tbody>
              </table>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Salary;
