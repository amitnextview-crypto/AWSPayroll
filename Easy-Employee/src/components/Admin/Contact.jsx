import React, { useState } from "react";
import HeaderSection from "../../components/HeaderSection";

const ContactPage = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Message submitted!");
  };

  return (
    <div className="main-content">
      <section className="section">

        <HeaderSection title="Contact Us" />

        <div className="card">
          <div className="card-header">
            <h4>Get in Touch</h4>
          </div>

          <div className="card-body">

            <p className="mb-4">
              Have questions? Need support? Contact us using the form below and we will get
              back to you as soon as possible.
            </p>

            <form onSubmit={handleSubmit}>

              <div className="row">

                {/* Name */}
                <div className="col-md-6 mb-3">
                  <label className="form-label">Your Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    placeholder="Enter your name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Email */}
                <div className="col-md-6 mb-3">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Message */}
                <div className="col-md-12 mb-3">
                  <label className="form-label">Message</label>
                  <textarea
                    name="message"
                    className="form-control"
                    rows="4"
                    placeholder="Write your message..."
                    value={form.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>

              </div>

              <button type="submit" className="btn btn-primary mt-2">
                Send Message
              </button>

            </form>

          </div>
        </div>

      </section>
    </div>
  );
};

export default ContactPage;
