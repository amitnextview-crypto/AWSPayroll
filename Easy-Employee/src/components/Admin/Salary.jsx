import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { updateSalary, viewAllSalaries } from "../../http";
import { toast } from "react-toastify";
import Loading from "../Loading";
import HeaderSection from "../../components/HeaderSection";

const SalaryView = () => {
  const { id } = useParams();
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    basic: "",
    hra: "",
    conveyance: "",
    medical: "",
    specialAllowance: "",
    overtimeHours: "",
    overtimeRate: "",
    overtimePay: "",
    bonus: "",
    otherBenefits: "",
    reasonForBonus: "",
  });

  // Safe number conversion
  const n = (v) => (v === "" || v === null || v === undefined ? 0 : Number(v));

  // ===========================
  // FETCH EXISTING SALARY
  // ===========================
  useEffect(() => {
    const fetchSalary = async () => {
      try {
        const res = await viewAllSalaries({ _id: id });
        if (res?.success && res.data?.length) {
          const data = res.data[0];
          setSalary(data);
          setFormData({
            basic: data.earnings.basic || "",
            hra: data.earnings.hra || "",
            conveyance: data.earnings.conveyance || "",
            medical: data.earnings.medical || "",
            specialAllowance: data.earnings.specialAllowance || "",
            overtimeHours: data.earnings.overtimeHours || "",
            overtimeRate: data.earnings.overtimeRate || "",
            overtimePay: data.earnings.overtimePay || "",
            bonus: data.earnings.bonus || "",
            otherBenefits: data.earnings.otherBenefits || "",
            reasonForBonus: data.reasonForBonus || "",
          });
        } else toast.error("Salary record not found!");
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch salary!");
      }
      setLoading(false);
    };
    fetchSalary();
  }, [id]);

  // ===========================
  // FORM CHANGE HANDLER
  // ===========================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ===========================
  // GROSS CALCULATION
  // ===========================
  const calculateGross = () => {
    const {
      basic,
      hra,
      conveyance,
      medical,
      specialAllowance,
      overtimePay,
      bonus,
      otherBenefits,
    } = formData;

    return (
      n(basic) +
      n(hra) +
      n(conveyance) +
      n(medical) +
      n(specialAllowance) +
      n(overtimePay) +
      n(bonus) +
      n(otherBenefits)
    );
  };

  // ===========================
  // DEDUCTIONS + TDS CALCULATION
  // ===========================
  const pfEmployeePercent = 12;
  const pfEmployerPercent = 12;
  const esiEmployeePercent = 0;
  const esiEmployerPercent = 0;
  const professionalTax = 0;
  const loanRecovery = 0;

  const gross = calculateGross();
  const pfEmployee = (n(formData.basic) * pfEmployeePercent) / 100;
  const pfEmployer = (n(formData.basic) * pfEmployerPercent) / 100;
  const esiEmployee = (gross * esiEmployeePercent) / 100;
  const esiEmployer = (gross * esiEmployerPercent) / 100;

  // ---- TDS from slabs ----
  const calculateAnnualTDSFromSlabs = (annualTaxable) => {
    const slabs = [
      { upto: 1200000, rate: 0 },
      { upto: 1600000, rate: 0.15 },
      { upto: 2000000, rate: 0.2 },
      { upto: 2400000, rate: 0.25 },
      { upto: Infinity, rate: 0.3 },
    ];
    let remaining = annualTaxable;
    let tax = 0;
    let lower = 0;
    for (let i = 0; i < slabs.length; i++) {
      const slab = slabs[i];
      const cap = slab.upto;
      const slabAmount = Math.max(0, Math.min(cap - lower, remaining));
      if (slabAmount > 0) {
        tax += slabAmount * slab.rate;
        remaining -= slabAmount;
      }
      lower = cap;
      if (remaining <= 0) break;
    }
    return Math.max(0, tax);
  };

  const annualTaxable = Math.max(
    0,
    (gross - pfEmployee - professionalTax - esiEmployee) * 12
  );
  const annualTDS = calculateAnnualTDSFromSlabs(annualTaxable);
  const monthlyTDS = annualTDS / 12;

  const totalDeductions =
    pfEmployee + esiEmployee + professionalTax + loanRecovery + monthlyTDS;
  const netPay = Math.max(0, gross - totalDeductions);

  // ===========================
  // SUBMIT HANDLER
  // ===========================
  const onSubmit = async (e) => {
    e.preventDefault();

    const updatedEarnings = {
      basic: n(formData.basic),
      hra: n(formData.hra),
      conveyance: n(formData.conveyance),
      medical: n(formData.medical),
      specialAllowance: n(formData.specialAllowance),
      overtimeHours: n(formData.overtimeHours),
      overtimeRate: n(formData.overtimeRate),
      overtimePay: n(formData.overtimePay),
      bonus: n(formData.bonus),
      otherBenefits: n(formData.otherBenefits),
      gross,
    };

    const payload = {
      employeeID: salary.employeeID._id,
      earnings: updatedEarnings,
      deductions: {
        pfEmployeePercent,
        pfEmployee,
        pfEmployerPercent,
        pfEmployer,
        esiEmployeePercent,
        esiEmployee,
        esiEmployerPercent,
        esiEmployer,
        professionalTax,
        loanRecovery,
        tdsMonthly: monthlyTDS,
        totalDeductions,
      },
      netPay,
      reasonForBonus: formData.reasonForBonus,
    };

    try {
      const res = await updateSalary(payload);
      if (res?.success) toast.success("Salary updated successfully!");
      else toast.error(res?.message || "Update failed!");
    } catch (err) {
      console.error(err);
      toast.error("Error updating salary!");
    }
  };

  if (loading || !salary) return <Loading />;

  const emp = salary.employeeID;
  

  // ===========================
  // RENDER SECTION
  // ===========================
  return (
    <div className="main-content">
      <section className="section">
        <div className="card">
          <div className="card-header d-flex justify-content-between">
            <h4>
              Salary Details ({salary.month} {salary.year}) - {emp?.name}
            </h4>
          </div>
        </div>

        {/* ===================== Update Form ===================== */}
        <section className="section">
          <HeaderSection title="Update Salary" />
          <div className="card">
            <div className="card-body pr-5 pl-5 m-1">
              <form className="row" onSubmit={onSubmit}>
                {[
                  "basic",
                  "hra",
                  "conveyance",
                  "medical",
                  "specialAllowance",
                  "overtimeHours",
                  "overtimeRate",
                  "overtimePay",
                  "bonus",
                  "otherBenefits",
                ].map((field) => (
                  <div className="form-group col-md-6" key={field}>
                    <label>
                      {field
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (s) => s.toUpperCase())}
                    </label>
                    <input
                      type="number"
                      name={field}
                      value={formData[field]}
                      onChange={handleChange}
                      className="form-control"
                    />
                  </div>
                ))}

                <div className="form-group col-md-12">
                  <label>Reason for Bonus / Update</label>
                  <input
                    onChange={handleChange}
                    value={formData.reasonForBonus}
                    name="reasonForBonus"
                    type="text"
                    className="form-control"
                  />
                </div>

                {/* ==== Live Preview ==== */}
                <div className="form-group col-md-12 mt-4">
                  <h5 className="text-primary">Live Salary Preview</h5>
                  <table className="table table-bordered">
                    <tbody>
                      <tr><th>Gross Salary</th><td>₹ {gross.toFixed(2)}</td></tr>
                      <tr><th>PF (Employee)</th><td>- ₹ {pfEmployee.toFixed(2)}</td></tr>
                      <tr><th>ESI (Employee)</th><td>- ₹ {esiEmployee.toFixed(2)}</td></tr>
                      <tr><th>TDS (Monthly)</th><td>- ₹ {monthlyTDS.toFixed(2)}</td></tr>
                      <tr><th>Loan Recovery</th><td>- ₹ {loanRecovery.toFixed(2)}</td></tr>
                      <tr className="table-warning">
                        <th>Total Deductions</th>
                        <td><b>₹ {totalDeductions.toFixed(2)}</b></td>
                      </tr>
                      <tr className="table-success">
                        <th>Net Pay (Take Home)</th>
                        <td><b>₹ {netPay.toFixed(2)}</b></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="form-group col-md-12 text-center">
                  <button
                    className="btn btn-primary btn-lg mt-3"
                    type="submit"
                    style={{ width: "30vh" }}
                  >
                    Update Salary
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
};

export default SalaryView;
