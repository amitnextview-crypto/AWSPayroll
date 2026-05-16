const transport = require('../configs/mail-config');
const mailTemplate = require('../templates/mail-template');
const ErrorHandler = require('../utils/error-handler');

const isConnectionError = (error) =>
  ['ETIMEDOUT', 'ESOCKET', 'ECONNECTION', 'ECONNRESET'].includes(error?.code) ||
  /timeout|connection/i.test(error?.message || '');

class MailService {
  sendForgotPasswordMail = async (name, email, otp) => {
    const { subject, text } = mailTemplate.forgotPassword(name, otp);
    return this.sendMail(email, subject, text);
  };

  sendMail = async (to, subject, text) => {
    const mailOption = {
      from: process.env.EMAIL_FROM || process.env.SMTP_AUTH_USER || process.env.SMTP_USER,
      to,
      subject,
      text,
    };
    try {
      const info = await transport.sendMail(mailOption);
      console.log('Mail sent successfully:', info.response);
      return info;
    } catch (error) {
      console.error('Mail send failed:', error.message);
      if (isConnectionError(error)) {
        throw ErrorHandler.serverError('Email service connection timed out. Please try again in a few minutes.');
      }
      throw ErrorHandler.serverError('Unable to send OTP email. Please check email settings and try again.');
    }
  };
}

module.exports = new MailService();
