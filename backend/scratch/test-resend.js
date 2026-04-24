const dotenv = require('dotenv');
const path = require('path');

// Load .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { sendEmail } = require('../services/emailService');

async function test() {
  console.log('Testing Resend...');
  console.log('RESEND_API_KEY present:', !!process.env.RESEND_API_KEY);
  
  const to = 'srilasyapasumarthi@gmail.com';
  const subject = 'Resend Test - Container Tracker';
  const html = '<p>Congrats on sending your <strong>first email via Resend</strong>!</p>';
  
  const result = await sendEmail(to, subject, html);
  console.log('Send Result:', JSON.stringify(result, null, 2));
  process.exit(result.success ? 0 : 1);
}

test();
