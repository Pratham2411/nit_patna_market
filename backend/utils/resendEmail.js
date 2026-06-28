const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const escapeHtml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const getEmailClientState = () => ({
  isDummyKey: process.env.RESEND_API_KEY === 're_your_api_key_here',
  fromEmail: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
});

/**
 * Send an OTP verification email using Resend
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - The 6-digit OTP code
 * @param {string} name - Recipient name
 * @returns {Promise<{success: boolean, error?: string}>}
 */
const sendOtpEmail = async (toEmail, otp, name) => {
  const { isDummyKey, fromEmail } = getEmailClientState();
  
  if (!resend || isDummyKey) {
    if (process.env.NODE_ENV === 'development') {
      console.log('\n=========================================');
      console.log(`LOCAL DEV OTP for ${toEmail}: ${otp}`);
      console.log('=========================================\n');
      return { success: true };
    }
    console.error('RESEND_API_KEY is missing or invalid. Email not sent.');
    return { success: false, error: 'Email service is not configured' };
  }

  const safeName = escapeHtml(name);

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: 'Verify your Campus Market Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #7c3aed; text-align: center;">Campus Market Verification</h2>
          <p>Hi ${safeName},</p>
          <p>Thank you for signing up for Campus Market! Please use the verification code below to complete your registration:</p>
          
          <div style="background-color: #f4f4f5; padding: 20px; text-align: center; border-radius: 8px; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b;">${otp}</span>
          </div>
          
          <p>This code will expire in <strong>10 minutes</strong>. Do not share this code with anyone.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 24px 0;" />
          <p style="font-size: 12px; color: #64748b; text-align: center;">Campus Market Team</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend API error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to send email:', err);
    return { success: false, error: 'Failed to send email' };
  }
};

const sendNewMessageEmail = async (toEmail, recipientName, senderName, productName, productUrl) => {
  const { isDummyKey, fromEmail } = getEmailClientState();
  
  if (!resend || isDummyKey) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`\nLOCAL DEV NEW MESSAGE for ${toEmail}: ${senderName} messaged about ${productName}\n`);
      return { success: true };
    }
    return { success: false, error: 'Email service is not configured' };
  }

  const safeName = escapeHtml(recipientName);
  const safeSender = escapeHtml(senderName);
  const safeProduct = escapeHtml(productName);

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `New Message from ${safeSender} about ${safeProduct}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #1e293b;">You have a new message!</h2>
          <p>Hi ${safeName},</p>
          <p><strong>${safeSender}</strong> has sent you a message regarding your listing for <strong>${safeProduct}</strong>.</p>
          
          <div style="margin: 30px 0;">
            <a href="${productUrl}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Message</a>
          </div>
          
          <p>If you have any questions, feel free to reply directly to them on the platform.</p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 24px 0;" />
          <p style="font-size: 12px; color: #64748b; text-align: center;">NIT Patna Marketplace</p>
        </div>
      `,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to send email' };
  }
};

const sendRequestOfferEmail = async (toEmail, recipientName, senderName, requestTitle, inboxUrl) => {
  const { isDummyKey, fromEmail } = getEmailClientState();

  if (!resend || isDummyKey) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`\nLOCAL DEV REQUEST OFFER for ${toEmail}: ${senderName} can help with ${requestTitle}\n`);
      return { success: true };
    }
    return { success: false, error: 'Email service is not configured' };
  }

  const safeName = escapeHtml(recipientName);
  const safeSender = escapeHtml(senderName);
  const safeRequest = escapeHtml(requestTitle);

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `${safeSender} has your requested item: ${safeRequest}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #1e293b;">Someone can help with your request</h2>
          <p>Hi ${safeName},</p>
          <p><strong>${safeSender}</strong> clicked <strong>I have this</strong> for your request: <strong>${safeRequest}</strong>.</p>
          <p>A conversation has been created in your inbox so you can continue safely on NITP Market.</p>

          <div style="margin: 30px 0;">
            <a href="${inboxUrl}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Open Inbox</a>
          </div>

          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 24px 0;" />
          <p style="font-size: 12px; color: #64748b; text-align: center;">NIT Patna Marketplace</p>
        </div>
      `,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to send email' };
  }
};

const sendDigestEmail = async (toEmail, recipientName, notifications) => {
  const { isDummyKey, fromEmail } = getEmailClientState();

  if (!resend || isDummyKey) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`\nLOCAL DEV DIGEST for ${toEmail}: ${notifications.length} notifications\n`);
      return { success: true };
    }
    return { success: false, error: 'Email service is not configured' };
  }

  const safeName = escapeHtml(recipientName);

  const inboxCount = notifications.filter(n => n.category === 'inbox').length;
  const requestCount = notifications.filter(n => n.category === 'request').length;

  let contentHtml = '';
  if (inboxCount > 0) contentHtml += `<p>You have <strong>${inboxCount}</strong> new message(s) in your inbox.</p>`;
  if (requestCount > 0) contentHtml += `<p>You have <strong>${requestCount}</strong> new offer(s) for your item requests.</p>`;

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `Your Daily Digest from Campus Market`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #1e293b;">Daily Notification Digest</h2>
          <p>Hi ${safeName},</p>
          ${contentHtml}
          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Campus Market</a>
          </div>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 24px 0;" />
          <p style="font-size: 12px; color: #64748b; text-align: center;">NIT Patna Marketplace</p>
        </div>
      `,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to send email' };
  }
};

const sendPasswordResetEmail = async (toEmail, otp, name) => {
  const { isDummyKey, fromEmail } = getEmailClientState();

  if (!resend || isDummyKey) {
    if (process.env.NODE_ENV === 'development') {
      console.log('\n=========================================');
      console.log(`LOCAL DEV PASSWORD RESET OTP for ${toEmail}: ${otp}`);
      console.log('=========================================\n');
      return { success: true };
    }
    console.error('RESEND_API_KEY is missing or invalid. Email not sent.');
    return { success: false, error: 'Email service is not configured' };
  }

  const safeName = escapeHtml(name);

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: 'Reset your Campus Market Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #7c3aed; text-align: center;">Password Reset</h2>
          <p>Hi ${safeName},</p>
          <p>We received a request to reset your Campus Market password. Use the code below to set a new password:</p>
          
          <div style="background-color: #f4f4f5; padding: 20px; text-align: center; border-radius: 8px; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b;">${otp}</span>
          </div>
          
          <p>This code will expire in <strong>10 minutes</strong>. Do not share this code with anyone.</p>
          <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 24px 0;" />
          <p style="font-size: 12px; color: #64748b; text-align: center;">Campus Market Team</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend API error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to send password reset email:', err);
    return { success: false, error: 'Failed to send email' };
  }
};

module.exports = { sendOtpEmail, sendNewMessageEmail, sendRequestOfferEmail, sendDigestEmail, sendPasswordResetEmail };