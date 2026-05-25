const { isAdminEmail } = require('../config/admins');

const resolveRole = (user) => {
  if (user.role === 'admin' || isAdminEmail(user.email)) return 'admin';
  return user.role || 'user';
};

const formatUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: resolveRole(user),
  isAdmin: resolveRole(user) === 'admin',
  isBanned: !!user.isBanned,
});

module.exports = { formatUser, resolveRole };
