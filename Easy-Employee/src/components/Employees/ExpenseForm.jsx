import React, { useState, useEffect } from "react";
import { addExpense, getEmployeeExpenses, updateExpense, deleteExpense } from "../../http";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Loading from "../Loading";

const ExpenseForm = () => {
  const { user } = useSelector((state) => state.authSlice);
  const [expense, setExpense] = useState({
    type: "",
    amount: "",
    description: "",
  });
  const [myExpenses, setMyExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState(null);

useEffect(() => {
    try {
       fetchMyExpenses();
    } catch (err) {
      console.error("Error fetching expenses:", err);
    } finally {
      setLoading(false);
    }
}, [expense, user]);


  // ==========================
// ==========================
// FETCH EMPLOYEE'S OWN EXPENSES
// ==========================
const fetchMyExpenses = async () => {
  try {
    // ❌ Pehle tu bhej raha tha: { employeeID: user._id }
    // ✅ Ab backend khud filter karega role ke base pe
    const res = await getEmployeeExpenses();

    setMyExpenses(Array.isArray(res.data) ? res.data : []);
  } catch (err) {
    console.error("Error fetching employee expenses:", err);
    toast.error("Failed to load your expenses");
  } finally {
    setLoading(false);
  }
};


  // ==========================
  // FORM HANDLERS
  // ==========================
  const handleChange = (field, value) => {
    setExpense({ ...expense, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = {
        employeeID: user._id,
        type: expense.type,
        amount: expense.amount,
        description: expense.description,
        appliedDate: new Date().toISOString().split("T")[0],
      };

      await addExpense(formData);
      toast.success("Expense submitted successfully!");
      setExpense({ type: "", amount: "", description: "", appliedDate: ""});
      fetchMyExpenses();
    } catch (err) {
      toast.error("Failed to submit expense");
      console.error(err);
    }
  };

  // ==========================
  // DELETE EXPENSE
  // ==========================
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      try {
        await deleteExpense(id);
        toast.success("Expense deleted successfully!");
        fetchMyExpenses();
      } catch (err) {
        toast.error("Failed to delete expense");
        console.error(err);
      }
    }
  };

  // ==========================
  // EDIT EXPENSE MODAL
  // ==========================
  const openEditModal = (expense) => {
    setEditData(expense);
    setEditModal(true);
  };

  const handleEditChange = (field, value) => {
    setEditData({ ...editData, [field]: value });
  };

  const handleEditSave = async () => {
    try {
      await updateExpense(editData._id, {
        type: editData.type,
        amount: editData.amount,
        description: editData.description,
      });
      toast.success("Expense updated successfully!");
      setEditModal(false);
      setEditData(null);
      fetchMyExpenses();
    } catch (err) {
      toast.error("Failed to update expense");
      console.error(err);
    }
  };

  // ==========================
  // RENDER
  // ==========================
  return (
    <div className="main-content">
      <section className="section">
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h4>Add Expense</h4>
          </div>

          <form onSubmit={handleSubmit} className="card-body">
            <div className="border rounded p-3 bg-light mb-3">
              <div className="row">
                <div className="form-group col-md-3">
                  <label>Expense Type</label>
                  <select
                    className="form-control"
                    value={expense.type}
                    onChange={(e) => handleChange("type", e.target.value)}
                    required
                  >
                    <option value="">Select</option>
                    <option>Travel</option>
                    <option>Food</option>
                    <option>Office Supplies</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="form-group col-md-3">
                  <label>Amount (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={expense.amount}
                    onChange={(e) => handleChange("amount", e.target.value)}
                    required
                  />
                </div>

                <div className="form-group col-md-6">
                  <label>Reason / Description</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Where did you spend?"
                    value={expense.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="text-center mt-4">
                <button type="submit" className="btn btn-primary btn-lg">
                  Submit
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* ==========================
          MY EXPENSES LIST SECTION
      ========================== */}
      <section className="section mt-5">
        <div className="card">
          <div className="card-header">
            <h4>My Expense Applications</h4>
          </div>
          <div className="card-body">
            {loading ? (
              <Loading />
            ) : myExpenses.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-striped table-md">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Applied Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myExpenses.map((exp, idx) => (
                      <tr key={exp._id || idx}>
                        <td>{idx + 1}</td>
                        <td>{exp.type}</td>
                        <td>₹{exp.amount}</td>
                        <td>{exp.appliedDate}</td>
                        <td
                          className={`${
                            exp.adminResponse === "Rejected"
                              ? "text-danger"
                              : exp.adminResponse === "Pending"
                              ? "text-primary"
                              : "text-success"
                          }`}
                        >
                          {exp.adminResponse}
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-warning mr-2"
                            onClick={() => openEditModal(exp)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(exp._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted">No expenses found.</p>
            )}
          </div>
        </div>
      </section>

      {/* ==========================
          EDIT MODAL
      ========================== */}
      {editModal && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Edit Expense</h5>
                <button className="close" onClick={() => setEditModal(false)}>
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Type</label>
                  <select
                    className="form-control"
                    value={editData.type}
                    onChange={(e) => handleEditChange("type", e.target.value)}
                  >
                    <option>Travel</option>
                    <option>Food</option>
                    <option>Office Supplies</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Amount (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editData.amount}
                    onChange={(e) => handleEditChange("amount", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editData.description}
                    onChange={(e) =>
                      handleEditChange("description", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setEditModal(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleEditSave}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseForm;
