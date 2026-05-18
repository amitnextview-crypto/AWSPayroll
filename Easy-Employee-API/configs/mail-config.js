const nodemailer = require("nodemailer");

const toBool = (value, defaultValue = false) => {
  if (value === undefined) return defaultValue;
  return String(value).toLowerCase() === "true";
};

const smtpUser = process.env.SMTP_USER || process.env.SMTP_AUTH_USER || process.env.EMAIL_USER;
const smtpPass = process.env.SMTP_PASS || process.env.SMTP_AUTH_PASS || process.env.EMAIL_PASS;
const port = Number(process.env.SMTP_PORT || 587);
const secure = toBool(process.env.SMTP_SECURE, port === 465);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port,
  secure,
  requireTLS: toBool(process.env.SMTP_REQUIRE_TLS, !secure),
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT || 30000),
  greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT || 30000),
  socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT || 45000),
});

module.exports = transporter;
