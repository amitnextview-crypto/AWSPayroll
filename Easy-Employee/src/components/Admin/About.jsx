import React from "react";
import HeaderSection from "../../components/HeaderSection";

const AboutPage = () => {
  return (
    <div className="main-content">
      <section className="section">

        <HeaderSection title="About Us" />

        <div className="card">
          <div className="card-header">
            <h4>About NextView Payroll</h4>
          </div>

          <div className="card-body">
            <p className="mb-3">
              <strong>NextView Payroll</strong> is a modern payroll & HR management
              solution designed to help businesses automate daily operations like
              attendance, salary calculation, leave management, and expense tracking.
            </p>

            <p className="mb-4">
              Our goal is to provide an easy-to-use platform that ensures accuracy,
              transparency, and efficiency in payroll processing.
            </p>

            <div className="row mt-4">

              <div className="col-md-6">
                <div className="card shadow-sm border-0 p-3">
                  <h5 className="mb-2">Our Vision</h5>
                  <p>
                    To revolutionize payroll management with simple,
                    automated, and intelligent HR solutions.
                  </p>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card shadow-sm border-0 p-3">
                  <h5 className="mb-2">Our Values</h5>
                  <p>
                    Accuracy, transparency, customer satisfaction, and
                    continuous improvement define our approach.
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>

      </section>
    </div>
  );
};

export default AboutPage;
