require('dotenv').config();
const { sendBroadcastEmail } = require('./utils/nodemailerEmail');

async function runTest() {
  console.log('Testing SMTP connection...');
  
  if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your_gmail@gmail.com') {
    console.error('❌ Error: Please update SMTP_USER and SMTP_PASS in your backend/.env file first.');
    return;
  }

  // We will send the test email to your own SMTP_USER address
  const testEmail = process.env.SMTP_USER;
  
  console.log(`Sending test email to: ${testEmail}`);
  
  const result = await sendBroadcastEmail(
    testEmail, 
    'Admin Tester', 
    'Test Broadcast Email', 
    'Hello! If you are reading this, your Nodemailer and Gmail SMTP setup is working perfectly. 🎉'
  );

  if (result.success) {
    console.log('✅ Success! The test email was sent. Please check your inbox (and spam folder just in case).');
  } else {
    console.error('❌ Failed to send email:', result.error);
  }
}

runTest();
