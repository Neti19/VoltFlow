const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

// Connect to MongoDB
connectDB();

// Core Middleware
app.use(cors());
app.use(express.json());
// Import Auth Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/stations', require('./routes/stationRoutes'));
app.use('/api/chargers', require('./routes/chargerRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));

// Test Route

app.get('/', (req, res) => {
  res.send('EV Charging Station Management System API is Running...');
});

// Define Server Port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});