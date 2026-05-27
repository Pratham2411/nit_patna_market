const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { formatUser } = require('../utils/formatUser');

module.exports = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (user && !user.isBanned) {
      req.user = formatUser(user);
      req.userDoc = user;
    }
  } catch {
    // ignore invalid token for optional auth
  }
  next();
};
