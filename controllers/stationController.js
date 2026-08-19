const ChargingStation = require('../models/ChargingStation');

// @desc    Create a new charging station (StationOwner only)
// @route   POST /api/stations
exports.createStation = async (req, res) => {
  try {
    const { stationName, address, longitude, latitude } = req.body;

    // Verify coordinates and name
    if (!stationName || !address || longitude === undefined || latitude === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // req.user.id comes from authMiddleware
    const station = new ChargingStation({
      ownerID: req.user.id,
      stationName,
      address,
      longitude,
      latitude
    });

    await station.save();

    res.status(201).json({
      success: true,
      message: 'Charging station created successfully',
      data: station
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get all charging stations
// @route   GET /api/stations
exports.getAllStations = async (req, res) => {
  try {
    // Populate owner details (name, email, phone, businessName) while hiding the password
    const stations = await ChargingStation.find().populate('ownerID', 'name email phone businessName');

    res.status(200).json({
      success: true,
      count: stations.length,
      data: stations
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get single station by ID
// @route   GET /api/stations/:id
exports.getStationById = async (req, res) => {
  try {
    const station = await ChargingStation.findById(req.params.id).populate('ownerID', 'name email phone businessName businessAddress');

    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }

    res.status(200).json({ success: true, data: station });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Update station details (Owner only)
// @route   PUT /api/stations/:id
exports.updateStation = async (req, res) => {
  try {
    let station = await ChargingStation.findById(req.params.id);

    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }

    // Ensure the logged-in user is the owner of this station or an Admin
    if (station.ownerID.toString() !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized: You do not own this station' });
    }

    station = await ChargingStation.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Station updated successfully',
      data: station
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Delete station (Owner or Admin)
// @route   DELETE /api/stations/:id
exports.deleteStation = async (req, res) => {
  try {
    const station = await ChargingStation.findById(req.params.id);

    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }

    // Ensure the logged-in user is the owner or an Admin
    if (station.ownerID.toString() !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized: You do not own this station' });
    }

    await station.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Station deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};