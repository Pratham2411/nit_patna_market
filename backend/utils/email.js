const nodemailer = require('nodemailer');

const requiredSmtpKeys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];

const hasSmtpConfig = () => requiredSmtpKeys.every((key) => !!process.env[key]);

const getFrontendUrl = () => process.env.FRONTEND_URL || 'http://localhost:3000';

const sendVerificationEmail = async ({ to, name, token }) => {
  const verifyUrl = `${getFrontendUrl().replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(token)}`;

  if (!hasSmtpConfig()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email service is not configured');
    }
    console.log(`Email verification link for ${to}: ${verifyUrl}`);
    return { verifyUrl };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: 'Verify your NIT Patna Market email',
    text: `Hi ${name},\n\nVerify your email to finish creating your NIT Patna Market account:\n${verifyUrl}\n\nThis link expires in 24 hours.`,
    html: `
      <p>Hi ${name},</p>
      <p>Verify your email to finish creating your NIT Patna Market account.</p>
      <p><a href="${verifyUrl}">Verify email</a></p>
      <p>This link expires in 24 hours.</p>
    `,
  });

  return { verifyUrl };
};

module.exports = { sendVerificationEmail };
