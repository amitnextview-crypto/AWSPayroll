const transport = require('../configs/mail-config');
const mailTemplate = require('../templates/mail-template');

class MailService {
  sendForgotPasswordMail = async (name, email, otp) => {
    const { subject, text } = mailTemplate.forgotPassword(name, otp);
    return this.sendMail(email, subject, text);
  };

  sendMail = async (to, subject, text) => {
    const mailOption = {
      from: process.env.SMTP_AUTH_USER || process.env.SMTP_USER,
      to,
      subject,
      text,
    };
    const info = await transport.sendMail(mailOption);
    console.log('Mail sent successfully:', info.response);
    return info;
  };
}

module.exports = new MailService();
