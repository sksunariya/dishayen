const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send verification email
exports.sendVerificationEmail = async (user, token) => {
  const transporter = createTransporter();
  
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: '🚀 Verify Your Email - Education Platform',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background-color: #1a1a1a; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 Welcome to Education Platform!</h1>
            </div>
            <div class="content">
              <p>Hi ${user.name},</p>
              <p>Thank you for signing up! Please verify your email address to get started.</p>
              <center>
                <a href="${verificationUrl}" class="button">Verify Email</a>
              </center>
              <p>Or copy and paste this link in your browser:</p>
              <p style="color: #667eea; word-break: break-all;">${verificationUrl}</p>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't create an account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Education Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent to:', user.email);
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

// Send welcome email after verification
exports.sendWelcomeEmail = async (user) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: '✨ Welcome to Education Platform!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background-color: #1a1a1a; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✨ Your Account is Verified!</h1>
            </div>
            <div class="content">
              <p>Hi ${user.name},</p>
              <p>Your email has been successfully verified. You now have full access to our platform!</p>
              <p>Start exploring our courses and begin your learning journey today.</p>
              <center>
                <a href="${process.env.FRONTEND_URL}/courses" class="button">Browse Courses</a>
              </center>
              <p>Happy Learning! 🎓</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Education Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

// Send course purchase confirmation email
exports.sendPurchaseConfirmation = async (user, course, payment) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: `🎉 Course Purchase Confirmed - ${course.title}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background-color: #1a1a1a; padding: 30px; border-radius: 0 0 10px 10px; }
            .course-info { background-color: #2a2a2a; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Purchase Successful!</h1>
            </div>
            <div class="content">
              <p>Hi ${user.name},</p>
              <p>Thank you for your purchase! You now have lifetime access to:</p>
              <div class="course-info">
                <h2>${course.title}</h2>
                <p><strong>Amount Paid:</strong> ₹${payment.amount.toLocaleString()}</p>
                <p><strong>Payment ID:</strong> ${payment.paymentId}</p>
                <p><strong>Purchase Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              <center>
                <a href="${process.env.FRONTEND_URL}/my-courses" class="button">Access Your Course</a>
              </center>
              <p>Start learning now and achieve your goals! 🚀</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Education Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending purchase confirmation email:', error);
  }
};

// Send notification email
exports.sendNotificationEmail = async (user, subject, message) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: subject,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background-color: #1a1a1a; padding: 30px; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📢 Notification</h1>
            </div>
            <div class="content">
              <p>Hi ${user.name},</p>
              ${message}
            </div>
            <div class="footer">
              <p>&copy; 2025 Education Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending notification email:', error);
  }
};

// Send password reset email
exports.sendPasswordResetEmail = async (user, resetToken) => {
  const transporter = createTransporter();
  
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: '🔒 Password Reset Request - Dishayen Coaching Center',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background-color: #1a1a1a; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background-color: #2a2a2a; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi ${user.name},</p>
              <p>We received a request to reset your password for your Dishayen Coaching Center account.</p>
              <p>Click the button below to reset your password:</p>
              <center>
                <a href="${resetUrl}" class="button">Reset Password</a>
              </center>
              <p>Or copy and paste this link in your browser:</p>
              <p style="color: #667eea; word-break: break-all;">${resetUrl}</p>
              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                  <li>This link will expire in 10 minutes</li>
                  <li>If you didn't request this, please ignore this email</li>
                  <li>Your password will remain unchanged until you create a new one</li>
                </ul>
              </div>
              <p>For security reasons, we cannot tell you what your current password is. You'll need to create a new one.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Dishayen Coaching Center. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent to:', user.email);
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

