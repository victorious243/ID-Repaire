// routes/index.js
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const recentSubmissions = new Map();

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_SUBMISSIONS_PER_WINDOW = 3;
const MAX_FIELD_LENGTHS = {
  name: 80,
  email: 120,
  phone: 30,
  device: 120,
  issue: 1000,
  message: 1500,
};
const URL_PATTERN = /(?:https?:\/\/|www\.|[a-z0-9-]+\.(?:com|net|org|io|co|do|in|ru|xyz|top|info|biz|click|link|site|online)\b)/i;
const SPAM_TERMS = /\b(?:btc|bitcoin|crypto|withdraw|profit|urgent message|obtain profit|reference id|version id)\b/i;
const RANDOM_TOKEN_PATTERN = /\b(?=[a-z0-9|]{24,}\b)(?=.*[a-z])(?=.*\d)[a-z0-9|]+\b/i;

function clean(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function getClientIp(req) {
  return req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
}

function isRateLimited(key) {
  const now = Date.now();
  for (const [storedKey, timestamps] of recentSubmissions) {
    if (!timestamps.some((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS)) {
      recentSubmissions.delete(storedKey);
    }
  }

  const current = recentSubmissions.get(key) || [];
  const fresh = current.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);

  if (fresh.length >= MAX_SUBMISSIONS_PER_WINDOW) {
    recentSubmissions.set(key, fresh);
    return true;
  }

  fresh.push(now);
  recentSubmissions.set(key, fresh);
  return false;
}

function hasInvalidLength(fields) {
  return Object.entries(fields).some(([field, value]) => {
    const max = MAX_FIELD_LENGTHS[field];
    return max && clean(value).length > max;
  });
}

function hasSpamContent(fields) {
  const combined = Object.values(fields).map(clean).join(' ');
  return URL_PATTERN.test(combined) || SPAM_TERMS.test(combined) || RANDOM_TOKEN_PATTERN.test(combined);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(email));
}

function isLikelyHumanSubmission(req, fields) {
  return !clean(req.body.website) && !hasInvalidLength(fields) && !hasSpamContent(fields);
}

// Home page
router.get('/', function(req, res, next) {
  res.render('index');
});

// // Shop page
// router.get('/shop', function(req, res, next) {
// const products = [
//   { id: 1, name: "Phone Case (Type A)", description: "Durable protective case for smartphones", price: 19.99, image: "/images/Item_01.jpg" },
//   { id: 2, name: "Phone Case (Type B)", description: "Slim and stylish phone protection", price: 24.99, image: "/images/item_02.jpg" },
//   { id: 3, name: "Power Bank", description: "Portable charger for on-the-go power", price: 39.99, image: "/images/Item_03.jpg" },
//   { id: 4, name: "Phone Case (Type C)", description: "Rugged case for maximum phone protection", price: 29.99, image: "/images/item_04.jpg" },
//   { id: 5, name: "Wireless Charger", description: "Fast and convenient wireless charging pad", price: 34.99, image: "/images/item_05.jpg" },
//   { id: 6, name: "Power Bank with Cable", description: "High-capacity portable charger with built-in cable", price: 49.99, image: "/images/item_06.jpg" },
//   { id: 7, name: "Smart Phone", description: "Latest model smartphone with advanced features", price: 699.99, image: "/images/item_07.jpg" },
//   { id: 8, name: "iPhone 16", description: "Next-generation iPhone with cutting-edge technology", price: 999.99, image: "/images/item_08.jpg" },
// ];

//   res.render('shop', { title: "IDLL PHONE REPAIR", products });
// });

// Handle email submissions
router.post('/send-email', async (req, res) => {
  try {
    const fields = {
      name: clean(req.body.name),
      email: clean(req.body.email),
      message: clean(req.body.message),
    };

    if (!fields.name || !isValidEmail(fields.email) || !fields.message || !isLikelyHumanSubmission(req, fields) || isRateLimited(`contact:${getClientIp(req)}`)) {
      return res.redirect('/shop?emailSent=false');
    }
    
    const mailOptions = {
      from: `"Website Contact" <${process.env.GMAIL_USER}>`,
      replyTo: `${fields.name} <${fields.email}>`,
      to: process.env.GMAIL_USER,
      subject: `New Contact Message from ${fields.name}`,
      text: `From: ${fields.email}\n\n${fields.message}`
    };

    await req.app.locals.transporter.sendMail(mailOptions);
    res.redirect('/shop?emailSent=true');
  } catch (error) {
    console.error('Error sending email:', error);
    res.redirect('/shop?emailSent=false');
  }
});



// Handle booking submissions
router.post('/book', async (req, res) => {
  const fields = {
    name: clean(req.body.name),
    email: clean(req.body.email),
    phone: clean(req.body.phone),
    device: clean(req.body.device),
    issue: clean(req.body.issue),
  };

  if (!fields.name || !isValidEmail(fields.email) || !fields.phone || !fields.device || !fields.issue || !isLikelyHumanSubmission(req, fields) || isRateLimited(`booking:${getClientIp(req)}`)) {
    console.warn('Blocked suspicious booking submission.');
    return res.redirect('/?bookingSuccess=false');
  }

  // Compose the email content for the engineer
  const engineerMailOptions = {
    from: `"Repair Booking" <${process.env.GMAIL_USER}>`,
    replyTo: `${fields.name} <${fields.email}>`,
    to: process.env.ENGINEER_EMAIL,
    subject: `New Repair Booking from ${fields.name}`,
    text: `
A new booking request has been submitted.

Name: ${fields.name}
Email: ${fields.email}
Phone: ${fields.phone}
Device: ${fields.device}

Issue Description:
${fields.issue}
    `,
  };

  // Compose the email content for the user
  const userMailOptions = {
    from: `"ID Repair Booking Confirmation" <${process.env.GMAIL_USER}>`,
    to: fields.email,
    subject: `Your Repair Booking Confirmation`,
    text: `
Dear ${fields.name},

Thank you for booking a repair with ID Repair. We have received your request and an engineer will be assigned to your case shortly.

Booking Details:
Device: ${fields.device}
Issue: ${fields.issue}

We will contact you soon with further information about your repair.

Best regards,
ID Repair Team
    `,
  };

  try {
    // Send email to engineer
    await req.app.locals.transporter.sendMail(engineerMailOptions);
    console.log('Booking email sent to engineer.');

    // Send confirmation email to user
    await req.app.locals.transporter.sendMail(userMailOptions);
    console.log('Confirmation email sent to user.');

    res.redirect('/?bookingSuccess=true');
  } catch (error) {
    console.error('Error sending booking emails:', error);
    res.redirect('/?bookingSuccess=false');
  }
});
export default router;
