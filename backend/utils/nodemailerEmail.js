const nodemailer = require('nodemailer');
const dns = require('dns');

// Force Node.js to prefer IPv4. Render does not support outbound IPv6, which causes ENETUNREACH errors.
dns.setDefaultResultOrder('ipv4first');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    pool: true, // Use pooled connections for loops
    maxConnections: 3,
    maxMessages: 100,
    family: 4, // Force IPv4 to prevent ENETUNREACH errors in IPv6-disabled environments like Render
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
};

const getFromConfig = () => {
  const name = process.env.FROM_NAME || 'Campus Market';
  const email = process.env.SMTP_USER || 'noreply@campusmarket.com';
  return `"${name}" <${email}>`;
};

const escapeHtml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const sendBroadcastEmail = async (toEmail, recipientName, subject, htmlBody) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('SMTP credentials not configured.');
    return { success: false, error: 'SMTP credentials not configured.' };
  }

  const safeName = escapeHtml(recipientName);
  
  const finalHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
      <p>Hi ${safeName},</p>
      <div style="background-color: #f4f4f5; padding: 20px; border-radius: 8px; margin: 24px 0; font-size: 16px; line-height: 1.5;">
        ${htmlBody}
      </div>
      <div style="margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Visit Campus Market</a>
      </div>
      <hr style="border: none; border-top: 1px solid #eaeaea; margin: 24px 0;" />
      <p style="font-size: 12px; color: #64748b; text-align: center;">Campus Market Team</p>
    </div>
  `;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: getFromConfig(),
      to: toEmail,
      subject: subject,
      html: finalHtml,
    });
    return { success: true };
  } catch (err) {
    console.error('Nodemailer Error (Broadcast):', err);
    return { success: false, error: err.message };
  }
};

const sendAnnouncementNotificationEmail = async (toEmail, recipientName, announcementTitle, announcementMessage) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return { success: false, error: 'SMTP not configured' };

  const safeName = escapeHtml(recipientName);
  const safeTitle = escapeHtml(announcementTitle);
  const safeMessage = escapeHtml(announcementMessage);

  const finalHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
      <h2 style="color: #1e293b;">${safeTitle}</h2>
      <p>Hi ${safeName},</p>
      <div style="background-color: #f4f4f5; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <p style="margin:0; white-space: pre-wrap;">${safeMessage}</p>
      </div>
      <div style="margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Campus Market</a>
      </div>
      <hr style="border: none; border-top: 1px solid #eaeaea; margin: 24px 0;" />
      <p style="font-size: 12px; color: #64748b; text-align: center;">Campus Market Team</p>
    </div>
  `;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: getFromConfig(),
      to: toEmail,
      subject: `New Announcement: ${safeTitle}`,
      html: finalHtml,
    });
    return { success: true };
  } catch (err) {
    console.error('Nodemailer Error (Announcement):', err);
    return { success: false, error: err.message };
  }
};

const sendDigestEmailSmtp = async (toEmail, recipientName, notifications = [], recentProducts = []) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return { success: false, error: 'SMTP not configured' };

  const safeName = escapeHtml(recipientName);

  const inboxCount = notifications.filter(n => n.category === 'inbox').length;
  const requestCount = notifications.filter(n => n.category === 'request').length;
  const productUpdateCount = notifications.filter(n => n.category === 'product_update').length;
  const commentReplyCount = notifications.filter(n => n.category === 'comment_reply').length;

  let contentHtml = '';
  if (inboxCount > 0) contentHtml += `<p>You have <strong>${inboxCount}</strong> new message(s) in your inbox.</p>`;
  if (requestCount > 0) contentHtml += `<p>You have <strong>${requestCount}</strong> new offer(s) for your item requests.</p>`;
  if (productUpdateCount > 0) contentHtml += `<p>Your products received <strong>${productUpdateCount}</strong> new comment(s).</p>`;
  if (commentReplyCount > 0) contentHtml += `<p>You have <strong>${commentReplyCount}</strong> new reply(ies) to your comments.</p>`;

  let productsHtml = '';
  if (recentProducts.length > 0) {
    productsHtml = `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea;">
        <h3 style="color: #1e293b; margin-bottom: 15px;">🛍️ New in the Market This Week</h3>
        <ul style="list-style-type: none; padding: 0; margin: 0;">
          ${recentProducts.map(p => `
            <li style="margin-bottom: 12px; padding: 12px; background-color: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
              <strong>${escapeHtml(p.title)}</strong><br/>
              <span style="color: #16a34a; font-weight: bold;">$${p.price}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  if (!contentHtml && !productsHtml) return { success: true };

  const finalHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
      <h2 style="color: #1e293b;">Your Weekly Digest</h2>
      <p>Hi ${safeName},</p>
      ${contentHtml}
      ${productsHtml}
      <div style="margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Check Your Notifications</a>
      </div>
      <hr style="border: none; border-top: 1px solid #eaeaea; margin: 24px 0;" />
      <p style="font-size: 12px; color: #64748b; text-align: center;">Campus Market Team</p>
    </div>
  `;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: getFromConfig(),
      to: toEmail,
      subject: 'Your Weekly Digest from Campus Market',
      html: finalHtml,
    });
    return { success: true };
  } catch (err) {
    console.error('Nodemailer Error (Digest):', err);
    return { success: false, error: err.message };
  }
};

module.exports = { sendBroadcastEmail, sendAnnouncementNotificationEmail, sendDigestEmailSmtp };
