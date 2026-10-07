const Booking = require('../models/Booking');
const Charger = require('../models/Charger');
const Payment = require('../models/Payment');
const Station = require('../models/ChargingStation');

const convertToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const convertToTime = (minutes) => {
  const hours = Math.floor(minutes / 60).toString().padStart(2, '0');
  const mins = (minutes % 60).toString().padStart(2, '0');
  return `${hours}:${mins}`;
};

// ============================================================
// CREATE BOOKING
// ============================================================
exports.createBooking = async (req, res) => {
  try {
    const {
      stationID,
      chargerID,
      chargerUnit,
      bookingDate,
      startTime,
      endTime
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | BASIC VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
      !stationID ||
      !chargerID ||
      !chargerUnit ||
      !bookingDate ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Please provide all booking details, including the charger unit.'
      });
    }

    const reqStart = convertToMinutes(startTime);
    const reqEnd = convertToMinutes(endTime);

    if (reqStart >= reqEnd) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking time range.'
      });
    }

    /*
    |--------------------------------------------------------------------------
    | DATE VALIDATION
    |--------------------------------------------------------------------------
    */

    const now = new Date();

    const today =
      `${now.getFullYear()}-` +
      `${String(now.getMonth() + 1).padStart(2, '0')}-` +
      `${String(now.getDate()).padStart(2, '0')}`;

    if (bookingDate < today) {
      return res.status(400).json({
        success: false,
        message: 'You cannot book a slot from a past date.'
      });
    }

    if (bookingDate === today) {
      const currentMinutes =
        now.getHours() * 60 + now.getMinutes();

      if (reqStart <= currentMinutes) {
        return res.status(400).json({
          success: false,
          message: 'This time slot has already passed.'
        });
      }
    }

    /*
    |--------------------------------------------------------------------------
    | GET STATION + CHARGER
    |--------------------------------------------------------------------------
    */

    const station = await Station.findById(stationID);
    const charger = await Charger.findById(chargerID);

    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Charging station not found'
      });
    }

    if (!charger) {
      return res.status(404).json({
        success: false,
        message: 'Charger not found'
      });
    }

    if (
      charger.stationID.toString() !==
      stationID.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Charger does not belong to this station'
      });
    }

    if (charger.status !== 'Available') {
      return res.status(400).json({
        success: false,
        message: 'Charger is currently unavailable'
      });
    }

    /*
    |--------------------------------------------------------------------------
    | CHARGER UNIT VALIDATION
    |--------------------------------------------------------------------------
    */

    const totalUnits = Number(charger.quantity || 1);

    if (
      !Number.isInteger(Number(chargerUnit)) ||
      Number(chargerUnit) < 1 ||
      Number(chargerUnit) > totalUnits
    ) {
      return res.status(400).json({
        success: false,
        message: `Invalid charger unit. Available units are 1 to ${totalUnits}.`
      });
    }

    /*
    |--------------------------------------------------------------------------
    | CHARGING DURATION VALIDATION
    |--------------------------------------------------------------------------
    */

    const chargingDuration =
      Number(charger.chargingDuration);

    if (!chargingDuration || chargingDuration <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid charging duration configured for this charger.'
      });
    }

    if (
      reqEnd - reqStart !== chargingDuration
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Invalid booking duration. This charger requires a ${chargingDuration}-minute slot.`
      });
    }

    /*
    |--------------------------------------------------------------------------
    | STATION OPENING/CLOSING TIME VALIDATION
    |--------------------------------------------------------------------------
    */

    const openingMinutes =
      convertToMinutes(station.openingTime);

    const closingMinutes =
      convertToMinutes(station.closingTime);

    if (
      reqStart < openingMinutes ||
      reqEnd > closingMinutes
    ) {
      return res.status(400).json({
        success: false,
        message: 'Selected slot is outside station operating hours.'
      });
    }

    /*
    |--------------------------------------------------------------------------
    | SLOT GRID VALIDATION
    |--------------------------------------------------------------------------
    |
    | This makes sure users cannot manually send arbitrary overlapping
    | times such as 10:15 - 11:15 when the charger works in 60-minute
    | slots.
    |
    */

    const slotOffset =
      reqStart - openingMinutes;

    if (
      slotOffset < 0 ||
      slotOffset % chargingDuration !== 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking slot.'
      });
    }

    /*
    |--------------------------------------------------------------------------
    | AVAILABILITY CHECK
    |--------------------------------------------------------------------------
    |
    | This check is useful for giving the user a friendly response.
    |
    | IMPORTANT:
    | The database unique index below is the actual concurrency protection.
    |
    */

    const overlappingBookings =
      await Booking.find({
        chargerID: charger._id,
        chargerUnit: Number(chargerUnit),
        bookingDate,
        bookingStatus: {
          $in: [
            'Pending',
            'Confirmed',
            'In Progress'
          ]
        }
      }).select(
        'startTime endTime bookingStatus'
      );

    const hasOverlap =
      overlappingBookings.some(booking => {
        const bookingStart =
          convertToMinutes(booking.startTime);

        const bookingEnd =
          convertToMinutes(booking.endTime);

        return (
          bookingStart < reqEnd &&
          bookingEnd > reqStart
        );
      });

    if (hasOverlap) {
      return res.status(409).json({
        success: false,
        message:
          `Charger Unit ${chargerUnit} is already booked for this time slot.`
      });
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE BOOKING
    |--------------------------------------------------------------------------
    */

    const verificationPIN =
      Math.floor(
        1000 + Math.random() * 9000
      ).toString();

    const booking = new Booking({
      userID: req.user.id,
      stationID,
      chargerID,
      chargerUnit: Number(chargerUnit),
      bookingDate,
      startTime,
      endTime,
      bookingStatus: 'Pending',
      verificationPIN
    });

    /*
    |--------------------------------------------------------------------------
    | CRITICAL CONCURRENCY PROTECTION
    |--------------------------------------------------------------------------
    |
    | Even if two requests passed the availability check above at exactly
    | the same time, MongoDB's unique index allows only ONE to save.
    |
    */

    try {
      await booking.save();
    } catch (error) {
      if (error?.code === 11000) {
        return res.status(409).json({
          success: false,
          message:
            'This charger unit and time slot was just booked by another user. Please select another slot.'
        });
      }

      throw error;
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE PAYMENT
    |--------------------------------------------------------------------------
    */

    const baseAmount = 150;
    const taxRate = 18;

    const taxAmount =
      (baseAmount * taxRate) / 100;

    const totalAmount =
      baseAmount + taxAmount;

    const payment = new Payment({
      bookingID: booking._id,
      amount: baseAmount,
      taxRate,
      taxAmount: Number(
        taxAmount.toFixed(2)
      ),
      totalAmount: Number(
        totalAmount.toFixed(2)
      ),
      paymentStatus: 'Pending',
      transactionID:
        `TXN_${Date.now()}`,
      billGenerated: false
    });

    try {
      await payment.save();
    } catch (error) {
      /*
       * If payment creation fails, release the booking so
       * another customer can use the slot.
       */

      await Booking.findByIdAndUpdate(
        booking._id,
        {
          bookingStatus: 'Cancelled'
        }
      );

      throw error;
    }

    /*
    |--------------------------------------------------------------------------
    | CONNECT PAYMENT TO BOOKING
    |--------------------------------------------------------------------------
    */

    booking.paymentID = payment._id;

    await booking.save();

    /*
    |--------------------------------------------------------------------------
    | RETURN COMPLETE BOOKING
    |--------------------------------------------------------------------------
    */

    const completeBooking =
      await Booking.findById(booking._id)
        .populate(
          'stationID',
          'stationName address openingTime closingTime'
        )
        .populate(
          'chargerID',
          'vehicleType chargingSpeed pricePerKwh chargingDuration status'
        )
        .populate('paymentID');

    return res.status(201).json({
      success: true,
      message:
        'Booking created successfully. Proceed to payment.',
      data: {
        booking: completeBooking,
        payment
      }
    });

  } catch (error) {
    console.error(
      'Create booking error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================================
// GET AVAILABLE SLOTS (Seat Logic)
// ============================================================
exports.getAvailableSlots = async (req, res) => {
  try {
    const { stationID, chargerID, date } = req.params;

    const station = await Station.findById(stationID);
    const selectedCharger = await Charger.findById(chargerID);

    if (!station) return res.status(404).json({ success: false, message: 'Station not found' });
    if (!selectedCharger) return res.status(404).json({ success: false, message: 'Charger not found' });

    const totalUnits = Number(selectedCharger.quantity || 1);
    const chargingDuration = Number(selectedCharger.chargingDuration);

    const bookings = await Booking.find({
      chargerID: selectedCharger._id,
      bookingDate: date,
      bookingStatus: { $in: ['Pending', 'Confirmed', 'In Progress'] }
    });

    const openingMinutes = convertToMinutes(station.openingTime);
    const closingMinutes = convertToMinutes(station.closingTime);
    const slots = [];

    for (let start = openingMinutes; start + chargingDuration <= closingMinutes; start += chargingDuration) {
      const end = start + chargingDuration;
      const startTime = convertToTime(start);
      const endTime = convertToTime(end);

      // Find which specific units are taken in this slot
      const takenUnits = [];
      bookings.forEach((booking) => {
        const bStart = convertToMinutes(booking.startTime);
        const bEnd = convertToMinutes(booking.endTime);
        if (bStart < end && bEnd > start) {
          takenUnits.push(booking.chargerUnit);
        }
      });

      // Generate the "Seats"
      const units = [];
      for (let i = 1; i <= totalUnits; i++) {
        units.push({
          unitNumber: i,
          available: !takenUnits.includes(i)
        });
      }

      const available = units.some(u => u.available);

      slots.push({ startTime, endTime, available, units });
    }

    res.status(200).json({ success: true, date, data: slots });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ============================================================
// CANCEL BOOKING
// ============================================================
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingID).populate('chargerID');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.userID.toString() !== req.user.id.toString()) return res.status(403).json({ success: false, message: 'Unauthorized' });

    if (booking.bookingStatus !== 'Pending' && booking.bookingStatus !== 'Confirmed') {
      return res.status(400).json({ success: false, message: 'Only active bookings can be cancelled.' });
    }

    const duration = booking.chargerID.chargingDuration;
    const [hours, mins] = booking.startTime.split(':').map(Number);
    const startObj = new Date(`${booking.bookingDate}T00:00:00`);
    startObj.setHours(hours);
    startObj.setMinutes(mins);

    const cutoffObj = new Date(startObj.getTime() - (2 * duration * 60000));
    const now = new Date();

    if (now >= cutoffObj) {
      return res.status(400).json({ success: false, message: 'The cancellation window for this booking has passed.' });
    }

    booking.bookingStatus = 'Cancelled';
    await booking.save();

    const payment = await Payment.findOne({ bookingID: booking._id });
    if (payment && payment.paymentStatus === 'Pending') {
      payment.paymentStatus = 'Cancelled';
      await payment.save();
    }

    res.status(200).json({ success: true, message: 'Booking cancelled successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ============================================================
// GET USER BOOKINGS
// ============================================================
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userID: req.user.id })
      .populate('stationID', 'stationName address openingTime closingTime')
      .populate('chargerID', 'vehicleType chargingSpeed pricePerKwh chargingDuration status')
      .populate('paymentID')
      .sort({ bookingDate: -1, startTime: -1 });
    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ============================================================
// GET OWNER BOOKINGS
// ============================================================
exports.getOwnerBookings = async (req, res) => {
  try {
    const ownerStations = await Station.find({ ownerID: req.user.id }).select('_id');
    const stationIds = ownerStations.map(station => station._id);
    const bookings = await Booking.find({ stationID: { $in: stationIds } })
      .populate('userID', 'name email phone')
      .populate('stationID', 'stationName address openingTime closingTime')
      .populate('chargerID', 'vehicleType chargingSpeed pricePerKwh chargingDuration status')
      .populate('paymentID')
      .sort({ bookingDate: -1, startTime: -1 });
    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ============================================================
// COMPLETE CHARGING
// ============================================================
exports.completeCharging = async (req, res) => {
  try {
    const { bookingID } = req.params;
    const booking = await Booking.findById(bookingID);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    const station = await Station.findById(booking.stationID);
    if (!station) return res.status(404).json({ success: false, message: 'Charging station not found' });
    if (station.ownerID.toString() !== req.user.id.toString()) return res.status(403).json({ success: false, message: 'Unauthorized' });

    if (booking.bookingStatus !== 'Confirmed' && booking.bookingStatus !== 'In Progress') {
      return res.status(400).json({ success: false, message: 'Only confirmed or in-progress bookings can be completed' });
    }

    const payment = await Payment.findOne({ bookingID: booking._id });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });
    if (payment.paymentStatus !== 'Completed') return res.status(400).json({ success: false, message: 'Payment must be completed before charging can be completed' });

    payment.billGenerated = true;
    payment.billGeneratedAt = new Date();
    await payment.save();

    booking.bookingStatus = 'Completed';
    booking.completedAt = new Date();
    await booking.save();

    res.status(200).json({ success: true, message: 'Charging completed and bill generated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to complete charging', error: error.message });
  }
};