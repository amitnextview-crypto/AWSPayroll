import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { toast } from "react-toastify";
import HeaderSection from "../../components/HeaderSection";
import { updateUser, getUser } from "../../http";
import Modal from "../../components/modal/Modal";

const EditUser = () => {
  const initialState = {
    name: "",
    username: "",
    email: "",
    mobile: "",
    password: "",
    type: "Employee",
    workType: "", // ✅ new
    designation: "",
    address: "",
    profile: "",
    status: "Active",
    adminPassword: "",
    aadhaarNumber: "",
    panNumber: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    uan: "", // ✅ new
    esi: "", // ✅ new
  };

  const [imagePreview, setImagePreview] = useState("/assets/icons/user.png");
  const [formData, setFormData] = useState(initialState);
  const [updateFormData, setUpdatedFormData] = useState({});
  const [userType, setUserType] = useState("User");
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { id } = useParams();

  // 🧠 Fetch user data when component loads
  useEffect(() => {
    (async () => {
      const res = await getUser(id);
      if (res.success) {
        const data = res.data;
        setUserType(data.type);

        setFormData({
          name: data.name || "",
          username: data.username || "",
          email: data.email || "",
          mobile: data.mobile || "",
          password: "",
          type: data.type || "Employee",
          workType: data.workType || "", // ✅ load if exists
          designation: data.designation || "",
          address: data.address || "",
          profile: data.profile || "",
          status: data.status || "Active",
          adminPassword: "",
          aadhaarNumber: data.aadhaarNumber || "",
          panNumber: data.panNumber || "",
          bankName: data.bankName || "",
          accountNumber: data.accountNumber || "",
          ifscCode: data.ifscCode || "",
          uan: data.uan || "", // ✅
          esi: data.esi || "", // ✅
        });

        if (data.profile) {
          setImagePreview(res.data.profile);
        } else {
          setImagePreview("/assets/icons/user.png");
        }
      }
    })();
  }, [id]);

  // 🧩 Handle input field changes
  const inputEvent = (e) => {
    const { name, value } = e.target;
    setFormData((old) => ({ ...old, [name]: value }));
    setUpdatedFormData((old) => ({ ...old, [name]: value }));
  };

  // 🖼️ Handle profile image capture
  const captureImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormData((old) => ({ ...old, profile: file }));
    setUpdatedFormData((old) => ({ ...old, profile: file }));

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  // 🚀 Submit updated data
  const onSubmit = async (e) => {
    e.preventDefault();

    const fd = new FormData();
    Object.keys(updateFormData).forEach((key) => {
      if (key === "profile" || key === "image") return;
      fd.append(key, updateFormData[key]);
    });

    if (updateFormData.profile) {
      fd.append("profile", updateFormData.profile);
    }

    const { success, message } = await updateUser(id, fd);
    if (success) {
      toast.success(message || "User updated successfully");
    } else {
      toast.error(message || "Failed to update user");
    }
  };

  const modalAction = () => setShowModal((prev) => !prev);

  return (
    <>
      {showModal && (
        <Modal close={modalAction} title="Update User" width="35%">
          <div className="row" style={{ margin: "20px" }}>
            <div className="col col-md-4 text-center">
              <img className="rounded" src={imagePreview} width="120" alt="" />
            </div>
            <div className="col col-md-8">
              <table className="table table-md">
                <tbody>
                  <tr>
                    <th>Name</th>
                    <td>{formData.name}</td>
                  </tr>
                  <tr>
                    <th>Email</th>
                    <td>{formData.email}</td>
                  </tr>
                  <tr>
                    <th>User Type</th>
                    <td>{formData.type}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="form-group col-md-12">
            <label>Enter Your Password</label>
            <div className="input-group">
              <div className="input-group-prepend">
                <div className="input-group-text">
                  <i className="fas fa-lock"></i>
                </div>
              </div>
              <input
                onChange={inputEvent}
                value={formData.adminPassword}
                type="password"
                placeholder={`Enter Your Password To Change ${formData.name}'s Type`}
                id="adminPassword"
                name="adminPassword"
                className="form-control"
              />
            </div>
          </div>

          <div className="text-center mb-3">
            <button
              className="btn btn-primary btn-lg"
              type="submit"
              form="updateUserForm"
              style={{ width: "30vh" }}
            >
              Update {formData.type}
            </button>
          </div>
        </Modal>
      )}

      <div className="main-content">
        <section className="section">
          <HeaderSection title={`Edit ${userType}`} />
          <div className="card">
            <div className="card-body pr-5 pl-5 m-1">
              <form className="row" onSubmit={onSubmit} id="updateUserForm">
                {/* Profile Upload */}
                <div className="form-group col-md-12 text-center">
                  <input
                    type="file"
                    id="profile"
                    name="profile"
                    className="form-control d-none"
                    onChange={captureImage}
                    accept="image/*"
                  />
                  <label htmlFor="profile" style={{ cursor: "pointer" }}>
                    <img
                      src={imagePreview || "/assets/icons/user.png"}
                      alt="User"
                      width="130"
                      height="130"
                      style={{
                        objectFit: "cover",
                        borderRadius: "50%",
                        border: "3px solid #ddd",
                        boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
                        transition: "0.3s",
                      }}
                    />
                  </label>
                  <small className="form-text text-muted mt-2">
                    Click image to change profile photo
                  </small>
                </div>

                {/* Basic Info */}
                <div className="form-group col-md-4">
                  <label>Name</label>
                  <input
                    onChange={inputEvent}
                    value={formData.name}
                    name="name"
                    type="text"
                    className="form-control"
                  />
                </div>

                <div className="form-group col-md-4">
                  <label>Email</label>
                  <input
                    onChange={inputEvent}
                    value={formData.email}
                    name="email"
                    type="email"
                    className="form-control"
                  />
                </div>

                <div className="form-group col-md-4">
                  <label>Username</label>
                  <input
                    onChange={inputEvent}
                    value={formData.username}
                    name="username"
                    type="text"
                    className="form-control"
                  />
                </div>

                <div className="form-group col-md-3">
                  <label>Mobile Number</label>
                  <input
                    onChange={inputEvent}
                    value={formData.mobile}
                    name="mobile"
                    type="tel"
                    className="form-control"
                  />
                </div>
<div className="form-group col-md-3">
  <label>Password</label>
  <div className="input-group">
    <div className="input-group-prepend">
      <div className="input-group-text">
        <i className="fas fa-lock"></i>
      </div>
    </div>
    <input
      onChange={inputEvent}
      value={formData.password}
      type={showPassword ? "text" : "password"}
      id="password"
      name="password"
      className="form-control"
    />
    <div
      className="input-group-append"
      onClick={() => setShowPassword(!showPassword)}
      style={{ cursor: "pointer" }}
    >
      <div className="input-group-text">
        <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
      </div>
    </div>
  </div>
</div>

                <div className="form-group col-md-3">
                  <label>User Type</label>
                  <select
                    name="type"
                    onChange={inputEvent}
                    value={formData.type}
                    className="form-control"
                  >
                    <option>Employee</option>
                    <option>Leader</option>
                    <option>Admin</option>
                  </select>
                </div>

                {/* ✅ New Work Type Field */}
                <div className="form-group col-md-3">
                  <label>Work Type</label>
                  <select
                    name="workType"
                    onChange={inputEvent}
                    value={formData.workType}
                    className="form-control"
                  >
                    <option value="">Select</option>
                    <option value="Onsite">Onsite</option>
                    <option value="Remote">Remote</option>
                     <option value="Onsite">Hybrid</option>
                  </select>
                </div>

                <div className="form-group col-md-12">
                  <label>Address</label>
                  <input
                    onChange={inputEvent}
                    value={formData.address}
                    name="address"
                    type="text"
                    className="form-control"
                  />
                </div>

                <div className="form-group col-md-6">
                  <label>Designation</label>
                  <input
                    onChange={inputEvent}
                    value={formData.designation}
                    name="designation"
                    type="text"
                    className="form-control"
                  />
                </div>

                {/* Personal & Bank Details */}
                <div className="col-md-12 mt-3">
                  <h5 className="text-primary">Personal & Bank Details</h5>
                  <hr />
                </div>

                <div className="form-group col-md-6">
                  <label>Aadhaar Number</label>
                  <input
                    onChange={inputEvent}
                    value={formData.aadhaarNumber}
                    name="aadhaarNumber"
                    type="text"
                    className="form-control"
                  />
                </div>

                <div className="form-group col-md-6">
                  <label>PAN Number</label>
                  <input
                    onChange={inputEvent}
                    value={formData.panNumber}
                    name="panNumber"
                    type="text"
                    className="form-control"
                  />
                </div>

                <div className="form-group col-md-4">
                  <label>Bank Name</label>
                  <input
                    onChange={inputEvent}
                    value={formData.bankName}
                    name="bankName"
                    type="text"
                    className="form-control"
                  />
                </div>

                <div className="form-group col-md-4">
                  <label>Account Number</label>
                  <input
                    onChange={inputEvent}
                    value={formData.accountNumber}
                    name="accountNumber"
                    type="text"
                    className="form-control"
                  />
                </div>

                <div className="form-group col-md-4">
                  <label>IFSC Code</label>
                  <input
                    onChange={inputEvent}
                    value={formData.ifscCode}
                    name="ifscCode"
                    type="text"
                    className="form-control"
                  />
                </div>

                {/* ✅ New Fields: UAN & ESI */}
                <div className="form-group col-md-6">
                  <label>UAN Number</label>
                  <input
                    onChange={inputEvent}
                    value={formData.uan}
                    name="uan"
                    type="text"
                    className="form-control"
                  />
                </div>

                <div className="form-group col-md-6">
                  <label>ESI Number</label>
                  <input
                    onChange={inputEvent}
                    value={formData.esi}
                    name="esi"
                    type="text"
                    className="form-control"
                  />
                </div>

                <div className="form-group text-center col-md-12">
                  <button
                    className="btn btn-primary btn-lg"
                    type="submit"
                    style={{ width: "30vh" }}
                  >
                    Update {userType}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default EditUser;
