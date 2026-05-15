const transport = require('../configs/mail-config');
const mailTemplate = require('../templates/mail-template');
const smtpAuthUser = process.env.SMTP_AUTH_USER || 'socialcodia@gmail.com';

class MailService{


    sendForgotPasswordMail = async (name,email,otp) =>
    {
        const {subject,text} = mailTemplate.forgotPassword(name,otp);
        return await this.sendMail(email,subject,text);
    }


 sendMail  = async (to,subject,text) => {
  const mailOption = {
    from: process.env.SMTP_AUTH_USER,
    to,
    subject,
    text,
  };

  try {
    const info = await transport.sendMail(mailOption);
    console.log("✅ Mail sent successfully:", info.response);
  } catch (err) {
    console.error("❌ Mail send failed:", err);
  }
};

}

module.exports = new MailService();