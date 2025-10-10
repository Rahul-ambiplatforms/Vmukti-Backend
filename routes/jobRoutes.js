const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const jobController = require('../controllers/jobController');

// Public: list and get jobs (optional)
router.get('/', jobController.getJobs);
router.get('/:id', jobController.getJob);

// Protected HR/Admin: manage jobs
router.post('/', protect, authorizeRoles('HR', 'ADMIN'), jobController.createJob);
router.put('/:id', protect, authorizeRoles('HR', 'ADMIN'), jobController.updateJob);
router.delete('/:id', protect, authorizeRoles('HR', 'ADMIN'), jobController.deleteJob);
router.patch('/:id/close', protect, authorizeRoles('HR', 'ADMIN'), jobController.closeJob);
router.patch('/:id/status', protect, authorizeRoles('HR', 'ADMIN'), jobController.updateJobStatus);
router.patch('/order', protect, authorizeRoles('HR', 'ADMIN'), jobController.updateJobOrder);

module.exports = router;


