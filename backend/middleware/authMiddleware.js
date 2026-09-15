const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Grab token from the request header
  const authHeader = req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next(); // Move on to the actual route logic
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};