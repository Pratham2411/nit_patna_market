const { resolveRole } = require('../utils/formatUser');

module.exports = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  if (resolveRole(req.user) !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
