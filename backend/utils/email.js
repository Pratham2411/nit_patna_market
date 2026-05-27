/**
 * email.js — Campus Market mail service
 *
 * Uses Nodemailer with Gmail SMTP (or any SMTP provider).
 * Required env vars:
 *   SMTP_HOST   — e.g. smtp.gmail.com
 *   SMTP_PORT   — e.g. 587
 *   SMTP_USER   — your Gmail address
 *   SMTP_PASS   — your Gmail App Password (NOT your real password)
 *   FROM_EMAIL  — display "from" address (usually same as SMTP_USER)
 *
 * Optional:
 *   FROM_NAME       — sender display name  (default: "Campus Market")
 *   SMTP_SECURE     — "true" for port 465, leave unset/false for 587
 *   SMTP_TIMEOUT_MS — connection timeout in ms (default: 10000)
 *   FRONTEND_URL    — base URL for verify links (default: http://localhost:3000)
 *
 * NOTE: family:4 forces IPv4 resolution — required on Render (free tier) because
 * smtp.gmail.com resolves to an IPv6 address that is unreachable from Render's network.
 */

const nodemailer = require('nodemailer');
// Force IPv4 DNS resolution globally so smtp.gmail.com never resolves to an
// unreachable IPv6 address on hosting platforms like Render.
require('dns').setDefaultResultOrder('ipv4first');

// ─── Config helpers ───────────────────────────────────────────────────────────

/**
 * Returns true only when all four required SMTP env vars are present.
 * This check is used to decide whether to actually send vs. log in dev mode.
 */
const hasSmtpConfig = () =>
  ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'].every(
    (key) => !!process.env[key]
  );

const getFrontendUrl = () =>
  (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

const getFromName = () => process.env.FROM_NAME || 'Campus Market';

const getFromHeader = () =>
  `${getFromName()} <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`;

// ─── Reusable transporter (lazy-initialised, one instance per process) ────────

let _transporter = null;

/**
 * Returns a cached Nodemailer transporter configured for Gmail SMTP.
 * Lazily created on first call so env vars are read at send-time, not
 * at module-load time (important for some deployment platforms).
 */
const getTransporter = () => {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,              // smtp.gmail.com
    port: Number(process.env.SMTP_PORT),      // 587
    // port 465 → secure:true (TLS from the start)
    // port 587 → secure:false (plain then STARTTLS upgrade)
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    // family:4 forces an IPv4 TCP socket — critical on Render free tier where
    // smtp.gmail.com resolves to IPv6 (ENETUNREACH) instead of IPv4.
    family: 4,
    auth: {
      user: process.env.SMTP_USER,            // youraddress@gmail.com
      pass: process.env.SMTP_PASS,            // Gmail App Password (16 chars)
    },
    connectionTimeout: Number(process.env.SMTP_TIMEOUT_MS || 10000),
    greetingTimeout:   Number(process.env.SMTP_TIMEOUT_MS || 10000),
    socketTimeout:     Number(process.env.SMTP_TIMEOUT_MS || 10000),
  });

  return _transporter;
};

// ─── Email template builder ───────────────────────────────────────────────────

/**
 * Builds the plain-text and HTML bodies for the OTP verification email.
 * Returns { verifyUrl, subject, text, html }
 */
const buildVerificationMessage = ({ to, name, code }) => {
  const verifyUrl =
    `${getFrontendUrl()}/verify-email?email=${encodeURIComponent(to)}`;

  const subject = 'Your Campus Market verification code';

  const text = [
    `Hi ${name},`,
    ``,
    `Your Campus Market verification code is:`,
    ``,
    `  ${code}`,
    ``,
    `This code expires in 10 minutes.`,
    ``,
    `Or open this link to verify your email:`,
    `${verifyUrl}`,
    ``,
    `If you did not create an account, you can ignore this email.`,
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;
                border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">

      <!-- Header -->
      <div style="background:#18181b;padding:24px 32px">
        <h2 style="color:#ffffff;margin:0;font-size:1.2rem">Campus Market</h2>
      </div>

      <!-- Body -->
      <div style="padding:32px">
        <p style="margin-top:0">Hi <strong>${name}</strong>,</p>
        <p>Use the code below to verify your email address.</p>

        <!-- OTP box -->
        <div style="text-align:center;margin:28px 0">
          <span style="display:inline-block;font-size:36px;font-weight:700;
                       letter-spacing:10px;background:#f4f4f5;border-radius:8px;
                       padding:16px 28px;color:#18181b;font-family:monospace">
            ${code}
          </span>
        </div>

        <p style="color:#6b7280;font-size:0.875rem">
          ⏱ This code expires in <strong>10 minutes</strong>.
        </p>
        <p style="color:#6b7280;font-size:0.875rem">
          You can also
          <a href="${verifyUrl}" style="color:#18181b">click here</a>
          to open the verification page.
        </p>
        <p style="color:#9ca3af;font-size:0.8rem;margin-bottom:0">
          If you did not create an account, please ignore this email.
        </p>
      </div>
    </div>`;

  return { verifyUrl, subject, text, html };
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * sendVerificationEmail({ to, name, code })
 *
 * Sends a 6-digit OTP email via Gmail SMTP.
 *
 * In development (NODE_ENV !== 'production') with no SMTP config set,
 * the OTP is printed to the console instead so you can still test locally.
 *
 * Returns { verifyUrl }  on success.
 * Returns { verifyUrl, code }  only in dev console-fallback mode.
 * Throws an Error (statusCode=502) on send failure.
 */
const sendVerificationEmail = async ({ to, name, code }) => {
  const message = buildVerificationMessage({ to, name, code });

  // ── Dev fallback: no SMTP configured → just log ──────────────────────────
  if (!hasSmtpConfig()) {
    if (process.env.NODE_ENV === 'production') {
      const e = new Error(
        'Email service is not configured. ' +
        'Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in your environment.'
      );
      e.statusCode = 502;
      throw e;
    }
    // Non-production: print OTP so developers can test without email setup
    console.log('\n' + '─'.repeat(50));
    console.log('[DEV MODE] Verification email not sent — SMTP not configured');
    console.log(`  Recipient : ${to}`);
    console.log(`  OTP code  : ${code}`);
    console.log(`  Verify URL: ${message.verifyUrl}`);
    console.log('─'.repeat(50) + '\n');
    return { verifyUrl: message.verifyUrl, code };
  }

  // ── Send via Gmail SMTP ───────────────────────────────────────────────────
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: getFromHeader(),          // "Campus Market <you@gmail.com>"
      to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });

    console.log(`[email] Verification OTP sent to ${to}`);
    return { verifyUrl: message.verifyUrl };
  } catch (err) {
    // Log full error details for Render logs.
    // Nodemailer usually includes SMTP response codes (err.code / err.response).
    console.error('[email] Gmail SMTP send failed:', err);
    const details = err?.message ? ` (${err.message})` : '';

    // Surface a clean 502 to the caller (authRoutes will forward it to client)
    const e = new Error(`Failed to send verification email via Gmail SMTP.${details} Please verify your SMTP_USER/SMTP_PASS/SMTP_PORT settings.`);
    e.statusCode = 502;
    throw e;
  }
};

module.exports = { sendVerificationEmail };
