const express = require('express');
const router = express.Router();
const ContactQuery = require('../models/ContactQuery');
const User = require('../models/User');
const { sendNotificationEmail } = require('../utils/emailService');
const { protect } = require('../middleware/auth');

// @route   POST /api/contact
// @desc    Submit contact form and save to database
// @access  Public (but detects if user is logged in)
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, message } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Check if the email belongs to a registered user
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    // Determine if request is from authenticated user (optional auth check)
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (error) {
        // Token invalid or expired, continue as guest
      }
    }

    // Save query to database
    const contactQuery = await ContactQuery.create({
      firstName,
      lastName,
      email,
      message,
      status: 'Open',
      priority: 'Medium',
      user: userId || (existingUser ? existingUser._id : null),
      isRegisteredUser: !!existingUser || !!userId
    });

    console.log('✅ Contact query saved to database:', contactQuery._id, 
                '| Registered User:', contactQuery.isRegisteredUser);

    // Send notification email to admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@dishayencoaching.com';
    const emailContent = `
      <h2>New Contact Form Submission</h2>
      <p><strong>From:</strong> ${firstName} ${lastName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `;

    try {
      await sendNotificationEmail(
        { email: adminEmail, name: 'Admin' }, // Pass as user object with email property
        'New Contact Form Submission',
        emailContent
      );
    } catch (emailError) {
      console.error('Error sending contact notification email:', emailError);
      // Don't fail the request if email fails
    }

    // Send confirmation email to user
    const confirmationContent = `
      <h2>Thank you for contacting us!</h2>
      <p>Hi ${firstName},</p>
      <p>We have received your message and will get back to you within 24-48 hours during business days.</p>
      <p><strong>Your message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
      <br>
      <p>Best regards,<br>Dishayen Coaching Team</p>
    `;

    try {
      await sendNotificationEmail(
        { email: email, name: firstName }, // Pass as user object
        'We received your message - Dishayen Coaching',
        confirmationContent
      );
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
    }

    res.json({
      success: true,
      message: 'Message sent successfully! We\'ll get back to you soon.'
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

