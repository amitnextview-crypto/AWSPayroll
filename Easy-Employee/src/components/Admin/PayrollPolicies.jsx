import React, { useEffect, useState } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { getPayrollPolicies, updatePayrollPolicy } from "../../http";

const PayrollPolicies = () => {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const res = await getPayrollPolicies();
        const dataArray = res?.data?.data || res?.data || [];
        const firstPolicy = Array.isArray(dataArray) ? dataArray[0] : dataArray;
        if (firstPolicy?._id) setPolicy(firstPolicy);
        else toast.error("No valid policy found");
      } catch (err) {
        console.error(err);
        toast.error("Failed to load payroll policy");
      } finally {
        setLoading(false);
      }
    };
    fetchPolicy();
  }, []);

  const handleNestedChange = (path, value) => {
    setPolicy((prev) => {
      const updated = { ...prev };
      let target = updated.salaryRules;
      const keys = path.split(".");
      for (let i = 0; i < keys.length - 1; i++) {
        target = target[keys[i]];
      }
      target[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await updatePayrollPolicy(policy._id, policy);
      if (res?.success || res?.data) toast.success("Policy updated successfully");
      else toast.error("Update failed");
    } catch (err) {
      console.error(err);
      toast.error("Error while saving");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="text-center my-4">
        <Spinner animation="border" />
      </div>
    );

  if (!policy)
    return <div className="text-center text-danger">No policy found</div>;

  return (
    <div className="main-content">
      <section className="section">
        <div className="card">
          <div className="card-header">
            <h4>Salary Calculation Rules</h4>
          </div>

          <div className="card-body">
            <Form>
              <div className="border p-3 rounded mb-3 bg-light">

                {/* Working Days */}
                <Form.Group className="mt-3">
                  <Form.Label>Working Days in Month</Form.Label>
                  <Form.Control
                    type="number"
                    value={policy.salaryRules?.workingDaysInMonth || ""}
                    onChange={(e) =>
                      handleNestedChange("workingDaysInMonth", e.target.value)
                    }
                  />
                </Form.Group>

                {/* Pay for Approved Leaves */}
                <Form.Check
                  type="switch"
                  label="Pay for Approved Leaves (including Earning Days)"
                  checked={
                    policy.salaryRules?.payForApprovedLeaves?.enabled === "Yes"
                  }
                  onChange={(e) =>
                    handleNestedChange(
                      "payForApprovedLeaves.enabled",
                      e.target.checked ? "Yes" : "No"
                    )
                  }
                />

                {/* Pay for Approved Expenses */}
                <Form.Check
                  type="switch"
                  label="Pay for Approved Expenses"
                  checked={
                    policy.salaryRules?.payForExpenses?.enabled === "Yes"
                  }
                  onChange={(e) =>
                    handleNestedChange(
                      "payForExpenses.enabled",
                      e.target.checked ? "Yes" : "No"
                    )
                  }
                />

                {/* Half Day Rule */}
                <Form.Group className="mt-3">
                  <Form.Label>Half Day Deduction Fraction</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    value={policy.salaryRules?.halfDayRule?.fraction || 0.5}
                    onChange={(e) =>
                      handleNestedChange(
                        "halfDayRule.fraction",
                        parseFloat(e.target.value)
                      )
                    }
                  />
                  <Form.Text className="text-muted">
                    Example: 0.5 means half-day = 50% pay.
                  </Form.Text>
                </Form.Group>

                {/* Festival Holidays */}
                <Form.Group className="mt-4">
                  <Form.Label>Festival Holidays</Form.Label>
                  {(policy.salaryRules?.festivalHolidays?.days || []).map(
                    (date, i) => (
                      <div key={i} className="d-flex mb-2">
                        <Form.Control
                          type="date"
                          value={new Date(date).toISOString().split("T")[0]}
                          onChange={(e) => {
                            const updated =
                              [...policy.salaryRules.festivalHolidays.days];
                            updated[i] = e.target.value;
                            handleNestedChange("festivalHolidays.days", updated);
                          }}
                        />
                        <Button
                          size="sm"
                          variant="danger"
                          className="ms-2"
                          onClick={() => {
                            const updated =
                              policy.salaryRules.festivalHolidays.days.filter(
                                (_, idx) => idx !== i
                              );
                            handleNestedChange("festivalHolidays.days", updated);
                          }}
                        >
                          ✕
                        </Button>
                      </div>
                    )
                  )}
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => {
                      const updated = [
                        ...(policy.salaryRules.festivalHolidays.days || []),
                        "",
                      ];
                      handleNestedChange("festivalHolidays.days", updated);
                    }}
                  >
                    ➕ Add Festival Date
                  </Button>
                </Form.Group>

                {/* International Holidays */}
                <Form.Group className="mt-4">
                  <Form.Label>International Holidays</Form.Label>
                  {(policy.salaryRules?.internationalHolidays?.days || []).map(
                    (date, i) => (
                      <div key={i} className="d-flex mb-2">
                        <Form.Control
                          type="date"
                          value={new Date(date).toISOString().split("T")[0]}
                          onChange={(e) => {
                            const updated =
                              [...policy.salaryRules.internationalHolidays.days];
                            updated[i] = e.target.value;
                            handleNestedChange(
                              "internationalHolidays.days",
                              updated
                            );
                          }}
                        />
                        <Button
                          size="sm"
                          variant="danger"
                          className="ms-2"
                          onClick={() => {
                            const updated =
                              policy.salaryRules.internationalHolidays.days.filter(
                                (_, idx) => idx !== i
                              );
                            handleNestedChange(
                              "internationalHolidays.days",
                              updated
                            );
                          }}
                        >
                          ✕
                        </Button>
                      </div>
                    )
                  )}
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => {
                      const updated = [
                        ...(policy.salaryRules.internationalHolidays.days || []),
                        "",
                      ];
                      handleNestedChange("internationalHolidays.days", updated);
                    }}
                  >
                    ➕ Add International Date
                  </Button>
                </Form.Group>
              </div>

              <div className="text-center mt-4">
                <Button
                  variant="success"
                  onClick={handleSave}
                  disabled={saving}
                  style={{ width: "200px" }}
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PayrollPolicies;
