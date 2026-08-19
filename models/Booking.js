const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stationID: { type: mongoose.Schema.Types.ObjectId, ref: 'ChargingStation', required: true },
  chargerID: { type: mongoose.Schema.Types.ObjectId, ref: 'Charger', required: true },
  bookingDate: { type: String, required: true }, // YYYY-MM-DD
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  bookingStatus: { type: String, enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed'], default: 'Pending' },
  verificationPIN: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);