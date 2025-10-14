require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const redirectLinks = require("./middlewares/redirects");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// WWW redirection middleware (non-www to www)
app.use((req, res, next) => {
  const host = req.headers.host;
  
  // Check if the request is not from www subdomain and not localhost/development
  if (host && !host.startsWith('www.') && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const wwwUrl = `${protocol}://www.${host}${req.originalUrl}`;
    console.log(`Redirecting non-www to www: ${req.url} -> ${wwwUrl}`);
    return res.redirect(301, wwwUrl);
  }
  
  next();
});

// Redirect middleware for handling old URLs
app.use(redirectLinks);

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Create uploads directory if it doesn't exist
if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}

// Database connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB connected successfully"))
  .catch((err) => console.error("DB connection error:", err));


// Routes
app.get('/', (req, res) => {
  res.send('<h1>Welcome to VMukti Web Backend!</h1>');
});


const emailRoutes = require("./routes/emailRoutes");
const authRoutes = require("./routes/authRoutes");
const blogRoutes = require("./routes/blogRoutes");
const fileRoutes = require("./routes/fileRoutes");
const jobRoutes = require("./routes/jobRoutes");
app.use("/api", emailRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/jobs", jobRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: "Something went wrong!",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
