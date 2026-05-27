const nodemailer = require('nodemailer');

const requiredSmtpKeys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];

const hasSmtpConfig = () => requiredSmtpKeys.every((key) => !!process.env[key]);

const getFrontendUrl = () => process.env.FRONTEND_URL || 'http://localhost:3000';

const sendVerificationEmail = async ({ to, name, code }) => {
  const verifyUrl = `${getFrontendUrl().replace(/\/$/, '')}/verify-email?email=${encodeURIComponent(to)}`;

  if (!hasSmtpConfig()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email service is not configured');
    }
    console.log(`Email verification OTP for ${to}: ${code}`);
    console.log(`Email verification page for ${to}: ${verifyUrl}`);
    return { verifyUrl, code };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    connectionTimeout: Number(process.env.SMTP_TIMEOUT_MS || 10000),
    greetingTimeout: Number(process.env.SMTP_TIMEOUT_MS || 10000),
    socketTimeout: Number(process.env.SMTP_TIMEOUT_MS || 10000),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: 'Your NIT Patna Market verification code',
      text: `Hi ${name},\n\nYour NIT Patna Market verification code is: ${code}\n\nEnter it here: ${verifyUrl}\n\nThis code expires in 10 minutes.`,
      html: `
        <p>Hi ${name},</p>
        <p>Your NIT Patna Market verification code is:</p>
        <p style="font-size: 24px; font-weight: 700; letter-spacing: 4px;">${code}</p>
        <p>Enter it here: <a href="${verifyUrl}">Verify email</a></p>
        <p>This code expires in 10 minutes.</p>
      `,
    });
  } catch (err) {
    console.error('Verification email failed:', err.message);
    const friendly = new Error('Could not send verification email. Check SMTP settings and try again.');
    friendly.statusCode = 502;
    throw friendly;
  }

  return { verifyUrl };
};

module.exports = { sendVerificationEmail };
