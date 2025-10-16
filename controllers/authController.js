const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { generateOTP, getOTPExpirationTime } = require("../utils/otpGenerator");
const { sendOTPEmail } = require("../utils/emailService");

// Register a new user
exports.register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // Create new user
    const newUser = await User.create({ email, password, role });

    res.status(201).json({
      status: "success",
      message: "User registered successfully. Please login.",
      data: {
        user: {
          email: newUser.email,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Initiate login (send OTP)
exports.initiateLogin = async (req, res) => {
  try {
    let { email, password } = req.body;

    email = typeof email === "string" ? email.trim().toLowerCase() : "";
    password = typeof password === "string" ? password : "";

    // console.log("This is the body", req.body);
    const user = await User.findOne({ email });
    // console.log("all user", user);

    if (!user) {
      return res.status(401).json({ error: "Incorrect email or password" });
    }

    // Ensure we compare with a string to avoid bcrypt throwing on undefined/null
    const storedHash = typeof user.password === "string" ? user.password : "";
    const isPasswordCorrect = await user.correctPassword(password, storedHash);
    // console.log("PASSWORD", password);
    // console.log("CHECK PWD is correct or not", isPasswordCorrect);

    if (!isPasswordCorrect) {
      return res.status(401).json({ error: "Incorrect email or password" });
    }

    // 2. Generate OTP and set expiration
    const otp = generateOTP();
    user.otp = {
      code: otp,
      expiresAt: getOTPExpirationTime(),
    };
    // Ensure Mongoose tracks nested changes
    if (typeof user.markModified === "function") user.markModified("otp");
    await user.save();

    // 3. Send OTP via email
    await sendOTPEmail(email, otp);

    res.status(200).json({
      status: "success",
      message: "OTP sent to your email",
      data: {
        email,
        otpExpiresIn: "10 minutes",
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Verify OTP and complete login
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    // 1. Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2. Validate presence
    if (!user.otp) {
      return res.status(400).json({ error: "OTP expired or invalid" });
    }

    // 3. Validate expiry if parseable
    const nowVerify = new Date();
    const expVerify = user.otp ? new Date(user.otp.expiresAt) : null;
    if (expVerify instanceof Date && !isNaN(expVerify.getTime())) {
      if (expVerify < nowVerify) {
        return res.status(400).json({ error: "OTP expired or invalid" });
      }
    }

    // 4. Compare codes as strings
    if (String(user.otp.code) !== String(otp)) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // 5. Behavior depends on purpose
    const purpose = user.otp && user.otp.purpose ? user.otp.purpose : undefined;

    if (purpose === "reset-password") {
      // Do NOT clear OTP here; it will be used by resetPassword
      return res.status(200).json({
        status: "success",
        message: "OTP verified for password reset",
        data: { email: user.email }
      });
    }

    // Login flow: clear OTP and verify user
    user.otp = undefined;
    if (typeof user.markModified === "function") user.markModified("otp");
    user.isVerified = true;
    await user.save();

    // 6. Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    res.status(200).json({
      status: "success",
      message: "Login successful",
      token,
      data: {
        user: {
          email: user.email,
          isVerified: user.isVerified,
          role: user.role,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Protected route example
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Forgot Password - Send OTP
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    // 1. Check if user exists
    console.log("EMail for the search for FORGOT", normalizedEmail)
    const user = await User.findOne({ email: normalizedEmail });
    console.log("Forget PWD USER FINDING....", user)
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2. Generate OTP and set expiration
    const otp = generateOTP();
    console.log("After forgot PWD OTP", otp)
    user.otp = {
      code: otp,
      expiresAt: getOTPExpirationTime(),
      purpose: "reset-password",
    };
    if (typeof user.markModified === "function") user.markModified("otp");
    await user.save();
    console.log("USER SAVED")

    // 3. Send OTP via email
    await sendOTPEmail(normalizedEmail, otp, "reset-password");

    res.status(200).json({
      status: "success",
      message: "OTP sent to your email for password reset",
      data: {
        email: normalizedEmail,
        otpExpiresIn: "10 minutes",
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reset Password with OTP
exports.resetPassword = async (req, res) => {
  try {
    let { email, otp, newPassword } = req.body;

    email = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!newPassword) {
      return res.status(400).json({ error: "newPassword is required" });
    }

    // 1. Find user: prefer email, else find by otp.code
    let user = null;
    if (email) {
      user = await User.findOne({ email });
    } else if (otp) {
      user = await User.findOne({ "otp.code": String(otp) });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2. Ensure OTP provided
    if (typeof otp === "undefined" || otp === null || String(otp).trim().length === 0) {
      return res.status(400).json({ error: "OTP is required" });
    }

    // 3. Read current OTP; support legacy string format
    const storedOtp = user.otp;
    const isLegacyStringOtp = typeof storedOtp === "string";

    const now = new Date();
    const expiresAt = !isLegacyStringOtp && storedOtp ? new Date(storedOtp.expiresAt) : null;
    console.log("ResetPwd: hasOtp", !!storedOtp, "legacy", isLegacyStringOtp, "expiresAt", expiresAt, "now", now);

    if (!storedOtp) {
      return res.status(400).json({ error: "No OTP on record. Request a new one." });
    }

    // 4. Expiration check only if we have structured object with a valid expiresAt
    if (!isLegacyStringOtp) {
      if (expiresAt instanceof Date && !isNaN(expiresAt.getTime())) {
        if (expiresAt < now) {
          return res.status(400).json({ error: "OTP expired or invalid" });
        }
      } else {
        console.warn("ResetPwd: missing/invalid expiresAt; proceeding with code match only");
      }
    }

    // 5. Compare codes as strings to avoid type mismatch (number vs string)
    const storedCode = String(isLegacyStringOtp ? storedOtp : storedOtp.code).trim();
    const incomingCode = String(otp).trim();
    if (storedCode !== incomingCode) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    user.password = newPassword;
    user.otp = undefined; // clear OTP after successful reset
    if (typeof user.markModified === "function") user.markModified("otp");
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Password updated successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
