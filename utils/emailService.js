const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendOTPEmail = async (email, otp, purpose = 'login') => {
  let subject, html;
  
  if (purpose === 'reset-password') {
    subject = 'Password Reset OTP';
    html = `
      <h3>Password Reset Request</h3>
      <p>Use the following OTP to reset your password:</p>
      <h2>${otp}</h2>
      <p>This OTP is valid for 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;
  } else {
    subject = 'Your Login OTP';
    html = `
      <h3>Your One-Time Password (OTP)</h3>
      <p>Use the following OTP to complete your login:</p>
      <h2>${otp}</h2>
      <p>This OTP is valid for 10 minutes.</p>
    `;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };