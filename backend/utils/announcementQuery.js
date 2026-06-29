const activeAnnouncementFilter = () => {
  const now = new Date();
  return {
    active: true,
    type: 'banner',
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  };
};

module.exports = { activeAnnouncementFilter };
