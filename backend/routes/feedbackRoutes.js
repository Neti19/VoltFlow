const express = require('express');
const router = express.Router();
const { createFeedback, getStationFeedback } = require('../controllers/feedbackController');
const protect = require('../middleware/authMiddleware');

router.post('/', protect, createFeedback);
router.get('/station/:stationId', getStationFeedback);

module.exports = router;