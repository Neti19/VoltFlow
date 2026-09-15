

const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stationID: { type: mongoose.Schema.Types.ObjectId, ref: 'ChargingStation', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String, required: true },
  feedbackdate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', feedbackSchema);

