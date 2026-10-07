const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Station = require('../models/ChargingStation');

const {
  createEarningsReportPdf
} = require('../utils/earningsPdf');

// ============================================================
// PROCESS PAYMENT
// ============================================================

exports.processPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(
      req.params.paymentId
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Check payment belongs to logged-in user
    const booking = await Booking.findById(
      payment.bookingID
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (
      booking.userID.toString() !==
      req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          'You are not authorized to process this payment'
      });
    }

    if (
      payment.paymentStatus === 'Completed'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Payment has already been processed'
      });
    }

    // Calculate tax
    const baseAmount =
      Number(payment.amount || 0);

    const taxRate = 18;

    const taxAmount =
      (baseAmount * taxRate) / 100;

    const totalAmount =
      baseAmount + taxAmount;

    payment.taxRate = taxRate;

    payment.taxAmount =
      Number(taxAmount.toFixed(2));

    payment.totalAmount =
      Number(totalAmount.toFixed(2));

    payment.paymentStatus =
      'Completed';

    await payment.save();

    // Confirm booking
    booking.bookingStatus =
      'Confirmed';

    await booking.save();

    res.status(200).json({
      success: true,
      message:
        'Payment successful, your slot is confirmed!',
      data: {
        payment,
        booking
      }
    });

  } catch (error) {
    console.error(
      'Payment error:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};


// ============================================================
// GET BILL
// ============================================================

exports.getBill = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      bookingID: req.params.bookingID
    }).populate({
      path: 'bookingID',
      populate: [
        {
          path: 'stationID',
          select:
            'stationName address'
        },
        {
          path: 'chargerID',
          select:
            'vehicleType chargingSpeed pricePerKwh chargingDuration'
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Make sure bill belongs to current user
    if (
      payment.bookingID.userID &&
      payment.bookingID.userID.toString() !==
        req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          'You are not authorized to view this bill'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error(
      'Get bill error:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Failed to get bill',
      error: error.message
    });
  }
};


// ============================================================
// OWNER EARNINGS
// ============================================================

exports.getOwnerEarnings = async (req, res) => {
  try {
    // Get all stations owned by current owner
    const stations = await Station.find({
      ownerID: req.user.id
    }).sort({
      stationName: 1
    });

    const stationReports = [];

    let ownerTotalEarnings = 0;
    let ownerTotalPayments = 0;
    let ownerTotalCompletedBookings = 0;

    // Calculate earnings station by station
    for (const station of stations) {

      const bookings = await Booking.find({
        stationID: station._id
      }).select(
        '_id bookingStatus'
      );

      const bookingIDs = bookings.map(
        booking => booking._id
      );

      const payments = bookingIDs.length
        ? await Payment.find({
            bookingID: {
              $in: bookingIDs
            },
            paymentStatus: 'Completed'
          }).sort({
            createdAt: -1
          })
        : [];

      // Station earnings
      const totalEarnings =
        payments.reduce(
          (sum, payment) => {
            return (
              sum +
              Number(
                payment.totalAmount ||
                payment.amount ||
                0
              )
            );
          },
          0
        );

      const completedBookings =
        bookings.filter(
          booking =>
            booking.bookingStatus ===
            'Completed'
        );

      const stationEarnings = {
        stationId: station._id,

        stationName:
          station.stationName,

        address:
          station.address,

        openingTime:
          station.openingTime,

        closingTime:
          station.closingTime,

        totalEarnings:
          Number(
            totalEarnings.toFixed(2)
          ),

        totalPayments:
          payments.length,

        totalCompletedBookings:
          completedBookings.length
      };

      stationReports.push(
        stationEarnings
      );

      // Owner totals
      ownerTotalEarnings +=
        totalEarnings;

      ownerTotalPayments +=
        payments.length;

      ownerTotalCompletedBookings +=
        completedBookings.length;
    }

    res.status(200).json({
      success: true,

      data: {
        totalEarnings:
          Number(
            ownerTotalEarnings.toFixed(2)
          ),

        totalPaidBookings:
          ownerTotalPayments,

        totalCompletedBookings:
          ownerTotalCompletedBookings,

        stations:
          stationReports
      }
    });

  } catch (error) {

    console.error(
      'Owner earnings error:',
      error
    );

    res.status(500).json({
      success: false,
      message:
        'Failed to calculate owner earnings',
      error:
        error.message
    });
  }
};


// ============================================================
// OWNER EARNINGS PDF
// ============================================================

exports.getOwnerEarningsPdf = async (req, res) => {
  try {

    // Only StationOwner can generate this report
    if (req.user.role !== 'StationOwner') {
      return res.status(403).json({
        success: false,
        message:
          'Only station owners can generate earnings reports'
      });
    }

    const type =
      String(
        req.query.type || 'monthly'
      ).toLowerCase();

    const year =
      Number(req.query.year);

    const month =
      Number(req.query.month);

    const stationId =
      req.query.stationId;

    // Validate report type
    if (
      type !== 'monthly' &&
      type !== 'yearly'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Type must be monthly or yearly'
      });
    }

    // Validate year
    if (
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid year'
      });
    }

    // Validate month
    if (
      type === 'monthly' &&
      (
        !Number.isInteger(month) ||
        month < 1 ||
        month > 12
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid month'
      });
    }

    // Station is required
    if (!stationId) {
      return res.status(400).json({
        success: false,
        message:
          'stationId is required'
      });
    }

    // -----------------------------------------
    // Report date range
    // -----------------------------------------

    let startDate;
    let endDate;

    if (type === 'monthly') {

      startDate =
        new Date(
          year,
          month - 1,
          1
        );

      endDate =
        new Date(
          year,
          month,
          1
        );

    } else {

      startDate =
        new Date(
          year,
          0,
          1
        );

      endDate =
        new Date(
          year + 1,
          0,
          1
        );
    }

    const owner = req.user;

    // -----------------------------------------
    // Get ONLY requested station
    // -----------------------------------------

    const station =
      await Station.findOne({
        _id: stationId,
        ownerID: owner._id
      });

    if (!station) {
      return res.status(404).json({
        success: false,
        message:
          'Station not found or you are not authorized to access it'
      });
    }

    // -----------------------------------------
    // Get bookings ONLY for this station
    // -----------------------------------------

    const bookings =
      await Booking.find({
        stationID: station._id
      }).select(
        '_id bookingStatus bookingDate createdAt'
      );

    const bookingIDs =
      bookings.map(
        booking => booking._id
      );

    // -----------------------------------------
    // Get payments ONLY for this station
    // AND selected date range
    // -----------------------------------------

    const payments =
      bookingIDs.length
        ? await Payment.find({
            bookingID: {
              $in: bookingIDs
            },

            paymentStatus:
              'Completed',

            createdAt: {
              $gte: startDate,
              $lt: endDate
            }

          })
            .populate({
              path: 'bookingID',
              select:
                'bookingDate createdAt'
            })
            .sort({
              createdAt: 1
            })
        : [];

    // -----------------------------------------
    // Calculate amounts
    // -----------------------------------------

    const totalBaseAmount =
      payments.reduce(
        (total, payment) =>
          total +
          Number(
            payment.amount || 0
          ),
        0
      );

    const totalTax =
      payments.reduce(
        (total, payment) =>
          total +
          Number(
            payment.taxAmount || 0
          ),
        0
      );

    const totalEarnings =
      payments.reduce(
        (total, payment) =>
          total +
          Number(
            payment.totalAmount ||
            payment.amount ||
            0
          ),
        0
      );

    // -----------------------------------------
    // Only required payment information
    // -----------------------------------------

    const paymentRows =
      payments.map(payment => ({
        date:
          payment.createdAt,

        bookingDate:
          payment.bookingID?.bookingDate ||
          payment.bookingID?.createdAt ||
          null,

        transactionID:
          payment.transactionID ||
          '-',

        amount:
          Number(
            payment.amount || 0
          ),

        taxAmount:
          Number(
            payment.taxAmount || 0
          ),

        totalAmount:
          Number(
            payment.totalAmount ||
            payment.amount ||
            0
          )
      }));

    // -----------------------------------------
    // Generate PDF
    // -----------------------------------------

    const pdf =
      createEarningsReportPdf({
        owner: {
          name:
            owner.name || '-',

          email:
            owner.email || '-',

          phone:
            owner.phone || '-',

          businessName:
            owner.businessName || '-',

          businessAddress:
            owner.businessAddress || '-'
        },

        station: {
          stationId:
            station._id,

          stationName:
            station.stationName || '-',

          address:
            station.address || '-',

          openingTime:
            station.openingTime || '-',

          closingTime:
            station.closingTime || '-'
        },

        payments:
          paymentRows,

        reportType:
          type,

        year,

        month,

        totalBaseAmount:
          Number(
            totalBaseAmount.toFixed(2)
          ),

        totalTax:
          Number(
            totalTax.toFixed(2)
          ),

        totalEarnings:
          Number(
            totalEarnings.toFixed(2)
          ),

        totalPayments:
          payments.length
      });

    // -----------------------------------------
    // PDF response headers
    // -----------------------------------------

    res.setHeader(
      'Content-Type',
      'application/pdf'
    );

    const safeStationName =
      String(
        station.stationName ||
        'station'
      )
        .replace(
          /[^a-z0-9]+/gi,
          '-'
        )
        .replace(
          /^-+|-+$/g,
          ''
        )
        .toLowerCase();

    const fileName =
      type === 'monthly'
        ? `VoltFlow-${safeStationName}-monthly-earnings-${year}-${String(month).padStart(2, '0')}.pdf`
        : `VoltFlow-${safeStationName}-yearly-earnings-${year}.pdf`;

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"`
    );

    pdf.pipe(res);
    pdf.end();

  } catch (error) {

    console.error(
      'Owner earnings PDF error:',
      error
    );

    res.status(500).json({
      success: false,
      message:
        'Failed to generate earnings PDF',
      error:
        error.message
    });
  }
};