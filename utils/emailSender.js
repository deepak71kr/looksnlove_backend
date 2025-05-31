import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['GMAIL_USER', 'GMAIL_PASSWORD'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD
  }
});

// Verify transporter configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error('Email transporter verification failed:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

export const sendPasswordEmail = async (email, password, phone) => {
  if (!email || !password || !phone) {
    throw new Error('Email, password, and phone are required');
  }

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Your LooksNLove Account Details',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff1493;">Your Account Details</h2>
        <p>Here are your account details for LooksNLove:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> ${password}</p>
          <p><strong>Phone Number:</strong> ${phone}</p>
        </div>
        <p>Please keep these details safe and do not share them with anyone.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Account details email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending account details email:', error);
    throw new Error('Failed to send account details email');
  }
};
