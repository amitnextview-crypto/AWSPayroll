const nodemailer = require("nodemailer");

const toBool = (value, defaultValue = false) => {
  if (value === undefined) return defaultValue;
  return String(value).toLowerCase() === "true";
};

const port = Number(process.env.SMTP_PORT || 587);
const secure = toBool(process.env.SMTP_SECURE, port === 465);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port,
  secure,
  requireTLS: toBool(process.env.SMTP_REQUIRE_TLS, !secure),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT || 15000),
  greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT || 15000),
  socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT || 20000),
});

module.exports = transporter;
