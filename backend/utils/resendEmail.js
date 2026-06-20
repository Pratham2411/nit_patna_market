const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Send an OTP verification email using Resend
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - The 6-digit OTP code
 * @param {string} name - Recipient name
 * @returns {Promise<{success: boolean, error?: string}>}
 */
const sendOtpEmail = async (toEmail, otp, name) => {
  const isDummyKey = process.env.RESEND_API_KEY === 're_your_api_key_here';
  
  if (!resend || isDummyKey) {
    if (process.env.NODE_ENV === 'development') {
      console.log('\n=========================================');
      console.log(`🔒 LOCAL DEV OTP for ${toEmail}: ${otp}`);
      console.log('=========================================\n');
      return { success: true };
    }
    console.error('RESEND_API_KEY is missing or invalid. Email not sent.');
    return { success: false, error: 'Email service is not configured' };
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: 'Verify your Campus Market Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #7c3aed; text-align: center;">Campus Market Verification</h2>
          <p>Hi ${name},</p>
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

module.exports = { sendOtpEmail };
