import nodemailer from 'nodemailer';

// Create a transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendWelcomeEmail = async (email, name, profileUrl) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to LooksNLove!',
      html: `
        <h1>Welcome to LooksNLove, ${name}!</h1>
        <p>Thank you for joining our beauty and wellness community.</p>
        <p>Your account has been successfully created.</p>
        <p>You can now book appointments and explore our services.</p>
        <p>Visit your profile: <a href="${profileUrl}">${profileUrl}</a></p>
        <p>Best regards,<br>The LooksNLove Team</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully');
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

export const sendPasswordEmail = async (email, password, phone) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your LooksNLove Account Details',
      html: `
        <h1>Your LooksNLove Account Details</h1>
        <p>Here are your account details:</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p>Please keep these details safe and secure.</p>
        <p>Best regards,<br>The LooksNLove Team</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Password email sent successfully');
  } catch (error) {
    console.error('Error sending password email:', error);
    throw error;
  }
}; 