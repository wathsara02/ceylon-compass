const nodemailer = require('nodemailer');

let transporter = null;

const initializeTransporter = () => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Error: EMAIL_USER and EMAIL_PASS environment variables must be set for email functionality');
      return null;
    }

    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    transporter.verify((error) => {
      if (error) {
        console.error('Error verifying email transporter:', error);
      } else {
        console.log('Email server is ready to send messages');
      }
    });

    return transporter;
  } catch (error) {
    console.error('Failed to initialize email transporter:', error);
    return null;
  }
};

const getTransporter = () => {
  if (!transporter) {
    return initializeTransporter();
  }
  return transporter;
};

const sendEmail = async (options) => {
  try {
    const emailTransporter = getTransporter();
    
    if (!emailTransporter) {
      throw new Error('Email transporter not initialized');
    }

    if (!options.to || !options.subject || (!options.text && !options.html)) {
      throw new Error('Missing required email options (to, subject, text/html)');
    }
    
    if (!options.from) {
      options.from = process.env.EMAIL_USER;
    }
    
    const info = await emailTransporter.sendMail(options);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = {
  initializeTransporter,
  getTransporter,
  sendEmail
}; 