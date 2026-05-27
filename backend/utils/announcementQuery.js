const activeAnnouncementFilter = () => {
  const now = new Date();
  return {
    active: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  };
};

module.exports = { activeAnnouncementFilter };
