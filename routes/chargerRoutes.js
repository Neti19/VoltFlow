const express = require('express');
const router = express.Router();
const {
  createCharger,
  getChargersByStation,
  getChargerById,
  updateCharger,
  deleteCharger
} = require('../controllers/chargerController');
const protect = require('../middleware/authMiddleware');

// Public routes (anyone can see chargers at a station)
router.get('/station/:stationId', getChargersByStation);
router.get('/:id', getChargerById);

// Protected routes (require Station Owner / Admin login)
router.post('/', protect, createCharger);
router.put('/:id', protect, updateCharger);
router.delete('/:id', protect, deleteCharger);

module.exports = router;