

const mongoose = require('mongoose');

const chargerSchema = new mongoose.Schema({
  stationID: { type: mongoose.Schema.Types.ObjectId, ref: 'ChargingStation', required: true },
  vehicleType: { type: String, required: true },
  chargingSpeed: { type: String, required: true }, // e.g., "50kW Fast", "7.4kW Slow"
  status: { type: String, enum: ['Available', 'Occupied', 'Maintenance'], default: 'Available' }
});

module.exports = mongoose.model('Charger', chargerSchema);

