const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stationID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChargingStation',
    required: true
  },
  chargerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Charger',
    required: true
  },
  chargerUnit: {
    type: Number,
    required: true
  },
  bookingDate: {
    type: String,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  bookingStatus: {
    type: String,
    enum: [
      'Pending',
      'Confirmed',
      'In Progress',
      'Cancelled',
      'Completed'
    ],
    default: 'Pending'
  },
  verificationPIN: {
    type: String,
    required: true
  },
  paymentID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});
bookingSchema.index(
  {
    chargerID: 1,
    chargerUnit: 1,
    bookingDate: 1,
    startTime: 1
  },
  {
    unique: true,
    partialFilterExpression: {
      bookingStatus: {
        $in: [
          'Pending',
          'Confirmed',
          'In Progress'
        ]
      }
    },
    name: 'unique_active_charger_unit_slot'
  }
);


module.exports = mongoose.model(
  'Booking',
  bookingSchema
);
