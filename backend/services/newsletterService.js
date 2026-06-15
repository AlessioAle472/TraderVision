const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const SUBSCRIBERS_PATH = path.join(__dirname, '../data/subscribers.json');

/**
 * Get the list of current subscribers
 */
function getSubscribers() {
  try {
    const data = fs.readFileSync(SUBSCRIBERS_PATH, 'utf8');
    return JSON.parse(data).subscribers || [];
  } catch (error) {
    console.error('Error reading subscribers.json:', error);
    return [];
  }
}

/**
 * Add a new subscriber email to the list
 * @param {string} email 
 */
function addSubscriber(email) {
  const subscribers = getSubscribers();
  if (subscribers.includes(email)) {
    return { success: true, message: 'Already subscribed' };
  }
  
  subscribers.push(email);
  try {
    fs.writeFileSync(SUBSCRIBERS_PATH, JSON.stringify({ subscribers }, null, 2));
    return { success: true, message: 'Subscription confirmed' };
  } catch (error) {
    console.error('Error writing to subscribers.json:', error);
    return { success: false, message: 'Failed to save subscription' };
  }
}

/**
 * Send the briefing email to all subscribers
 * @param {object} briefing - { title, bullets, timestamp }
 */
async function sendBriefingEmail(briefing) {
  const subscribers = getSubscribers();
  if (subscribers.length === 0) {
    console.log('[Newsletter] No subscribers to notify.');
    return;
  }

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS; // Or EMAIL_API_KEY as requested

  const isMock = !emailUser || !emailPass;

  const htmlContent = `
    <div style="background-color: #0f172a; color: #f8fafc; padding: 40px; font-family: sans-serif; border-radius: 12px; max-width: 600px; margin: auto;">
      <h3 style="color: #6366f1; text-transform: uppercase; font-size: 12px; letter-spacing: 2px;">AI Market Briefing</h3>
      <p style="color: #94a3b8; font-size: 10px;">Aggiornamento delle ${briefing.timestamp}</p>
      
      <h1 style="font-size: 24px; font-style: italic; margin-bottom: 24px;">"${briefing.title}"</h1>
      
      <div style="border-left: 2px solid #6366f1; padding-left: 20px; margin-bottom: 30px;">
        ${briefing.bullets.map(b => `<p style="color: #cbd5e1; font-size: 14px; margin-bottom: 15px;">• ${b}</p>`).join('')}
      </div>
      
      <hr style="border: 0; border-top: 1px solid #334155; margin-bottom: 20px;">
      <p style="text-align: center; color: #475569; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">
        Trader Vision Advanced Macro Analytics Hub • 2026
      </p>
    </div>
  `;

  if (isMock) {
    console.log('\n--- [MOCK EMAIL DISPATCH] ---');
    subscribers.forEach(email => {
      console.log(`[MOCK EMAIL] Inviato briefing a: ${email}`);
    });
    console.log('------------------------------\n');
    return;
  }

  // Real Email Dispatch using Nodemailer (Resend SMTP)
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  for (const email of subscribers) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'Trader Vision AI <newsletter@example.com>',
        to: email,
        subject: `Daily Briefing: ${briefing.title.substring(0, 50)}...`,
        html: htmlContent
      });
      console.log(`[Newsletter] Email sent to: ${email}`);
    } catch (err) {
      console.error(`[Newsletter] Failed to send email to ${email}:`, err.message);
    }
  }
}

module.exports = {
  addSubscriber,
  getSubscribers,
  sendBriefingEmail
};
