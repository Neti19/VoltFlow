

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  bookingID: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  amount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' },
  transactionID: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);

