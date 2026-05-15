import { useState } from "react";
import { toast } from "react-toastify";
import HeaderSection from "../../components/HeaderSection";
import { addUser } from "../../http";
import Modal from "../../components/modal/Modal";

const AddUser = () => {
  const [imagePreview, setImagePreview] = useState("/assets/icons/user.png");
  const [showPassword, setShowPassword] = useState(false);

  const initialState = {
    name: "",
    username: "",
    email: "",
    mobile: "",
    password: "",
    type: "Employee",
    workType: "Onsite", // ✅ added
    designation: "",
    address: "",
    profile: "",
    adminPassword: "",
    aadhaarNumber: "",
    panNumber: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    uan: "", // ✅ added
    esi: "", // ✅ added
  };

  const [formData, setFormData] = useState(initialState);
  const [showModal, setShowModal] = useState(false);

  const inputEvent = (e) => {
    const { name, value } = e.target;
    setFormData((old) => ({ ...old, [name]: value }));
  };

  const captureImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData((old) => ({ ...old, profile: file }));

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => setImagePreview(reader.result);
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const {
      name,
      username,
      email,
      mobile,
      password,
      type,
      workType, // ✅ added
      designation,
      address,
      profile,
      aadhaarNumber,
      panNumber,
      bankName,
      accountNumber,
      ifscCode,
      uan,
      esi, // ✅ added  
    } = formData;

    if (
      !name ||
      !username ||
      !email ||
      !mobile ||
      !password ||
      !type ||
      !workType || // ✅ added
      !designation ||
      !address ||
      !aadhaarNumber ||
      !panNumber ||
      !bankName ||
      !accountNumber ||
      !ifscCode ||
      !uan ||      // ✅ added
      !esi         // ✅ added
    )
      return toast.error("All fields are required");

    if (!profile) return toast.error("Please choose an image");

    if (type === "Admin" && !showModal) {
      setShowModal(true);
      return;
    }

    const fd = new FormData();
    Object.keys(formData).forEach((key) => fd.append(key, formData[key]));
    fd.append("username", formData.username);

    const { success, message } = await addUser(fd);
    if (success) {
      toast.success(message);
      setShowModal(false);
      setFormData({ ...initialState });
      setImagePreview("/assets/icons/user.png");
    } else {
      toast.error(message || "Failed to add user");
    }
  };

  const modalAction = () => setShowModal((prev) => !prev);

  return (
    <>
      {showModal && (
        <Modal close={modalAction} title="Add Admin" width="35%">
          {/* Modal content same as before */}
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
                placeholder={`Enter Your Password To Add ${formData.name} As An Admin`}
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
              form="addUserForm"
              style={{ width: "30vh" }}
            >
              Add {formData.type}
            </button>
          </div>
        </Modal>
      )}

      <div className="main-content">
        <section className="section">
          <HeaderSection title="Add User" />
          <div className="card">
            <div className="card-body pr-5 pl-5 m-1">
              <form className="row" onSubmit={onSubmit} id="addUserForm">
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
                  <label htmlFor="profile">
                    <img
                      className="rounded"
                      src={imagePreview}
                      width="120"
                      alt=""
                    />
                  </label>
                  <small className="form-text text-muted mt-2">
                    Click image to change profile photo
                  </small>
                </div>

                {/* Name */}
                <div className="form-group col-md-6">
                  <label>Enter Name</label>
                  <div className="input-group">
                    <div className="input-group-prepend">
                      <div className="input-group-text">
                        <i className="fas fa-user"></i>
                      </div>
                    </div>
                    <input
                      onChange={inputEvent}
                      value={formData.name}
                      type="text"
                      id="name"
                      name="name"
                      className="form-control"
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="form-group col-md-6">
                  <label>Username</label>
                  <div className="input-group">
                    <div className="input-group-prepend">
                      <div className="input-group-text">
                        <i className="fas fa-user-circle"></i>
                      </div>
                    </div>
                    <input
                      type="text"
                      name="username"
                      id="username"
                      className="form-control"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      placeholder="Enter username"
                      autoComplete="new-username"
                    />
                  </div>
                </div>

                {/* Email, Mobile, Password */}
                <div className="form-group col-md-6">
                  <label>Enter Email</label>
                  <div className="input-group">
                    <div className="input-group-prepend">
                      <div className="input-group-text">
                        <i className="fas fa-envelope"></i>
                      </div>
                    </div>
                    <input
                      onChange={inputEvent}
                      value={formData.email}
                      type="email"
                      id="email"
                      name="email"
                      className="form-control"
                    />
                  </div>
                </div>

                <div className="form-group col-md-3">
                  <label>Mobile Number</label>
                  <div className="input-group">
                    <div className="input-group-prepend">
                      <div className="input-group-text">
                        <i className="fas fa-phone"></i>
                      </div>
                    </div>
                    <input
                      onChange={inputEvent}
                      value={formData.mobile}
                      type="number"
                      id="mobile"
                      name="mobile"
                      className="form-control"
                    />
                  </div>
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

                {/* User Type and Work Type */}
                <div className="form-group col-md-3">
                  <label>User Type</label>
                  <select
                    name="type"
                    onChange={inputEvent}
                    value={formData.type}
                    className="form-control select2"
                  >
                    <option>Employee</option>
                    <option>Leader</option>
                    <option>Admin</option>
                  </select>
                </div>

                <div className="form-group col-md-3">
                  <label>Work Type</label> {/* ✅ Added field */}
                  <select
                    name="workType"
                    onChange={inputEvent}
                    value={formData.workType}
                    className="form-control select2"
                  >
                    <option>Onsite</option>
                    <option>Remote</option>
                    <option>Hybrid</option>
                  </select>
                </div>

                {/* Designation + Address */}
                <div className="form-group col-md-6">
                  <label>Designation</label>
                  <div className="input-group">
                    <div className="input-group-prepend">
                      <div className="input-group-text">
                        <i className="fas fa-briefcase"></i>
                      </div>
                    </div>
                    <input
                      onChange={inputEvent}
                      value={formData.designation}
                      type="text"
                      id="designation"
                      name="designation"
                      placeholder="e.g. Software Engineer"
                      className="form-control"
                    />
                  </div>
                </div>

                <div className="form-group col-md-6">
                  <label>Address</label>
                  <div className="input-group">
                    <div className="input-group-prepend">
                      <div className="input-group-text">
                        <i className="fas fa-map-marker-alt"></i>
                      </div>
                    </div>
                    <input
                      onChange={inputEvent}
                      value={formData.address}
                      type="text"
                      id="address"
                      name="address"
                      className="form-control"
                    />
                  </div>
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
                    type="text"
                    id="aadhaarNumber"
                    name="aadhaarNumber"
                    placeholder="XXXX-XXXX-XXXX"
                    className="form-control"
                  />
                </div>

                <div className="form-group col-md-6">
                  <label>PAN Number</label>
                  <input
                    onChange={inputEvent}
                    value={formData.panNumber}
                    type="text"
                    id="panNumber"
                    name="panNumber"
                    placeholder="ABCDE1234F"
                    className="form-control"
                  />
                </div>

                <div className="form-group col-md-4">
                  <label>Bank Name</label>
                  <input
                    onChange={inputEvent}
                    value={formData.bankName}
                    type="text"
                    id="bankName"
                    name="bankName"
                    className="form-control"
                  />
                </div>

                <div className="form-group col-md-4">
                  <label>Account Number</label>
                  <input
                    onChange={inputEvent}
                    value={formData.accountNumber}
                    type="text"
                    id="accountNumber"
                    name="accountNumber"
                    className="form-control"
                  />
                </div>

                <div className="form-group col-md-4">
                  <label>IFSC Code</label>
                  <input
                    onChange={inputEvent}
                    value={formData.ifscCode}
                    type="text"
                    id="ifscCode"
                    name="ifscCode"
                    className="form-control"
                  />
                </div>

                {/* ✅ New Fields */}
                <div className="form-group col-md-6">
                  <label>UAN Number</label>
                  <input
                    onChange={inputEvent}
                    value={formData.uan}
                    type="text"
                    id="uanNumber"
                    name="uan"
                    placeholder="UAN123456789"
                    className="form-control"
                  />
                </div>

                <div className="form-group col-md-6">
                  <label>ESI Number</label>
                  <input
                    onChange={inputEvent}
                    value={formData.esi}
                    type="text"
                    id="esiNumber"
                    name="esi"
                    placeholder="ESI123456789"
                    className="form-control"
                  />
                </div>

                <div className="form-group text-center col-md-12">
                  <button
                    className="btn btn-primary btn-lg"
                    type="submit"
                    style={{ width: "30vh" }}
                  >
                    Add {formData.type}
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

export default AddUser;
