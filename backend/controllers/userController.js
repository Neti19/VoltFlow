const User = require('../models/User');

// @desc    Get user profile by ID
// @route   GET /api/users/profile/:id
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile/:id
exports.updateUserProfile = async (req, res) => {
  try {
    const { name, phone, vehicleType, businessName, businessAddress } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, phone, vehicleType, businessName, businessAddress },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};