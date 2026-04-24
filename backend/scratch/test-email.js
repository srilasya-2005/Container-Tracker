const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

// Load .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { verifyTransport, getSmtpStatus } = require('../services/emailService');

async function test() {
  console.log('Current SMTP Status:', JSON.stringify(getSmtpStatus(), null, 2));
  console.log('Verifying transport...');
  const result = await verifyTransport();
  console.log('Verification Result:', JSON.stringify(result, null, 2));
  process.exit(result.success ? 0 : 1);
}

test();
