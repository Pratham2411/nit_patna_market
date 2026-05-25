const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { formatUser } = require('../utils/formatUser');

module.exports = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'No token — authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (user.isBanned) return res.status(403).json({ message: 'Account suspended' });

    req.user = formatUser(user);
    req.userDoc = user;
    next();
  } catch {
    res.status(401).json({ message: 'Token is invalid or expired' });
  }
};
