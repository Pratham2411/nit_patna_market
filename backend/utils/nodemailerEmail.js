const { google } = require('googleapis');

let gmailClient = null;

// 1. Create the OAuth2 client (Singleton to prevent token fetching spam)
const getGmailClient = () => {
  if (gmailClient) return gmailClient;
  
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground' // Standard redirect URI for testing/personal use
  );

  oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

  gmailClient = google.gmail({ version: 'v1', auth: oAuth2Client });
  return gmailClient;
};

// 2. Helper to encode the email into a base64url string (required by Gmail API)
const makeMimeMessage = (to, fromName, fromEmail, subject, html) => {
  // Using =?utf-8?B?...?= encodes the subject so emojis and special characters work perfectly
  const encodedSubject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  
  const str = [
    `To: ${to}`,
    `From: "${fromName}" <${fromEmail}>`,
    `Subject: ${encodedSubject}`,
    `Content-Type: text/html; charset=utf-8`,
    `MIME-Version: 1.0`,
    '',
    html
  ].join('\r\n');

  // Base64url encode the string
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const escapeHtml = (unsafe) => {
  if (!unsafe) return '';
  return unsafe
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const getFromConfig = () => {
  const name = process.env.FROM_NAME || 'Campus Market';
  const email = process.env.GMAIL_SENDER_EMAIL || process.env.SMTP_USER || 'noreply@campusmarket.com';
  return { name, email };
};

// ── Broadcast Email ──

const sendBroadcastEmail = async (toEmail, recipientName, subject, htmlMessage) => {
  if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_REFRESH_TOKEN) {
    return { success: false, error: 'Gmail API OAuth2 not configured' };
  }

  const { name, email } = getFromConfig();
  const safeName = escapeHtml(recipientName);
  const gmail = getGmailClient();
  
  // Wrap the message with a greeting if not already present (optional, matching old behavior)
  const finalHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <p>Hi ${safeName},</p>
      ${htmlMessage}
    </div>
  `;

  try {
    const rawMessage = makeMimeMessage(toEmail, name, email, subject, finalHtml);
    
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: rawMessage }
    });
    return { success: true };
  } catch (error) {
    console.error(`Failed to send broadcast to ${toEmail}:`, error.message);
    return { success: false, error: error.message };
  }
};

// ── Weekly Digest Email ──

const sendDigestEmailSmtp = async (toEmail, recipientName, notifications = [], recentProducts = []) => {
  if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_REFRESH_TOKEN) {
    return { success: false, error: 'Gmail API OAuth2 not configured' };
  }

  const safeName = escapeHtml(recipientName);
  
  let newMessagesCount = 0;
  let productUpdateCount = 0;
  let commentReplyCount = 0;

  notifications.forEach(n => {
    if (n.type === 'NEW_MESSAGE') newMessagesCount++;
    else if (n.type === 'PRODUCT_UPDATE') productUpdateCount++;
    else if (n.type === 'COMMENT_REPLY') commentReplyCount++;
  });

  let contentHtml = '';
  if (newMessagesCount > 0) contentHtml += `<p>You have <strong>${newMessagesCount}</strong> unread message(s) in your inbox.</p>`;
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
      <h2 style="color: #7c3aed; margin-bottom: 20px;">Your Weekly Campus Market Digest</h2>
      <p>Hi ${safeName},</p>
      ${contentHtml}
      ${productsHtml}
      <div style="margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Check Your Notifications</a>
      </div>
      <p style="color: #64748b; font-size: 14px; margin-top: 40px; border-top: 1px solid #eaeaea; padding-top: 20px;">
        You're receiving this because you have active notifications or are subscribed to market updates.
      </p>
    </div>
  `;

  const { name, email } = getFromConfig();
  
  try {
    const gmail = getGmailClient();
    const rawMessage = makeMimeMessage(toEmail, name, email, 'Your Weekly Campus Market Digest', finalHtml);
    
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: rawMessage }
    });
    
    return { success: true };
  } catch (err) {
    console.error('Error sending digest email via Gmail API:', err);
    return { success: false, error: err.message };
  }
};

module.exports = {
  sendBroadcastEmail,
  sendDigestEmailSmtp
};
