const ADMIN_EMAILS = [
  'prathamraj2411@gmail.com',
  'adityamadhav1509@gmail.com',
  'gautamprimary5@gmail.com',
];

const isAdminEmail = (email) =>
  ADMIN_EMAILS.includes(String(email || '').toLowerCase().trim());

module.exports = { isAdminEmail };
