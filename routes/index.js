// routes/index.js
import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

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
    const { name, email, message } = req.body;
    
    const mailOptions = {
      from: `${name} <${email}>`,
      to: process.env.GMAIL_USER,
      subject: `New Contact Message from ${name}`,
      text: `From: ${email}\n\n${message}`
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
  const { name, email, phone, device, issue } = req.body;

  // Compose the email content for the engineer
  const engineerMailOptions = {
    from: `"Repair Booking" <${process.env.EMAIL_USER}>`,
    to: process.env.ENGINEER_EMAIL,
    subject: `New Repair Booking from ${name}`,
    text: `
A new booking request has been submitted.

Name: ${name}
Email: ${email}
Phone: ${phone}
Device: ${device}

Issue Description:
${issue}
    `,
  };

  // Compose the email content for the user
  const userMailOptions = {
    from: `"ID Repair Booking Confirmation" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Your Repair Booking Confirmation`,
    text: `
Dear ${name},

Thank you for booking a repair with ID Repair. We have received your request and an engineer will be assigned to your case shortly.

Booking Details:
Device: ${device}
Issue: ${issue}

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
