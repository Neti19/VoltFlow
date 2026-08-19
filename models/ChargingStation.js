

const mongoose = require('mongoose');

const chargingStationSchema = new mongoose.Schema({
  ownerID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stationName: { type: String, required: true },
  address: { type: String, required: true },
  longitude: { type: Number, required: true },
  latitude: { type: Number, required: true },
  averageRating: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('ChargingStation', chargingStationSchema);

