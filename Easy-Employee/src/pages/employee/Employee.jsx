import { useEffect, useState } from "react";
import { useParams, NavLink } from "react-router-dom";
import { getUser, deleteUser } from "../../http";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Employee = () => {
  const [user, setUser] = useState({
    name: "",
    email: "",
    mobile: "",
    profile: "",
    address: "",
    status: "",
    type: "",
    designation: "",
    panNumber: "",
    aadhaarNumber: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    workType: "", // ✅ Added
    uan: "", // ✅ Added
    esi: "", // ✅ Added
    date: "",
  });

  const { id } = useParams();

  useEffect(() => {
    (async () => {
      const res = await getUser(id);
      if (res.success) setUser(res.data);
    })();
  }, [id]);

  return (
    <>
      <div className="main-content">
        <section className="section">
          <div className="section-header d-flex justify-content-between align-items-center">
            <h1>Employee</h1>
            <div>
              <NavLink
                to={`/edituser/${id}`}
                className="btn btn-primary me-3"
                style={{ marginRight: "15px" }}
              >
                {user.type === "Leader" ? "Edit Leader" : "Edit Employee"}
              </NavLink>
              <button
                className="btn btn-danger"
                onClick={async () => {
                  if (window.confirm("Are you sure you want to delete this user?")) {
                    const res = await deleteUser(id);
                    if (res.success) {
                      toast.success("User deleted successfully");
                      // ✅ Redirect based on user type
                      if (user.type === "Leader") {
                        window.location.href = "/leaders";
                      } else {
                        window.location.href = "/employees";
                      }
                    } else {
                      toast.error(res.message || "Failed to delete user");
                    }
                  }
                }}
              >
                {user.type === "Leader" ? "Delete Leader" : "Delete Employee"}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-body row">
              <div className="col-md-3">
                <img className="img-fluid img-thumbnail" src={user.profile} alt="" />
              </div>
              <div className="col-md-9">
                <table className="table">
                  <tbody>
                    <tr>
                      <th>Name</th>
                      <td>{user.name}</td>
                    </tr>
                    <tr>
                      <th>Username</th>
                      <td>{user.username}</td>
                    </tr>
                    <tr>
                      <th>Email</th>
                      <td>{user.email}</td>
                    </tr>
                    <tr>
                      <th>Mobile</th>
                      <td>{user.mobile}</td>
                    </tr>
                    <tr>
                      <th>Address</th>
                      <td>{user.address}</td>
                    </tr>
                    <tr>
                      <th>Type</th>
                      <td>{user.type}</td>
                    </tr>
                    <tr>
                      <th>Status</th>
                      <td>{user.status}</td>
                    </tr>
                    <tr>
                      <th>Designation</th>
                      <td>{user.designation}</td>
                    </tr>
                    <tr>
                      <th>Work Type</th> {/* ✅ Added */}
                      <td>{user.workType}</td>
                    </tr>
                    <tr>
                      <th>UAN</th> {/* ✅ Added */}
                      <td>{user.uan}</td>
                    </tr>
                    <tr>
                      <th>ESI</th> {/* ✅ Added */}
                      <td>{user.esi}</td>
                    </tr>
                    <tr>
                      <th>Pan Number</th>
                      <td>{user.panNumber}</td>
                    </tr>
                    <tr>
                      <th>Aadhaar Number</th>
                      <td>{user.aadhaarNumber}</td>
                    </tr>
                    <tr>
                      <th>Bank Name</th>
                      <td>{user.bankName}</td>
                    </tr>
                    <tr>
                      <th>Account Number</th>
                      <td>{user.accountNumber}</td>
                    </tr>
                    <tr>
                      <th>IFSC Code</th>
                      <td>{user.ifscCode}</td>
                    </tr>
                    <tr>
                      <th>Date</th>
                      <td>
                        {user.date ? new Date(user.date).toLocaleDateString() : "-"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Employee;
