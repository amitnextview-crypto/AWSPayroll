const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // ✅ Gmail ke liye direct service use karo
  auth: {
    user: process.env.SMTP_USER, // e.g. amitmaddheshiya099@gmail.com
    pass: process.env.SMTP_PASS, // Gmail app password (16-digit)
  },
  tls: {
    rejectUnauthorized: false, // ✅ Ignore self-signed SSL
  },
});

module.exports = transporter;
