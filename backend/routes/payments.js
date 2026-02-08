const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Razorpay = require('razorpay');
const Course = require('../models/Course');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { protect, verified } = require('../middleware/auth');
const { sendPurchaseConfirmation } = require('../utils/emailService');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @route   POST /api/payments/create-stripe-session
// @desc    Create Stripe checkout session
// @access  Private
router.post('/create-stripe-session', protect, verified, async (req, res) => {
  try {
    const { courseId } = req.body;

    // Validate course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user already purchased
    if (req.user.hasPurchasedCourse(courseId)) {
      return res.status(400).json({ message: 'You have already purchased this course' });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: course.title,
              description: course.shortDescription,
              images: [course.image],
            },
            unit_amount: Math.round(course.price * 100), // Convert to paise
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/courses/${courseId}`,
      client_reference_id: courseId,
      customer_email: req.user.email,
      metadata: {
        userId: req.user.id,
        courseId: courseId,
      },
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Stripe session creation error:', error);
    res.status(500).json({ message: 'Payment session creation failed', error: error.message });
  }
});

// @route   GET /api/payments/verify-stripe-session/:sessionId
// @desc    Verify Stripe payment and grant access
// @access  Private
router.get('/verify-stripe-session/:sessionId', protect, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    const courseId = session.metadata.courseId;
    const userId = session.metadata.userId;

    // Double check if user already has access
    if (req.user.hasPurchasedCourse(courseId)) {
      return res.json({
        success: true,
        message: 'Course already purchased',
        alreadyPurchased: true
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Create payment record
    const payment = await Payment.create({
      user: userId,
      course: courseId,
      amount: session.amount_total / 100, // Convert from cents
      currency: session.currency.toUpperCase(),
      paymentMethod: 'stripe',
      paymentId: session.payment_intent,
      status: 'completed',
      metadata: {
        sessionId: session.id,
        customerEmail: session.customer_email
      }
    });

    // Add course to user's purchased courses
    const user = await User.findById(userId);
    user.purchasedCourses.push({
      course: courseId,
      purchaseDate: new Date(),
      amount: payment.amount,
      paymentId: payment.paymentId
    });

    // Add notification
    user.notifications.push({
      type: 'course_purchase',
      message: `You have successfully purchased "${course.title}"`,
      read: false
    });

    await user.save();

    // Increment enrolled students count
    course.enrolledStudents += 1;
    await course.save();

    // Send purchase confirmation email
    try {
      await sendPurchaseConfirmation(user, course, payment);
    } catch (emailError) {
      console.error('Purchase confirmation email failed:', emailError);
    }

    res.json({
      success: true,
      message: 'Payment verified and course access granted',
      payment,
      course: {
        id: course._id,
        title: course.title,
        image: course.image
      }
    });
  } catch (error) {
    console.error('Stripe verification error:', error);
    res.status(500).json({ message: 'Payment verification failed', error: error.message });
  }
});

// @route   POST /api/payments/create-razorpay-order
// @desc    Create Razorpay order
// @access  Private
router.post('/create-razorpay-order', protect, verified, async (req, res) => {
  try {
    const { courseId } = req.body;

    // Validate course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user already purchased
    if (req.user.hasPurchasedCourse(courseId)) {
      return res.status(400).json({ message: 'You have already purchased this course' });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(course.price * 100), // Amount in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: req.user.id,
        courseId: courseId,
        courseName: course.title
      }
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ message: 'Payment order creation failed', error: error.message });
  }
});

// @route   POST /api/payments/verify-razorpay-payment
// @desc    Verify Razorpay payment
// @access  Private
router.post('/verify-razorpay-payment', protect, async (req, res) => {
  try {
    const { orderId, paymentId, signature, courseId } = req.body;

    // Verify signature
    const crypto = require('crypto');
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (generatedSignature !== signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Check if user already has access
    if (req.user.hasPurchasedCourse(courseId)) {
      return res.json({
        success: true,
        message: 'Course already purchased',
        alreadyPurchased: true
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Create payment record
    const payment = await Payment.create({
      user: req.user.id,
      course: courseId,
      amount: course.price,
      currency: 'INR',
      paymentMethod: 'razorpay',
      paymentId: paymentId,
      status: 'completed',
      metadata: {
        orderId: orderId,
        signature: signature
      }
    });

    // Add course to user's purchased courses
    req.user.purchasedCourses.push({
      course: courseId,
      purchaseDate: new Date(),
      amount: payment.amount,
      paymentId: payment.paymentId
    });

    // Add notification
    req.user.notifications.push({
      type: 'course_purchase',
      message: `You have successfully purchased "${course.title}"`,
      read: false
    });

    await req.user.save();

    // Increment enrolled students count
    course.enrolledStudents += 1;
    await course.save();

    // Send purchase confirmation email
    try {
      await sendPurchaseConfirmation(req.user, course, payment);
    } catch (emailError) {
      console.error('Purchase confirmation email failed:', emailError);
    }

    res.json({
      success: true,
      message: 'Payment verified and course access granted',
      payment,
      course: {
        id: course._id,
        title: course.title,
        image: course.image
      }
    });
  } catch (error) {
    console.error('Razorpay verification error:', error);
    res.status(500).json({ message: 'Payment verification failed', error: error.message });
  }
});

// @route   GET /api/payments/my-payments
// @desc    Get user's payment history
// @access  Private
router.get('/my-payments', protect, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

