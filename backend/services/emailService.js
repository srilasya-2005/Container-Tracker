const nodemailer = require('nodemailer');
const dns = require('dns');
const path = require('path');
const fs = require('fs');
const { Resend } = require('resend');

dns.setDefaultResultOrder('ipv4first');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resendClient = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Force IPv4-only resolution for SMTP — Railway and many cloud hosts
// have no outbound IPv6 connectivity, and Gmail's AAAA records cause ENETUNREACH.
const ipv4Lookup = (hostname, options, callback) => {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  return dns.lookup(hostname, { ...options, family: 4, all: false }, callback);
};

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_FROM = process.env.SMTP_FROM || 'info@lmh.ltd';
const APP_URL = process.env.APP_URL || 'https://dashboard.lmh.ltd/';
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'info@lmh.ltd';
const LOGO_PATH = path.join(__dirname, '..', 'assets', 'lmh.png');
const LOGO_URL = process.env.LOGO_URL || 'https://api.lmh.ltd/assets/lmh.png';
const logoExists = fs.existsSync(LOGO_PATH);

const isSmtpConfigured = () => Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

const getSmtpStatus = () => ({
  configured: isSmtpConfigured(),
  host: SMTP_HOST || null,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  user: SMTP_USER ? `${SMTP_USER.slice(0, 3)}***@${SMTP_USER.split('@')[1] || ''}` : null,
  hasPass: Boolean(SMTP_PASS),
  from: SMTP_FROM
});

const getTransporter = () => {
  if (!isSmtpConfigured()) return null;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    requireTLS: !SMTP_SECURE && SMTP_PORT === 587,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    },
    family: 4,
    lookup: ipv4Lookup,
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
    tls: {
      minVersion: 'TLSv1.2',
      servername: SMTP_HOST
    }
  });
};

const verifyTransport = async () => {
  if (!isSmtpConfigured()) {
    return { success: false, error: 'SMTP not configured on this server' };
  }
  try {
    const transporter = getTransporter();
    await transporter.verify();
    return { success: true };
  } catch (error) {
    console.error('SMTP verify failed:', error);
    return { success: false, error: error.message, code: error.code };
  }
};

const sendViaResend = async (to, subject, html) => {
  try {
    const { data, error } = await resendClient.emails.send({
      from: `LMH TRADING <${SMTP_FROM}>`,
      to: [to],
      subject,
      html
    });
    if (error) {
      console.error(`Resend error sending to ${to}: ${error.name || ''} ${error.message || JSON.stringify(error)}`);
      return { success: false, error: error.message || 'Resend send failed' };
    }
    console.log(`Email sent via Resend to ${to}: ${subject} (id=${data?.id})`);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error(`Resend threw sending to ${to}: ${err.message}`);
    return { success: false, error: err.message };
  }
};

const sendViaSmtp = async (to, subject, html) => {
  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: `"LMH TRADING" <${SMTP_FROM}>`,
      to,
      subject,
      html
    });
    console.log(`Email sent via SMTP to ${to}: ${subject} (messageId=${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`SMTP error sending to ${to}: code=${error.code} response=${error.response} message=${error.message}`);
    return { success: false, error: error.message, code: error.code };
  }
};

const sendEmail = async (to, subject, html) => {
  if (resendClient) {
    return sendViaResend(to, subject, html);
  }
  if (!isSmtpConfigured()) {
    console.warn('Neither RESEND_API_KEY nor SMTP credentials configured. Email not sent.');
    return { success: false, error: 'No email transport configured' };
  }
  return sendViaSmtp(to, subject, html);
};

const buildHeader = (subtitle) => `
  <div class="header">
    <table class="header-table" role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td class="header-logo-cell">
          <span class="header-logo-wrap">
            <img src="${LOGO_URL}" alt="LMH Group" class="header-logo" width="56" height="56" />
          </span>
        </td>
        <td class="header-text-cell">
          <h1>Welcome to LMH Group</h1>
          <p class="subtitle">${subtitle}</p>
        </td>
      </tr>
    </table>
  </div>
`;

const buildFooter = () => `
  <div class="footer">
    <p><strong>LMH Trading &mdash; FZCO</strong> &middot; Container Management System</p>
    <div class="divider"></div>
    <p>For any queries, please write to us at <a href="mailto:${CONTACT_EMAIL}" style="color:#0F172A;text-decoration:underline;font-weight:600;">${CONTACT_EMAIL}</a></p>
    <p style="margin-top: 8px;">This is a system-generated message. Kindly do not reply to this email.</p>
    <p style="margin-top: 12px; color: #94A3B8; font-size: 12px;">&copy; ${new Date().getFullYear()} LMH Trading &mdash; FZCO. All rights reserved.</p>
  </div>
`;

// Basic professional email styling
const emailStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { 
    font-family: Arial, sans-serif; 
    line-height: 1.6; 
    color: #333333; 
    background: #f5f5f5;
  }
  .wrapper { background: #f5f5f5; padding: 20px; }
  .container { 
    max-width: 600px; 
    margin: 0 auto; 
    background: #ffffff; 
    border-radius: 4px; 
    overflow: hidden;
  }
  .header {
    background: #0F172A;
    color: #ffffff;
    padding: 20px 24px;
    border-bottom: 4px solid #FF4F00;
  }
  .header-table {
    width: 100%;
    border-collapse: collapse;
  }
  .header-logo-cell {
    width: 70px;
    padding-right: 16px;
    vertical-align: middle;
  }
  .header-logo-wrap {
    display: inline-block;
    line-height: 0;
  }
  .header-logo {
    display: block;
    width: 56px;
    height: 56px;
    object-fit: contain;
  }
  .header-text-cell {
    vertical-align: middle;
    text-align: left;
  }
  .header h1 {
    font-size: 20px;
    font-weight: 700;
    margin: 0;
    letter-spacing: 0.5px;
    color: #ffffff;
  }
  .header .subtitle {
    margin: 4px 0 0;
    font-size: 12px;
    opacity: 0.85;
    letter-spacing: 0.3px;
    color: #ffffff;
  }
  .content { 
    padding: 30px 20px; 
    line-height: 1.7;
  }
  .content h2 { 
    color: #333; 
    font-size: 18px; 
    margin: 20px 0 15px 0;
    font-weight: bold;
  }
  .content p { 
    margin-bottom: 15px; 
    font-size: 14px;
  }
  .info-box { 
    background: #f9f9f9; 
    border: 1px solid #ddd; 
    border-radius: 4px; 
    padding: 15px; 
    margin: 15px 0;
  }
  .info-box .label { 
    font-size: 11px; 
    color: #666; 
    text-transform: uppercase;
    font-weight: bold;
    margin-bottom: 5px;
  }
  .info-box .value { 
    font-size: 16px; 
    color: #666666; 
    font-weight: bold;
  }
  .info-grid { margin: 15px 0; }
  .info-row { 
    display: flex; 
    justify-content: space-between; 
    padding: 10px 0; 
    border-bottom: 1px solid #eee;
  }
  .info-row:last-child { border-bottom: none; }
  .info-row .label { 
    font-weight: bold; 
    color: #666;
    font-size: 13px;
  }
  .info-row .value { 
    color: #333; 
    font-weight: bold;
    font-size: 13px;
  }
  .amount-large { 
    font-size: 28px; 
    font-weight: bold; 
    color: #666666; 
    margin: 10px 0;
  }
  .button { 
    display: inline-block; 
    padding: 10px 20px; 
    background: white; 
    color: black; 
    text-decoration: none; 
    border-radius: 4px; 
    border: 2px solid black;
    font-weight: bold;
    font-size: 13px;
    margin-top: 15px;
  }
  .alert-danger { 
    background: #ffe0e0; 
    border-left: 4px solid #cc0000; 
    padding: 15px; 
    margin: 15px 0;
  }
  .alert-warning { 
    background: #fff4e6; 
    border-left: 4px solid #ff9900; 
    padding: 15px; 
    margin: 15px 0;
  }
  .alert-success { 
    background: #e6f9e6; 
    border-left: 4px solid #00cc00; 
    padding: 15px; 
    margin: 15px 0;
  }
  .footer { 
    background: #f5f5f5; 
    border-top: 1px solid #ddd;
    padding: 20px; 
    text-align: center; 
    font-size: 12px;
    color: #666;
  }
  .divider { 
    height: 1px; 
    background: #ddd; 
    margin: 15px 0;
  }
`;

const sendPaymentReminderEmail = async (buyerEmail, buyerName, containerNo, amountDue, dueDate) => {
  const subject = `Outstanding Payment Reminder | Container ${containerNo} | LMH Trading`;
  const formattedDate = new Date(dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            ${buildHeader('Payment Reminder')}
            <div class="content">
              <p>Dear <strong>${buyerName}</strong>,</p>
              <p>We hope this message finds you well. Our records indicate that a balance remains outstanding on the transaction detailed below. We kindly request your attention to the following information.</p>

              <div class="info-box">
                <div class="label">Container Reference</div>
                <div class="value">${containerNo}</div>
              </div>

              <div class="info-grid">
                <div class="info-row">
                  <span class="label">Outstanding Balance</span>
                  <span class="value">AED ${amountDue.toLocaleString()}</span>
                </div>
                <div class="info-row">
                  <span class="label">Transaction Date</span>
                  <span class="value">${formattedDate}</span>
                </div>
              </div>

              <p>We would be grateful if you could arrange settlement of this balance at your earliest convenience. Should payment have already been remitted, kindly disregard this notice and accept our sincere appreciation.</p>

              <div class="alert-warning">
                <strong>Kind Note:</strong> If you require alternative payment arrangements or have queries regarding this balance, please reach out to our finance team. We are committed to supporting our clients with flexible solutions where possible.
              </div>

              <p style="margin-top: 24px;">Thank you for your continued partnership with LMH Trading. We look forward to serving you again.</p>
              <p style="margin-top: 18px;">Warm regards,<br><strong>LMH Trading &mdash; Finance &amp; Operations</strong></p>
            </div>
            ${buildFooter()}
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmail(buyerEmail, subject, html);
};

const sendPayoutReminderEmail = async (investorEmail, investorName, containerNo, payoutAmount, dueDate) => {
  const subject = `Scheduled Investor Payout | Container ${containerNo} | LMH Trading`;
  const formattedDate = new Date(dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            ${buildHeader('Payout Notification')}
            <div class="content">
              <p>Dear <strong>${investorName}</strong>,</p>
              <p>We are pleased to inform you that your investor payout has been scheduled. Please find the transaction particulars below for your records.</p>

              <div class="info-box">
                <div class="label">Container Reference</div>
                <div class="value">${containerNo}</div>
              </div>

              <div class="info-grid">
                <div class="info-row">
                  <span class="label">Payout Amount</span>
                  <span class="value" style="color: #10B981;">AED ${payoutAmount.toLocaleString()}</span>
                </div>
                <div class="info-row">
                  <span class="label">Scheduled Transfer Date</span>
                  <span class="value">${formattedDate}</span>
                </div>
              </div>

              <div class="alert-success">
                <strong>Transfer Details:</strong> The funds will be remitted to your registered bank account on the scheduled date. Please allow one to two business working days for the amount to reflect, depending on your financial institution.
              </div>

              <p>Should you notice any discrepancy or require clarification, please do not hesitate to contact our finance team at the address provided below.</p>
              <p style="margin-top: 18px;">Thank you for your continued trust and partnership with LMH Trading.</p>
              <p style="margin-top: 18px;">Warm regards,<br><strong>LMH Trading &mdash; Investor Relations</strong></p>
            </div>
            ${buildFooter()}
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmail(investorEmail, subject, html);
};

const sendSalePaymentOverdueEmail = async (buyerEmail, buyerName, containerNo, amountDue, dueDate, referenceId, paymentMode) => {
  const formattedDue = new Date(dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const daysOverdue = Math.max(0, Math.floor((Date.now() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24)));
  const subject = `Payment Overdue | Container ${containerNo} | LMH Trading`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            ${buildHeader('Payment Overdue Notice')}
            <div class="content">
              <p>Dear <strong>${buyerName}</strong>,</p>

              <div class="alert-danger">
                <strong>Your payment is now overdue.</strong> Our records indicate that the agreed payment for container <strong>${containerNo}</strong> has not been received by the due date of <strong>${formattedDue}</strong>${daysOverdue > 0 ? ` &mdash; <strong>${daysOverdue} day${daysOverdue === 1 ? '' : 's'} past due</strong>` : ''}.
              </div>

              <p>We kindly request that you arrange settlement of the outstanding balance at the earliest to avoid any disruption to our commercial relationship.</p>

              <div class="info-box">
                <div class="label">Transaction Reference</div>
                <div class="value">${containerNo}</div>
              </div>

              <div class="info-grid">
                <div class="info-row">
                  <span class="label">Outstanding Balance</span>
                  <span class="value" style="color:#dc2626;">AED ${amountDue.toLocaleString()}</span>
                </div>
                <div class="info-row">
                  <span class="label">Original Due Date</span>
                  <span class="value">${formattedDue}</span>
                </div>
                ${referenceId ? `
                <div class="info-row">
                  <span class="label">Reference ID</span>
                  <span class="value">${referenceId}</span>
                </div>` : ''}
                ${paymentMode ? `
                <div class="info-row">
                  <span class="label">Payment Mode</span>
                  <span class="value">${paymentMode}</span>
                </div>` : ''}
              </div>

              <div class="alert-warning">
                <strong>Please Act Today:</strong> If settlement has already been remitted, kindly forward the payment confirmation or transaction reference to our finance team so we can update our records. Should you require assistance or a structured settlement plan, we are happy to discuss options.
              </div>

              <p>You may reach us directly at the contact details below:</p>
              <p style="margin: 12px 0;">
                <strong>Email:</strong> ${CONTACT_EMAIL}<br>
                <strong>Business Hours:</strong> Monday &ndash; Friday, 9:00 AM &ndash; 5:00 PM (GST)
              </p>

              <p>We thank you for your prompt attention to this matter and value your continued partnership with LMH Trading.</p>
              <p style="margin-top: 18px;">Sincerely,<br><strong>LMH Trading &mdash; Finance &amp; Operations</strong></p>
            </div>
            ${buildFooter()}
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmail(buyerEmail, subject, html);
};

const sendOverdueNotificationEmail = async (email, name, type, containerNo, amount, dueDate) => {
  const isPayment = type === 'payment';
  const subject = isPayment
    ? `Action Required: Overdue Payment | Container ${containerNo} | LMH Trading`
    : `Delayed Payout Notice | Container ${containerNo} | LMH Trading`;
  const formattedDate = new Date(dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            ${buildHeader(isPayment ? 'Overdue Payment Notice' : 'Delayed Payout Notice')}
            <div class="content">
              <p>Dear <strong>${name}</strong>,</p>

              <div class="alert-danger">
                <strong>Immediate Attention Required:</strong> Our records show that the ${isPayment ? 'payment' : 'payout'} associated with container <strong>${containerNo}</strong> has passed its due date and is currently outstanding.
              </div>

              <div class="info-box">
                <div class="label">Container Reference</div>
                <div class="value">${containerNo}</div>
              </div>

              <div class="info-grid">
                <div class="info-row">
                  <span class="label">Amount</span>
                  <span class="value">AED ${amount.toLocaleString()}</span>
                </div>
                <div class="info-row">
                  <span class="label">Original Due Date</span>
                  <span class="value">${formattedDate}</span>
                </div>
              </div>

              ${isPayment ? `
                <div class="alert-warning">
                  <strong>Action Required:</strong> We kindly request that you arrange settlement of this outstanding amount at the earliest. Prompt action will help avoid any potential late charges and ensure uninterrupted service. Should you require a structured payment plan or have any questions, our finance team is ready to assist.
                </div>
              ` : `
                <div class="alert-warning">
                  <strong>Our Apologies:</strong> We regret the delay in releasing your scheduled payout and sincerely apologise for any inconvenience caused. Our team is actively working to resolve this, and your disbursement has been flagged as a priority. We will share an update as soon as the transfer is initiated.
                </div>
              `}

              <p>If this matter has already been addressed from your side, or if you would like to discuss further, please contact us using the details below:</p>
              <p style="margin: 16px 0;">
                <strong>Email:</strong> ${CONTACT_EMAIL}<br>
                <strong>Business Hours:</strong> Monday &ndash; Friday, 9:00 AM &ndash; 5:00 PM (GST)
              </p>

              <p>We appreciate your prompt attention and value our continued association.</p>
              <p style="margin-top: 18px;">Sincerely,<br><strong>LMH Trading &mdash; Finance &amp; Operations</strong></p>
            </div>
            ${buildFooter()}
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmail(email, subject, html);
};

const sendInvestmentReturnEmail = async (investorEmail, investorName, containerNo, investmentAmount, returnAmount, profit) => {
  const subject = `Investment Closure &amp; Return Statement | Container ${containerNo} | LMH Trading`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            ${buildHeader('Investment Closure Statement')}
            <div class="content">
              <p>Dear <strong>${investorName}</strong>,</p>

              <p>We are pleased to confirm that your investment cycle for container <strong>${containerNo}</strong> has been successfully concluded and the associated return has been released in full. Please find the final statement below for your records.</p>

              <div class="alert-success">
                <strong>Investment Closed Successfully:</strong> All obligations against this investment have been settled.
              </div>

              <h2>Investment Summary</h2>

              <div class="info-grid">
                <div class="info-row">
                  <span class="label">Initial Investment</span>
                  <span class="value">AED ${investmentAmount.toLocaleString()}</span>
                </div>
                <div class="info-row">
                  <span class="label">Total Return</span>
                  <span class="value" style="color: #10B981;">AED ${returnAmount.toLocaleString()}</span>
                </div>
                <div class="info-row">
                  <span class="label">Net Profit</span>
                  <span class="value" style="color: #0F172A; font-weight: 700;">AED ${profit.toLocaleString()}</span>
                </div>
                <div class="info-row">
                  <span class="label">Return on Investment</span>
                  <span class="value">${((profit / investmentAmount) * 100).toFixed(1)}%</span>
                </div>
              </div>

              <p style="margin-top: 24px;">The return has been remitted to your registered bank account. Funds typically reflect within one to two business working days, subject to your financial institution's processing times.</p>

              <p style="margin-top: 18px;">We sincerely appreciate the confidence you have placed in LMH Trading and look forward to welcoming you to future investment opportunities. Our team will be in touch regarding upcoming openings that may align with your portfolio.</p>

              <p style="margin-top: 18px;">Warm regards,<br><strong>LMH Trading &mdash; Investor Relations</strong></p>
            </div>
            ${buildFooter()}
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmail(investorEmail, subject, html);
};

const sendEmployeeOnboardingEmail = async (employeeEmail, employeeName, tempPassword) => {
  const subject = 'Welcome to LMH Trading | Your Account Access Details';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            ${buildHeader('Your account is ready')}
            <div class="content">
              <p>Dear <strong>${employeeName}</strong>,</p>

              <p>On behalf of the entire team, we are delighted to welcome you to LMH Trading. Your account has been created and access to our Container Management System has been enabled. Please find your login credentials below.</p>

              <h2>Account Credentials</h2>

              <div class="info-box">
                <div class="label">Email Address</div>
                <div style="font-size: 16px; color: #333333; font-weight: 500; font-family: 'Monaco', 'Courier New', monospace;">
                  ${employeeEmail}
                </div>
              </div>

              <div class="info-box">
                <div class="label">Temporary Password</div>
                <div style="font-size: 16px; color: #0F172A; font-weight: 700; font-family: 'Monaco', 'Courier New', monospace; letter-spacing: 1px;">
                  ${tempPassword}
                </div>
              </div>

              <div class="alert-warning">
                <strong>Security Advisory:</strong> For the protection of your account, please change the temporary password upon your first login. We recommend selecting a strong, unique passphrase that you have not used on any other service.
              </div>

              <h2>First-Time Setup</h2>
              <ol style="margin: 16px 0; padding-left: 20px;">
                <li style="margin-bottom: 10px;">Access the platform using the link provided below.</li>
                <li style="margin-bottom: 10px;">Sign in with your email address and the temporary password above.</li>
                <li style="margin-bottom: 10px;">Set a new password when prompted.</li>
                <li style="margin-bottom: 10px;">Review your profile and confirm your details are accurate.</li>
                <li style="margin-bottom: 10px;">Familiarise yourself with the system by reviewing the user documentation.</li>
              </ol>

              <p style="text-align: center; margin-top: 24px;">
                <a href="${APP_URL}" class="button">Access the Platform</a>
              </p>

              <div class="divider"></div>

              <h2>Need Assistance?</h2>
              <p>Our IT support team is happy to help with any access issues or questions you may have during onboarding. You can reach us using the details below:</p>
              <p>
                <strong>Email:</strong> ${CONTACT_EMAIL}<br>
                <strong>Response Time:</strong> Within one business working day
              </p>

              <p style="margin-top: 24px;">We look forward to working with you and wish you every success in your new role.</p>
              <p style="margin-top: 18px;">Warm regards,<br><strong>LMH Trading &mdash; People &amp; Operations</strong></p>
            </div>
            ${buildFooter()}
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmail(employeeEmail, subject, html);
};

const sendAdminUpdateEmail = async (employeeEmail, employeeName, title, message) => {
  const subject = `Company Update: ${title} | LMH Trading`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            ${buildHeader('Company Announcement')}
            <div class="content">
              <p>Dear <strong>${employeeName || 'Team Member'}</strong>,</p>

              <p>We would like to share an important update from the LMH Trading management team. Please take a moment to review the details below.</p>

              <h2>${title}</h2>

              <div class="info-box">
                <p style="margin: 0; white-space: pre-wrap; color: #334155; line-height: 1.7;">${message}</p>
              </div>

              <div class="divider"></div>

              <p>For further context or any related actions, please sign in to the platform using the link below.</p>

              <p style="text-align: center; margin-top: 24px;">
                <a href="${APP_URL}" class="button">Open the Platform</a>
              </p>

              <p style="margin-top: 24px;">If you have any questions regarding this announcement, please reach out to your reporting manager or contact our support team at the address below.</p>

              <p style="margin-top: 18px;">Thank you for your continued dedication and commitment.</p>
              <p style="margin-top: 18px;">Warm regards,<br><strong>LMH Trading &mdash; Management Team</strong></p>
            </div>
            ${buildFooter()}
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmail(employeeEmail, subject, html);
};

module.exports = {
  sendEmail,
  sendPaymentReminderEmail,
  sendSalePaymentOverdueEmail,
  sendPayoutReminderEmail,
  sendOverdueNotificationEmail,
  sendInvestmentReturnEmail,
  sendEmployeeOnboardingEmail,
  sendAdminUpdateEmail,
  verifyTransport,
  getSmtpStatus,
  isSmtpConfigured
};
