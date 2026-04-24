const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { verifyTransport, getSmtpStatus, sendEmployeeOnboardingEmail } = require('./services/emailService');

const recipient = process.argv[2] || process.env.SMTP_USER;

(async () => {
  console.log('Status:', getSmtpStatus());
  console.log('Verify:', await verifyTransport());
  console.log('Send result:', await sendEmployeeOnboardingEmail(recipient, 'Test User', 'TempPass@123'));
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
