import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getExpenseById_Admin, updateEmployeeExpense } from "../../http";
import { toast } from "react-toastify";
import Loading from "../Loading";

const Expense = () => {
  const { id } = useParams();
  const [expense, setExpense] = useState();

   const fetchExpense = async () => {
  try {
    const res = await getExpenseById_Admin(id);
    setExpense(res?.expense || {});
  } catch (err) {
    toast.error("Failed to load expense details");
    console.error(err);
  }
};

  useEffect(() => {
    fetchExpense();
  }, [id]);


  const approveExpense = async () => {
    if (expense.adminResponse === "Approved") {
      toast.error("Expense already approved");
      return;
    }
    const updated = { ...expense, adminResponse: "Approved" };
    const res = await updateEmployeeExpense(id, updated);
    if (res.success) {
      toast.success("Expense Approved");
  setExpense(updated);
     fetchExpense();
    }
  };

  const rejectExpense = async () => {
    if (expense.adminResponse === "Rejected") {
      toast.error("Expense already rejected");
      return;
    }
    const updated = { ...expense, adminResponse: "Rejected" };
    const res = await updateEmployeeExpense(id, updated);
    if (res.success) {
      toast.success("Expense Rejected");
      setExpense(updated);
      fetchExpense();
    }
  };

  return (
    <>
      {expense ? (
        <div className="main-content">
          <section className="section">
            <div className="card">
              <div className="card-header d-flex justify-content-between">
                <h4>Expense on {expense?.appliedDate}</h4>
              </div>
            </div>

            <div className="col-md-9">
              <table className="table">
                <tbody>
                  <tr>
                    <th>Type</th>
                    <td>{expense?.type}</td>
                  </tr>
                  <tr>
                    <th>Amount</th>
                    <td>₹{expense?.amount}</td>
                  </tr>
                  <tr>
                    <th>Description</th>
                    <td>{expense?.description}</td>
                  </tr>
                  <tr>
                    <th>Applied Date</th>
                    <td>{expense?.appliedDate}</td>
                  </tr>
                  <tr>
                    <th>Status</th>
                    <td
                      className={`${
                        expense?.adminResponse === "Rejected"
                          ? "text-danger"
                          : expense?.adminResponse === "Pending"
                          ? "text-primary"
                          : "text-success"
                      }`}
                    >
                      {expense?.adminResponse}
                    </td>
                  </tr>
                  {expense.billAttachment && (
                    <tr>
                      <th>Bill Attachment</th>
                      <td>
                        <a
                          href={expense.billAttachment}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Bill
                        </a>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <button
                onClick={approveExpense}
                className={`${
                  expense?.adminResponse === "Approved"
                    ? "btn-secondary"
                    : "btn-success"
                } btn btn-lg m-4 btn-icon-split`}
              >
                Approve
              </button>
              <button
                onClick={rejectExpense}
                className={`${
                  expense?.adminResponse === "Rejected"
                    ? "btn-secondary"
                    : "btn-danger"
                } btn btn-lg m-4 btn-icon-split`}
              >
                Reject
              </button>
            </div>
          </section>
        </div>
      ) : (
        <Loading />
      )}
    </>
  );
};

export default Expense;
