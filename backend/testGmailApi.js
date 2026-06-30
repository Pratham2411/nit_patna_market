require('dotenv').config();
const { sendBroadcastEmail, sendDigestEmailSmtp } = require('./utils/nodemailerEmail');

const runTest = async () => {
  console.log('Testing Gmail API Integration...');

  const testEmail = 'prathamraj2411@gmail.com';
  if (testEmail === 'test@example.com') {
    console.log('Using fallback test@example.com since env vars were missing.');
  }

  console.log(`Sending test emails to ${testEmail}...`);

  try {
    // 1. Test Broadcast
    console.log('\n1. Testing Broadcast Email...');
    const broadcastResult = await sendBroadcastEmail(
      testEmail, 
      'Test Admin', 
      'Gmail API Broadcast Test', 
      '<p>If you are reading this, the Gmail HTTP API broadcast works perfectly!</p>'
    );
    console.log('Broadcast Result:', broadcastResult);

    // 2. Test Digest
    console.log('\n2. Testing Digest Email...');
    const digestResult = await sendDigestEmailSmtp(
      testEmail,
      'Test User',
      [{ type: 'NEW_MESSAGE' }, { type: 'PRODUCT_UPDATE' }], // Mock notifications
      [{ title: 'Mock Product 1', price: 10 }, { title: 'Mock Product 2', price: 25 }] // Mock recent products
    );
    console.log('Digest Result:', digestResult);

    if (broadcastResult.success && digestResult.success) {
      console.log('\n✅ ALL TESTS PASSED! The Gmail API is perfectly integrated.');
      process.exit(0);
    } else {
      console.error('\n❌ SOME TESTS FAILED. Check the error output above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ FATAL ERROR DURING TESTING:', error);
    process.exit(1);
  }
};

runTest();
