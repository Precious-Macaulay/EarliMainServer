const nodemailer = require('nodemailer');
const { google } = require('googleapis');
require('dotenv').config();

const AuthPass = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URL
);

AuthPass.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

const RegisterVerification = async (email, otp) => {
  try {
    const createAcessToken = await AuthPass.getAccessToken();

    const mailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refresh_token: process.env.REFRESH_TOKEN,
        accessToken: createAcessToken.token,
      },
    });

    let details = {
      from: process.env.USER,
      to: email,
      subject: 'Verify your Email Account with Earli Finance',
      html: `This is your OTP:${otp}. Copy it and paste in your inputs `,
    };
    mailTransporter.sendMail(details, (err, info) => {
      if (err) {
        console.log('It has an error', err);
      } else {
        console.log('Email has been sent successfully', info.response);
      }
    });
  } catch (error) {
    return error;
  }
};

module.exports = RegisterVerification;
