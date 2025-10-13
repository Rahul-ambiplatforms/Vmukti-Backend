const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    jobRole: { type: String, required: true, trim: true },
    employmentType: { type: String, enum: ['Full-Time', 'Fresher', 'Intern'], required: true },
    location: { type: String, required: true, trim: true },
    experience: { type: String, required: true, trim: true }, 
    openings: { type: Number, required: true, min: 1 },
    skillsAndResponsibilities: { type: String, trim: true },
    jdFilename: { type: String, trim: true },
    status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
    order: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Compute public URL for JD from filename without storing the full URL
jobSchema.virtual('jdUrl').get(function () {
  if (!this.jdFilename) return undefined;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return undefined;
  // Resource type 'raw' for PDFs. Ensure we only use the base filename.
  const base = String(this.jdFilename).split('/').pop();
  // View URL without version pinning, Cloudinary serves the PDF
  return `https://res.cloudinary.com/${cloudName}/raw/upload/v1760353096/JD_vmukti/${base}`;
});

// Force-download URL with a proper filename (adds .pdf)
jobSchema.virtual('jdDownloadUrl').get(function () {
  if (!this.jdFilename) return undefined;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return undefined;
  const base = String(this.jdFilename).split('/').pop();
  // Cloudinary 'fl_attachment' forces download; 'dl' sets filename
  return `https://res.cloudinary.com/${cloudName}/raw/upload/v1760353096/JD_vmukti/${base}`;
});

module.exports = mongoose.model('Job', jobSchema);


