import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import HeaderSection from "../../components/HeaderSection";
import { getAllUsers } from "../../http";

const Employees = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const res = await getAllUsers();
      if (res.success) setUsers(res.data || []);
      setLoading(false);
    })();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) =>
      `${user.name || ""} ${user.email || ""}`.toLowerCase().includes(term)
    );
  }, [users, search]);

  const applyFilter = (e) => {
    e.preventDefault();
    setSearch(searchDraft);
  };

  const clearFilter = () => {
    setSearchDraft("");
    setSearch("");
  };

  const roleBadge = (type = "") => {
    const lower = String(type).toLowerCase();
    if (lower === "admin") return "badge-danger";
    if (lower === "leader") return "badge-warning";
    return "badge-primary";
  };

  const detailPath = (user) => `/edituser/${user.id || user._id}`;

  const profileSrc = (profile) =>
    profile && String(profile).startsWith("http") ? profile : "/assets/icons/user.png";

  return (
    <div className="main-content">
      <section className="section">
        <HeaderSection title="Employees" />

        <div className="card">
          <div className="card-header">
            <h4>Search & Filter</h4>
          </div>
          <div className="card-body">
            <form className="row align-items-end" onSubmit={applyFilter}>
              <div className="form-group col-md-8">
                <label>Search by Name or Email</label>
                <input
                  className="form-control"
                  placeholder="Enter employee name or email"
                  value={searchDraft}
                  onChange={(e) => setSearchDraft(e.target.value)}
                />
              </div>
              <div className="form-group col-md-4 d-flex">
                <button
                  className="btn btn-primary mr-2"
                  style={{ width: 140, height: 42 }}
                  type="submit"
                >
                  Apply Filter
                </button>
                <button
                  className="btn btn-light"
                  style={{ width: 100, height: 42 }}
                  type="button"
                  onClick={clearFilter}
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h4>All Employees, Leaders & Admins</h4>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-striped table-md center-text">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Username</th>
                    <th>Mobile</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Team</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Work Type</th>
                    <th>Joining Date</th>
                    <th>PAN</th>
                    <th>Aadhaar</th>
                    <th>Bank</th>
                    <th>Account</th>
                    <th>IFSC</th>
                    <th>UAN</th>
                    <th>ESI</th>
                    <th>Address</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading &&
                    filteredUsers.map((data, index) => (
                      <tr key={data.id || data._id || index}>
                        <td>{index + 1}</td>
                        <td>
                          <figure className="avatar">
                            <img src={profileSrc(data.profile)} alt={data.name} />
                          </figure>
                        </td>
                        <td>{data.name || "-"}</td>
                        <td>{data.email || "-"}</td>
                        <td>{data.username || "-"}</td>
                        <td>{data.mobile || "-"}</td>
                        <td>
                          <span className={`badge ${roleBadge(data.type)}`}>{data.type || "-"}</span>
                        </td>
                        <td>
                          <span className={`badge ${String(data.status).toLowerCase() === "active" ? "badge-success" : "badge-danger"}`}>
                            {data.status || "-"}
                          </span>
                        </td>
                        <td>{data.team?.name || "No Team"}</td>
                        <td>{data.department || "-"}</td>
                        <td>{data.designation || "-"}</td>
                        <td>{data.workType || "-"}</td>
                        <td>{data.date || "-"}</td>
                        <td>{data.panNumber || "-"}</td>
                        <td>{data.aadhaarNumber || "-"}</td>
                        <td>{data.bankName || "-"}</td>
                        <td>{data.accountNumber || "-"}</td>
                        <td>{data.ifscCode || "-"}</td>
                        <td>{data.uan || "-"}</td>
                        <td>{data.esi || "-"}</td>
                        <td style={{ minWidth: 180 }}>{data.address || "-"}</td>
                        <td>
                          <NavLink to={detailPath(data)} className="btn btn-secondary btn-sm">
                            Edit
                          </NavLink>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {!loading && !filteredUsers.length ? (
                <div className="text-center text-muted py-4">No employees found.</div>
              ) : null}
              {loading ? <div className="text-center text-muted py-4">Loading employees...</div> : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Employees;
