import React from 'react';
import { useSelector } from 'react-redux';

const Leader = () => {
  const { user } = useSelector((state) => state.authSlice);
  console.log(user);

  return (
    <div className="">
      <section className="section">
        <div className="card">
          <div className="card-header d-flex justify-content-between">
            <h4>Welcome {user?.name}</h4>
          </div>
        </div>

        <div className="card">
          <div className="card-body row">
            <div className="col-md-3">
              <img
                className="img-fluid img-thumbnail"
                src={user?.profile}
                alt={user?.name || "User"}
              />
            </div>

            <div className="col-md-9">
              <table className="table">
                <tbody>
                  <tr>
                    <th>Name</th>
                    <td>{user?.name}</td>
                  </tr>
                  <tr>
                    <th>Username</th>
                    <td>{user?.username}</td>
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
                    <th>Type</th>
                    <td>{user?.type}</td>
                  </tr>
                  <tr>
                    <th>Status</th>
                    <td>{user?.status}</td>
                  </tr>
                  <tr>
                    <th>Address</th>
                    <td>{user?.address}</td>
                  </tr>
                  <tr>
                    <th>Designation</th>
                    <td>{user?.designation}</td>
                  </tr>
                  <tr>
                    <th>Date</th>
                    <td>{user?.date}</td>
                  </tr>
                  <tr>
                    <th>PAN Number</th>
                    <td>{user?.panNumber}</td>
                  </tr>
                  <tr>
                    <th>Aadhaar Number</th>
                    <td>{user?.aadhaarNumber}</td>
                  </tr>
                  <tr>
                    <th>Bank Name</th>
                    <td>{user?.bankName}</td>
                  </tr>
                  <tr>
                    <th>Account Number</th>
                    <td>{user?.accountNumber}</td>
                  </tr>
                  <tr>
                    <th>IFSC Code</th>
                    <td>{user?.ifscCode}</td>
                  </tr>
                  <tr>
                    <th>Work Type</th>
                    <td>{user?.workType}</td>
                  </tr>
                  <tr>
                    <th>UAN</th>
                    <td>{user?.uan}</td>
                  </tr>
                  <tr>
                    <th>ESI</th>
                    <td>{user?.esi}</td>
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

export default Leader;
