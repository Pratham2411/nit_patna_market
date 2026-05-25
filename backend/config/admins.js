const ADMIN_EMAILS = [
  'prathamraj2411@gmail.com',
  'adityamadhav1509@gmail.com',
  'gautamr.ug23.ee@nitp.ac.in',
];

const isAdminEmail = (email) =>
  ADMIN_EMAILS.includes(String(email || '').toLowerCase().trim());

module.exports = { ADMIN_EMAILS, isAdminEmail };
