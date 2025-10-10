const Job = require('../models/Job');

exports.createJob = async (req, res) => {
  try {
    const {
      jobRole,
      employmentType,
      location,
      experience,
      openings,
      keyResponsibilities,
      keySkills,
    } = req.body;

    if (!jobRole || !employmentType || !location || !experience || !openings) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const job = await Job.create({
      jobRole,
      employmentType,
      location,
      experience,
      openings,
      keyResponsibilities: Array.isArray(keyResponsibilities) ? keyResponsibilities : [],
      keySkills: Array.isArray(keySkills) ? keySkills : [],
      createdBy: req.user?._id,
    });

    res.status(201).json({ status: 'success', data: { job } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getJobs = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = {};
    if (status) query.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [jobs, total] = await Promise.all([
      Job.find(query).sort({ order: 1, createdAt: -1 }).skip(skip).limit(Number(limit)),
      Job.countDocuments(query),
    ]);
    res.status(200).json({ status: 'success', data: { jobs, total } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.status(200).json({ status: 'success', data: { job } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const update = req.body;
    const job = await Job.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.status(200).json({ status: 'success', data: { job } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.status(200).json({ status: 'success', message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.closeJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status: 'CLOSED' },
      { new: true }
    );
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.status(200).json({ status: 'success', data: { job } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateJobStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['OPEN', 'CLOSED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be OPEN or CLOSED' });
    }
    
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.status(200).json({ status: 'success', data: { job } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateJobOrder = async (req, res) => {
  try {
    const { jobOrders } = req.body; // Array of { jobId, order }
    
    if (!Array.isArray(jobOrders)) {
      return res.status(400).json({ error: 'jobOrders must be an array' });
    }

    // Update each job's order
    const updatePromises = jobOrders.map(({ jobId, order }) =>
      Job.findByIdAndUpdate(jobId, { order }, { new: true })
    );

    await Promise.all(updatePromises);
    
    res.status(200).json({ 
      status: 'success', 
      message: 'Job order updated successfully' 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


