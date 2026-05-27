const nodemailer = require('nodemailer');

const requiredSmtpKeys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];

const hasSmtpConfig = () => requiredSmtpKeys.every((key) => !!process.env[key]);
const hasBrevoApiConfig = () => !!process.env.BREVO_API_KEY;

const getFrontendUrl = () => process.env.FRONTEND_URL || 'http://localhost:3000';

const getFromAddress = () => {
  const from = process.env.SMTP_FROM || process.env.BREVO_FROM_EMAIL || process.env.SMTP_USER;
  const match = String(from || '').match(/<([^>]+)>/);
  return match ? match[1] : from;
};

const getFromName = () => process.env.BREVO_FROM_NAME || 'NIT Patna Market';

const buildVerificationMessage = ({ to, name, code }) => {
  const verifyUrl = `${getFrontendUrl().replace(/\/$/, '')}/verify-email?email=${encodeURIComponent(to)}`;
  const subject = 'Your NIT Patna Market verification code';
  const text = `Hi ${name},\n\nYour NIT Patna Market verification code is: ${code}\n\nEnter it here: ${verifyUrl}\n\nThis code expires in 10 minutes.`;
  const html = `
    <p>Hi ${name},</p>
    <p>Your NIT Patna Market verification code is:</p>
    <p style="font-size: 24px; font-weight: 700; letter-spacing: 4px;">${code}</p>
    <p>Enter it here: <a href="${verifyUrl}">Verify email</a></p>
    <p>This code expires in 10 minutes.</p>
  `;

  return { verifyUrl, subject, text, html };
};

const throwEmailError = (err, provider) => {
  console.error(`Verification email failed via ${provider}:`, err.message);
  const friendly = new Error(`Could not send verification email via ${provider}. Check email provider settings and try again.`);
  friendly.statusCode = 502;
  throw friendly;
};

const sendWithBrevoApi = async ({ to, name, subject, text, html }) => {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: getFromName(), email: getFromAddress() },
      to: [{ email: to, name }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    let detail = '';
    try {
      detail = JSON.stringify(await response.json());
    } catch {
      detail = await response.text();
    }
    throw new Error(`Brevo API ${response.status}: ${detail}`);
  }
};

const sendWithSmtp = async ({ to, subject, text, html }) => {
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

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
};

const sendVerificationEmail = async ({ to, name, code }) => {
  const message = buildVerificationMessage({ to, name, code });

  if (!hasBrevoApiConfig() && !hasSmtpConfig()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email service is not configured');
    }
    console.log(`Email verification OTP for ${to}: ${code}`);
    console.log(`Email verification page for ${to}: ${message.verifyUrl}`);
    return { verifyUrl: message.verifyUrl, code };
  }

  if (hasBrevoApiConfig()) {
    try {
      await sendWithBrevoApi({ to, name, ...message });
      return { verifyUrl: message.verifyUrl };
    } catch (err) {
      if (!hasSmtpConfig()) throwEmailError(err, 'Brevo API');
      console.error('Brevo API email failed; trying SMTP fallback:', err.message);
    }
  }

  try {
    await sendWithSmtp({ to, ...message });
  } catch (err) {
    throwEmailError(err, 'SMTP');
  }

  return { verifyUrl: message.verifyUrl };
};

module.exports = { sendVerificationEmail };
