const Charger = require('../models/Charger');
const ChargingStation = require('../models/ChargingStation');

// @desc    Add a new charger to a charging station (Station Owner or Admin)
// @route   POST /api/chargers
exports.createCharger = async (req, res) => {
  try {
    const { stationID, vehicleType, chargingSpeed, status } = req.body;

    // 1. Validation
    if (!stationID || !vehicleType || !chargingSpeed) {
      return res.status(400).json({
        success: false,
        message: 'Please provide stationID, vehicleType, and chargingSpeed'
      });
    }

    // 2. Check if station exists
    const station = await ChargingStation.findById(stationID);
    if (!station) {
      return res.status(404).json({ success: false, message: 'Charging station not found' });
    }

    // 3. Verify ownership (must be station owner or admin)
    if (station.ownerID.toString() !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not own this station'
      });
    }

    // 4. Create charger
    const charger = new Charger({
      stationID,
      vehicleType,
      chargingSpeed,
      status: status || 'Available'
    });

    await charger.save();

    res.status(201).json({
      success: true,
      message: 'Charger added successfully to station',
      data: charger
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get all chargers for a specific station
// @route   GET /api/chargers/station/:stationId
exports.getChargersByStation = async (req, res) => {
  try {
    const chargers = await Charger.find({ stationID: req.params.stationId });

    res.status(200).json({
      success: true,
      count: chargers.length,
      data: chargers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get single charger by ID
// @route   GET /api/chargers/:id
exports.getChargerById = async (req, res) => {
  try {
    const charger = await Charger.findById(req.params.id).populate('stationID', 'stationName address');

    if (!charger) {
      return res.status(404).json({ success: false, message: 'Charger not found' });
    }

    res.status(200).json({ success: true, data: charger });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Update charger details or status (e.g., Available -> Maintenance)
// @route   PUT /api/chargers/:id
exports.updateCharger = async (req, res) => {
  try {
    const charger = await Charger.findById(req.params.id);
    if (!charger) {
      return res.status(404).json({ success: false, message: 'Charger not found' });
    }

    // Find the station to verify ownership
    const station = await ChargingStation.findById(charger.stationID);
    if (station && station.ownerID.toString() !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to modify this charger' });
    }

    const updatedCharger = await Charger.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Charger updated successfully',
      data: updatedCharger
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Delete a charger
// @route   DELETE /api/chargers/:id
exports.deleteCharger = async (req, res) => {
  try {
    const charger = await Charger.findById(req.params.id);
    if (!charger) {
      return res.status(404).json({ success: false, message: 'Charger not found' });
    }

    // Find the station to verify ownership
    const station = await ChargingStation.findById(charger.stationID);
    if (station && station.ownerID.toString() !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this charger' });
    }

    await charger.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Charger deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};