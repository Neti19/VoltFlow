const Booking = require('../models/Booking');
const Charger = require('../models/Charger');
const Payment = require('../models/Payment');

// @desc    Create a new booking (EVUser only)
// @route   POST /api/bookings
exports.createBooking = async (req, res) => {
  try {
    const { stationID, chargerID, bookingDate, startTime, endTime } = req.body;

    // 1. Validate the charger exists and is available
    const charger = await Charger.findById(chargerID);
    if (!charger) {
      return res.status(404).json({ success: false, message: 'Charger not found' });
    }
    if (charger.status !== 'Available') {
      return res.status(400).json({ success: false, message: 'Charger is currently unavailable' });
    }

    // 2. Generate a random 4-digit verification PIN for station arrival
    const verificationPIN = Math.floor(1000 + Math.random() * 9000).toString();

    // 3. Create the booking record
    const booking = new Booking({
      userID: req.user.id,
      stationID,
      chargerID,
      bookingDate,
      startTime,
      endTime,
      bookingStatus: 'Pending',
      verificationPIN
    });

    await booking.save();

    // 4. Create an initial Pending Payment record mapped to this booking
    // In a real app, 'amount' would be calculated based on duration * hourly rate
    const payment = new Payment({
      bookingID: booking._id,
      amount: 150, // Mock amount in INR
      paymentStatus: 'Pending',
      transactionID: `TXN_${Date.now()}` // Mock transaction ID
    });

    await payment.save();

    res.status(201).json({
      success: true,
      message: 'Booking created successfully. Proceed to payment.',
      data: { booking, payment }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get all bookings for a user
// @route   GET /api/bookings/my-bookings
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userID: req.user.id })
      .populate('stationID', 'stationName address')
      .populate('chargerID', 'chargingSpeed vehicleType');

    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};