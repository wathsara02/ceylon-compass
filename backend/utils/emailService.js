const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendEventAcceptedEmail = async (userEmail, eventTitle) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Your Event Request Has Been Accepted!',
      html: `
        <h1>Congratulations!</h1>
        <p>Your event request "${eventTitle}" has been accepted.</p>
        <p>Your event is now live on our platform and visible to all users.</p>
        <p>Thank you for contributing to our community!</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Event acceptance email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw the error as email sending is not critical
  }
};

module.exports = {
  sendEventAcceptedEmail
}; 