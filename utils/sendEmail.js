const nodemailer = require('nodemailer');

// Nodemailer
const sendEmail = async (options) => {
  console.log( process.env.EMAIL_POR)
  // 1) Create transporter
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: process.env.HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass:  process.env.EMAIL_PASSWORD,
    },
  });
  // 2) Define email options
  const mailOpts = {
    from: `E-shop App <${process.env.EMAIL_USER}>`, // Use the user email from env
    to: options.email,
    subject: options.subject,
    text: options.message,
    // Optionally add HTML support
    // html: options.html,
  };

  // 3) Send email
  try {
    await transporter.sendMail(mailOpts);
  } catch (error) {
    console.error('Error sending email:', error); // Log error
    throw new Error('Email sending failed'); // Throw error to be handled upstream
  }
};

module.exports = sendEmail;