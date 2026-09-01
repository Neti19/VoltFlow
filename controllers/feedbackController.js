const Feedback = require('../models/Feedback');
const Booking = require('../models/Booking');

exports.createFeedback = async (req, res) => {
  try {
    const { stationID, rating, review } = req.body;

    // Verify the user actually booked a slot at this station
    const hasBooked = await Booking.findOne({
      userID: req.user.id,
      stationID,
      bookingStatus: 'Confirmed'
    });

    if (!hasBooked) {
      return res.status(403).json({ success: false, message: 'You can only review stations you have booked' });
    }

    const feedback = new Feedback({
      userID: req.user.id,
      stationID,
      rating,
      review
    });

    await feedback.save();

    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.getStationFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ stationID: req.params.stationId })
      .populate('userID', 'name');

    res.status(200).json({ success: true, count: feedback.length, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};