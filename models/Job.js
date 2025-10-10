const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    jobRole: { type: String, required: true, trim: true },
    employmentType: { type: String, enum: ['Full-Time', 'Fresher', 'Intern'], required: true },
    location: { type: String, required: true, trim: true },
    experience: { type: String, required: true, trim: true }, // e.g., "0-2 years" or "Intern"
    openings: { type: Number, required: true, min: 1 },
    keyResponsibilities: { type: [String], default: [], validate: v => Array.isArray(v) },
    keySkills: { type: [String], default: [], validate: v => Array.isArray(v) },
    status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
    order: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', jobSchema);


