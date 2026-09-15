const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

// @desc    Process mock payment and confirm booking
// @route   POST /api/payments/process/:paymentId
exports.processPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }
    
    if (payment.paymentStatus === 'Completed') {
      return res.status(400).json({ success: false, message: 'Payment has already been processed' });
    }

    // 1. Update Payment status to Completed
    payment.paymentStatus = 'Completed';
    await payment.save();

    // 2. Update linked Booking status to Confirmed
    const booking = await Booking.findById(payment.bookingID);
    booking.bookingStatus = 'Confirmed';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Payment successful, your slot is confirmed!',
      data: { payment, booking }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};