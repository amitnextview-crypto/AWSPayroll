import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import HeaderSection from "../../components/HeaderSection";
import Loading from "../Loading";
import api from "../../http";
import { useHistory } from "react-router-dom";



const MonthlySalaries = () => {
   const history = useHistory();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/calculate-current-month-salaries");
      if (res.success) setRows(res.data || []);
      else toast.error(res.data?.message || "Failed to fetch salaries");
    } catch (err) {
      console.error("Error fetching salaries:", err);
      toast.error("Error fetching salaries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaries();
  }, []);

  if (loading) return <Loading />;

  return (
    <>
      <HeaderSection title="Current Month Salaries" />
      <div className="main-content  my-4 ">
        <section className=" card p-3">
          <div className="d-flex justify-content-between align-items-center mb-3 w-100">
            <h5>Current Month Salary Report</h5>
            <button className="btn btn-sm btn-outline-primary" onClick={fetchSalaries}>
              Refresh
            </button>
          </div>
          <div className="table-responsive">
            <table className="table table-bordered table-striped">
          <thead>
  <tr>
    <th>Name</th>
    <th>Email</th>
    <th>Month/Year</th>
    <th>Gross (₹)</th>
    <th>PF (₹)</th>
    <th>ESI (₹)</th>
    <th>TDS (₹)</th>
    <th>Other Deductions (₹)</th>
    <th>Monthly Net Pay (₹)</th>
     <th>Per Day Salary (₹)</th>
       <th>Total Present Days</th> {/* ✅ New Column */}
    <th>Till Date Salary (₹)</th>
    <th>Approved Expense (₹)</th>
    <th>Total Pay (₹)</th>
    <th>Payslip</th>

  </tr>
</thead>

<tbody>
  {rows.length > 0 ? (
    rows.map((r, i) => {

      console.log("ROW DATA:", r);  // 👈 यही सबसे important है

      return (
        <tr key={i}>
          <td>{r.name}</td>
          <td>{r.email}</td>
          <td>{`${r.month}/${r.year}`}</td>
          <td>{r.earnings?.gross?.toFixed(2) || "0.00"}</td>
          <td>{r.deductions?.pfEmployee?.toFixed(2) || "0.00"}</td>
          <td>{r.deductions?.esiEmployee?.toFixed(2) || "0.00"}</td>
          <td>{r.deductions?.tdsMonthly?.toFixed(2) || "0.00"}</td>
          <td>{r.deductions?.professionalTax?.toFixed(2) || "0.00"}</td>
          <td className="fw-bold text-primary">{r.netPay?.toFixed(2) || "0.00"}</td>
          <td>{r.perDaySalary?.toFixed(2) || "0.00"}</td>
          <td className="fw-bold text-info">{r.presentDays || 0}</td>
          <td className="fw-bold text-warning">{r.tillDateSalary?.toFixed(2) || "0.00"}</td>
          <td>{r.totalExpenses?.toFixed(2) || "0.00"}</td>
          <td className="fw-bold text-success">{r.totalPay?.toFixed(2) || "0.00"}</td>

          <td>
            <button
              className="btn btn-sm btn-primary"
              onClick={() =>
                history.push({
                  pathname: `/payslip/${r.employeeID}/${r.month}/${r.year}`, // 👈 यह बाद में सही करेंगे
                  state: { payslipData: r }
                })
              }
            >
              Payslip
            </button>
          </td>

        </tr>
      );
    })
  ) : (
    <tr>
      <td colSpan="13" className="text-center">No records found</td>
    </tr>
  )}
</tbody>

            </table>
          </div>
        </section>
        
      </div>
    </>
  );
};

export default MonthlySalaries;
