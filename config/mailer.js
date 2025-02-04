const nodemailer = require("nodemailer");
const logger = require("../config/logger");

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

  logger.info(
    `[SEND EMAIL] Preparing to send email to ${to} with subject: "${subject}"`
  );

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      logger.error(
        `[SEND EMAIL] Error in sending email - Error: ${error.message}`
      );
      return console.log("Error in mail sending " + error);
    }
    logger.info(
      `[SEND EMAIL] Email sent successfully - Info: ${info.response}`
    );
  });
};
