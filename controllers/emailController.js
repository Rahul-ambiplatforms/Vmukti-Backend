const nodemailer = require('nodemailer');

const sendEmail = async (req, res) => {
  const { firstName, lastName, email, phone, message } = req.body;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.RECEIVING_EMAIL,
    subject: `New Contact Form Submission from ${firstName} ${lastName}`,
    html: `
      <h3>New Contact Form Submission</h3>
      <p><strong>Name:</strong> ${firstName} ${lastName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `,
  };

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
};

const sendEmailArcis = async (req, res) => {
  const { name, email, phone } = req.body;

  const mailOptions = {
    from: process.env.EMAIL_ARCIS_USER,
    to: process.env.RECEIVING_ARCIS_EMAIL,
    subject: `New Contact Form Submission from ${name}`,
    html: `
      <!DOCTYPE html>
<html>
<head>
  <style>
    body {
      background-color: rgb(150, 120, 225);
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #ffffff;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background-color: #ffffff;
      border-radius: 10px;
      padding: 30px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    .brand {
      font-size: 28px;
      font-weight: bold;
    }
    .brand .arcis {
      color: rgb(150, 120, 225);
    }
    .brand .ai {
      color: rgb(150, 120, 225);
    }
    h3 {
      color: rgb(150, 120, 225);
      border-bottom: 1px solid #ccc;
      padding-bottom: 10px;
    }
    p {
      font-size: 16px;
      color: #333;
      margin: 10px 0;
    }
    strong {
      color: rgb(91, 91, 91);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">
        <span class="arcis">Arcis</span><span class="ai">AI</span>
      </div>
    </div>
    <h3>New Contact Form Submission</h3>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
  </div>
</body>
</html>

    `,
  };

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_ARCIS_USER,
        pass: process.env.EMAIL_ARCIS_PASSWORD,
      },
    });

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
};

module.exports = {
  sendEmail,
  sendEmailArcis,
};