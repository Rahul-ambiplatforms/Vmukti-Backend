const nodemailer = require("nodemailer");
const axios = require("axios");

const sendEmail = async (req, res) => {
  // const {
  //   fullname,
  //   fullName, // For the General Contact form
  //   email,
  //   phone,
  //   message,
  //   formType, // 'Contact' or 'Blog'
  //   country,
  //   city,
  //   businessProfile,
  //   companyName,
  //   inquiryType,
  // } = req.body;

  const { firstName, lastName, fullname, email, phone, message, formType } =
    req.body;

  console.log("Received form data:", req.body);
  // const name = fullName.trim() || fullname.trim();
  let name = "";
  if (fullname) name = fullname.trim();
  else name = `${firstName.trim()} ${lastName.trim()}`;
  // const name = fullname.trim() || `${firstName.trim()} ${lastName.trim()}`;

  const subjectSource = formType === "Blog" ? "Blog" : "Contact";
  console.log("Received form data:", req.body);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.RECEIVING_EMAIL,
    subject: `New ${subjectSource} Form Submission from ${name}`,
    html: `
      <h3>New ${subjectSource} Form Submission</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email || "Not provided"}</p>
      <p><strong>Phone:</strong> ${
        phone && typeof phone === "object"
          ? `${phone.code} ${phone.number}`
          : phone || "Not provided"
      }</p>
      <p><strong>Message:</strong></p>
      <p>${message || "Not provided"}</p>
    `,
  };
  // ${
  //         companyName
  //           ? `<p><strong>Company Name:</strong> ${companyName}</p>`
  //           : ""
  //       }
  //       ${country ? `<p><strong>Country:</strong> ${country}</p>` : ""}
  //       ${city ? `<p><strong>City:</strong> ${city}</p>` : ""}
  //       ${
  //         businessProfile
  //           ? `<p><strong>Business Profile:</strong> ${businessProfile}</p>`
  //           : ""
  //       }
  //       ${
  //         inquiryType
  //           ? `<p><strong>Inquiry Type:</strong> ${inquiryType}</p>`
  //           : ""
  //       }

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

const sendEmailArcis = async (req, res) => {
  // Destructure all the fields from the request body
  const {
    name,
    email,
    phone,
    company,
    location,
    camerasFor,
    customerQuantity,
    leadType,
  } = req.body;

  try {
    const EMS_API_URL = "https://etaems.arcisai.io:5000/api/createLead";

    // Prepare the data payload, mapping form fields to what the API expects
    const leadData = {
      name: name,
      mobile: phone,
      email: email,
      company: company,
      location: location,
      industryType: camerasFor,
      // customerType: "Other",
      leadType: leadType,
      customerQuantity: customerQuantity,
      // Create a default requirement object since the form doesn't capture this detail
      // requirement: [
      //   {
      //     cameraType: `Cameras for ${camerasFor}`,
      //     quantity: 1,
      //     orderTimeline: "To be discussed",
      //   },
      // ],
    };

    try {
      // console.log("Attempting to create lead in EMS:", leadData);
      await axios.post(EMS_API_URL, leadData);
      // console.log("Lead created successfully in EMS:", emsResponse.data);
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
      subject: `New Arcis Website Lead: ${company} (${name})`,
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>New ArcisAI Lead</title>
        <style>
          body { margin:0; padding:0; background:#f5f6fa; }
          table { border-collapse:collapse; }
          img { border:0; line-height:100%; outline:none; text-decoration:none; }
          .font { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
        </style>
      </head>
      <body class="font" style="margin:0;padding:0;background:#f5f6fa;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;visibility:hidden;">
          New contact form submission from ${company} (${name}).
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
                      New Contact Form Submission
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 32px 24px;">
                    <table role="presentation" width="100%" style="width:100%; border-spacing:0;">
                      <tr>
                        <td class="font" align="right" width="160" style="width:160px; padding:8px 12px 8px 0; font-weight:700; color:#333333; text-align:right; border-bottom: 1px solid #f0f2f5;">Name:</td>
                        <td class="font" align="left" style="padding:8px 0 8px 12px; color:#555555; text-align:left; border-bottom: 1px solid #f0f2f5;">${name}</td>
                      </tr>
                      <tr>
                        <td class="font" align="right" width="160" style="width:160px; padding:8px 12px 8px 0; font-weight:700; color:#333333; text-align:right; border-bottom: 1px solid #f0f2f5;">Company:</td>
                        <td class="font" align="left" style="padding:8px 0 8px 12px; color:#555555; text-align:left; border-bottom: 1px solid #f0f2f5;">${company}</td>
                      </tr>
                      <tr>
                        <td class="font" align="right" width="160" style="width:160px; padding:8px 12px 8px 0; font-weight:700; color:#333333; text-align:right; border-bottom: 1px solid #f0f2f5;">Email:</td>
                        <td class="font" align="left" style="padding:8px 0 8px 12px; color:#555555; text-align:left; border-bottom: 1px solid #f0f2f5;">${email}</td>
                      </tr>
                      <tr>
                        <td class="font" align="right" width="160" style="width:160px; padding:8px 12px 8px 0; font-weight:700; color:#333333; text-align:right; border-bottom: 1px solid #f0f2f5;">Phone:</td>
                        <td class="font" align="left" style="padding:8px 0 8px 12px; color:#555555; text-align:left; border-bottom: 1px solid #f0f2f5;">${phone}</td>
                      </tr>
                      <tr>
                        <td class="font" align="right" width="160" style="width:160px; padding:8px 12px 8px 0; font-weight:700; color:#333333; text-align:right; border-bottom: 1px solid #f0f2f5;">Location:</td>
                        <td class="font" align="left" style="padding:8px 0 8px 12px; color:#555555; text-align:left; border-bottom: 1px solid #f0f2f5;">${location}</td>
                      </tr>
                      <tr>
                        <td class="font" align="right" width="160" style="width:160px; padding:8px 12px 8px 0; font-weight:700; color:#333333; text-align:right; border-bottom: 1px solid #f0f2f5;">Wants Cameras For:</td>
                        <td class="font" align="left" style="padding:8px 0 8px 12px; color:#555555; text-align:left; border-bottom: 1px solid #f0f2f5;">${camerasFor}</td>
                      </tr>
                      <tr>
                        <td class="font" align="right" width="160" style="width:160px; padding:8px 12px 8px 0; font-weight:700; color:#333333; text-align:right; border-bottom: 1px solid #f0f2f5;">Customer Quantity:</td>
                        <td class="font" align="left" style="padding:8px 0 8px 12px; color:#555555; text-align:left; border-bottom: 1px solid #f0f2f5;">${
                          customerQuantity || "Not provided"
                        }</td>
                      </tr>
                      <tr>
                        <td class="font" align="right" width="160" style="width:160px; padding:8px 12px 8px 0; font-weight:700; color:#333333; text-align:right;">Lead Source:</td>
                        <td class="font" align="left" style="padding:8px 0 8px 12px; color:#555555; text-align:left;">${
                          leadType || "Not specified"
                        }</td>
                      </tr>
                    </table>
                  </td>
                </tr>
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

module.exports = {
  sendEmail,
  sendEmailArcis,
};