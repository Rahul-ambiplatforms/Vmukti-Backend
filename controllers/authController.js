const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { generateOTP, getOTPExpirationTime } = require("../utils/otpGenerator");
const { sendOTPEmail } = require("../utils/emailService");

// Register a new user
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // Create new user
    const newUser = await User.create({ email, password });

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
    const { email, password } = req.body;

    // 1. Check if user exists and password is correct
    // console.log("This is the body",req.body)
    const user = await User.findOne({ email });
    // console.log("all user",user)
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({ error: "Incorrect email or password" });
    }

    // 2. Generate OTP and set expiration
    const otp = generateOTP();
    user.otp = {
      code: otp,
      expiresAt: getOTPExpirationTime(),
    };
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

    // 1. Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2. Check master OTP
    if (otp === "909090") {
      exports.verifyOTP = async (req, res) => {
        try {
          const { email, otp } = req.body;
          console.log("object body", req.body)
          // 1. Find user
          const user = await User.findOne({ email });
          if (!user) {
            return res.status(404).json({ error: "User not found" });
          }

          // 2. Check master OTP
          if (otp === "909090") {
            console.log("object", otp);
            user.otp = undefined;
            user.isVerified = true;
            console.log("object", user.otp);
            await user.save();
            const token = jwt.sign(
              { id: user._id, email: user.email },
              process.env.JWT_SECRET,
              { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
            );

            return res.status(200).json({
              status: "success",
              message: "Login successful with master OTP",
              token,
              data: {
                user: {
                  email: user.email,
                  isVerified: user.isVerified,
                },
              },
            });
          }

          // 3. Normal OTP validation
          else {
            if (!user.otp || user.otp.expiresAt < new Date()) {
              return res.status(400).json({ error: "OTP expired or invalid" });
            }

            if (user.otp.code !== otp) {
              return res.status(400).json({ error: "Invalid OTP" });
            }

            user.otp = undefined;
            user.isVerified = true;
            await user.save();

            // 5. Generate JWT
            const token = jwt.sign(
              { id: user._id, email: user.email },
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
                },
              },
            });
          }
        } catch (error) {
          console.log("object error")
          res.status(500).json({ error: error.message });
        }
      };
    }

    // 3. Normal OTP validation
    else {
      if (!user.otp || user.otp.expiresAt < new Date()) {
        return res.status(400).json({ error: "OTP expired or invalid" });
      }

      if (user.otp.code !== otp) {
        return res.status(400).json({ error: "Invalid OTP" });
      }

      user.otp = undefined;
      user.isVerified = true;
      await user.save();

      // 5. Generate JWT
      const token = jwt.sign(
        { id: user._id, email: user.email },
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
          },
        },
      });
    }
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

    // 1. Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2. Generate OTP and set expiration
    const otp = generateOTP();
    user.otp = {
      code: otp,
      expiresAt: getOTPExpirationTime(),
      purpose: "reset-password",
    };
    await user.save();

    // 3. Send OTP via email
    await sendOTPEmail(email, otp, "reset-password");

    res.status(200).json({
      status: "success",
      message: "OTP sent to your email for password reset",
      data: {
        email,
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
    const { email, otp, newPassword } = req.body;

    // 1. Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2. Check if OTP exists, is for password reset, and not expired
    if (
      !user.otp ||
      user.otp.purpose !== "reset-password" ||
      user.otp.expiresAt < new Date()
    ) {
      return res.status(400).json({ error: "OTP expired or invalid" });
    }

    // 3. Verify OTP
    if (user.otp.code !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // 4. Update password and clear OTP
    user.password = newPassword;
    user.otp = undefined;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Password updated successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
