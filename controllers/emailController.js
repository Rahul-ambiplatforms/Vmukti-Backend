const nodemailer = require("nodemailer");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

//---Contact/Blog form email---VMUKTI
const sendEmail = async (req, res) => {
  const {
    fullName,
    email,
    phone,
    message,
    formType,
    country,
    city,
    businessProfile,
    companyName,
    inquiryType,
  } = req.body;

  // console.log("Received form data initial:", req.body);
  let name = "";
  if (fullName) name = fullName;

  const subjectSource = formType === "Blog" ? "Blog" : "Contact";
  // console.log("Received form data:", req.body);

  // console.log("EMAIL SEND TO", process.env.RECEIVING_EMAIL);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.RECEIVING_EMAIL,
    subject: `New ${subjectSource} Form Submission from ${name}`,
    html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding: 20px 0;">
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; border: 1px solid #dddddd; border-radius: 8px;">
              
              <!-- Header with Logo -->
              <tr>
                <td align="center" style="padding: 20px 0 20px 0;">
                  <img src="https://vmukti.com/assets/VMukti_logo.png" alt="VMukti Logo" width="150" style="display: block;" />
                </td>
              </tr>
              
              <!-- Title -->
              <tr>
                <td style="padding: 0 30px;">
                  <h1 style="font-size: 24px; margin: 0; color: #333333; text-align: center;">New ${subjectSource} Lead</h1>
                  <hr style="margin: 20px 0; border: 0; border-top: 1px solid #eeeeee;">
                </td>
              </tr>
              
              <!-- Submission Details -->
              <tr>
                <td style="padding: 10px 30px 30px 30px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 16px; line-height: 1.6; color: #555555;">
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold; width: 150px;">Name:</td>
                      <td style="padding: 8px 0;">${name}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold;">Email:</td>
                      <td style="padding: 8px 0;">${
                        email || "Not provided"
                      }</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold;">Phone:</td>
                      <td style="padding: 8px 0;">${
                        phone && typeof phone === "object"
                          ? `${phone.code} ${phone.number}`
                          : phone || "Not provided"
                      }</td>
                    </tr>
                    ${
                      companyName
                        ? `<tr><td style="padding: 8px 0; font-weight: bold;">Company:</td><td style="padding: 8px 0;">${companyName}</td></tr>`
                        : ""
                    }
                    ${
                      country
                        ? `<tr><td style="padding: 8px 0; font-weight: bold;">Country:</td><td style="padding: 8px 0;">${country}</td></tr>`
                        : ""
                    }
                    ${
                      city
                        ? `<tr><td style="padding: 8px 0; font-weight: bold;">City:</td><td style="padding: 8px 0;">${city}</td></tr>`
                        : ""
                    }
                    ${
                      businessProfile
                        ? `<tr><td style="padding: 8px 0; font-weight: bold;">Business Profile:</td><td style="padding: 8px 0;">${businessProfile}</td></tr>`
                        : ""
                    }
                    ${
                      inquiryType
                        ? `<tr><td style="padding: 8px 0; font-weight: bold;">Inquiry Type:</td><td style="padding: 8px 0;">${inquiryType}</td></tr>`
                        : ""
                    }
                  </table>
                </td>
              </tr>
              
              <!-- Message Section -->
              ${
                message
                  ? `
              <tr>
                <td style="padding: 0 30px 30px 30px;">
                   <hr style="margin: 0 0 20px 0; border: 0; border-top: 1px solid #eeeeee;">
                  <p style="font-size: 16px; margin: 0 0 10px 0; color: #333333; font-weight: bold;">Message:</p>
                  <p style="font-size: 16px; line-height: 1.6; color: #555555; margin: 0; white-space: pre-wrap;">${message}</p>
                </td>
              </tr>
              `
                  : ""
              }
              
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 30px; background-color: #f8f8f8; border-top: 1px solid #dddddd; text-align: center; font-size: 12px; color: #999999; border-radius: 0 0 8px 8px;">
                  This is an automated notification. Please do not reply directly to this email.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `,
  };

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
};

//---Contact/Blog form email---ARCIS
const sendEmailArcis = async (req, res) => {
  // Destructure all the fields from the request body
  const {
    name,
    email,
    phone,
    company,
    location,
    customerType,
    camerasFor,
    customerQuantity,
    message,
    leadType,
    updates,
  } = req.body;

  // --- CHANGE 1: Determine subject/title source from leadType ---
  const subjectSource = leadType || "Website Lead";

  try {
    const EMS_API_URL =
      "https://c-r-m-icr7b.ondigitalocean.app/backend/api/crmSales/createLead";
    const leadData = {
      name: name,
      mobile: phone,
      email: email,
      company: company,
      location: location,
      industryType: camerasFor,
      customerType: customerType,
      leadType: leadType,
      requirement: [],
      customerQuantity: customerQuantity,
    };

    try {
      console.log("Attempting to create lead in EMS:", leadData);
      const response = await axios.post(EMS_API_URL, leadData);
      console.log("Lead created successfully in EMS:", response);
    } catch (apiError) {
      console.error(
        "CRITICAL: Failed to create lead in EMS API. The email will still be sent as a backup."
      );
      if (apiError.response) {
        console.error("API Error Data:", apiError.response.data);
        console.error("API Error Status:", apiError.response.status);
      } else {
        console.error("API Error Message:", apiError.message);
      }
    }

    const logoUrl = "https://arcisai.io/images/ArcisAi.png";
    const mailOptions = {
      from: process.env.EMAIL_ARCIS_USER,
      to: process.env.RECEIVING_ARCIS_EMAIL,
      // --- CHANGE 2: Updated subject line ---
      subject: `New Arcis ${subjectSource}: ${company || name}`,
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>New ArcisAI ${subjectSource}</title>
        <style>
          body { margin:0; padding:0; background:#f5f6fa; }
          table { border-collapse:collapse; }
          img { border:0; line-height:100%; outline:none; text-decoration:none; }
          .font { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
        </style>
      </head>
      <body class="font" style="margin:0;padding:0;background:#f5f6fa;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;visibility:hidden;">
          New ${subjectSource} submission from ${company || name}.
        </div>
        <table role="presentation" width="100%" bgcolor="#f5f6fa" style="background:#f5f6fa;">
          <tr>
            <td align="center" style="padding:32px 12px;">
              <table role="presentation" width="600" bgcolor="#ffffff"
                  style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;box-shadow:0 1px 0 rgba(0,0,0,0.04);">
                <tr>
                  <td align="center" style="padding:32px 32px 8px;">
                    <img src="${logoUrl}" alt="ArcisAI" height="28" style="height:28px;display:block;margin:0 auto 8px;" />
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:4px 32px 24px;">
                    <h1 class="font" style="margin:0;font-weight:700;font-size:22px;line-height:1.3;color:#111213;">
                      New ${subjectSource} Submission
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 32px 24px;">
                    <table role="presentation" width="100%" style="width:100%; border-spacing:0;">
                      ${
                        name
                          ? `<tr>
                              <td class="font" align="right" width="160" style="width:160px; padding:8px 12px 8px 0; font-weight:700; color:#333333; text-align:right; border-bottom: 1px solid #f0f2f5;">Name:</td>
                              <td class="font" align="left" style="padding:8px 0 8px 12px; color:#555555; text-align:left; border-bottom: 1px solid #f0f2f5;">${name}</td>
                            </tr>`
                          : ""
                      }
                      ${
                        company
                          ? `<tr>
                              <td class="font" align="right" width="160" style="width:160px; padding:8px 12px 8px 0; font-weight:700; color:#333333; text-align:right; border-bottom: 1px solid #f0f2f5;">Company:</td>
                              <td class="font" align="left" style="padding:8px 0 8px 12px; color:#555555; text-align:left; border-bottom: 1px solid #f0f2f5;">${company}</td>
                            </tr>`
                          : ""
                      }
                      ${
                        email
                          ? `<tr>
                              <td class="font" align="right" width="160" style="width:160px; padding:8px 12px 8px 0; font-weight:700; color:#333333; text-align:right; border-bottom: 1px solid #f0f2f5;">Email:</td>
                              <td class="font" align="left" style="padding:8px 0 8px 12px; color:#555555; text-align:left; border-bottom: 1px solid #f0f2f5;">${email}</td>
                            </tr>`
                          : ""
                      }
                      ${
                        phone
                          ? `<tr>
                              <td class="font" align="right" width="160" style="width:160px; padding:8px 12px 8px 0; font-weight:700; color:#333333; text-align:right; border-bottom: 1px solid #f0f2f5;">Phone:</td>
                              <td class="font" align="left" style="padding:8px 0 8px 12px; color:#555555; text-align:left; border-bottom: 1px solid #f0f2f5;">${phone}</td>
                            </tr>`
                          : ""
                      }
                      ${
                        location
                          ? `<tr>
                              <td class="font" align="right" width="160" style="width:160px; padding:8px 12px 8px 0; font-weight:700; color:#333333; text-align:right; border-bottom: 1px solid #f0f2f5;">Location:</td>
                              <td class="font" align="left" style="padding:8px 0 8px 12px; color:#555555; text-align:left; border-bottom: 1px solid #f0f2f5;">${location}</td>
                            </tr>`
                          : ""
                      }
                      ${
                        customerType
                          ? `<tr>
                              <td class="font" align="right" width="160" style="width:160px; padding:8px 12px 8px 0; font-weight:700; color:#333333; text-align:right; border-bottom: 1px solid #f0f2f5;">Customer Type:</td>
                              <td class="font" align="left" style="padding:8px 0 8px 12px; color:#555555; text-align:left; border-bottom: 1px solid #f0f2f5;">${customerType}</td>
                            </tr>`
                          : ""
                      }
                      ${
                        camerasFor
                          ? `<tr>
                              <td class="font" align="right" width="160" style="width:160px; padding:8px 12px 8px 0; font-weight:700; color:#333333; text-align:right; border-bottom: 1px solid #f0f2f5;">Wants Cameras For:</td>
                              <td class="font" align="left" style="padding:8px 0 8px 12px; color:#555555; text-align:left; border-bottom: 1px solid #f0f2f5;">${camerasFor}</td>
                            </tr>`
                          : ""
                      }
                      ${
                        customerQuantity
                          ? `<tr>
                              <td class="font" align="right" width="160" style="width:160px; padding:8px 12px 8px 0; font-weight:700; color:#333333; text-align:right; border-bottom: 1px solid #f0f2f5;">Customer Quantity:</td>
                              <td class="font" align="left" style="padding:8px 0 8px 12px; color:#555555; text-align:left; border-bottom: 1px solid #f0f2f5;">${customerQuantity}</td>
                            </tr>`
                          : ""
                      }
                      ${
                        leadType
                          ? `<tr>
                              <td class="font" align="right" width="160" style="width:160px; padding:8px 12px 8px 0; font-weight:700; color:#333333; text-align:right; border-bottom: 1px solid #f0f2f5;">Lead Source:</td>
                              <td class="font" align="left" style="padding:8px 0 8px 12px; color:#555555; text-align:left; border-bottom: 1px solid #f0f2f5;">${leadType}</td>
                            </tr>`
                          : ""
                      }
                      ${
                        updates
                          ? `<tr>
                              <td class="font" align="right" width="160" style="width:1Both 160px; padding:8px 12px 8px 0; font-weight:700; color:#333333; text-align:right; border-bottom: 1px solid #f0f2f5;">Wants Updates:</td>
                              <td class="font" align="left" style="padding:8px 0 8px 12px; color:#555555; text-align:left; border-bottom: 1px solid #f0f2f5;">Yes</td>
                            </tr>`
                          : ""
                      }
                    </table>
                  </td>
                </tr>
                
                ${
                  message
                    ? `
                <tr>
                  <td align="left" style="padding: 16px 32px 24px 32px; border-top: 1px solid #f0f2f5;">
                    <p class="font" style="margin:0 0 8px 0; font-weight:700; color:#333333;">Message:</p>
                    <p class="font" style="margin:0; color:#555555; white-space: pre-wrap; line-height: 1.6;">${message}</p>
                  </td>
                </tr>
                `
                    : ""
                }
                
                <tr>
                  <td align="center" style="padding:16px 24px 24px; border-top:2.5px solid #f5f6fa;">
                    <p class="font" style="margin:0;font-size:13px;color:#8a9099;">
                      © 2025 ArcisAI. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    };

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_ARCIS_USER,
        pass: process.env.EMAIL_ARCIS_PASSWORD,
      },
    });

    await transporter.sendMail(mailOptions);

    // Send the final success response to the frontend
    res
      .status(200)
      .json({ message: "Lead processed and email sent successfully" });
  } catch (error) {
    // This outer catch block will only be triggered if the email sending fails
    console.error("Error sending the notification email:", error);
    res.status(500).json({
      error:
        "Failed to send notification email, but lead may have been created in EMS.",
    });
  }
};

// Career---VMUKTI/ARCIS
const sendCareerEmail = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      yearsOfExperience,
      currentCompany,
      about,
      jobTitle,
    } = req.body || {};

    const resumeFile = req.file;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.RECEIVING_EMAIL_HR,
      subject: `New Career Application${
        jobTitle ? `: ${jobTitle}` : ""
      } - ${fullName}`,
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin:0;padding:0;background:#f5f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="padding:24px;">
              <table width="640" style="background:#ffffff;border:1px solid #e7eaf3;border-radius:10px;overflow:hidden" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:20px 24px 0">
                    <img src="https://vmukti.com/assets/VMukti_logo.png" alt="VMukti" width="140" />
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:8px 24px 16px">
                    <h2 style="margin:0;color:#2a2f45;font-size:22px;">New Career Application</h2>
                    ${
                      jobTitle
                        ? `<p style=\"margin:6px 0 0;color:#6b7280;\">Role: <strong>${jobTitle}</strong></p>`
                        : ""
                    }
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 24px 4px">
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
                      <tbody>
                        <tr>
                          <td style="padding:10px 12px;background:#f9fafb;border-bottom:1px solid #eef2f7;width:220px;font-weight:600;color:#374151">Full Name</td>
                          <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;color:#111827">${
                            fullName || "N/A"
                          }</td>
                        </tr>
                        <tr>
                          <td style="padding:10px 12px;background:#f9fafb;border-bottom:1px solid #eef2f7;width:220px;font-weight:600;color:#374151">Email</td>
                          <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;color:#111827">${
                            email || "N/A"
                          }</td>
                        </tr>
                        <tr>
                          <td style="padding:10px 12px;background:#f9fafb;border-bottom:1px solid #eef2f7;width:220px;font-weight:600;color:#374151">Phone</td>
                          <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;color:#111827">${
                            phone || "N/A"
                          }</td>
                        </tr>
                        <tr>
                          <td style="padding:10px 12px;background:#f9fafb;border-bottom:1px solid #eef2f7;width:220px;font-weight:600;color:#374151">Years of Experience</td>
                          <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;color:#111827">${
                            yearsOfExperience || "N/A"
                          }</td>
                        </tr>
                        <tr>
                          <td style="padding:10px 12px;background:#f9fafb;border-bottom:1px solid #eef2f7;width:220px;font-weight:600;color:#374151">Current Company</td>
                          <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;color:#111827">${
                            currentCompany || "N/A"
                          }</td>
                        </tr>
                        <tr>
                          <td style="padding:10px 12px;background:#f9fafb;width:220px;font-weight:600;color:#374151;vertical-align:top">About</td>
                          <td style="padding:10px 12px;color:#111827;white-space:pre-wrap">${
                            about || "N/A"
                          }</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `,
      attachments: resumeFile
        ? [
            {
              filename: resumeFile.originalname,
              content: resumeFile.buffer,
              contentType: resumeFile.mimetype,
            },
          ]
        : [],
    };

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail(mailOptions);
    // Safety: if any file was written to disk by another middleware, remove it
    if (resumeFile && resumeFile.path) {
      try {
        fs.unlinkSync(resumeFile.path);
      } catch (e) {
        // ignore cleanup error
      }
    }
    res.status(200).json({ message: "Career email sent successfully" });
  } catch (error) {
    console.error("Error sending career email:", error);
    res.status(500).json({ error: error.message || "Failed to send email" });
  }
};

// Career---ADIANCE
const sendCareerEmailAdiance = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      yearsOfExperience,
      currentCompany,
      about,
      jobTitle,
    } = req.body || {};

    const resumeFile = req.file;

    const mailOptions = {
      from: process.env.EMAIL_ADIANCE_USER,
      to: process.env.RECEIVING_EMAIL_HR,
      subject: `New Career Application${
        jobTitle ? `: ${jobTitle}` : ""
      } - ${fullName}`,
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin:0;padding:0;background:#f5f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="padding:24px;">
              <table width="640" style="background:#ffffff;border:1px solid #e7eaf3;border-radius:10px;overflow:hidden" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:20px 24px 0">
                    <img src="https://www.adiance.com/images/Logo-241x47-1.png" alt="Adiance" width="140" />
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:8px 24px 16px">
                    <h2 style="margin:0;color:#2a2f45;font-size:22px;">New Career Application</h2>
                    ${
                      jobTitle
                        ? `<p style=\"margin:6px 0 0;color:#6b7280;\">Role: <strong>${jobTitle}</strong></p>`
                        : ""
                    }
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 24px 4px">
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
                      <tbody>
                        <tr>
                          <td style="padding:10px 12px;background:#f9fafb;border-bottom:1px solid #eef2f7;width:220px;font-weight:600;color:#374151">Full Name</td>
                          <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;color:#111827">${
                            fullName || "N/A"
                          }</td>
                        </tr>
                        <tr>
                          <td style="padding:10px 12px;background:#f9fafb;border-bottom:1px solid #eef2f7;width:220px;font-weight:600;color:#374151">Email</td>
                          <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;color:#111827">${
                            email || "N/A"
                          }</td>
                        </tr>
                        <tr>
                          <td style="padding:10px 12px;background:#f9fafb;border-bottom:1px solid #eef2f7;width:220px;font-weight:600;color:#374151">Phone</td>
                          <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;color:#111827">${
                            phone || "N/A"
                          }</td>
                        </tr>
                        <tr>
                          <td style="padding:10px 12px;background:#f9fafb;border-bottom:1px solid #eef2f7;width:220px;font-weight:600;color:#374151">Years of Experience</td>
                          <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;color:#111827">${
                            yearsOfExperience || "N/A"
                          }</td>
                        </tr>
                        <tr>
                          <td style="padding:10px 12px;background:#f9fafb;border-bottom:1px solid #eef2f7;width:220px;font-weight:600;color:#374151">Current Company</td>
                          <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;color:#111827">${
                            currentCompany || "N/A"
                          }</td>
                        </tr>
                        <tr>
                          <td style="padding:10px 12px;background:#f9fafb;width:220px;font-weight:600;color:#374151;vertical-align:top">About</td>
                          <td style="padding:10px 12px;color:#111827;white-space:pre-wrap">${
                            about || "N/A"
                          }</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `,
      attachments: resumeFile
        ? [
            {
              filename: resumeFile.originalname,
              content: resumeFile.buffer,
              contentType: resumeFile.mimetype,
            },
          ]
        : [],
    };

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_ADIANCE_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail(mailOptions);
    // Safety: if any file was written to disk by another middleware, remove it
    if (resumeFile && resumeFile.path) {
      try {
        fs.unlinkSync(resumeFile.path);
      } catch (e) {
        // ignore cleanup error
      }
    }
    res.status(200).json({ message: "Career email sent successfully" });
  } catch (error) {
    console.error("Error sending career email:", error);
    res.status(500).json({ error: error.message || "Failed to send email" });
  }
};

module.exports = {
  sendEmail,
  sendEmailArcis,
  sendCareerEmail,
  sendCareerEmailAdiance,
};
