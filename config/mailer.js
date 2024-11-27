const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: process.env.SMTP_SERVICE,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASS,
  },
});

module.exports = sendEmail = (to, subject, text) => {
  const mailOptions = {
    from: process.env.SMTP_EMAIL,
    to,
    subject,
    text,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(`Error in mail sending ` + error);
    }
    console.log("Email sent: " + info.response);
  });
};
